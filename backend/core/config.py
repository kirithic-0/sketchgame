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

    def __init__(self, **values):
        super().__init__(**values)
        # Fallbacks for VITE_ prefixed env variables set on Render
        if not self.supabase_url:
            self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        if not self.supabase_key:
            self.supabase_key = os.getenv("VITE_SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
        if not self.gemini_api_key:
            self.gemini_api_key = os.getenv("VITE_GEMINI_API_KEY")
        if not self.mapillary_access_token:
            self.mapillary_access_token = os.getenv("VITE_MAPILLARY_ACCESS_TOKEN")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
