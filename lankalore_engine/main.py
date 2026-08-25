import asyncio
import logging
from typing import List, Dict

from scraper.spider import LankaScraper
from scraper.text_cleaner import TextProcessor
from vector_store.qdrant_client import VectorStoreManager
from vector_store.embedder import EmbeddingPipeline
from config import settings

logger = logging.getLogger(__name__)


class LankaLorePipeline:
    def __init__(self):
        self.scraper = LankaScraper()
        self.vdb = VectorStoreManager(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection_name,
        )
        self.semaphore = asyncio.Semaphore(settings.max_concurrent_scrapes)

    async def _scrape_one(self, url: str, category: str):
        async with self.semaphore:
            logger.info("Scraping %s [%s]", url, category)
            result = await self.scraper.fetch_and_process(
                url, category, timeout_ms=settings.scrape_timeout_ms
            )
            if result:
                inserted = self.vdb.upsert_scraped_data(result)
                logger.info("Upserted %d chunks for %s", inserted, url)
            return result

    async def run_ingestion(self, sources: List[Dict[str, str]]):
        tasks = [self._scrape_one(src["url"], src.get("category", "general")) for src in sources]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        successful = [r for r in results if r and not isinstance(r, Exception)]
        logger.info("Ingestion complete: %d/%d succeeded", len(successful), len(sources))
        return successful

    async def query(self, query_text: str, category_filter: str = None, limit: int = 4):
        return self.vdb.search_relevant_context(query_text, limit=limit, category_filter=category_filter)


def main():
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
    pipeline = LankaLorePipeline()
    sample_sources = [
        {"url": "https://www.example.com/sri-lankan-history", "category": "history"},
        {"url": "https://www.example.com/sri-lankan-constitution", "category": "law"},
    ]
    asyncio.run(pipeline.run_ingestion(sample_sources))


if __name__ == "__main__":
    main()
