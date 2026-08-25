from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from security import get_current_user, require_admin
from knowledge.knowledge_manager import KnowledgeManager
from knowledge.web_crawler import WebCrawler
from knowledge.admin_trainer import AdminTrainer
from knowledge.trusted_knowledge import get_trusted_kb, TRUST_LEVELS
from knowledge.web_research_engine import web_research_engine


class ResearchRequest(BaseModel):
    query: str
    num_sources: Optional[int] = 5
    use_cache: Optional[bool] = True


class KnowledgeAddRequest(BaseModel):
    content: str
    source: str
    category: Optional[str] = "general"
    trust_level: Optional[str] = "user_submitted"
    requires_approval: Optional[bool] = True
    metadata: Optional[dict] = None


router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

@router.get("/entries")
def get_entries(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    km = KnowledgeManager(db)
    return km.get_all_knowledge(user_id=current_user["user_id"])

@router.post("/add")
def add_entry(
    content: str = Body(..., embed=True),
    source: str = Body(..., embed=True),
    category: str = Body("general", embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    km = KnowledgeManager(db)
    res = km.add_knowledge(current_user["user_id"], content, source, category)
    return {"status": "success", "data": res}

@router.post("/search")
def search_entries(
    query: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    km = KnowledgeManager(db)
    results = km.search_knowledge(query, user_id=None, top_k=5)
    return {"results": results}

@router.post("/crawl")
def crawl_url(
    url: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    crawler = WebCrawler()
    res = crawler.crawl_and_store(url, current_user["user_id"], db)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/train")
def train_admin(
    message: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    trainer = AdminTrainer()
    response = trainer.process_training_message(message, db, current_user["user_id"])
    return {"response": response}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    km = KnowledgeManager(db)
    return km.get_stats()

@router.delete("/delete/{id}")
def delete_entry(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    km = KnowledgeManager(db)
    if km.delete_knowledge(id):
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Knowledge entry not found")


@router.post("/research")
async def research(
    request: ResearchRequest,
    current_user: dict = Depends(get_current_user),
):
    result = await web_research_engine.research(
        query=request.query,
        num_sources=request.num_sources,
        use_cache=request.use_cache,
    )
    return {
        "answer": result.synthesized_answer,
        "confidence": result.confidence,
        "sources": [
            {
                "title": s.title,
                "url": s.url,
                "domain": s.domain,
                "reliability_score": s.reliability_score,
                "reliability_tier": s.reliability_tier,
                "snippet": s.snippet,
            }
            for s in result.sources
        ],
        "research_time_ms": result.research_time_ms,
        "cache_hit": result.cache_hit,
    }


@router.post("/trusted/add")
async def add_trusted_knowledge(
    request: KnowledgeAddRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    kb = get_trusted_kb(db)
    result = kb.add_document(
        user_id=current_user["user_id"],
        content=request.content,
        source=request.source,
        category=request.category,
        trust_level=request.trust_level,
        metadata=request.metadata,
        requires_approval=request.requires_approval,
        approved_by=current_user["user_id"] if request.trust_level == "admin_approved" else None,
    )
    return {"status": "success", "data": result}


@router.get("/pending-approval")
async def get_pending_approval(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    kb = get_trusted_kb(db)
    return {"entries": kb.get_pending_approval(user_id)}


@router.post("/approve/{knowledge_id}")
async def approve_knowledge(
    knowledge_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    kb = get_trusted_kb(db)
    success = kb.approve_knowledge(current_user["user_id"], knowledge_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    return {"status": "success", "message": "Knowledge approved and added to trusted KB"}


@router.get("/trust-levels")
async def get_trust_levels(
    current_user: dict = Depends(get_current_user),
):
    return {"trust_levels": TRUST_LEVELS}


@router.get("/trusted/stats")
async def get_trusted_stats(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    kb = get_trusted_kb(db)
    return kb.get_knowledge_stats(user_id or current_user["user_id"])
