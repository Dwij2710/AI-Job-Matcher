"""
Vector Store Service
Manages vector storage and similarity search using Pinecone (or in-memory fallback).
Falls back to in-memory store if Pinecone is unavailable (great for local dev/demos).
"""
import os
import json
import uuid
from typing import List, Dict, Optional, Any
from app.services.embeddings import cosine_similarity

# ─── In-Memory Store (Dev / Demo Fallback) ────────────────────────────────────

class InMemoryVectorStore:
    """
    Simple in-memory vector store for development and testing.
    Mimics the Pinecone API so we can swap easily.
    """
    def __init__(self):
        self.workers: Dict[str, Dict] = {}   # worker_id -> {embedding, metadata}
        self.jobs: Dict[str, Dict] = {}       # job_id -> {embedding, metadata}

    def upsert_worker(self, worker_id: str, embedding: List[float], metadata: Dict):
        self.workers[worker_id] = {"embedding": embedding, "metadata": metadata}

    def upsert_job(self, job_id: str, embedding: List[float], metadata: Dict):
        self.jobs[job_id] = {"embedding": embedding, "metadata": metadata}

    def search_jobs_for_worker(self, worker_embedding: List[float], top_k: int = 10) -> List[Dict]:
        """Find top-k most similar jobs for a worker embedding."""
        if not self.jobs:
            return []
        
        scores = []
        for job_id, job_data in self.jobs.items():
            score = cosine_similarity(worker_embedding, job_data["embedding"])
            scores.append({
                "id": job_id,
                "score": score,
                "metadata": job_data["metadata"],
            })
        
        # Sort by score descending
        scores.sort(key=lambda x: x["score"], reverse=True)
        return scores[:top_k]

    def get_worker(self, worker_id: str) -> Optional[Dict]:
        return self.workers.get(worker_id)

    def get_job(self, job_id: str) -> Optional[Dict]:
        return self.jobs.get(job_id)

    def list_jobs(self) -> List[Dict]:
        return [{"id": k, **v["metadata"]} for k, v in self.jobs.items()]

    def list_workers(self) -> List[Dict]:
        return [{"id": k, **v["metadata"]} for k, v in self.workers.items()]

    def delete_worker(self, worker_id: str):
        self.workers.pop(worker_id, None)

    def delete_job(self, job_id: str):
        self.jobs.pop(job_id, None)


# ─── Pinecone Store ───────────────────────────────────────────────────────────

class PineconeVectorStore:
    """
    Pinecone-backed vector store.
    Requires PINECONE_API_KEY environment variable.
    """
    def __init__(self, api_key: str, index_name: str = "job-matcher"):
        from pinecone import Pinecone, ServerlessSpec
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        
        # Create index if not exists
        if index_name not in [i.name for i in self.pc.list_indexes()]:
            self.pc.create_index(
                name=index_name,
                dimension=384,  # all-MiniLM-L6-v2 output dim
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        
        self.index = self.pc.Index(index_name)

    def upsert_worker(self, worker_id: str, embedding: List[float], metadata: Dict):
        self.index.upsert(vectors=[{
            "id": f"worker_{worker_id}",
            "values": embedding,
            "metadata": {**metadata, "type": "worker"}
        }], namespace="workers")

    def upsert_job(self, job_id: str, embedding: List[float], metadata: Dict):
        self.index.upsert(vectors=[{
            "id": f"job_{job_id}",
            "values": embedding,
            "metadata": {**metadata, "type": "job"}
        }], namespace="jobs")

    def search_jobs_for_worker(self, worker_embedding: List[float], top_k: int = 10) -> List[Dict]:
        results = self.index.query(
            vector=worker_embedding,
            top_k=top_k,
            include_metadata=True,
            namespace="jobs"
        )
        return [
            {
                "id": m.id.replace("job_", ""),
                "score": m.score,
                "metadata": m.metadata,
            }
            for m in results.matches
        ]

    def get_worker(self, worker_id: str) -> Optional[Dict]:
        result = self.index.fetch(ids=[f"worker_{worker_id}"], namespace="workers")
        vectors = result.get("vectors", {})
        v = vectors.get(f"worker_{worker_id}")
        if v:
            return {"embedding": v["values"], "metadata": v.get("metadata", {})}
        return None

    def get_job(self, job_id: str) -> Optional[Dict]:
        result = self.index.fetch(ids=[f"job_{job_id}"], namespace="jobs")
        vectors = result.get("vectors", {})
        v = vectors.get(f"job_{job_id}")
        if v:
            return {"embedding": v["values"], "metadata": v.get("metadata", {})}
        return None

    def list_jobs(self) -> List[Dict]:
        # Pinecone doesn't support full scans; use metadata store instead
        return []

    def list_workers(self) -> List[Dict]:
        return []


# ─── Store Singleton ──────────────────────────────────────────────────────────

_store: Optional[Any] = None


async def init_vector_store():
    """Initialize the appropriate vector store."""
    global _store
    
    use_mock = os.getenv("USE_MOCK_PINECONE", "true").lower() == "true"
    api_key = os.getenv("PINECONE_API_KEY")
    
    if not use_mock and api_key:
        try:
            index_name = os.getenv("PINECONE_INDEX", "job-matcher")
            _store = PineconeVectorStore(api_key=api_key, index_name=index_name)
            print("✅ Connected to Pinecone vector store")
        except Exception as e:
            print(f"⚠️  Pinecone connection failed: {e}. Using in-memory store.")
            _store = InMemoryVectorStore()
    else:
        _store = InMemoryVectorStore()
        print("ℹ️  Using in-memory vector store (set PINECONE_API_KEY for production)")


def get_store() -> Any:
    global _store
    if _store is None:
        _store = InMemoryVectorStore()
    return _store
