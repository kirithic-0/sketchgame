from fastapi import APIRouter, HTTPException
from backend.core.database import supabase

router = APIRouter(prefix="/api")

@router.get("/leaderboard")
async def get_leaderboard():
    if not supabase:
        return []
    try:
        response = supabase.table("geosketch_scores").select("*").order("score", desc=True).limit(10).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
