import os
import sys

# Dynamic path resolution to allow imports to work from any starting folder
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.logger import setup_logging
from backend.core.rate_limit import limiter
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

# Initialize structured logging first
setup_logging()

from backend.routers.sessions import router as sessions_router
from backend.routers.leaderboard import router as leaderboard_router
from backend.routers.gallery import router as gallery_router

app = FastAPI(title="GeoSketch API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers
app.include_router(sessions_router)
app.include_router(leaderboard_router)
app.include_router(gallery_router)

@app.get("/")
def read_root():
    return {"status": "running", "app": "GeoSketch API"}
