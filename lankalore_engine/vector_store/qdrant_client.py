import uuid
import logging
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from typing import List, Dict, Optional

from vector_store.embedder import EmbeddingPipeline

logger = logging.getLogger(__name__)


class VectorStoreManager:
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6333,
        api_key: Optional[str] = None,
        collection_name: str = "lankalore_knowledge",
        vector_size: int = 384,
    ):
        self.client = QdrantClient(host=host, port=port, api_key=api_key)
        self.collection_name = collection_name
        self.vector_size = vector_size
        self._init_collection()

    def _init_collection(self):
        collections = [col.name for col in self.client.get_collections().collections]
        if self.collection_name not in collections:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
            )
            logger.info("Created collection: %s", self.collection_name)

    def upsert_scraped_data(self, scraped_data: Dict):
        if not scraped_data or not scraped_data.get("chunks"):
            return 0

        points = []
        for chunk in scraped_data["chunks"]:
            vector = EmbeddingPipeline.encode(chunk)
            point_id = str(uuid.uuid4())
            payload = {
                "url": scraped_data["url"],
                "title": scraped_data["title"],
                "category": scraped_data["category"],
                "content": chunk,
            }
            points.append(PointStruct(id=point_id, vector=vector, payload=payload))

        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info("Inserted %d chunks for %s", len(points), scraped_data["url"])
        return len(points)

    def search_relevant_context(self, query: str, limit: int = 4, category_filter: Optional[str] = None) -> List[Dict]:
        query_vector = EmbeddingPipeline.encode(query)
        query_filter = None
        if category_filter:
            query_filter = Filter(
                must=[FieldCondition(key="category", match=MatchValue(value=category_filter))]
            )

        search_result = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            limit=limit,
            query_filter=query_filter,
        )
        return [hit.payload for hit in search_result]

    def delete_by_url(self, url: str):
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(must=[FieldCondition(key="url", match=MatchValue(value=url))]),
        )
        logger.info("Deleted entries for URL: %s", url)

    def get_collection_info(self):
        return self.client.get_collection(self.collection_name)
