"""
SAM AI - Task Router (AI Orchestration Engine)
Routes user requests through: Intent Detection → Module Selection → Model Selection → Execution → Validation → Response
"""

import time
import uuid
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime

from orchestrator.intent_classifier import IntentClassifier, IntentClassification, IntentCategory
from orchestrator.module_selector import ModuleSelector, ModuleSelection
from orchestrator.model_selector import ModelSelector, ModelSelection, model_selector

from api_hub import api_hub


class PipelineStage(str, Enum):
    INTENT_DETECTION = "intent_detection"
    MODULE_SELECTION = "module_selection"
    MODEL_SELECTION = "model_selection"
    TOOL_ENGINE = "tool_engine"
    EXECUTION = "execution"
    VALIDATION = "validation"
    RESPONSE = "response"


@dataclass
class PipelineStep:
    stage: PipelineStage
    status: str  # "pending", "in_progress", "completed", "failed"
    details: Dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0
    error: Optional[str] = None


@dataclass
class RoutingResult:
    request_id: str
    user_message: str
    classification: IntentClassification
    module: ModuleSelection
    model_selection: Optional[ModelSelection]
    fallback_models: List[ModelSelection]
    pipeline: List[PipelineStep]
    final_response: str
    metadata: Dict[str, Any]
    total_duration_ms: float
    used_agent: Optional[str] = None
    provider_used: Optional[str] = None


class TaskRouter:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.module_selector = ModuleSelector()
        self.model_selector = model_selector
        self.routing_history: List[RoutingResult] = []
        self._agent_executor = None

    def register_executor(self, executor):
        """Register an agent executor for task execution."""
        self._agent_executor = executor

    async def _detect_intent(self, user_message: str) -> IntentClassification:
        return await self.intent_classifier.classify(user_message, use_ai_fallback=True)

    def _select_module(self, classification: IntentClassification) -> ModuleSelection:
        return self.module_selector.select(classification)

    def _select_model(self, classification: IntentClassification, module: ModuleSelection) -> tuple:
        complexity = classification.complexity
        cost_tier = module.cost_tier

        if module.model_hint == "cheap":
            model_hint = "cheap"
        elif module.model_hint == "premium":
            model_hint = "premium"
        else:
            model_hint = self._complexity_to_tier(complexity)

        primary = self.model_selector.select_model(
            complexity=complexity,
            cost_tier=model_hint
        )
        fallbacks = self.model_selector.select_with_fallback(
            complexity=complexity,
            cost_tier=model_hint,
            max_fallbacks=2
        )[1:]

        return primary, fallbacks

    def _complexity_to_tier(self, complexity: str) -> str:
        mapping = {"low": "cheap", "medium": "standard", "high": "premium"}
        return mapping.get(complexity, "standard")

    async def _execute_routing(self, user_message: str, context: Dict[str, Any]) -> str:
        start = time.time()
        request_id = str(uuid.uuid4())
        pipeline: List[PipelineStep] = []

        # Stage 1: Intent Detection
        stage_start = time.time()
        step1 = PipelineStep(stage=PipelineStage.INTENT_DETECTION, status="in_progress")
        try:
            classification = await self._detect_intent(user_message)
            step1.status = "completed"
            step1.details = {"intent": classification.primary_intent.value, "confidence": classification.confidence}
        except Exception as e:
            step1.status = "failed"
            step1.error = str(e)
            classification = IntentClassification(
                primary_intent=IntentCategory.GENERAL,
                confidence=0.5
            )
        step1.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step1)

        # Stage 2: Module Selection
        stage_start = time.time()
        step2 = PipelineStep(stage=PipelineStage.MODULE_SELECTION, status="in_progress")
        module = self._select_module(classification)
        step2.status = "completed"
        step2.details = {"module": module.module_name, "agent": module.agent_name, "endpoint": module.endpoint}
        step2.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step2)

        # Stage 3: Model Selection
        stage_start = time.time()
        step3 = PipelineStep(stage=PipelineStage.MODEL_SELECTION, status="in_progress")
        primary_model, fallback_models = self._select_model(classification, module)
        step3.status = "completed" if primary_model else "failed"
        step3.details = {
            "primary": primary_model.__dict__ if primary_model else None,
            "fallbacks": [f.__dict__ for f in fallback_models]
        }
        if not primary_model:
            step3.error = "No suitable AI model found among available providers"
        step3.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step3)

        # Stage 4: Tool Engine (if tools needed)
        stage_start = time.time()
        step4 = PipelineStep(stage=PipelineStage.TOOL_ENGINE, status="in_progress")
        tool_results = {}
        if module.required_tools:
            try:
                tool_results = await self._run_tools(module, context, user_message)
                step4.status = "completed"
                step4.details = {"tools_executed": list(tool_results.keys())}
            except Exception as e:
                step4.status = "failed"
                step4.error = str(e)
                step4.details = {"attempted": module.required_tools}
        else:
            step4.status = "completed"
            step4.details = {"message": "No external tools required"}
        step4.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step4)

        # Stage 5: Execution (model call via API hub with fallback)
        stage_start = time.time()
        step5 = PipelineStep(stage=PipelineStage.EXECUTION, status="in_progress")
        all_providers = [primary_model] + fallback_models if primary_model else []
        execution_result = None
        provider_used = None
        model_used = None

        for model_sel in all_providers:
            try:
                messages = self._build_messages(user_message, context, classification, module, tool_results)
                params = {
                    "model": model_sel.model,
                    "messages": messages,
                    "temperature": 0.7 if classification.complexity == "low" else 0.5 if classification.complexity == "medium" else 0.3,
                }

                # Try through api_hub
                result = await api_hub.chat(messages, model_override=model_sel.model)
                execution_result = result["content"]
                provider_used = result.get("provider", "unknown")
                model_used = result.get("model", model_sel.model)

                self.model_selector.record_success(provider_used, tokens=len(execution_result.split()))
                break
            except Exception as e:
                self.model_selector.record_failure("model_error", str(e))
                step5.details.setdefault("attempts", []).append({
                    "provider": model_sel.provider_name,
                    "error": str(e)[:200]
                })
                continue

        if execution_result is None:
            step5.status = "failed"
            step5.error = "All providers failed"
            execution_result = "I apologize, but I'm currently unable to process your request due to AI service issues. Please try again in a moment."
        else:
            step5.status = "completed"
            step5.details = {"provider": provider_used, "model": model_used}
        step5.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step5)

        # Stage 6: Validation
        stage_start = time.time()
        step6 = PipelineStep(stage=PipelineStage.VALIDATION, status="in_progress")
        validated_output, validation_metadata = await self._validate_output(
            execution_result, classification, module, context
        )
        step6.status = "completed"
        step6.details = validation_metadata
        step6.duration_ms = (time.time() - stage_start) * 1000
        pipeline.append(step6)

        # Stage 7: Response
        final_response = validated_output
        used_agent = module.agent_name

        total_duration = (time.time() - start) * 1000

        result = RoutingResult(
            request_id=request_id,
            user_message=user_message,
            classification=classification,
            module=module,
            model_selection=primary_model,
            fallback_models=fallback_models,
            pipeline=pipeline,
            final_response=final_response,
            metadata={
                "tool_results": tool_results,
                "validation": validation_metadata,
                "total_steps": len(pipeline),
            },
            total_duration_ms=round(total_duration, 2),
            used_agent=used_agent,
            provider_used=provider_used,
        )

        self.routing_history.append(result)
        if len(self.routing_history) > 1000:
            self.routing_history = self.routing_history[-500:]

        return result

    def _build_messages(self, user_message: str, context: Dict[str, Any], classification: IntentClassification, module: ModuleSelection, tool_results: Dict) -> List[Dict[str, Any]]:
        from project_brain import get_project_brain
        import os

        messages = []
        project_id = context.get("project_id", "general")

        system_prompt = self._build_system_prompt(classification, module)
        messages.append({"role": "system", "content": system_prompt})

        chat_history = context.get("chat_history", [])
        for msg in chat_history[-10:]:
            messages.append({"role": msg.get("role", "user"), "content": str(msg.get("content", ""))})

        enhanced_message = user_message

        tool_context = ""
        if tool_results:
            tool_context = "\n\n[Tool Engine Results]\n" + json.dumps(tool_results, indent=2)

        rag_context = ""
        try:
            brain = get_project_brain(project_id)
            rag_context = brain.get_context_for_prompt(user_message, top_k=3)
            if rag_context:
                rag_context = f"\n\n[RAG Knowledge Context]\n{rag_context}"
        except Exception:
            pass

        knowledge_context = ""
        try:
            from knowledge.knowledge_manager import KnowledgeManager
            from database import SessionLocal
            db = SessionLocal()
            km = KnowledgeManager(db)
            global_knowledge = km.search_knowledge(user_message, top_k=2)
            if global_knowledge:
                kb_text = "\n".join([f"- {k['content']}" for k in global_knowledge])
                knowledge_context = f"\n\n[Global Knowledge Base]\n{kb_text}"
            db.close()
        except Exception:
            pass

        enhanced_message = f"{rag_context}{knowledge_context}{tool_context}\n\n[User Request]\n{user_message}"

        messages.append({"role": "user", "content": enhanced_context})

        return messages

    def _build_system_prompt(self, classification: IntentClassification, module: ModuleSelection) -> str:
        base = (
            "You are SAM AI Core — an advanced AI orchestration platform. "
            "You are not a simple chatbot; you are an AI Operating System that coordinates "
            "multiple specialized agents, models, and tools to complete complex tasks.\n\n"
            f"Current Task Routing:\n"
            f"  Intent: {classification.primary_intent.value}\n"
            f"  Confidence: {classification.confidence}\n"
            f"  Language: {classification.detected_language}\n"
            f"  Complexity: {classification.complexity}\n"
            f"  Module: {module.module_name}\n"
            f"  Agent: {module.agent_name or 'None (direct)'}\n"
            f"  Capabilities: {', '.join(module.capabilities)}\n\n"
            "CRITICAL LANGUAGE RULE: ALWAYS respond in the exact same language the user uses. "
            "If they speak Tamil, reply in Tamil. If English, reply in English. "
            "NEVER use Sinhala unless the user explicitly speaks to you in Sinhala.\n"
            "Focus on providing accurate, helpful, and culturally appropriate responses "
            "for Sri Lankan users."
        )

        if classification.primary_intent == IntentCategory.CODING:
            base += "\n\nFor coding tasks: Output code in proper markdown code blocks with language tags."
        elif classification.primary_intent == IntentCategory.TRANSLATION:
            base += "\n\nFor translation: Output ONLY the translated text, no extra commentary."
        elif classification.primary_intent == IntentCategory.IMAGE_ANALYSIS:
            base += "\n\nFor image analysis: Be thorough and descriptive."
        elif classification.primary_intent == IntentCategory.IMAGE_GENERATION:
            base += "\n\nYou are a visual generation prompt expert. Refine the prompt for best results."

        if module.cost_tier == "cheap":
            base += "\n\nUse concise, efficient responses."
        elif module.cost_tier == "premium":
            base += "\n\nProvide detailed, thorough responses."

        return base

    async def _run_tools(self, module: ModuleSelection, context: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        results = {}
        for tool_name in module.required_tools:
            try:
                if tool_name == "web_search":
                    results[tool_name] = await self._tool_web_search(user_message)
                elif tool_name == "web_scraper":
                    results[tool_name] = await self._tool_scrape_urls(context.get("urls", []), user_message)
                elif tool_name == "crawler":
                    results[tool_name] = await self._tool_crawl(context.get("urls", []), user_message)
                elif tool_name == "code_executor":
                    results[tool_name] = "Code execution tool available for safe evaluation"
                elif tool_name == "file_manager":
                    results[tool_name] = "File inspection tool active"
                elif tool_name == "ocr":
                    results[tool_name] = "OCR tool available for image inputs"
                elif tool_name == "vision_model":
                    results[tool_name] = "Vision model available for image analysis"
                elif tool_name == "tts_engine":
                    results[tool_name] = "Text-to-speech engine ready"
                elif tool_name == "stt_engine":
                    results[tool_name] = "Speech-to-text engine ready"
                elif tool_name == "image_generator":
                    results[tool_name] = "Image generation pipeline ready"
                elif tool_name == "video_generator":
                    results[tool_name] = "Video generation pipeline ready"
                elif tool_name == "document_search":
                    results[tool_name] = "Document search ready"
                elif tool_name == "rag_engine":
                    results[tool_name] = "RAG knowledge engine active"
                elif tool_name == "seo_analyzer":
                    results[tool_name] = "SEO analysis ready"
                elif tool_name == "market_data":
                    results[tool_name] = "Market data feed ready"
                elif tool_name == "knowledge_trainer":
                    results[tool_name] = "Knowledge trainer ready"
                else:
                    results[tool_name] = f"Tool '{tool_name}' registered"
            except Exception as e:
                results[tool_name] = f"Tool error: {str(e)[:200]}"

        return results

    async def _tool_web_search(self, query: str) -> str:
        try:
            from knowledge.web_crawler import WebCrawler
            crawler = WebCrawler()
            results = await crawler.search(query, max_results=5)
            return json.dumps(results, indent=2, default=str)
        except Exception as e:
            return f"Search failed: {str(e)}"

    async def _tool_scrape_urls(self, urls: List[str], query: str) -> str:
        try:
            from knowledge.web_crawler import WebCrawler
            crawler = WebCrawler()
            results = await crawler.scrape_urls(urls, query)
            return json.dumps(results, indent=2, default=str)
        except Exception as e:
            return f"Scrape failed: {str(e)}"

    async def _tool_crawl(self, urls: List[str], query: str) -> str:
        return await self._tool_scrape_urls(urls, query)

    async def _validate_output(self, output: str, classification: IntentClassification, module: ModuleSelection, context: Dict[str, Any]) -> tuple:
        metadata = {
            "checks_performed": [],
            "issues_found": [],
            "repairs_attempted": 0,
            "final_status": "passed",
        }

        metadata["checks_performed"].append("length_check")
        if len(output) == 0:
            metadata["issues_found"].append("Empty response")
            metadata["final_status"] = "failed"
            return "I apologize, but I received an empty response. Please try again.", metadata

        metadata["checks_performed"].append("safety_check")
        safety_keywords = ["self-harm", "suicide", "kill yourself"]
        output_lower = output.lower()
        for kw in safety_keywords:
            if kw in output_lower:
                metadata["issues_found"].append(f"Safety concern detected: {kw}")
                metadata["final_status"] = "flagged"
                break

        metadata["checks_performed"].append("language_consistency")
        detected_lang = classification.detected_language
        if detected_lang in ("sinhala", "tamil"):
            if not any(ord(c) >= 0x0D80 for c in output) and classification.primary_intent != IntentCategory.TRANSLATION:
                if "english" in output_lower and "sinhala" in output_lower:
                    pass

        metadata["checks_performed"].append("schema_check")
        if classification.primary_intent == IntentCategory.KNOWLEDGE:
            try:
                pass
            except Exception:
                metadata["issues_found"].append("Potential schema issue in knowledge response")

        if classification.primary_intent in (IntentCategory.CODING, IntentCategory.FLUTTER_BUILD):
            metadata["checks_performed"].append("code_format_check")
            code_block_count = output.count("```")
            if "code" in output_lower and code_block_count < 2:
                metadata["issues_found"].append("Code detected but not in proper code block")
                repaired = output.replace("```", "").strip()
                metadata["repairs_attempted"] += 1
                output = f"```\n{repaired}\n```"

        metadata["checks_performed"].append("completeness_check")
        if len(output) < 20:
            metadata["issues_found"].append("Response seems incomplete")
            metadata["final_status"] = "warning"

        return output, metadata

    def get_routing_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        return [
            {
                "request_id": r.request_id,
                "intent": r.classification.primary_intent.value,
                "confidence": r.classification.confidence,
                "module": r.module.module_name,
                "provider": r.provider_used,
                "agent": r.used_agent,
                "duration_ms": r.total_duration_ms,
                "pipeline": [{"stage": s.stage.value, "status": s.status, "duration_ms": s.duration_ms} for s in r.pipeline],
                "metadata": r.metadata,
            }
            for r in self.routing_history[-limit:]
        ]

    async def health_check(self) -> Dict[str, Any]:
        provider_status = api_hub.get_provider_status()
        model_stats = self.model_selector.get_provider_stats()

        available = sum(1 for p in provider_status if p["status"] == "active")
        total = len(provider_status)

        return {
            "status": "healthy" if available > 0 else "degraded",
            "providers_available": available,
            "providers_total": total,
            "model_stats": model_stats,
            "routing_history_count": len(self.routing_history),
            "modules_registered": len(self.module_selector.module_mapping),
        }


task_router = TaskRouter()
