"""
SAM AI - LiveKit Communication Provider Adapter
"""

import time
import json
import base64
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import requests

from providers.communication.base import (
    CommunicationProvider, CommProviderCategory, CommProviderCapabilities,
    CommProviderStatus, CommRoomRequest, CommRoomResponse, CommTokenRequest,
    CommTokenResponse, CommRecordingRequest, CommRecordingResponse, CommHealthStatus
)


class LiveKitAdapter(CommunicationProvider):
    def __init__(self, **kwargs):
        super().__init__(
            provider_id=kwargs.get("provider_id", "livekit"),
            name=kwargs.get("name", "LiveKit"),
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
            recording=True,
            live_streaming=True,
            chat=False,
            token_generation=True,
            meeting=True,
            max_participants=200,
        )

    def _is_available(self) -> bool:
        url = self.credentials.get("server_url", "")
        api_key = self.credentials.get("api_key", "")
        api_secret = self.credentials.get("api_secret", "")
        if not url or not api_key or not api_secret:
            return False
        try:
            headers = {"Authorization": f"Bearer {api_key}:{api_secret}"}
            resp = requests.get(f"{url}/api/health", headers=headers, timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    def _generate_join_token(self, room_name: str, identity: str, expire_seconds: int = 3600) -> str:
        api_key = self.credentials.get("api_key", "")
        api_secret = self.credentials.get("api_secret", "")
        if not api_key or not api_secret:
            raise ValueError("LiveKit credentials not configured")

        now = datetime.utcnow()
        exp = now + timedelta(seconds=expire_seconds)
        payload = {
            "iss": api_key,
            "sub": api_key,
            "nbf": int(now.timestamp()),
            "exp": int(exp.timestamp()),
            "room": room_name,
            "identity": identity,
        }
        header = {"alg": "HS256", "typ": "JWT"}

        def b64encode(obj):
            return base64.urlsafe_b64encode(json.dumps(obj, separators=(',', ':')).encode()).rstrip(b'=').decode()

        header_b64 = b64encode(header)
        payload_b64 = b64encode(payload)
        signing_input = f"{header_b64}.{payload_b64}".encode()
        signature = base64.urlsafe_b64encode(
            hmac.new(api_secret.encode(), signing_input, digestmod='sha256').digest()
        ).rstrip(b'=').decode()

        return f"{header_b64}.{payload_b64}.{signature}"

    def create_room(self, request: CommRoomRequest) -> CommRoomResponse:
        url = self.credentials.get("server_url", "")
        api_key = self.credentials.get("api_key", "")
        api_secret = self.credentials.get("api_secret", "")
        if not url:
            return CommRoomResponse(success=False, room_id=request.room_id, provider=self.provider_id)

        try:
            token = self._generate_join_token(request.room_id, "host", 3600)
            headers = {"Authorization": f"Bearer {api_key}:{api_secret}", "Content-Type": "application/json"}
            payload = {
                "name": request.room_id,
                "max_participants": request.max_participants,
                "empty_timeout": 300,
                "metadata": json.dumps({"record": request.record, "screen_share": request.enable_screen_share}),
            }
            resp = requests.post(f"{url}/api/rooms", json=payload, headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                return CommRoomResponse(
                    success=True,
                    room_id=request.room_id,
                    provider=self.provider_id,
                    token=token,
                    expires_at=datetime.utcnow() + timedelta(hours=1),
                    join_url=f"{url}/?room={request.room_id}",
                    metadata=resp.json()
                )
        except Exception:
            pass

        return CommRoomResponse(
            success=False,
            room_id=request.room_id,
            provider=self.provider_id,
            metadata={"error": "Failed to create room"}
        )

    def delete_room(self, room_id: str) -> Dict[str, Any]:
        url = self.credentials.get("server_url", "")
        api_key = self.credentials.get("api_key", "")
        api_secret = self.credentials.get("api_secret", "")
        try:
            headers = {"Authorization": f"Bearer {api_key}:{api_secret}"}
            resp = requests.delete(f"{url}/api/rooms/{room_id}", headers=headers, timeout=10)
            return {"success": resp.status_code == 200, "room_id": room_id, "provider": self.provider_id}
        except Exception:
            return {"success": False, "room_id": room_id, "provider": self.provider_id}

    def generate_token(self, request: CommTokenRequest) -> CommTokenResponse:
        token = self._generate_join_token(request.room_id, request.user_id, request.expire_seconds)
        return CommTokenResponse(
            success=True,
            token=token,
            provider=self.provider_id,
            expires_at=datetime.utcnow() + timedelta(seconds=request.expire_seconds)
        )

    def join_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        token = self._generate_join_token(room_id, user_id, 3600)
        return {"success": True, "room_id": room_id, "user_id": user_id, "token": token, "provider": self.provider_id}

    def leave_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        return {"success": True, "room_id": room_id, "user_id": user_id, "provider": self.provider_id}

    def start_recording(self, request: CommRecordingRequest) -> CommRecordingResponse:
        recording_id = request.recording_id or f"rec_{int(time.time())}"
        return CommRecordingResponse(
            success=True,
            recording_id=recording_id,
            provider=self.provider_id,
            status="recording",
            metadata={"output_mode": request.output_mode, "resolution": request.resolution}
        )

    def stop_recording(self, recording_id: str) -> Dict[str, Any]:
        return {"success": True, "recording_id": recording_id, "provider": self.provider_id}

    def get_recording(self, recording_id: str) -> CommRecordingResponse:
        return CommRecordingResponse(
            success=True,
            recording_id=recording_id,
            provider=self.provider_id,
            status="completed",
            metadata={"file_url": None}
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
