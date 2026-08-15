"""
SAM AI - Centralized API Hub
All AI requests flow through this hub.
Supports multiple providers with failover and load balancing.
"""

import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

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
        # InferX / DeepSeek
        inferx_key = os.getenv("INFERX_API_KEY")
        if inferx_key and inferx_key != "your_inferx_api_key_here":
            self.providers.append(APIProvider(
                name="InferX",
                api_key=inferx_key,
                base_url="https://model.inferx.net/endpoints/v1",
                model="deepseek-v4-flash-0731",
                priority=1,
                quota_limit=1000
            ))

        # Gemini (via OpenAI-compatible endpoint)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and gemini_key != "your_gemini_api_key_here":
            self.providers.append(APIProvider(
                name="Gemini",
                api_key=gemini_key,
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

        # Groq (Ultra-Fast LPUs)
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key != "your_groq_api_key_here":
            self.providers.append(APIProvider(
                name="Groq",
                api_key=groq_key,
                base_url="https://api.groq.com/openai/v1",
                model="llama-3.3-70b-versatile",
                priority=0,
                quota_limit=1000
            ))

        # HuggingFace Inference Provider
        hf_key = os.getenv("HUGGINGFACE_API_KEY")
        if hf_key and hf_key.startswith("hf_"):
            self.providers.append(APIProvider(
                name="HuggingFace",
                api_key=hf_key,
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
        
        if not available:
            raise Exception("No matching AI providers available. Please check your API keys.")

        last_error = None
        
        for idx, provider in enumerate(available):
            try:
                if not provider.client:
                    continue

                if idx > 0:
                    print(f"🔄 Rotating to fallback provider: {provider.name} (Priority {provider.priority})")

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
                print(f"⚠️ Provider Vault Alert | {provider.name} failed: {error_msg}")
                
                # Mark provider as unavailable if rate limited or out of credits
                if "rate limit" in error_msg.lower() or "quota" in error_msg.lower() or "429" in error_msg or "402" in error_msg:
                    print(f"🔒 Vault locked {provider.name} due to Rate Limit / Quota.")
                    provider.status = "rate_limited"
                elif "unauthorized" in error_msg.lower() or "invalid" in error_msg.lower() or "401" in error_msg:
                    print(f"❌ Vault disabled {provider.name} due to Invalid API Key.")
                    provider.status = "error"
                
                continue

        raise Exception(f"All providers in the vault failed. Last error: {last_error}")

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
