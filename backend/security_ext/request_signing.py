"""
SAM AI - Request Signing
HMAC-based request signing for API authentication.
Prevents request tampering and replay attacks.
"""

import hmac
import hashlib
import time
from typing import Optional, Dict, Any
from urllib.parse import quote

from security import SECRET_KEY


class RequestSigner:
    def __init__(self):
        self.signing_key = SECRET_KEY
        self.accepted_clock_skew_seconds = 300

    def _get_timestamp(self) -> str:
        return str(int(time.time()))

    def _compute_signature(self, method: str, path: str, body: str, timestamp: str, nonce: str) -> str:
        content = f"{method}\n{path}\n{timestamp}\n{nonce}\n{body}"
        return hmac.new(
            self.signing_key.encode(),
            content.encode(),
            hashlib.sha256,
        ).hexdigest()

    def generate_signed_request(self, method: str, path: str, body: str = "", timestamp: str = None, nonce: str = None) -> Dict[str, str]:
        timestamp = timestamp or self._get_timestamp()
        nonce = nonce or hashlib.sha256(f"{timestamp}{body}".encode()).hexdigest()[:16]
        signature = self._compute_signature(method, path, body, timestamp, nonce)
        return {
            "X-SAM-Timestamp": timestamp,
            "X-SAM-Nonce": nonce,
            "X-SAM-Signature": signature,
        }

    def verify_request(self, request, body: str = None) -> bool:
        try:
            timestamp = request.headers.get("X-SAM-Timestamp", "")
            nonce = request.headers.get("X-SAM-Nonce", "")
            signature = request.headers.get("X-SAM-Signature", "")

            if not timestamp or not nonce or not signature:
                return False

            current_time = int(time.time())
            try:
                request_time = int(timestamp)
            except ValueError:
                return False

            if abs(current_time - request_time) > self.accepted_clock_skew_seconds:
                return False

            if body is None:
                body = ""

            expected_sig = self._compute_signature(
                request.method,
                request.url.path,
                body,
                timestamp,
                nonce,
            )

            return hmac.compare_digest(signature, expected_sig)
        except Exception:
            return False

    def generate_master_key_header(self, action: str, resource: str = "*") -> Dict[str, str]:
        timestamp = self._get_timestamp()
        nonce = hashlib.sha256(f"{timestamp}{action}{resource}".encode()).hexdigest()[:32]
        message = f"{action}:{resource}:{timestamp}:{nonce}"
        signature = hmac.new(
            self.signing_key.encode(),
            message.encode(),
            hashlib.sha256,
        ).hexdigest()
        return {
            "X-SAM-Action": action,
            "X-SAM-Resource": resource,
            "X-SAM-Timestamp": timestamp,
            "X-SAM-Nonce": nonce,
            "X-SAM-Master-Sig": signature,
        }


request_signer = RequestSigner()
