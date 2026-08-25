from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
import models
from security import get_current_user, require_admin
from permissions.engine import permission_engine
from permissions.grants import grant_manager
from permissions.quota import quota_manager

router = APIRouter(
    prefix="/permissions",
    tags=["Dynamic Permissions"]
)


class PermissionCheckRequest(BaseModel):
    module: str
    action: str = "read"


class GrantCreate(BaseModel):
    user_id: str
    module: str
    action: str
    usage_limit: Optional[int] = 0
    time_limit_hours: Optional[int] = 0
    expires_days: Optional[int] = 30


@router.post("/check")
async def check_permission(
    check: PermissionCheckRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = permission_engine.check_permission(
        db, current_user["user_id"], check.module, check.action
    )
    return {
        "allowed": result.allowed,
        "module": result.module,
        "action": result.action,
        "role": result.role,
        "denial_reason": result.denial_reason,
        "grants": result.grants,
        "usage_count": result.usage_count,
        "usage_limit": result.usage_limit,
        "warnings": result.warnings,
    }


@router.get("/my")
async def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return permission_engine.get_user_permissions(db, current_user["user_id"])


@router.get("/grants")
async def get_user_grants(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    target = user_id or current_user["user_id"]
    if user_id and current_user["role"] != "admin" and current_user["role"] != "staff":
        raise HTTPException(status_code=403, detail="Only admin/staff can view other users' grants")
    return {"grants": grant_manager.get_user_grants(db, target)}


@router.post("/grants")
async def create_grant(
    grant_data: GrantCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    target = db.query(models.User).filter(models.User.id == grant_data.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    grant = grant_manager.create_grant(
        db=db,
        user_id=grant_data.user_id,
        module=grant_data.module,
        action=grant_data.action,
        usage_limit=grant_data.usage_limit,
        time_limit_hours=grant_data.time_limit_hours,
        expires_at=datetime.utcnow() + timedelta(days=grant_data.expires_days),
        granted_by=current_user["user_id"],
    )
    return {"status": "success", "grant_id": grant.id}


@router.delete("/grants/{grant_id}")
async def revoke_grant(
    grant_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    success = grant_manager.revoke_grant(db, grant_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Grant not found")
    return {"status": "success"}


@router.get("/roles")
async def list_roles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    roles = db.query(models.PermissionRole).all()
    return {"roles": [{"id": r.id, "name": r.name, "description": r.description, "is_system": r.is_system} for r in roles]}


@router.get("/permissions")
async def list_permissions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    perms = db.query(models.Permission).all()
    return {"permissions": [{"id": p.id, "name": p.name, "module": p.module, "action": p.action, "description": p.description} for p in perms]}


@router.get("/mine")
async def get_my_full_permissions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    roles = permission_engine.get_user_roles(db, current_user["user_id"])
    perms = permission_engine.get_role_permissions(db, roles)
    grants = grant_manager.get_user_grants(db, current_user["user_id"])
    quota = quota_manager.get_user_quota_summary(db, current_user["user_id"])
    return {"user_id": current_user["user_id"], "roles": roles, "permissions": sorted(list(perms)), "grants": grants, "quota": quota}
