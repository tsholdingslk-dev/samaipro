from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import get_db
from security import get_current_user, require_admin
from security_ext.secrets import secret_manager, SecretType

router = APIRouter(
    prefix="/secrets",
    tags=["Secret Management"]
)


class StoreSecretRequest(BaseModel):
    name: str
    value: str
    secret_type: str = "custom"
    provider: Optional[str] = None
    expires_at: Optional[str] = None
    scope: Optional[str] = "user"


class RotationRequest(BaseModel):
    new_value: str


@router.post("/")
async def store_secret(
    request: StoreSecretRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Store a secret (API key, token, etc.)."""
    try:
        secret_type = SecretType(request.secret_type)
    except ValueError:
        secret_type = SecretType.CUSTOM

    expires_at = datetime.fromisoformat(request.expires_at) if request.expires_at else None

    result = secret_manager.store_secret(
        db=db,
        user_id=current_user["user_id"],
        name=request.name,
        value=request.value,
        secret_type=secret_type,
        provider=request.provider,
        expires_at=expires_at,
        scope=request.scope,
    )
    return {"status": "success", "data": result}


@router.get("/")
async def list_secrets(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List current user's secrets."""
    secrets = secret_manager.list_user_secrets(db, current_user["user_id"])
    return {"secrets": secrets}


@router.post("/{secret_id}/retrieve")
async def retrieve_secret(
    secret_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a secret's value."""
    value = secret_manager.retrieve_secret(db, secret_id, current_user["user_id"])
    if value is None:
        raise HTTPException(status_code=404, detail="Secret not found or access denied")
    return {"value": value}


@router.post("/{secret_id}/rotate")
async def rotate_secret(
    secret_id: str,
    rotation: RotationRequest,
    db=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Rotate (change) a secret's value."""
    result = secret_manager.rotate_secret(db, secret_id, rotation.new_value, current_user["user_id"])
    if result["status"] == "error":
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@router.delete("/{secret_id}")
async def delete_secret(
    secret_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    success = secret_manager.delete_secret(db, secret_id, current_user["user_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Secret not found")
    return {"status": "success", "message": "Secret deleted"}


@router.get("/expiring")
async def get_expiring_secrets(
    days: int = 7,
    db=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get secrets that are about to expire."""
    return {"expiring": secret_manager.check_expiring_secrets(db, days)}


@router.post("/redact")
async def redact_text(
    text: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    """Test secret redaction in text."""
    return {"redacted": secret_manager.redact_secrets(text)}


@router.get("/types")
async def get_secret_types(
    current_user: dict = Depends(get_current_user),
):
    return {"types": [t.value for t in SecretType]}


@router.get("/provider/{provider}")
async def get_provider_credentials(
    provider: str,
    db=Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Get all credentials for a provider (admin only, redacted)."""
    creds = secret_manager.get_provider_credentials(db, provider)
    redacted = {k: secret_manager.redact_secrets(v)[:16] + "..." for k, v in creds.items()}
    return {"provider": provider, "credentials": redacted}
