import os
from dotenv import load_dotenv
from pathlib import Path

# Get the backend directory (three levels up from this file)
backend_dir = Path(__file__).resolve().parent.parent.parent
env_path = backend_dir / ".env"

# Load environment variables from the correct .env file
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_HOURS = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "168")
)  # Default to 7 days
