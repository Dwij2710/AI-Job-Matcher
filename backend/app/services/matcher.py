"""
Job Matching Algorithm with Explainable AI
Core matching logic: semantic similarity + skill overlap + experience alignment
"""
from typing import List, Dict, Tuple
from app.models.schemas import JobMatch, SkillExplanation


# Experience level mapping (years → numeric level)
EXP_LEVEL_MAP = {
    "entry": 0,
    "junior": 1,
    "mid": 2,
    "senior": 3,
    "lead": 4,
}

YEARS_TO_LEVEL = [
    (0, 1, "entry"),
    (1, 3, "junior"),
    (3, 6, "mid"),
    (6, 10, "senior"),
    (10, 999, "lead"),
]


def years_to_level(years: int) -> str:
    for low, high, label in YEARS_TO_LEVEL:
        if low <= years < high:
            return label
    return "senior"


def compute_match_score(
    semantic_similarity: float,
    worker_skills: List[str],
    job_skills: List[str],
    worker_years: int,
    job_level: str,
) -> Tuple[float, SkillExplanation]:
    """
    Compute a composite match score combining:
    - Semantic similarity (50% weight)
    - Skill overlap score (35% weight)
    - Experience alignment (15% weight)
    
    Returns: (score_0_to_100, explanation)
    """
    # Normalize skills for comparison
    worker_skills_lower = {s.lower() for s in worker_skills}
    job_skills_lower = {s.lower() for s in job_skills}

    # ── Skill Overlap Score ────────────────────────────────────────────────────
    if not job_skills_lower:
        skill_score = 0.5  # No required skills = neutral
        matched = []
        missing = []
    else:
        matched_lower = worker_skills_lower & job_skills_lower
        missing_lower = job_skills_lower - worker_skills_lower
        
        # Partial credit: skills that are substrings of each other
        for ws in worker_skills_lower:
            for js in list(missing_lower):
                if ws in js or js in ws:
                    matched_lower.add(js)
                    missing_lower.discard(js)

        skill_score = len(matched_lower) / len(job_skills_lower) if job_skills_lower else 0.5

        # Map back to original casing
        matched = [s for s in job_skills if s.lower() in matched_lower]
        missing = [s for s in job_skills if s.lower() in missing_lower]

    # ── Experience Alignment Score ─────────────────────────────────────────────
    worker_level_num = EXP_LEVEL_MAP.get(years_to_level(worker_years), 2)
    job_level_num = EXP_LEVEL_MAP.get(job_level.lower(), 2)
    level_diff = abs(worker_level_num - job_level_num)
    
    if level_diff == 0:
        exp_score = 1.0
        exp_text = "Perfect experience match"
    elif level_diff == 1:
        exp_score = 0.75
        exp_text = "Close experience level"
    elif level_diff == 2:
        exp_score = 0.4
        exp_text = "Moderate experience gap"
    else:
        exp_score = 0.1
        exp_text = "Significant experience mismatch"

    if worker_level_num > job_level_num:
        exp_text += f" (overqualified by {level_diff} level{'s' if level_diff > 1 else ''})"
    elif worker_level_num < job_level_num:
        exp_text += f" (underqualified by {level_diff} level{'s' if level_diff > 1 else ''})"

    # ── Composite Score ────────────────────────────────────────────────────────
    # Weights: semantic (50%) + skill (35%) + experience (15%)
    composite = (
        0.50 * max(0, semantic_similarity) +
        0.35 * skill_score +
        0.15 * exp_score
    )
    final_score = round(min(100, max(0, composite * 100)), 1)

    # ── Recommendation ────────────────────────────────────────────────────────
    if final_score >= 80:
        recommendation = "Excellent match! Highly recommended to apply."
    elif final_score >= 65:
        recommendation = "Good match. Worth applying with confidence."
    elif final_score >= 50:
        recommendation = "Moderate match. Consider upskilling in missing areas."
    elif final_score >= 35:
        recommendation = "Partial match. Significant skill gaps to address."
    else:
        recommendation = "Low match. Focus on building required skills first."

    explanation = SkillExplanation(
        matched_skills=matched,
        missing_skills=missing,
        experience_alignment=exp_text,
        recommendation=recommendation,
    )

    return final_score, explanation


def build_job_matches(
    worker_skills: List[str],
    worker_years: int,
    search_results: List[Dict],
) -> List[JobMatch]:
    """
    Build JobMatch objects from vector search results.
    Applies composite scoring and generates explanations.
    """
    matches = []
    for result in search_results:
        meta = result.get("metadata", {})
        semantic_sim = result.get("score", 0.0)
        
        # Parse metadata
        job_skills_raw = meta.get("required_skills", "[]")
        if isinstance(job_skills_raw, str):
            import json
            try:
                job_skills = json.loads(job_skills_raw)
            except Exception:
                job_skills = []
        else:
            job_skills = job_skills_raw or []

        job_level = meta.get("experience_level", "mid")
        
        # Compute composite score
        score, explanation = compute_match_score(
            semantic_similarity=semantic_sim,
            worker_skills=worker_skills,
            job_skills=job_skills,
            worker_years=worker_years,
            job_level=job_level,
        )

        matches.append(JobMatch(
            job_id=result["id"],
            title=meta.get("title", "Unknown Role"),
            company=meta.get("company"),
            location=meta.get("location"),
            match_score=score,
            experience_level=job_level,
            required_skills=job_skills,
            explanation=explanation,
        ))

    # Re-sort by composite score (vector DB already sorts by semantic, but we rescore)
    matches.sort(key=lambda m: m.match_score, reverse=True)
    return matches


def detect_bias_in_job_description(text: str) -> List[str]:
    """
    Simple bias detection in job descriptions.
    Flags potentially biased language patterns.
    """
    import re
    bias_patterns = {
        "age_bias": [r'\bnative\s+digital\b', r'\byoung\b', r'\brecent\s+graduate\b.*only'],
        "gender_bias": [r'\bhe\s+will\b', r'\bshe\s+will\b', r'\bman\b.*role', r'\bninja\b', r'\brock\s*star\b'],
        "culture_fit_vague": [r'\bculture\s+fit\b', r'\bgood\s+vibe\b'],
    }
    
    warnings = []
    text_lower = text.lower()
    
    for bias_type, patterns in bias_patterns.items():
        for p in patterns:
            if re.search(p, text_lower):
                warnings.append(f"Potential {bias_type.replace('_', ' ')} detected")
                break
    
    return warnings
