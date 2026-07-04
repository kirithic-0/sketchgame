import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from backend.core.config import settings
from backend.core.logger import logger

ALGORITHM = "HS256"
# Token expires in 6 hours as requested
ACCESS_TOKEN_EXPIRE_MINUTES = 6 * 60

def create_session_token(data: dict) -> str:
    """
    Generate a JWT token encoding the session state data.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=ALGORITHM)
    return encoded_jwt

def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token. Returns the payload dict if valid, None if invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT Token: {e}")
        return None
