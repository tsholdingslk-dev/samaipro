import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Float
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
