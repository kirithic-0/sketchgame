import os
import joblib
from typing import Optional

from loguru import logger

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load churn model
CHURN_MODEL_PATH = os.path.join(BASE_DIR, "churn_predictor.pkl")
CHURN_MODEL = joblib.load(CHURN_MODEL_PATH) if os.path.exists(CHURN_MODEL_PATH) else None

# Load K-Means persona models
PERSONA_SCALER_PATH = os.path.join(BASE_DIR, "persona_scaler.pkl")
PERSONA_SCALER = joblib.load(PERSONA_SCALER_PATH) if os.path.exists(PERSONA_SCALER_PATH) else None

PERSONA_MODEL_PATH = os.path.join(BASE_DIR, "persona_kmeans.pkl")
PERSONA_MODEL = joblib.load(PERSONA_MODEL_PATH) if os.path.exists(PERSONA_MODEL_PATH) else None

# Load SVR effort model
EFFORT_MODEL_PATH = os.path.join(BASE_DIR, "effort_regressor.pkl")
EFFORT_MODEL = joblib.load(EFFORT_MODEL_PATH) if os.path.exists(EFFORT_MODEL_PATH) else None

# Load SVR score regressor
SCORE_REGRESSOR_PATH = os.path.join(BASE_DIR, "score_regressor.pkl")
SCORE_REGRESSOR = joblib.load(SCORE_REGRESSOR_PATH) if os.path.exists(SCORE_REGRESSOR_PATH) else None

# Helper to classify playstyle persona
def predict_playstyle_persona(avg_time: float, avg_strokes: float, retries: int, avg_score: float) -> tuple[str, str]:
    logger.info("Classifying style for Time: {:.2f}s, Strokes: {:.2f}, Retries: {}, Score: {:.2f}...", 
                avg_time, avg_strokes, retries, avg_score)
    
    default_review = "You exist. You drew things. I am whelmed."
    if not PERSONA_SCALER or not PERSONA_MODEL:
        logger.warning("Persona classifier models not loaded. Defaulting to 'Neutral'.")
        return "Neutral", default_review
    try:
        features = [[avg_time, avg_strokes, float(retries), avg_score]]
        scaled_feats = PERSONA_SCALER.transform(features)
        cluster = int(PERSONA_MODEL.predict(scaled_feats)[0])
        
        centers = PERSONA_SCALER.inverse_transform(PERSONA_MODEL.cluster_centers_)
        strokes_centers = [c[1] for c in centers] # index 1 is avg_stroke_count
        sorted_indices = sorted(range(len(strokes_centers)), key=lambda k: strokes_centers[k])
        
        speedrunner_cluster = sorted_indices[0]
        artist_cluster = sorted_indices[2]
        
        if cluster == speedrunner_cluster:
            persona = "The Speedrunner"
            gm_review = "Finished in a flash? I suppose speed is a substitute for skill in your mind. Your scribbles look like a toddler's sneeze, but your efficiency is... tolerable."
        elif cluster == artist_cluster:
            persona = "The Perfectionist Artist"
            gm_review = "Such detail! Such dedication! You spend eternity placing every pixel. Too bad your beautiful artwork is destined to be incinerated in my database."
        else:
            persona = "The Chaos Agent"
            gm_review = "You cleared the canvas constantly, creating erratic, chaotic lines. I respect the pure, unhinged instability of your gameplay. Magnificent disaster."
            
        logger.info("Classified as '{}' (Cluster ID: {})", persona, cluster)
        return persona, gm_review
    except Exception as e:
        logger.exception("Error running persona model. Defaulting to 'Neutral'.")
        return "Neutral", default_review

