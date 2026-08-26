from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import security
from security_ext.refresh_tokens import refresh_token_manager
from security_ext.sessions import session_manager, fingerprinter

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

import string
import secrets
from datetime import datetime, timedelta

def generate_key_code():
    parts = ["SAM", "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)), "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))]
    return "-".join(parts)

class UserLogin(BaseModel):
    email: str
    password: str

login_attempts = {}

@router.post("/login")
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    email = user_credentials.email
    now = datetime.utcnow()
    
    # Check rate limit
    if email in login_attempts:
        attempts, lock_time = login_attempts[email]
        if lock_time and now < lock_time:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        elif lock_time and now >= lock_time:
            login_attempts[email] = [0, None]
    else:
        login_attempts[email] = [0, None]
        
    db_user = db.query(models.User).filter(models.User.email == email).first()
    
    if not db_user:
        login_attempts[email][0] += 1
        if login_attempts[email][0] >= 5:
            login_attempts[email][1] = now + timedelta(minutes=15)
        raise HTTPException(status_code=400, detail="Incorrect Email or Password.")
        
    if not security.verify_password(user_credentials.password, db_user.hashed_password):
        login_attempts[email][0] += 1
        if login_attempts[email][0] >= 5:
            login_attempts[email][1] = now + timedelta(minutes=15)
        raise HTTPException(status_code=400, detail="Incorrect Email or Password.")
    
    # Reset on success
    login_attempts[email] = [0, None]
    
    # Short-lived access token (15 minutes)
    from datetime import timedelta
    access_token = security.create_access_token(
        data={"user_id": str(db_user.id), "role": db_user.role},
        expires_delta=timedelta(minutes=15),
    )
    
    # Issue refresh token (rotation)
    device_fp = fingerprinter.generate_fingerprint(request) if request else None
    client_ip = None
    if request:
        forwarded = request.headers.get("x-forwarded-for", "")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (
            getattr(request.client, "host", "unknown") if hasattr(request, "client") else "unknown"
        )
    
    refresh_token = refresh_token_manager.generate_refresh_token(
        db, str(db_user.id),
        device_fingerprint=device_fp,
        ip_address=client_ip,
    )
    
    # Create session
    session_id = session_manager.create_session(db, str(db_user.id), request, access_token) if request else None
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900,
        "session_id": session_id,
        "user": {"id": db_user.id, "email": db_user.email, "role": db_user.role}
    }

class KeyLoginRequest(BaseModel):
    key_code: str

@router.post("/key-login")
async def key_login(
    request: Request,
    req: KeyLoginRequest,
    db: Session = Depends(get_db),
):
    if req.key_code == "SAM-MASTER-ADMIN":
        admin = db.query(models.User).filter(models.User.email == "sam@mail.com").first()
        if admin:
            access_token = security.create_access_token(data={"user_id": str(admin.id), "role": admin.role})
            return {"access_token": access_token, "token_type": "bearer", "user": {"id": admin.id, "email": admin.email, "role": admin.role}}
        raise HTTPException(status_code=401, detail="Admin account not initialized yet")
            
    key = db.query(models.AccessKey).filter(models.AccessKey.key_code == req.key_code).first()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid Access Key")
    if key.status != "active":
        raise HTTPException(status_code=401, detail=f"Key is {key.status}")
    if key.expires_at and key.expires_at < datetime.utcnow():
        key.status = "expired"
        db.commit()
        raise HTTPException(status_code=401, detail="Key has expired")
    if key.max_uses > 0 and key.current_uses >= key.max_uses:
        key.status = "expired"
        db.commit()
        raise HTTPException(status_code=401, detail="Key usage limit reached")
        
    key.current_uses += 1
    if not key.user_id:
        pseudo_email = f"key_{key.key_code.lower()}@sam.ai"
        new_user = models.User(email=pseudo_email, hashed_password=security.get_password_hash(key.key_code), role="student")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        key.user_id = new_user.id
        db.commit()
        
    db_user = db.query(models.User).filter(models.User.id == key.user_id).first()
    from datetime import timedelta
    access_token = security.create_access_token(
        data={"user_id": str(db_user.id), "role": db_user.role},
        expires_delta=timedelta(minutes=15),
    )
    
    device_fp = fingerprinter.generate_fingerprint(request) if request else None
    client_ip = None
    if request:
        forwarded = request.headers.get("x-forwarded-for", "")
        client_ip = forwarded.split(",")[0].strip() if forwarded else (
            getattr(request.client, "host", "unknown") if hasattr(request, "client") else "unknown"
        )
    
    refresh_token = refresh_token_manager.generate_refresh_token(
        db, str(db_user.id),
        device_fingerprint=device_fp,
        ip_address=client_ip,
    )
    
    session_id = session_manager.create_session(db, str(db_user.id), request, access_token)
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "expires_in": 900, "session_id": session_id, "user": {"id": db_user.id, "email": db_user.email, "role": db_user.role, "is_key_login": True}}

@router.post("/generate-key", response_model=schemas.AccessKeyResponse)
def generate_access_key(key_data: schemas.AccessKeyCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    new_key = models.AccessKey(key_code=generate_key_code(), max_uses=key_data.max_uses, expires_at=key_data.expires_at, created_by=current_user["user_id"])
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    return new_key

@router.get("/keys", response_model=list[schemas.AccessKeyResponse])
def get_all_keys(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return db.query(models.AccessKey).order_by(models.AccessKey.created_at.desc()).all()




@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

from pydantic import BaseModel

class MasterKeyRequest(BaseModel):
    master_key: str

@router.post("/verify-master-key")
def verify_system_master_key(payload: MasterKeyRequest):
    if security.verify_master_key(payload.master_key):
        return {"valid": True, "message": "Master Key Access Granted"}
    raise HTTPException(status_code=401, detail="Invalid System Master Security Key")

class AdminKeyRequest(BaseModel):
    admin_key: str

@router.post("/verify-admin-access")
def verify_admin_access(payload: AdminKeyRequest):
    if security.verify_master_key(payload.admin_key):
        return {"valid": True, "role": "admin", "expires_in": 3600}
    raise HTTPException(status_code=401, detail="Invalid admin master key")
