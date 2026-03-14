"""
Matching API Router
Returns top job matches for a given worker
"""
import json
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import MatchResponse
from app.services.embeddings import generate_embedding, skills_to_text
from app.services.vector_store import get_store
from app.services.matcher import build_job_matches

router = APIRouter()


@router.get("/{worker_id}", response_model=MatchResponse)
async def get_job_matches(
    worker_id: str,
    top_k: int = Query(default=10, ge=1, le=20, description="Number of matches to return"),
):
    """
    Get top job matches for a worker using semantic similarity search.
    Returns ranked results with explainable scores.
    """
    store = get_store()

    # Fetch worker profile
    worker = store.get_worker(worker_id)
    if not worker:
        raise HTTPException(
            status_code=404,
            detail=f"Worker '{worker_id}' not found. Please create a profile first."
        )

    meta = worker.get("metadata", {})
    skills_raw = meta.get("skills", "[]")
    worker_skills = json.loads(skills_raw) if isinstance(skills_raw, str) else skills_raw
    worker_years = meta.get("experience_years", 0)
    worker_name = meta.get("name", "Unknown")
    preferred_role = meta.get("preferred_role", "")

    if not worker_skills:
        raise HTTPException(
            status_code=400,
            detail="Worker has no skills on record. Please update the profile."
        )

    # Get worker embedding (use stored or regenerate)
    worker_embedding = worker.get("embedding")
    if not worker_embedding:
        text_repr = skills_to_text(worker_skills, preferred_role, worker_years)
        worker_embedding = generate_embedding(text_repr)

    # Vector similarity search
    search_results = store.search_jobs_for_worker(worker_embedding, top_k=top_k * 2)

    if not search_results:
        return MatchResponse(
            worker_id=worker_id,
            worker_name=worker_name,
            worker_skills=worker_skills,
            top_matches=[],
            total_jobs_searched=0,
            message="No jobs in database. Please add job listings first.",
        )

    # Build matches with composite scoring + explanations
    matches = build_job_matches(worker_skills, worker_years, search_results)
    top_matches = matches[:top_k]

    return MatchResponse(
        worker_id=worker_id,
        worker_name=worker_name,
        worker_skills=worker_skills,
        top_matches=top_matches,
        total_jobs_searched=len(search_results),
        message=f"Found {len(top_matches)} matches for {worker_name}",
    )


@router.post("/demo")
async def demo_match():
    """
    Demo endpoint: creates a sample worker + seeds jobs, then returns matches.
    Great for testing without manual setup.
    """
    from app.routers.workers import create_worker_profile
    from app.routers.jobs import seed_jobs
    from app.models.schemas import WorkerProfile

    # Seed jobs first
    await seed_jobs()

    # Create demo worker
    profile = WorkerProfile(
        name="Demo Developer",
        resume_text="Python developer with 4 years experience in Django, FastAPI, PostgreSQL, Docker, REST APIs, and Machine Learning.",
        experience_years=4,
        preferred_role="Backend Engineer",
    )
    worker_resp = await create_worker_profile(profile)
    worker_id = worker_resp.worker_id

    # Get matches
    return await get_job_matches(worker_id, top_k=5)
