"""
SAM AI - Intent Classifier
Detects user intent from natural language requests using hybrid keyword + AI classification.
"""

import re
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import Counter


class IntentCategory(str, Enum):
    GENERAL = "general"
    CONVERSATION = "conversation"
    CODING = "coding"
    TRANSLATION = "translation"
    IMAGE_GENERATION = "image_generation"
    IMAGE_ANALYSIS = "image_analysis"
    VOICE_TTS = "voice_tts"
    VOICE_STT = "voice_stt"
    VIDEO = "video"
    DOCUMENT = "document"
    RESEARCH = "research"
    CONTENT = "content"
    BUSINESS = "business"
    SEO = "seo"
    SOCIAL = "social"
    NEWS = "news"
    EDUCATION = "education"
    LEAD_GEN = "lead_gen"
    CRYPTO = "crypto"
    AUTOMATION = "automation"
    APK_DECOMP = "apk_decomp"
    FLUTTER_BUILD = "flutter_build"
    KNOWLEDGE = "knowledge"
    COUNCIL = "council"
    DATA_ANALYSIS = "data_analysis"
    LEGAL = "legal"
    TOURISM = "tourism"
    RECIPE = "recipe"
    ENTERTAINMENT = "entertainment"
    STORYTELLING = "storytelling"
    EMAIL = "email"
    RESUME = "resume"
    PRESENTATION = "presentation"
    FINANCIAL = "financial"
    MEDICAL = "medical"
    PLANNING = "planning"
    ADMIN_TRAINING = "admin_training"


@dataclass
class IntentMatch:
    category: IntentCategory
    confidence: float
    matched_keywords: List[str] = field(default_factory=list)
    sub_intent: Optional[str] = None


@dataclass
class IntentClassification:
    primary_intent: IntentCategory
    confidence: float
    all_matches: List[IntentMatch] = field(default_factory=list)
    detected_language: str = "english"
    complexity: str = "medium"
    entities: Dict[str, Any] = field(default_factory=dict)


# Keyword dictionaries for each intent category
INTENT_KEYWORDS: Dict[IntentCategory, List[str]] = {
    IntentCategory.CONVERSATION: ["hello", "hi", "hey", "vanakkam", "ayubowan", "greetings", "how are you"],
    IntentCategory.GENERAL: ["help", "what can you do", "who are you", "capabilities"],
    IntentCategory.CODING: [
        "code", "program", "script", "function", "api", "debug", "fix", "implement",
        "build", "develop", "python", "javascript", "java", "react", "node", "sql",
        "flutter", "dart", "android", "ios", "app", "website", "web app",
        "refactor", "optimize", "error", "bug", "compile", "syntax", "backend",
        "frontend", "fullstack", "full stack", "django", "fastapi", "express",
        "typescript", "golang", "rust", "cpp", "c++", "html", "css", "svelte"
    ],
    IntentCategory.TRANSLATION: [
        "translate", "translation", "tamil", "sinhala", "english", "bilingual",
        "sinhat", "tamil", "language", "convert to", "translate to", "පරිවර්තනය",
        "மொழிபெயர்ப்பு", "singlish", "romanized"
    ],
    IntentCategory.IMAGE_GENERATION: [
        "generate image", "create image", "draw", "illustration", "graphic",
        "logo", "design", "photo", "picture", "dALL", "dalle", "midjourney",
        "stable diffusion", "AI art", "digital art", "render", "visual"
    ],
    IntentCategory.IMAGE_ANALYSIS: [
        "analyze image", "what is in this", "describe", "identify", "recognize",
        "OCR", "text in image", "read image", "vision", "see image", "look at",
        "photo", "picture analysis"
    ],
    IntentCategory.VOICE_TTS: [
        "text to speech", "TTS", "voice", "speak", "audio", "listen",
        "narration", "narate", "voiceover", "sound", "pronounce"
    ],
    IntentCategory.VOICE_STT: [
        "speech to text", "STT", "transcribe", "transcription", "listen",
        "audio to text", "convert audio", "hear", "voice note"
    ],
    IntentCategory.VIDEO: [
        "video", "animation", "motion graphics", "reel", "youtube short",
        "tiktok", "edit video", "create video", "movie"
    ],
    IntentCategory.DOCUMENT: [
        "pdf", "document", "word", "docx", "report", "format", "resume",
        "presentation", "ppt", "slides", "template"
    ],
    IntentCategory.RESEARCH: [
        "research", "find", "search", "information", "data", "investigate",
        "study", "analyze", "facts", "statistics", "latest", "current",
        "web search", "google", "crawler", "crawling"
    ],
    IntentCategory.CONTENT: [
        "write", "create", "article", "blog", "script", "content", "post",
        "caption", "social media", "youtube", "story", "text", "copy",
        "marketing copy", "ad copy"
    ],
    IntentCategory.BUSINESS: [
        "business", "strategy", "market", "analysis", "report", "growth",
        "revenue", "marketing", "sales", "startup", "entrepreneur", "plan",
        "stocks", "investment", "roi", "swot"
    ],
    IntentCategory.SEO: [
        "SEO", "search engine", "keywords", "backlink", "ranking", "traffic",
        "keyword", "meta", "optimization", "google search"
    ],
    IntentCategory.SOCIAL: [
        "facebook", "instagram", "twitter", "x.com", "linkedin", "tiktok",
        "social media", "post", "share", "caption"
    ],
    IntentCategory.NEWS: [
        "news", "current", "latest", "breaking", "headlines", "today",
        "recent", "update", "sri lanka news"
    ],
    IntentCategory.EDUCATION: [
        "teach", "learn", "tutor", "study", "explain", "tutorial",
        "lesson", "course", "student", "homework", "assignment", "exam",
        "k-12", "university"
    ],
    IntentCategory.LEAD_GEN: [
        "lead", "leads", "business directory", "customers", "prospects",
        "outreach", "cold email", "sales leads", "find business"
    ],
    IntentCategory.CRYPTO: [
        "crypto", "bitcoin", "ethereum", "blockchain", "token", "trading",
        "price", "exchange", "wallet", "NFT", "DeFi"
    ],
    IntentCategory.AUTOMATION: [
        "automate", "automation", "workflow", "script", "bot", "integration",
        "zapier", "make.com", "schedule", "email sequence"
    ],
    IntentCategory.APK_DECOMP: [
        "apk", "android", "reverse engineer", "decompile", "security audit",
        "app analysis", "mobile security"
    ],
    IntentCategory.FLUTTER_BUILD: [
        "flutter", "dart", "mobile app", "app builder", "no code", "low code",
        "app development", "flutter studio"
    ],
    IntentCategory.KNOWLEDGE: [
        "knowledge", "database", "FAQ", "docs", "documentation",
        "company info", "policy", "handbook"
    ],
    IntentCategory.COUNCIL: [
        "council", "debate", "review", "evaluate", "compare", "architecture",
        "strategy", "opinion", "perspectives", "consensus"
    ],
    IntentCategory.DATA_ANALYSIS: [
        "data analysis", "analytics", "chart", "graph", "visualize", "dataset",
        "spreadsheet", "excel", "csv", "statistics"
    ],
    IntentCategory.LEGAL: [
        "legal", "law", "contract", "agreement", "terms", "privacy policy",
        "sri lankan law", "attorney", "legal advice"
    ],
    IntentCategory.TOURISM: [
        "tourism", "travel", "visit", "tourist", "itinerary", "hotel",
        "restaurant", "sri lanka", "vacation", "holiday", "places to visit"
    ],
    IntentCategory.RECIPE: [
        "recipe", "cook", "cooking", "food", "dish", "kitchen", "ingredients",
        "how to make"
    ],
    IntentCategory.ENTERTAINMENT: [
        "joke", "funny", "comedy", "entertain", "game", "quiz", "trivia"
    ],
    IntentCategory.STORYTELLING: [
        "story", "tale", "narrative", "character", "plot", "fiction",
        "fantasy", "sci-fi"
    ],
    IntentCategory.EMAIL: [
        "email", "e-mail", "mail", "letter", "message", "compose",
        "subject line", "professional email"
    ],
    IntentCategory.RESUME: [
        "resume", "CV", "curriculum vitae", "cover letter", "job application",
        "LinkedIn", "profile"
    ],
    IntentCategory.PRESENTATION: [
        "presentation", "slides", "ppt", "slideshow", "deck", "talk",
        "speech", "webinar"
    ],
    IntentCategory.FINANCIAL: [
        "finance", "budget", "expense", "tax", "calculation", "loan",
        "investment plan", "savings", "financial plan"
    ],
    IntentCategory.MEDICAL: [
        "medical", "health", "symptom", "wellness", "fitness",
        "diet", "nutrition"
    ],
    IntentCategory.PLANNING: [
        "plan", "schedule", "itinerary", "timeline", "roadmap",
        "breakdown", "steps", "organize", "to-do"
    ],
    IntentCategory.ADMIN_TRAINING: [
        "train", "training", "teach me", "learn", "knowledge base",
        "admin train"
    ],
}

# Language detection keywords
SINHALA_KEYWORDS = ["සිංහල", "සිංහලෙන්", "සිංහ", "ලංකාව", "ජපාන", "කොළඹ", "කාන්තාව"]
TAMIL_KEYWORDS = ["தமிழ்", "தமிழில்", "லங்கை", "தமிழன்", "மலை", "கோவில்", "சென்னை", "தமிழ்நாடு"]
SINGAPORE_KEYWORDS = ["සිංහල", "தமிழ்", "ලංකාව", "லங்கை"]


class IntentClassifier:
    def __init__(self):
        self._compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[IntentCategory, List[re.Pattern]]:
        patterns = {}
        for category, keywords in INTENT_KEYWORDS.items():
            patterns[category] = []
            for kw in keywords:
                patterns[category].append(re.compile(re.escape(kw), re.IGNORECASE))
        return patterns

    def _keyword_match(self, text: str) -> List[IntentMatch]:
        text_lower = text.lower()
        matches = []
        for category, patterns in self._compiled_patterns.items():
            matched = []
            for pattern in patterns:
                if pattern.search(text_lower):
                    # Extract the actual matched keyword
                    match = pattern.search(text_lower)
                    if match:
                        matched.append(match.group(0))
            if matched:
                confidence = min(len(matched) * 0.25 + 0.3, 0.95)
                matches.append(IntentMatch(
                    category=category,
                    confidence=round(confidence, 2),
                    matched_keywords=matched
                ))
        matches.sort(key=lambda m: m.confidence, reverse=True)
        return matches

    def _detect_language(self, text: str) -> str:
        sin_count = sum(1 for c in text if c in SINHALA_KEYWORDS or '\u0DC0' <= c <= '\u0DFF' or '\u0D80' <= c <= '\u0DFF')
        tam_count = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
        singlish_count = len(re.findall(r'\b(\w+(?:a|ay|umw|eth|ena|ena|wena|bora|kara|gara|hinda|laga|wada|yang|yon|dala|ne|di|ma|ba)\w+)\b', text, re.IGNORECASE))

        if tam_count > 2:
            return "tamil"
        if sin_count > 2:
            return "sinhala"
        if singlish_count > 2:
            return "singlish"
        return "english"

    def _detect_complexity(self, text: str, intent: IntentCategory) -> str:
        word_count = len(text.split())
        char_count = len(text)

        if char_count > 500 or word_count > 80:
            return "high"
        elif char_count > 150 or word_count > 30:
            return "high"

        # Intent-specific complexity
        high_complexity_intents = {
            IntentCategory.CODING, IntentCategory.RESEARCH,
            IntentCategory.BUSINESS, IntentCategory.APK_DECOMP,
            IntentCategory.COUNCIL, IntentCategory.IMAGE_ANALYSIS,
            IntentCategory.DATA_ANALYSIS, IntentCategory.LEGAL
        }
        if intent in high_complexity_intents and word_count > 15:
            return "high"
        elif intent in high_complexity_intents:
            return "medium"

        medium_complexity_intents = {
            IntentCategory.CONTENT, IntentCategory.BUSINESS,
            IntentCategory.RESEARCH, IntentCategory.DOCUMENT,
            IntentCategory.PRESENTATION, IntentCategory.RESUME
        }
        if intent in medium_complexity_intents and word_count > 20:
            return "high"
        elif intent in medium_complexity_intents or word_count > 25:
            return "medium"

        return "low"

    def _extract_entities(self, text: str, category: IntentCategory) -> Dict[str, Any]:
        entities = {}
        text_lower = text.lower()

        if category == IntentCategory.TRANSLATION:
            languages = ["english", "sinhala", "tamil", "hindi", "chinese", "japanese", "korean", "french", "german", "spanish"]
            for lang in languages:
                if f"to {lang}" in text_lower or f"{lang}" in text_lower:
                    entities["target_language"] = lang

        if category == IntentCategory.CODING:
            langs = ["python", "javascript", "typescript", "java", "go", "rust", "c++", "c", "php", "ruby", "dart", "swift", "kotlin"]
            for lang in langs:
                if lang in text_lower:
                    entities["language"] = lang
                    break
            frameworks = ["react", "vue", "angular", "django", "flask", "fastapi", "next.js", "express", "nodejs", "flutter", "bootstrap"]
            for fw in frameworks:
                if fw in text_lower:
                    entities["framework"] = fw
                    break

        if category == IntentCategory.IMAGE_GENERATION:
            styles = ["realistic", "cartoon", "anime", "oil painting", "watercolor", "pixel art", "3d render", "cyberpunk", "minimalist"]
            for style in styles:
                if style in text_lower:
                    entities["style"] = style
                    break

        return entities

    async def _ai_classify(self, text: str) -> Optional[IntentClassification]:
        try:
            from api_hub import api_hub

            categories_list = ", ".join([c.value for c in IntentCategory if c not in (IntentCategory.GENERAL, IntentCategory.CONVERSATION)])

            prompt = f"""Classify the following user request into exactly one intent category.
            
Categories: {categories_list}
            
If the request doesn't clearly fit any category, return "general" or "conversation".

User Request: "{text}"

Return ONLY a JSON object with:
{{"category": "best_match", "confidence": 0.95}}

Do not include any other text."""

            messages = [
                {"role": "system", "content": "You are an intent classification engine for an AI platform."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.3)
            content = result.get("content", "").strip()

            try:
                data = json.loads(content)
                cat_str = data.get("category", "general")
                confidence = data.get("confidence", 0.5)
                category = IntentCategory(cat_str) if cat_str in IntentCategory._value2member_map_ else IntentCategory.GENERAL
                return IntentClassification(
                    primary_intent=category,
                    confidence=confidence,
                    detected_language=self._detect_language(text),
                    complexity=self._detect_complexity(text, category),
                    entities=self._extract_entities(text, category)
                )
            except (json.JSONDecodeError, ValueError):
                return None
        except Exception:
            return None

    async def classify(self, text: str, use_ai_fallback: bool = True) -> IntentClassification:
        keyword_matches = self._keyword_match(text)

        if keyword_matches and keyword_matches[0].confidence >= 0.5:
            best = keyword_matches[0]
            if best.confidence < 0.75 and use_ai_fallback:
                ai_result = await self._ai_classify(text)
                if ai_result:
                    return ai_result

            return IntentClassification(
                primary_intent=best.category,
                confidence=best.confidence,
                all_matches=keyword_matches,
                detected_language=self._detect_language(text),
                complexity=self._detect_complexity(text, best.category),
                entities=self._extract_entities(text, best.category)
            )

        if use_ai_fallback:
            ai_result = await self._ai_classify(text)
            if ai_result:
                ai_result.all_matches = keyword_matches
                return ai_result

        return IntentClassification(
            primary_intent=IntentCategory.GENERAL,
            confidence=0.5,
            all_matches=keyword_matches,
            detected_language=self._detect_language(text),
            complexity=self._detect_complexity(text, IntentCategory.GENERAL)
        )
