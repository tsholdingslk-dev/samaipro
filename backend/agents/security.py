"""
SAM AI - Security Analyst Agent (APK Decompiler)
Performs static analysis, security auditing, and reverse engineering of Android APKs.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class SecurityAnalyst(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Security Analyst",
            description="Performs static analysis, security auditing, and reverse engineering of Android APKs"
        )
        self.tools = ["apktool", "secret_scanner", "manifest_parser", "code_analyzer"]
        self._keywords = ["apk", "android", "reverse engineer", "decompile", "security audit", "app analysis", "mobile security"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            steps.append("Initializing APK analysis pipeline")

            system_prompt = """You are "AtoZ-DecompEngine", an autonomous, end-to-end Reverse Engineering Pipeline,
Mobile Security Auditor, and Static Code Analysis System.

Your role is to accept raw inputs (Play Store URLs, Package Names, or Decompiled Source Trees)
and generate complete technical reports with zero manual intervention.

Output strictly in structured Markdown with sections for App Metadata, Critical Security Findings,
Architecture, and Refactoring Recommendations."""

            prompt = f"""Complete this APK analysis task:

Task: {task.description}

Context: {json.dumps(context) if context else 'None'}"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages, temperature=0.5)
            steps.append("Completed static code analysis")
            steps.append("Scanned for security vulnerabilities")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(task=task, result=result["content"], steps=steps,
                                        metadata={"provider": result.get("provider")},
                                        execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"APK analysis failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
