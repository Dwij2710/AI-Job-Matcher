import sys
import os

# Set cache directories to /tmp for Vercel's read-only filesystem
os.environ["HF_HOME"] = "/tmp"
os.environ["TRANSFORMERS_CACHE"] = "/tmp"
os.environ["MPLCONFIGDIR"] = "/tmp"
os.environ["JOBLIB_TEMP_FOLDER"] = "/tmp"

# Add the backend directory to the Python path so Vercel can find the app module
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app
