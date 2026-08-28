"""
SAM AI - Communication Cloud Router
Unified API for RTC, Video, Chat, Meetings, Recordings, and Providers.
"""

import json
import secrets
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
import models
import schemas
import security
from security_ext.audit import audit_logger

router = APIRouter(
    prefix="/communication",
    tags=["Communication Cloud"]
)


# ============== PROVIDER MANAGEMENT ==============

@router.get("/providers", response_model=List[schemas.CommProviderResponse])
def get_communication_providers(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ("admin", "staff"):
        raise HTTPException(status_code=403, detail="Admin or staff only")
    providers = db.query(models.CommProvider).order_by(models.CommProvider.priority).all()
    return providers


@router.post("/providers", response_model=schemas.CommProviderResponse)
def create_communication_provider(provider: schemas.CommProviderCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    capabilities = json.dumps({})

    db_provider = models.CommProvider(
        provider_id=provider.provider_id,
        name=provider.name,
        category=provider.category,
        priority=provider.priority or 1,
        enabled="true" if provider.enabled else "false",
        capabilities=capabilities,
        credentials_encrypted=provider.credentials,
        configuration=provider.configuration,
        quota=provider.quota,
    )
    db.add(db_provider)
    db.commit()
    db.refresh(db_provider)

    audit_logger.log_request(
        db=db, request=Request({"type": "http", "method": "POST", "path": "/communication/providers"}),
        user_id=current_user["user_id"], action="create", resource=f"comm_provider:{provider.provider_id}",
        method="POST", status_code=200, duration_ms=0
    )

    return db_provider


# ============== ROOM MANAGEMENT ==============

@router.post("/rooms", response_model=schemas.CommRoomResponse)
def create_room(request: Request, room: schemas.CommRoomCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    project_id = request.query_params.get("project_id") or request.headers.get("X-Project-ID")
    if not project_id:
        project = db.query(models.Project).filter(models.Project.user_id == current_user["user_id"]).first()
        project_id = project.id if project else None

    db_room = models.CommRoom(
        room_id=room.room_id,
        project_id=project_id,
        user_id=current_user["user_id"],
        room_type=room.room_type,
        name=room.name,
        max_participants=room.max_participants,
        record="true" if room.record else "false",
        enable_chat="true" if room.enable_chat else "false",
        enable_screen_share="true" if room.enable_screen_share else "false",
        room_metadata=json.dumps({}),
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)

    audit_logger.log_request(
        db=db, request=request, user_id=current_user["user_id"], action="create", resource=f"comm_room:{room.room_id}",
        method="POST", status_code=200, duration_ms=0
    )

    return db_room


@router.get("/rooms", response_model=List[schemas.CommRoomResponse])
def get_rooms(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    rooms = db.query(models.CommRoom).order_by(models.CommRoom.created_at.desc()).limit(100).all()
    return rooms


@router.get("/rooms/{room_id}", response_model=schemas.CommRoomResponse)
def get_room(room_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("/rooms/{room_id}/join", response_model=schemas.CommRoomJoinResponse)
def join_room(room_id: str, request: Request, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    provider = comm_registry.get_provider(room.provider)
    if not provider:
        raise HTTPException(status_code=500, detail="Provider not configured")

    result = provider.join_room(room_id, current_user["user_id"])
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Failed to join room")

    participant = models.CommParticipant(
        room_id=room.id,
        user_id=current_user["user_id"],
        user_name=current_user.get("email", "User"),
        role="publisher",
    )
    db.add(participant)
    db.commit()

    audit_logger.log_request(
        db=db, request=request, user_id=current_user["user_id"], action="join", resource=f"comm_room:{room_id}",
        method="POST", status_code=200, duration_ms=0
    )

    return schemas.CommRoomJoinResponse(
        success=True,
        room_id=room_id,
        token=result["token"],
        provider=room.provider,
        expires_at=schemas.CommTokenResponse(
            success=True,
            token=result["token"],
            provider=room.provider,
            expires_at=schemas.datetime.utcnow() + __import__('datetime').timedelta(hours=1)
        ).expires_at
    )


@router.post("/rooms/{room_id}/leave")
def leave_room(room_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    participant = db.query(models.CommParticipant).filter(
        models.CommParticipant.room_id == room.id,
        models.CommParticipant.user_id == current_user["user_id"],
        models.CommParticipant.is_active == "true"
    ).first()

    if participant:
        participant.is_active = "false"
        participant.left_at = __import__('datetime').datetime.utcnow()
        db.commit()

    return {"success": True}


@router.delete("/rooms/{room_id}")
def delete_room(room_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    provider = comm_registry.get_provider(room.provider)
    if provider:
        provider.delete_room(room_id)

    db.delete(room)
    db.commit()

    return {"success": True}


# ============== TOKEN SERVICE ==============

class TokenGenerateRequest(BaseModel):
    room_id: str
    user_name: Optional[str] = None
    role: str = "publisher"
    expire_seconds: int = 3600


class TokenGenerateResponse(BaseModel):
    success: bool
    token: str
    provider: str
    expires_at: __import__('datetime').datetime


@router.post("/tokens/rtc", response_model=schemas.CommTokenResponse)
def generate_rtc_token(req: TokenGenerateRequest, request: Request, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == req.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    provider = comm_registry.get_provider(room.provider)
    if not provider:
        raise HTTPException(status_code=500, detail="Provider not configured")

    from providers.communication.base import CommTokenRequest
    token_req = CommTokenRequest(
        room_id=req.room_id,
        user_id=current_user["user_id"],
        user_name=req.user_name or current_user.get("email", "User"),
        role=req.role,
        expire_seconds=req.expire_seconds,
    )

    result = provider.generate_token(token_req)
    if not result.success:
        raise HTTPException(status_code=500, detail="Token generation failed")

    audit_logger.log_request(
        db=db, request=request, user_id=current_user["user_id"], action="generate_token", resource=f"comm_room:{req.room_id}",
        method="POST", status_code=200, duration_ms=0
    )

    return schemas.CommTokenResponse(
        success=True,
        token=result.token,
        provider=result.provider,
        expires_at=result.expires_at
    )


# ============== MEETINGS ==============

@router.post("/meetings", response_model=schemas.CommMeetingResponse)
def create_meeting(meeting: schemas.CommMeetingCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    db_meeting = models.CommMeeting(
        meeting_id=meeting.meeting_id,
        user_id=current_user["user_id"],
        provider="livekit",
        title=meeting.title,
        password=meeting.password,
        max_participants=meeting.max_participants,
        record="true" if meeting.record else "false",
        waiting_room="true" if meeting.waiting_room else "false",
        status="scheduled",
        co_host_ids=json.dumps([]),
        meeting_metadata=json.dumps({}),
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting


@router.get("/meetings", response_model=List[schemas.CommMeetingResponse])
def get_meetings(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    meetings = db.query(models.CommMeeting).order_by(models.CommMeeting.created_at.desc()).limit(100).all()
    return meetings


@router.get("/meetings/{meeting_id}", response_model=schemas.CommMeetingResponse)
def get_meeting(meeting_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    meeting = db.query(models.CommMeeting).filter(models.CommMeeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/meetings/{meeting_id}/join", response_model=schemas.CommMeetingJoinResponse)
def join_meeting(meeting_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    meeting = db.query(models.CommMeeting).filter(models.CommMeeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    participant = models.CommMeetingParticipant(
        meeting_id=meeting.id,
        user_id=current_user["user_id"],
        user_name=current_user.get("email", "User"),
        role="attendee",
        joined_at=__import__('datetime').datetime.utcnow(),
        is_active="true",
    )
    db.add(participant)
    meeting.participant_count = db.query(models.CommMeetingParticipant).filter(
        models.CommMeetingParticipant.meeting_id == meeting.id,
        models.CommMeetingParticipant.is_active == "true"
    ).count()
    db.commit()

    join_token = secrets.token_urlsafe(32)
    join_url = f"/modules/communication-cloud/meetings/{meeting_id}"

    return schemas.CommMeetingJoinResponse(
        success=True,
        meeting_id=meeting_id,
        token=join_token,
        provider=meeting.provider,
        join_url=join_url,
    )


@router.post("/meetings/{meeting_id}/end")
def end_meeting(meeting_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    meeting = db.query(models.CommMeeting).filter(models.CommMeeting.meeting_id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting.status = "ended"
    meeting.ended_at = __import__('datetime').datetime.utcnow()
    db.commit()
    return {"success": True}


# ============== RECORDINGS ==============

@router.post("/recordings/start")
def start_recording(room_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    room = db.query(models.CommRoom).filter(models.CommRoom.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    provider = comm_registry.get_provider(room.provider)
    if not provider:
        raise HTTPException(status_code=500, detail="Provider not configured")

    from providers.communication.base import CommRecordingRequest
    rec_req = CommRecordingRequest(room_id=room_id)
    result = provider.start_recording(rec_req)

    recording = models.CommRecording(
        recording_id=result.recording_id,
        project_id=room.project_id,
        room_id=room.id,
        provider=result.provider,
        status=result.status,
        recording_metadata=json.dumps(result.metadata),
    )
    db.add(recording)
    db.commit()

    return {"success": result.success, "recording_id": result.recording_id}


@router.post("/recordings/stop")
def stop_recording(recording_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    recording = db.query(models.CommRecording).filter(models.CommRecording.recording_id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")

    provider = comm_registry.get_provider(recording.provider)
    if provider:
        provider.stop_recording(recording_id)

    recording.status = "completed"
    recording.completed_at = __import__('datetime').datetime.utcnow()
    db.commit()

    return {"success": True, "recording_id": recording_id}


@router.get("/recordings", response_model=List[schemas.CommRecordingResponse])
def get_recordings(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    recordings = db.query(models.CommRecording).order_by(models.CommRecording.created_at.desc()).limit(100).all()
    return recordings


# ============== WEBHOOKS ==============

@router.post("/webhooks", response_model=schemas.CommWebhookResponse)
def create_webhook(webhook: schemas.CommWebhookCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    db_webhook = models.CommWebhook(
        user_id=current_user["user_id"],
        url=webhook.url,
        secret=webhook.secret,
        events=webhook.events,
    )
    db.add(db_webhook)
    db.commit()
    db.refresh(db_webhook)
    return db_webhook


@router.get("/webhooks", response_model=List[schemas.CommWebhookResponse])
def get_webhooks(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    webhooks = db.query(models.CommWebhook).order_by(models.CommWebhook.created_at.desc()).limit(100).all()
    return webhooks


@router.delete("/webhooks/{webhook_id}")
def delete_webhook(webhook_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    webhook = db.query(models.CommWebhook).filter(models.CommWebhook.id == webhook_id).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    db.delete(webhook)
    db.commit()
    return {"success": True}


# ============== API KEYS ==============

def generate_api_key_code(prefix: str = "SAM-COMM") -> str:
    parts = [prefix, "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)), "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))]
    return "-".join(parts)


@router.post("/api-keys", response_model=schemas.CommAPIKeyResponse)
def create_api_key(key_data: schemas.CommAPIKeyCreate, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    key_code = generate_api_key_code()
    secret_key = secrets.token_urlsafe(32)

    db_key = models.CommAPIKey(
        user_id=current_user["user_id"],
        key_type=key_data.key_type,
        key_code=key_code,
        key_hash=security.get_password_hash(secret_key),
        name=key_data.name,
        scopes=key_data.scopes,
        environment=key_data.environment,
        ip_whitelist=key_data.ip_whitelist,
    )
    db.add(db_key)
    db.commit()
    db.refresh(db_key)

    return schemas.CommAPIKeyResponse(
        id=db_key.id,
        key_code=db_key.key_code,
        secret_key=secret_key,
        name=db_key.name,
        key_type=db_key.key_type,
        scopes=db_key.scopes,
        environment=db_key.environment,
        ip_whitelist=db_key.ip_whitelist,
        expires_at=db_key.expires_at,
        last_used=db_key.last_used,
        revoked=db_key.revoked == "true",
        created_at=db_key.created_at,
    )


@router.get("/api-keys", response_model=List[schemas.CommAPIKeyResponse])
def get_api_keys(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    keys = db.query(models.CommAPIKey).order_by(models.CommAPIKey.created_at.desc()).limit(100).all()
    return [
        schemas.CommAPIKeyResponse(
            id=k.id,
            key_code=k.key_code,
            secret_key=None,
            name=k.name,
            key_type=k.key_type,
            scopes=k.scopes,
            environment=k.environment,
            ip_whitelist=k.ip_whitelist,
            expires_at=k.expires_at,
            last_used=k.last_used,
            revoked=k.revoked == "true",
            created_at=k.created_at,
        )
        for k in keys
    ]


@router.delete("/api-keys/{key_id}")
def revoke_api_key(key_id: str, current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    db_key = db.query(models.CommAPIKey).filter(models.CommAPIKey.id == key_id).first()
    if not db_key:
        raise HTTPException(status_code=404, detail="API Key not found")
    db_key.revoked = "true"
    db.commit()
    return {"success": True}


# ============== USAGE & QUOTAS ==============

@router.get("/usage", response_model=List[schemas.CommUsageEventResponse])
def get_usage(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    events = db.query(models.CommUsageEvent).order_by(models.CommUsageEvent.created_at.desc()).limit(100).all()
    return events


@router.get("/quotas", response_model=List[schemas.CommQuotaResponse])
def get_quotas(current_user: dict = Depends(security.get_current_user), db: Session = Depends(get_db)):
    quotas = db.query(models.CommQuota).order_by(models.CommQuota.created_at.desc()).limit(100).all()
    return quotas
