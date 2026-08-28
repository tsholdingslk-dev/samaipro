import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="student") # admin, student, teacher, creator
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"))
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False) # education, coding, creator
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="projects")
    chats = relationship("Chat", back_populates="project")

class Chat(Base):
    __tablename__ = "chats"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    role = Column(String(50), nullable=False) # user or assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="chats")

class AccessKey(Base):
    __tablename__ = "access_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key_code = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(20), default="active") # active, expired, revoked
    max_uses = Column(Integer, default=1)
    current_uses = Column(Integer, default=0)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True) # admin ID
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    
    # New Telegram Bot Fields
    key_type = Column(String(20), default="staff")  # 'admin', 'staff', 'trial'
    duration_label = Column(String(20), nullable=True)  # '24h', '7d', '14d', '30d'
    payment_verified = Column(String(10), default="false")
    telegram_chat_id = Column(String(50), nullable=True)

    # Map a key to a specific pseudo-user so they retain chat history
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

class APIProvider(Base):
    __tablename__ = "api_providers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)  # e.g., "InferX", "OpenRouter", "Groq"
    api_key = Column(String(255), nullable=False)
    base_url = Column(String(255), nullable=False)
    model = Column(String(100), nullable=False)
    status = Column(String(50), default="active")  # active, rate_limited, error, inactive
    priority = Column(String(10), default="1")
    quota_used = Column(String(20), default="0")
    quota_limit = Column(String(20), default="1000")
    created_at = Column(DateTime, default=datetime.utcnow)

class Module(Base):
    __tablename__ = "modules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"))
    module_type = Column(String(50), nullable=False)  # pdf, coding, translation, media, voice
    config = Column(Text)  # JSON config
    enabled = Column(String(10), default="true")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", backref="modules")

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    business_name = Column(String(255), nullable=False)
    category = Column(String(100), default="General Business")
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    rating = Column(String(20), default="0.0")
    review_count = Column(String(20), default="0")
    website = Column(String(500), nullable=True)
    website_status = Column(String(50), default="missing") # missing, outdated, active
    demo_url = Column(String(500), nullable=True)
    demo_data = Column(Text, nullable=True) # JSON store for demo site content
    outreach_status = Column(String(50), default="new") # new, demo_created, proposal_sent, converted
    created_at = Column(DateTime, default=datetime.utcnow)

class UserPreferenceDB(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), index=True)
    preference_type = Column(String(50))
    preference_value = Column(String(255))
    confidence = Column(Float, default=1.0)
    last_updated = Column(DateTime, default=datetime.utcnow)

class UserKnowledgeDB(Base):
    __tablename__ = "user_knowledge"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), index=True)
    source = Column(String(255))
    content = Column(Text)
    metadata_json = Column(Text)
    usage_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    trust_level = Column(String(20), default="user_submitted")
    version = Column(Integer, default=1)
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    chunk_index = Column(Integer, default=0)

class ProjectDocumentDB(Base):
    __tablename__ = "project_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), index=True)
    doc_id = Column(String(255), index=True)
    text = Column(Text, nullable=False)
    metadata_json = Column(Text)
    embedding_json = Column(Text) # JSON serialized list of floats
    timestamp = Column(DateTime, default=datetime.utcnow)

class AdminKeyRotation(Base):
    __tablename__ = "admin_key_rotations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    old_key_hash = Column(String(255))  # bcrypt hash of old key (never store plaintext)
    new_key_hash = Column(String(255))  # bcrypt hash of new key
    rotated_by = Column(String(50))  # 'telegram_bot', 'cron', 'manual'
    telegram_chat_id = Column(String(50), nullable=True)
    rotated_at = Column(DateTime, default=datetime.utcnow)

class StaffPaymentVerification(Base):
    __tablename__ = "staff_payment_verifications"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    access_key_id = Column(String(36), ForeignKey("access_keys.id"))
    payment_slip_url = Column(String(500))
    verified_by = Column(String(36), nullable=True)
    verification_status = Column(String(20), default="pending")  # pending, approved, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    token_hash = Column(String(255), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)
    device_fingerprint = Column(String(255), nullable=True)
    ip_address = Column(String(100), nullable=True)

    user = relationship("User", backref="refresh_tokens")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(255), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    access_token_hash = Column(String(255), nullable=False)
    device_fingerprint = Column(String(255), nullable=False)
    device_info = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=False)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)

    user = relationship("User", backref="sessions")


class APIScope(Base):
    __tablename__ = "api_scopes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key_code = Column(String(255), unique=True, nullable=False)
    key_hash = Column(String(255), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    scopes = Column(Text, nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    revoked = Column(Boolean, default=False)

    user = relationship("User", backref="api_keys")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(255), nullable=True)
    method = Column(String(20), nullable=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    risk_score = Column(Float, default=0.0)
    request_body_size = Column(Integer, default=0)
    response_status = Column(Integer, nullable=True)
    duration_ms = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class AdminTwoFactor(Base):
    __tablename__ = "admin_two_factors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    secret_encrypted = Column(Text, nullable=False)
    recovery_codes = Column(Text, nullable=True)
    enabled = Column(Boolean, default=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)

    user = relationship("User", backref="two_factor")


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), nullable=False)
    user_id = Column(String(36), nullable=True)
    ip_address = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    details = Column(Text, nullable=True)
    severity = Column(String(20), default="info")
    action_taken = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class SecuritySetting(Base):
    __tablename__ = "security_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(50), nullable=True)


class PermissionRole(Base):
    __tablename__ = "permission_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    permissions = relationship("RolePermission", backref="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), unique=True, nullable=False)
    module = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("permission_roles.id"), nullable=False)
    permission_id = Column(String(36), ForeignKey("permissions.id"), nullable=False)
    granted_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role_id = Column(String(36), ForeignKey("permission_roles.id"), nullable=False)
    assigned_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)


class PermissionGrant(Base):
    __tablename__ = "permission_grants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    module = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    usage_limit = Column(Integer, nullable=False, default=0)
    time_limit_hours = Column(Integer, nullable=False, default=0)
    current_usage = Column(Integer, default=0)
    used_at = Column(DateTime, nullable=True)
    period_start = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    granted_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    granted_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class UsageQuota(Base):
    __tablename__ = "usage_quotas"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    module = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    count = Column(Integer, default=0)
    limit = Column(Integer, default=0)
class AgentMemory(Base):
    __tablename__ = "agent_memories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), index=True)
    memory_type = Column(String(50)) # task, finance, reminder, general
    content = Column(Text)
    status = Column(String(50), default="pending") # pending, completed
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    due_date = Column(DateTime(timezone=True), nullable=True)


class CommProvider(Base):
    __tablename__ = "comm_providers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    provider_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    status = Column(String(50), default="active")
    enabled = Column(String(10), default="true")
    priority = Column(Integer, default=1)
    capabilities = Column(Text)
    credentials_encrypted = Column(Text, nullable=True)
    configuration = Column(Text)
    quota = Column(Text)
    health_status = Column(String(50), default="unknown")
    last_health_check = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CommRoom(Base):
    __tablename__ = "comm_rooms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_id = Column(String(100), unique=True, nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    provider = Column(String(100), nullable=False)
    provider_room_id = Column(String(255), nullable=True)
    room_type = Column(String(50), default="video")
    name = Column(String(255), nullable=True)
    max_participants = Column(Integer, default=10)
    record = Column(String(10), default="false")
    enable_chat = Column(String(10), default="true")
    enable_screen_share = Column(String(10), default="true")
    status = Column(String(50), default="active")
    room_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    project = relationship("Project", backref="comm_rooms")


class CommParticipant(Base):
    __tablename__ = "comm_participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_id = Column(String(36), ForeignKey("comm_rooms.id"), nullable=False)
    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), nullable=True)
    role = Column(String(50), default="publisher")
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(String(10), default="true")

    room = relationship("CommRoom", backref="participants")


class CommMeeting(Base):
    __tablename__ = "comm_meetings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(100), unique=True, nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    provider = Column(String(100), nullable=False)
    title = Column(String(255), nullable=True)
    password = Column(String(100), nullable=True)
    host_id = Column(String(36), nullable=True)
    co_host_ids = Column(Text)
    participant_count = Column(Integer, default=0)
    max_participants = Column(Integer, default=100)
    record = Column(String(10), default="false")
    waiting_room = Column(String(10), default="true")
    status = Column(String(50), default="scheduled")
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    meeting_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="comm_meetings")


class CommMeetingParticipant(Base):
    __tablename__ = "comm_meeting_participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("comm_meetings.id"), nullable=False)
    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), nullable=True)
    role = Column(String(50), default="attendee")
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(String(10), default="true")

    meeting = relationship("CommMeeting", backref="meeting_participants")


class CommRecording(Base):
    __tablename__ = "comm_recordings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recording_id = Column(String(100), unique=True, nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    room_id = Column(String(36), ForeignKey("comm_rooms.id"), nullable=True)
    meeting_id = Column(String(36), ForeignKey("comm_meetings.id"), nullable=True)
    provider = Column(String(100), nullable=False)
    status = Column(String(50), default="started")
    duration = Column(Integer, default=0)
    file_url = Column(String(500), nullable=True)
    storage_provider = Column(String(100), nullable=True)
    size_bytes = Column(Integer, default=0)
    recording_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    project = relationship("Project", backref="comm_recordings")
    room = relationship("CommRoom", backref="recordings")
    meeting = relationship("CommMeeting", backref="recordings")


class CommWebhook(Base):
    __tablename__ = "comm_webhooks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    url = Column(String(500), nullable=False)
    secret = Column(String(255), nullable=True)
    events = Column(Text)
    status = Column(String(50), default="active")
    last_delivery_at = Column(DateTime, nullable=True)
    failure_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="comm_webhooks")


class CommWebhookDelivery(Base):
    __tablename__ = "comm_webhook_deliveries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    webhook_id = Column(String(36), ForeignKey("comm_webhooks.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text)
    status = Column(String(50), default="pending")
    response_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    attempts = Column(Integer, default=0)
    next_attempt_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    webhook = relationship("CommWebhook", backref="deliveries")


class CommUsageEvent(Base):
    __tablename__ = "comm_usage_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    provider = Column(String(100), nullable=False)
    service = Column(String(100), nullable=False)
    request_id = Column(String(100), nullable=True)
    duration = Column(Integer, default=0)
    status = Column(String(50), default="success")
    usage_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="usage_events")


class CommQuota(Base):
    __tablename__ = "comm_quotas"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    provider = Column(String(100), nullable=False)
    quota_type = Column(String(100), nullable=False) # monthly_minutes, monthly_requests, concurrent_rooms
    limit_value = Column(Integer, default=0)
    used_value = Column(Integer, default=0)
    warning_threshold = Column(Integer, default=80)
    period_start = Column(DateTime, default=datetime.utcnow)
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", backref="comm_quotas")


class CommAPIToken(Base):
    __tablename__ = "comm_api_tokens"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    token_type = Column(String(50), default="rtc") # rtc, chat, meeting
    token_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    scopes = Column(Text)
    expires_at = Column(DateTime, nullable=True)
    last_used = Column(DateTime, nullable=True)
    revoked = Column(String(10), default="false")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="comm_api_tokens")


class CommAPIKey(Base):
    __tablename__ = "comm_api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    user_id = Column(String(36), nullable=True)
    key_type = Column(String(50), default="public") # public, secret, server, webhook
    key_code = Column(String(255), unique=True, nullable=False, index=True)
    key_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    scopes = Column(Text)
    environment = Column(String(50), default="development")
    ip_whitelist = Column(Text)
    expires_at = Column(DateTime, nullable=True)
    last_used = Column(DateTime, nullable=True)
    revoked = Column(String(10), default="false")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", backref="comm_api_keys")


class CommAITranscript(Base):
    __tablename__ = "comm_ai_transcripts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    room_id = Column(String(36), ForeignKey("comm_rooms.id"), nullable=True)
    meeting_id = Column(String(36), ForeignKey("comm_meetings.id"), nullable=True)
    provider = Column(String(100), nullable=False)
    language = Column(String(20), default="en")
    content = Column(Text)
    segments = Column(Text)
    transcript_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class CommAISummary(Base):
    __tablename__ = "comm_ai_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    room_id = Column(String(36), ForeignKey("comm_rooms.id"), nullable=True)
    meeting_id = Column(String(36), ForeignKey("comm_meetings.id"), nullable=True)
    transcript_id = Column(String(36), ForeignKey("comm_ai_transcripts.id"), nullable=True)
    provider = Column(String(100), nullable=False)
    summary = Column(Text)
    action_items = Column(Text)
    key_points = Column(Text)
    sentiment = Column(String(50))
    summary_metadata = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

