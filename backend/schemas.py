from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    role: Optional[str] = "student"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Access Key Schemas ---
class AccessKeyBase(BaseModel):
    max_uses: Optional[int] = 1
    expires_at: Optional[datetime] = None

class AccessKeyCreate(AccessKeyBase):
    pass

class AccessKeyResponse(AccessKeyBase):
    id: str
    key_code: str
    status: str
    current_uses: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Project Schemas ---
class ProjectBase(BaseModel):
    title: str
    type: Optional[str] = "general"

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatBase(BaseModel):
    role: str
    content: str

class ChatCreate(ChatBase):
    project_id: str

class ChatResponse(ChatBase):
    id: str
    project_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- API Provider Schemas ---
class APIProviderBase(BaseModel):
    name: str
    api_key: str
    base_url: str
    model: str
    priority: Optional[int] = 1
    quota_limit: Optional[int] = 1000

class APIProviderCreate(APIProviderBase):
    pass

class APIProviderResponse(APIProviderBase):
    id: str
    status: str
    quota_used: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Module Schemas ---
class ModuleBase(BaseModel):
    module_type: str
    config: Optional[str] = None
    enabled: Optional[bool] = True

class ModuleCreate(ModuleBase):
    project_id: str

class ModuleResponse(ModuleBase):
    id: str
    project_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Lead Generation Schemas ---
class LeadSearchRequest(BaseModel):
    query: str # e.g. "Nearby Restaurants", "Salons", "Plumbers"
    city: str # e.g. "Chennai", "Madurai", "Coimbatore"
    filter_no_website: Optional[bool] = True
    filter_outdated_website: Optional[bool] = True

class LeadBase(BaseModel):
    business_name: str
    category: Optional[str] = "General Business"
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    rating: Optional[str] = "0.0"
    review_count: Optional[str] = "0"
    website: Optional[str] = None
    website_status: Optional[str] = "missing"
    demo_url: Optional[str] = None
    demo_data: Optional[str] = None
    outreach_status: Optional[str] = "new"

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: str
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DemoSiteGenerateRequest(BaseModel):
    lead_id: str
    template_theme: Optional[str] = "modern_dark" # modern_dark, warm_restaurant, elegant_salon, professional_service
    custom_tagline: Optional[str] = None

class ProposalGenerateRequest(BaseModel):
    lead_id: str
    language: Optional[str] = "tamil" # tamil, english, bilingual
    sender_name: Optional[str] = "SAM AI Automation Studio"
    sender_phone: Optional[str] = "9876543210"

# --- Telegram Bot Schemas ---
class TelegramWebhookSetup(BaseModel):
    webhook_url: str

class StaffKeyRequest(BaseModel):
    duration: str = "7d"  # 24h, 7d, 14d, 30d
    max_uses: Optional[int] = 100

# --- Admin Key Rotation Schemas ---
class AdminKeyRotationResponse(BaseModel):
    id: str
    rotated_by: str
    rotated_at: datetime
    class Config:
        from_attributes = True

# --- Staff Payment Schemas ---
class PaymentVerificationCreate(BaseModel):
    access_key_id: str
    payment_slip_url: str

class PaymentVerificationResponse(BaseModel):
    id: str
    access_key_id: str
    payment_slip_url: str
    verification_status: str
    created_at: datetime
    class Config:
        from_attributes = True

