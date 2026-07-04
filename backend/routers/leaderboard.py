from fastapi import APIRouter, HTTPException, Request
from backend.core.database import supabase
from backend.core.rate_limit import limiter

router = APIRouter(prefix="/api")

@router.get("/leaderboard")
@limiter.limit("200/minute")
async def get_leaderboard(request: Request):
    if not supabase:
        return []
    try:
        response = supabase.table("geosketch_scores").select("*").order("score", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
