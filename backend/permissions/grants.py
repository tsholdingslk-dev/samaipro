"""
SAM AI - Grant Manager
Manages explicit permission grants with usage limits and time limits.
Example: Staff A → Video Module → 50 requests/day → expires in 7 days
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from enum import Enum
import json

from sqlalchemy.orm import Session
import models


class GrantType(str, Enum):
    USAGE_LIMITED = "usage_limited"
    TIME_LIMITED = "time_limited"
    BOTH = "both"
    UNLIMITED = "unlimited"


class GrantManager:
    def __init__(self):
        self.default_usage_limit = 0
        self.default_time_limit_hours = 0

    def create_grant(
        self,
        db: Session,
        user_id: str,
        module: str,
        action: str,
        usage_limit: int = 0,
        time_limit_hours: int = 0,
        expires_at: datetime = None,
        granted_by: str = None,
    ) -> models.PermissionGrant:
        if not expires_at:
            if time_limit_hours > 0:
                expires_at = datetime.utcnow() + timedelta(hours=time_limit_hours)
            else:
                expires_at = datetime.utcnow() + timedelta(days=30)

        grant = models.PermissionGrant(
            user_id=user_id,
            module=module,
            action=action,
            usage_limit=usage_limit,
            time_limit_hours=time_limit_hours,
            period_start=datetime.utcnow(),
            expires_at=expires_at,
            granted_by=granted_by,
            is_active=True,
        )
        db.add(grant)
        db.commit()
        db.refresh(grant)

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            db=db,
            event_type="permission_grant_created",
            user_id=granted_by,
            details=f"Granted {module}:{action} to user {user_id} - usage_limit={usage_limit}, time_limit_hours={time_limit_hours}, expires_at={expires_at.isoformat()}",
            severity="info",
            action_taken="grant_created",
        )

        return grant

    def revoke_grant(self, db: Session, grant_id: str, revoked_by: str = None) -> bool:
        grant = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.id == grant_id
        ).first()
        if not grant:
            return False

        grant.is_active = False
        db.commit()

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            db=db,
            event_type="permission_grant_revoked",
            user_id=revoked_by,
            details=f"Revoked grant {grant_id} for module={grant.module} action={grant.action}",
            severity="info",
            action_taken="grant_revoked",
        )

        return True

    def revoke_all_user_grants(self, db: Session, user_id: str) -> int:
        count = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.user_id == user_id,
            models.PermissionGrant.is_active == True,
        ).update({
            models.PermissionGrant.is_active: False,
            models.PermissionGrant.granted_by: f"revoked:{datetime.utcnow().isoformat()}",
        })
        db.commit()
        return count

    def increment_usage(self, db: Session, grant_id: str) -> int:
        grant = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.id == grant_id
        ).first()
        if not grant:
            return 0

        grant.current_usage += 1
        grant.used_at = datetime.utcnow()
        db.commit()
        return grant.current_usage

    def get_user_grants(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        grants = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.user_id == user_id,
            models.PermissionGrant.is_active == True,
            models.PermissionGrant.expires_at > datetime.utcnow(),
        ).all()

        result = []
        for g in grants:
            result.append({
                "id": g.id,
                "module": g.module,
                "action": g.action,
                "usage_limit": g.usage_limit,
                "current_usage": g.current_usage,
                "time_limit_hours": g.time_limit_hours,
                "period_start": g.period_start.isoformat() if g.period_start else None,
                "expires_at": g.expires_at.isoformat() if g.expires_at else None,
                "granted_at": g.granted_at.isoformat() if g.granted_at else None,
                "granted_by": g.granted_by,
            })
        return result

    def cleanup_expired(self, db: Session) -> int:
        count = db.query(models.PermissionGrant).filter(
            models.PermissionGrant.expires_at < datetime.utcnow(),
            models.PermissionGrant.is_active == True,
        ).update({models.PermissionGrant.is_active: False})
        db.commit()
        return count

    def get_grant_summary(self, db: Session, user_id: str = None) -> Dict[str, Any]:
        query = db.query(models.PermissionGrant)
        if user_id:
            query = query.filter(models.PermissionGrant.user_id == user_id)

        grants = query.all()
        summary = {
            "total": len(grants),
            "active": sum(1 for g in grants if g.is_active),
            "expired": sum(1 for g in grants if g.expires_at < datetime.utcnow()),
            "by_module": {},
            "total_usage": sum(g.current_usage for g in grants if g.is_active),
        }

        for g in grants:
            if g.module not in summary["by_module"]:
                summary["by_module"][g.module] = {"total": 0, "active": 0}
            summary["by_module"][g.module]["total"] += 1
            if g.is_active:
                summary["by_module"][g.module]["active"] += 1

        return summary


grant_manager = GrantManager()
