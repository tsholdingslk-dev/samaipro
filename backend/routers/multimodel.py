from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import base64
import json
import os
import tempfile

from security import get_current_user, require_admin
from api_hub import api_hub, provider_registry, fallback_manager

router = APIRouter(
    prefix="/multimodel",
    tags=["Multi-Model Gateway"]
)


class ImageRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    size: Optional[str] = "1024x1024"
    quality: Optional[str] = "standard"
    style: Optional[str] = None
    num_images: Optional[int] = 1


class ImageAnalysisRequest(BaseModel):
    image_data: Optional[str] = None
    prompt: str
    model: Optional[str] = None


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "alloy"
    model: Optional[str] = None
    speed: Optional[float] = 1.0
    format: Optional[str] = "mp3"


@router.get("/providers")
async def list_providers(current_user: dict = Depends(get_current_user)):
    return {"providers": api_hub.get_all_provider_status()}


@router.get("/providers/by-type/{provider_type}")
async def get_providers_by_type(
    provider_type: str,
    current_user: dict = Depends(get_current_user)
):
    return {"providers": api_hub.get_providers_by_type(provider_type)}


@router.post("/image/generate")
async def generate_image(
    request: ImageRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = await api_hub.generate_image(
            prompt=request.prompt,
            model_override=request.model,
            size=request.size,
            quality=request.quality,
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image/analyze")
async def analyze_image(
    request: ImageAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    if not request.image_data:
        raise HTTPException(status_code=400, detail="image_data (base64 or URL) is required")
    try:
        result = await api_hub.analyze_image(
            image_data=request.image_data,
            prompt=request.prompt,
            model_override=request.model,
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image/analyze/upload")
async def analyze_image_upload(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    model: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    image_b64 = f"data:{file.content_type};base64,{base64.b64encode(content).decode()}"
    try:
        result = await api_hub.analyze_image(
            image_data=image_b64,
            prompt=prompt,
            model_override=model,
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/tts")
async def text_to_speech(
    request: TTSRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = await api_hub.synthesize_speech(
            text=request.text,
            voice=request.voice,
            model_override=request.model,
        )
        audio_data = result.get("audio_data", b"")
        encoded = base64.b64encode(audio_data).decode() if isinstance(audio_data, bytes) else audio_data
        return {
            "status": "success",
            "provider": result.get("provider"),
            "audio_format": request.format,
            "audio_base64": encoded,
            "duration_ms": result.get("latency_ms"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    model: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    try:
        result = await api_hub.transcribe_audio(
            audio_data=content,
            model_override=model,
        )
        return {"status": "success", "transcript": result.get("content"), "provider": result.get("provider")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-stats")
async def get_model_stats(current_user: dict = Depends(require_admin)):
    return {"stats": fallback_manager.provider_failure_counts, "cooldowns": {k: v.isoformat() for k, v in fallback_manager.provider_cooldowns.items()}}


@router.post("/reset-fallback/{provider_name}")
async def reset_provider_fallback(
    provider_name: str,
    current_user: dict = Depends(require_admin)
):
    fallback_manager.reset_provider(provider_name)
    return {"status": "success", "message": f"Reset fallback state for {provider_name}"}
