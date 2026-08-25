"""
SAM AI - Audit Logger
Comprehensive audit logging for security events, API access, and user actions.
"""

import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import Request
import models


class AuditLogger:
    def __init__(self):
        self.enabled = True
        self.sensitive_endpoints = {"/auth/login", "/auth/key-login", "/auth/generate-key"}

    def log_request(
        self,
        db: Session,
        request: Request,
        user_id: Optional[str],
        action: str,
        resource: str,
        method: str,
        status_code: int,
        duration_ms: float,
        error: str = None,
        device_fingerprint: str = None,
        request_body_size: int = 0,
    ):
        if not self.enabled:
            return

        ip_address = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")

        risk_score = 0.0

        if status_code == 401:
            risk_score = 0.3
        elif status_code == 403:
            risk_score = 0.5
        elif status_code == 429:
            risk_score = 0.4
        elif status_code >= 500:
            risk_score = 0.6

        if error:
            risk_score = min(risk_score + 0.2, 1.0)

        if request_body_size > 1000000:
            risk_score = min(risk_score + 0.1, 1.0)

        log = models.AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            method=method,
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint,
            success=(status_code < 400),
            error_message=error,
            risk_score=risk_score,
            request_body_size=request_body_size,
            response_status=status_code,
            duration_ms=duration_ms,
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        db.commit()

    def log_security_event(
        self,
        db: Session,
        event_type: str,
        user_id: Optional[str],
        ip_address: Optional[str],
        device_fingerprint: Optional[str],
        user_agent: Optional[str],
        details: str,
        severity: str = "info",
        action_taken: str = None,
    ):
        if not self.enabled:
            return

        event = models.SecurityEvent(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint,
            details=details,
            severity=severity,
            action_taken=action_taken,
            timestamp=datetime.utcnow(),
        )
        db.add(event)
        db.commit()

    def get_audit_logs(self, db: Session, filters: Dict[str, Any] = None, limit: int = 100) -> List[Dict]:
        query = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc())

        if filters:
            if filters.get("user_id"):
                query = query.filter(models.AuditLog.user_id == filters["user_id"])
            if filters.get("action"):
                query = query.filter(models.AuditLog.action.ilike(f"%{filters['action']}%"))
            if filters.get("resource"):
                query = query.filter(models.AuditLog.resource == filters["resource"])
            if filters.get("min_risk"):
                query = query.filter(models.AuditLog.risk_score >= filters["min_risk"])
            if filters.get("status_code"):
                query = query.filter(models.AuditLog.response_status == filters["status_code"])
            if filters.get("start_date"):
                query = query.filter(models.AuditLog.timestamp >= filters["start_date"])
            if filters.get("end_date"):
                query = query.filter(models.AuditLog.timestamp <= filters["end_date"])

        logs = query.limit(limit).all()
        return [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "resource": log.resource,
                "method": log.method,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent[:100] if log.user_agent else None,
                "success": log.success,
                "error_message": log.error_message,
                "risk_score": log.risk_score,
                "response_status": log.response_status,
                "duration_ms": log.duration_ms,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in logs
        ]

    def get_security_events(self, db: Session, filters: Dict[str, Any] = None, limit: int = 100) -> List[Dict]:
        query = db.query(models.SecurityEvent).order_by(models.SecurityEvent.timestamp.desc())

        if filters:
            if filters.get("event_type"):
                query = query.filter(models.SecurityEvent.event_type == filters["event_type"])
            if filters.get("severity"):
                query = query.filter(models.SecurityEvent.severity == filters["severity"])
            if filters.get("user_id"):
                query = query.filter(models.SecurityEvent.user_id == filters["user_id"])
            if filters.get("start_date"):
                query = query.filter(models.SecurityEvent.timestamp >= filters["start_date"])

        events = query.limit(limit).all()
        return [
            {
                "id": event.id,
                "event_type": event.event_type,
                "user_id": event.user_id,
                "ip_address": event.ip_address,
                "device_fingerprint": event.device_fingerprint,
                "details": event.details,
                "severity": event.severity,
                "action_taken": event.action_taken,
                "timestamp": event.timestamp.isoformat(),
            }
            for event in events
        ]

    def get_risk_summary(self, db: Session, hours: int = 24) -> Dict[str, Any]:
        since = datetime.utcnow() - timedelta(hours=hours)

        total_events = db.query(models.SecurityEvent).filter(
            models.SecurityEvent.timestamp >= since
        ).count()

        high_risk = db.query(models.AuditLog).filter(
            models.AuditLog.timestamp >= since,
            models.AuditLog.risk_score >= 0.6,
        ).count()

        medium_risk = db.query(models.AuditLog).filter(
            models.AuditLog.timestamp >= since,
            models.AuditLog.risk_score >= 0.3,
            models.AuditLog.risk_score < 0.6,
        ).count()

        failed_auth = db.query(models.AuditLog).filter(
            models.AuditLog.timestamp >= since,
            models.AuditLog.action == "auth_failed",
        ).count()

        return {
            "period_hours": hours,
            "total_security_events": total_events,
            "high_risk_requests": high_risk,
            "medium_risk_requests": medium_risk,
            "failed_auth_attempts": failed_auth,
            "risk_level": "high" if high_risk > 10 else "medium" if medium_risk > 20 else "low",
        }

    def _get_client_ip(self, request: Request) -> Optional[str]:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip", "")
        if real_ip:
            return real_ip
        return getattr(request.client, 'host', None)


audit_logger = AuditLogger()
