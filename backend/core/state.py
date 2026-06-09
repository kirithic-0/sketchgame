from typing import Dict, Any

# In-memory sessions fallback if Supabase is not configured
MOCK_SESSIONS: Dict[str, Any] = {}

# In-memory session cache for preemptively fetched location assets
# Schema: { session_id: { round_num: round_data } }
PREEMPTIVE_CACHE: Dict[str, Dict[int, Any]] = {}
