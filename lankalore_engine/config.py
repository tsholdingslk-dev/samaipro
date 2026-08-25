from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_api_key: Optional[str] = None
    qdrant_collection_name: str = "lankalore_knowledge"
    embedding_model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"
    chunk_size: int = 750
    chunk_overlap: int = 100
    max_concurrent_scrapes: int = 5
    scrape_timeout_ms: int = 30000
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
