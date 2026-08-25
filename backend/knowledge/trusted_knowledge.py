"""
SAM AI - Trusted Knowledge Base
Admin-approved, version-controlled knowledge with trust levels.
Trust levels: admin_approved > verified > user_submitted > web_crawled > unverified
"""

import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
import models
from knowledge.chunker import document_chunker, DocumentChunk
from api_hub import api_hub
import asyncio


TRUST_LEVELS = ["unverified", "web_crawled", "user_submitted", "verified", "admin_approved"]
TRUST_SCORES = {level: i for i, level in enumerate(TRUST_LEVELS)}


class TrustedKnowledgeBase:
    def __init__(self, db: Session):
        self.db = db

    def _get_embedding(self, text: str) -> Optional[List[float]]:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(lambda: asyncio.run(api_hub.embed(text))).result(timeout=60)
            else:
                return loop.run_until_complete(api_hub.embed(text))
        except Exception:
            return None

    def add_document(
        self,
        user_id: str,
        content: str,
        source: str,
        category: str = "general",
        trust_level: str = "user_submitted",
        metadata: Dict = None,
        requires_approval: bool = True,
        approved_by: str = None,
    ) -> Dict[str, Any]:
        meta = metadata or {}
        meta["category"] = category
        meta["trust_level"] = trust_level
        meta["requires_approval"] = requires_approval
        meta["chunk_count"] = 0

        chunks = document_chunker.chunk_document(content, source=source, doc_id=str(user_id))

        results = []
        for chunk in chunks:
            embedding = self._get_embedding(chunk.text)
            embedding_json = json.dumps(embedding) if embedding else None

            entry_meta = dict(meta)
            entry_meta.update({
                "chunk_index": chunk.chunk_index,
                "token_count": chunk.token_count,
                "method": chunk.metadata.get("method", "auto"),
            })

            entry = models.UserKnowledgeDB(
                user_id=user_id,
                source=source,
                content=chunk.text,
                metadata_json=json.dumps(entry_meta),
                trust_level=trust_level,
                version=1,
                approved_by=approved_by if trust_level == "admin_approved" else None,
                approved_at=datetime.utcnow() if trust_level == "admin_approved" else None,
                chunk_index=chunk.chunk_index,
            )
            self.db.add(entry)
            self.db.flush()
            results.append({"id": entry.id, "chunk_index": chunk.chunk_index, "trust_level": trust_level})

        meta["chunk_count"] = len(chunks)
        self.db.commit()

        return {
            "status": "success",
            "chunks_added": len(chunks),
            "trust_level": trust_level,
            "requires_approval": requires_approval,
            "entries": results,
        }

    def approve_knowledge(self, admin_id: str, knowledge_id: str) -> bool:
        entry = self.db.query(models.UserKnowledgeDB).filter(
            models.UserKnowledgeDB.id == knowledge_id
        ).first()
        if not entry:
            return False

        prev_version = entry.version
        entry.trust_level = "admin_approved"
        entry.version = entry.version + 1
        entry.approved_by = admin_id
        entry.approved_at = datetime.utcnow()
        self.db.commit()

        from security_ext.audit import audit_logger
        audit_logger.log_security_event(
            self.db, "knowledge_approved", admin_id,
            f"Admin approved knowledge entry {knowledge_id}",
            severity="info",
            action_taken="knowledge_approved",
        )
        return True

    def version_knowledge(self, user_id: str, source: str, content: str, metadata: Dict = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta["versioned"] = True
        return self.add_document(
            user_id=user_id,
            content=content,
            source=source,
            category=meta.get("category", "general"),
            trust_level=meta.get("trust_level", "user_submitted"),
            metadata=meta,
            approved_by=None,
        )

    def search_trusted(
        self,
        query: str,
        user_id: str = None,
        top_k: int = 10,
        min_trust_level: str = "user_submitted",
        categories: List[str] = None,
    ) -> List[Dict[str, Any]]:
        min_score = TRUST_SCORES.get(min_trust_level, 2)

        query_embedding = self._get_embedding(query)

        base_query = self.db.query(models.UserKnowledgeDB)

        if user_id:
            base_query = base_query.filter(models.UserKnowledgeDB.user_id == user_id)

        entries = base_query.all()

        scored = []
        for entry in entries:
            if TRUST_SCORES.get(entry.trust_level, 0) < min_score:
                continue

            try:
                entry_meta = json.loads(entry.metadata_json) if entry.metadata_json else {}
            except (json.JSONDecodeError, TypeError):
                entry_meta = {}

            if categories and entry_meta.get("category") not in categories:
                continue

            score = 0.0

            if query_embedding and entry.embedding_json:
                try:
                    entry_embedding = json.loads(entry.embedding_json)
                    score = self._cosine_similarity(query_embedding, entry_embedding)
                except (json.JSONDecodeError, TypeError):
                    score = self._keyword_overlap(query, entry.content)
            else:
                score = self._keyword_overlap(query, entry.content)

            trust_bonus = TRUST_SCORES.get(entry.trust_level, 0) * 0.1
            score += trust_bonus

            scored.append({
                "id": entry.id,
                "content": entry.content,
                "source": entry.source,
                "trust_level": entry.trust_level,
                "version": entry.version,
                "metadata": entry_meta,
                "score": round(score, 4),
                "approved_at": entry.approved_at.isoformat() if entry.approved_at else None,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        import math
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    def _keyword_overlap(self, query: str, text: str) -> float:
        query_words = set(query.lower().split())
        text_words = set(text.lower().split())
        if not query_words:
            return 0.0
        overlap = len(query_words.intersection(text_words))
        return overlap / max(len(query_words), 1)

    def get_pending_approval(self, user_id: str = None) -> List[Dict[str, Any]]:
        query = self.db.query(models.UserKnowledgeDB).filter(
            models.UserKnowledgeDB.trust_level.in_(["user_submitted", "web_crawled"]),
            models.UserKnowledgeDB.approved_by == None,
        )
        if user_id:
            query = query.filter(models.UserKnowledgeDB.user_id == user_id)

        entries = query.order_by(models.UserKnowledgeDB.timestamp.desc()).all()
        return [
            {
                "id": e.id,
                "user_id": e.user_id,
                "source": e.source,
                "content_preview": e.content[:200],
                "trust_level": e.trust_level,
                "version": e.version,
                "submitted_at": e.timestamp.isoformat(),
                "chunk_index": e.chunk_index,
            }
            for e in entries
        ]

    def get_knowledge_stats(self, user_id: str = None) -> Dict[str, Any]:
        query = self.db.query(models.UserKnowledgeDB)
        if user_id:
            query = query.filter(models.UserKnowledgeDB.user_id == user_id)

        entries = query.all()
        total = len(entries)
        by_trust = {}
        by_category = {}

        for e in entries:
            by_trust[e.trust_level] = by_trust.get(e.trust_level, 0) + 1
            try:
                meta = json.loads(e.metadata_json) if e.metadata_json else {}
                cat = meta.get("category", "general")
                by_category[cat] = by_category.get(cat, 0) + 1
            except (json.JSONDecodeError, TypeError):
                pass

        approved = sum(1 for e in entries if e.trust_level == "admin_approved")
        pending = sum(1 for e in entries if e.trust_level in ("user_submitted", "web_crawled") and e.approved_by is None)

        return {
            "total_entries": total,
            "by_trust_level": by_trust,
            "by_category": by_category,
            "approved_count": approved,
            "pending_approval": pending,
        }

    def delete_knowledge(self, knowledge_id: str) -> bool:
        entry = self.db.query(models.UserKnowledgeDB).filter(
            models.UserKnowledgeDB.id == knowledge_id
        ).first()
        if entry:
            self.db.delete(entry)
            self.db.commit()
            return True
        return False


trusted_kb = None

def get_trusted_kb(db: Session) -> TrustedKnowledgeBase:
    return TrustedKnowledgeBase(db)
