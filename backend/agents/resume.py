"""
SAM AI - Resume Agent
Creates resumes, CVs, cover letters, and LinkedIn profiles.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class ResumeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Resume Builder",
            description="Creates resumes, CVs, cover letters, and LinkedIn profiles"
        )
        self.tools = ["template_engine", "ats_optimizer", "skill_extractor"]
        self._keywords = ["resume", "cv", "curriculum vitae", "cover letter", "linkedin", "job application"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []

        try:
            steps.append("Analyzed resume requirements")

            experience = context.get("experience", "")
            skills = context.get("skills", "")
            target_role = context.get("target_role", "")
            format_type = context.get("format", "ats-friendly")

            prompt = f"""You are a resume writing expert. Create a professional resume/CV.

Task: {task.description}

Experience: {experience}
Skills: {skills}
Target Role: {target_role}
Format: {format_type}

Context: {json.dumps(context) if context else 'None'}

Provide:
1. ATS-friendly resume in clean format
2. Key skills section
3. Professional summary / headline
4. If cover letter requested, include it"""

            messages = [
                {"role": "system", "content": "You are an expert resume writer. Create ATS-optimized, professional documents."},
                {"role": "user", "content": prompt}
            ]

            result = await api_hub.chat(messages)
            steps.append("Created resume/CV")
            steps.append("Optimized for ATS")

            task.result = result["content"]
            task.status = "completed"
            task.completed_at = datetime.utcnow().isoformat()

            return self.create_response(
                task=task,
                result=result["content"],
                steps=steps,
                metadata={"provider": result.get("provider"), "format": format_type},
                execution_time=time.time() - start_time
            )
        except Exception as e:
            task.status = "failed"
            return AgentResponse(
                agent_name=self.name, task_id=task.id, status="failed",
                result=f"Resume creation failed: {str(e)}",
                steps_completed=steps, execution_time=time.time() - start_time
            )
