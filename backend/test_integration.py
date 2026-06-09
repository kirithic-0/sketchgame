import os
import unittest
import joblib
from fastapi.testclient import TestClient

# Set up environment variables before importing main to avoid initialization issues
os.environ["MAPILLARY_ACCESS_TOKEN"] = ""  # Force mock locations for deterministic testing

from backend.main import app
from backend.core.state import PREEMPTIVE_CACHE
from backend.services.ml_service import CHURN_MODEL

class TestGeoSketchIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.session_id = "integration_test_session_999"

    def setUp(self):
        # Clear cache before each test
        PREEMPTIVE_CACHE.clear()

    def test_preemptive_caching_flow(self):
        """Simulate a player with high retention stats in Round 2 to trigger preemptive caching."""
        print("\n--- Running End-to-End Caching Flow Test ---")
        
        # Mock churn predictor completion probability to 0.90 to guarantee caching trigger
        from unittest.mock import MagicMock
        import numpy as np
        original_predict_proba = CHURN_MODEL.predict_proba
        CHURN_MODEL.predict_proba = MagicMock(return_value=np.array([[0.1, 0.9]]))

        try:
            # 1. Round 1: Fetch location
            response = self.client.get(f"/api/location?round=1&session_id={self.session_id}")
            self.assertEqual(response.status_code, 200)
            r1_data = response.json()
            self.assertTrue(r1_data["isMock"])
            self.assertIn("objective", r1_data)
            
            # 2. Round 1: Evaluate drawing
            r1_eval_payload = {
                "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "locationId": r1_data["location"]["id"],
                "objective": r1_data["objective"],
                "session_id": self.session_id,
                "round_number": 1,
                "selected_country": "Japan"
            }
            response = self.client.post("/api/evaluate", json=r1_eval_payload)
            self.assertEqual(response.status_code, 200)
            r1_eval_data = response.json()
            r1_score = r1_eval_data["score"]
            print(f"Round 1 Score: {r1_score}")
    
            # 3. Round 2: Fetch location
            response = self.client.get(f"/api/location?round=2&session_id={self.session_id}")
            self.assertEqual(response.status_code, 200)
            r2_data = response.json()
    
            # 4. Round 2: Evaluate drawing with high retention stats
            r2_eval_payload = {
                "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "locationId": r2_data["location"]["id"],
                "objective": r2_data["objective"],
                
                "session_id": self.session_id,
                "round_number": 2,
                "selected_country": "Japan",
                "r1_score": r1_score,
                "r1_strokes": 15,
                "r1_time": 20.0,
                "r2_strokes": 18,
                "r2_time": 22.0,
                "is_custom_name": True
            }
            
            response = self.client.post("/api/evaluate", json=r2_eval_payload)
            self.assertEqual(response.status_code, 200)
            r2_eval_data = response.json()
            print(f"Round 2 Score: {r2_eval_data['score']}")
    
            # 5. Check if PREEMPTIVE_CACHE contains data for session and Rounds 3, 4, 5
            self.assertIn(self.session_id, PREEMPTIVE_CACHE)
            session_cache = PREEMPTIVE_CACHE[self.session_id]
            print(f"Preemptive cache keys: {list(session_cache.keys())}")
            self.assertIn(3, session_cache)
            self.assertIn(4, session_cache)
            self.assertIn(5, session_cache)
    
            # 6. Round 3: Fetch location and verify cache hit
            response = self.client.get(f"/api/location?round=3&session_id={self.session_id}")
            self.assertEqual(response.status_code, 200)
            r3_data = response.json()
            self.assertIn("objective", r3_data)
            
            # Verify that round 3 is popped from the cache
            self.assertNotIn(3, PREEMPTIVE_CACHE[self.session_id])
            print("Successfully verified Cache HIT and Cache Pop for Round 3!")
        finally:
            CHURN_MODEL.predict_proba = original_predict_proba

    def test_churn_under_threshold_no_cache(self):
        """Simulate a player with high churn metrics (low score, default name, etc.) and verify no cache is created."""
        print("\n--- Running Churn Under Threshold Test ---")
        
        # Mock churn predictor completion probability to 0.10 to guarantee NO caching trigger
        from unittest.mock import MagicMock
        import numpy as np
        original_predict_proba = CHURN_MODEL.predict_proba
        CHURN_MODEL.predict_proba = MagicMock(return_value=np.array([[0.9, 0.1]]))

        try:
            r2_eval_payload = {
                "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "locationId": "test_loc",
                "objective": "test_obj",
                
                # Telemetry parameters designed to fail completion_prob > 0.85
                "session_id": "churner_session_123",
                "round_number": 2,
                "selected_country": "Japan",
                "r1_score": 98,
                "r1_strokes": 30,
                "r1_time": 45.0,
                "r2_strokes": 2,   # extremely low strokes
                "r2_time": 3.0,    # extremely low time
                "is_custom_name": False
            }
            
            response = self.client.post("/api/evaluate", json=r2_eval_payload)
            self.assertEqual(response.status_code, 200)
            
            # Cache should NOT be created for this session
            self.assertNotIn("churner_session_123", PREEMPTIVE_CACHE)
            print("Verified that no cache was triggered for high-churn player.")
        finally:
            CHURN_MODEL.predict_proba = original_predict_proba

    def test_effort_regressor_evaluation(self):
        """Verify that SVR effort scorer modifies the evaluation score (penalties vs bonus)."""
        print("\n--- Running Effort Regressor Score Calibration Test ---")
        
        # 1. Low effort drawing
        low_effort_payload = {
            "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "locationId": "test_loc",
            "objective": "Destroy the trash can.",
            "target_state": "the trash can is destroyed",
            "stroke_count": 1,
            "total_points": 5,
            "bbox_area_ratio": 0.01,
            "drawing_speed": 5.0
        }
        
        response = self.client.post("/api/evaluate", json=low_effort_payload)
        self.assertEqual(response.status_code, 200)
        low_eval = response.json()
        print(f"Low effort score: {low_eval['score']}, effort score: {low_eval.get('effort_score')}")
        self.assertIn("effort_score", low_eval)
        self.assertLess(low_eval["effort_score"], 6.0)
        self.assertGreater(low_eval["effort_score"], 3.0)

        # 2. High effort drawing
        high_effort_payload = {
            "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "locationId": "test_loc",
            "objective": "Destroy the trash can.",
            "target_state": "the trash can is destroyed",
            "stroke_count": 45,
            "total_points": 800,
            "bbox_area_ratio": 0.65,
            "drawing_speed": 120.0
        }
        
        response = self.client.post("/api/evaluate", json=high_effort_payload)
        self.assertEqual(response.status_code, 200)
        high_eval = response.json()
        print(f"High effort score: {high_eval['score']}, effort score: {high_eval.get('effort_score')}")
        self.assertIn("effort_score", high_eval)
        self.assertGreater(high_eval["effort_score"], 7.0)
        self.assertLessEqual(high_eval["effort_score"], 10.0)
        
        if high_eval.get("isMock"):
            self.assertEqual(high_eval["score"], 44) # base 40 + 10% bonus = 44 score!
        else:
            self.assertGreaterEqual(high_eval["score"], 0)

    def test_game_summary_persona_clustering(self):
        """Verify that game summary persona clustering matches archetypes correctly."""
        print("\n--- Running Playstyle Persona Clustering Test ---")
        
        # 1. Speedrunner archetype
        sr_payload = {
            "avg_draw_time": 8.0,
            "avg_stroke_count": 4.0,
            "retry_count": 3.0,
            "average_score": 50.0
        }
        response = self.client.post("/api/game-summary", json=sr_payload)
        self.assertEqual(response.status_code, 200)
        sr_summary = response.json()
        print(f"Speedrunner summary: {sr_summary['persona_name']} -> {sr_summary['gm_review']}")
        self.assertEqual(sr_summary["persona_name"], "The Speedrunner")

        # 2. Artist archetype
        art_payload = {
            "avg_draw_time": 55.0,
            "avg_stroke_count": 45.0,
            "retry_count": 0.0,
            "average_score": 92.0
        }
        response = self.client.post("/api/game-summary", json=art_payload)
        self.assertEqual(response.status_code, 200)
        art_summary = response.json()
        print(f"Artist summary: {art_summary['persona_name']} -> {art_summary['gm_review']}")
        self.assertEqual(art_summary["persona_name"], "The Perfectionist Artist")

        # 3. Chaos Agent archetype
        chaos_payload = {
            "avg_draw_time": 22.0,
            "avg_stroke_count": 12.0,
            "retry_count": 6.0,
            "average_score": 35.0
        }
        response = self.client.post("/api/game-summary", json=chaos_payload)
        self.assertEqual(response.status_code, 200)
        chaos_summary = response.json()
        print(f"Chaos summary: {chaos_summary['persona_name']} -> {chaos_summary['gm_review']}")
        self.assertEqual(chaos_summary["persona_name"], "The Chaos Agent")

if __name__ == "__main__":
    unittest.main()
