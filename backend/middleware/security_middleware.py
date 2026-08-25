import uuid
import os
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from fastapi import FastAPI

IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Request-ID"] = request_id
        
        if IS_PRODUCTION:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response

class ResponseSanitizationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.sensitive_models = ["deepseek-v4-flash", "gemini-1.5-pro", "gpt-4", "gpt-3.5"]
        self.generic_model_name = "sam-ai-model"

    async def dispatch(self, request: Request, call_next):
        if not IS_PRODUCTION:
            return await call_next(request)

        response = await call_next(request)
        
        # We only sanitize application/json responses
        if response.headers.get("content-type") == "application/json":
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            try:
                body_text = body.decode("utf-8")
                # Very naive replacement, in a real scenario we'd parse JSON and modify specific fields
                for model in self.sensitive_models:
                    body_text = body_text.replace(model, self.generic_model_name)
                
                # Try replacing API provider mentions in case of errors
                body_text = body_text.replace("OpenAI", "SAM AI Provider")
                body_text = body_text.replace("Google", "SAM AI Provider")
                body_text = body_text.replace("Anthropic", "SAM AI Provider")
                body_text = body_text.replace("DeepSeek", "SAM AI Provider")

                new_body = body_text.encode("utf-8")
                
                # Reconstruct response with new body
                return Response(
                    content=new_body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
            except Exception:
                # If decoding fails, return original
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type
                )
        
        return response
