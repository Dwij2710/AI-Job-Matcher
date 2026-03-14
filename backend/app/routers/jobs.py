"""
Jobs API Router
Handles job listing uploads and retrieval
"""
import uuid
import json
from fastapi import APIRouter, HTTPException
from app.models.schemas import JobListing, JobResponse
from app.services.skill_extractor import extract_skills_from_text, merge_skills
from app.services.embeddings import generate_embedding, skills_to_text
from app.services.vector_store import get_store
from app.services.matcher import detect_bias_in_job_description

router = APIRouter()


@router.post("", response_model=JobResponse)
async def create_job(job: JobListing):
    """
    Add a new job listing. Skills are extracted from description if not provided.
    The job's skill embedding is stored in the vector database.
    """
    store = get_store()

    # Generate job ID if not provided
    job_id = job.job_id or str(uuid.uuid4())[:8]

    # Extract skills from job description
    extracted_skills = await extract_skills_from_text(job.description)
    final_skills = merge_skills(extracted_skills, job.required_skills)

    # Generate embedding
    text_repr = skills_to_text(final_skills, job.title, 0) + f" {job.description[:200]}"
    embedding = generate_embedding(text_repr)

    # Bias check
    bias_warnings = detect_bias_in_job_description(job.description)

    # Store in vector DB
    metadata = {
        "title": job.title,
        "description": job.description[:500],
        "required_skills": json.dumps(final_skills),
        "experience_level": job.experience_level.value,
        "location": job.location or "",
        "company": job.company or "",
    }
    store.upsert_job(job_id, embedding, metadata)

    response = JobResponse(
        job_id=job_id,
        title=job.title,
        required_skills=final_skills,
        experience_level=job.experience_level.value,
        location=job.location,
        company=job.company,
        message=f"✅ Job listing added. {len(final_skills)} skills extracted.",
    )

    # Attach bias warnings if any
    result = response.model_dump()
    if bias_warnings:
        result["bias_warnings"] = bias_warnings
    return result


@router.get("")
async def list_jobs():
    """List all job listings."""
    store = get_store()
    jobs = store.list_jobs()
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get a specific job listing."""
    store = get_store()
    job = store.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    
    meta = job.get("metadata", {})
    skills_raw = meta.get("required_skills", "[]")
    skills = json.loads(skills_raw) if isinstance(skills_raw, str) else skills_raw
    
    return {
        "job_id": job_id,
        "title": meta.get("title"),
        "required_skills": skills,
        "experience_level": meta.get("experience_level"),
        "location": meta.get("location"),
        "company": meta.get("company"),
        "description": meta.get("description"),
    }


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    """Delete a job listing."""
    store = get_store()
    store.delete_job(job_id)
    return {"message": f"Job '{job_id}' deleted"}


@router.post("/seed")
async def seed_jobs():
    """Seed the database with sample job listings for testing."""
    from app.utils.seed_data import SAMPLE_JOBS
    store = get_store()
    count = 0
    for job_data in SAMPLE_JOBS[:10]:  # Seed 10 jobs
        job = JobListing(**job_data)
        job_id = str(uuid.uuid4())[:8]
        extracted = await extract_skills_from_text(job.description)
        final_skills = merge_skills(extracted, job.required_skills)
        text_repr = skills_to_text(final_skills, job.title, 0)
        embedding = generate_embedding(text_repr)
        metadata = {
            "title": job.title,
            "description": job.description[:500],
            "required_skills": json.dumps(final_skills),
            "experience_level": job.experience_level.value,
            "location": job.location or "",
            "company": job.company or "",
        }
        store.upsert_job(job_id, embedding, metadata)
        count += 1
    
    return {"message": f"✅ Seeded {count} sample jobs"}
