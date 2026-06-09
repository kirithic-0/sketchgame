import uuid
import math
import random
import json
import base64
import os
import joblib
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
import google.generativeai as genai

from backend.core.config import settings
from backend.core.database import supabase
from backend.core.state import MOCK_SESSIONS, PREEMPTIVE_CACHE
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

router = APIRouter(prefix="/api")

# Helper to get session from database or mock cache
def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    print(f"[SESSION DB QUERY] Retrieving session {session_id}...")
    if supabase:
        try:
            response = supabase.table("geosketch_sessions").select("*").eq("id", session_id).execute()
            if response.data and len(response.data) > 0:
                print(f"[SESSION DB QUERY] SUCCESS - Found session {session_id} in database.")
                return response.data[0]
            print(f"[SESSION DB QUERY] NOT FOUND - Session {session_id} not in database.")
            return None
        except Exception as e:
            print(f"[SESSION DB QUERY] ERROR querying Supabase: {e}")
            return None
    else:
        session = MOCK_SESSIONS.get(session_id)
        if session:
            print(f"[SESSION DB QUERY] SUCCESS - Found session {session_id} in mock cache.")
        else:
            print(f"[SESSION DB QUERY] NOT FOUND - Session {session_id} not in mock cache.")
        return session

# Helper to save new session
def save_new_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
    print(f"[SESSION DB INSERT] Creating new session for player '{session_data['player_name']}'...")
    if supabase:
        try:
            response = supabase.table("geosketch_sessions").insert([session_data]).execute()
            if response.data and len(response.data) > 0:
                inserted = response.data[0]
                print(f"[SESSION DB INSERT] SUCCESS - Created session {inserted['id']} in database.")
                return inserted
            raise Exception("No data returned from insert operation.")
        except Exception as e:
            print(f"[SESSION DB INSERT] ERROR inserting to Supabase: {e}")
            raise HTTPException(status_code=500, detail=f"Database insert failed: {e}")
    else:
        session_id = str(uuid.uuid4())
        session_data["id"] = session_id
        MOCK_SESSIONS[session_id] = session_data
        print(f"[SESSION DB INSERT] SUCCESS - Created session {session_id} in mock cache.")
        return session_data

# Helper to update session
def update_session_by_id(session_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    print(f"[SESSION DB UPDATE] Updating session {session_id} with data keys: {list(update_data.keys())}...")
    if supabase:
        try:
            response = supabase.table("geosketch_sessions").update(update_data).eq("id", session_id).execute()
            if response.data and len(response.data) > 0:
                print(f"[SESSION DB UPDATE] SUCCESS - Updated session {session_id} in database.")
                return response.data[0]
            print(f"[SESSION DB UPDATE] WARNING - Update succeeded but session {session_id} not found.")
            return None
        except Exception as e:
            print(f"[SESSION DB UPDATE] ERROR updating Supabase: {e}")
            raise HTTPException(status_code=500, detail=f"Database update failed: {e}")
    else:
        if session_id in MOCK_SESSIONS:
            MOCK_SESSIONS[session_id].update(update_data)
            print(f"[SESSION DB UPDATE] SUCCESS - Updated session {session_id} in mock cache.")
            return MOCK_SESSIONS[session_id]
        print(f"[SESSION DB UPDATE] NOT FOUND - Session {session_id} not in mock cache.")
        return None

# Endpoints for Session API
@router.post("/session/start")
async def start_session(req: SessionStartRequest, background_tasks: BackgroundTasks):
    print(f"\n=== [ENDPOINT: START SESSION] ===")
    print(f"Player Name: {req.player_name}")
    print(f"Country Filter: {req.selected_country}")
    
    first_location = await generate_location_data(1, req.selected_country)
    
    session_data = {
        "player_name": req.player_name,
        "current_round": 1,
        "status": "in_progress",
        "current_location": first_location,
        "round_results": []
    }
    
    session = save_new_session(session_data)
    session_id = session["id"]
    
    print(f"Generated Session ID: {session_id}")
    print(f"Round 1 Location: {first_location['location']['name']}")
    print(f"=================================\n")
    
    return {
        "session_id": session_id,
        "current_round": 1,
        "current_location": first_location
    }

@router.get("/session/status")
async def get_session_status(session_id: str = Query(...), player_name: Optional[str] = None):
    print(f"\n=== [ENDPOINT: GET SESSION STATUS] ===")
    print(f"Session ID: {session_id}")
    print(f"Requested Player Name: {player_name}")
    
    session = get_session_by_id(session_id)
    if not session:
        print(f"Status: SESSION NOT FOUND")
        print(f"=====================================\n")
        raise HTTPException(status_code=404, detail="Session not found.")
        
    if session.get("status") == "completed":
        print(f"Status: SESSION ALREADY COMPLETED")
        print(f"=====================================\n")
        raise HTTPException(status_code=404, detail="Session is already completed.")
        
    if player_name and session.get("player_name") != player_name:
        print(f"Status: USERNAME MISMATCH (Expected '{session.get('player_name')}', Got '{player_name}'). Invalidating session.")
        update_session_by_id(session_id, {"status": "completed"})
        print(f"=====================================\n")
        raise HTTPException(status_code=404, detail="Session username mismatch. Session invalidated.")
        
    print(f"Status: ACTIVE | Player: {session.get('player_name')} | Round: {session.get('current_round')}")
    print(f"======================================\n")
    
    return {
        "session_id": session["id"],
        "player_name": session["player_name"],
        "current_round": session["current_round"],
        "current_location": session["current_location"],
        "round_results": session["round_results"]
    }

@router.post("/session/evaluate")
async def evaluate_session_drawing(req: SessionEvaluateRequest, background_tasks: BackgroundTasks):
    print(f"\n=== [ENDPOINT: EVALUATE SESSION DRAWING] ===")
    print(f"Session ID: {req.session_id}")
    
    session = get_session_by_id(req.session_id)
    if not session:
        print(f"Error: Session not found.")
        print(f"==========================================\n")
        raise HTTPException(status_code=404, detail="Session not found.")
        
    if session.get("status") == "completed":
        print(f"Error: Session is already completed.")
        print(f"==========================================\n")
        raise HTTPException(status_code=404, detail="Session already completed.")
        
    current_round = session["current_round"]
    player_name = session["player_name"]
    current_location = session["current_location"]
    round_results = session["round_results"]
    
    print(f"Player: {player_name} | Round: {current_round}/5")
    print(f"Active Objective: {current_location.get('objective')}")
    print(f"Target Outcome State: {current_location.get('target_state')}")
    
    evaluation_req = EvaluationRequest(
        imageBase64=req.imageBase64,
        locationId=req.locationId,
        objective=current_location.get("objective", ""),
        vqa_question=current_location.get("vqa_question"),
        target_state=current_location.get("target_state"),
        
        session_id=req.session_id,
        round_number=current_round,
        selected_country=current_location.get("location", {}).get("country"),
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
    
    updated_round_results = list(round_results)
    updated_round_results.append(round_result)
    
    if current_round < 5:
        next_round = current_round + 1
        next_location = None
        if req.session_id in PREEMPTIVE_CACHE:
            session_rounds = PREEMPTIVE_CACHE[req.session_id]
            if next_round in session_rounds:
                print(f"[SESSION] Cache HIT for session {req.session_id}, round {next_round}!")
                next_location = session_rounds.pop(next_round)
                if not session_rounds:
                    PREEMPTIVE_CACHE.pop(req.session_id, None)
                    
        if not next_location:
            print(f"[SESSION] Cache MISS for session {req.session_id}, round {next_round}. Generating fresh location.")
            next_location = await generate_location_data(next_round, current_location.get("location", {}).get("country"))
            
        update_data = {
            "current_round": next_round,
            "current_location": next_location,
            "round_results": updated_round_results
        }
        update_session_by_id(req.session_id, update_data)
        
        print(f"Round {current_round} Complete. Advanced session {req.session_id} to Round {next_round}.")
        print(f"Next Location: {next_location['location']['name']}")
        print(f"==========================================\n")
        
        return {
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
        persona_name = predict_playstyle_persona(avg_time, avg_strokes, retries, avg_score)
        
        print(f"Session {req.session_id} Complete. Total Score: {total_score} | Average Effort: {average_effort:.2f} | Persona: {persona_name}")
        
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
                print(f"[SESSION LEADERBOARD] Auto-submitting score {total_score} for '{player_name}'...")
                supabase.table("geosketch_scores").insert([leaderboard_data]).execute()
                print(f"[SESSION LEADERBOARD] SUCCESS - Score saved.")
            except Exception as save_err:
                print(f"[SESSION LEADERBOARD] ERROR saving to leaderboard: {save_err}")
        else:
            print(f"[SESSION LEADERBOARD] Mock Mode - Suppressed database save.")
            
        update_data = {
            "status": "completed",
            "round_results": updated_round_results
        }
        update_session_by_id(req.session_id, update_data)
        
        print(f"Session {req.session_id} status set to completed.")
        print(f"==========================================\n")
        
        return {
            "evaluation": evaluation_res,
            "total_score": total_score,
            "is_completed": True
        }

@router.get("/location")
async def get_location(
    round_num: int = Query(1, alias="round"),
    country: Optional[str] = None,
    session_id: Optional[str] = None
):
    if session_id and session_id in PREEMPTIVE_CACHE:
        session_rounds = PREEMPTIVE_CACHE[session_id]
        if round_num in session_rounds:
            print(f"Cache HIT for session {session_id}, round {round_num}!")
            round_data = session_rounds.pop(round_num)
            if not session_rounds:
                PREEMPTIVE_CACHE.pop(session_id, None)
            return round_data
            
    return await generate_location_data(round_num, country)

@router.post("/evaluate")
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
            print(f"Error decoding base64 image: {e}")
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
                    print(f"Cosine Similarity: {similarity:.4f} --> Predicted score: {final_score}")
                except Exception as emb_err:
                    print(f"Error calculating embedding similarity: {emb_err}")
                    pass
                    
            res = {**json_result, "isMock": False}
        except Exception as e:
            print(f"Error calling Vision AI: {e}")
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
            print(f"Effort Scorer: raw={raw_effort:.4f} --> score={effort_score:.2f}/10 (Final score: {base_score} -> {final_score})")
        except Exception as effort_err:
            print(f"Error running Effort Model: {effort_err}")

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
            print(f"Session {req.session_id} - Predicted completion probability: {prob_completion:.4f}")
            
            if prob_completion > 0.85:
                background_tasks.add_task(
                    prefetch_future_rounds,
                    req.session_id,
                    req.selected_country
                )
                print(f"Scheduled preemptive pre-caching for session {req.session_id} (P={prob_completion:.2f})")
        except Exception as ml_err:
            print(f"Error running Churn Predictor: {ml_err}")

    return res

@router.post("/game-summary")
async def game_summary(req: SessionSummaryRequest):
    if not PERSONA_SCALER or not PERSONA_MODEL:
        raise HTTPException(status_code=500, detail="Persona clustering models not loaded on backend.")

    try:
        features = [[req.avg_draw_time, req.avg_stroke_count, req.retry_count, req.average_score]]
        scaled_feats = PERSONA_SCALER.transform(features)
        cluster = int(PERSONA_MODEL.predict(scaled_feats)[0])
        
        centers = PERSONA_SCALER.inverse_transform(PERSONA_MODEL.cluster_centers_)
        strokes_centers = [c[1] for c in centers]
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

        return {
            "cluster_id": cluster,
            "persona_name": persona,
            "gm_review": gm_review
        }
    except Exception as e:
        print(f"Error computing game summary persona: {e}")
        raise HTTPException(status_code=500, detail=str(e))
