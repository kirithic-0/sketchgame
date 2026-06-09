import os
import numpy as np
import joblib
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import mean_squared_error, r2_score

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(backend_dir, exist_ok=True)

print("Training Score Regressor...")
n_samples = 200

np.random.seed(42)

similarity = np.random.uniform(0.75, 0.98, n_samples)

# Score mapping formula
min_sim, max_sim = 0.85, 0.93
score = 100.0 * (similarity - min_sim) / (max_sim - min_sim)
score = np.clip(score, 0.0, 100.0)

X_score = similarity.reshape(-1, 1)
y_score = score

svr_pipeline = make_pipeline(StandardScaler(), SVR(kernel='rbf', C=10.0, epsilon=1.0))
svr_pipeline.fit(X_score, y_score)

y_pred = svr_pipeline.predict(X_score)
mse = mean_squared_error(y_score, y_pred)
r2 = r2_score(y_score, y_pred)
print(f"Score Regressor MSE: {mse:.4f}, R2: {r2:.4f}")

# Save
score_path = os.path.join(backend_dir, "score_regressor.pkl")
joblib.dump(svr_pipeline, score_path)
print(f"SVR Score Regressor saved to {score_path}\n")
