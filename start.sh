#!/bin/bash
# Quick Start Script for AI Job Matcher
set -e

echo ""
echo "🤖 AI Job Matcher - Quick Start"
echo "================================"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "  ✅ Virtual environment created"
fi

source venv/bin/activate
pip install -q -r requirements.txt
echo "  ✅ Dependencies installed"

python -m spacy download en_core_web_sm -q 2>/dev/null || true
echo "  ✅ spaCy model downloaded"

# Copy env if not exists
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ℹ️  Created .env from .env.example (using in-memory store)"
fi

echo ""
echo "🚀 Starting backend on http://localhost:8000 ..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for backend
sleep 3

# ── Frontend ───────────────────────────────────────────────────────────────
echo ""
echo "📦 Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
  npm install --silent
  echo "  ✅ Node modules installed"
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

echo ""
echo "🚀 Starting frontend on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "✅ Both services running!"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both services."
echo "================================"

# Wait for both
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
