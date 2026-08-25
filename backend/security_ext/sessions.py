"""
SAM AI - Session Manager & Device Fingerprinting
Tracks active sessions, device fingerprints, and provides automatic session expiry.
"""

import hashlib
import json
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import models
from security import create_access_token, SECRET_KEY


class DeviceFingerprinter:
    def __init__(self):
        self.salt = SECRET_KEY[:16] if SECRET_KEY else "default_salt"

    def generate_fingerprint(self, request) -> str:
        components = []

        user_agent = request.headers.get("user-agent", "")
        components.append(user_agent)

        accept = request.headers.get("accept", "")
        components.append(accept)

        accept_encoding = request.headers.get("accept-encoding", "")
        components.append(accept_encoding)

        accept_language = request.headers.get("accept-language", "")
        components.append(accept_language)

        x_forwarded_for = request.headers.get("x-forwarded-for", "")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if hasattr(request, 'client') else ""
        components.append(client_ip)

        do_not_track = request.headers.get("dnt", "")
        components.append(do_not_track)

        raw = "|".join(components)
        fingerprint = hashlib.sha256(
            (raw + self.salt).encode()
        ).hexdigest()[:32]

        return fingerprint

    def get_device_info(self, request) -> Dict[str, Any]:
        user_agent = request.headers.get("user-agent", "")
        return {
            "user_agent": user_agent,
            "platform": self._detect_platform(user_agent),
            "browser": self._detect_browser(user_agent),
            "is_mobile": self._detect_mobile(user_agent),
            "accept_language": request.headers.get("accept-language", ""),
        }

    def _detect_platform(self, user_agent: str) -> str:
        ua = user_agent.lower()
        if "windows" in ua:
            return "Windows"
        if "macintosh" in ua or "mac os" in ua:
            return "macOS"
        if "android" in ua:
            return "Android"
        if "iphone" in ua or "ipad" in ua:
            return "iOS"
        if "linux" in ua:
            return "Linux"
        return "Unknown"

    def _detect_browser(self, user_agent: str) -> str:
        ua = user_agent.lower()
        if "chrome" in ua and "edg" not in ua:
            return "Chrome"
        if "firefox" in ua:
            return "Firefox"
        if "safari" in ua and "chrome" not in ua:
            return "Safari"
        if "edg" in ua:
            return "Edge"
        if "opera" in ua or "opr" in ua:
            return "Opera"
        return "Unknown"

    def _detect_mobile(self, user_agent: str) -> bool:
        ua = user_agent.lower()
        return any(kw in ua for kw in ["mobile", "android", "iphone", "ipad", "ipod"])


fingerprinter = DeviceFingerprinter()


class SessionManager:
    def __init__(self):
        self.session_expiry_hours = 24
        self.absolute_expiry_days = 7

    def create_session(
        self,
        db: Session,
        user_id: str,
        request,
        access_token: str,
    ) -> str:
        device_fp = fingerprinter.generate_fingerprint(request)
        device_info = fingerprinter.get_device_info(request)
        client_ip = self._get_client_ip(request)

        token_hash = hashlib.sha256(access_token.encode()).hexdigest()
        session_id = secrets.token_urlsafe(32)

        expires_at = datetime.utcnow() + timedelta(
            hours=self.session_expiry_hours,
            days=self.absolute_expiry_days,
        )

        session = models.Session(
            session_id=session_id,
            user_id=user_id,
            access_token_hash=token_hash,
            device_fingerprint=device_fp,
            device_info=json.dumps(device_info),
            ip_address=client_ip,
            user_agent=request.headers.get("user-agent", ""),
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        self._log_audit_event(db, user_id, "session_created", "auth", client_ip, device_fp)

        return session_id

    def validate_session(
        self,
        db: Session,
        session_id: str,
        access_token: str,
        request,
    ) -> Optional[models.Session]:
        if not session_id:
            return None

        session = db.query(models.Session).filter(
            models.Session.session_id == session_id
        ).first()

        if not session or session.revoked:
            return None

        if session.expires_at < datetime.utcnow():
            session.revoked = True
            db.commit()
            self._log_audit_event(
                db, session.user_id, "session_expired", "auth",
                session.ip_address, session.device_fingerprint
            )
            return None

        current_fp = fingerprinter.generate_fingerprint(request)
        if session.device_fingerprint != current_fp:
            self._log_security_event(
                db, "session_device_mismatch", session.user_id,
                session.ip_address, session.device_fingerprint
            )
            session.risk_score = min(session.risk_score + 0.3, 1.0)
            db.commit()

        session.last_seen = datetime.utcnow()
        db.commit()

        token_hash = hashlib.sha256(access_token.encode()).hexdigest()
        if session.access_token_hash != token_hash:
            return None

        return session

    def revoke_session(self, db: Session, session_id: str) -> bool:
        session = db.query(models.Session).filter(
            models.Session.session_id == session_id
        ).first()
        if session:
            session.revoked = True
            db.commit()
            self._log_audit_event(
                db, session.user_id, "session_revoked", "auth",
                session.ip_address, session.device_fingerprint
            )
            return True
        return False

    def revoke_all_user_sessions(self, db: Session, user_id: str) -> int:
        count = db.query(models.Session).filter(
            models.Session.user_id == user_id,
            models.Session.revoked == False,
        ).update({models.Session.revoked: True})
        db.commit()

        self._log_audit_event(db, user_id, "all_sessions_revoked", "auth")
        return count

    def cleanup_expired(self, db: Session) -> int:
        count = db.query(models.Session).filter(
            models.Session.expires_at < datetime.utcnow(),
            models.Session.revoked == False,
        ).update({models.Session.revoked: True})
        db.commit()
        return count

    def get_active_sessions(self, db: Session, user_id: str) -> List[Dict[str, Any]]:
        sessions = db.query(models.Session).filter(
            models.Session.user_id == user_id,
            models.Session.revoked == False,
            models.Session.expires_at > datetime.utcnow(),
        ).all()

        result = []
        for s in sessions:
            device_info = json.loads(s.device_info) if s.device_info else {}
            result.append({
                "session_id": s.session_id[:8] + "...",
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "device_info": device_info,
                "created_at": s.created_at.isoformat(),
                "last_seen": s.last_seen.isoformat(),
                "expires_at": s.expires_at.isoformat(),
                "risk_score": s.risk_score,
            })
        return result

    def _get_client_ip(self, request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip", "")
        if real_ip:
            return real_ip
        return request.client.host if hasattr(request, 'client') else "unknown"

    def _log_audit_event(self, db: Session, user_id: str, action: str, resource: str, ip_address: str = None, device_fp: str = None):
        log = models.AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            ip_address=ip_address,
            device_fingerprint=device_fp,
            success=True,
        )
        db.add(log)
        db.commit()

    def _log_security_event(self, db: Session, event_type: str, user_id: str, ip_address: str = None, device_fp: str = None, details: str = None):
        event = models.SecurityEvent(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            device_fingerprint=device_fp,
            details=details or "",
            severity="warning",
            action_taken="monitored",
        )
        db.add(event)
        db.commit()


session_manager = SessionManager()
