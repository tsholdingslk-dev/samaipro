"""
SAM AI - Jitsi Communication Provider Adapter
"""

import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import requests
import jwt

from providers.communication.base import (
    CommunicationProvider, CommProviderCategory, CommProviderCapabilities,
    CommProviderStatus, CommRoomRequest, CommRoomResponse, CommTokenRequest,
    CommTokenResponse, CommRecordingRequest, CommRecordingResponse, CommHealthStatus
)


class JitsiAdapter(CommunicationProvider):
    def __init__(self, **kwargs):
        super().__init__(
            provider_id=kwargs.get("provider_id", "jitsi"),
            name=kwargs.get("name", "Jitsi"),
            category=CommProviderCategory.RTC,
            priority=kwargs.get("priority", 1),
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
            chat=True,
            token_generation=True,
            meeting=True,
            max_participants=100,
        )

    def _is_available(self) -> bool:
        domain = self.credentials.get("domain", "") or self.configuration.get("domain", "meet.jit.si")
        try:
            resp = requests.get(f"https://{domain}/http-bind", timeout=5, allow_redirects=True)
            return resp.status_code in (200, 302, 404)
        except Exception:
            return False

    def _generate_jitsi_token(self, room_name: str, user_id: str, user_name: str, expire_seconds: int = 3600) -> str:
        app_id = self.credentials.get("app_id", "samai")
        secret = self.credentials.get("app_secret", "")
        if not secret:
            return ""

        now = datetime.utcnow()
        payload = {
            "aud": "jitsi",
            "iss": app_id,
            "sub": app_id,
            "room": room_name,
            "exp": int((now + timedelta(seconds=expire_seconds)).timestamp()),
            "nbf": int(now.timestamp()),
            "context": {
                "user": {
                    "id": user_id,
                    "name": user_name,
                }
            }
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        return token

    def create_room(self, request: CommRoomRequest) -> CommRoomResponse:
        domain = self.configuration.get("domain", "meet.jit.si")
        token = self._generate_jitsi_token(request.room_id, "host", "Host", 3600)

        return CommRoomResponse(
            success=True,
            room_id=request.room_id,
            provider=self.provider_id,
            provider_room_id=request.room_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            join_url=f"https://{domain}/{request.room_id}",
            metadata={
                "domain": domain,
                "record": request.record,
                "max_participants": request.max_participants,
            }
        )

    def delete_room(self, room_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "provider": self.provider_id}

    def generate_token(self, request: CommTokenRequest) -> CommTokenResponse:
        token = self._generate_jitsi_token(request.room_id, request.user_id, request.user_name, request.expire_seconds)
        return CommTokenResponse(
            success=True,
            token=token,
            provider=self.provider_id,
            expires_at=datetime.utcnow() + timedelta(seconds=request.expire_seconds)
        )

    def join_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        token = self._generate_jitsi_token(room_id, user_id, f"User_{user_id}", 3600)
        return {"success": True, "room_id": room_id, "user_id": user_id, "token": token, "provider": self.provider_id}

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
