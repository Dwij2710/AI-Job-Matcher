"""
Skill Extraction Service
Extracts skills from resume text using spaCy NER + regex + known skill dictionary
"""
import re
import json
import os
from typing import List, Optional

# Try to import groq, might fail if not installed or during testing
try:
    from groq import AsyncGroq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

# ─── Known Skills Dictionary ──────────────────────────────────────────────────
KNOWN_SKILLS = {
    # Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "julia",
    "dart", "elixir", "haskell", "clojure", "f#", "perl", "bash", "shell",

    # Web Frameworks
    "django", "flask", "fastapi", "express", "react", "angular", "vue", "svelte",
    "nextjs", "nuxtjs", "nestjs", "spring", "laravel", "rails", "asp.net",
    "gatsby", "remix", "sveltekit",

    # Data / ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
    "pandas", "numpy", "matplotlib", "seaborn", "hugging face", "transformers",
    "langchain", "openai", "llm", "bert", "gpt", "xgboost", "lightgbm",
    "spark", "hadoop", "kafka", "airflow", "mlflow", "dvc",

    # Databases
    "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "oracle", "sql server", "firestore", "neo4j",
    "pinecone", "qdrant", "chroma", "weaviate",

    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "ci/cd", "github actions", "gitlab ci",
    "nginx", "apache", "linux", "unix", "git", "github", "bitbucket",

    # APIs / Protocols
    "rest api", "graphql", "grpc", "websocket", "oauth", "jwt", "openapi",
    "swagger", "soap", "microservices", "message queue", "rabbitmq",

    # Tools
    "jira", "confluence", "notion", "figma", "postman", "vim", "vs code",
    "intellij", "pycharm", "tableau", "power bi", "looker", "dbt",

    # Soft skills (normalized)
    "agile", "scrum", "kanban", "tdd", "bdd", "pair programming", "code review",
}

# Regex patterns for common skill mentions
SKILL_PATTERNS = [
    r'\b(python|javascript|typescript|java|golang|rust|ruby|php|swift|kotlin)\b',
    r'\b(react|angular|vue|svelte|nextjs|nuxtjs)\b',
    r'\b(django|flask|fastapi|express|nestjs|spring)\b',
    r'\b(postgresql|mysql|mongodb|redis|elasticsearch)\b',
    r'\b(aws|azure|gcp|docker|kubernetes|terraform)\b',
    r'\b(machine learning|deep learning|nlp|computer vision)\b',
    r'\b(tensorflow|pytorch|scikit-learn|pandas|numpy)\b',
    r'\b(ci/cd|devops|agile|scrum|microservices)\b',
    r'\b(graphql|rest api|grpc|oauth|jwt)\b',
    r'\b(sql|nosql|orm)\b',
]


async def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skills from resume or job description text.
    
    Tries to use Groq LLM API first if GROQ_API_KEY is available.
    Falls back to regex + dictionary extraction if LLM fails or is unavailable.
    """
    if not text:
        return []

    # Attempt Groq LLM Extraction
    api_key = os.getenv("GROQ_API_KEY")
    if HAS_GROQ and api_key and "optional" not in api_key.lower():
        try:
            client = AsyncGroq(api_key=api_key)
            prompt = (
                "You are an expert technical recruiter and AI assistant. "
                "Extract a list of professional skills, programming languages, "
                "frameworks, tools, and soft skills from the following text. "
                "Return ONLY a valid JSON array of strings representing the skills. "
                "Do NOT return any other text or markdown formatting. "
                f"Text: {text}"
            )
            
            response = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a specialized JSON-outputting skill extractor."},
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",  # Fast and good for extraction
                temperature=0.0,
                max_tokens=256,
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up potential markdown formatting from LLM
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            skills = json.loads(content.strip())
            
            if isinstance(skills, list):
                # Normalize and deduplicate
                normalized = set()
                for s in skills:
                    if isinstance(s, str) and s.strip():
                        normalized.add(_normalize_skill_display(s.strip()))
                return sorted(list(normalized))
        except Exception as e:
            print(f"⚠️ Groq skill extraction failed: {e}. Falling back to default extractor.")

    # Fallback to local regex/dictionary extraction
    return _fallback_extract_skills(text)


def _fallback_extract_skills(text: str) -> List[str]:
    """
    Fallback extraction using known skills dictionary, regex, and spaCy.
    """
    text_lower = text.lower()
    found_skills = set()

    # Step 1: Match against known skills dictionary (multi-word first)
    # Sort by length descending to match longer phrases first
    sorted_skills = sorted(KNOWN_SKILLS, key=len, reverse=True)
    for skill in sorted_skills:
        # Use word boundaries for single words, direct search for phrases
        if " " in skill:
            if skill in text_lower:
                found_skills.add(skill.title() if skill.count(" ") == 1 else skill.upper() if len(skill) <= 3 else skill.title())
        else:
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                # Normalize casing
                display = _normalize_skill_display(skill)
                found_skills.add(display)

    # Step 2: Apply regex patterns for fallback
    for pattern in SKILL_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for m in matches:
            found_skills.add(_normalize_skill_display(m))

    # Step 3: Try spaCy NER if available
    try:
        found_skills.update(_spacy_extract(text))
    except Exception:
        pass  # spaCy optional

    return sorted(list(found_skills))


def _normalize_skill_display(skill: str) -> str:
    """Normalize skill display name."""
    special_cases = {
        "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
        "java": "Java", "golang": "Go", "rust": "Rust", "ruby": "Ruby",
        "php": "PHP", "swift": "Swift", "kotlin": "Kotlin", "scala": "Scala",
        "react": "React", "angular": "Angular", "vue": "Vue.js", "svelte": "Svelte",
        "nextjs": "Next.js", "nuxtjs": "Nuxt.js", "nestjs": "NestJS",
        "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
        "express": "Express.js", "spring": "Spring",
        "postgresql": "PostgreSQL", "mysql": "MySQL", "mongodb": "MongoDB",
        "redis": "Redis", "elasticsearch": "Elasticsearch",
        "aws": "AWS", "azure": "Azure", "gcp": "GCP", "docker": "Docker",
        "kubernetes": "Kubernetes", "k8s": "Kubernetes", "terraform": "Terraform",
        "tensorflow": "TensorFlow", "pytorch": "PyTorch",
        "scikit-learn": "Scikit-learn", "pandas": "Pandas", "numpy": "NumPy",
        "machine learning": "Machine Learning", "deep learning": "Deep Learning",
        "nlp": "NLP", "computer vision": "Computer Vision",
        "graphql": "GraphQL", "grpc": "gRPC", "rest api": "REST API",
        "oauth": "OAuth", "jwt": "JWT", "ci/cd": "CI/CD",
        "sql": "SQL", "nosql": "NoSQL", "orm": "ORM",
        "agile": "Agile", "scrum": "Scrum", "devops": "DevOps",
        "microservices": "Microservices", "linux": "Linux", "git": "Git",
        "pinecone": "Pinecone", "openai": "OpenAI", "llm": "LLM",
        "langchain": "LangChain", "r": "R",
    }
    return special_cases.get(skill.lower(), skill.title())


def _spacy_extract(text: str) -> List[str]:
    """Optional spaCy NER for additional skill extraction."""
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        skills = []
        for ent in doc.ents:
            if ent.label_ in ("ORG", "PRODUCT", "WORK_OF_ART"):
                candidate = ent.text.strip()
                if candidate.lower() in KNOWN_SKILLS:
                    skills.append(_normalize_skill_display(candidate))
        return skills
    except Exception:
        return []


def merge_skills(text_skills: List[str], manual_skills: Optional[List[str]]) -> List[str]:
    """Merge extracted and manually provided skills, deduplicated."""
    combined = set(text_skills)
    if manual_skills:
        for s in manual_skills:
            combined.add(_normalize_skill_display(s))
    return sorted(list(combined))
