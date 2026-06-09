import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load standard .env
load_dotenv()

# Fallback to root directory if present
root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
if os.path.exists(root_env_path):
    load_dotenv(dotenv_path=root_env_path)

class Settings(BaseSettings):
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    mapillary_access_token: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
