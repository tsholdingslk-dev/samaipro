"""
SAM AI - Web Research Engine
Full pipeline: Search → Fetch → Clean → Extract → Verify → Cache → AI
Source reliability ranking: Official > Government > Primary > Trusted Media > Other
"""

import asyncio
import json
import re
import hashlib
import time
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from urllib.parse import urlparse
from collections import defaultdict

import httpx
from bs4 import BeautifulSoup


@dataclass
class CitedSource:
    url: str
    title: str
    domain: str
    reliability_score: float
    reliability_tier: str
    snippet: str
    fetched_at: datetime
    word_count: int = 0


@dataclass
class ResearchResult:
    query: str
    synthesized_answer: str
    sources: List[CitedSource]
    confidence: float
    research_time_ms: float
    cache_hit: bool = False


SOURCE_TIERS = {
    "government": {"domains": [".gov", ".gov.lk", ".gov.in"], "score": 0.95, "name": "Government"},
    "official": {"domains": [".org", ".edu", ".gov"], "score": 0.90, "name": "Official"},
    "primary": {"score": 0.85, "name": "Primary Source"},
    "trusted_media": {"domains": ["wikipedia.org", "bbc.com", "reuters.com", "ap.org", "nature.com", "sciencemag.org"], "score": 0.75, "name": "Trusted Media"},
    "other": {"score": 0.50, "name": "Other"},
}

# Known Sri Lankan domains
SL_DOMAINS = [
    "srilanka.net", "gov.lk", "cbs.gov.lk", "srilankanews.net",
    "newsfirst.lk", "adaderana.lk", "daily-news.update.gov.lk",
    "cbrf.lk", "srilankabusiness.net", "trade.gov.lk",
]


class WebResearchEngine:
    def __init__(self):
        self.cache: Dict[str, Tuple[ResearchResult, datetime]] = {}
        self.cache_ttl = timedelta(hours=6)
        self.search_providers = self._init_search_providers()

    def _init_search_providers(self) -> List[str]:
        providers = ["duckduckgo"]
        serp_key = __import__("os").getenv("SERP_API_KEY")
        if serp_key:
            providers.append("serpapi")
        return providers

    def _get_cache_key(self, query: str, source_count: int) -> str:
        return hashlib.md5(f"{query}:{source_count}".encode()).hexdigest()

    def _get_reliability(self, url: str) -> Tuple[float, str, str]:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")

        for tier_name, tier_data in SOURCE_TIERS.items():
            if tier_name in ("trusted_media", "government", "official"):
                for d in tier_data["domains"]:
                    if d in domain:
                        return tier_data["score"], tier_name, tier_data["name"]

        if any(sl_domain in domain for sl_domain in SL_DOMAINS):
            return 0.90, "primary", "Primary Source (Sri Lanka)"

        if ".gov" in domain or ".gov.lk" in domain:
            return 0.95, "government", "Government"

        if ".org" in domain or ".edu" in domain:
            return 0.90, "official", "Official Organization"

        path_parts = parsed.path.split("/")
        for tier_name, tier_data in SOURCE_TIERS.items():
            if any(part in domain for part in ["wikipedia", "bbc", "reuters", "ap.org", "nature", "science"]):
                return 0.75, "trusted_media", "Trusted Media"

        return SOURCE_TIERS["other"]["score"], "other", "Other"

    async def search(self, query: str, num_results: int = 5) -> List[CitedSource]:
        cache_key = self._get_cache_key(query, num_results)
        if cache_key in self.cache:
            cached_result, cached_time = self.cache[cache_key]
            if datetime.utcnow() - cached_time < self.cache_ttl:
                return cached_result.sources

        results = await self._search_duckduckgo(query, num_results * 2)
        results = results[:num_results]

        scored = []
        for r in results:
            score, tier, tier_name = self._get_reliability(r["url"])
            scored.append(CitedSource(
                url=r["url"],
                title=r.get("title", ""),
                domain=urlparse(r["url"]).netloc,
                reliability_score=score,
                reliability_tier=tier,
                snippet=r.get("snippet", ""),
                fetched_at=datetime.utcnow(),
            ))

        scored.sort(key=lambda s: s.reliability_score, reverse=True)

        for source in scored:
            self._cache_source(source)

        return scored

    async def _search_duckduckgo(self, query: str, num_results: int) -> List[Dict]:
        results = []
        try:
            url = f"https://html.duckduckgo.com/html/?q={query}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
                resp = await client.get(url, headers=headers)
                soup = BeautifulSoup(resp.text, "html.parser")

                for a in soup.find_all("a", class_="result__a", limit=num_results):
                    url_href = a.get("href", "")
                    if url_href.startswith("//duckduckgo.com/l/?"):
                        import urllib.parse
                        parsed = urllib.parse.parse_qs(urllib.parse.urlparse(url_href).query)
                        if "uddg" in parsed:
                            url_href = parsed["uddg"][0]

                    if not url_href:
                        continue

                    title_elem = a
                    title = title_elem.get_text(strip=True) if title_elem else "No Title"

                    snippet_elem = a.find_next("a", class_="result__snippet")
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                    try:
                        result_url = httpx.URL(url_href)
                        results.append({"url": str(result_url), "title": title, "snippet": snippet})
                    except Exception:
                        pass
        except Exception as e:
            print(f"DuckDuckGo search error: {e}")
        return results

    def _cache_source(self, source: CitedSource):
        cache_key = hashlib.md5(source.url.encode()).hexdigest()
        self.cache[cache_key] = (
            ResearchResult(
                query="", synthesized_answer="", sources=[source], confidence=source.reliability_score
            ),
            datetime.utcnow()
        )

    async def fetch_and_clean(self, url: str, timeout: float = 30.0) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code != 200:
                    return {"url": url, "error": f"HTTP {resp.status_code}", "content": ""}

                html = resp.text
                soup = BeautifulSoup(html, "html.parser")

                for element in soup(["script", "style", "nav", "footer", "header", "aside", "adsbygoogle"]):
                    element.decompose()

                title = soup.title.string.strip() if soup.title else ""
                text = soup.get_text(separator=" ", strip=True)

                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = " ".join(chunk for chunk in chunks if chunk)

                text = re.sub(r'\s+', ' ', text)
                text = text[:10000]

                word_count = len(text.split())

                is_srilankan = any(domain in url for domain in SL_DOMAINS) or \
                              any(kw in text.lower() for kw in ["srilanka", "sri lanka", "šrī laṃkāva"])

                return {
                    "url": url,
                    "title": title,
                    "content": text,
                    "word_count": word_count,
                    "is_srilankan": is_srilankan,
                    "fetched_at": datetime.utcnow().isoformat(),
                }
        except Exception as e:
            return {"url": url, "error": str(e), "content": "", "title": ""}

    async def verify_sources(self, sources: List[CitedSource]) -> List[CitedSource]:
        for source in sources:
            try:
                result = await self.fetch_and_clean(source.url, timeout=10.0)
                if result.get("error"):
                    source.reliability_score *= 0.5
                else:
                    source.word_count = result.get("word_count", 0)
            except Exception:
                source.reliability_score *= 0.5
        return sources

    async def research(self, query: str, num_sources: int = 5, use_cache: bool = True) -> ResearchResult:
        start_time = time.time()

        cache_key = self._get_cache_key(query, num_sources)
        if use_cache and cache_key in self.cache:
            cached_result, cached_time = self.cache[cache_key]
            if datetime.utcnow() - cached_time < self.cache_ttl:
                return ResearchResult(
                    query=query,
                    synthesized_answer=cached_result.synthesized_answer,
                    sources=cached_result.sources,
                    confidence=cached_result.confidence,
                    research_time_ms=round((time.time() - start_time) * 1000, 2),
                    cache_hit=True,
                )

        sources = await self.search(query, num_results=num_sources)
        sources = await self.verify_sources(sources)

        source_summaries = []
        for s in sources[:3]:
            source_summaries.append(f"[{s.reliability_tier.upper()} Score: {s.reliability_score:.2f}] {s.title}\n{s.snippet}")

        prompt = f"""You are a research synthesis expert. Analyze the following sources and synthesize a comprehensive answer.

Query: {query}

Sources:
{json.dumps([{"title": s.title, "url": s.url, "reliability": s.reliability_score, "tier": s.reliability_tier, "snippet": s.snippet} for s in sources], indent=2)}

Provide:
1. A comprehensive, well-structured answer
2. Cite sources using [Source X] notation
3. Highlight reliability of information
4. Note any conflicting information

Return the answer in JSON format:
{{"answer": "...", "confidence": 0.95, "sources_cited": [1, 2, ...]}}"""

        from api_hub import api_hub
        result = await api_hub.chat([
            {"role": "system", "content": "You are a research synthesis expert. Be factual and cite sources."},
            {"role": "user", "content": prompt}
        ], temperature=0.5)

        content = result["content"]
        try:
            data = json.loads(content)
            answer = data.get("answer", content)
            confidence = float(data.get("confidence", 0.75))
        except (json.JSONDecodeError, ValueError):
            answer = content
            confidence = 0.75

        avg_reliability = sum(s.reliability_score for s in sources) / max(len(sources), 1)
        confidence = min((confidence + avg_reliability) / 2, 0.98)

        result_obj = ResearchResult(
            query=query,
            synthesized_answer=answer,
            sources=sources,
            confidence=round(confidence, 3),
            research_time_ms=round((time.time() - start_time) * 1000, 2),
        )

        self.cache[cache_key] = (result_obj, datetime.utcnow())

        return result_obj


web_research_engine = WebResearchEngine()
