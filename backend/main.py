import os
import traceback
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, chat, project, api_provider, pdf_translate, coding, voice, media, image, agents, learning, api_proxy, lead_gen, crypto, auto_integrator, ai_intelligence, translate, social_news, flutter_build
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
    db = SessionLocal()
    admin_user = db.query(models.User).filter(models.User.email == "sam@mail.com").first()
    if not admin_user:
        hashed_pwd = get_password_hash("123456")
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

app = FastAPI(
    title="SAM AI API",
    description="Backend Brain for SAM AI Platform",
    version="1.0.0"
)

# Global Exception Handler to capture tracebacks cleanly
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": str(exc),
            "traceback": traceback.format_exc(),
            "path": str(request.url)
        }
    )

# Standard Routers
routers = [
    auth.router, chat.router, project.router, api_provider.router,
    module_router, pdf_translate.router, coding.router, voice.router,
    media.router, image.router, agents.router, learning.router,
    api_proxy.router, lead_gen.router, crypto.router, auto_integrator.router,
    ai_intelligence.router, translate.router, social_news.router,
    flutter_build.router
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
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "SAM AI Backend is Running 🚀"}

@app.get("/api/health")
def api_health_check():
    return {"status": "SAM AI Backend is Running 🚀"}
