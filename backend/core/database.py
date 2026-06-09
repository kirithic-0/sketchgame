from supabase import create_client, Client
from backend.core.config import settings

supabase: Client = None

if settings.supabase_url and settings.supabase_key:
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_key)
    except Exception as e:
        print(f"[Database] Error initializing Supabase client: {e}")
