import asyncio
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from scraper.text_cleaner import TextProcessor

logger = logging.getLogger(__name__)


class LankaScraper:
    def __init__(self, processor: TextProcessor = None):
        self.processor = processor or TextProcessor()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch_and_process(self, url: str, category: str, timeout_ms: int = 30000):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (compatible; LankaLoreBot/1.0; +https://lankalore.ai)"
            )
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="networkidle", timeout=timeout_ms)
                title = await page.title()
                content = await page.content()
                clean_text = self.processor.clean_html(content)
                chunks = self.processor.create_chunks(clean_text)

                await browser.close()
                return {
                    "url": url,
                    "title": title,
                    "category": category,
                    "chunks": chunks,
                }
            except PlaywrightTimeout:
                logger.error("Timeout scraping %s", url)
                await browser.close()
                return None
            except Exception as e:
                logger.error("Error scraping %s: %s", url, e)
                await browser.close()
                return None
