import os
import traceback
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import (
    auth, chat, project, api_provider, pdf_translate, coding, voice, media, image,
    agents, learning, api_proxy, lead_gen, crypto, auto_integrator, ai_intelligence,
    translate, social_news, flutter_build, telegram_bot, knowledge, orchestrator,
    multimodel, security as security_router, permissions as permissions_router,
    validation as validation_router, analytics as analytics_router,
    gateway as gateway_router, sam_ai as sam_ai_router,
    secrets as secrets_router
)
from routers.modules.module import router as module_router

# Create Database Tables safely
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Table creation notice: {e}")

# Auto-seed Initial Admin User
try:
    from database import SessionLocal
    from security import get_password_hash
    admin_pwd = os.getenv("ADMIN_INITIAL_PASSWORD")
    if admin_pwd:
        db = SessionLocal()
        admin_user = db.query(models.User).filter(models.User.email == "sam@mail.com").first()
        if not admin_user:
            hashed_pwd = get_password_hash(admin_pwd)
            admin_user = models.User(
                id="admin_sam_01",
                email="sam@mail.com",
                hashed_password=hashed_pwd,
                role="admin"
            )
            db.add(admin_user)
            db.commit()
        db.close()
except Exception as e:
    print(f"Admin seeder notice: {e}")

import logging
import uuid

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

IS_PRODUCTION = os.getenv("IS_PRODUCTION", "false").lower() == "true"

app_kwargs = {
    "title": "SAM AI API",
    "description": "Backend Brain for SAM AI Platform",
    "version": "1.0.0"
}
if IS_PRODUCTION:
    app_kwargs.update({
        "docs_url": None,
        "redoc_url": None,
        "openapi_url": None
    })

app = FastAPI(**app_kwargs)

# Global Exception Handler to capture tracebacks cleanly
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = str(uuid.uuid4())
    logger.error(f"Request {req_id} failed: {exc}", exc_info=True)
    
    if IS_PRODUCTION:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Internal server error",
                "request_id": req_id
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(exc),
                "traceback": traceback.format_exc(),
                "path": str(request.url),
                "request_id": req_id
            }
        )

# Standard Routers
routers = [
    auth.router, chat.router, project.router, api_provider.router,
    module_router, pdf_translate.router, coding.router, voice.router,
    media.router, image.router, agents.router, learning.router,
    api_proxy.router, lead_gen.router, crypto.router, auto_integrator.router,
    ai_intelligence.router, translate.router, social_news.router,
    flutter_build.router, telegram_bot.router, knowledge.router, orchestrator.router, multimodel.router, security_router.router, permissions_router.router, validation_router.router, analytics_router.router, gateway_router.router, sam_ai_router.router, secrets_router.router
]

# Mount under standard paths (/crypto/market, /chat, etc.)
for r in routers:
    app.include_router(r)

# Create parent /api router to cleanly duplicate paths under /api (/api/crypto/market, etc.)
api_router = APIRouter(prefix="/api")
for r in routers:
    api_router.include_router(r)

app.include_router(api_router)

# CORS Setup
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from middleware.security_middleware import SecurityHeadersMiddleware, ResponseSanitizationMiddleware
app.add_middleware(SecurityHeadersMiddleware)
if IS_PRODUCTION:
    app.add_middleware(ResponseSanitizationMiddleware)

# Zero-Trust Security Middleware (device fingerprinting, audit logging, rate limiting)
from security_ext.middleware_zero_trust import setup_zero_trust
setup_zero_trust(app)

# Seed default roles and permissions
from permissions.engine import permission_engine
try:
    from database import SessionLocal
    _seed_db = SessionLocal()
    permission_engine.seed_default_roles_and_permissions(_seed_db)
    _seed_db.close()
except Exception as e:
    print(f"Permission seeding notice: {e}")

@app.on_event("startup")
async def startup_event():
    from permissions.grants import grant_manager
    from permissions.quota import quota_manager
    from security_ext.refresh_tokens import refresh_token_manager
    from database import SessionLocal
    try:
        _db = SessionLocal()
        grant_manager.cleanup_expired(_db)
        _db.close()
    except Exception:
        pass
        
    # Start Agent Background Proactive Cron Job
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    scheduler = AsyncIOScheduler()
    
    async def proactive_agent_wakeup():
        print("[Agent] Waking up for daily summary...")
        try:
            from database import SessionLocal
            from ai_engine import get_ai_response
            from tools.agent_tools import execute_retrieve_memory, execute_telegram_broadcast
            db = SessionLocal()
            import models
            admin = db.query(models.User).filter(models.User.role == "admin").first()
            if admin:
                pending_tasks = execute_retrieve_memory("all", "pending", str(admin.id), db)
                prompt = f"You are SAM AI. This is your automatic morning wakeup. Here are the user's pending tasks:\n{pending_tasks}\n\nPlease generate a morning briefing message for the user summarizing what they need to do today, and use the TELEGRAM tool to send it to them! Format the tool call correctly as JSON: `[TOOL: TELEGRAM] {{\"message\": \"...\"}}`"
                
                resp = get_ai_response(user_message=prompt, system_prompt="You are SAM AI's Proactive Agent.")
                
                import re, json
                match = re.search(r'\[TOOL:\s*TELEGRAM\]\s*({.*?})', resp, re.DOTALL)
                if match:
                    payload = json.loads(match.group(1))
                    execute_telegram_broadcast(payload.get("message", ""), db)
                    print("[Agent] Successfully sent daily summary to Telegram!")
            db.close()
        except Exception as e:
            print(f"[Agent Error] {e}")
            
    scheduler.add_job(proactive_agent_wakeup, 'cron', hour=8, minute=0)
    scheduler.start()
    print("APScheduler started!")

@app.get("/health")
def health_check():
    return {"status": "SAM AI Backend is Running 🚀"}

@app.get("/api/health")
def api_health_check():
    return {"status": "SAM AI Backend is Running 🚀"}
