import uuid
import math
import random
import json
import base64
import os
import time
import joblib
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
import google.generativeai as genai
from loguru import logger

from backend.core.config import settings
from backend.core.database import supabase
from backend.core.state import MOCK_SESSIONS, PREEMPTIVE_CACHE, SESSION_STORE, cleanup_expired_sessions
from backend.models.schemas import (
    SessionStartRequest,
    SessionEvaluateRequest,
    EvaluationRequest,
    SessionSummaryRequest
)
from backend.services.ai_service import (
    generate_location_data,
    generate_content_with_fallback,
    prefetch_future_rounds
)
from backend.services.ml_service import (
    predict_playstyle_persona,
    EFFORT_MODEL,
    CHURN_MODEL,
    PERSONA_SCALER,
    PERSONA_MODEL,
    SCORE_REGRESSOR
)
from backend.services.storage_service import upload_run_image

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Request
from backend.core.rate_limit import limiter

from backend.core.security import create_session_token, verify_session_token

router = APIRouter(prefix="/api")


# Endpoints for Session API
@router.post("/session/start")
@limiter.limit("100/minute")
async def start_session(request: Request, req: SessionStartRequest, background_tasks: BackgroundTasks):
    logger.info("ENDPOINT: START SESSION - Player: {}, Country: {}", req.player_name, req.selected_country)
    
    # Periodically clean up expired sessions from memory
    evicted = cleanup_expired_sessions()
    if evicted:
        logger.info("Cleaned up {} expired sessions from memory.", evicted)
    
    first_location = await generate_location_data(1, req.selected_country)
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Store heavy data in memory (not in JWT)
    SESSION_STORE[session_id] = {
        "current_location": first_location,
        "round_results": [],
        "created_at": time.time()
    }
    
    # JWT carries only slim identity/state metadata
    slim_data = {
        "session_id": session_id,
        "player_name": req.player_name,
        "current_round": 1,
        "selected_country": req.selected_country,
        "status": "in_progress"
    }
    session_token = create_session_token(slim_data)
    
    logger.info("Generated slim JWT for session {} | Round 1 Location: {}", session_id, first_location['location']['name'])
    
    return {
        "session_token": session_token,
        "current_round": 1,
        "current_location": first_location
    }

@router.get("/session/status")
async def get_session_status(session_token: str = Query(...)):
    logger.info("ENDPOINT: GET SESSION STATUS")
    
    session = verify_session_token(session_token)
    if not session:
        logger.warning("Session status check: INVALID OR EXPIRED TOKEN")
        raise HTTPException(status_code=401, detail="Session token invalid or expired.")
        
    if session.get("status") == "completed":
        logger.warning("Session status check: SESSION ALREADY COMPLETED for player {}", session.get("player_name"))
        raise HTTPException(status_code=404, detail="Session is already completed.")
    
    session_id = session.get("session_id")
    store_data = SESSION_STORE.get(session_id)
    if not store_data:
        logger.warning("Session status check: session_id {} not found in memory (server may have restarted)", session_id)
        raise HTTPException(status_code=404, detail="Session data not found in server memory. Please start a new game.")
        
    logger.info("Session status check: ACTIVE | Player: {} | Round: {}", session.get('player_name'), session.get('current_round'))
    
    return {
        "session_token": session_token,
        "player_name": session["player_name"],
        "current_round": session["current_round"],
        "current_location": store_data["current_location"],
        "round_results": store_data["round_results"]
    }

@router.post("/session/evaluate")
@limiter.limit("100/minute")
async def evaluate_session_drawing(request: Request, req: SessionEvaluateRequest, background_tasks: BackgroundTasks):
    logger.info("ENDPOINT: EVALUATE SESSION DRAWING")
    
    session = verify_session_token(req.session_token)
    if not session:
        logger.warning("Evaluation failed: Session token invalid or expired")
        raise HTTPException(status_code=401, detail="Session token invalid or expired.")
        
    if session.get("status") == "completed":
        logger.warning("Evaluation failed: Session already completed")
        raise HTTPException(status_code=404, detail="Session already completed.")
    
    session_id = session.get("session_id")
    store_data = SESSION_STORE.get(session_id)
    if not store_data:
        logger.warning("Evaluation failed: session_id {} not found in memory", session_id)
        raise HTTPException(status_code=404, detail="Session data not found in server memory. Please start a new game.")
        
    current_round = session["current_round"]
    player_name = session["player_name"]
    selected_country = session.get("selected_country")
    current_location = store_data["current_location"]
    round_results = store_data.get("round_results", [])
    
    logger.info("Evaluating Player: '{}' | Round: {}/5 | Objective: '{}'", player_name, current_round, current_location.get('objective'))
    
    evaluation_req = EvaluationRequest(
        imageBase64=req.imageBase64,
        locationId=req.locationId,
        objective=current_location.get("objective", ""),
        vqa_question=current_location.get("vqa_question"),
        target_state=current_location.get("target_state"),
        
        session_id=session_id,
        round_number=current_round,
        selected_country=selected_country,
        r1_score=round_results[0].get("score") if len(round_results) > 0 else None,
        r1_strokes=round_results[0].get("strokes") if len(round_results) > 0 else None,
        r1_time=round_results[0].get("time") if len(round_results) > 0 else None,
        r2_strokes=req.stroke_count if current_round == 2 else None,
        r2_time=req.drawing_time if current_round == 2 else None,
        is_custom_name=True,
        
        stroke_count=req.stroke_count,
        total_points=req.total_points,
        bbox_area_ratio=req.bbox_area_ratio,
        drawing_speed=req.drawing_speed
    )
    
    evaluation_res = await evaluate_drawing(evaluation_req, background_tasks)
    
    # Fire off background task to upload the image to Supabase Gallery
    background_tasks.add_task(
        upload_run_image,
        req.imageBase64,
        player_name,
        evaluation_res.get("score", 70),
        current_location.get("objective", ""),
        evaluation_res.get("twist", "")
    )
    
    round_result = {
        "round": current_round,
        "locationName": current_location["location"]["name"],
        "objective": current_location.get("objective"),
        "difficulty": current_location.get("difficulty"),
        "objectDrawn": evaluation_res.get("objectDrawn", "Custom Sketch"),
        "targetObject": evaluation_res.get("targetObject", "Street scene element"),
        "score": evaluation_res.get("score", 70),
        "twist": evaluation_res.get("twist"),
        "evaluation": evaluation_res.get("evaluation"),
        "satisfiedText": evaluation_res.get("satisfiedText"),
        "strokes": req.stroke_count or 0,
        "time": req.drawing_time or 0.0,
        "effortScore": evaluation_res.get("effort_score", 5.0)
    }
    
    # Update round results in memory
    store_data["round_results"].append(round_result)
    updated_round_results = store_data["round_results"]
    
    if current_round < 5:
        next_round = current_round + 1
        
        logger.info("Generating fresh location for round {}.", next_round)
        next_location = await generate_location_data(next_round, selected_country)
        
        # Update heavy data in memory
        store_data["current_location"] = next_location
        
        # Issue new slim JWT with bumped round number
        slim_data = {
            "session_id": session_id,
            "player_name": player_name,
            "current_round": next_round,
            "selected_country": selected_country,
            "status": "in_progress"
        }
        new_token = create_session_token(slim_data)
        
        logger.info("Round {} Complete. Advanced to Round {}. Next location: {}", 
                    current_round, next_round, next_location['location']['name'])
        
        return {
            "session_token": new_token,
            "evaluation": evaluation_res,
            "next_location": next_location,
            "current_round": next_round,
            "is_completed": False
        }
        
    else:
        total_score = sum(r["score"] for r in updated_round_results)
        average_effort = sum(r.get("effortScore", 5.0) for r in updated_round_results) / 5.0
        
        avg_time = sum(r["time"] for r in updated_round_results) / 5.0
        avg_strokes = sum(r["strokes"] for r in updated_round_results) / 5.0
        avg_score = total_score / 5.0
        retries = req.retry_count or 0
        persona_name, gm_review = predict_playstyle_persona(avg_time, avg_strokes, retries, avg_score)
        
        logger.info("Session Complete. Total Score: {} | Average Effort: {:.2f} | Persona: {}", 
                    total_score, average_effort, persona_name)
        
        leaderboard_data = {
            "player_name": player_name,
            "score": total_score,
            "object_drawn": ", ".join(r["objectDrawn"] for r in updated_round_results),
            "target_object": ", ".join(r["targetObject"] for r in updated_round_results),
            "consequence": "Completed a 5-round match (Session verified)!",
            "location_name": ", ".join(r["locationName"].split(",")[0] for r in updated_round_results),
            "stat_effort": round(average_effort, 1),
            "playstyle_persona": persona_name
        }
        
        if supabase:
            try:
                logger.info("Auto-submitting score {} for '{}' to leaderboard...", total_score, player_name)
                supabase.table("geosketch_scores").insert([leaderboard_data]).execute()
                logger.info("Leaderboard submit SUCCESS - Score saved for '{}'.", player_name)
            except Exception as save_err:
                logger.error("Leaderboard submit ERROR: {}", save_err)
        else:
            logger.info("Leaderboard submit: Mock Mode (suppressed DB save).")
        
        # Issue completed JWT and evict session from memory
        slim_data = {
            "session_id": session_id,
            "player_name": player_name,
            "current_round": current_round,
            "selected_country": selected_country,
            "status": "completed"
        }
        new_token = create_session_token(slim_data)
        
        # Evict from memory — session is done
        SESSION_STORE.pop(session_id, None)
        
        logger.info("Session {} completed and evicted from memory.", session_id)
        
        return {
            "session_token": new_token,
            "evaluation": evaluation_res,
            "total_score": total_score,
            "is_completed": True,
            "persona_name": persona_name,
            "gm_review": gm_review
        }





async def evaluate_drawing(req: EvaluationRequest, background_tasks: BackgroundTasks):
    res = {}
    if not settings.gemini_api_key and not settings.groq_api_key:
        res = {
            "objectDrawn": "Giant Laser Cannon",
            "targetObject": "The blue car on the street",
            "twist": "The laser successfully vaporizes the car, but also turns the asphalt underneath into a bubbling cheese fondue.",
            "evaluation": f"Excellent! The blue car has been thoroughly disintegrated, satisfying my command. The resulting cheese fondue street is a delicious bonus, though it might slow down my next target.",
            "satisfiedText": "Disintegration successful. I approve of this chaotic dairy landscape.",
            "score": 90,
            "isMock": True
        }
    else:
        clean_base64 = req.imageBase64
        if ";base64," in clean_base64:
            clean_base64 = clean_base64.split(";base64,")[1]

        try:
            image_bytes = base64.b64decode(clean_base64)
        except Exception as e:
            logger.error("Error decoding base64 image: {}", e)
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        try:
            prompt = f"""
            You are the chaotic, sarcastic, extremely creative, and slightly evil AI Game Master of "GeoSketch" — a game where you command players to carry out random acts of violence, destruction, or bizarre kindness/worship on real-world street scenes.
            Your task is to analyze the combined image of the street scene and the player's drawing, and evaluate how successfully they carried out your command.

            GM's Command Objective: "{req.objective}"
            Desired Target Outcome State: "{req.target_state or req.objective}"

            Identify:
            1. What the user has drawn (objectDrawn) to execute your command. Interpret their drawing creatively and fit it into the theme.
            2. What the drawing has targeted or is interacting with in the background street scene (targetObject).

            Create a Twist:
            - Think of a hilarious, random, and chaotic twist or consequence that occurred when their drawing materialized (e.g., the TNT turned out to be sausages, or the portal summoned a very confused llama, or the cupcakes attracted mutant wasps).
            - This twist must be independent of the player's drawing's direct intention, introducing chaotic and funny physics/lore!

            Describe the Visual Outcome & Final State:
            - In the "evaluation" field, write the Game Master's sarcastic evaluation of the outcome (2-3 sentences).
            - In the "outcome_state" field, write a very brief, direct, 1-sentence description of the target object's final physical state, referencing only the target and its condition (e.g., 'The bicycle is completely destroyed.', 'The wall is covered in graffiti.', 'The bicycle is intact and untouched.'). This text will be analyzed for semantic similarity to determine the satisfaction score. Do not write filler.

            You MUST return a JSON object with the following fields:
            {{
              "objectDrawn": "A concise name for what they drew",
              "targetObject": "What object/part of the street view they drew on top of or next to",
              "twist": "The funny, random, and chaotic twist that occurred (1-2 sentences)",
              "evaluation": "Sarcastic review of the final outcome (2-3 sentences)",
              "outcome_state": "Brief 1-sentence target final state description",
              "satisfiedText": "A sarcastic/witty one-liner from the Game Master stating their level of satisfaction",
              "score": 75
            }}

            Response MimeType must be set to application/json. Return only the JSON structure.
            """
            
            result_text = await generate_content_with_fallback(prompt, image_bytes, "image/png")
            
            if not result_text.strip().startswith('{'):
                start = result_text.find('{')
                end = result_text.rfind('}') + 1
                if start != -1 and end > start:
                    result_text = result_text[start:end]
                
            json_result = json.loads(result_text)
            
            if settings.gemini_api_key:
                target_str = req.target_state or req.objective
                outcome_str = json_result.get("outcome_state", "")
                try:
                    emb_res = genai.embed_content(
                        model="models/gemini-embedding-001",
                        content=[outcome_str, target_str],
                        task_type="semantic_similarity"
                    )
                    embeddings = emb_res['embedding']
                    v1, v2 = embeddings[0], embeddings[1]
                    
                    dot_product = sum(x*y for x, y in zip(v1, v2))
                    magnitude1 = math.sqrt(sum(x*x for x in v1))
                    magnitude2 = math.sqrt(sum(y*y for y in v2))
                    similarity = dot_product / (magnitude1 * magnitude2) if magnitude1 and magnitude2 else 0.0
                    
                    if SCORE_REGRESSOR:
                        import numpy as np
                        pred_score = SCORE_REGRESSOR.predict(np.array([[similarity]]))[0]
                        final_score = max(0, min(100, int(round(pred_score))))
                    else:
                        min_sim, max_sim = 0.85, 0.93
                        scaled = (similarity - min_sim) / (max_sim - min_sim) if similarity > min_sim else 0.0
                        final_score = max(0, min(100, int(round(scaled * 100))))
                    
                    json_result["score"] = final_score
                    logger.info("Embedding similarity: {:.4f} --> Predicted score: {}", similarity, final_score)
                except Exception as emb_err:
                    logger.warning("Error calculating embedding similarity: {}", emb_err)
                    pass
                    
            res = {**json_result, "isMock": False}
        except Exception as e:
            logger.exception("Error calling Vision AI")
            res = {
                "objectDrawn": "Mysterious Error Block",
                "targetObject": "The Matrix",
                "twist": f"An API glitch ({e}) tore through space-time.",
                "evaluation": f"Unable to verify if command objective '{req.objective}' was executed due to technical issues.",
                "satisfiedText": "I am deeply unsatisfied by this API connection error.",
                "score": 40,
                "isMock": True
            }

    if (EFFORT_MODEL and req.stroke_count is not None and req.total_points is not None 
            and req.bbox_area_ratio is not None and req.drawing_speed is not None):
        features_effort = [[req.stroke_count, req.total_points, req.bbox_area_ratio, req.drawing_speed]]
        try:
            raw_effort = float(EFFORT_MODEL.predict(features_effort)[0])
            effort_score = max(0.0, min(10.0, raw_effort))
            
            base_score = res.get("score", 75)
            effort_comment = ""
            final_score = base_score
            
            if effort_score < 3.0:
                penalty_factor = max(0.3, effort_score / 3.0)
                final_score = int(base_score * penalty_factor)
                effort_comment = f"Fails effort check. Effort score: {effort_score:.1f}/10."
            elif effort_score > 8.0:
                final_score = min(100, int(base_score * 1.1))
                effort_comment = f"Excellent effort! Bonus applied. Effort score: {effort_score:.1f}/10."
            else:
                final_score = base_score
                effort_comment = f"Decent effort. Effort score: {effort_score:.1f}/10."
            
            res["score"] = final_score
            res["effort_score"] = round(effort_score, 1)
            
            if "evaluation" in res:
                res["evaluation"] = res["evaluation"] + " " + effort_comment
            logger.info("Effort Scorer: raw={:.4f} --> score={:.2f}/10 (Final score: {} -> {})", 
                        raw_effort, effort_score, base_score, final_score)
        except Exception as effort_err:
            logger.error("Error running Effort Model: {}", effort_err)

    if req.round_number == 2 and CHURN_MODEL and req.session_id:
        r1_score_val = req.r1_score if req.r1_score is not None else 80
        r2_score_val = res.get("score", 75)
        score_drop_val = r1_score_val - r2_score_val
        r1_strokes_val = req.r1_strokes if req.r1_strokes is not None else 20
        r2_strokes_val = req.r2_strokes if req.r2_strokes is not None else 20
        r1_time_val = req.r1_time if req.r1_time is not None else 25.0
        r2_time_val = req.r2_time if req.r2_time is not None else 25.0
        is_custom_val = 1 if req.is_custom_name else 0

        features = [[
            r1_score_val,
            r2_score_val,
            score_drop_val,
            r1_strokes_val,
            r2_strokes_val,
            r1_time_val,
            r2_time_val,
            is_custom_val
        ]]
        
        try:
            probs = CHURN_MODEL.predict_proba(features)[0]
            prob_completion = float(probs[1])
            logger.info("Session {} - Predicted completion probability: {:.4f}", req.session_id, prob_completion)
            
            if prob_completion > 0.85:
                background_tasks.add_task(
                    prefetch_future_rounds,
                    req.session_id,
                    req.selected_country
                )
                logger.info("Scheduled preemptive pre-caching for session {} (P={:.2f})", req.session_id, prob_completion)
        except Exception as ml_err:
            logger.error("Error running Churn Predictor: {}", ml_err)

    return res

