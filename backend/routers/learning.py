from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from security import get_current_user
from learning import self_learning
import json

router = APIRouter(
    prefix="/learning",
    tags=["Self Learning"]
)

@router.post("/feedback")
async def submit_feedback(
    background_tasks: BackgroundTasks,
    message_id: str = Form(...),
    rating: int = Form(...),
    feedback_text: str = Form(""),
    category: str = Form("quality"),
    current_user: dict = Depends(get_current_user)
):
    """Submit feedback on AI response quality"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Run the heavy self-learning recording process in the background
    background_tasks.add_task(
        self_learning.record_feedback,
        user_id=current_user["user_id"],
        message_id=message_id,
        rating=rating,
        feedback_text=feedback_text,
        category=category
    )
    
    return {
        "status": "recorded",
        "message": "Thank you for your feedback! The AI is continuously learning in the background."
    }

@router.get("/preferences")
async def get_preferences(
    current_user: dict = Depends(get_current_user)
):
    """Get learned preferences for the current user"""
    prefs = self_learning.get_user_preferences(current_user["user_id"])
    return prefs

@router.post("/knowledge")
async def add_knowledge(
    background_tasks: BackgroundTasks,
    source: str = Form(...),
    content: str = Form(...),
    metadata: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Add knowledge to user's personal knowledge base"""
    meta = {}
    if metadata:
        try:
            meta = json.loads(metadata)
        except:
            meta = {"raw": metadata}
    
    # Process knowledge vectors in background
    background_tasks.add_task(
        self_learning.add_user_knowledge,
        user_id=current_user["user_id"],
        source=source,
        content=content,
        metadata=meta
    )
    
    return {"status": "added", "source": source, "message": "Knowledge added and indexing in background."}

@router.get("/knowledge")
async def get_knowledge(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get user's knowledge base"""
    knowledge = self_learning.get_user_knowledge(current_user["user_id"], limit)
    return {"knowledge": knowledge, "count": len(knowledge)}

@router.post("/analyze")
async def analyze_response(
    message: str = Form(...),
    response: str = Form(...),
    message_id: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Analyze a response for quality"""
    analysis = self_learning.analyze_response(
        user_id=current_user["user_id"],
        message=message,
        response=response
    )
    return analysis
