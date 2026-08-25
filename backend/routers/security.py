from fastapi import APIRouter, Depends, HTTPException, status, Body, Form, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import json
import hashlib
import secrets

from database import get_db
import models
from security import get_current_user, require_admin, SAM_MASTER_KEY
from security_ext.refresh_tokens import refresh_token_manager
from security_ext.scopes import scope_engine
from security_ext.sessions import session_manager, fingerprinter
from security_ext.two_factor import two_factor_manager
from security_ext.lockdown import lockdown_manager
from security_ext.audit import audit_logger

router = APIRouter(
    prefix="/security",
    tags=["Zero-Trust Security"]
)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TwoFactorVerify(BaseModel):
    code: str
    use_backup_code: Optional[bool] = False


class LockdownRequest(BaseModel):
    reason: str = "manual_trigger"
    admin_key: Optional[str] = None


class APIKeyCreate(BaseModel):
    name: str
    scopes: List[str]
    expires_days: Optional[int] = 90


class ScopeCheckRequest(BaseModel):
    scopes: List[str]


@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    device_fp = fingerprinter.generate_fingerprint(request)
    forwarded = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded.split(",")[0].strip() if forwarded else (
        getattr(request.client, "host", "unknown") if hasattr(request, "client") else "unknown"
    )

    result = refresh_token_manager.exchange_refresh_token(
        db, refresh_data.refresh_token,
        device_fingerprint=device_fp,
        ip_address=client_ip,
    )

    if not result:
        audit_logger.log_security_event(
            db=db,
            event_type="refresh_token_failure",
            ip_address=client_ip,
            device_fingerprint=device_fp,
            user_agent=request.headers.get("user-agent", ""),
            details="Refresh token exchange failed",
            severity="warning",
        )
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    return result


@router.post("/logout")
async def logout(
    request: Request,
    refresh_token: Optional[str] = Body(None, embed=True),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if refresh_token:
        refresh_token_manager.revoke_refresh_token(db, refresh_token)

    session_id = request.headers.get("X-Session-ID", "")
    if session_id:
        session_manager.revoke_session(db, session_id)

    return {"status": "success", "message": "Logged out successfully"}


@router.get("/sessions")
async def get_active_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = session_manager.get_active_sessions(db, current_user["user_id"])
    return {"sessions": sessions}


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not session_manager.revoke_session(db, session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "message": "Session revoked"}


@router.post("/2fa/setup")
async def setup_two_factor(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    result = two_factor_manager.enable_2fa(db, current_user["user_id"])
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to enable 2FA"))
    return result


@router.post("/2fa/verify")
async def verify_two_factor(
    request: Request,
    verify_data: TwoFactorVerify,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if verify_data.use_backup_code:
        success = two_factor_manager.verify_backup_code(db, current_user["user_id"], verify_data.code)
    else:
        success = two_factor_manager.verify_2fa(db, current_user["user_id"], verify_data.code)

    if not success:
        raise HTTPException(status_code=401, detail="Invalid 2FA code")

    return {"status": "success", "message": "2FA verified"}


@router.post("/2fa/disable")
async def disable_two_factor(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    success = two_factor_manager.disable_2fa(db, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="2FA not found")
    return {"status": "success", "message": "2FA disabled"}


@router.get("/2fa/status")
async def get_2fa_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    enabled = two_factor_manager.is_2fa_enabled(db, current_user["user_id"])
    recovery_codes = two_factor_manager.get_recovery_codes(db, current_user["user_id"])
    return {"2fa_enabled": enabled, "recovery_codes_remaining": len(recovery_codes)}


@router.get("/scopes")
async def get_all_scopes(
    current_user: dict = Depends(get_current_user),
):
    return {"scopes": scope_engine.get_all_scopes()}


@router.post("/scopes/check")
async def check_scopes(
    check: ScopeCheckRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_scopes = scope_engine.get_user_scopes(db, current_user["user_id"])
    results = {}
    for scope in check.scopes:
        results[scope] = scope_engine.check_scope(user_scopes, scope)
    return {"user_scopes": user_scopes, "checks": results}


@router.post("/api-keys")
async def create_api_key(
    key_data: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    key_code = "sk_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(key_code.encode() + SAM_MASTER_KEY[:32].encode()).hexdigest()

    api_key = models.UserAPIKey(
        key_code=key_code[:12] + "...",
        key_hash=key_hash,
        user_id=current_user["user_id"],
        scopes=json.dumps(key_data.scopes),
        name=key_data.name,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    audit_logger.log_security_event(
        db=db,
        event_type="api_key_created",
        user_id=current_user["user_id"],
        details=f"API key '{key_data.name}' created with scopes: {', '.join(key_data.scopes)}",
        severity="info",
    )

    return {
        "status": "success",
        "key_id": api_key.id,
        "key_prefix": f"sk_...{key_code[:8]}",
        "full_key": key_code,
        "scopes": key_data.scopes,
    }


@router.get("/api-keys")
async def list_api_keys(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    keys = db.query(models.UserAPIKey).filter(
        models.UserAPIKey.user_id == current_user["user_id"],
        models.UserAPIKey.revoked == False,
    ).all()
    return {
        "keys": [
            {
                "id": k.id,
                "name": k.name,
                "key_prefix": k.key_code,
                "created_at": k.created_at.isoformat(),
                "last_used": k.last_used.isoformat() if k.last_used else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "scopes": json.loads(k.scopes) if k.scopes else [],
                "revoked": k.revoked,
            }
            for k in keys
        ]
    }


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    key = db.query(models.UserAPIKey).filter(
        models.UserAPIKey.id == key_id,
        models.UserAPIKey.user_id == current_user["user_id"],
    ).first()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.revoked = True
    db.commit()
    return {"status": "success", "message": "API key revoked"}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    min_risk: Optional[float] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    filters = {}
    if min_risk is not None:
        filters["min_risk"] = min_risk
    if action:
        filters["action"] = action
    logs = audit_logger.get_audit_logs(db, filters, limit)
    return {"logs": logs}


@router.get("/security-events")
async def get_security_events(
    limit: int = 100,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    filters = {}
    if severity:
        filters["severity"] = severity
    events = audit_logger.get_security_events(db, filters, limit)
    return {"events": events}


@router.get("/risk-summary")
async def get_risk_summary(
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    return audit_logger.get_risk_summary(db, hours)


@router.post("/lockdown/activate")
async def activate_lockdown(
    request: Request,
    lockdown_data: LockdownRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    if two_factor_manager.is_2fa_enabled(db, current_user["user_id"]):
        raise HTTPException(
            status_code=403,
            detail="2FA verification required before lockdown activation. Verify your 2FA code first."
        )
    result = lockdown_manager.activate_lockdown(
        db,
        reason=lockdown_data.reason,
        admin_id=current_user["user_id"],
        admin_name=current_user["user_id"],
    )
    return result


@router.post("/lockdown/deactivate")
async def deactivate_lockdown(
    admin_key: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    if not lockdown_manager.is_lockdown_active(db):
        return {"status": "info", "message": "Lockdown is not active"}
    if not lockdown_manager.consume_admin_key(db, current_user["user_id"], admin_key):
        raise HTTPException(status_code=401, detail="Invalid lockdown admin key")
    result = lockdown_manager.deactivate_lockdown(db, current_user["user_id"])
    return result


@router.get("/lockdown/status")
async def get_lockdown_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return lockdown_manager.get_lockdown_status(db)


@router.get("/settings")
async def get_security_settings(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    settings = db.query(models.SecuritySetting).all()
    return {
        "settings": [
            {"key": s.setting_key, "value": s.setting_value, "description": s.description}
            for s in settings
        ]
    }
