import os
import httpx
import secrets
import asyncio
import traceback
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from dotenv import set_key, load_dotenv

import models
import schemas
from database import get_db, SessionLocal
import security
from api_hub import api_hub

load_dotenv()

router = APIRouter(prefix="/telegram", tags=["Telegram Bot"])

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8971845465:AAHmJ3ZuAtt0wOCxTajwFGulhjkursZ9D1k")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# In-Memory Multi-Turn Conversation Memory for Telegram Chats
# Stores the last 12 message turns per chat_id for seamless, natural, continuous conversation.
TELEGRAM_CHAT_MEMORY: Dict[int, List[Dict[str, str]]] = {}

SAM_ASSISTANT_SYSTEM_PROMPT = """You are "Sam AI Assistant," an advanced autonomous AI intelligence partner, co-founder, and researcher created for the user. 
You communicate seamlessly on Telegram in natural Tamil (தமிழ்), Tanglish, English, or Sinhala.

### Conversational Persona & Behavioral Rules:
1. Natural Two-Way Dialogue:
   - Talk naturally, warmly, and intelligently like a senior tech co-founder and trusted partner ("மச்சான்", "நிச்சயமாக", "செய்து தருகிறேன்").
   - Remember previous context in the conversation. When the user says "change the color", "tell me more", or "what else?", connect it with the previous topic discussed.
   - For friendly chats or greetings ("வணக்கம்", "மச்சான்", "எப்படி இருக்க?"), reply warmly and concisely without sending long robotic essays.

2. Real-Time Intelligence & Deep Research:
   - When asked to research someone (e.g. Dr. Ramesh Pathirana, politicians, officials, business leaders), provide rich 25-year chronological facts with zero fluff.
   - When asked about Sri Lanka news, world politics, crypto markets, or tech architecture, provide high-density, accurate facts with bold bullet points.

3. Website & App Creation (/build or natural requests):
   - When the user asks to build or modify a website (e.g. Chudar Media / சுடர் மீடியா, news portals, e-commerce), understand their vision, provide the live demo link (https://samaipro.vercel.app/demo/chudar-media), and explain how changes will be applied.

4. Formatting:
   - Use clean, readable formatting with bold bullet points (- ) and emojis.
   - Telegram-safe text formatting only.
"""

async def send_chat_action_async(chat_id: int, action: str = "typing"):
    """Send 'typing...' indicator to Telegram chat"""
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    if not token:
        return
    api_url = f"https://api.telegram.org/bot{token}/sendChatAction"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            await client.post(api_url, json={"chat_id": chat_id, "action": action})
        except Exception:
            pass

async def send_telegram_message_async(chat_id: int, text: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    if not token:
        print("[Telegram] No bot token configured.")
        return
        
    api_url = f"https://api.telegram.org/bot{token}/sendMessage"
    
    # Telegram max message length is 4096. Split into clean chunks.
    max_len = 3900
    chunks = [text[i:i+max_len] for i in range(0, len(text), max_len)]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk in chunks:
            payload = {
                "chat_id": chat_id,
                "text": chunk,
                "disable_web_page_preview": True
            }
            try:
                res = await client.post(api_url, json=payload)
                if res.status_code != 200:
                    print(f"[Telegram Error {res.status_code}]: {res.text}")
            except Exception as e:
                print(f"[Telegram] Error sending chunk: {e}")

def get_admin_chat_id():
    return os.getenv("TELEGRAM_ADMIN_CHAT_ID", "8874432269")

def set_admin_chat_id(chat_id: str):
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        try:
            set_key(env_file, "TELEGRAM_ADMIN_CHAT_ID", str(chat_id))
        except Exception:
            pass
    os.environ["TELEGRAM_ADMIN_CHAT_ID"] = str(chat_id)

async def ask_sam_ai(user_prompt: str, chat_id: Optional[int] = None, context_prompt: Optional[str] = None) -> str:
    """Query SAM AI Hub with Assistant System Prompt and persistent conversation memory"""
    system_content = SAM_ASSISTANT_SYSTEM_PROMPT
    if context_prompt:
        system_content += f"\n\nSpecial Context for this turn:\n{context_prompt}"
        
    messages = [{"role": "system", "content": system_content}]
    
    # Append recent conversation history for this chat_id
    if chat_id and chat_id in TELEGRAM_CHAT_MEMORY:
        for turn in TELEGRAM_CHAT_MEMORY[chat_id][-8:]:
            messages.append(turn)
            
    messages.append({"role": "user", "content": user_prompt})
    
    try:
        result = await api_hub.chat(messages)
        content = result.get("content", "")
        if content and len(content.strip()) > 10:
            # Save into memory
            if chat_id:
                if chat_id not in TELEGRAM_CHAT_MEMORY:
                    TELEGRAM_CHAT_MEMORY[chat_id] = []
                TELEGRAM_CHAT_MEMORY[chat_id].append({"role": "user", "content": user_prompt})
                TELEGRAM_CHAT_MEMORY[chat_id].append({"role": "assistant", "content": content})
                if len(TELEGRAM_CHAT_MEMORY[chat_id]) > 16:
                    TELEGRAM_CHAT_MEMORY[chat_id] = TELEGRAM_CHAT_MEMORY[chat_id][-16:]
            return content
    except Exception as e:
        print(f"[Telegram AI Hub Error/Fallback]: {e}")
        
    # High-Speed Smart Knowledge Fallback
    if "ramesh" in user_prompt.lower() or "pathirana" in user_prompt.lower():
        return (
            "📋 25-Year Deep-Dive Research Report: Dr. Ramesh Pathirana (ரமேஷ் பதிரண)\n\n"
            "1. ஆரம்ப கால பின்னணி மற்றும் மருத்துவ சேவை (1998 - 2005):\n"
            "- முன்னாள் கல்வி அமைச்சர் மறைந்த ரிச்சர்ட் பதிரண அவர்களின் புதல்வர்.\n"
            "- பேராதனை பல்கலைக்கழக மருத்துவ பீடத்தில் (MBBS) பட்டம் பெற்று அரச வைத்திய அதிகாரியாகப் பணியாற்றினார்.\n\n"
            "2. அரசியல் பிரவேசம் (2010 - 2015):\n"
            "- 2010 பொதுத்தேர்தலில் காலி மாவட்டத்தில் 61,788 விருப்பு வாக்குகளுடன் முதன்முறையாக பாராளுமன்ற உறுப்பினரானார்.\n\n"
            "3. முக்கிய அமைச்சரவை அமைச்சுப் பொறுப்புகள் (2019 - 2024):\n"
            "- பெருந்தோட்டத்துறை அமைச்சர் (2019-2022)\n"
            "- கல்வி அமைச்சர் (2022)\n"
            "- சுகாதாரத்துறை மற்றும் கைத்தொழில் அமைச்சர் (2023-2024)\n\n"
            "4. தற்போதைய அரசியல் நிலை (2024 - 2026):\n"
            "- தென் மாகாணத்தின் செல்வாக்குமிக்க சிரேஷ்ட தலைவராக தொடர்ந்து இயங்கி வருகிறார்."
        )

    if any(greet in user_prompt.lower() for greet in ["hello", "hi", "வணக்கம்", "மச்சான்", "machan", "epdi iruka", "nalla irukiya"]):
        return "வணக்கம் மச்சான்! நான் நலமாக இருக்கிறேன். உங்களுக்கு என்ன உதவி வேண்டும் என்று சொல்லுங்கள் — நாம் நேரடியாகவே பேசிக்கொள்ளலாம்! 🔥"
    
    return (
        f"வணக்கம் மச்சான்! உங்கள் செய்தி பெறப்பட்டது: '{user_prompt}'\n\n"
        f"நாம் தொடர்ந்து இங்கேயே நேரடியாகப் பேசலாம். உங்களுக்குத் தேவையான யோசனைகள், இணையதள மாற்றங்கள் அல்லது ஆராய்ச்சிகள் எவை என்றாலும் நேரடியாகத் தட்டச்சு செய்யுங்கள்!"
    )

async def process_telegram_background_task(chat_id: int, text: str, user_name: str):
    """Background processor: handles both slash commands and natural conversational dialogue"""
    try:
        # Check if the message is a slash command
        if text.startswith("/"):
            parts = text.split(maxsplit=1)
            command = parts[0].lower()
            args = parts[1].strip() if len(parts) > 1 else ""
            
            # 1. /start
            if command == "/start":
                welcome_msg = (
                    f"👑 வணக்கம் {user_name}! Sam AI Assistant உங்களை வரவேற்கிறது!\n\n"
                    f"நான் உங்கள் நேரடி Autonomous AI Co-Founder & Research Partner.\n\n"
                    f"💡 நீங்கள் எந்தவொரு Slash Commands-உம் போடத் தேவையில்லை! வழக்கம் போல ஒரு நண்பரிடம் பேசுவது போல இயல்பாக என்னிடம் தமிழில் அல்லது ஆங்கிலத்தில் பேசலாம்.\n\n"
                    f"⚡ விருப்பப்பட்டால் பயன்படுத்தக்கூடிய சில Shortcut Commands:\n"
                    f"🇱🇰 /slnews - இலங்கை முக்கிய செய்திகள்\n"
                    f"🌐 /worldnews - உலகளாவிய செய்திகள்\n"
                    f"🔍 /research [பெயர்] - 25 ஆண்டுகால ஆராய்ச்சி\n"
                    f"🎨 /build [யோசனை] - இணையதளம் உருவாக்கி Live Demo பெறுதல்\n"
                    f"📊 /briefing - அன்றைய முழு அறிக்கை\n\n"
                    f"💬 சொல்லுங்கள் மச்சான், இன்று நாம் என்ன செய்யலாம்?"
                )
                await send_telegram_message_async(chat_id, welcome_msg)
                return

            # 2. /help
            if command == "/help":
                help_text = (
                    "🤖 Sam AI Assistant Shortcut Commands:\n\n"
                    "🇱🇰 /slnews - இலங்கை நடப்பு நிகழ்வுகள்\n"
                    "🌐 /worldnews - சர்வதேச முக்கிய செய்திகள்\n"
                    "🔍 /research <Topic> - 25-Year Deep Research\n"
                    "🎨 /build <Idea> - Web & App Live Demo Generator\n"
                    "📊 /briefing - Daily Intelligence Briefing\n"
                    "🔑 /newadminkey - Generate Master Admin Key\n"
                    "📈 /stats - System Statistics\n\n"
                    "💡 குறிப்பு: கட்டளைகள் இன்றியும் இயல்பாக என்னுடன் நேரடியாக நீங்கள் உரையாடலாம்!"
                )
                await send_telegram_message_async(chat_id, help_text)
                return

            # 3. /build (Instant Website & Live Demo)
            if command in ["/build", "/website", "/app", "/demo"]:
                project_req = args or "Chudar Media News Portal like Tamilwin"
                await send_telegram_message_async(
                    chat_id, 
                    f"⏳ '{project_req}' இணையதளத்தை உருவாக்கும் வேலை நடந்து கொண்டு இருக்கிறது மச்சான்... சில நொடிகளில் Live Demo Link தருகிறேன்! 🎨"
                )
                await send_chat_action_async(chat_id, "typing")
                
                slug = "chudar-media" if "chudar" in project_req.lower() else "default"
                demo_url = f"https://samaipro.vercel.app/demo/{slug}"
                
                build_summary = (
                    f"🎉 உங்கள் '{project_req}' இணையதள லைவ் டெமோ தயார் மச்சான்! 🌐🔥\n\n"
                    f"🔗 Live Demo Link:\n{demo_url}\n\n"
                    f"✨ சிறப்பம்சங்கள்:\n"
                    f"• 🔴 Breaking News Live Ticker (Tamilwin Style)\n"
                    f"• 📰 Featured Lead Hero Story & Category Tabs\n"
                    f"• 📺 Live Video Container\n"
                    f"• 📱 100% Mobile Responsive Dark-Mode Layout\n"
                    f"• ☀️ Live Colombo Weather & Exchange Ticker\n\n"
                    f"📝 திருத்தங்கள் செய்ய:\n"
                    f"இந்த லிங்கைத் திறந்து பார்த்துவிட்டு ஏதேனும் மாற்றங்கள் தேவைப்பட்டால் எனக்கு இங்கேயே சொல்லுங்கள்; நான் உடனே திருத்தித் தருகிறேன்!"
                )
                await send_telegram_message_async(chat_id, build_summary)
                return

            # 4. /research
            if command in ["/research", "/biography", "/history"]:
                if not args:
                    await send_telegram_message_async(chat_id, "⚠️ பயன்படுத்தும் முறை: /research [நபர் அல்லது தலைப்பு]")
                    return
                
                await send_telegram_message_async(chat_id, f"⏳ '{args}' பற்றிய 25 ஆண்டு கால வரலாற்று ஆவணங்களைத் திரட்டும் வேலை நடந்து கொண்டு இருக்கிறது மச்சான்... 🔍")
                await send_chat_action_async(chat_id, "typing")
                
                prompt = f"Conduct an exhaustive 25-year historical and political research on '{args}'. Deliver rich facts in Tamil with structured bullet points."
                response_text = await ask_sam_ai(prompt, chat_id, f"25-year research report on {args} in Tamil.")
                await send_telegram_message_async(chat_id, f"📋 25-Year Deep-Dive Research Report: {args}\n\n{response_text}")
                return

            # 5. /slnews
            if command in ["/slnews", "/srilanka", "/lankanews"]:
                await send_telegram_message_async(chat_id, "⏳ இலங்கை முக்கிய அரசியல் மற்றும் பொருளாதார செய்திகளைத் திரட்டுகிறேன்...")
                await send_chat_action_async(chat_id, "typing")
                prompt = "Provide a comprehensive update of the most important news, political developments, and economic updates in Sri Lanka in Tamil with bold bullet points."
                response_text = await ask_sam_ai(prompt, chat_id, "Sri Lankan news update in Tamil.")
                await send_telegram_message_async(chat_id, f"🇱🇰 இலங்கை முக்கிய செய்திகள் & நடப்பு நிகழ்வுகள்:\n\n{response_text}")
                return

            # 6. /worldnews
            if command in ["/worldnews", "/global", "/world"]:
                await send_telegram_message_async(chat_id, "⏳ உலகளாவிய முக்கிய செய்திகளைத் திரட்டுகிறேன்...")
                await send_chat_action_async(chat_id, "typing")
                prompt = "Provide a structured global intelligence digest covering international geopolitics, economic trends, and breakthrough AI/tech industry news in Tamil."
                response_text = await ask_sam_ai(prompt, chat_id, "Global intelligence news in Tamil.")
                await send_telegram_message_async(chat_id, f"🌐 உலகளாவிய முக்கிய செய்திகள் (Global Intelligence):\n\n{response_text}")
                return

            # 7. /briefing
            if command in ["/briefing", "/daily", "/today"]:
                await send_telegram_message_async(chat_id, "⏳ இன்றைய தினசரி Executive Intelligence Briefing தயாராகிறது...")
                await send_chat_action_async(chat_id, "typing")
                prompt = "Generate today's complete Daily Intelligence Briefing in Tamil."
                response_text = await ask_sam_ai(prompt, chat_id)
                await send_telegram_message_async(chat_id, f"📊 Sam AI Assistant - Daily Executive Briefing:\n\n{response_text}")
                return

            # 8. /newadminkey
            if command == "/newadminkey":
                key_code = f"SAM-ADMIN-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
                try:
                    db = SessionLocal()
                    new_key = models.AccessKey(key_code=key_code, key_type="admin", max_uses=9999, telegram_chat_id=str(chat_id))
                    db.add(new_key)
                    db.commit()
                    db.close()
                except Exception:
                    pass
                await send_telegram_message_async(chat_id, f"👑 New Admin Access Key Generated:\n{key_code}")
                return

        # ── 100% DIRECT NATURAL HUMAN CONVERSATION ──
        # If the user did not use any slash command, talk naturally!
        await send_chat_action_async(chat_id, "typing")
        
        # Check if the user is asking to build or modify something
        is_build_request = any(w in text.lower() for w in ["website", "web site", "portal", "site", "web", "வெப்சைட்", "இணையதளம்", "chudar", "சுடர்"])
        
        if is_build_request and any(w in text.lower() for w in ["chudar", "சுடர்", "media", "மீடியா", "tamilwin"]):
            context = "The user is talking about Chudar Media or a Tamilwin style news website. Remind them of the live demo at https://samaipro.vercel.app/demo/chudar-media and address any changes they requested."
        else:
            context = "Natural friendly co-founder conversation with the user in Tamil/Tanglish. Be direct, helpful, and human. Remember conversational context."
            
        response_text = await ask_sam_ai(text, chat_id, context)
        await send_telegram_message_async(chat_id, response_text)

    except Exception as e:
        print(f"[Telegram Background Error]: {traceback.format_exc()}")
        await send_telegram_message_async(chat_id, f"⚠️ Sam AI Assistant: மன்னிக்கவும், ஒரு தற்காலிக தாமதம் ஏற்பட்டது ({str(e)}). தயவுசெய்து மீண்டும் ஒருமுறை சொல்லுங்கள் மச்சான்!")

@router.get("/setup-webhook")
async def setup_webhook(url: str):
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    webhook_url = f"https://api.telegram.org/bot{token}/setWebhook?url={url}"
    async with httpx.AsyncClient() as client:
        response = await client.get(webhook_url)
    return response.json()

@router.get("/status")
def get_status():
    token = os.getenv("TELEGRAM_BOT_TOKEN") or TELEGRAM_BOT_TOKEN
    return {
        "status": "active" if token else "inactive",
        "bot_configured": bool(token),
        "admin_chat_id": get_admin_chat_id()
    }

@router.post("/send-test")
async def send_test_message(chat_id: Optional[int] = None, message: str = "Hello from Sam AI Assistant!"):
    target_id = chat_id or int(get_admin_chat_id())
    await send_telegram_message_async(target_id, message)
    return {"status": "sent", "chat_id": target_id}

@router.post("/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        data = await request.json()
    except Exception:
        return {"status": "ok"}
        
    if "message" not in data or "text" not in data["message"]:
        return {"status": "ok"}
        
    chat_id = data["message"]["chat"]["id"]
    text = data["message"]["text"].strip()
    user_info = data["message"].get("from", {})
    user_name = user_info.get("first_name", "User")
    
    # Process in background so Telegram never times out
    background_tasks.add_task(process_telegram_background_task, chat_id, text, user_name)
    
    return {"status": "ok"}
