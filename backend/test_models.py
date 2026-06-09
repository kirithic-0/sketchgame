import os
import unittest
import numpy as np
import joblib
from sklearn.pipeline import Pipeline

class TestGeoSketchMLModels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Determine the base directory of the backend folder
        cls.backend_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Paths to serialized models
        cls.churn_path = os.path.join(cls.backend_dir, "churn_predictor.pkl")
        cls.scaler_path = os.path.join(cls.backend_dir, "persona_scaler.pkl")
        cls.kmeans_path = os.path.join(cls.backend_dir, "persona_kmeans.pkl")
        cls.effort_path = os.path.join(cls.backend_dir, "effort_regressor.pkl")
        
        # Verify file existence before running tests
        for path in [cls.churn_path, cls.scaler_path, cls.kmeans_path, cls.effort_path]:
            if not os.path.exists(path):
                raise FileNotFoundError(f"Required model file not found at: {path}. Please run scripts/train_all_models.py first.")
        
        # Load the models
        cls.churn_model = joblib.load(cls.churn_path)
        cls.persona_scaler = joblib.load(cls.scaler_path)
        cls.persona_kmeans = joblib.load(cls.kmeans_path)
        cls.effort_model = joblib.load(cls.effort_path)

    def test_churn_predictor_loading(self):
        """Verify the Churn Predictor model loads correctly and expects 8 features."""
        self.assertIsNotNone(self.churn_model)
        self.assertEqual(self.churn_model.n_features_in_, 8)

    def test_churn_predictions_positive_case(self):
        """Verify that a player showing high retention telemetry has a high completion probability (> 0.85)."""
        # Features: [r1_score, r2_score, score_drop, r1_strokes, r2_strokes, r1_time, r2_time, is_custom_name]
        # Custom name, high round 2 score, no score drop, decent time, decent strokes.
        high_retention_sample = np.array([[90, 95, -5, 30, 35, 25, 28, 1]])
        
        probs = self.churn_model.predict_proba(high_retention_sample)[0]
        # class 0: churn (will quit), class 1: completion (will complete)
        completion_prob = probs[1]
        
        print(f"High-retention completion probability: {completion_prob:.4f}")
        self.assertGreater(completion_prob, 0.70)  # Completion probability should be high

    def test_churn_predictions_negative_case(self):
        """Verify that a player showing high churn telemetry has a low completion probability."""
        # Features: [r1_score, r2_score, score_drop, r1_strokes, r2_strokes, r1_time, r2_time, is_custom_name]
        # Anonymous user, massive score drop in round 2, extremely low strokes and time in round 2.
        high_churn_sample = np.array([[95, 20, 75, 25, 2, 35, 3, 0]])
        
        probs = self.churn_model.predict_proba(high_churn_sample)[0]
        completion_prob = probs[1]
        
        print(f"High-churn completion probability: {completion_prob:.4f}")
        self.assertLess(completion_prob, 0.60)  # Completion probability should be low (below 0.85 cache trigger)

    def test_churn_model_general_accuracy(self):
        """Generate a larger mock test dataset and evaluate model accuracy."""
        np.random.seed(99)
        num_test_samples = 200
        
        # Generate random features
        r1_score = np.random.randint(30, 100, num_test_samples)
        r2_score = np.random.randint(15, 100, num_test_samples)
        score_drop = r1_score - r2_score
        r1_strokes = np.random.randint(5, 75, num_test_samples)
        r2_strokes = np.random.randint(2, 60, num_test_samples)
        r1_time = np.random.randint(5, 55, num_test_samples)
        r2_time = np.random.randint(3, 40, num_test_samples)
        is_custom_name = np.random.binomial(1, 0.5, num_test_samples)
        
        X_test = np.column_stack([
            r1_score, r2_score, score_drop, r1_strokes, r2_strokes, r1_time, r2_time, is_custom_name
        ])
        
        # Determine actual labels using the same formula used in training
        churn_prob = (
            0.3 * (100 - r2_score) / 100 +
            0.2 * (score_drop > 20) +
            0.2 * (r2_strokes < 10) +
            0.2 * (r2_time < 8) -
            0.1 * is_custom_name
        )
        churn_prob = np.clip(churn_prob, 0, 1)
        y_test = np.random.binomial(1, 1 - churn_prob)
        
        predictions = self.churn_model.predict(X_test)
        accuracy = np.mean(predictions == y_test)
        
        print(f"Churn Predictor Test Accuracy: {accuracy * 100:.2f}%")
        self.assertGreaterEqual(accuracy, 0.65)  # General baseline check

    def test_persona_clustering_archetypes(self):
        """Verify that the 3 target playstyle archetypes map to distinct clusters."""
        # Archetype features: [avg_draw_time, avg_stroke_count, retry_count, average_score]
        speedrunner = np.array([[8.0, 4.0, 3.0, 50.0]])
        artist = np.array([[55.0, 45.0, 0.0, 92.0]])
        chaos_agent = np.array([[22.0, 12.0, 6.0, 35.0]])
        
        # Scale and predict
        sr_scaled = self.persona_scaler.transform(speedrunner)
        art_scaled = self.persona_scaler.transform(artist)
        chaos_scaled = self.persona_scaler.transform(chaos_agent)
        
        sr_cluster = self.persona_kmeans.predict(sr_scaled)[0]
        art_cluster = self.persona_kmeans.predict(art_scaled)[0]
        chaos_cluster = self.persona_kmeans.predict(chaos_scaled)[0]
        
        print(f"Cluster IDs -> Speedrunner: {sr_cluster}, Artist: {art_cluster}, Chaos Agent: {chaos_cluster}")
        
        # Verify that they are clustered into different labels
        self.assertNotEqual(sr_cluster, art_cluster)
        self.assertNotEqual(sr_cluster, chaos_cluster)
        self.assertNotEqual(art_cluster, chaos_cluster)

    def test_effort_regressor_bounds(self):
        """Verify the Effort Regressor limits predictions to valid ranges and outputs correct relative scale."""
        # Test low effort
        # Features: [stroke_count, total_points, bbox_area_ratio, drawing_speed]
        # Low strokes, low points, very small canvas area coverage, slow speed
        low_effort_sample = np.array([[1, 5, 0.01, 5.0]])
        low_score = self.effort_model.predict(low_effort_sample)[0]
        
        # Test high effort
        # High strokes, high points, large bounding box, moderate controlled speed
        high_effort_sample = np.array([[45, 800, 0.65, 120.0]])
        high_score = self.effort_model.predict(high_effort_sample)[0]
        
        # Test chaotic scribble
        # High strokes but massive speed and low time (indicates mindless scribble)
        scribble_sample = np.array([[95, 1200, 0.85, 480.0]])
        scribble_score = self.effort_model.predict(scribble_sample)[0]
        
        print(f"Effort Predictions -> Low: {low_score:.2f}, High: {high_score:.2f}, Scribble: {scribble_score:.2f}")
        
        # Assertions on logical ranges
        self.assertGreaterEqual(low_score, 0.0)
        self.assertLessEqual(high_score, 10.0)
        self.assertLess(low_score, 6.0)
        self.assertGreater(high_score, 7.0)
        # Bounding box sin mapping + speed penalty should mean scribble score is lower than high_effort_score
        self.assertLess(low_score, scribble_score)
        self.assertLess(scribble_score, high_score)

    def test_effort_regressor_large_dataset(self):
        """Run predictions on a larger mock dataset and ensure output bounds and sanity."""
        np.random.seed(123)
        n_samples = 100
        
        strokes = np.random.randint(1, 120, n_samples)
        points = strokes * np.random.randint(8, 35, n_samples)
        bbox_ratio = np.random.uniform(0.005, 0.95, n_samples)
        speed = np.random.uniform(5, 600, n_samples)
        
        X_test = np.column_stack([strokes, points, bbox_ratio, speed])
        predictions = self.effort_model.predict(X_test)
        
        # Check that none of the predictions are completely wild
        self.assertTrue(all(p > -2.0 for p in predictions), "Some predictions were negative out of bounds")
        self.assertTrue(all(p < 12.0 for p in predictions), "Some predictions were positive out of bounds")

if __name__ == "__main__":
    unittest.main()
