"""
SAM AI - Entertainment Agent
Generates jokes, trivia, games, and entertaining content.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class EntertainmentAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Entertainment Host",
            description="Generates jokes, trivia, games, and entertaining content"
        )
        self.tools = ["joke_generator", "game_engine", "trivia_master"]
        self._keywords = ["joke", "funny", "comedy", "entertain", "game", "quiz", "trivia"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            content_type = context.get("content_type", "joke")
            language = context.get("language", "english")

            steps.append("Creating entertaining content")

            language_instruction = {
                "sinhala": "Use natural Sinhala (Singlish mixed OK).",
                "tamil": "Use Tamil.",
                "singlish": "Use Sinhala-English (Singlish) naturally.",
                "english": "Use English, but incorporate Sinhala/Tamil cultural references if relevant.",
            }

            lang_prompt = language_instruction.get(language, "Use English.")

            prompt = f"""You are a creative entertainer. Create engaging, humorous content.

Task: {task.description}
Type: {content_type}
Language: {language}
Instruction: {lang_prompt}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. The requested entertainment content
2. Keep it appropriate and engaging"""

            messages = [
                {"role": "system", "content": f"You are a creative entertainer. {lang_prompt}"},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.9)
            steps.append("Generated entertainment content")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "content_type": content_type},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Entertainment failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
