import os
import secrets
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

IS_PRODUCTION = os.getenv("IS_PRODUCTION", "false").lower() == "true"

# JWT Settings
if IS_PRODUCTION:
    SECRET_KEY = os.environ["SECRET_KEY"]
else:
    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Zero-trust: short-lived access tokens

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the hashed password"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash of the provided password"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from jwt.exceptions import PyJWTError

# OAuth2 Scheme for Swagger UI and token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT Access Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

if IS_PRODUCTION:
    SAM_MASTER_KEY = os.environ["SAM_MASTER_KEY"]
else:
    SAM_MASTER_KEY = os.getenv("SAM_MASTER_KEY", secrets.token_urlsafe(32))

def verify_master_key(provided_key: str) -> bool:
    """Verify system master admin key"""
    if not provided_key:
        return False
    return provided_key.strip() == SAM_MASTER_KEY.strip()

def get_current_user(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False))):
    """Secure authentication dependency"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return {"user_id": user_id, "role": role}
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_optional_current_user(token: Optional[str] = Depends(OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False))):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"user_id": payload.get("user_id"), "role": payload.get("role")}
    except Exception:
        return None

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

def require_staff(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff privileges required")
    return current_user



