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

# Initialize structured logging first
setup_logging()

from backend.routers.sessions import router as sessions_router
from backend.routers.leaderboard import router as leaderboard_router

app = FastAPI(title="GeoSketch API")


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

@app.get("/")
def read_root():
    return {"status": "running", "app": "GeoSketch API"}
