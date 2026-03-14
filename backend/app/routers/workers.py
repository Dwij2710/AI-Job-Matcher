"""
Workers API Router
Handles worker profile uploads and retrieval
"""
import uuid
import json
from fastapi import APIRouter, HTTPException
from app.models.schemas import WorkerProfile, WorkerResponse
from app.services.skill_extractor import extract_skills_from_text, merge_skills
from app.services.embeddings import generate_embedding, skills_to_text
from app.services.vector_store import get_store

router = APIRouter()


@router.post("", response_model=WorkerResponse)
async def create_worker_profile(profile: WorkerProfile):
    """
    Upload a worker profile. Skills are extracted from resume text if not provided.
    The worker's skill embedding is stored in the vector database.
    """
    store = get_store()

    # Generate worker ID if not provided
    worker_id = profile.worker_id or str(uuid.uuid4())[:8]

    # Extract skills from resume text
    extracted_skills = []
    if profile.resume_text:
        extracted_skills = await extract_skills_from_text(profile.resume_text)

    # Merge extracted + manually provided skills
    final_skills = merge_skills(extracted_skills, profile.skills)

    if not final_skills:
        raise HTTPException(
            status_code=400,
            detail="No skills could be extracted. Provide skills manually or include a detailed resume."
        )

    # Generate embedding
    text_repr = skills_to_text(final_skills, profile.preferred_role or "", profile.experience_years)
    embedding = generate_embedding(text_repr)

    # Store in vector DB
    metadata = {
        "name": profile.name,
        "skills": json.dumps(final_skills),
        "experience_years": profile.experience_years,
        "preferred_role": profile.preferred_role or "",
        "location": profile.location or "",
    }
    store.upsert_worker(worker_id, embedding, metadata)

    return WorkerResponse(
        worker_id=worker_id,
        name=profile.name,
        skills=final_skills,
        experience_years=profile.experience_years,
        preferred_role=profile.preferred_role,
        location=profile.location,
        message=f"✅ Worker profile created. {len(final_skills)} skills extracted.",
    )


@router.get("")
async def list_workers():
    """List all worker profiles."""
    store = get_store()
    workers = store.list_workers()
    return {"workers": workers, "count": len(workers)}


@router.get("/{worker_id}")
async def get_worker(worker_id: str):
    """Get a specific worker profile."""
    store = get_store()
    worker = store.get_worker(worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker '{worker_id}' not found")
    
    meta = worker.get("metadata", {})
    skills_raw = meta.get("skills", "[]")
    skills = json.loads(skills_raw) if isinstance(skills_raw, str) else skills_raw
    
    return {
        "worker_id": worker_id,
        "name": meta.get("name"),
        "skills": skills,
        "experience_years": meta.get("experience_years", 0),
        "preferred_role": meta.get("preferred_role"),
        "location": meta.get("location"),
    }


@router.delete("/{worker_id}")
async def delete_worker(worker_id: str):
    """Delete a worker profile."""
    store = get_store()
    store.delete_worker(worker_id)
    return {"message": f"Worker '{worker_id}' deleted"}
