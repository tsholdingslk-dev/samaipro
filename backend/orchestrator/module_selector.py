"""
SAM AI - Module Selector
Maps intents to backend modules, agents, and required tools.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

from orchestrator.intent_classifier import IntentCategory, IntentClassification


@dataclass
class ModuleSelection:
    module_name: str
    agent_name: Optional[str]
    required_tools: List[str]
    endpoint: str
    capabilities: List[str]
    cost_tier: str  # "free", "standard", "premium"
    model_hint: str = "standard"


# Mapping from intent to module selection
MODULE_MAPPING: Dict[IntentCategory, ModuleSelection] = {
    IntentCategory.GENERAL: ModuleSelection(
        module_name="General Chat",
        agent_name=None,
        required_tools=[],
        endpoint="/chat",
        capabilities=["conversation", "qa"],
        cost_tier="free",
        model_hint="standard"
    ),
    IntentCategory.CONVERSATION: ModuleSelection(
        module_name="Conversation",
        agent_name=None,
        required_tools=[],
        endpoint="/chat",
        capabilities=["greeting", "small_talk"],
        cost_tier="free",
        model_hint="cheap"
    ),
    IntentCategory.CODING: ModuleSelection(
        module_name="Coding Assistant",
        agent_name="Coder",
        required_tools=["code_executor", "file_manager"],
        endpoint="/coding",
        capabilities=["code_generation", "code_review", "debugging", "documentation"],
        cost_tier="standard",
        model_hint="premium"
    ),
    IntentCategory.TRANSLATION: ModuleSelection(
        module_name="Translation Engine",
        agent_name="Translator",
        required_tools=[],
        endpoint="/translate",
        capabilities=["text_translation", "audio_translation", "multilingual"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.IMAGE_GENERATION: ModuleSelection(
        module_name="Image Generation",
        agent_name="ImageAgent",
        required_tools=["image_generator"],
        endpoint="/image/generate",
        capabilities=["text-to-image", "style-transfer", "upscaling"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.IMAGE_ANALYSIS: ModuleSelection(
        module_name="Vision Analysis",
        agent_name="VisionAgent",
        required_tools=["vision_model", "ocr"],
        endpoint="/image/analyze",
        capabilities=["image_qa", "ocr", "object_detection", "scene_description"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.VOICE_TTS: ModuleSelection(
        module_name="Text-to-Speech",
        agent_name="VoiceAgent",
        required_tools=["tts_engine"],
        endpoint="/voice/tts",
        capabilities=["speech_synthesis", "voice_cloning", "multilingual_voice"],
        cost_tier="premium",
        model_hint="standard"
    ),
    IntentCategory.VOICE_STT: ModuleSelection(
        module_name="Speech-to-Text",
        agent_name="VoiceAgent",
        required_tools=["stt_engine"],
        endpoint="/voice/stt",
        capabilities=["transcription", "diarization", "summarization"],
        cost_tier="premium",
        model_hint="standard"
    ),
    IntentCategory.VIDEO: ModuleSelection(
        module_name="Video Generation",
        agent_name="VideoAgent",
        required_tools=["video_generator"],
        endpoint="/media/video",
        capabilities=["text-to-video", "video_editing", "animation"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.DOCUMENT: ModuleSelection(
        module_name="Document Processing",
        agent_name="DocumentAgent",
        required_tools=["pdf_processor", "docx_processor"],
        endpoint="/document",
        capabilities=["pdf_extraction", "docx_processing", "formatting", "summarization"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.RESEARCH: ModuleSelection(
        module_name="Research Engine",
        agent_name="Researcher",
        required_tools=["web_search", "web_scraper", "crawler"],
        endpoint="/research",
        capabilities=["web_search", "fact_checking", "summarization", "data_extraction"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.CONTENT: ModuleSelection(
        module_name="Content Creation",
        agent_name="ContentCreator",
        required_tools=["writing_engine"],
        endpoint="/content",
        capabilities=["article_writing", "script_writing", "copywriting", "seo_optimization"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.BUSINESS: ModuleSelection(
        module_name="Business Intelligence",
        agent_name="BusinessAnalyst",
        required_tools=["market_data", "report_generator"],
        endpoint="/business",
        capabilities=["market_analysis", "strategy", "report_generation", "financial_modeling"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.SEO: ModuleSelection(
        module_name="SEO Optimizer",
        agent_name="SEOAgent",
        required_tools=["seo_analyzer", "keyword_researcher"],
        endpoint="/seo",
        capabilities=["keyword_analysis", "backlink_analysis", "content_optimization", "ranking_tracker"],
        cost_tier="premium",
        model_hint="standard"
    ),
    IntentCategory.SOCIAL: ModuleSelection(
        module_name="Social Media",
        agent_name="SocialAgent",
        required_tools=["social_scheduler", "content_generator"],
        endpoint="/social",
        capabilities=["post_generation", "caption_writing", "scheduling", "analytics"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.NEWS: ModuleSelection(
        module_name="News Engine",
        agent_name="NewsAgent",
        required_tools=["news_aggregator", "synthesizer"],
        endpoint="/news",
        capabilities=["news_aggregation", "summarization", "trending", "fact_checking"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.EDUCATION: ModuleSelection(
        module_name="Education Assistant",
        agent_name="EducationAgent",
        required_tools=["tutor_engine", "quiz_generator"],
        endpoint="/education",
        capabilities=["tutoring", "explanation", "quiz_generation", "concept_mapping"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.LEAD_GEN: ModuleSelection(
        module_name="Lead Generation",
        agent_name="LeadAgent",
        required_tools=["web_scraper", "email_finder"],
        endpoint="/leads",
        capabilities=["business_discovery", "contact_extraction", "outreach", "demo_generation"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.CRYPTO: ModuleSelection(
        module_name="Crypto Analysis",
        agent_name="CryptoAgent",
        required_tools=["market_data", "price_fetcher"],
        endpoint="/crypto",
        capabilities=["price_analysis", "market_trends", "portfolio_advice", "technical_analysis"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.AUTOMATION: ModuleSelection(
        module_name="Automation Engine",
        agent_name="AutomationAgent",
        required_tools=["script_runner", "workflow_builder"],
        endpoint="/automation",
        capabilities=["workflow_automation", "script_generation", "integration_setup", "scheduling"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.APK_DECOMP: ModuleSelection(
        module_name="APK Analysis",
        agent_name="SecurityAnalyst",
        required_tools=["apktool", "secret_scanner", "manifest_parser"],
        endpoint="/apk/analyze",
        capabilities=["static_analysis", "security_audit", "secret_scanning", "manifest_analysis"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.FLUTTER_BUILD: ModuleSelection(
        module_name="Flutter Builder",
        agent_name="FlutterAgent",
        required_tools=["code_generator", "widget_library", "build_runner"],
        endpoint="/flutter",
        capabilities=["ui_generation", "widget_creation", "code_refactoring", "build_assistant"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.KNOWLEDGE: ModuleSelection(
        module_name="Knowledge Engine",
        agent_name="KnowledgeAgent",
        required_tools=["rag_engine", "document_search"],
        endpoint="/knowledge",
        capabilities=["question_answering", "document_search", "knowledge_management", "fact_checking"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.COUNCIL: ModuleSelection(
        module_name="AI Council",
        agent_name="Council",
        required_tools=["multi_agent_debate", "synthesizer"],
        endpoint="/agents/council",
        capabilities=["multi_perspective_analysis", "consensus_building", "detailed_review"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.DATA_ANALYSIS: ModuleSelection(
        module_name="Data Analytics",
        agent_name="DataAgent",
        required_tools=["chart_generator", "stats_engine"],
        endpoint="/analytics",
        capabilities=["data_visualization", "statistical_analysis", "trend_detection"],
        cost_tier="premium",
        model_hint="standard"
    ),
    IntentCategory.LEGAL: ModuleSelection(
        module_name="Legal Assistant",
        agent_name="LegalAgent",
        required_tools=["template_engine", "clause_extractor"],
        endpoint="/legal",
        capabilities=["contract_writing", "legal_research", "clause_analysis", "compliance_check"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.TOURISM: ModuleSelection(
        module_name="Tourism Guide",
        agent_name="TourismAgent",
        required_tools=["place_database", "planner"],
        endpoint="/tourism",
        capabilities=["itinerary_planning", "place_recommendation", "local_info", "booking_assistance"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.RECIPE: ModuleSelection(
        module_name="Recipe Assistant",
        agent_name="RecipeAgent",
        required_tools=["ingredient_matcher", "instruction_generator"],
        endpoint="/recipe",
        capabilities=["recipe_suggestions", "substitute_suggestions", "meal_planning", "cooking_instructions"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.ENTERTAINMENT: ModuleSelection(
        module_name="Entertainment",
        agent_name="EntertainmentAgent",
        required_tools=["joke_generator", "game_engine"],
        endpoint="/entertainment",
        capabilities=["joke_generation", "game_hosting", "trivia", "fun_facts"],
        cost_tier="free",
        model_hint="cheap"
    ),
    IntentCategory.STORYTELLING: ModuleSelection(
        module_name="Storyteller",
        agent_name="StorytellerAgent",
        required_tools=["narrative_engine", "character_builder"],
        endpoint="/story",
        capabilities=["story_generation", "character_creation", "world_building", "plot_development"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.EMAIL: ModuleSelection(
        module_name="Email Writer",
        agent_name="EmailAgent",
        required_tools=["template_engine"],
        endpoint="/email",
        capabilities=["email_composition", "subject_line_optimization", "tone_adjustment"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.RESUME: ModuleSelection(
        module_name="Resume Builder",
        agent_name="ResumeAgent",
        required_tools=["template_engine", "ats_optimizer"],
        endpoint="/resume",
        capabilities=["resume_generation", "cv_optimization", "cover_letter", "ats_friendly"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.PRESENTATION: ModuleSelection(
        module_name="Presentation Builder",
        agent_name="PresentationAgent",
        required_tools=["slide_generator", "template_engine"],
        endpoint="/presentation",
        capabilities=["slide_deck_creation", "content_outline", "visual_suggestions", "speaker_notes"],
        cost_tier="premium",
        model_hint="standard"
    ),
    IntentCategory.FINANCIAL: ModuleSelection(
        module_name="Financial Planner",
        agent_name="FinanceAgent",
        required_tools=["calculator", "projection_engine"],
        endpoint="/finance",
        capabilities=["budget_planning", "investment_analysis", "tax_calculation", "financial_modeling"],
        cost_tier="premium",
        model_hint="premium"
    ),
    IntentCategory.MEDICAL: ModuleSelection(
        module_name="Health Assistant",
        agent_name="HealthAgent",
        required_tools=["symptom_checker", "wellness_planner"],
        endpoint="/health",
        capabilities=["wellness_advice", "symptom_info", "fitness_planning", "nutrition_guidance"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.PLANNING: ModuleSelection(
        module_name="Planning Assistant",
        agent_name="Planner",
        required_tools=["task_breakdown"],
        endpoint="/plan",
        capabilities=["task_decomposition", "timeline_planning", "resource_allocation"],
        cost_tier="standard",
        model_hint="standard"
    ),
    IntentCategory.ADMIN_TRAINING: ModuleSelection(
        module_name="Admin Trainer",
        agent_name=None,
        required_tools=["knowledge_trainer"],
        endpoint="/admin/train",
        capabilities=["knowledge_base_training", "instruction_tuning", "faq_management"],
        cost_tier="premium",
        model_hint="premium"
    ),
}


class ModuleSelector:
    def __init__(self):
        self.module_mapping = MODULE_MAPPING

    def select(self, classification: IntentClassification) -> ModuleSelection:
        selection = self.module_mapping.get(classification.primary_intent)
        if not selection:
            selection = self.module_mapping.get(IntentCategory.GENERAL)

        if classification.confidence < 0.5 and classification.primary_intent not in (
            IntentCategory.GENERAL, IntentCategory.CONVERSATION
        ):
            selection = self.module_mapping[IntentCategory.GENERAL]

        return selection

    def select_by_name(self, module_name: str) -> Optional[ModuleSelection]:
        for selection in self.module_mapping.values():
            if selection.module_name.lower() == module_name.lower():
                return selection
        return None

    def get_all_modules(self) -> List[Dict[str, Any]]:
        modules = []
        for category, selection in self.module_mapping.items():
            modules.append({
                "intent": category.value,
                "module_name": selection.module_name,
                "agent": selection.agent_name,
                "endpoint": selection.endpoint,
                "capabilities": selection.capabilities,
                "cost_tier": selection.cost_tier,
                "model_hint": selection.model_hint,
            })
        return modules

    def get_module_categories(self) -> Dict[str, List[str]]:
        categories = {}
        for category, selection in self.module_mapping.items():
            if selection.cost_tier not in categories:
                categories[selection.cost_tier] = []
            categories[selection.cost_tier].append(category.value)
        return categories
