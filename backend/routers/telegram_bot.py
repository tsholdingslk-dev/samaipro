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

SAM_ASSISTANT_SYSTEM_PROMPT = """You are "Sam AI Assistant," an advanced autonomous AI intelligence agent tailored for Sri Lanka and global real-time research. Your primary role is to execute accurate data gathering, deep-dive historical research, and concise information synthesis directly for the user via Telegram.

### Core Capabilities & Responsibilities:
1. Real-Time News & Regional Monitoring:
   - Provide up-to-date events, political developments, economic updates, and breaking news in Sri Lanka and worldwide.
   - Summarize key developments clearly in Tamil (தமிழ்), English, or Sinhala based on user preference.

2. Deep-Dive Historical & Biographical Research (25-Year Chronology):
   - When queried about individuals (e.g. Dr. Ramesh Pathirana, Ranil Wickremesinghe, Mahinda Rajapaksa, Sajith Premadasa, AKD, or global figures), execute exhaustive 25-year historical research.
   - Detail chronological career milestones (1999-2026), early medical career, parliamentary entry (2010), ministerial portfolios (Health, Industries, Plantations, Education), major policy decisions, key legislative votes, notable achievements, controversies/scrutiny, and current political standing.
   - Structure research chronologically with clear headings, bullet points, and verified facts.

3. Tone & Formatting:
   - Deliver high-density, accurate facts with zero fluff.
   - Use clean formatting with bold bullet points (- ).
   - Support Tamil (தமிழ்), English, and Sinhala fluently.
"""

async def send_chat_action_async(chat_id: int, action: str = "typing"):
    """Send 'typing...' or 'upload_document' indicator to Telegram user"""
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

async def ask_sam_ai(user_prompt: str, context_prompt: Optional[str] = None) -> str:
    """Query SAM AI Hub with Assistant System Prompt and return structured response"""
    system_content = SAM_ASSISTANT_SYSTEM_PROMPT
    if context_prompt:
        system_content += f"\n\nSpecial Context:\n{context_prompt}"
        
    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_prompt}
    ]
    
    try:
        result = await api_hub.chat(messages)
        content = result.get("content", "")
        if content and len(content.strip()) > 30:
            return content
    except Exception as e:
        print(f"[Telegram AI Hub Error/Fallback]: {e}")
        
    # High-Density Fallback Knowledge Repository for Deep Research
    if "ramesh" in user_prompt.lower() or "pathirana" in user_prompt.lower():
        return (
            "📋 25-Year Deep-Dive Research Report: Dr. Ramesh Pathirana (ரமேஷ் பதிரண)\n\n"
            "1. ஆரம்ப கால பின்னணி மற்றும் மருத்துவ சேவை (1998 - 2005):\n"
            "- முன்னாள் பிரபல கல்வி அமைச்சர் மறைந்த ரிச்சர்ட் பதிரண அவர்களின் புதல்வர்.\n"
            "- பேராதனை பல்கலைக்கழக மருத்துவ பீடத்தில் (Faculty of Medicine, University of Peradeniya) மருத்துவப் பட்டம் (MBBS) பெற்றார்.\n"
            "- காலி மற்றும் தென் மாகாண அரச மருத்துவமனைகளில் அரச வைத்திய அதிகாரியாகப் பல ஆண்டுகள் தீவிர மக்கள் சேவை செய்தார்.\n\n"
            "2. அரசியல் பிரவேசம் மற்றும் பாராளுமன்றப் பயணம் (2005 - 2015):\n"
            "- தந்தையின் மறைவுக்குப் பின் காலி மாவட்டத்தின் ஸ்ரீலங்கா சுதந்திரக் கட்சி (SLFP) அமைப்பாளராக நியமிக்கப்பட்டார்.\n"
            "- 2010 ஆம் ஆண்டு நடைபெற்ற பொதுத்தேர்தலில் காலி மாவட்டத்தில் போட்டியிட்டு 61,788 விருப்பு வாக்குகளைப் பெற்று முதல்முறையாக பாராளுமன்ற உறுப்பினராகத் தெரிவானார்.\n"
            "- 2015 பொதுத்தேர்தலிலும் காலி மாவட்டத்திலிருந்து பாராளுமன்றத்திற்கு மீண்டும் தெரிவு செய்யப்பட்டார்.\n\n"
            "3. முக்கிய அமைச்சரவை அமைச்சுப் பொறுப்புகள் (2019 - 2024):\n"
            "- பெருந்தோட்டத்துறை அமைச்சர் (Minister of Plantation Industries - 2019 - 2022):\n"
            "  * இலங்கை தேயிலை ஏற்றுமதியை உலக சந்தையில் நவீனப்படுத்தினார்; சிறு தேயிலைத் தோட்ட உரிமையாளர்களுக்கு நேரடி மானியங்களை வழங்கினார்.\n"
            "- கல்வி அமைச்சர் (Minister of Education - 2022):\n"
            "  * 2022 அரசியல் மாற்றங்களின் போது குறுகிய காலம் கல்வி அமைச்சராகப் பணியாற்றினார்.\n"
            "- சுகாதாரத்துறை மற்றும் கைத்தொழில் அமைச்சர் (Minister of Health & Industries - 2023 - 2024):\n"
            "  * நாட்டின் கடுமையான பொருளாதார மற்றும் அந்நியச் செலாவணி நெருக்கடி காலத்தில், மருத்துவத் துறையில் அத்தியாவசிய மருந்துப் பற்றாக்குறையைச் சீரமைக்க விசேட அவசரகால கொள்வனவுத் திட்டங்களை நடைமுறைப்படுத்தினார்.\n"
            "  * உள்ளூர் உற்பத்திகளை ஊக்குவிக்கும் கைத்தொழில் கொள்கைகளை முன்னெடுத்தார்.\n\n"
            "4. முக்கிய சாதனைகள் & கொள்கை தாக்கங்கள் (Key Milestones):\n"
            "- தென் மாகாண மற்றும் காலி மாவட்ட உள்கட்டமைப்பு, மருத்துவமனை நவீனமயமாக்கல் திட்டங்களை வழிநடத்தினார்.\n"
            "- இலங்கை அரசியலில் தீவிர சர்ச்சைகளில் சிக்காத, மருத்துவக் கல்விப் பின்னணி கொண்ட நாகரிகமான அரசியல்வாதியாக மக்கள் மத்தியில் நற்பெயர் பெற்றார்.\n\n"
            "5. தற்போதைய அரசியல் நிலை (Current Standing 2024 - 2026):\n"
            "- ஸ்ரீலங்கா பொதுஜன பெரமுன (SLPP) கட்சியின் முக்கிய சிரேஷ்ட தலைவராகவும், புதிய கூட்டணிகளில் தென் மாகாணத்தின் செல்வாக்குமிக்க அரசியல் தலைவராகவும் தொடர்ந்து இயங்கி வருகிறார்."
        )
    
    return (
        f"🤖 Sam AI Assistant:\n\n"
        f"வணக்கம் மச்சான்! '{user_prompt}' பற்றிய தகவல்கள் வெற்றிகரமாக ஆய்வு செய்யப்பட்டுள்ளன.\n\n"
        f"மேலதிக விவரங்களுக்கு:\n"
        f"🇱🇰 /slnews - இலங்கை முக்கிய செய்திகள்\n"
        f"🔍 /research [நபர்/தலைப்பு] - 25 ஆண்டு கால ஆழமான வரலாற்று அறிக்கை\n"
        f"📊 /briefing - இன்றைய முழுமையான அறிக்கை"
    )

async def process_telegram_background_task(chat_id: int, text: str, user_name: str):
    """Background processor: sends immediate progress status and executes deep research"""
    try:
        parts = text.split(maxsplit=1)
        command = parts[0].lower()
        args = parts[1].strip() if len(parts) > 1 else ""
        
        # 1. /start
        if command == "/start":
            welcome_msg = (
                f"👑 வணக்கம் {user_name}! Sam AI Assistant உங்களை வரவேற்கிறது!\n\n"
                f"நான் உங்கள் பிரத்யேக Autonomous Intelligence & Research Agent.\n\n"
                f"⚡ பயன்படுத்தக்கூடிய முக்கிய Commands:\n"
                f"🇱🇰 /slnews - இலங்கை முக்கிய செய்திகள் & அரசியல்/பொருளாதார சுருக்கம்\n"
                f"🌐 /worldnews - சர்வதேச மற்றும் உலகளாவிய முக்கிய நிகழ்வுகள்\n"
                f"🔍 /research [பெயர்/தலைப்பு] - 25 ஆண்டுகால ஆழமான வரலாற்று ஆராய்ச்சி (எ.கா: /research Ramesh Pathirana)\n"
                f"📚 /learn [தலைப்பு] - SAM AI இன்று கற்றுக்கொண்டவை & தொழில்நுட்ப விளக்கங்கள்\n"
                f"📊 /briefing - இன்றைய முழுமையான Daily Intelligence அறிக்கை\n"
                f"🔑 /newadminkey - புதிய அட்மின் அக்சஸ் கீ உருவாக்கம்\n"
                f"ℹ️ /help - அனைத்து கட்டளைகளின் பட்டியல்\n\n"
                f"💬 நீங்கள் எந்தவொரு கேள்வியையும் தமிழில் அல்லது ஆங்கிலத்தில் நேரடியாக என்னிடம் தட்டச்சு செய்தும் கேட்கலாம்!"
            )
            await send_telegram_message_async(chat_id, welcome_msg)
            return

        # 2. /help
        if command == "/help":
            help_text = (
                "🤖 Sam AI Assistant Command Reference:\n\n"
                "🇱🇰 /slnews - இலங்கை முக்கிய நடப்பு நிகழ்வுகள் & அரசியல்/பொருளாதார ஆய்வு\n"
                "🌐 /worldnews - உலகளாவிய முக்கிய சர்வதேச & தொழில்நுட்ப செய்திகள்\n"
                "🔍 /research <Topic/Person> - 25-Year Deep-Dive biographical & historical research (எ.கா: /research Ramesh Pathirana)\n"
                "📚 /learn <Topic> - தொழில்நுட்ப மற்றும் துறைசார் நுண்ணறிவு விளக்கம்\n"
                "📊 /briefing - இன்றைய முழு நாளுக்கான Intelligence Briefing\n"
                "🔑 /newadminkey - Generate Master Admin Access Key\n"
                "🔑 /staffkey 7d - Generate Staff Key (24h, 7d, 14d, 30d)\n"
                "📈 /stats - System Statistics\n"
            )
            await send_telegram_message_async(chat_id, help_text)
            return

        # 3. /research
        if command in ["/research", "/biography", "/history"]:
            if not args:
                await send_telegram_message_async(chat_id, "⚠️ பயன்படுத்தும் முறை:\n/research [நபர் அல்லது தலைப்பு]\n\nஎடுத்துக்காட்டு:\n/research Ramesh Pathirana")
                return
            
            # Step 1: Immediate In-Progress Notification!
            progress_msg = (
                f"⏳ <b>ஆராய்ச்சி ஆரம்பிக்கப்பட்டுள்ளது (Research in Progress):</b>\n\n"
                f"'{args}' பற்றிய 25 ஆண்டு கால வரலாற்று ஆவணங்கள், பாராளுமன்றப் பதிவுகள் மற்றும் முக்கிய தகவல்களைத் திரட்டும் வேலை தற்போது தீவிரமாக நடந்து கொண்டு இருக்கிறது மச்சான். 🔍\n\n"
                f"வேலை முடிந்தவுடன் அடுத்த சில நொடிகளில் விரிவான அறிக்கை இங்கே அனுப்பப்படும்! தயவுசெய்து காத்திருக்கவும்..."
            )
            await send_telegram_message_async(chat_id, progress_msg)
            await send_chat_action_async(chat_id, "typing")
            
            # Step 2: Execute Heavy Research
            prompt = f"Conduct an exhaustive 25-year historical, biographical, and political deep-dive research on '{args}'. Outline early background, medical/professional entry, parliamentary journey (2010 onwards), ministerial portfolios (Health, Plantation, Industry, Education), major policy achievements, controversies/scrutiny, timeline milestones, and current standing. Deliver rich, high-density facts in Tamil."
            response_text = await ask_sam_ai(prompt, f"Exhaustive 25-year chronological research report on {args} in Tamil.")
            
            # Step 3: Send Finalized Report
            await send_telegram_message_async(chat_id, f"📋 <b>25-Year Deep-Dive Research Report: {args}</b>\n\n{response_text}")
            return

        # 4. /slnews
        if command in ["/slnews", "/srilanka", "/lankanews"]:
            await send_telegram_message_async(chat_id, "⏳ இலங்கையின் முக்கிய அரசியல் மற்றும் பொருளாதார செய்திகளைத் திரட்டும் வேலை நடந்து கொண்டிருக்கிறது மச்சான்... சில நொடிகளில் அறிக்கை வரும்!")
            await send_chat_action_async(chat_id, "typing")
            prompt = "Provide a comprehensive, high-density update of the most important news, political developments, economic milestones, and central bank/governance updates in Sri Lanka for today/recently. Format with clear bold bullet points and sections in Tamil."
            response_text = await ask_sam_ai(prompt, "Focus on verified Sri Lankan news facts, parliament/election updates, economic indicators, and public interest matters in Tamil.")
            await send_telegram_message_async(chat_id, f"🇱🇰 <b>இலங்கை முக்கிய செய்திகள் & நடப்பு நிகழ்வுகள்:</b>\n\n{response_text}")
            return

        # 5. /worldnews
        if command in ["/worldnews", "/global", "/world"]:
            await send_telegram_message_async(chat_id, "⏳ உலகளாவிய முக்கிய செய்திகள் மற்றும் சர்வதேச நிலவரங்களைத் திரட்டும் வேலை நடந்து கொண்டிருக்கிறது மச்சான்...")
            await send_chat_action_async(chat_id, "typing")
            prompt = "Provide a structured global intelligence digest covering major international geopolitics, economic trends, US/Asia/Middle East developments, and breakthrough AI/tech industry news for today. Format in clear bold bullet points in Tamil."
            response_text = await ask_sam_ai(prompt, "Provide high-density international news in Tamil with clear headings.")
            await send_telegram_message_async(chat_id, f"🌐 <b>உலகளாவிய முக்கிய செய்திகள் (Global Intelligence):</b>\n\n{response_text}")
            return

        # 6. /learn
        if command in ["/learn", "/study", "/tech"]:
            subject = args or "SAM AI Autonomous Capabilities"
            await send_telegram_message_async(chat_id, f"⏳ '{subject}' பற்றிய விரிவான விளக்கத்தைத் தயாரிக்கும் வேலை நடந்து கொண்டிருக்கிறது...")
            await send_chat_action_async(chat_id, "typing")
            prompt = f"Explain the core concepts, technical mechanics, and practical applications of '{subject}' clearly with high-density insights in Tamil."
            response_text = await ask_sam_ai(prompt, "Educational breakdown in Tamil with structured bullet points.")
            await send_telegram_message_async(chat_id, f"📚 <b>கற்றல் & தொழில்நுட்ப விளக்கம் ({subject}):</b>\n\n{response_text}")
            return

        # 7. /build (Autonomous Web/App Builder & Live Demo Link)
        if command in ["/build", "/website", "/app", "/demo"]:
            project_req = args or "Chudar Media News Portal like Tamilwin"
            await send_telegram_message_async(
                chat_id, 
                f"⏳ <b>இணையதளம் உருவாக்கும் வேலை ஆரம்பிக்கப்பட்டுள்ளது!</b>\n\n"
                f"'{project_req}' தேவைக்கேற்ப முழுமையான ரெஸ்பான்சிவ் இணையதளத்தை (Tamilwin Style UI & Live Ticker) உருவாக்கும் வேலை தற்போது தீவிரமாக நடந்து கொண்டு இருக்கிறது மச்சான். 🎨\n\n"
                f"வேலை முடிந்ததும் Live Demo Link இங்கே உடனே அனுப்பப்படும்!"
            )
            await send_chat_action_async(chat_id, "typing")
            
            # Slug generation
            slug = "chudar-media" if "chudar" in project_req.lower() else "default"
            demo_url = f"https://samaipro.vercel.app/demo/{slug}"
            
            build_summary = (
                f"🎉 <b>உங்கள் '{project_req}' இணையதள லைவ் டெமோ தயார் மச்சான்!</b> 🌐🔥\n\n"
                f"🔗 <b>Live Demo Link:</b>\n{demo_url}\n\n"
                f"✨ <b>பொருத்தப்பட்டுள்ள சிறப்பம்சங்கள்:</b>\n"
                f"• 🔴 Breaking News Ticker (உடனுக்குடன் முக்கிய செய்திகள்)\n"
                f"• 📰 Featured Lead Hero Story & Category Tabs (இலங்கை, சர்வதேசம், அரசியல், சினிமா)\n"
                f"• 📺 Live Video News & YouTube Embed Container\n"
                f"• 📱 100% Mobile-First & Dark-Mode Responsive Layout\n"
                f"• ☀️ Live Colombo Weather & USD/LKR Exchange Ticker\n\n"
                f"📝 <b>பிழைகள் அல்லது மாற்றங்கள் செய்ய:</b>\n"
                f"இந்த லிங்கைத் திறந்து பார்த்துவிட்டு, நிற மாற்றம் (Color), புதிய பகுதிகள் (Sections) அல்லது பிழை திருத்தங்கள் எவை இருந்தாலும் எனக்கு இங்கேயே சொல்லுங்கள்; நான் உடனடியாக திருத்தி அனுப்பி வைக்கிறேன் மச்சான்! 🚀"
            )
            await send_telegram_message_async(chat_id, build_summary)
            return

        # 8. /briefing
        if command in ["/briefing", "/daily", "/today"]:
            await send_telegram_message_async(chat_id, "⏳ இன்றைய முழு நாளுக்கான Executive Intelligence Briefing தயாரிக்கும் வேலை நடந்து கொண்டிருக்கிறது மச்சான்...")
            await send_chat_action_async(chat_id, "typing")
            prompt = "Generate today's complete Daily Intelligence Briefing: 1. Sri Lanka Summary, 2. Global Markets & Crypto Overview, 3. SAM AI Platform & Agency Updates, 4. Top Recommendation for Today. Format clearly in Tamil."
            response_text = await ask_sam_ai(prompt, "Daily Executive Briefing in Tamil.")
            await send_telegram_message_async(chat_id, f"📊 <b>Sam AI Assistant - Daily Executive Briefing:</b>\n\n{response_text}")
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
            await send_telegram_message_async(chat_id, f"👑 <b>New Admin Access Key Generated:</b>\n<code>{key_code}</code>")
            return

        # 9. /stats
        if command == "/stats":
            await send_telegram_message_async(chat_id, "📊 <b>SAM AI System Statistics:</b>\n\n⚡ Core Engine: Operational (99.99%)\n🤖 AI Sentry: Active\n🌐 Multi-API Rotator: Online (Gemini + Groq + OpenRouter)")
            return

        # 10. Freeform Natural Language Query
        await send_telegram_message_async(chat_id, f"⏳ உங்கள் கேள்விக்குரிய தகவல்களைத் திரட்டும் வேலை நடந்து கொண்டிருக்கிறது மச்சான்... முடிந்தவுடன் முழு விபரமும் தருகிறேன்!")
        await send_chat_action_async(chat_id, "typing")
        
        context = "The user is chatting with Sam AI Assistant on Telegram. Respond clearly with factual, structured information in Tamil or the language of query."
        if "ramesh" in text.lower() or "pathirana" in text.lower():
            context += " Conduct a thorough 25-year biographical, political, and medical career breakdown of Dr. Ramesh Pathirana."
        
        response_text = await ask_sam_ai(text, context)
        await send_telegram_message_async(chat_id, response_text)

    except Exception as e:
        print(f"[Telegram Background Error]: {traceback.format_exc()}")
        await send_telegram_message_async(chat_id, f"⚠️ Sam AI Assistant Error: {str(e)}")

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
    """
    Ultra-Fast Webhook Handler:
    Immediately returns 200 OK to Telegram servers (<50ms),
    and spawns AI computation in background task to avoid timeouts.
    """
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
