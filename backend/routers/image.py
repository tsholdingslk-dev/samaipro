from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Request
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from security import get_current_user
from api_hub import api_hub
import asyncio
import concurrent.futures
import os
import tempfile
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import re

router = APIRouter(
    prefix="/image",
    tags=["Image Module"]
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


@router.post("/generate-prompt")
async def generate_image_prompt(
    description: str = Form(...),
    style: str = Form("photorealistic"),
    project_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate optimized prompts for image generation models"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    prompt = f"""Create a detailed image generation prompt for: {description}
Style: {style}

Include:
1. Main subject description
2. Lighting and atmosphere
3. Camera angle and composition
4. Color palette
5. Style details
6. Technical parameters

Make it detailed enough for Midjourney, DALL-E, or Stable Diffusion."""
    
    messages = [
        {"role": "system", "content": "You are an AI image prompt engineer. Create detailed, effective prompts."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "prompt": result["content"],
            "style": style,
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prompt generation failed: {str(e)}")

@router.post("/edit")
async def edit_image(
    image: UploadFile = File(...),
    instruction: str = Form(...),
    project_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Provide editing instructions for an uploaded image"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Save uploaded image
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        content_bytes = await image.read()
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        # Open and analyze image
        img = Image.open(tmp_file_path)
        width, height = img.size
        mode = img.mode
        
        # Generate editing instructions using AI
        prompt = f"""I have an image with the following specifications:
- Size: {width}x{height}
- Mode: {mode}
- Filename: {image.filename}

User wants to: {instruction}

Provide detailed editing instructions including:
1. What changes to make
2. Recommended tools/software
3. Step-by-step process
4. Alternative approaches
5. Expected outcome"""
        
        messages = [
            {"role": "system", "content": "You are an image editing expert. Provide practical, detailed editing instructions."},
            {"role": "user", "content": prompt}
        ]
        
        result = await api_hub.chat(messages)
        
        return {
            "instructions": result["content"],
            "image_info": {
                "filename": image.filename,
                "size": f"{width}x{height}",
                "mode": mode
            },
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image edit failed: {str(e)}")
    finally:
        os.remove(tmp_file_path)

@router.post("/resize")
async def resize_image(
    image: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
    project_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Resize an uploaded image"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        content_bytes = await image.read()
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        img = Image.open(tmp_file_path)
        original_size = f"{img.width}x{img.height}"
        
        # Resize image
        resized = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # Save resized image
        output_path = tmp_file_path + "_resized.png"
        resized.save(output_path, "PNG")
        
        # Convert to base64 for response
        with open(output_path, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode()
        
        os.remove(output_path)
        
        return {
            "image_base64": img_base64,
            "original_size": original_size,
            "new_size": f"{width}x{height}",
            "format": "png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resize failed: {str(e)}")
    finally:
        os.remove(tmp_file_path)

@router.post("/filter")
async def apply_filter(
    image: UploadFile = File(...),
    filter_type: str = Form("grayscale"),
    project_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Apply filters to an uploaded image"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        content_bytes = await image.read()
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        img = Image.open(tmp_file_path)
        
        # Apply filter
        if filter_type == "grayscale":
            filtered = img.convert("L").convert("RGB")
        elif filter_type == "sepia":
            filtered = img.convert("RGB")
            pixels = filtered.load()
            for i in range(filtered.width):
                for j in range(filtered.height):
                    r, g, b = pixels[i, j]
                    tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                    tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                    tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                    pixels[i, j] = (min(tr, 255), min(tg, 255), min(tb, 255))
        elif filter_type == "blur":
            from PIL import ImageFilter
            filtered = img.filter(ImageFilter.GaussianBlur(radius=2))
        elif filter_type == "brightness":
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(img)
            filtered = enhancer.enhance(1.5)
        elif filter_type == "contrast":
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(img)
            filtered = enhancer.enhance(1.5)
        else:
            filtered = img
        
        # Save filtered image
        output_path = tmp_file_path + "_filtered.png"
        filtered.save(output_path, "PNG")
        
        # Convert to base64
        with open(output_path, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode()
        
        os.remove(output_path)
        
        return {
            "image_base64": img_base64,
            "filter_applied": filter_type,
            "format": "png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filter failed: {str(e)}")
    finally:
        os.remove(tmp_file_path)

@router.post("/add-text")
async def add_text_to_image(
    image: UploadFile = File(...),
    text: str = Form(...),
    x: int = Form(10),
    y: int = Form(10),
    font_size: int = Form(36),
    color: str = Form("white"),
    project_id: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add text overlay to an image"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
        content_bytes = await image.read()
        tmp_file.write(content_bytes)
        tmp_file_path = tmp_file.name
    
    try:
        img = Image.open(tmp_file_path)
        draw = ImageDraw.Draw(img)
        
        # Try to use a font, fallback to default
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Parse color
        try:
            fill_color = tuple(int(color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
        except:
            fill_color = (255, 255, 255)
        
        # Add text
        draw.text((x, y), text, fill=fill_color, font=font)
        
        # Save result
        output_path = tmp_file_path + "_text.png"
        img.save(output_path, "PNG")
        
        with open(output_path, "rb") as f:
            img_base64 = base64.b64encode(f.read()).decode()
        
        os.remove(output_path)
        
        return {
            "image_base64": img_base64,
            "text_added": text,
            "position": f"{x},{y}",
            "format": "png"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text add failed: {str(e)}")
    finally:
        os.remove(tmp_file_path)

@router.post("/generate")
async def generate_image(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate an image. Supports both multipart/form-data and application/json (for NewsFlash Pro)
    """
    try:
        content_type = request.headers.get("content-type", "")
        
        prompt = ""
        width = 1024
        height = 1024
        model = "flux"
        
        if "application/json" in content_type:
            try:
                body = await request.json()
            except Exception:
                body = {}
                
            prompt = body.get("prompt") or ""
            
            # Handle size properly, checking for None
            size_val = body.get("size")
            if isinstance(size_val, str) and "x" in size_val:
                try:
                    width_str, height_str = size_val.split("x")
                    width = int(width_str)
                    height = int(height_str)
                except ValueError:
                    width, height = 1024, 1024
            elif body.get("width") and body.get("height"):
                try:
                    width = int(body.get("width"))
                    height = int(body.get("height"))
                except (ValueError, TypeError):
                    pass
                    
            model = body.get("style", "flux") or "flux"
        else:
            form = await request.form()
            prompt = form.get("prompt") or ""
            try:
                width = int(form.get("width", 1024) or 1024)
                height = int(form.get("height", 1024) or 1024)
            except (ValueError, TypeError):
                width, height = 1024, 1024
            model = form.get("model", "flux") or "flux"
            
        # Ensure prompt is a string
        if not isinstance(prompt, str):
            prompt = str(prompt)
            
        from tools import ImageGeneratorTool
        tool = ImageGeneratorTool()
        res = tool.execute(prompt=prompt, width=width, height=height, model=model)
        
        # Standardize output for NewsFlash Pro
        if "error" in res:
            import urllib.parse
            safe_prompt = prompt[:100] if prompt else "random"
            encoded_prompt = urllib.parse.quote(safe_prompt)
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&model={model}"
            provider = "Pollinations_Direct"
        else:
            url = res.get("image_url", "")
            provider = res.get("provider", "Unknown")
            
        return {
            "url": url,
            "image_url": url, # Keep for backwards compatibility
            "status": "success",
            "provider": provider
        }
    except Exception as e:
        # Prevent 502 Bad Gateway by catching all unhandled exceptions
        import traceback
        print(f"Image Generate Error: {e}")
        print(traceback.format_exc())
        return {
            "url": "https://image.pollinations.ai/prompt/error?width=1024&height=1024",
            "image_url": "https://image.pollinations.ai/prompt/error?width=1024&height=1024",
            "status": "error",
            "message": str(e)
        }

