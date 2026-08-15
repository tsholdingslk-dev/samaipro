"""
SAM AI - Project Brain (RAG Engine)
Retrieval-Augmented Generation for project-specific knowledge.
"""

import os
import json
import math
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv
from database import SessionLocal
from models import ProjectDocumentDB
import sqlalchemy

load_dotenv()

class Document:
    def __init__(self, text: str, metadata: Dict, doc_id: str):
        self.text = text
        self.metadata = metadata
        self.doc_id = doc_id
        self.embedding: Optional[List[float]] = None

class ProjectBrain:
    def __init__(self, project_id: str):
        self.project_id = project_id
        # We load documents directly from DB when needed to save memory
        
    def add_document(self, text: str, metadata: Dict, doc_id: str):
        """Add a document to the knowledge base (persisted to DB)"""
        try:
            db = SessionLocal()
            existing = db.query(ProjectDocumentDB).filter(
                ProjectDocumentDB.project_id == self.project_id,
                ProjectDocumentDB.doc_id == doc_id
            ).first()
            
            if not existing:
                new_doc = ProjectDocumentDB(
                    project_id=self.project_id,
                    doc_id=doc_id,
                    text=text,
                    metadata_json=json.dumps(metadata)
                )
                db.add(new_doc)
                db.commit()
            db.close()
        except Exception as e:
            print(f"Error persisting document to DB: {e}")
        
        return Document(text, metadata, doc_id)
    
    async def index_documents(self):
        """Generate embeddings for all documents missing them in DB"""
        from api_hub import api_hub
        
        try:
            db = SessionLocal()
            unindexed_docs = db.query(ProjectDocumentDB).filter(
                ProjectDocumentDB.project_id == self.project_id,
                ProjectDocumentDB.embedding_json == None
            ).all()
            
            for db_doc in unindexed_docs:
                if db_doc.text:
                    try:
                        embedding = await api_hub.embed(db_doc.text)
                        if embedding:
                            db_doc.embedding_json = json.dumps(embedding)
                            db.commit()
                    except Exception as e:
                        print(f"Failed to embed document {db_doc.doc_id}: {e}")
            db.close()
        except Exception as e:
            print(f"Error indexing documents: {e}")
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not a or not b or len(a) != len(b):
            return 0.0
        
        dot_product = sum(x * y for x, y in zip(a, b))
        magnitude_a = math.sqrt(sum(x * x for x in a))
        magnitude_b = math.sqrt(sum(x * x for x in b))
        
        if magnitude_a == 0 or magnitude_b == 0:
            return 0.0
        
        return dot_product / (magnitude_a * magnitude_b)
    
    async def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Retrieve the most relevant documents for a query.
        Returns a list of {text, metadata, score} dicts.
        """
        from api_hub import api_hub
        
        try:
            db = SessionLocal()
            db_docs = db.query(ProjectDocumentDB).filter(ProjectDocumentDB.project_id == self.project_id).all()
            
            documents = []
            for d in db_docs:
                doc = Document(d.text, json.loads(d.metadata_json) if d.metadata_json else {}, d.doc_id)
                if d.embedding_json:
                    doc.embedding = json.loads(d.embedding_json)
                documents.append(doc)
            db.close()
        except Exception as e:
            print(f"Error loading docs for retrieval: {e}")
            return []

        if not documents:
            return []
        
        # Try embedding-based retrieval first
        query_embedding = None
        try:
            query_embedding = await api_hub.embed(query)
        except Exception as e:
            print(f"Embedding not available, falling back to keyword search: {e}")
        
        scored_docs = []
        
        if query_embedding:
            # Cosine similarity retrieval
            for doc in documents:
                if doc.embedding:
                    score = self._cosine_similarity(query_embedding, doc.embedding)
                    scored_docs.append({
                        "text": doc.text,
                        "metadata": doc.metadata,
                        "score": score,
                        "doc_id": doc.doc_id
                    })
        else:
            # Fallback: keyword-based retrieval
            query_words = set(query.lower().split())
            for doc in documents:
                doc_words = set(doc.text.lower().split())
                overlap = len(query_words.intersection(doc_words))
                score = overlap / max(len(query_words), 1)
                scored_docs.append({
                    "text": doc.text,
                    "metadata": doc.metadata,
                    "score": score,
                    "doc_id": doc.doc_id
                })
        
        # Sort by score and return top_k
        scored_docs.sort(key=lambda x: x["score"], reverse=True)
        return scored_docs[:top_k]
    
    def get_context_for_prompt(self, query: str, top_k: int = 3) -> str:
        """
        Get relevant context as a formatted string for the AI prompt.
        This is a synchronous wrapper for retrieve().
        """
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                results = pool.submit(lambda: asyncio.run(self.retrieve(query, top_k))).result()
        else:
            results = loop.run_until_complete(self.retrieve(query, top_k))
        
        if not results:
            return ""
        
        context_parts = []
        for i, doc in enumerate(results, 1):
            context_parts.append(f"[Document {i} (Score: {doc['score']:.2f})]\n{doc['text']}\n")
        
        return "\n".join(context_parts)

# Singleton-like factory pattern, but now brains are completely stateless
# and load directly from DB.
def get_project_brain(project_id: str) -> ProjectBrain:
    """Get a Project Brain for a project (stateless DB wrapper)"""
    return ProjectBrain(project_id)

def remove_project_brain(project_id: str):
    """Clean up Project Brain documents from DB"""
    try:
        db = SessionLocal()
        db.query(ProjectDocumentDB).filter(ProjectDocumentDB.project_id == project_id).delete()
        db.commit()
        db.close()
    except Exception as e:
        print(f"Error removing project brain {project_id}: {e}")
