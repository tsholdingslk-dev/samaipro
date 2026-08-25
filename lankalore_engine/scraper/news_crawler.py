import asyncio
import feedparser
import logging
import schedule
import time
from datetime import datetime
from scraper.spider import LankaScraper
from vector_store.qdrant_client import VectorStoreManager
from vector_store.embedder import EmbeddingPipeline
from config import settings

logger = logging.getLogger(__name__)

# Typical RSS feeds for Sri Lankan News
RSS_FEEDS = {
    "news": [
        "http://www.adaderana.lk/rss.php",
        "https://www.dailymirror.lk/rss"
    ],
    "gazette": [
        # Placeholder for official gazette RSS if available, or direct scrape URLs
        "http://documents.gov.lk/en/gazette.php" 
    ]
}

class AutoNewsIngestor:
    def __init__(self):
        self.scraper = LankaScraper()
        self.vdb = VectorStoreManager(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection_name,
        )

    async def ingest_feed(self, feed_url: str, category: str):
        logger.info(f"Fetching RSS feed: {feed_url}")
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries[:5]: # Only get top 5 latest to prevent overload
            url = entry.link
            logger.info(f"Scraping new article: {url}")
            
            result = await self.scraper.fetch_and_process(url, category=category)
            if not result:
                continue
                
            for idx, chunk in enumerate(result["chunks"]):
                vector = EmbeddingPipeline.encode(chunk)
                metadata = {
                    "url": url,
                    "title": result["title"],
                    "category": category,
                    "type": "daily_news",
                    "ingested_at": datetime.now().isoformat()
                }
                # Upsert into Qdrant
                point_id = f"{url}_{idx}".replace(":", "_").replace("/", "_").replace(".", "_")
                self.vdb.upsert_points([
                    {
                        "id": point_id[:64], # Basic ID generation
                        "vector": vector,
                        "payload": metadata,
                        "text": chunk
                    }
                ])
        logger.info(f"Finished ingesting {feed_url}")

    def run_job(self):
        logger.info("Running Daily LankaLore News Ingestion Cron Job...")
        loop = asyncio.get_event_loop()
        for url in RSS_FEEDS["news"]:
            loop.run_until_complete(self.ingest_feed(url, "news"))

def start_cron():
    ingestor = AutoNewsIngestor()
    # Schedule to run every day at 06:00 AM
    schedule.every().day.at("06:00").do(ingestor.run_job)
    
    logger.info("LankaLore Cron Job Started. Waiting for scheduled time...")
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    start_cron()
