import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

LANKALORE_ENGINE_URL = "http://localhost:8001/api/v1/retrieve" # Default port for LankaLore Microservice

class LankaLoreTool:
    name = "lankalore_search"
    description = (
        "Use this tool to search for Sri Lankan specific information, "
        "including news, government gazettes, tourism, legal context, and cultural history. "
        "It supports multi-lingual context (Sinhala/Tamil/English)."
    )

    @staticmethod
    def execute(query: str, category_filter: Optional[str] = None, limit: int = 4) -> str:
        """
        Queries the LankaLore Engine to retrieve high-quality RAG context.
        """
        try:
            payload = {
                "query": query,
                "category_filter": category_filter,
                "limit": limit
            }
            response = requests.post(LANKALORE_ENGINE_URL, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                contexts = data.get("retrieved_contexts", [])
                
                if not contexts:
                    return "No relevant Sri Lankan context found in LankaLore DB."
                
                # Format context for the LLM
                formatted_str = ""
                for idx, ctx in enumerate(contexts, 1):
                    text = ctx.get("text", "")
                    meta = ctx.get("metadata", {})
                    source = meta.get("url", meta.get("title", "Unknown Source"))
                    formatted_str += f"[{idx}] Source: {source}\nContent: {text}\n\n"
                
                return f"--- LankaLore DB Context ---\n{formatted_str}"
            else:
                return f"LankaLore API Error: {response.status_code} - {response.text}"
        except Exception as e:
            logger.error(f"Failed to query LankaLore Tool: {e}")
            return f"Error contacting LankaLore Engine: {str(e)}"
