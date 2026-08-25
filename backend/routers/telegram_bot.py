import os
import httpx
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import set_key, load_dotenv

import models
import schemas
from database import get_db
import security

router = APIRouter(prefix="/telegram", tags=["Telegram Bot"])

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def send_telegram_message(chat_id: int, text: str):
    if not TELEGRAM_BOT_TOKEN:
        return
    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    try:
        with httpx.Client() as client:
            client.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send telegram message: {e}")

def get_admin_chat_id():
    return os.getenv("TELEGRAM_ADMIN_CHAT_ID")

def set_admin_chat_id(chat_id: str):
    env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_file):
        set_key(env_file, "TELEGRAM_ADMIN_CHAT_ID", str(chat_id))
    os.environ["TELEGRAM_ADMIN_CHAT_ID"] = str(chat_id)

@router.get("/setup-webhook")
async def setup_webhook(url: str):
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=400, detail="Telegram bot token not set")
    webhook_url = f"{TELEGRAM_API_URL}/setWebhook?url={url}"
    async with httpx.AsyncClient() as client:
        response = await client.get(webhook_url)
    return response.json()

@router.get("/status")
def get_status():
    return {
        "status": "active" if TELEGRAM_BOT_TOKEN else "inactive",
        "admin_chat_id": get_admin_chat_id()
    }

@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    
    if "message" not in data or "text" not in data["message"]:
        return {"status": "ok"}
        
    chat_id = data["message"]["chat"]["id"]
    text = data["message"]["text"].strip()
    
    admin_chat_id = get_admin_chat_id()
    
    if text.startswith("/start"):
        if not admin_chat_id:
            set_admin_chat_id(str(chat_id))
            send_telegram_message(chat_id, "Welcome to Sam AI Bot! You have been registered as the Admin.")
            return {"status": "ok"}
        elif str(chat_id) == str(admin_chat_id):
            send_telegram_message(chat_id, "Welcome back, Admin! Send /help for commands.")
            return {"status": "ok"}
        else:
            send_telegram_message(chat_id, "Unauthorized. This bot is private.")
            return {"status": "ok"}
            
    if str(chat_id) != str(admin_chat_id):
        send_telegram_message(chat_id, "Unauthorized.")
        return {"status": "ok"}
        
    parts = text.split()
    command = parts[0].lower()
    
    if command == "/help":
        help_text = """
<b>Sam AI Admin Commands:</b>
/start - Welcome message
/newadminkey - Generate a new admin access key
/staffkey &lt;duration&gt; - Generate staff access key (24h, 7d, 14d, 30d)
/listkeys - List active access keys
/revokekey &lt;code&gt; - Revoke a specific key
/stats - System statistics
/rotate - Rotate the master admin key
/help - Show this message
"""
        send_telegram_message(chat_id, help_text)
        
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
        send_telegram_message(chat_id, f"New Admin Key Generated:\n<code>{key_code}</code>")
        
    elif command == "/staffkey":
        duration = "7d" if len(parts) < 2 else parts[1].lower()
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
        send_telegram_message(chat_id, f"New Staff Key ({duration}) Generated:\n<code>{key_code}</code>\nExpires: {expires_at.strftime('%Y-%m-%d')}")
        
    elif command == "/listkeys":
        keys = db.query(models.AccessKey).filter(models.AccessKey.status == "active").all()
        if not keys:
            send_telegram_message(chat_id, "No active keys found.")
        else:
            msg = "<b>Active Keys:</b>\n"
            for k in keys:
                msg += f"- {k.key_code} ({k.key_type}, uses: {k.current_uses}/{k.max_uses})\n"
            send_telegram_message(chat_id, msg)
            
    elif command == "/revokekey":
        if len(parts) < 2:
            send_telegram_message(chat_id, "Usage: /revokekey &lt;code&gt;")
        else:
            code = parts[1]
            key = db.query(models.AccessKey).filter(models.AccessKey.key_code == code).first()
            if key:
                key.status = "revoked"
                db.commit()
                send_telegram_message(chat_id, f"Key {code} revoked.")
            else:
                send_telegram_message(chat_id, "Key not found.")
                
    elif command == "/stats":
        users_count = db.query(models.User).count()
        chats_count = db.query(models.Chat).count()
        keys_count = db.query(models.AccessKey).filter(models.AccessKey.status == "active").count()
        msg = f"<b>System Stats:</b>\nUsers: {users_count}\nChats: {chats_count}\nActive Keys: {keys_count}"
        send_telegram_message(chat_id, msg)
        
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
            set_key(env_file, "SAM_MASTER_KEY", new_key)
            
        send_telegram_message(chat_id, f"Master Key rotated successfully.\nNew Key:\n<code>{new_key}</code>")
        
    else:
        send_telegram_message(chat_id, "Unknown command. Send /help for a list of commands.")
        
    return {"status": "ok"}
