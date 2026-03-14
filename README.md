# 🤖 AI Job Matching Agent

A production-ready AI-powered job matching system that uses semantic similarity to match workers with the most relevant jobs.

## 🏗️ Architecture

```
Worker Profile → Skill Extraction (spaCy/LLM) → Embeddings (Sentence Transformers)
                                                         ↓
Job Listings   → Skill Extraction (spaCy/LLM) → Embeddings → Pinecone Vector DB
                                                         ↓
                                              Cosine Similarity Search
                                                         ↓
                                         Top 10 Matches + Explainable Scores
                                                         ↓
                                              React Dashboard UI
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | Pinecone |
| NLP | spaCy + Regex |
| Frontend | React + Tailwind CSS |
| API Client | Axios |

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Set environment variables in `.env`:
```
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENV=your_pinecone_environment
```

Start the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Visit: http://localhost:3000

### 3. API Docs

Visit: http://localhost:8000/docs

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /worker-profile | Upload worker profile & skills |
| POST | /job | Add a new job listing |
| GET | /match/{worker_id} | Get top job matches for worker |
| GET | /workers | List all workers |
| GET | /jobs | List all jobs |
| POST | /seed | Seed with test data |

## 📁 Folder Structure

```
ai-job-matcher/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── models/              # Pydantic models
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic
│   │   └── utils/               # Helpers (embeddings, bias checks)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Dashboard pages
│   │   └── services/            # API service layer
│   └── package.json
├── data/
│   └── test_data.json           # 50 workers + 50 jobs sample data
└── tests/
    └── test_matching.py         # Unit tests
```

## 🧠 Explainable AI

Every match includes:
- **Match Score** (0–100%)
- **Matched Skills** (what you have that they want)
- **Missing Skills** (skill gaps)
- **Experience Alignment** (junior/mid/senior fit)

## ⚖️ Ethical AI

- Skill-based matching only (no demographics)
- Transparent scoring with full explanation
- Bias detection on job descriptions
- Worker privacy preserved

