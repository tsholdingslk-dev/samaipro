"""
SAM AI - Centralized API Hub
All AI requests flow through this hub.
Supports multiple providers with failover and load balancing.

Now integrates the Provider Adapter Layer for unified multi-model support:
- Text: OpenAI, Gemini, Claude, OpenRouter, Groq, InferX, HuggingFace, Local LLMs
- Embedding: OpenAI, Gemini, OpenRouter, Local LLMs
- Image: DALL-E, Stable Diffusion, Midjourney
- Speech: Whisper (STT), OpenAI TTS, ElevenLabs TTS
- Vision: GPT-4o, Gemini Pro, Claude
"""

import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Import the new provider infrastructure
from providers.registry import provider_registry
from providers.fallback_manager import fallback_manager, FallbackManager
from providers.base import ProviderType

# Re-export for backward compatibility
__all__ = ["APIProvider", "APIHub", "api_hub", "provider_registry", "fallback_manager"]

class APIProvider:
    def __init__(self, name: str, api_key: str, base_url: str, model: str, priority: int = 1, quota_limit: int = 1000):
        self.name = name
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.priority = priority  # Lower number = higher priority
        self.quota_limit = quota_limit
        self.quota_used = 0
        self.status = "active"  # active, rate_limited, error, inactive
        self.client: Optional[OpenAI] = None
        self._init_client()

    def _init_client(self):
        try:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=60.0
            )

            self.status = "active"
        except Exception as e:
            print(f"Failed to initialize {self.name} client: {e}")
            self.status = "error"

    def is_available(self) -> bool:
        return (
            self.status == "active"
            and self.client is not None
            and self.quota_used < self.quota_limit
        )

    def increment_quota(self):
        self.quota_used += 1

    def get_info(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "model": self.model,
            "status": self.status,
            "priority": self.priority,
            "quota_used": self.quota_used,
            "quota_limit": self.quota_limit,
            "quota_remaining": self.quota_limit - self.quota_used,
        }


class APIHub:
    def __init__(self):
        self.providers: List[APIProvider] = []
        self._load_providers_from_env()

    def _load_providers_from_env(self):
        """Load providers from environment variables"""
        # InferX / DeepSeek (supports multiple comma-separated keys)
        inferx_keys_str = os.getenv("INFERX_API_KEY")
        if inferx_keys_str and inferx_keys_str != "your_inferx_api_key_here":
            inferx_keys = [k.strip() for k in inferx_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(inferx_keys):
                self.providers.append(APIProvider(
                    name=f"InferX_{idx+1}",
                    api_key=key,
                    base_url="https://model.inferx.net/endpoints/v1",
                    model="deepseek-v4-flash-0731",
                    priority=1,
                    quota_limit=1000
                ))

        # Gemini (supports multiple comma-separated keys)
        gemini_keys_str = os.getenv("GEMINI_API_KEY")
        if gemini_keys_str and gemini_keys_str != "your_gemini_api_key_here":
            gemini_keys = [k.strip() for k in gemini_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(gemini_keys):
                self.providers.append(APIProvider(
                    name=f"Gemini_{idx+1}",
                    api_key=key,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                    model="gemini-1.5-pro",
                    priority=0,
                    quota_limit=1500
                ))

        # OpenRouter (supports multiple comma-separated keys)
        openrouter_keys_str = os.getenv("OPENROUTER_API_KEY")
        if openrouter_keys_str and openrouter_keys_str != "your_openrouter_api_key_here":
            or_keys = [k.strip() for k in openrouter_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(or_keys):
                self.providers.append(APIProvider(
                    name=f"OpenRouter_{idx+1}",
                    api_key=key,
                    base_url="https://openrouter.ai/api/v1",
                    model="deepseek/deepseek-chat",
                    priority=2,
                    quota_limit=500
                ))

        # Claude / Anthropic (direct API, not OpenAI-compatible)
        claude_keys_str = os.getenv("CLAUDE_API_KEY")
        if claude_keys_str and claude_keys_str != "your_claude_api_key_here":
            claude_keys = [k.strip() for k in claude_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(claude_keys):
                self.providers.append(APIProvider(
                    name=f"Claude_{idx+1}",
                    api_key=key,
                    base_url="https://api.anthropic.com",
                    model="claude-3-5-sonnet-20241022",
                    priority=1,
                    quota_limit=1000
                ))

        # OpenAI (direct access for vision, image gen, TTS/STT)
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key and openai_key != "your_openai_api_key_here":
            self.providers.append(APIProvider(
                name="OpenAI",
                api_key=openai_key,
                base_url="https://api.openai.com/v1",
                model="gpt-4o-mini",
                priority=0,
                quota_limit=2000
            ))

        # Groq (supports multiple comma-separated keys)
        groq_keys_str = os.getenv("GROQ_API_KEY")
        if groq_keys_str and groq_keys_str != "your_groq_api_key_here":
            groq_keys = [k.strip() for k in groq_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(groq_keys):
                self.providers.append(APIProvider(
                    name=f"Groq_{idx+1}",
                    api_key=key,
                    base_url="https://api.groq.com/openai/v1",
                    model="llama-3.3-70b-versatile",
                    priority=0,
                    quota_limit=1000
                ))

        # HuggingFace (supports multiple comma-separated keys)
        hf_keys_str = os.getenv("HUGGINGFACE_API_KEY")
        if hf_keys_str and hf_keys_str != "your_huggingface_api_key_here":
            hf_keys = [k.strip() for k in hf_keys_str.split(",") if k.strip()]
            for idx, key in enumerate(hf_keys):
                if key.startswith("hf_"):
                    self.providers.append(APIProvider(
                        name=f"HuggingFace_{idx+1}",
                        api_key=key,
                        base_url="https://router.huggingface.co/v1",
                        model="Qwen/Qwen2.5-Coder-32B-Instruct",
                        priority=2,
                        quota_limit=1000
                    ))

        # Load dynamic API keys from database
        self._load_providers_from_db()

        # If no key is configured, add default free AI translation fallback
        if not self.providers:
            self.providers.append(APIProvider(
                name="SAM_Free_AI",
                api_key="hf_free_demo_key",
                base_url="https://router.huggingface.co/v1",
                model="Qwen/Qwen2.5-72B-Instruct",
                priority=99,
                quota_limit=10000
            ))

        # Sort by priority
        self.providers.sort(key=lambda p: p.priority)

    def _load_providers_from_db(self):
        """Load active API keys from SQLite database dynamically"""
        try:
            from database import SessionLocal
            import models
            db = SessionLocal()
            db_providers = db.query(models.APIProvider).filter(models.APIProvider.status == "active").all()
            
            existing_keys = {p.api_key for p in self.providers}
            for p in db_providers:
                if p.api_key and p.api_key not in existing_keys:
                    self.providers.append(APIProvider(
                        name=p.name,
                        api_key=p.api_key,
                        base_url=p.base_url,
                        model=p.model,
                        priority=int(p.priority or 1),
                        quota_limit=int(p.quota_limit or 1000)
                    ))
                    existing_keys.add(p.api_key)
            db.close()
        except Exception as e:
            print(f"DB Provider Notice: {e}")

        # Sort by priority
        self.providers.sort(key=lambda p: p.priority)

    def get_available_providers(self) -> List[APIProvider]:
        """Get all available providers sorted by priority"""
        self._load_providers_from_db()
        return [p for p in self.providers if p.is_available()]


    def get_provider_status(self) -> List[Dict[str, Any]]:
        """Get status of all providers"""
        return [p.get_info() for p in self.providers]

    async def chat(self, messages: List[Dict[str, Any]], model_override: Optional[str] = None, provider_name: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Send a chat request through the API Hub.
        Routes to the best available provider with automatic failover.
        """
        available = self.get_available_providers()
        if provider_name:
            available = [p for p in available if p.name.lower() == provider_name.lower()]
            
        # Detect if this is a vision request (multimodal)
        is_vision = False
        for msg in messages:
            if isinstance(msg.get("content"), list):
                for item in msg["content"]:
                    if isinstance(item, dict) and item.get("type") == "image_url":
                        is_vision = True
                        break
        
        # Filter for vision-capable models if needed
        if is_vision:
            vision_models = ["gemini-1.5-pro", "gemini-1.5-flash", "gpt-4o", "gpt-4o-mini", "claude-3"]
            available = [p for p in available if any(vm in p.model.lower() for vm in vision_models) or "gpt-4o" in p.model.lower()]

        if not available:
            if is_vision:
                raise Exception("No multimodal (vision) AI providers available. Please check your API keys for Gemini or OpenAI.")
            raise Exception("No matching AI providers available. Please check your API keys.")

        last_error = None
        
        for idx, provider in enumerate(available):
            try:
                if not provider.client:
                    continue

                if idx > 0:
                    print(f"[AI Vault] Rotating to fallback provider: {provider.name} (Priority {provider.priority})")

                # Merge default params with kwargs (kwargs override defaults)
                params = {
                    "model": model_override or provider.model,
                    "messages": messages,
                    "temperature": 0.7
                }
                params.update(kwargs)

                response = provider.client.chat.completions.create(**params)
                
                provider.increment_quota()
                return {
                    "provider": provider.name,
                    "content": response.choices[0].message.content,
                    "model": provider.model,
                }
            except Exception as e:
                error_msg = str(e)
                last_error = e
                print(f"[AI Vault Alert] {provider.name} failed: {error_msg}")
                
                # Mark provider as unavailable if rate limited or out of credits
                if "rate limit" in error_msg.lower() or "quota" in error_msg.lower() or "429" in error_msg or "402" in error_msg:
                    print(f"[AI Vault] Locked {provider.name} due to Rate Limit / Quota.")
                    provider.status = "rate_limited"
                elif "unauthorized" in error_msg.lower() or "invalid" in error_msg.lower() or "401" in error_msg:
                    print(f"[AI Vault] Disabled {provider.name} due to Invalid API Key.")
                    provider.status = "error"
                
                continue

        raise Exception(f"All providers in the vault failed. Last error: {last_error}")

    async def generate_image(self, prompt: str, model_override: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Generate an image using the first available image provider."""
        from providers.base import ProviderType
        image_providers = provider_registry.get_image_providers()
        if not image_providers:
            raise Exception("No image generation providers available. Please configure DALL-E, Stable Diffusion, or Midjourney.")

        result = await fallback_manager.execute_image_with_fallback(image_providers, prompt, model=model_override, **kwargs)
        if not result.success:
            raise Exception(result.error or "Image generation failed")

        self.model_selector_record_success = getattr(self, 'model_selector_record_success', None)
        if self.model_selector_record_success:
            self.model_selector_record_success(result.provider_name)

        return {
            "provider": result.provider_name,
            "content": result.content,
            "model": kwargs.get("model", "image-model"),
            "attempts": result.attempts,
            "latency_ms": result.total_latency_ms,
        }

    async def transcribe_audio(self, audio_data: bytes, model_override: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Transcribe audio using the first available STT provider."""
        stt_providers = provider_registry.get_stt_providers()
        if not stt_providers:
            raise Exception("No speech-to-text providers available.")

        result = await fallback_manager.execute_stt_with_fallback(stt_providers, audio_data, model=model_override, **kwargs)
        if not result.success:
            raise Exception(result.error or "Transcription failed")

        return {
            "provider": result.provider_name,
            "content": result.content,
            "attempts": result.attempts,
            "latency_ms": result.total_latency_ms,
        }

    async def synthesize_speech(self, text: str, voice: str = "alloy", model_override: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Synthesize speech from text using the first available TTS provider."""
        tts_providers = provider_registry.get_tts_providers()
        if not tts_providers:
            raise Exception("No text-to-speech providers available.")

        result = await fallback_manager.execute_tts_with_fallback(
            tts_providers, text, voice=voice, model=model_override, **kwargs
        )
        if not result.success:
            raise Exception(result.error or "Speech synthesis failed")

        return {
            "provider": result.provider_name,
            "audio_data": result.content,
            "attempts": result.attempts,
            "latency_ms": result.total_latency_ms,
        }

    async def analyze_image(self, image_data: str, prompt: str, model_override: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Analyze an image using vision-capable providers."""
        vision_providers = [p for p in provider_registry.get_all_providers()
                           if p.capabilities.image_analysis and p._is_available()]

        # Also include OpenAI adapters with vision models
        openai_providers = [p for p in provider_registry.get_chat_providers()
                           if hasattr(p, 'capabilities') and p.capabilities.multimodal]
        all_providers = vision_providers + openai_providers

        if not all_providers:
            raise Exception("No vision-capable providers available.")

        async def _analyze(provider, attempt, **op_kwargs):
            if hasattr(provider, 'analyze_image'):
                res = await provider.analyze_image(image_data, prompt, **op_kwargs)
                return {"success": res is not None, "content": res}
            return {"success": False, "error": "Provider doesn't support image analysis"}

        result = await fallback_manager.execute_with_fallback(
            all_providers, _analyze, operation_name="image_analysis", **kwargs
        )

        if not result.success:
            raise Exception(result.error or "Image analysis failed")

        return {
            "provider": result.provider_name,
            "content": result.content,
            "attempts": result.attempts,
            "latency_ms": result.total_latency_ms,
        }

    def get_all_provider_status(self) -> List[Dict[str, Any]]:
        """Get status of all providers including new adapter types."""
        legacy_status = [p.get_info() for p in self.providers]
        new_status = provider_registry.get_provider_status()

        combined = {p["name"]: p for p in legacy_status}
        for p in new_status:
            if p["name"] not in combined:
                combined[p["name"]] = p

        return list(combined.values())

    def get_providers_by_type(self, provider_type: str) -> List[Dict[str, Any]]:
        """Get providers filtered by capability type."""
        type_map = {
            "text": ProviderType.TEXT,
            "embedding": ProviderType.TEXT,
            "image": ProviderType.IMAGE,
            "speech_to_text": ProviderType.SPEECH_TO_TEXT,
            "text_to_speech": ProviderType.TEXT_TO_SPEECH,
            "local": ProviderType.LOCAL,
        }
        ptype = type_map.get(provider_type, ProviderType.TEXT)
        providers = provider_registry.get_providers_by_type(ptype)
        return [p.get_info() for p in providers]

    async def embed(self, text: str, model_override: Optional[str] = None) -> List[float]:
        """
        Generate embeddings for RAG.
        Uses the first available provider that supports embeddings.
        """
        available = self.get_available_providers()
        
        for provider in available:
            try:
                if not provider.client:
                    continue

                # Try common embedding models
                embedding_models = [
                    model_override or "text-embedding-3-small",
                    "text-embedding-3-large",
                    "text-embedding-ada-002",
                    "text-embedding-004", # Gemini Embedding Model
                    "embed-english-v3.0",
                ]
                
                for model in embedding_models:
                    try:
                        response = provider.client.embeddings.create(
                            model=model,
                            input=text
                        )
                        return response.data[0].embedding
                    except Exception:
                        continue
                        
            except Exception as e:
                print(f"Embedding failed for {provider.name}: {e}")
                continue

        raise Exception("All providers failed for embedding")


# Global API Hub instance
api_hub = APIHub()
