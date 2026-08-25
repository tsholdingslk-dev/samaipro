"""
Knowledge Base Module for Sam AI
- trusted_knowledge: Admin-approved, version-controlled knowledge base
- web_research_engine: Full pipeline research with source reliability ranking
- knowledge_manager: User knowledge storage and retrieval
- web_crawler: Web crawling utilities (backward compatible)
- admin_trainer: Admin knowledge training commands
"""

from knowledge.trusted_knowledge import TrustedKnowledgeBase, trusted_kb, get_trusted_kb, TRUST_LEVELS
from knowledge.web_research_engine import WebResearchEngine, web_research_engine, CitedSource, ResearchResult, SOURCE_TIERS
from knowledge.chunker import DocumentChunker, document_chunker, DocumentChunk

__all__ = [
    "TrustedKnowledgeBase",
    "trusted_kb",
    "get_trusted_kb",
    "TRUST_LEVELS",
    "WebResearchEngine",
    "web_research_engine",
    "CitedSource",
    "ResearchResult",
    "SOURCE_TIERS",
    "DocumentChunker",
    "document_chunker",
    "DocumentChunk",
]
