"""
SAM AI - Secret Management
Centralizes and encrypts API keys, provider credentials, and secrets.
Supports vault-style encryption at rest, key rotation, and auto-redaction in logs.
"""

import os
import json
import secrets
import base64
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from sqlalchemy.orm import Session
import models


class SecretType(str, Enum):
    API_KEY = "api_key"
    OAUTH_TOKEN = "oauth_token"
    DATABASE_URL = "database_url"
    ENCRYPTION_KEY = "encryption_key"
    WEBHOOK_SECRET = "webhook_secret"
    CUSTOM = "custom"


@dataclass
class SecretMetadata:
    name: str
    secret_type: SecretType
    provider: Optional[str]
    created_at: datetime
    rotated_at: datetime
    expires_at: Optional[datetime]
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    is_active: bool = True


class SecretEncryption:
    def __init__(self):
        master_key = os.environ.get("SAM_SECRET_MASTER_KEY", "")
        if not master_key:
            master_key = secrets.token_urlsafe(32)
        self._master_key = master_key
        self._fernet = self._init_fernet(master_key)

    def _init_fernet(self, master_key: str) -> Fernet:
        salt = hashlib.sha256(master_key.encode()).digest()[:16]
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
        return Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        return self._fernet.decrypt(ciphertext.encode()).decode()


class SecretManager:
    def __init__(self):
        self.encryption = SecretEncryption()
        self._secret_cache: Dict[str, Tuple[str, datetime]] = {}
        self._cache_ttl = timedelta(minutes=5)
        self._rotation_intervals = {
            "api_key": timedelta(days=90),
            "oauth_token": timedelta(days=30),
            "encryption_key": timedelta(days=365),
        }

    def store_secret(
        self,
        db: Session,
        user_id: str,
        name: str,
        value: str,
        secret_type: SecretType = SecretType.CUSTOM,
        provider: str = None,
        expires_at: datetime = None,
        scope: str = "user",
    ) -> Dict[str, Any]:
        encrypted_value = self.encryption.encrypt(value)

        secret = models.UserAPIKey(
            user_id=user_id,
            name=name,
            key_hash=hashlib.sha256(value.encode()).hexdigest(),
            key_encrypted=encrypted_value,
            key_prefix=value[:8] if len(value) >= 8 else value[:4],
            provider=provider or "custom",
            scope=scope,
            is_active=True,
            expires_at=expires_at,
            metadata_json=json.dumps({
                "secret_type": secret_type.value,
                "provider": provider,
                "access_count": 0,
            }),
        )
        db.add(secret)
        db.commit()
        db.refresh(secret)

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            db, "secret_stored", user_id,
            f"Stored secret '{name}' of type {secret_type.value}",
            severity="info",
            action_taken="secret_created",
        )

        return {
            "id": secret.id,
            "name": secret.name,
            "type": secret_type.value,
            "provider": provider,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "access_count": 0,
        }

    def retrieve_secret(self, db: Session, secret_id: str, user_id: str = None) -> Optional[str]:
        secret = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.id == secret_id
        ).first()

        if not secret:
            return None

        if user_id and secret.user_id != user_id and secret.scope == "user":
            from security_ext.audit import audit_logger
            audit_logger.log_security_event(
                db, "secret_access_denied", user_id,
                f"Attempted unauthorized access to secret '{secret.name}'",
                severity="warning",
                action_taken="access_denied",
            )
            return None

        if secret.expires_at and secret.expires_at < datetime.utcnow():
            return None

        if not secret.is_active:
            return None

        cache_key = f"{secret_id}"
        if cache_key in self._secret_cache:
            cached_value, cached_time = self._secret_cache[cache_key]
            if datetime.utcnow() - cached_time < self._cache_ttl:
                secret.access_count += 1
                db.commit()
                return cached_value

        try:
            decrypted = self.encryption.decrypt(secret.key_encrypted)
        except Exception:
            return None

        self._secret_cache[cache_key] = (decrypted, datetime.utcnow())

        secret.access_count += 1
        secret.last_accessed = datetime.utcnow()
        db.commit()

        return decrypted

    def rotate_secret(self, db: Session, secret_id: str, new_value: str, user_id: str = None) -> Dict[str, Any]:
        secret = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.id == secret_id
        ).first()

        if not secret:
            return {"status": "error", "message": "Secret not found"}

        if user_id and secret.user_id != user_id and secret.scope == "user":
            return {"status": "error", "message": "Access denied"}

        old_encrypted = secret.key_encrypted
        secret.key_encrypted = self.encryption.encrypt(new_value)
        secret.key_hash = hashlib.sha256(new_value.encode()).hexdigest()
        secret.key_prefix = new_value[:8] if len(new_value) >= 8 else new_value[:4]
        secret.expires_at = datetime.utcnow() + timedelta(days=90)
        meta = json.loads(secret.metadata_json) if secret.metadata_json else {}
        meta["previous_versions"] = meta.get("previous_versions", [])
        meta["previous_versions"].append({"rotated_at": datetime.utcnow().isoformat(), "old_hash_prefix": old_encrypted[:20]})
        meta["rotated_at"] = datetime.utcnow().isoformat()
        secret.metadata_json = json.dumps(meta)
        db.commit()

        cache_key = f"{secret_id}"
        if cache_key in self._secret_cache:
            del self._secret_cache[cache_key]

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            db, "secret_rotated", user_id or secret.user_id,
            f"Rotated secret '{secret.name}'",
            severity="info",
            action_taken="secret_rotated",
        )

        return {"status": "success", "message": "Secret rotated successfully"}

    def get_provider_credentials(self, db: Session, provider: str) -> Dict[str, str]:
        secrets = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.provider == provider,
            models.UserAPIKey.is_active == True,
        ).all()

        credentials = {}
        for s in secrets:
            value = self.retrieve_secret(db, s.id)
            if value:
                credentials[s.name] = value
        return credentials

    def list_user_secrets(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        secrets = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.user_id == user_id,
            models.UserAPIKey.is_active == True,
        ).all()

        return [
            {
                "id": s.id,
                "name": s.name,
                "provider": s.provider,
                "key_prefix": s.key_prefix,
                "scope": s.scope,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "is_active": s.is_active,
                "access_count": s.access_count,
                "last_accessed": s.last_accessed.isoformat() if s.last_accessed else None,
            }
            for s in secrets
        ]

    def delete_secret(self, db: Session, secret_id: str, user_id: str = None) -> bool:
        secret = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.id == secret_id
        ).first()

        if not secret:
            return False

        if user_id and secret.user_id != user_id and secret.scope == "user":
            return False

        secret.is_active = False
        db.commit()

        cache_key = f"{secret_id}"
        if cache_key in self._secret_cache:
            del self._secret_cache[cache_key]

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            db, "secret_deleted", user_id,
            f"Deleted secret '{secret.name}'",
            severity="info",
            action_taken="secret_deleted",
        )

        return True

    def redact_secrets(self, text: str) -> str:
        """Auto-redact sensitive patterns in logs/output."""
        patterns = [
            (r'sk-[a-zA-Z0-9]{20,}', '[REDACTED_API_KEY]'),
            (r'AKIA[0-9A-Z]{16}', '[REDACTED_AWS_KEY]'),
            (r'ghp_[a-zA-Z0-9]{36}', '[REDACTED_GITHUB_TOKEN]'),
            (r'(Bearer\s+)[a-zA-Z0-9._-]+', r'\1[REDACTED_TOKEN]'),
        ]

        redacted = text
        for pattern, replacement in patterns:
            redacted = re.sub(pattern, replacement, redacted)
        return redacted

    def check_expiring_secrets(self, db: Session, days: int = 7) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() + timedelta(days=days)
        secrets = db.query(models.UserAPIKey).filter(
            models.UserAPIKey.expires_at < cutoff,
            models.UserAPIKey.expires_at > datetime.utcnow(),
            models.UserAPIKey.is_active == True,
        ).all()

        return [
            {
                "id": s.id,
                "name": s.name,
                "provider": s.provider,
                "expires_at": s.expires_at.isoformat(),
                "days_until_expiry": (s.expires_at - datetime.utcnow()).days,
            }
            for s in secrets
        ]


secret_manager = SecretManager()
