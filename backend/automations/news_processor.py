import asyncio
import httpx
from bs4 import BeautifulSoup
from .tsvideo_auto import post_to_tsvideo
from ai_engine import get_ai_response
import json
import re
import os
import tempfile

async def process_news_link(url: str, chat_id: int):
    from routers.telegram_bot import send_telegram_message
    
    try:
        # 1. Scrape the URL
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=15.0)
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract title and some paragraphs
        title = soup.title.string if soup.title else ""
        paragraphs = [p.get_text() for p in soup.find_all('p')]
        raw_text = "\n".join(paragraphs[:10]) # Get first few paragraphs
        
        # Also try to find an og:image
        og_image = soup.find("meta", property="og:image")
        image_url = og_image["content"] if og_image else None
        
        send_telegram_message(chat_id, "🔗 Link received! Analyzing content and generating news card...")

        # 2. Use AI Engine to format Headline, Content and Category
        system_prompt = """You are a professional News Editor. Extract the following from the provided news text:
1. A short, catchy 'headline' in Tamil.
2. A very brief 'content' summary (1-2 sentences) in Tamil.
3. A 'category' (choose from: Local News, World News, Cinema News, Sports News, Political News).
Return ONLY a valid JSON object with keys: "headline", "content", "category"."""

        prompt = f"Title: {title}\nURL: {url}\nContent: {raw_text}"
        
        ai_response_text = get_ai_response(prompt, [], system_prompt=system_prompt)
        
        # Try to parse the JSON
        json_match = re.search(r'\{.*\}', ai_response_text, re.DOTALL)
        if json_match:
            try:
                news_data = json.loads(json_match.group(0))
            except json.JSONDecodeError:
                news_data = {"headline": title, "content": raw_text[:100], "category": "Local News"}
        else:
            news_data = {"headline": title, "content": raw_text[:100], "category": "Local News"}
            
        # 3. Download the image if available
        image_path = ""
        if image_url:
            try:
                async with httpx.AsyncClient() as client:
                    img_resp = await client.get(image_url)
                    if img_resp.status_code == 200:
                        image_path = os.path.join(tempfile.gettempdir(), f"news_image_{chat_id}.jpg")
                        with open(image_path, "wb") as f:
                            f.write(img_resp.content)
                        news_data["image_path"] = image_path
            except Exception as e:
                print(f"Image download failed: {e}")
                
        send_telegram_message(chat_id, f"📝 AI Processing complete!\n<b>Headline:</b> {news_data.get('headline')}\n<b>Category:</b> {news_data.get('category')}\n\n🤖 Triggering TSVideo Automation...")

        # 4. Trigger TSVideo Automation
        result = await post_to_tsvideo(news_data, app_url="http://localhost/tsvideo", username="admin", password="password")
        
        if result["status"] == "success":
            send_telegram_message(chat_id, "🎉 Success! The news card has been automatically generated and posted to Facebook.")
        else:
            send_telegram_message(chat_id, f"⚠️ Automation Error: {result['message']}")
            
    except Exception as e:
        send_telegram_message(chat_id, f"❌ Failed to process the link: {str(e)}")
