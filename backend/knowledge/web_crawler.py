import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from sqlalchemy.orm import Session
from knowledge.knowledge_manager import KnowledgeManager

class WebCrawler:
    def crawl_url(self, url: str) -> dict:
        try:
            with httpx.Client(follow_redirects=True, timeout=15.0) as client:
                response = client.get(url)
                response.raise_for_status()
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
                
            title = soup.title.string if soup.title else ""
            text = soup.get_text(separator=' ', strip=True)
            
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return {
                "url": url,
                "title": title.strip(),
                "text": text,
                "word_count": len(text.split())
            }
        except Exception as e:
            print(f"Error crawling {url}: {e}")
            return {"url": url, "error": str(e)}
            
    def search_web(self, query: str, num_results: int = 5) -> list:
        try:
            with httpx.Client(follow_redirects=True, timeout=15.0) as client:
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
                resp = client.get(f"https://html.duckduckgo.com/html/?q={query}", headers=headers)
                resp.raise_for_status()
                
            soup = BeautifulSoup(resp.text, 'html.parser')
            results = []
            
            for a in soup.find_all('a', class_='result__url', limit=num_results):
                url = a.get('href', '')
                if url.startswith('//duckduckgo.com/l/?'):
                    import urllib.parse
                    parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
                    if 'uddg' in parsed:
                        url = parsed['uddg'][0]
                
                title_elem = a.find_previous('h2', class_='result__title')
                title = title_elem.get_text(strip=True) if title_elem else "No Title"
                
                snippet_elem = a.find_next('a', class_='result__snippet')
                snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                
                if url:
                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet
                    })
            return results
        except Exception as e:
            print(f"Search error: {e}")
            return []
            
    def crawl_and_store(self, url: str, user_id: str, db: Session) -> dict:
        data = self.crawl_url(url)
        if "error" in data:
            return data
            
        km = KnowledgeManager(db)
        meta = {
            "title": data.get("title"),
            "word_count": data.get("word_count"),
            "type": "web_crawl"
        }
        
        result = km.add_knowledge(
            user_id=user_id,
            content=data["text"],
            source=url,
            category="web",
            metadata=meta
        )
        return {"status": "success", "url": url, "knowledge_id": result["id"]}
