import json
import math
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models import UserKnowledgeDB
from api_hub import api_hub
from datetime import datetime
import asyncio

class KnowledgeManager:
    def __init__(self, db: Session):
        self.db = db
    
    async def _get_embedding(self, text: str) -> Optional[List[float]]:
        try:
            return await api_hub.embed(text)
        except Exception as e:
            print(f"Embedding error: {e}")
            return None
            
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b): return 0.0
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = math.sqrt(sum(x * x for x in a))
        magnitude_b = math.sqrt(sum(x * x for x in b))
        if magnitude_a == 0 or magnitude_b == 0: return 0.0
        return dot_product / (magnitude_a * magnitude_b)

    def add_knowledge(self, user_id: str, content: str, source: str, category: str = 'general', metadata: dict = None) -> dict:
        meta = metadata or {}
        meta["category"] = category
        
        loop = asyncio.get_event_loop()
        embedding = None
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                embedding = pool.submit(lambda: asyncio.run(self._get_embedding(content))).result()
        else:
            embedding = loop.run_until_complete(self._get_embedding(content))
            
        if embedding:
            meta["embedding"] = embedding
            
        entry = UserKnowledgeDB(
            user_id=user_id,
            source=source,
            content=content,
            metadata_json=json.dumps(meta)
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        
        return {
            "id": entry.id,
            "source": entry.source,
            "category": category,
            "has_embedding": bool(embedding)
        }
    
    def search_knowledge(self, query: str, user_id: str = None, top_k: int = 5) -> list:
        q = self.db.query(UserKnowledgeDB)
        if user_id:
            q = q.filter(UserKnowledgeDB.user_id == user_id)
        entries = q.all()
        
        if not entries: return []
        
        loop = asyncio.get_event_loop()
        query_embedding = None
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                query_embedding = pool.submit(lambda: asyncio.run(self._get_embedding(query))).result()
        else:
            query_embedding = loop.run_until_complete(self._get_embedding(query))
            
        scored = []
        query_words = set(query.lower().split())
        
        for entry in entries:
            meta = json.loads(entry.metadata_json) if entry.metadata_json else {}
            doc_embedding = meta.get("embedding")
            
            score = 0.0
            if query_embedding and doc_embedding:
                score = self._cosine_similarity(query_embedding, doc_embedding)
            else:
                doc_words = set(entry.content.lower().split())
                overlap = len(query_words.intersection(doc_words))
                score = overlap / max(len(query_words), 1)
                
            scored.append({
                "id": entry.id,
                "content": entry.content,
                "source": entry.source,
                "metadata": meta,
                "score": score
            })
            
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
    
    def get_all_knowledge(self, user_id: str = None, category: str = None) -> list:
        q = self.db.query(UserKnowledgeDB)
        if user_id:
            q = q.filter(UserKnowledgeDB.user_id == user_id)
        entries = q.all()
        
        results = []
        for entry in entries:
            meta = json.loads(entry.metadata_json) if entry.metadata_json else {}
            if category and meta.get("category") != category:
                continue
            
            if "embedding" in meta:
                del meta["embedding"]
                
            results.append({
                "id": entry.id,
                "content": entry.content,
                "source": entry.source,
                "metadata": meta,
                "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
                "usage_count": entry.usage_count
            })
        return results
    
    def delete_knowledge(self, knowledge_id: str) -> bool:
        entry = self.db.query(UserKnowledgeDB).filter(UserKnowledgeDB.id == knowledge_id).first()
        if entry:
            self.db.delete(entry)
            self.db.commit()
            return True
        return False
    
    def get_stats(self) -> dict:
        total = self.db.query(UserKnowledgeDB).count()
        return {
            "total_entries": total
        }
