"""
SAM AI - Translation Agent
Handles multilingual translation with cultural context awareness.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class TranslationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Translator",
            description="Handles multilingual translation with cultural context awareness, specializing in Sinhala/Tamil/English"
        )
        self.tools = ["language_detector", "context_preserver", "cultural_adaptor"]
        self._keywords = ["translate", "translation", "tamil", "sinhala", "english", "language", "convert to", "bilingual", "singlish"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            target_lang = context.get("target_language", "english")
            source_lang = context.get("source_language", "auto")
            preserve_formatting = context.get("preserve_formatting", True)

            steps.append("Detecting source language")

            system_prompt = f"You are a professional translator specializing in Sinhala, Tamil, and English. "
            if target_lang == "sinhala" or target_lang == "si":
                system_prompt += "Translate to natural spoken Sinhala (Katha Karana Sinhala). Never use robot-like formal Sinhala. Use Singlish-friendly phrasing if code-switching."
            elif target_lang == "tamil" or target_lang == "ta":
                system_prompt += "Translate to natural Tamil with cultural accuracy."
            else:
                system_prompt += "Translate to natural English."

            if preserve_formatting:
                system_prompt += " Preserve the original formatting, structure, and style."

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Translate this text to {target_lang}:\n\n{task.description}\n\nContext: {json.dumps(context) if context else 'None'}"}
            ]

            result = await api_hub.chat(messages, temperature=0.3)
            steps.append(f"Translated to {target_lang}")
            steps.append("Applied cultural context")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "target_language": target_lang, "source_language": source_lang},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Translation failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
