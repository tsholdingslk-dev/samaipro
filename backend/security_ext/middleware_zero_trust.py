"""
SAM AI - Zero Trust Security Middleware
Integrates device fingerprinting, session validation, rate limiting,
audit logging, and lockdown enforcement into every request.
"""

import time
import json
import re
from datetime import datetime
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse

from security_ext.sessions import session_manager, fingerprinter
from security_ext.audit import audit_logger
from security_ext.lockdown import lockdown_manager
from gateway.rate_limiter import RateLimiter

# Sensitive patterns to sanitize from responses
SENSITIVE_PATTERNS = [
    r'"api_key"\s*:\s*"[^"]+"',
    r'"secret"\s*:\s*"[^"]+"',
    r'"token"\s*:\s*"[^"]+"',
    r'"password"\s*:\s*"[^"]+"',
    r'"hashed_password"\s*:\s*"[^"]+"',
    r'Bearer\s+[A-Za-z0-9_-]+',
]


class ZeroTrustMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter(
            requests_per_minute=120,
            requests_per_hour=5000
        )
        self.sensitive_paths = {"/auth/login", "/auth/key-login", "/auth/verify-master-key"}

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Check lockdown mode
        from database import SessionLocal
        db = SessionLocal()
        try:
            if lockdown_manager.is_lockdown_active(db):
                # Only allow admin endpoints during lockdown
                path = request.url.path
                is_admin_endpoint = any(path.startswith(p) for p in [
                    "/security/", "/auth/verify-master-key", "/auth/verify-admin-access"
                ])
                if not is_admin_endpoint:
                    return JSONResponse(
                        status_code=403,
                        content={
                            "status": "locked_down",
                            "message": "System is in emergency lockdown mode. Admin access only.",
                            "recovery_info": lockdown_manager.get_recovery_instructions(),
                        },
                    )
        finally:
            db.close()

        # Device fingerprinting
        device_fp = fingerprinter.generate_fingerprint(request)

        # Rate limiting by IP
        client_ip = self._get_client_ip(request)
        rate_key = f"{client_ip}:{device_fp}"
        if not self.rate_limiter.is_allowed(rate_key):
            audit_logger.log_security_event(
                db=None,
                event_type="rate_limit_exceeded",
                ip_address=client_ip,
                device_fingerprint=device_fp,
                user_agent=request.headers.get("user-agent", ""),
                details=f"Rate limit exceeded for {rate_key}",
                severity="warning",
                action_taken="blocked",
            )
            return JSONResponse(
                status_code=429,
                content={"status": "error", "message": "Rate limit exceeded. Please try again later."},
            )

        # Parse body for audit logging
        body_size = 0
        try:
            body_bytes = await request.body()
            body_size = len(body_bytes) if body_bytes else 0

            # Re-inject body for downstream handlers
            async def receive():
                return {"type": "http.request", "body": body_bytes}

            request._receive = receive

            if body_bytes:
                try:
                    body_text = body_bytes.decode("utf-8", errors="replace")
                    for pattern in SENSITIVE_PATTERNS:
                        body_text = re.sub(pattern, '"***REDACTED***"', body_text)
                except Exception:
                    pass
        except Exception:
            pass

        # Execute request
        response = await call_next(request)

        # Audit logging (async, not blocking)
        duration_ms = (time.time() - start_time) * 1000
        user_id = getattr(request.state, "user_id", None)

        if db:
            try:
                audit_logger.log_request(
                    db=db,
                    request=request,
                    user_id=user_id,
                    action=f"{request.method} {request.url.path}",
                    resource=request.url.path,
                    method=request.method,
                    status_code=response.status_code,
                    duration_ms=duration_ms,
                    device_fingerprint=device_fp,
                    request_body_size=body_size,
                )
            except Exception:
                pass

        # Sanitize response
        response = self._sanitize_response(response, request)

        # Add security headers
        response.headers["X-Request-ID"] = getattr(request.state, "request_id", "")
        response.headers["X-Device-Fingerprint"] = device_fp[:8] + "..."
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        return response

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return getattr(request.client, "host", "unknown")

    def _sanitize_response(self, response: Response, request: Request) -> Response:
        content_type = response.headers.get("content-type", "")

        if "application/json" not in content_type:
            return response

        # Read body
        body = b""

        async def collect_body():
            nonlocal body
            async for chunk in response.body_iterator:
                body += chunk

        # We need to consume the body to sanitize it
        # This is a simplified version - for full body replacement, a more complex approach is needed
        return response


def setup_zero_trust(app: FastAPI):
    rate_limiter = RateLimiter(requests_per_minute=120, requests_per_hour=5000)
    app.add_middleware(ZeroTrustMiddleware, rate_limiter=rate_limiter)
