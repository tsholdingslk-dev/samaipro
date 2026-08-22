from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from security import get_current_user
from api_hub import api_hub
import asyncio
import concurrent.futures

from tools import CodeExecutorTool
import urllib.request
import os
import json

router = APIRouter(
    prefix="/coding",
    tags=["Coding Module"]
)

code_executor_tool = CodeExecutorTool()

def run_async(coro):
    """Helper to run async code in sync context"""
    loop = asyncio.get_event_loop()
    if loop.is_running():
        with concurrent.futures.ThreadPoolExecutor() as pool:
            return pool.submit(lambda: asyncio.run(coro)).result()
    else:
        return loop.run_until_complete(coro)

@router.post("/generate")
async def generate_code(
    prompt: str = Form(...),
    language: str = Form("javascript"),
    framework: Optional[str] = Form(None),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate code based on description"""
    if project_id:
        project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.user_id == current_user["user_id"]).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    context = ""
    if framework:
        context = f" using {framework} framework"
    
    system_prompt = f"""You are an expert {language} developer{context}.
Generate clean, well-documented, production-ready code.
Include comments explaining key parts.
Follow best practices and modern patterns.

IMPORTANT DESIGN STANDARDS:
If generating frontend web code (HTML, React, Next.js, Vue, etc.):
1. YOU MUST USE Tailwind CSS for all styling.
2. Implement modern, responsive UI/UX using CSS Grid and Flexbox.
3. Ensure international production-level design aesthetics (proper padding, typography, dark/light mode compatibility).

Return only the code with minimal explanation unless asked."""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "code": result["content"],
            "language": language,
            "framework": framework,
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")

@router.post("/explain")
async def explain_code(
    code: str = Form(...),
    language: str = Form("javascript"),
    project_id: Optional[str] = Form(None)
):
    """Explain what a piece of code does"""
    prompt = f"""Explain the following {language} code in detail.
Break down what each part does.
Point out any potential issues or improvements.

Code:
```{language}
{code}
```"""
    
    messages = [
        {"role": "system", "content": "You are a code instructor. Explain code clearly and concisely."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "explanation": result["content"],
            "language": language,
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code explanation failed: {str(e)}")

@router.post("/fix")
async def fix_code(
    code: str = Form(...),
    error: Optional[str] = Form(None),
    language: str = Form("javascript"),
    project_id: Optional[str] = Form(None)
):
    """Fix bugs or errors in code"""
    error_context = f"\n\nError message:\n{error}" if error else ""
    
    prompt = f"""Fix the following {language} code and explain what was wrong.
Provide the corrected code and a brief explanation of the fix.{error_context}

Code:
```{language}
{code}
```

IMPORTANT: You MUST return your response as a valid JSON object matching this exact schema:
{{
  "fixed_code": "The raw corrected code here (no markdown blocks inside the string)",
  "explanation": "A clear explanation of what was fixed and why"
}}
Return ONLY the JSON. Do not include markdown codeblocks around the JSON.
"""
    
    messages = [
        {"role": "system", "content": "You are a debugging expert. Fix code and explain the solution clearly. ALWAYS respond with valid JSON only."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        # Request JSON format if supported by provider
        result = await api_hub.chat(messages, response_format={"type": "json_object"})
        
        content = result["content"].strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        parsed = json.loads(content.strip())
        
        return {
            "fixed_code": parsed.get("fixed_code", ""),
            "explanation": parsed.get("explanation", ""),
            "language": language,
            "provider": result.get("provider", "unknown")
        }
    except json.JSONDecodeError as e:
        return {
            "fixed_code": result["content"] if result else "",
            "explanation": "AI failed to return valid JSON format.",
            "language": language,
            "provider": result.get("provider", "unknown") if result else "unknown"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code fix failed: {str(e)}")

@router.post("/execute")
async def execute_code(
    code: str = Form(...),
    language: str = Form("python")
):
    """Safely execute Python/JavaScript code and return live stdout & stderr terminal output"""
    try:
        res = code_executor_tool.execute(code)
        return {
            "status": "success",
            "language": language,
            "engine": res.get("engine", "Sandbox"),
            "stdout": res.get("stdout", ""),
            "stderr": res.get("stderr", ""),
            "error": res.get("error", ""),
            "success": res.get("success", True)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution error: {str(e)}")

@router.get("/samaicoder/status")
async def get_samaicoder_status():
    """Check status of samaicoder local Fastify agent service"""
    try:
        base_url = os.environ.get("SAMAICODER_URL", "http://localhost:3210")
        req = urllib.request.Request(f"{base_url.rstrip('/')}/health", headers={"User-Agent": "SAM-AI-Bridge"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "status": "active",
                "service": "samaicoder (SamForge AI)",
                "url": base_url,
                "health": data
            }
    except Exception as e:
        return {
            "status": "offline",
            "service": "samaicoder (SamForge AI)",
            "message": f"samaicoder agent service is not running or reachable at {os.environ.get('SAMAICODER_URL', 'http://localhost:3210')}. If running locally, make sure to expose it via ngrok when the backend is on Railway."
        }

@router.post("/api-connect")
async def api_connect_help(
    description: str = Form(...),
    language: str = Form("javascript"),
    project_id: Optional[str] = Form(None)
):
    """Help connect to an API or set up API integration"""
    prompt = f"""Help me connect to an API using {language}.
Provide complete working code examples including:
1. API client setup
2. Making requests
3. Handling responses
4. Error handling
5. Environment variables for API keys

Description of what I need:
{description}"""
    
    messages = [
        {"role": "system", "content": "You are an API integration expert. Provide complete, working code examples."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "guide": result["content"],
            "language": language,
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API connect help failed: {str(e)}")

@router.post("/deploy")
async def deploy_guide(
    project_type: str = Form(...),
    platform: str = Form("local"),
    project_id: Optional[str] = Form(None)
):
    """Get deployment guide for a project"""
    prompt = f"""Provide a step-by-step deployment guide for a {project_type} project to {platform}.
Include:
1. Prerequisites
2. Build steps
3. Configuration
4. Deployment commands
5. Common issues and fixes"""
    
    messages = [
        {"role": "system", "content": "You are a DevOps expert. Provide clear, actionable deployment guides."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        return {
            "guide": result["content"],
            "project_type": project_type,
            "platform": platform,
            "provider": result.get("provider", "unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deploy guide failed: {str(e)}")
