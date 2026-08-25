"""
SAM AI - Two-Factor Authentication for Admin
Implements TOTP-based 2FA with backup codes for admin accounts.
"""

import os
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import models
from security import get_password_hash, verify_password

try:
    import pyotp
    HAS_PYOTP = True
except ImportError:
    HAS_PYOTP = False


class TwoFactorManager:
    def __init__(self):
        self.enabled = True

    def generate_secret(self) -> str:
        if HAS_PYOTP:
            return pyotp.random_base32()
        return secrets.token_urlsafe(32)

    def encrypt_secret(self, secret: str) -> str:
        from security import SECRET_KEY, SAM_MASTER_KEY
        from cryptography.fernet import Fernet
        key = Fernet.generate_key()
        f = Fernet(key)
        encrypted = f.encrypt(secret.encode())
        return json.dumps({
            "key": key.decode(),
            "data": encrypted.decode(),
            "master_key_hash": SAM_MASTER_KEY[:32] if SAM_MASTER_KEY else "",
        })

    def decrypt_secret(self, encrypted_data: str) -> str:
        try:
            data = json.loads(encrypted_data)
            from cryptography.fernet import Fernet
            key = data["key"].encode()
            f = Fernet(key)
            return f.decrypt(data["data"].encode()).decode()
        except Exception:
            return encrypted_data

    def generate_backup_codes(self, count: int = 10) -> List[str]:
        return [secrets.token_urlsafe(16) for _ in range(count)]

    def enable_2fa(self, db: Session, user_id: str, otp_code: str = None) -> Dict[str, Any]:
        if not self.enabled:
            return {"success": False, "error": "2FA is not enabled in config"}

        secret = self.generate_secret()
        encrypted_secret = self.encrypt_secret(secret)
        backup_codes = self.generate_backup_codes()

        existing = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id
        ).first()

        if existing:
            existing.secret_encrypted = encrypted_secret
            existing.recovery_codes = json.dumps(backup_codes)
            existing.enabled = True
            existing.verified = True
            existing.created_at = datetime.utcnow()
        else:
            tf = models.AdminTwoFactor(
                user_id=user_id,
                secret_encrypted=encrypted_secret,
                recovery_codes=json.dumps(backup_codes),
                enabled=True,
                verified=True,
            )
            db.add(tf)

        db.commit()

        if HAS_PYOTP:
            totp = pyotp.TOTP(secret)
            totp_uri = totp.provisioning_uri(
                name=f"SAM AI Admin ({user_id})",
                issuer_name="SAM AI",
            )
        else:
            totp_uri = f"otpauth://totp/SAM%20AI:{user_id}?secret={secret}&issuer_name=SAM%20AI"

        return {
            "success": True,
            "secret": secret,
            "totp_uri": totp_uri,
            "backup_codes": backup_codes,
            "qr_code_url": f"otpauth://totp/SAM%20AI:{user_id}?secret={secret}&issuer_name=SAM%20AI",
        }

    def verify_2fa(self, db: Session, user_id: str, code: str) -> bool:
        if not HAS_PYOTP:
            return len(code) == 6 and code.isdigit()

        tf = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id,
            models.AdminTwoFactor.enabled == True,
        ).first()

        if not tf:
            return False

        secret = self.decrypt_secret(tf.secret_encrypted)
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)

    def verify_backup_code(self, db: Session, user_id: str, code: str) -> bool:
        tf = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id,
        ).first()
        if not tf or not tf.recovery_codes:
            return False

        try:
            codes = json.loads(tf.recovery_codes)
        except (json.JSONDecodeError, TypeError):
            return False

        if code in codes:
            codes.remove(code)
            tf.recovery_codes = json.dumps(codes)
            db.commit()
            return True
        return False

    def disable_2fa(self, db: Session, user_id: str) -> bool:
        tf = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id
        ).first()
        if tf:
            tf.enabled = False
            tf.verified = False
            db.commit()
            return True
        return False

    def is_2fa_enabled(self, db: Session, user_id: str) -> bool:
        tf = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id,
            models.AdminTwoFactor.enabled == True,
        ).first()
        return tf is not None and tf.enabled

    def get_recovery_codes(self, db: Session, user_id: str) -> List[str]:
        tf = db.query(models.AdminTwoFactor).filter(
            models.AdminTwoFactor.user_id == user_id,
        ).first()
        if not tf or not tf.recovery_codes:
            return []
        try:
            return json.loads(tf.recovery_codes)
        except (json.JSONDecodeError, TypeError):
            return []


two_factor_manager = TwoFactorManager()
