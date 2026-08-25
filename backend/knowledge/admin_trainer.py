from sqlalchemy.orm import Session
from knowledge.knowledge_manager import KnowledgeManager
from knowledge.web_crawler import WebCrawler
import re

class AdminTrainer:
    def __init__(self):
        self.crawler = WebCrawler()

    def process_training_message(self, admin_message: str, db: Session, user_id: str) -> str:
        km = KnowledgeManager(db)
        
        learn_match = re.match(r'^LEARN:\s*(.+)$', admin_message, re.IGNORECASE | re.DOTALL)
        if learn_match:
            fact = learn_match.group(1).strip()
            km.add_knowledge(
                user_id=user_id,
                content=fact,
                source="admin_training",
                category="admin",
                metadata={"trained_by": user_id}
            )
            return f"Successfully learned: {fact[:50]}..."
            
        forget_match = re.match(r'^FORGET:\s*(.+)$', admin_message, re.IGNORECASE)
        if forget_match:
            keyword = forget_match.group(1).strip()
            results = km.search_knowledge(keyword, user_id=user_id, top_k=5)
            if not results:
                return f"No knowledge found matching: {keyword}"
            
            deleted_count = 0
            for r in results:
                if km.delete_knowledge(r["id"]):
                    deleted_count += 1
                    
            return f"Forgot {deleted_count} entries matching: {keyword}"
            
        search_match = re.match(r'^SEARCH:\s*(.+)$', admin_message, re.IGNORECASE)
        if search_match:
            query = search_match.group(1).strip()
            results = km.search_knowledge(query, user_id=user_id, top_k=3)
            if not results:
                return f"No results found for: {query}"
            
            resp = f"Top {len(results)} results for '{query}':\n\n"
            for i, r in enumerate(results, 1):
                resp += f"{i}. (Score: {r['score']:.2f}) {r['content'][:100]}...\n"
            return resp
            
        crawl_match = re.match(r'^CRAWL:\s*(http[s]?://.+)$', admin_message, re.IGNORECASE)
        if crawl_match:
            url = crawl_match.group(1).strip()
            res = self.crawler.crawl_and_store(url, user_id, db)
            if "error" in res:
                return f"Failed to crawl {url}: {res['error']}"
            return f"Successfully crawled and stored: {url}"
            
        return "Invalid training command. Use LEARN: <fact>, FORGET: <keyword>, SEARCH: <query>, or CRAWL: <url>"
