"""
AI Job Matching Agent - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import workers, jobs, matching
from app.services.vector_store import init_vector_store

app = FastAPI(
    title="AI Job Matching Agent",
    description="Semantic similarity-based job matching using Sentence Transformers + Pinecone",
    version="1.0.0",
)

# CORS for Vercel and local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all since Vercel preview URLs change
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under /api prefix for Vercel compatibility
app.include_router(workers.router, prefix="/api/worker-profile", tags=["Workers"])
app.include_router(jobs.router, prefix="/api/job", tags=["Jobs"])
app.include_router(matching.router, prefix="/api/match", tags=["Matching"])


@app.on_event("startup")
async def startup_event():
    """Initialize vector store on startup."""
    await init_vector_store()
    print("✅ AI Job Matcher ready!")


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "AI Job Matching Agent",
        "status": "running",
        "docs": "/docs",
        "endpoints": ["/worker-profile", "/job", "/match/{worker_id}"],
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
