"""
SAM AI - Refresh Token Rotation System
Implements secure refresh token rotation with reuse detection and automatic expiry.
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
import models
from security import SECRET_KEY, ALGORITHM
import bcrypt
import jwt


class RefreshTokenManager:
    def __init__(self):
        self.token_length = 256
        self.default_expiry_days = 30
        self.rotation_window_minutes = 5

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode() + SECRET_KEY.encode()).hexdigest()

    def _hash_token_bcrypt(self, token: str) -> str:
        return bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()

    def _verify_token_bcrypt(self, token: str, token_hash: str) -> bool:
        return bcrypt.checkpw(token.encode(), token_hash.encode())

    def generate_refresh_token(self, db: Session, user_id: str, device_fingerprint: str = None, ip_address: str = None, expires_days: int = None) -> str:
        token = secrets.token_urlsafe(self.token_length)
        token_hash = self._hash_token(token)
        expires_at = datetime.utcnow() + timedelta(days=expires_days or self.default_expiry_days)

        refresh_token = models.RefreshToken(
            token_hash=token_hash,
            user_id=user_id,
            expires_at=expires_at,
            device_fingerprint=device_fingerprint,
            ip_address=ip_address,
        )
        db.add(refresh_token)
        db.commit()
        db.refresh(refresh_token)
        return token

    def exchange_refresh_token(self, db: Session, refresh_token: str, device_fingerprint: str = None, ip_address: str = None) -> Optional[Dict[str, Any]]:
        token_hash = self._hash_token(refresh_token)
        stored_token = db.query(models.RefreshToken).filter(
            models.RefreshToken.token_hash == token_hash,
            models.RefreshToken.revoked == False,
        ).first()

        if not stored_token:
            self._log_security_event(db, "refresh_token_reuse_attempt", device_fingerprint, ip_address)
            return None

        if stored_token.expires_at < datetime.utcnow():
            stored_token.revoked = True
            db.commit()
            return None

        if stored_token.device_fingerprint and device_fingerprint and stored_token.device_fingerprint != device_fingerprint:
            self._log_security_event(db, "refresh_token_device_mismatch", device_fingerprint, ip_address)
            stored_token.revoked = True
            db.commit()
            return None

        stored_token.revoked = True
        stored_token.last_used = datetime.utcnow()
        db.commit()

        user = db.query(models.User).filter(models.User.id == stored_token.user_id).first()
        if not user:
            return None

        new_token = self.generate_refresh_token(
            db, user.id,
            device_fingerprint=device_fingerprint or stored_token.device_fingerprint,
            ip_address=ip_address or stored_token.ip_address,
        )

        access_token_expiry = timedelta(minutes=15)
        import security as sec
        access_token = sec.create_access_token(
            data={"user_id": user.id, "role": user.role},
            expires_delta=access_token_expiry,
        )

        self._log_audit_event(db, user.id, "token_refreshed", "auth", ip_address)

        return {
            "access_token": access_token,
            "refresh_token": new_token,
            "token_type": "bearer",
            "expires_in": int(access_token_expiry.total_seconds()),
            "user": {"id": user.id, "email": user.email, "role": user.role},
        }

    def revoke_refresh_token(self, db: Session, refresh_token: str) -> bool:
        token_hash = self._hash_token(refresh_token)
        stored = db.query(models.RefreshToken).filter(
            models.RefreshToken.token_hash == token_hash
        ).first()
        if stored:
            stored.revoked = True
            db.commit()
            return True
        return False

    def revoke_all_user_tokens(self, db: Session, user_id: str) -> int:
        count = db.query(models.RefreshToken).filter(
            models.RefreshToken.user_id == user_id,
            models.RefreshToken.revoked == False,
        ).update({models.RefreshToken.revoked: True})
        db.commit()
        return count

    def cleanup_expired(self, db: Session) -> int:
        count = db.query(models.RefreshToken).filter(
            models.RefreshToken.expires_at < datetime.utcnow(),
            models.RefreshToken.revoked == False,
        ).update({models.RefreshToken.revoked: True})
        db.commit()
        return count

    def _log_security_event(self, db: Session, event_type: str, device_fingerprint: str = None, ip_address: str = None):
        event = models.SecurityEvent(
            event_type=event_type,
            ip_address=ip_address,
            device_fingerprint=device_fingerprint,
            severity="warning" if event_type == "refresh_token_reuse_attempt" else "info",
            action_taken="blocked",
        )
        db.add(event)
        db.commit()

    def _log_audit_event(self, db: Session, user_id: str, action: str, resource: str, ip_address: str = None):
        log = models.AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
            success=True,
        )
        db.add(log)
        db.commit()


refresh_token_manager = RefreshTokenManager()
