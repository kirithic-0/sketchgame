import random
import json
import httpx
import math
import base64
from typing import Optional, Dict, Any
from fastapi import HTTPException
import google.generativeai as genai
from backend.core.config import settings
from backend.core.state import PREEMPTIVE_CACHE

# Initialize Gemini if config is set
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

CITIES = [
  { 'name': 'Tokyo', 'lat': 35.6762, 'lng': 139.6503, 'country': 'Japan' },
  { 'name': 'Paris', 'lat': 48.8566, 'lng': 2.3522, 'country': 'France' },
  { 'name': 'New York', 'lat': 40.7128, 'lng': -74.0060, 'country': 'USA' },
  { 'name': 'London', 'lat': 51.5074, 'lng': -0.1278, 'country': 'UK' },
  { 'name': 'Rome', 'lat': 41.9028, 'lng': 12.4964, 'country': 'Italy' },
]

MOCK_LOCATIONS = [
  {
    'id': 'tokyo',
    'name': 'Shibuya Crossing, Tokyo',
    'country': 'Japan',
    'lat': 35.6595,
    'lng': 139.7004,
    'fallbackUrl': 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80'
  }
]

def get_fallback_objective(round_num: int) -> Dict[str, Any]:
    fallbacks = {
        1: [
            {"objective": "Destroy that trash can.", "difficulty": "Easy", "vqa_question": "Is the trash can destroyed or heavily damaged in this image?", "target_state": "the trash can is destroyed, broken, or shattered"},
            {"objective": "Make that pedestrian happy.", "difficulty": "Easy", "vqa_question": "Is the pedestrian happy or smiling in this image?", "target_state": "the pedestrian is happy, smiling, or laughing"},
            {"objective": "Vandalize that clean wall.", "difficulty": "Easy", "vqa_question": "Is the wall vandalized or covered in drawings/graffiti/markings in this image?", "target_state": "the clean wall is vandalized with spray paint, drawings, or graffiti"}
        ],
        2: [
            {"objective": "Steal that bicycle.", "difficulty": "Medium", "vqa_question": "Is the bicycle being stolen or removed from its spot in this image?", "target_state": "the bicycle is stolen, taken away, or missing from its parking spot"},
            {"objective": "Cause a minor traffic collision.", "difficulty": "Medium", "vqa_question": "Is there a traffic collision or vehicle accident in this image?", "target_state": "there is a minor car crash, traffic accident, or vehicle collision"},
            {"objective": "Convince the locals that street lamp is a god.", "difficulty": "Medium", "vqa_question": "Are people worshipping or gathering around the street lamp in this image?", "target_state": "people are worshipping, praying, or bow down to the street lamp"}
        ],
        3: [
            {"objective": "Cause a localized power outage on this street.", "difficulty": "Medium", "vqa_question": "Is there a power outage or blackout visible on this street?", "target_state": "there is a power outage, blackout, or all lights are turned off on the street"},
            {"objective": "Make that pedestrian run for their life.", "difficulty": "Medium", "vqa_question": "Is the pedestrian running away in fear in this image?", "target_state": "the pedestrian is running away in panic, terror, or fear"},
            {"objective": "Turn that fire hydrant into a neighborhood water park.", "difficulty": "Medium", "vqa_question": "Is the fire hydrant acting like a water park or spraying water on people in this image?", "target_state": "the fire hydrant is spraying water and acting like an active water park"}
        ],
        4: [
            {"objective": "Completely vaporize the building on the left.", "difficulty": "Hard", "vqa_question": "Is the building on the left completely vaporized, destroyed, or gone in this image?", "target_state": "the building on the left is vaporized, disintegrated, or completely destroyed"},
            {"objective": "Start an impromptu street party or street brawl among the pedestrians.", "difficulty": "Hard", "vqa_question": "Are the pedestrians in a street party or a street brawl in this image?", "target_state": "pedestrians are having a street party, dancing, or engaged in a street fight"},
            {"objective": "Abduct that parked car using alien technology.", "difficulty": "Hard", "vqa_question": "Is the parked car being abducted by a UFO or alien technology in this image?", "target_state": "the parked car is being abducted, lifted by a tractor beam, or taken by a UFO"}
        ],
        5: [
            {"objective": "Initiate an alien abduction on that pedestrian.", "difficulty": "Hard", "vqa_question": "Is the pedestrian being abducted by a UFO or aliens in this image?", "target_state": "the pedestrian is being abducted or lifted into the sky by a UFO"},
            {"objective": "Cause a volcanic eruption under that car while keeping the people happy.", "difficulty": "Hard", "vqa_question": "Is there a volcanic eruption under the car, and are the people happy in this image?", "target_state": "a volcano is erupting under the car and the people are happy or cheering"},
            {"objective": "Exterminate all forms of technology on this street.", "difficulty": "Hard", "vqa_question": "Has all technology on this street (cars, phones, lights) been destroyed or deactivated in this image?", "target_state": "all technology, electronics, cars, and lights are deactivated, destroyed, or gone"}
        ]
    }
    choices = fallbacks.get(round_num, fallbacks[1])
    return random.choice(choices)

async def call_gemini_vision(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    if not settings.gemini_api_key:
        raise Exception("Gemini API key not configured")
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        generation_config=genai.GenerationConfig(response_mime_type="application/json")
    )
    response = model.generate_content([
        prompt,
        {"mime_type": mime_type, "data": image_bytes}
    ])
    return response.text

async def call_groq_vision(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    if not settings.groq_api_key:
        raise Exception("Groq API key not configured")
        
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "response_format": {
            "type": "json_object"
        },
        "temperature": 0.2
    }
    
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=30.0
        )
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Groq API returned status {response.status_code}: {response.text}")

async def generate_content_with_fallback(prompt: str, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    errors = []
    api_attempts = []
    
    if settings.groq_api_key:
        api_attempts.append(("Groq", call_groq_vision))
    if settings.gemini_api_key:
        api_attempts.append(("Gemini", call_gemini_vision))
        
    if not api_attempts:
        raise Exception("Neither Gemini nor Groq API keys are configured.")
        
    for name, api_func in api_attempts:
        try:
            print(f"Attempting content generation using {name}...")
            result_text = await api_func(prompt, image_bytes, mime_type)
            print(f"Success with {name}!")
            return result_text
        except Exception as e:
            err_msg = f"{name} failed: {e}"
            print(err_msg)
            errors.append(err_msg)
            
    raise Exception(f"All vision APIs failed: {'; '.join(errors)}")

async def generate_objective_for_image(image_url: str, round_num: int) -> Dict[str, Any]:
    if not settings.gemini_api_key and not settings.groq_api_key:
        return get_fallback_objective(round_num)
        
    async with httpx.AsyncClient() as client:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            response = await client.get(image_url, headers=headers, timeout=10.0)
            if response.status_code == 200:
                image_bytes = response.content
            else:
                print(f"Failed to download image from {image_url}: {response.status_code}")
                return get_fallback_objective(round_num)
        except Exception as e:
            print(f"Error downloading image for objective generation: {e}")
            return get_fallback_objective(round_num)

    try:
        specificity_guideline = ""
        if round_num == 1:
            specificity_guideline = "Make the objective relatively simple, open-ended, and easy to achieve (e.g. 'Vandalize that wall', 'Destroy that mailbox', 'Make that pedestrian smile')."
        elif round_num == 2:
            specificity_guideline = "Make the objective slightly more situational and chaotic (e.g. 'Cause a minor traffic collision', 'Convince the street dog it is a king', 'Steal that bike')."
        elif round_num == 3:
            specificity_guideline = "Make the objective moderately complex (e.g. 'Cause a localized power outage on this street', 'Build a makeshift shrine to that fire hydrant', 'Make that pedestrian run for their life')."
        elif round_num == 4:
            specificity_guideline = "Make the objective highly specific and challenging (e.g. 'Completely vaporize that building', 'Make all pedestrians in this scene start a street brawl or a street party')."
        else:
            specificity_guideline = "Make the objective extremely chaotic and demanding (e.g. 'Initiate an alien abduction on that pedestrian', 'Cause a volcanic eruption under that car while keeping the people happy')."

        prompt = f"""
        You are the Game Master of GeoSketch — a chaotic, evil AI that wants players to carry out random acts of violence, destruction, or bizarre kindness/worship on the street scene.
        Analyze this street view scene.
        Identify key elements in the scene (such as buildings, cars, pedestrians, bikes, trash cans, street lamps, walls, signs, etc.).
        
        Generate a creative, location-specific objective/command for the player.
        IMPORTANT: Do NOT tell the player HOW to achieve it (do not say "draw a bomb on the car" or "draw a smiley face on the person"). 
        Instead, give them a high-level goal or command (e.g. "Destroy that bike", "Cause a power outage", "Vandalize the building", "Make that pedestrian happy", "Exterminate that street light"). Let the player figure out what to draw to achieve it.
        
        Follow these specificity guidelines for round {round_num}:
        {specificity_guideline}
        
        Make sure the objective refers to actual visible elements in the street scene (e.g. "that green car", "the brick building on the left", "that stop sign").
        
        Return a JSON object with this exact schema:
        {{
          "objective": "A single, clear, direct, and slightly menacing command from an evil AI.",
          "difficulty": "Easy", "Medium", or "Hard" based on the task complexity and scene.,
          "vqa_question": "A simple, direct binary (Yes/No) question to verify if the objective command was successfully achieved (e.g., 'Is that green car destroyed or damaged in this image?', 'Is that pedestrian happy or smiling in this image?')",
          "target_state": "A short description of the final successful state of the target (e.g. 'the green car is destroyed or severely damaged', 'the pedestrian is happy or celebrating')"
        }}
        """
        
        result_text = await generate_content_with_fallback(prompt, image_bytes, "image/jpeg")
        
        if not result_text.strip().startswith('{'):
            start = result_text.find('{')
            end = result_text.rfind('}') + 1
            if start != -1 and end > start:
                result_text = result_text[start:end]
            
        return json.loads(result_text)
    except Exception as e:
        print(f"Error generating objective: {e}")
        return get_fallback_objective(round_num)

async def generate_location_data(round_num: int, country: Optional[str] = None) -> Dict[str, Any]:
    available_cities = CITIES
    if country:
        filtered = [c for c in CITIES if c["country"].lower() == country.lower()]
        if filtered:
            available_cities = filtered
            print(f"Filtering search to: {country}")

    if not settings.mapillary_access_token:
        print("Mapillary access token missing, returning mock location.")
        loc = random.choice(MOCK_LOCATIONS)
        objective_info = await generate_objective_for_image(loc["fallbackUrl"], round_num)
        return {
            "location": loc,
            "imageUrl": loc["fallbackUrl"],
            "imageId": f"fallback_{loc['id']}",
            "objective": objective_info.get("objective", "Draw something cool!"),
            "difficulty": objective_info.get("difficulty", "Medium"),
            "vqa_question": objective_info.get("vqa_question", "Is the drawing creative?"),
            "target_state": objective_info.get("target_state", "the drawing is creative"),
            "isMock": True
        }

    async with httpx.AsyncClient() as client:
        for loc_attempt in range(5):
            city = random.choice(available_cities)
            latOffset = (random.random() - 0.5) * 0.2
            lngOffset = (random.random() - 0.5) * 0.2
            
            lat = round(city['lat'] + latOffset, 5)
            lng = round(city['lng'] + lngOffset, 5)
            
            location = {
                "id": f"random_{city['name'].lower().replace(' ', '_')}_{random.randint(10000, 99999)}",
                "name": f"Random Spot near {city['name']}",
                "country": city['country'],
                "lat": lat,
                "lng": lng
            }
            
            print(f"Location Attempt {loc_attempt + 1}/5: Searching near {city['name']} ({lat}, {lng})")
            
            searchLat = lat
            searchLng = lng
            
            for attempt in range(8):
                url = f"https://graph.mapillary.com/images?lat={searchLat}&lng={searchLng}&radius=50&limit=5&access_token={settings.mapillary_access_token}&fields=id,thumb_1024_url,thumb_2048_url,captured_at"
                try:
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get("data") and len(data["data"]) > 0:
                            valid_image = next((img for img in data["data"] if img.get("thumb_1024_url") or img.get("thumb_2048_url")), None)
                            if valid_image:
                                print(f"Successfully found street view image on attempt {attempt + 1} at ({searchLat}, {searchLng})")
                                image_url = valid_image.get("thumb_1024_url", valid_image.get("thumb_2048_url"))
                                objective_info = await generate_objective_for_image(image_url, round_num)
                                return {
                                    "location": location,
                                    "imageUrl": image_url,
                                    "imageId": valid_image["id"],
                                    "objective": objective_info.get("objective", "Draw something cool!"),
                                    "difficulty": objective_info.get("difficulty", "Medium"),
                                    "vqa_question": objective_info.get("vqa_question", "Is the drawing creative?"),
                                    "target_state": objective_info.get("target_state", "the drawing is creative"),
                                    "isMock": False
                                }
                    else:
                         print(f"Mapillary API warning: Status code {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"Mapillary API request exception: {e}")
                
                factor = math.pow(attempt + 1, 1.8) * 0.0015
                angle = random.random() * math.pi * 2
                searchLat = round(lat + math.sin(angle) * factor, 5)
                searchLng = round(lng + math.cos(angle) * factor, 5)

            print(f"No street imagery found near {city['name']} on attempt {loc_attempt + 1}.")
    raise HTTPException(status_code=404, detail="Total street view imagery coverage search failure after 5 locations.")

async def prefetch_future_rounds(session_id: str, selected_country: str):
    print(f"Background task: starting prefetch for session {session_id} in {selected_country or 'any country'}...")
    session_rounds = {}
    for round_num in [3, 4, 5]:
        try:
            round_data = await generate_location_data(round_num, selected_country)
            session_rounds[round_num] = round_data
            print(f"Background task: pre-cached Round {round_num} for session {session_id}")
        except Exception as e:
            print(f"Background task: failed to pre-cache Round {round_num} for session {session_id}: {e}")
    
    if session_rounds:
        PREEMPTIVE_CACHE[session_id] = session_rounds
        print(f"Background task: finished pre-caching rounds {list(session_rounds.keys())} for session {session_id}")
