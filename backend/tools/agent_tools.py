import json
import urllib.request
import urllib.parse
from datetime import datetime
from sqlalchemy.orm import Session
import models

def execute_telegram_broadcast(message: str, db: Session) -> str:
    """Sends a message to the Telegram Admin Chat"""
    import os
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        return "[Error: TELEGRAM_BOT_TOKEN not found in .env]"
        
    try:
        from routers.telegram_bot import get_admin_chat_id
        admin_id = get_admin_chat_id()
        if not admin_id:
            return "[Error: No Admin Chat ID registered in Telegram yet. User must send /start to the bot.]"
            
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": admin_id, "text": message, "parse_mode": "HTML"}).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            if res.get("ok"):
                return f"[Success: Message sent to Telegram Admin ({admin_id})]"
            else:
                return f"[Error: Telegram API responded with {res}]"
    except Exception as e:
        return f"[Error sending to Telegram: {str(e)}]"

def execute_save_memory(memory_type: str, content: str, user_id: str, db: Session) -> str:
    """Saves a task, finance record, or general memory"""
    try:
        new_memory = models.AgentMemory(
            user_id=user_id,
            memory_type=memory_type,
            content=content,
            status="pending"
        )
        db.add(new_memory)
        db.commit()
        return f"[Success: Saved {memory_type} memory to database]"
    except Exception as e:
        db.rollback()
        return f"[Error saving memory: {str(e)}]"

def execute_retrieve_memory(memory_type: str, status: str, user_id: str, db: Session) -> str:
    """Retrieves pending tasks, finances, or memories"""
    try:
        query = db.query(models.AgentMemory).filter(models.AgentMemory.user_id == user_id)
        if memory_type and memory_type.lower() != "all":
            query = query.filter(models.AgentMemory.memory_type == memory_type)
        if status and status.lower() != "all":
            query = query.filter(models.AgentMemory.status == status)
            
        memories = query.order_by(models.AgentMemory.created_at.desc()).limit(20).all()
        if not memories:
            return f"[No {status} {memory_type} memories found.]"
            
        result = "=== RETRIEVED DATA ===\n"
        for m in memories:
            result += f"ID: {m.id[:8]} | Type: {m.memory_type} | Status: {m.status} | Date: {m.created_at.strftime('%Y-%m-%d')}\nContent: {m.content}\n---\n"
        return result
    except Exception as e:
        return f"[Error retrieving memory: {str(e)}]"

def execute_web_search(query: str) -> str:
    """Performs a web search"""
    try:
        from duckduckgo_search import DDGS
        results = DDGS().text(query, max_results=3)
        if not results:
            return "[No search results found]"
            
        formatted = "=== WEB SEARCH RESULTS ===\n"
        for r in results:
            formatted += f"Title: {r['title']}\nLink: {r['href']}\nSnippet: {r['body']}\n---\n"
        return formatted
    except ImportError:
        return "[Error: duckduckgo_search package not installed. Run 'pip install duckduckgo-search']"
    except Exception as e:
        return f"[Error performing search: {str(e)}]"
