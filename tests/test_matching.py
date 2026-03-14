"""
Unit Tests for AI Job Matching Agent
Run with: pytest tests/test_matching.py -v
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.skill_extractor import extract_skills_from_text, merge_skills
from app.services.embeddings import generate_embedding, cosine_similarity, skills_to_text
from app.services.matcher import compute_match_score, years_to_level, detect_bias_in_job_description


# ─── Skill Extraction Tests ───────────────────────────────────────────────────

class TestSkillExtraction:
    @pytest.mark.asyncio
    async def test_basic_skills(self):
        text = "Python developer with experience in Django, FastAPI, and Machine Learning"
        skills = await extract_skills_from_text(text)
        assert "Python" in skills
        assert "Django" in skills
        assert "FastAPI" in skills
        assert "Machine Learning" in skills

    @pytest.mark.asyncio
    async def test_cloud_skills(self):
        text = "AWS certified engineer with Docker, Kubernetes, and Terraform experience"
        skills = await extract_skills_from_text(text)
        assert "AWS" in skills
        assert "Docker" in skills
        assert "Kubernetes" in skills

    @pytest.mark.asyncio
    async def test_empty_text(self):
        skills = await extract_skills_from_text("")
        assert skills == []

    @pytest.mark.asyncio
    async def test_merge_skills(self):
        extracted = ["Python", "Django"]
        manual = ["React", "python"]  # duplicate 'python' different case
        merged = merge_skills(extracted, manual)
        assert len(merged) == len(set(s.lower() for s in merged))  # no duplicates

    @pytest.mark.asyncio
    async def test_multiple_skills(self):
        text = "Full stack dev: React, TypeScript, Node.js, PostgreSQL, Redis, AWS, Docker"
        skills = await extract_skills_from_text(text)
        assert len(skills) >= 5


# ─── Embedding Tests ──────────────────────────────────────────────────────────

class TestEmbeddings:
    def test_embedding_shape(self):
        embedding = generate_embedding("Python developer with FastAPI experience")
        assert len(embedding) == 384

    def test_embedding_normalized(self):
        import math
        embedding = generate_embedding("test text")
        magnitude = math.sqrt(sum(x**2 for x in embedding))
        assert abs(magnitude - 1.0) < 0.01  # Should be unit vector

    def test_cosine_similarity_identical(self):
        vec = generate_embedding("Python Django FastAPI")
        sim = cosine_similarity(vec, vec)
        assert abs(sim - 1.0) < 0.001

    def test_cosine_similarity_different(self):
        vec_a = generate_embedding("Python machine learning TensorFlow")
        vec_b = generate_embedding("JavaScript React frontend CSS")
        sim = cosine_similarity(vec_a, vec_b)
        # Different domains should have lower similarity
        assert sim < 0.99

    def test_skills_to_text(self):
        text = skills_to_text(["Python", "Django"], "Backend Developer", 4)
        assert "Python" in text
        assert "Django" in text
        assert "Backend Developer" in text


# ─── Matching Algorithm Tests ─────────────────────────────────────────────────

class TestMatchingAlgorithm:
    def test_perfect_skill_match(self):
        score, explanation = compute_match_score(
            semantic_similarity=0.9,
            worker_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            job_skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
            worker_years=4,
            job_level="mid",
        )
        assert score > 80
        assert len(explanation.missing_skills) == 0
        assert len(explanation.matched_skills) == 4

    def test_no_skill_match(self):
        score, explanation = compute_match_score(
            semantic_similarity=0.1,
            worker_skills=["JavaScript", "React", "CSS"],
            job_skills=["Rust", "C++", "Embedded Systems"],
            worker_years=3,
            job_level="senior",
        )
        assert score < 50

    def test_experience_alignment(self):
        score_perfect, _ = compute_match_score(0.8, ["Python"], ["Python"], 5, "mid")
        score_mismatch, _ = compute_match_score(0.8, ["Python"], ["Python"], 0, "senior")
        assert score_perfect > score_mismatch

    def test_years_to_level(self):
        assert years_to_level(0) == "entry"
        assert years_to_level(1) == "junior"
        assert years_to_level(4) == "mid"
        assert years_to_level(7) == "senior"
        assert years_to_level(12) == "lead"

    def test_score_bounds(self):
        score, _ = compute_match_score(1.0, ["Python"] * 20, ["Python"] * 20, 5, "mid")
        assert 0 <= score <= 100


# ─── Bias Detection Tests ─────────────────────────────────────────────────────

class TestBiasDetection:
    def test_no_bias(self):
        clean_jd = "We're looking for a skilled Python developer with experience in FastAPI and PostgreSQL."
        warnings = detect_bias_in_job_description(clean_jd)
        assert len(warnings) == 0

    def test_age_bias(self):
        biased_jd = "Looking for a young developer who is a native digital expert"
        warnings = detect_bias_in_job_description(biased_jd)
        assert any("age" in w.lower() for w in warnings)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
