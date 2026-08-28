"""
SAM AI - WebRTC Communication Provider Adapter (Self-hosted / Mesh Fallback)
"""

import time
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from providers.communication.base import (
    CommunicationProvider, CommProviderCategory, CommProviderCapabilities,
    CommProviderStatus, CommRoomRequest, CommRoomResponse, CommTokenRequest,
    CommTokenResponse, CommRecordingRequest, CommRecordingResponse, CommHealthStatus
)


class WebRTCAdapter(CommunicationProvider):
    def __init__(self, **kwargs):
        super().__init__(
            provider_id=kwargs.get("provider_id", "webrtc"),
            name=kwargs.get("name", "WebRTC"),
            category=CommProviderCategory.RTC,
            priority=kwargs.get("priority", 100),
            enabled=kwargs.get("enabled", True),
            credentials=kwargs.get("credentials", {}),
            configuration=kwargs.get("configuration", {}),
            quota=kwargs.get("quota", {}),
        )

    def _define_capabilities(self) -> CommProviderCapabilities:
        return CommProviderCapabilities(
            video_call=True,
            audio_call=True,
            group_call=True,
            screen_share=True,
            recording=False,
            live_streaming=False,
            chat=False,
            token_generation=False,
            meeting=False,
            max_participants=10,
        )

    def _is_available(self) -> bool:
        return True

    def _generate_room_secret(self, room_id: str) -> str:
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))

    def create_room(self, request: CommRoomRequest) -> CommRoomResponse:
        secret = self._generate_room_secret(request.room_id)
        stun_url = self.configuration.get("stun_url", "stun:stun.l.google.com:19302")
        turn_url = self.configuration.get("turn_url", "")

        ice_servers = [{"urls": stun_url}]
        if turn_url:
            ice_servers.append({"urls": turn_url})

        return CommRoomResponse(
            success=True,
            room_id=request.room_id,
            provider=self.provider_id,
            provider_room_id=request.room_id,
            expires_at=datetime.utcnow() + timedelta(hours=2),
            join_url=f"webrtc://{request.room_id}",
            metadata={
                "ice_servers": ice_servers,
                "room_secret": secret,
                "max_participants": request.max_participants,
            }
        )

    def delete_room(self, room_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "provider": self.provider_id}

    def generate_token(self, request: CommTokenRequest) -> CommTokenResponse:
        token = secrets.token_urlsafe(32)
        return CommTokenResponse(
            success=True,
            token=token,
            provider=self.provider_id,
            expires_at=datetime.utcnow() + timedelta(seconds=request.expire_seconds)
        )

    def join_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        return {
            "success": True,
            "room_id": room_id,
            "user_id": user_id,
            "token": secrets.token_urlsafe(32),
            "provider": self.provider_id,
        }

    def leave_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "user_id": user_id, "provider": self.provider_id}

    def start_recording(self, request: CommRecordingRequest) -> CommRecordingResponse:
        return CommRecordingResponse(
            success=False,
            recording_id=request.recording_id or "",
            provider=self.provider_id,
            status="unsupported",
            metadata={"error": "Recording not supported by this provider"}
        )

    def stop_recording(self, recording_id: str) -> Dict[str, Any]:
        return {"success": False, "error": "Recording not supported"}

    def get_recording(self, recording_id: str) -> CommRecordingResponse:
        return CommRecordingResponse(
            success=False,
            recording_id=recording_id,
            provider=self.provider_id,
            status="unsupported"
        )

    def get_usage(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "minutes": 0,
            "participants": 0,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            }
        }
