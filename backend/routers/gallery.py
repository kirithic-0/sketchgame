from fastapi import APIRouter, Request
from loguru import logger
from backend.core.database import supabase
from backend.core.rate_limit import limiter

router = APIRouter(prefix="/api")

@router.get("/gallery")
@limiter.limit("200/minute")
async def get_gallery(request: Request, limit: int = 50):
    """
    Fetch the latest drawings from the public gallery.
    """
    if not supabase:
        logger.warning("Supabase client not available for Gallery GET.")
        return []
        
    try:
        response = supabase.table("geosketch_gallery") \
            .select("*") \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
            
        return response.data
    except Exception as e:
        logger.error(f"Error fetching gallery data: {e}")
        return []
