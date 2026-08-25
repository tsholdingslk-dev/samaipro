from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import logging
import time

from vector_store.qdrant_client import VectorStoreManager
from config import settings

logger = logging.getLogger(__name__)

app = FastAPI(title="LankaLore Knowledge Engine API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vdb = VectorStoreManager(
    host=settings.qdrant_host,
    port=settings.qdrant_port,
    api_key=settings.qdrant_api_key,
    collection_name=settings.qdrant_collection_name,
)


class HealthResponse(BaseModel):
    status: str
    qdrant_connected: bool
    timestamp: float


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    category_filter: str = None
    limit: int = Field(4, ge=1, le=20)


class QueryResponse(BaseModel):
    query: str
    retrieved_contexts: list[dict]


@app.get("/health", response_model=HealthResponse)
async def health_check():
    qdrant_connected = False
    try:
        vdb.get_collection_info()
        qdrant_connected = True
    except Exception:
        logger.exception("Qdrant health check failed")

    return HealthResponse(
        status="healthy" if qdrant_connected else "degraded",
        qdrant_connected=qdrant_connected,
        timestamp=time.time(),
    )


@app.post("/api/v1/retrieve", response_model=QueryResponse)
async def retrieve_context(req: QueryRequest):
    try:
        results = vdb.search_relevant_context(
            req.query, limit=req.limit, category_filter=req.category_filter
        )
        return QueryResponse(query=req.query, retrieved_contexts=results)
    except Exception as e:
        logger.exception("Retrieval failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/collections/{collection_name}/info")
async def collection_info(collection_name: str):
    try:
        info = vdb.client.get_collection(collection_name)
        return {"collection_name": collection_name, "points_count": info.points_count}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
