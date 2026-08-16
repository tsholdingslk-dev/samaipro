from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from security import get_current_user
from api_hub import api_hub
from tools import WebScraperTool
import base64
import os
import tempfile

router = APIRouter(
    prefix="/social-news",
    tags=["Social News Editor"]
)

@router.post("/generate-post")
async def generate_post(
    url: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Step 2 & 3: Analyzes the source link and generates a highly engaging Facebook post.
    """
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
        
    # Scrape URL
    scraper = WebScraperTool()
    scrape_res = scraper.execute(url=url)
    if "error" in scrape_res:
        raise HTTPException(status_code=500, detail=f"Failed to read URL: {scrape_res['error']}")
        
    content = scrape_res.get("content", "")
    if not content:
        raise HTTPException(status_code=400, detail="Could not extract content from the URL")
        
    # Truncate content if too long
    content = content[:15000]
    
    system_prompt = """You are an elite American social media news editor, investigative content analyst, Facebook copywriter, viral content strategist, and graphic designer.
Your primary objective is to create highly engaging Facebook posts and professional social media graphics for a US audience.

CONTENT ANALYSIS RULES:
* Extract only factual information from the source.
* Identify the most newsworthy elements, emotional triggers, controversy, urgency, and public interest angles.
* Determine what would attract the highest engagement from a US audience.
* Never invent facts or exaggerate beyond the source material.

FACEBOOK POST REQUIREMENTS:
* Strong attention-grabbing hook
* Easy-to-read American English
* Short paragraphs
* Emotionally engaging
* Factually accurate
* Mobile-friendly
* Natural social media style
* Strategic use of emojis
* High engagement potential
* Strong call to action
* Ready to copy and paste

Output format MUST exactly follow:
[Facebook Post]
<Complete Facebook post>"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Source Content to analyze:\n\n{content}"}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "post": result["content"],
            "status": "success",
            "provider": result.get("provider", "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Step 4: Analyze reference image for Facebook post.
    """
    content_bytes = await image.read()
    from PIL import Image
    import io
    
    # Process image to ensure compatibility (convert WebP/PNG to JPEG, resize if too large)
    img = Image.open(io.BytesIO(content_bytes))
    
    # Convert to RGB (in case of RGBA/PNG)
    if img.mode != "RGB":
        img = img.convert("RGB")
        
    # Resize if too large to save tokens and prevent 500 errors
    max_size = 1024
    if img.width > max_size or img.height > max_size:
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
    # Save to bytes as JPEG
    jpeg_io = io.BytesIO()
    img.save(jpeg_io, format="JPEG", quality=85)
    jpeg_bytes = jpeg_io.getvalue()
    
    base64_image = base64.b64encode(jpeg_bytes).decode('utf-8')
    mime_type = "image/jpeg"
    image_data_url = f"data:{mime_type};base64,{base64_image}"
    
    system_prompt = """You are an elite American social media graphic designer and content analyst.
The user has uploaded a reference image for a Facebook news post.
Analyze the following:
* Subject
* Composition
* Camera angle
* Background
* Lighting
* Mood
* Color grading
* Typography style (if any)
* Visual hierarchy
* News design elements

Determine why this image attracts attention and provide strategic advice on how it can be adapted or improved for the current story to maximize US audience engagement."""

    # Construct vision payload format (OpenAI/Anthropic standard)
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Please analyze this reference image."},
                {"type": "image_url", "image_url": {"url": image_data_url}}
            ]
        }
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "analysis": result["content"],
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
