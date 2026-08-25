import logging
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingPipeline:
    _model = None

    @classmethod
    def get_model(cls, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        if cls._model is None:
            logger.info("Loading embedding model: %s", model_name)
            cls._model = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully")
        return cls._model

    @classmethod
    def encode(cls, text: str, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        model = cls.get_model(model_name)
        return model.encode(text).tolist()
