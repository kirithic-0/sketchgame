import time
from typing import Dict, Any

# In-memory sessions fallback if Supabase is not configured
MOCK_SESSIONS: Dict[str, Any] = {}

# In-memory session cache for preemptively fetched location assets
# Schema: { session_id: { round_num: round_data } }
PREEMPTIVE_CACHE: Dict[str, Dict[int, Any]] = {}

# In-memory store for active session heavy data (hybrid JWT approach)
# The JWT carries only slim identity/state; this dict holds the bulky payload.
# Schema: { session_id: { "current_location": {...}, "round_results": [...], "created_at": float } }
SESSION_STORE: Dict[str, Dict[str, Any]] = {}

# Max session age in seconds (6 hours, matches JWT expiry)
SESSION_MAX_AGE = 6 * 60 * 60

def cleanup_expired_sessions() -> int:
    """Remove sessions older than SESSION_MAX_AGE. Returns count of evicted sessions."""
    now = time.time()
    expired = [sid for sid, data in SESSION_STORE.items()
               if now - data.get("created_at", 0) > SESSION_MAX_AGE]
    for sid in expired:
        del SESSION_STORE[sid]
    return len(expired)
