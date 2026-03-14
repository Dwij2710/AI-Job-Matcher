# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for ML libraries (optional but safe)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY requirements.txt .

# Install dependencies (this might take a few minutes for torch/spacy)
RUN pip install --no-cache-dir -r requirements.txt

# Download the spaCy model during build so it's ready at runtime
RUN python -m spacy download en_core_web_sm

# Copy the rest of the application
COPY . .

# Expose port (Render sets the PORT env variable automatically, defaulting to trying 10000)
# Make sure your FastAPI app listens on 0.0.0.0, not just localhost
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
