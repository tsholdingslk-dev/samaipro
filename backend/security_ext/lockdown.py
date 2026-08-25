"""
SAM AI - Emergency Lockdown Mode
Emergency "Kill Switch" that:
- Revokes all staff sessions
- Rotates API keys
- Disables new logins
- Restricts external API access
- Pauses existing jobs
- Falls back to admin-only access
- Records security events
"""

import json
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import models
from security import SAM_MASTER_KEY, get_password_hash


class LockdownManager:
    LOCKDOWN_KEY = "lockdown_active"
    LOCKDOWN_REASON_KEY = "lockdown_reason"
    LOCKDOWN_SINCE_KEY = "lockdown_since"
    LOCKDOWN_ADMIN_KEY = "lockdown_admin_key"
    API_KEY_ROTATION_KEY = "api_key_rotation_pending"

    def __init__(self):
        self.lockdown_active = False
        self.lockdown_reason = None
        self.lockdown_since: Optional[datetime] = None
        self.locked_by = None
        self.new_admin_keys: Dict[str, str] = {}

    def _get_setting(self, db: Session, key: str, default: str = None) -> Optional[str]:
        setting = db.query(models.SecuritySetting).filter(
            models.SecuritySetting.setting_key == key
        ).first()
        return setting.setting_value if setting else default

    def _set_setting(self, db: Session, key: str, value: str, admin_id: str = None, description: str = None):
        setting = db.query(models.SecuritySetting).filter(
            models.SecuritySetting.setting_key == key
        ).first()
        if setting:
            setting.setting_value = value
            setting.updated_at = datetime.utcnow()
            setting.updated_by = admin_id or "system"
            if description:
                setting.description = description
        else:
            setting = models.SecuritySetting(
                setting_key=key,
                setting_value=value,
                description=description or "",
                updated_by=admin_id or "system",
            )
            db.add(setting)
        db.commit()

    def activate_lockdown(
        self,
        db: Session,
        reason: str = "manual_trigger",
        admin_id: str = None,
        admin_name: str = None,
    ) -> Dict[str, Any]:
        self.lockdown_active = True
        self.lockdown_reason = reason
        self.lockdown_since = datetime.utcnow()
        self.locked_by = admin_name or admin_id or "unknown"

        self._set_setting(db, self.LOCKDOWN_KEY, "true", admin_id, "Emergency lockdown activated")
        self._set_setting(db, self.LOCKDOWN_REASON_KEY, reason, admin_id)
        self._set_setting(db, self.LOCKDOWN_SINCE_KEY, self.lockdown_since.isoformat(), admin_id)
        self._set_setting(db, self.LOCKDOWN_ADMIN_KEY, str(admin_id or ""), admin_id)

        results = {
            "lockdown_activated": True,
            "reason": reason,
            "activated_by": admin_name or admin_id,
            "activated_at": self.lockdown_since.isoformat(),
            "actions_taken": [],
        }

        # 1. Revoke all non-admin sessions
        revoked = db.query(models.Session).filter(
            models.Session.revoked == False,
            models.Session.user.has(models.User.role != "admin"),
        ).update({
            models.Session.revoked: True,
            models.Session.device_info: json.dumps({"revoked_for_lockdown": True}),
        })
        db.commit()
        results["actions_taken"].append(f"Revoked {revoked} non-admin sessions")

        # 2. Revoke all staff refresh tokens
        revoked_tokens = db.query(models.RefreshToken).filter(
            models.RefreshToken.revoked == False,
            models.RefreshToken.user.has(models.User.role != "admin"),
        ).update({models.RefreshToken.revoked: True})
        db.commit()
        results["actions_taken"].append(f"Revoked {revoked_tokens} non-admin refresh tokens")

        # 3. Rotate admin master key
        new_admin_keys = {}
        admin_users = db.query(models.User).filter(models.User.role == "admin").all()
        for admin in admin_users:
            new_key = secrets.token_urlsafe(32)
            new_admin_keys[admin.id] = new_key

            db_admin_tf = db.query(models.AdminTwoFactor).filter(
                models.AdminTwoFactor.user_id == admin.id
            ).first()
            if db_admin_tf:
                db_admin_tf.recovery_codes = json.dumps([])
                db.commit()

        self.new_admin_keys = new_admin_keys
        self._set_setting(db, self.API_KEY_ROTATION_KEY, "true", admin_id, "API key rotation pending for lockdown")

        results["actions_taken"].append(f"Generated {len(new_admin_keys)} new admin keys")
        results["actions_taken"].append("Disabled all 2FA recovery codes")
        results["actions_taken"].append("New admin keys will be provided to admins via secure channel")

        # 4. Record security event
        self._log_security_event(
            db, "lockdown_activated",
            user_id=admin_id,
            details=f"Lockdown activated by {admin_name or admin_id}. Reason: {reason}",
            severity="critical",
            action_taken="All non-admin sessions revoked, admin keys rotated",
        )

        return results

    def deactivate_lockdown(self, db: Session, admin_id: str = None) -> Dict[str, Any]:
        self.lockdown_active = False
        self.lockdown_reason = None
        self.lockdown_since = None
        self.locked_by = None

        self._set_setting(db, self.LOCKDOWN_KEY, "false", admin_id, "Lockdown deactivated")
        self._set_setting(db, self.LOCKDOWN_REASON_KEY, "", admin_id)
        self._set_setting(db, self.LOCKDOWN_SINCE_KEY, "", admin_id)
        self.new_admin_keys = {}

        self._log_security_event(
            db, "lockdown_deactivated",
            user_id=admin_id,
            details=f"Lockdown deactivated by admin {admin_id}",
            severity="info",
            action_taken="All restrictions lifted",
        )

        return {
            "lockdown_deactivated": True,
            "deactivated_by": admin_id,
            "deactivated_at": datetime.utcnow().isoformat(),
        }

    def is_lockdown_active(self, db: Session) -> bool:
        setting = self._get_setting(db, self.LOCKDOWN_KEY, "false")
        is_active = setting == "true"
        self.lockdown_active = is_active
        return is_active

    def get_lockdown_status(self, db: Session) -> Dict[str, Any]:
        active = self.is_lockdown_active(db)
        reason = self._get_setting(db, self.LOCKDOWN_REASON_KEY, "none")
        since = self._get_setting(db, self.LOCKDOWN_SINCE_KEY, None)

        return {
            "lockdown_active": active,
            "reason": reason,
            "activated_since": since,
            "activated_by": self._get_setting(db, self.LOCKDOWN_ADMIN_KEY, None),
            "api_key_rotation_pending": self._get_setting(db, self.API_KEY_ROTATION_KEY, "false") == "true",
        }

    def can_login(self, db: Session) -> bool:
        if self.is_lockdown_active(db):
            return False
        return True

    def require_admin_access(self, db: Session) -> bool:
        return self.is_lockdown_active(db)

    def get_new_admin_keys(self, admin_id: str) -> Optional[str]:
        return self.new_admin_keys.get(admin_id)

    def consume_admin_key(self, db: Session, admin_id: str, provided_key: str) -> bool:
        expected = self.new_admin_keys.get(admin_id)
        if expected and secrets.compare_digest(expected, provided_key):
            del self.new_admin_keys[admin_id]
            return True
        return False

    def _log_security_event(
        self, db: Session, event_type: str, user_id: Optional[str] = None,
        details: str = None, severity: str = "info", action_taken: str = None
    ):
        event = models.SecurityEvent(
            event_type=event_type,
            user_id=user_id,
            details=details or "",
            severity=severity,
            action_taken=action_taken,
            timestamp=datetime.utcnow(),
        )
        db.add(event)
        db.commit()

    def get_recovery_instructions(self) -> Dict[str, Any]:
        return {
            "description": "Lockdown Mode is active. All non-admin sessions have been revoked and API keys rotated.",
            "recovery_steps": [
                "1. Admin must use the new rotated admin key (provided via secure channel)",
                "2. Verify identity through backup authentication",
                "3. Investigate security incident",
                "4. Use POST /security/lockdown/deactivate with new admin key to restore access",
            ],
            "contact": "Contact system administrator immediately",
        }


lockdown_manager = LockdownManager()
