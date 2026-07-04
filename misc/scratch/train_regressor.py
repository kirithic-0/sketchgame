import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os

def train_and_save():
    # Calibrated range based on actual gemini-embedding-001 outputs:
    # 0.85 is the baseline for completely opposite states (e.g. intact vs destroyed) sharing the target noun.
    # 0.93 is a successful match (e.g. destroyed vs destroyed).
    X = np.linspace(0.82, 0.95, 200).reshape(-1, 1)
    
    # Calculate target satisfaction scores with a linear mapping:
    # 0.85 similarity maps to 0 score.
    # 0.93 similarity maps to 100 score.
    y = ((X - 0.85) / (0.93 - 0.85)) * 100
    y = np.clip(y, 0, 100).flatten()
    
    # Train Linear Regression model
    model = LinearRegression()
    model.fit(X, y)
    
    # Save model
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(os.path.dirname(current_dir), "backend")
    os.makedirs(backend_dir, exist_ok=True)
    
    model_path = os.path.join(backend_dir, "score_regressor.pkl")
    joblib.dump(model, model_path)
    
    # Verify predictions
    test_similarities = np.array([[0.85], [0.87], [0.89], [0.91], [0.93]])
    predictions = model.predict(test_similarities)
    print("Verification Predictions:")
    for sim, pred in zip(test_similarities.flatten(), predictions):
        print(f"  Similarity: {sim:.3f} --> Predicted Score: {int(round(pred))}")
        
    print(f"\nModel trained and successfully serialized to {model_path}")

if __name__ == "__main__":
    train_and_save()
