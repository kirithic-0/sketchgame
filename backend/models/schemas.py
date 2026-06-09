from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class SessionStartRequest(BaseModel):
    player_name: str
    selected_country: Optional[str] = None

class SessionEvaluateRequest(BaseModel):
    session_id: str
    imageBase64: str
    locationId: str
    drawing_time: Optional[float] = None
    retry_count: Optional[int] = 0
    
    # Effort scoring parameters (Model 3)
    stroke_count: Optional[int] = None
    total_points: Optional[int] = None
    bbox_area_ratio: Optional[float] = None
    drawing_speed: Optional[float] = None

class EvaluationRequest(BaseModel):
    imageBase64: str
    locationId: str
    objective: str
    vqa_question: Optional[str] = None
    target_state: Optional[str] = None
    
    # Telemetry and caching parameters
    session_id: Optional[str] = None
    round_number: Optional[int] = None
    selected_country: Optional[str] = None
    r1_score: Optional[int] = None
    r1_strokes: Optional[int] = None
    r2_strokes: Optional[int] = None
    r1_time: Optional[float] = None
    r2_time: Optional[float] = None
    is_custom_name: Optional[bool] = None

    # Effort scoring parameters (Model 3)
    stroke_count: Optional[int] = None
    total_points: Optional[int] = None
    bbox_area_ratio: Optional[float] = None
    drawing_speed: Optional[float] = None

class SessionSummaryRequest(BaseModel):
    avg_draw_time: float
    avg_stroke_count: float
    retry_count: float
    average_score: float
