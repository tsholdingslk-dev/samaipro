from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from security import get_current_user
from ai_engine import get_ai_response
from project_brain import get_project_brain
import os
import tempfile
import base64
from typing import Optional

router = APIRouter(
    prefix="/chat",
    tags=["AI Chat"]
)

def extract_text_from_file(file_path: str, content_type: str, filename: str) -> str:
    """Extract text from various file types"""
    text = ""
    
    try:
        if content_type == "application/pdf":
            try:
                import PyPDF2
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        text += page.extract_text() or ""
            except Exception as e:
                text = f"[PDF file - unable to extract text: {str(e)}]"
        
        elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            try:
                import docx2txt
                text = docx2txt.process(file_path)
            except Exception as e:
                text = f"[DOCX file - unable to extract text: {str(e)}]"
        
        elif content_type == "text/plain":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        
        elif content_type.startswith("audio/"):
            try:
                import speech_recognition as sr
                recognizer = sr.Recognizer()
                with sr.AudioFile(file_path) as source:
                    audio_data = recognizer.record(source)
                    text = recognizer.recognize_google(audio_data)
            except Exception as e:
                text = f"[Audio file - unable to transcribe: {str(e)}]"
        
        elif content_type.startswith("video/"):
            try:
                import speech_recognition as sr
                from moviepy.editor import VideoFileClip
                
                video = VideoFileClip(file_path)
                audio_path = file_path + ".wav"
                video.audio.write_audiofile(audio_path)
                video.close()
                
                recognizer = sr.Recognizer()
                with sr.AudioFile(audio_path) as source:
                    audio_data = recognizer.record(source)
                    text = recognizer.recognize_google(audio_data)
                
                os.remove(audio_path)
            except Exception as e:
                text = f"[Video file - unable to extract audio: {str(e)}]"
        
        elif content_type.startswith("image/"):
            text = "[User uploaded an image file]"
        
        else:
            text = f"[Unsupported file type: {content_type}]"
    
    except Exception as e:
        text = f"[Error processing file: {str(e)}]"
    
    return text

@router.post("/{project_id}")
async def send_message(
    project_id: str,
    background_tasks: BackgroundTasks,
    content: Optional[str] = Form(None),
    mode: Optional[str] = Form("general"),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    # 1. Verify or Auto-create Project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        project = models.Project(
            id=project_id,
            user_id=current_user["user_id"],
            title="General Workspace",
            type="education"
        )
        db.add(project)
        db.commit()
        db.refresh(project)


    
    # 2. Get Project Brain for RAG
    brain = get_project_brain(project_id)
    
    # 3. Process uploaded files
    file_contents = []
    has_new_docs = False
    
    for uploaded_file in files:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(uploaded_file.filename)[1]) as tmp_file:
            content_bytes = await uploaded_file.read()
            tmp_file.write(content_bytes)
            tmp_file_path = tmp_file.name
        
        # Extract text based on file type
        extracted_text = extract_text_from_file(tmp_file_path, uploaded_file.content_type or "application/octet-stream", uploaded_file.filename or "unknown")
        file_contents.append(f"[File: {uploaded_file.filename}]\n{extracted_text}\n")
        
        # Add to Project Brain for future retrieval
        if extracted_text and not extracted_text.startswith("["):
            brain.add_document(
                text=extracted_text,
                metadata={"source": uploaded_file.filename, "type": uploaded_file.content_type},
                doc_id=f"{project_id}_{uploaded_file.filename}"
            )
            has_new_docs = True
        
        # Clean up temp file
        os.remove(tmp_file_path)
    
    # Trigger background embedding index if new docs were added
    if has_new_docs:
        def _run_index():
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(brain.index_documents())
            finally:
                loop.close()
        background_tasks.add_task(_run_index)
    
    # 4. Combine content
    full_content = content or ""
    if file_contents:
        full_content += "\n\n" + "\n".join(file_contents)
    
    if not full_content.strip():
        raise HTTPException(status_code=400, detail="Content or files are required")
    
    # 5. Retrieve relevant context from Project Brain
    context = brain.get_context_for_prompt(full_content, top_k=3)
    
    # 6. Save User's Message to Database
    user_chat = models.Chat(
        project_id=project_id,
        role="user",
        content=full_content
    )
    db.add(user_chat)
    db.commit()
    db.refresh(user_chat)
    
    # 7. Get Chat History for context (last 10 messages)
    chat_history = db.query(models.Chat).filter(models.Chat.project_id == project_id).order_by(models.Chat.timestamp.asc()).limit(10).all()
    
    # 8. Build enhanced prompt with RAG context
    enhanced_message = full_content
    if context:
        enhanced_message = f"[Knowledge Base Context]\n{context}\n\n[User Message]\n{full_content}"
    
    # Mode-based System Prompt
    system_prompt = "You are TS-Brain AI, an advanced, self-learning AI assistant and intelligence engine optimized specifically for Sri Lankan domain knowledge, history, culture, administrative languages, and specialized domains including astrology. Always respond in the language requested by the user, maintain strict cultural accuracy, and do not expose internal DB metadata."
    
    if mode == "history":
        system_prompt += " Focus primarily on deep Sri Lankan historical, archaeological, and cultural heritage."
    elif mode == "admin":
        system_prompt += " Focus primarily on official government terminology, administrative Tamil and Sinhala usages, legal terms, and formal translations."
    elif mode == "astrology":
        system_prompt += " Focus primarily on Tamil and Sinhala astrological systems, panchangam, planetary transits, and traditional predictions. You are an expert astrologer. IMPORTANT: Whenever you need to display a birth chart (Kundli) or Rasi chakra to the user, you MUST output it as a special markdown code block named `astrology-chart`. The content must be a JSON object mapping house numbers (1 to 12) to an array of planet names. House 1 is Aries, 2 is Taurus, etc. Example format:\n```astrology-chart\n{\"1\": [\"Ravi\", \"Kuja\"], \"7\": [\"Sikuru\"], \"10\": [\"Shani\"]}\n```\nDo not use any other format for rendering the chart."
    elif mode == "rag_search":
        system_prompt += " Focus primarily on live current events, news synthesis, and factual data retrieval based on the provided context."

    # 9. Generate AI Response
    ai_text = get_ai_response(user_message=enhanced_message, chat_history=chat_history, system_prompt=system_prompt)
    
    # 10. Save AI's Response to Database
    ai_chat = models.Chat(
        project_id=project_id,
        role="assistant",
        content=ai_text
    )
    db.add(ai_chat)
    db.commit()
    db.refresh(ai_chat)
    
    # 11. Return the AI's chat object
    return ai_chat

@router.get("/default")
def chat_default(
    prompt: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Dedicated endpoint for external integrations (like NewsFlash Pro).
    GET /api/chat/default?prompt=... -> returns {"content": "..."}
    """
    if not prompt:
        return {"content": "Hello! Welcome to SAM AI Workspace (default). I am your 24/7 AI Assistant. How can I help you today?"}
    
    # Generate AI Response
    ai_text = get_ai_response(user_message=prompt, chat_history=[])
    
    return {"content": ai_text}

@router.get("/{project_id}", response_model=list[schemas.ChatResponse])
def get_chat_history(
    project_id: str, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    # 1. Verify or Auto-create Project
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        project = models.Project(
            id=project_id,
            user_id=current_user["user_id"],
            title="General Workspace",
            type="education"
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    
    # 2. Return chat history
    chats = db.query(models.Chat).filter(models.Chat.project_id == project_id).order_by(models.Chat.timestamp.asc()).all()
    return chats

