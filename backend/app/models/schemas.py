"""
Pydantic Models for AI Job Matching Agent
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class ExperienceLevel(str, Enum):
    entry = "entry"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"


# ─── Worker Models ────────────────────────────────────────────────────────────

class WorkerProfile(BaseModel):
    worker_id: Optional[str] = None
    name: str
    resume_text: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: int = Field(default=0, ge=0, le=50)
    preferred_role: Optional[str] = None
    location: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Priya Sharma",
                "resume_text": "Python developer with 4 years experience in Django, FastAPI, Machine Learning, and REST APIs.",
                "experience_years": 4,
                "preferred_role": "Backend Developer",
                "location": "Mumbai, India"
            }
        }
    }


class WorkerResponse(BaseModel):
    worker_id: str
    name: str
    skills: List[str]
    experience_years: int
    preferred_role: Optional[str]
    location: Optional[str]
    message: str


# ─── Job Models ───────────────────────────────────────────────────────────────

class JobListing(BaseModel):
    job_id: Optional[str] = None
    title: str
    description: str
    required_skills: Optional[List[str]] = None
    experience_level: ExperienceLevel = ExperienceLevel.mid
    location: Optional[str] = None
    company: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "title": "Senior Backend Engineer",
                "description": "We need a Python expert with FastAPI, PostgreSQL, Docker, and AWS experience.",
                "experience_level": "senior",
                "location": "Bangalore, India",
                "company": "TechCorp"
            }
        }
    }


class JobResponse(BaseModel):
    job_id: str
    title: str
    required_skills: List[str]
    experience_level: str
    location: Optional[str]
    company: Optional[str]
    message: str


# ─── Match Models ─────────────────────────────────────────────────────────────

class SkillExplanation(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    experience_alignment: str
    recommendation: str


class JobMatch(BaseModel):
    job_id: str
    title: str
    company: Optional[str]
    location: Optional[str]
    match_score: float = Field(..., ge=0, le=100)
    experience_level: str
    required_skills: List[str]
    explanation: SkillExplanation


class MatchResponse(BaseModel):
    worker_id: str
    worker_name: str
    worker_skills: List[str]
    top_matches: List[JobMatch]
    total_jobs_searched: int
    message: str
