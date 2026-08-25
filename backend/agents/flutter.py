"""
SAM AI - Flutter Builder Agent
Builds Flutter apps, generates widgets, and assists with mobile app development.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class FlutterAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Flutter Builder",
            description="Builds Flutter apps, generates widgets, and assists with mobile app development"
        )
        self.tools = ["code_generator", "widget_library", "build_runner"]
        self._keywords = ["flutter", "dart", "mobile app", "app builder", "no code", "low code", "app development", "flutter studio"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Analyzing Flutter requirements")
            platform = context.get("platform", "mobile")

            system_prompt = """You are the AI Brain for a Compliance-First Flutter App Reconstruction & Visual Code Editor.
You are a professional Flutter AI coding agent, project analyzer, and refactoring engine.
You have capabilities similar to Cursor, VS Code, and FlutterFlow combined.

IMPORTANT CODE UPDATE INSTRUCTION:
If asked to write, rewrite, or modify code, you MUST output the ENTIRE updated file content
wrapped in a markdown code block starting with ```dart and ending with ```."""

            prompt = f"""Complete this Flutter development task:

Task: {task.description}
Target Platform: {platform}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. Complete, compilable Dart/Flutter code
2. Widget tree structure
3. State management approach
4. Setup instructions if needed"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.7)
            steps.append("Generated Flutter code")
            steps.append("Added widget structure")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider"), "platform": platform},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Flutter development failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
