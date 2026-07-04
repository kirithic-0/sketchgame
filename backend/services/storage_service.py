import base64
import uuid
from loguru import logger
from backend.core.database import supabase
from backend.core.config import settings

def upload_run_image(image_base64: str, player_name: str, score: int, objective: str, twist: str):
    """
    Background task to upload a combined image to Supabase Storage
    and create a record in the geosketch_gallery table.
    """
    if not supabase:
        logger.warning("Supabase client not available. Skipping image upload.")
        return

    try:
        # Strip the base64 prefix if it exists
        if ";base64," in image_base64:
            image_base64 = image_base64.split(";base64,")[1]
            
        image_bytes = base64.b64decode(image_base64)
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.png"
        
        # Upload to Supabase Storage bucket 'runs'
        logger.info(f"Uploading image {filename} to Supabase 'runs' bucket...")
        res = supabase.storage.from_("runs").upload(
            filename, 
            image_bytes, 
            file_options={"content-type": "image/png"}
        )
        
        # Generate the public URL
        # Format: https://[project_id].supabase.co/storage/v1/object/public/runs/[filename]
        # Or using the built-in method:
        public_url = supabase.storage.from_("runs").get_public_url(filename)
        
        logger.info(f"Image uploaded successfully: {public_url}")
        
        # Insert metadata into geosketch_gallery table
        gallery_data = {
            "player_name": player_name,
            "score": score,
            "objective": objective,
            "twist": twist,
            "image_url": public_url
        }
        
        logger.info(f"Saving gallery record for {player_name}...")
        supabase.table("geosketch_gallery").insert([gallery_data]).execute()
        logger.info("Gallery record saved successfully.")
        
    except Exception as e:
        logger.error(f"Error in background upload task: {e}")
