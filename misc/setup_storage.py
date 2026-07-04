import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env"))

from backend.core.database import supabase
from loguru import logger

def setup():
    if not supabase:
        logger.error("Supabase client not initialized. Check your .env file.")
        return

    logger.info("Setting up Supabase for Gallery Feature...")
    
    # 2. Create the storage bucket
    try:
        logger.info("Creating 'runs' storage bucket...")
        supabase.storage.create_bucket("runs", options={"public": True})
        logger.info("Bucket 'runs' created successfully!")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            logger.info("Bucket 'runs' already exists.")
        else:
            logger.error(f"Error creating bucket: {e}")

if __name__ == "__main__":
    setup()
