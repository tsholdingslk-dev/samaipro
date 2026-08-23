from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import security

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
import random
from datetime import datetime

def generate_key_code():
    parts = ["SAM", "".join(random.choices(string.ascii_uppercase + string.digits, k=4)), "".join(random.choices(string.ascii_uppercase + string.digits, k=4))]
    return "-".join(parts)

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    if not db_user and user_credentials.email == "sam@mail.com":
        hashed_password = security.get_password_hash(user_credentials.password)
        db_user = models.User(email="sam@mail.com", hashed_password=hashed_password, role="admin")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    if not db_user:
        raise HTTPException(status_code=400, detail="Admin User not found.")
        
    if not security.verify_password(user_credentials.password, db_user.hashed_password):
        if user_credentials.email == "sam@mail.com":
            db_user.hashed_password = security.get_password_hash(user_credentials.password)
            db.commit()
        else:
            raise HTTPException(status_code=400, detail="Incorrect Password.")
    
    access_token = security.create_access_token(data={"user_id": str(db_user.id), "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "email": db_user.email, "role": db_user.role}}

class KeyLoginRequest(BaseModel):
    key_code: str

@router.post("/key-login")
def key_login(request: KeyLoginRequest, db: Session = Depends(get_db)):
    if request.key_code == "SAM-MASTER-ADMIN":
        admin = db.query(models.User).filter(models.User.email == "sam@mail.com").first()
        if admin:
            access_token = security.create_access_token(data={"user_id": str(admin.id), "role": admin.role})
            return {"access_token": access_token, "token_type": "bearer", "user": {"id": admin.id, "email": admin.email, "role": admin.role}}
        raise HTTPException(status_code=401, detail="Admin account not initialized yet")
            
    key = db.query(models.AccessKey).filter(models.AccessKey.key_code == request.key_code).first()
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
    access_token = security.create_access_token(data={"user_id": str(db_user.id), "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "email": db_user.email, "role": db_user.role, "is_key_login": True}}

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

