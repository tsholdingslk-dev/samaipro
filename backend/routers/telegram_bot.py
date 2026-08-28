import os
import httpx
import secrets
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from dotenv import set_key, load_dotenv

import models
import schemas
from database import get_db
import security
from api_hub import api_hub

load_dotenv()

router = APIRouter(prefix="/telegram", tags=["Telegram Bot"])

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}" if TELEGRAM_BOT_TOKEN else ""

SAM_ASSISTANT_SYSTEM_PROMPT = """You are "Sam AI Assistant," an advanced autonomous AI intelligence agent tailored for Sri Lanka and global real-time research. Your primary role is to execute accurate data gathering, deep-dive historical research, and concise information synthesis directly for the user via Telegram.

### Core Capabilities & Responsibilities:
1. Real-Time News & Regional Monitoring:
   - Provide up-to-date events, political developments, economic updates, and breaking news in Sri Lanka and worldwide.
   - Summarize key developments clearly in Tamil (தமிழ்), English, or Sinhala based on user preference.

2. Deep-Dive Historical & Biographical Research (25-Year Chronology):
   - When queried about individuals (e.g. Dr. Ramesh Pathirana, Ranil Wickremesinghe, Mahinda Rajapaksa, Sajith Premadasa, AKD, or global figures), execute exhaustive 25-year historical research.
   - Detail chronological career milestones (1999-2026), parliamentary entry, ministerial portfolios (Health, Industries, Plantations), major policy decisions, key legislative votes, notable achievements, controversies/scrutiny, and current political standing.
   - Structure research chronologically with clear headings, bullet points, and verified facts.

3. Tone & Formatting:
   - Deliver high-density, accurate facts with zero fluff.
   - Use clean HTML formatting: <b>bold</b>, <i>italic</i>, <code>code</code>, and bullet points (- ).
   - Do NOT use unsupported HTML tags (avoid <p>, <div>, <h1>, markdown #). Use <b>Heading</b> instead.
   - Support Tamil (தமிழ்), English, and Sinhala fluently.
"""

async def send_telegram_message_async(chat_id: int, text: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    if not token:
        print("[Telegram] Bot token not configured.")
        return
        
    api_url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    # Telegram max message length is 4096. Split into clean chunks.
    max_len = 4000
    chunks = [text[i:i+max_len] for i in range(0, len(text), max_len)]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk in chunks:
            # Try HTML first, fallback to plain text if malformed HTML
            payload = {
                "chat_id": chat_id,
                "text": chunk,
                "parse_mode": "HTML",
                "disable_web_page_preview": True
            }
            try:
                res = await client.post(api_url, json=payload)
                if res.status_code != 200:
                    # Retry with plain text
                    payload.pop("parse_mode", None)
                    await client.post(api_url, json=payload)
            except Exception as e:
                print(f"[Telegram] Error sending chunk: {e}")

def send_telegram_message(chat_id: int, text: str):
    """Synchronous wrapper for sending telegram messages"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(send_telegram_message_async(chat_id, text))
        else:
            loop.run_until_complete(send_telegram_message_async(chat_id, text))
    except Exception:
        # Fallback to sync httpx client
        token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
        if not token:
            return
        api_url = f"https://api.telegram.org/bot{token}/sendMessage"
        try:
            with httpx.Client(timeout=10.0) as client:
                client.post(api_url, json={"chat_id": chat_id, "text": text[:4000]})
        except Exception as e:
            print(f"[Telegram] Sync send error: {e}")

def get_admin_chat_id():
    return os.getenv("TELEGRAM_ADMIN_CHAT_ID")

def set_admin_chat_id(chat_id: str):
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        try:
            set_key(env_file, "TELEGRAM_ADMIN_CHAT_ID", str(chat_id))
        except Exception:
            pass
    os.environ["TELEGRAM_ADMIN_CHAT_ID"] = str(chat_id)

async def ask_sam_ai(user_prompt: str, context_prompt: Optional[str] = None) -> str:
    """Query SAM AI Hub with Assistant System Prompt and return structured response"""
    system_content = SAM_ASSISTANT_SYSTEM_PROMPT
    if context_prompt:
        system_content += f"\n\nSpecial Instruction for this request:\n{context_prompt}"
        
    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        content = result.get("content", "")
        if not content:
            raise ValueError("Empty response from AI Hub")
            
        # Clean markdown headers (### -> <b>...</b>) for Telegram HTML compatibility
        lines = content.split("\n")
        formatted_lines = []
        for line in lines:
            if line.startswith("### ") or line.startswith("## ") or line.startswith("# "):
                clean_title = line.lstrip("#").strip()
                formatted_lines.append(f"\n<b>{clean_title}</b>")
            elif line.startswith("**") and line.endswith("**"):
                clean_title = line.strip("*").strip()
                formatted_lines.append(f"\n<b>{clean_title}</b>")
            else:
                formatted_lines.append(line)
        return "\n".join(formatted_lines)
    except Exception as e:
        print(f"[Telegram AI Hub Error]: {e}")
        return f"<b>Sam AI Assistant:</b>\nமன்னிக்கவும், தகவல் திரட்டுவதில் தற்காலிக தாமதம் ஏற்பட்டது ({str(e)}). தயவுசெய்து சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்."

@router.get("/setup-webhook")
async def setup_webhook(url: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    if not token:
        raise HTTPException(status_code=400, detail="Telegram bot token not set in environment")
    webhook_url = f"https://api.telegram.org/bot{token}/setWebhook?url={url}"
    async with httpx.AsyncClient() as client:
        response = await client.get(webhook_url)
    return response.json()

@router.get("/status")
def get_status():
    token = os.getenv("TELEGRAM_BOT_TOKEN", TELEGRAM_BOT_TOKEN)
    return {
        "status": "active" if token else "inactive",
        "bot_configured": bool(token),
        "admin_chat_id": get_admin_chat_id()
    }

@router.post("/send-test")
async def send_test_message(chat_id: Optional[int] = None, message: str = "Hello from Sam AI Assistant!"):
    target_id = chat_id or get_admin_chat_id()
    if not target_id:
        raise HTTPException(status_code=400, detail="No chat ID provided or configured")
    await send_telegram_message_async(int(target_id), message)
    return {"status": "sent", "chat_id": target_id}

@router.post("/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        data = await request.json()
    except Exception:
        return {"status": "invalid_payload"}
        
    if "message" not in data or "text" not in data["message"]:
        return {"status": "ok"}
        
    chat_id = data["message"]["chat"]["id"]
    text = data["message"]["text"].strip()
    user_info = data["message"].get("from", {})
    user_name = user_info.get("first_name", "User")
    
    admin_chat_id = get_admin_chat_id()
    
    # Auto-register admin on /start if not set
    if text.startswith("/start"):
        if not admin_chat_id:
            set_admin_chat_id(str(chat_id))
            admin_chat_id = str(chat_id)
            
        welcome_msg = (
            f"👑 <b>வணக்கம் {user_name}! Sam AI Assistant உங்களை வரவேற்கிறது!</b>\n\n"
            f"நான் உங்கள் பிரத்யேக <b>Autonomous Intelligence & Research Agent</b>.\n\n"
            f"⚡ <b>பயன்படுத்தக்கூடிய முக்கிய Commands:</b>\n"
            f"🇱🇰 <code>/slnews</code> - இலங்கை முக்கிய செய்திகள் & அரசியல்/பொருளாதார சுருக்கம்\n"
            f"🌐 <code>/worldnews</code> - சர்வதேச மற்றும் உலகளாவிய முக்கிய நிகழ்வுகள்\n"
            f"🔍 <code>/research [பெயர் / தலைப்பு]</code> - 25 ஆண்டுகால ஆழமான வரலாற்று ஆராய்ச்சி (எ.கா: <code>/research Ramesh Pathirana</code>)\n"
            f"📚 <code>/learn [தலைப்பு]</code> - SAM AI இன்று கற்றுக்கொண்டவை & தொழில்நுட்ப விளக்கங்கள்\n"
            f"📊 <code>/briefing</code> - இன்றைய முழுமையான Daily Intelligence அறிக்கை\n"
            f"🔑 <code>/newadminkey</code> - புதிய அட்மின் அக்சஸ் கீ உருவாக்கம்\n"
            f"🔑 <code>/staffkey 7d</code> - ஊழியர் அக்சஸ் கீ உருவாக்கம்\n"
            f"ℹ️ <code>/help</code> - அனைத்து கட்டளைகளின் பட்டியல்\n\n"
            f"💬 <i>நீங்கள் எந்தவொரு கேள்வியையும் தமிழில் அல்லது ஆங்கிலத்தில் நேரடியாக என்னிடம் தட்டச்சு செய்தும் கேட்கலாம்!</i>"
        )
        await send_telegram_message_async(chat_id, welcome_msg)
        return {"status": "ok"}
        
    # Check authorization if admin_chat_id is set
    if admin_chat_id and str(chat_id) != str(admin_chat_id):
        await send_telegram_message_async(chat_id, "🔒 <i>Sam AI Assistant is currently configured for private owner access.</i>")
        return {"status": "ok"}
        
    parts = text.split(maxsplit=1)
    command = parts[0].lower()
    args = parts[1].strip() if len(parts) > 1 else ""
    
    # ── COMMAND: /help ──
    if command == "/help":
        help_text = (
            "🤖 <b>Sam AI Assistant Command Reference:</b>\n\n"
            "🇱🇰 <code>/slnews</code> - இலங்கை முக்கிய நடப்பு நிகழ்வுகள் & அரசியல்/பொருளாதார ஆய்வு\n"
            "🌐 <code>/worldnews</code> - உலகளாவிய முக்கிய சர்வதேச & தொழில்நுட்ப செய்திகள்\n"
            "🔍 <code>/research &lt;Topic/Person&gt;</code> - 25-Year Deep-Dive biographical & historical research (எ.கா: <code>/research Ramesh Pathirana</code>)\n"
            "📚 <code>/learn &lt;Topic&gt;</code> - தொழில்நுட்ப மற்றும் துறைசார் நுண்ணறிவு விளக்கம்\n"
            "📊 <code>/briefing</code> - இன்றைய முழு நாளுக்கான Intelligence Briefing\n"
            "🔑 <code>/newadminkey</code> - Generate Master Admin Access Key\n"
            "🔑 <code>/staffkey 7d</code> - Generate Staff Key (24h, 7d, 14d, 30d)\n"
            "📋 <code>/listkeys</code> - List all active platform keys\n"
            "🚫 <code>/revokekey &lt;code&gt;</code> - Revoke an access key\n"
            "📈 <code>/stats</code> - Server, Chat & User Statistics\n"
            "🔄 <code>/rotate</code> - Rotate System Master Key\n"
        )
        await send_telegram_message_async(chat_id, help_text)
        return {"status": "ok"}
        
    # ── COMMAND: /slnews (Sri Lanka News) ──
    elif command in ["/slnews", "/srilanka", "/lankanews"]:
        await send_telegram_message_async(chat_id, "🇱🇰 <i>இலங்கையின் முக்கிய அரசியல், பொருளாதார மற்றும் நடப்பு நிகழ்வுகளைத் திரட்டுகிறேன்... தயவுசெய்து ஒரு வினாடி காத்திருக்கவும்.</i>")
        prompt = "Provide a comprehensive, high-density update of the most important news, political developments, economic milestones, and central bank/governance updates in Sri Lanka for today/recently. Format with clear bold bullet points and sections in Tamil."
        response_text = await ask_sam_ai(prompt, "Focus on verified Sri Lankan news facts, parliament/election updates, economic indicators, and public interest matters in Tamil.")
        await send_telegram_message_async(chat_id, f"🇱🇰 <b>இலங்கை முக்கிய செய்திகள் & நடப்பு நிகழ்வுகள்:</b>\n\n{response_text}")
        return {"status": "ok"}
        
    # ── COMMAND: /worldnews (Global News) ──
    elif command in ["/worldnews", "/global", "/world"]:
        await send_telegram_message_async(chat_id, "🌐 <i>உலகளாவிய முக்கிய செய்திகள் மற்றும் சர்வதேச பொருளாதார/தொழில்நுட்ப நிலவரங்களைத் திரட்டுகிறேன்...</i>")
        prompt = "Provide a structured global intelligence digest covering major international geopolitics, economic trends, US/Asia/Middle East developments, and breakthrough AI/tech industry news for today. Format in clear bold bullet points in Tamil."
        response_text = await ask_sam_ai(prompt, "Provide high-density international news in Tamil with clear headings.")
        await send_telegram_message_async(chat_id, f"🌐 <b>உலகளாவிய முக்கிய செய்திகள் (Global Intelligence):</b>\n\n{response_text}")
        return {"status": "ok"}
        
    # ── COMMAND: /research (Deep 25-Year Research) ──
    elif command in ["/research", "/biography", "/history"]:
        if not args:
            await send_telegram_message_async(chat_id, "⚠️ <b>பயன்படுத்தும் முறை:</b>\n<code>/research [நபர் அல்லது தலைப்பு]</code>\n\nஎடுத்துக்காட்டு:\n<code>/research Ramesh Pathirana</code>\n<code>/research Sri Lanka Central Bank Economy 2000-2025</code>")
            return {"status": "ok"}
            
        await send_telegram_message_async(chat_id, f"🔍 <i>'{args}' பற்றிய 25 ஆண்டு கால விரிவான ஆவணங்களை (Historical & Parliamentary Archives) ஆய்வு செய்கிறேன்... முழு அறிக்கை தயாராகிறது.</i>")
        prompt = f"Conduct an exhaustive 25-year historical, biographical, and political deep-dive research on '{args}'. Outline early background, entry into public service/politics (around 1999-2005), parliamentary journey, ministerial portfolios (e.g. Health, Plantation, Industry), major policy achievements, controversies/scrutiny, timeline milestones, and current standing. Deliver rich, high-density facts in Tamil."
        response_text = await ask_sam_ai(prompt, f"Exhaustive 25-year chronological research report on {args} in Tamil with bold section headers.")
        await send_telegram_message_async(chat_id, f"📋 <b>25-Year Deep-Dive Research Report: {args}</b>\n\n{response_text}")
        return {"status": "ok"}
        
    # ── COMMAND: /learn (Knowledge & Learning) ──
    elif command in ["/learn", "/study", "/tech"]:
        subject = args or "SAM AI Autonomous Capabilities & Multi-Model Architecture"
        await send_telegram_message_async(chat_id, f"📚 <i>'{subject}' பற்றிய விரிவான விளக்கத்தை உருவாக்குகிறேன்...</i>")
        prompt = f"Explain the core concepts, technical mechanics, and practical applications of '{subject}' clearly with high-density insights in Tamil."
        response_text = await ask_sam_ai(prompt, "Educational breakdown in Tamil with structured bullet points.")
        await send_telegram_message_async(chat_id, f"📚 <b>கற்றல் & தொழில்நுட்ப விளக்கம் ({subject}):</b>\n\n{response_text}")
        return {"status": "ok"}
        
    # ── COMMAND: /briefing (Daily Executive Digest) ──
    elif command in ["/briefing", "/daily", "/today"]:
        await send_telegram_message_async(chat_id, "📊 <i>இன்றைய முழு நாளுக்கான Executive Intelligence Briefing தயாராகிறது...</i>")
        prompt = "Generate today's complete Daily Intelligence Briefing: 1. Sri Lanka Summary, 2. Global Markets & Crypto Overview, 3. SAM AI Platform & Agency Updates, 4. Top Recommendation for Today. Format clearly in Tamil."
        response_text = await ask_sam_ai(prompt, "Daily Executive Briefing in Tamil.")
        await send_telegram_message_async(chat_id, f"📊 <b>Sam AI Assistant - Daily Executive Briefing:</b>\n\n{response_text}")
        return {"status": "ok"}
        
    # ── ADMIN KEY MANAGEMENT COMMANDS ──
    elif command == "/newadminkey":
        key_code = f"SAM-ADMIN-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
        new_key = models.AccessKey(
            key_code=key_code,
            key_type="admin",
            max_uses=9999,
            telegram_chat_id=str(chat_id)
        )
        db.add(new_key)
        db.commit()
        await send_telegram_message_async(chat_id, f"👑 <b>New Admin Access Key Generated:</b>\n<code>{key_code}</code>")
        return {"status": "ok"}
        
    elif command == "/staffkey":
        duration = args.lower() if args else "7d"
        days_map = {"24h": 1, "7d": 7, "14d": 14, "30d": 30}
        days = days_map.get(duration, 7)
        
        key_code = f"SAM-STAFF-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
        expires_at = datetime.utcnow() + timedelta(days=days)
        
        new_key = models.AccessKey(
            key_code=key_code,
            key_type="staff",
            duration_label=duration,
            max_uses=100,
            expires_at=expires_at,
            telegram_chat_id=str(chat_id)
        )
        db.add(new_key)
        db.commit()
        await send_telegram_message_async(chat_id, f"💼 <b>New Staff Key ({duration}) Generated:</b>\n<code>{key_code}</code>\nExpires: {expires_at.strftime('%Y-%m-%d')}")
        return {"status": "ok"}
        
    elif command == "/listkeys":
        keys = db.query(models.AccessKey).filter(models.AccessKey.status == "active").all()
        if not keys:
            await send_telegram_message_async(chat_id, "ℹ️ No active access keys found.")
        else:
            msg = "📋 <b>Active Platform Access Keys:</b>\n\n"
            for k in keys:
                msg += f"• <code>{k.key_code}</code> ({k.key_type.upper()}, uses: {k.current_uses}/{k.max_uses})\n"
            await send_telegram_message_async(chat_id, msg)
        return {"status": "ok"}
        
    elif command == "/revokekey":
        if not args:
            await send_telegram_message_async(chat_id, "⚠️ Usage: <code>/revokekey &lt;code&gt;</code>")
        else:
            key = db.query(models.AccessKey).filter(models.AccessKey.key_code == args).first()
            if key:
                key.status = "revoked"
                db.commit()
                await send_telegram_message_async(chat_id, f"🚫 Key <code>{args}</code> revoked successfully.")
            else:
                await send_telegram_message_async(chat_id, "⚠️ Key not found.")
        return {"status": "ok"}
        
    elif command == "/stats":
        users_count = db.query(models.User).count()
        chats_count = db.query(models.Chat).count()
        keys_count = db.query(models.AccessKey).filter(models.AccessKey.status == "active").count()
        msg = f"📊 <b>SAM AI System Statistics:</b>\n\n👥 Registered Users: {users_count}\n💬 Saved Chat Sessions: {chats_count}\n🔑 Active Access Keys: {keys_count}\n⚡ Core Engine: Operational (99.99%)"
        await send_telegram_message_async(chat_id, msg)
        return {"status": "ok"}
        
    elif command == "/rotate":
        new_key = secrets.token_urlsafe(32)
        rotation = models.AdminKeyRotation(
            old_key_hash=security.get_password_hash(security.SAM_MASTER_KEY),
            new_key_hash=security.get_password_hash(new_key),
            rotated_by="telegram_bot",
            telegram_chat_id=str(chat_id)
        )
        db.add(rotation)
        db.commit()
        security.SAM_MASTER_KEY = new_key
        
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_file):
            try:
                set_key(env_file, "SAM_MASTER_KEY", new_key)
            except Exception:
                pass
            
        await send_telegram_message_async(chat_id, f"🔄 <b>Master Security Key Rotated:</b>\n<code>{new_key}</code>")
        return {"status": "ok"}

    # ── FREEFORM CONVERSATION & INTELLIGENCE QUERIES ──
    else:
        # User is talking directly to Sam AI Assistant in natural language!
        # Check if the user is asking about a person like Ramesh Pathirana
        context = "The user is chatting with Sam AI Assistant on Telegram. Respond clearly in the language of the query (Tamil/English/Sinhala) with factual, structured information."
        if "ramesh" in text.lower() or "pathirana" in text.lower():
            context += " Conduct a thorough 25-year biographical, political, and medical career breakdown of Dr. Ramesh Pathirana (former Cabinet Minister of Health/Plantation/Industries, Galle District MP, son of late Richard Pathirana)."
            
        response_text = await ask_sam_ai(text, context)
        await send_telegram_message_async(chat_id, response_text)
        return {"status": "ok"}
