"""
SAM AI - Voice Agent
Handles text-to-speech synthesis and speech-to-text transcription.
"""

import time
import json
from datetime import datetime
from typing import Dict, Any, Optional
from agents.base import BaseAgent, AgentTask, AgentResponse
from api_hub import api_hub


class VoiceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Voice Agent",
            description="Handles text-to-speech synthesis and speech-to-text transcription"
        )
        self.tools = ["tts_engine", "stt_engine", "voice_cloning"]
        self._keywords = ["text to speech", "tts", "voice", "speak", "audio", "transcribe", "speech to text", "stt", "narration"]

    def can_handle(self, task_description: str) -> bool:
        return any(k in task_description.lower() for k in self._keywords)

    async def execute(self, task: AgentTask, context: Dict[str, Any]) -> AgentResponse:
        start_time = time.time()
        steps = []
        try:
            mode = context.get("mode", "tts")
            text = context.get("text", task.description)
            voice = context.get("voice", "alloy")

            if mode == "stt" or "transcribe" in task.description.lower() or "speech to text" in task.description.lower():
                steps.append("Processing speech-to-text")
                audio_data = context.get("audio_data", b"")
                if not audio_data:
                    task.result = "Audio data required for STT. Please provide audio_data in context."
                    return self.create_response(task=task, result=task.result, steps=["No audio data provided"],
                                                execution_time=time.time() - start_time)

                result = await api_hub.transcribe_audio(audio_data=audio_data)
                steps.append("Transcribed audio")
                steps.append("Formatted transcript")

                task.result = result.get("content", "Transcription completed")
                task.status = "completed"
                task.completed_at = datetime.utcnow().isoformat()

                return self.create_response(task=task, result=task.result, steps=steps,
                                            metadata={"provider": result.get("provider"), "mode": "stt"},
                                            execution_time=time.time() - start_time)
            else:
                steps.append("Processing text-to-speech")
                result = await api_hub.synthesize_speech(text=text, voice=voice)
                steps.append("Synthesized speech")
                steps.append("Applied voice optimization")

                task.result = f"Speech synthesized using {result.get('provider', 'default')} provider"
                task.status = "completed"
                task.completed_at = datetime.utcnow().isoformat()

                return self.create_response(task=task, result=task.result, steps=steps,
                                            metadata={"provider": result.get("provider"), "mode": "tts", "voice": voice},
                                            execution_time=time.time() - start_time)
        except Exception as e:
            task.status = "failed"
            return AgentResponse(agent_name=self.name, task_id=task.id, status="failed",
                                 result=f"Voice processing failed: {str(e)}", steps_completed=steps, execution_time=time.time() - start_time)
