import requests
import json
import base64
import jwt

API_URL = "http://127.0.0.1:8000/api"
# Must match the secret in your .env / config
JWT_SECRET = "default_secret_key_change_me_in_production"

def test_flow():
    print("=" * 60)
    print("HYBRID JWT + IN-MEMORY SESSION TEST")
    print("=" * 60)
    
    # --- 1. Start Session ---
    print("\n1. Testing POST /session/start")
    start_payload = {
        "player_name": "TestPlayerHybrid",
        "selected_country": "Japan"
    }
    r = requests.post(f"{API_URL}/session/start", json=start_payload)
    if r.status_code != 200:
        print(f"FAILED start: {r.text}")
        return
    data = r.json()
    session_token = data.get("session_token")
    if not session_token:
        print("FAILED: No session_token in response")
        return
    
    # Verify token is slim
    token_bytes = len(session_token.encode('utf-8'))
    print(f"   Token size: {token_bytes} bytes")
    
    # Decode and inspect JWT payload
    payload = jwt.decode(session_token, JWT_SECRET, algorithms=["HS256"])
    print(f"   JWT payload keys: {list(payload.keys())}")
    print(f"   session_id: {payload.get('session_id', 'MISSING')}")
    print(f"   player_name: {payload.get('player_name', 'MISSING')}")
    print(f"   current_round: {payload.get('current_round', 'MISSING')}")
    print(f"   selected_country: {payload.get('selected_country', 'MISSING')}")
    print(f"   status: {payload.get('status', 'MISSING')}")
    
    # Verify heavy data is NOT in JWT
    assert "current_location" not in payload, "FAILED: current_location should NOT be in JWT!"
    assert "round_results" not in payload, "FAILED: round_results should NOT be in JWT!"
    print("   [PASS] Heavy data (current_location, round_results) NOT in JWT")
    
    # Verify response still has current_location (served from memory)
    assert "current_location" in data, "FAILED: current_location missing from API response!"
    print(f"   [PASS] current_location present in response: {data['current_location']['location']['name']}")
    
    # --- 2. Check Session Status ---
    print("\n2. Testing GET /session/status")
    r2 = requests.get(f"{API_URL}/session/status?session_token={session_token}")
    if r2.status_code != 200:
        print(f"FAILED status: {r2.text}")
        return
    data2 = r2.json()
    
    assert data2.get("player_name") == "TestPlayerHybrid", "FAILED: player_name mismatch"
    assert data2.get("current_round") == 1, "FAILED: current_round should be 1"
    assert "current_location" in data2, "FAILED: current_location missing from status response"
    assert "round_results" in data2, "FAILED: round_results missing from status response"
    print(f"   [PASS] Player: {data2['player_name']}, Round: {data2['current_round']}")
    print(f"   [PASS] current_location served from memory: {data2['current_location']['location']['name']}")
    print(f"   [PASS] round_results served from memory: {len(data2['round_results'])} results")
    
    # --- 3. Verify expired/invalid tokens ---
    print("\n3. Testing invalid token handling")
    r3 = requests.get(f"{API_URL}/session/status?session_token=invalid.token.here")
    assert r3.status_code == 401, f"FAILED: Expected 401 for invalid token, got {r3.status_code}"
    print("   [PASS] Invalid token correctly returns 401")
    
    # --- Summary ---
    print("\n" + "=" * 60)
    print(f"ALL TESTS PASSED!")
    print(f"JWT token size: {token_bytes} bytes (slim!)")
    print(f"JWT payload: {json.dumps({k: v for k, v in payload.items() if k != 'exp'}, indent=2)}")
    print("=" * 60)

if __name__ == "__main__":
    test_flow()
