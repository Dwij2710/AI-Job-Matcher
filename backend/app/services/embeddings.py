"""
Embedding Service
Converts text/skills into vector embeddings using Sentence Transformers
Model: all-MiniLM-L6-v2 (fast, 384-dim, excellent for semantic similarity)
"""
from typing import List, Union
import numpy as np

_model = None


def get_model():
    """Lazy-load the Sentence Transformer model."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("⏳ Loading Sentence Transformer model (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ Model loaded!")
        except ImportError:
            print("⚠️  sentence-transformers not installed. Using mock embeddings.")
            _model = "mock"
    return _model


def skills_to_text(skills: List[str], role: str = "", experience_years: int = 0) -> str:
    """
    Convert a skills list into a rich text representation for embedding.
    This produces better semantic vectors than embedding raw skill lists.
    """
    parts = []
    if role:
        parts.append(f"Role: {role}.")
    if experience_years:
        level = _years_to_level(experience_years)
        parts.append(f"Experience: {experience_years} years ({level}).")
    if skills:
        parts.append(f"Skills: {', '.join(skills)}.")
    return " ".join(parts) if parts else "No skills provided"


def generate_embedding(text: str) -> List[float]:
    """Generate a 384-dim embedding vector for input text."""
    model = get_model()
    if model == "mock":
        return _mock_embedding(text)
    
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()


def generate_batch_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts efficiently."""
    model = get_model()
    if model == "mock":
        return [_mock_embedding(t) for t in texts]
    
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=False)
    return embeddings.tolist()


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def _years_to_level(years: int) -> str:
    if years <= 1:
        return "entry level"
    elif years <= 3:
        return "junior"
    elif years <= 6:
        return "mid level"
    elif years <= 10:
        return "senior"
    else:
        return "lead/principal"


def _mock_embedding(text: str) -> List[float]:
    """Mock embedding for testing without sentence-transformers installed."""
    import hashlib
    hash_val = int(hashlib.md5(text.encode()).hexdigest(), 16)
    np.random.seed(hash_val % (2**32))
    vec = np.random.randn(384).astype(float)
    vec = vec / np.linalg.norm(vec)
    return vec.tolist()
