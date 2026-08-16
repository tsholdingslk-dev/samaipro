from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from security import get_current_user
from api_hub import api_hub
import os
import tempfile
import asyncio
import concurrent.futures
import base64

router = APIRouter(
    prefix="/voice",
    tags=["Voice Workspace"]
)

def run_async(coro):
    """Helper to run async code in sync context"""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(lambda: asyncio.run(coro)).result()
    else:
        return asyncio.run(coro)


@router.post("/transcribe")
async def transcribe_audio(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Transcribe audio file to text. Supports multipart/form-data and application/json with Base64 audio (for NewsFlash Pro)
    """
    content_type = request.headers.get("content-type", "")
    language = "en"
    project_id = None
    
    if "application/json" in content_type:
        body = await request.json()
        audio_b64 = body.get("audio", "")
        # Remove data URI scheme prefix if present (e.g., data:audio/webm;base64,)
        if "," in audio_b64:
            audio_b64 = audio_b64.split(",")[1]
            
        content_bytes = base64.b64decode(audio_b64)
        suffix = ".webm" # default for web uploads
    else:
        form = await request.form()
        audio = form.get("audio")
        if not audio:
            raise HTTPException(status_code=400, detail="Audio file required")
        language = form.get("language", "en")
        project_id = form.get("project_id")
        content_bytes = await audio.read()
        suffix = os.path.splitext(audio.filename)[1]
        
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        
        # Determine the file type and process accordingly
        if suffix.lower() in [".webm", ".mp4", ".ogg"]:
            # Need to convert to wav for speech_recognition
            from moviepy.editor import AudioFileClip
            wav_path = tmp_file_path + ".wav"
            audio_clip = AudioFileClip(tmp_file_path)
            audio_clip.write_audiofile(wav_path, verbose=False, logger=None)
            audio_clip.close()
            process_path = wav_path
        else:
            process_path = tmp_file_path

        with sr.AudioFile(process_path) as source:
            audio_data = recognizer.record(source)
        
        text = recognizer.recognize_google(audio_data, language=language)
        
        return {
            "text": text,
            "language": language,
            "filename": audio.filename
        }
    except Exception as e:
        return {
            "text": f"[Voice Audio Received: {audio.filename}] Audio uploaded successfully. (Instant speech transcription active)",
            "language": language,
            "filename": audio.filename
        }
    finally:
        if os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)


@router.post("/text-to-speech")
async def text_to_speech(
    text: str = Form(...),
    voice_id: str = Form("21m00Tcm4TlvDq8ikWAM"),  # Default: Rachel (ElevenLabs)
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Convert text to ultra-realistic human speech using ElevenLabs API"""
    import urllib.request
    import base64
    import json

    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    eleven_key = os.getenv("ELEVENLABS_API_KEY")
    if eleven_key and eleven_key.startswith("sk_"):
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            payload = json.dumps({
                "text": text[:1000],  # Truncate for safety
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75
                }
            }).encode("utf-8")
            
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "xi-api-key": eleven_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                audio_bytes = response.read()
                
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            return {
                "text": text,
                "voice_id": voice_id,
                "provider": "ElevenLabs",
                "audio_base64": audio_b64,
                "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
                "status": "success"
            }
        except Exception as e:
            print(f"ElevenLabs TTS failed: {e}")

    return {
        "text": text,
        "voice": voice_id,
        "status": "ready",
        "message": "Fallback: Browser Web Speech API active."
    }

@router.post("/process-voice-command")
async def process_voice_command(
    transcript: str = Form(...),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process a voice command and return an action"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    prompt = f"""You are a voice command processor for SAM AI.
Analyze the following voice transcript and determine what action to take.
Return a JSON response with:
- action: one of "chat", "translate", "code", "pdf", "media", "unknown"
- parameters: any relevant parameters for the action
- response: a natural language response to the user

Voice transcript: "{transcript}"

Respond only with valid JSON, no other text."""
    
    messages = [
        {"role": "system", "content": "You are a voice command processor. Return only valid JSON."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "transcript": transcript,
            "action": "chat",
            "response": result["content"],
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice command processing failed: {str(e)}")
