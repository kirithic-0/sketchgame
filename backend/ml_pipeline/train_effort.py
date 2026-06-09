import os
import numpy as np
import joblib
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import mean_squared_error, r2_score

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(backend_dir, exist_ok=True)

print("Training Drawing Effort & Complexity Regressor...")
n_reg_samples = 200

np.random.seed(42)

strokes = np.random.randint(1, 100, n_reg_samples)
points = strokes * np.random.randint(10, 30, n_reg_samples)
bbox_ratio = np.random.uniform(0.01, 0.9, n_reg_samples)
speed = np.random.uniform(10, 500, n_reg_samples)

# Effort formula mapping: balanced geometry maps to higher effort
effort = (
    1.5 * np.log1p(strokes) +
    2.5 * np.sin(bbox_ratio * np.pi) -
    0.5 * (speed > 300) +
    1.0 * (points / (strokes + 1) > 15)
)
effort = np.clip(effort, 0.0, 10.0)

X_effort = np.column_stack([strokes, points, bbox_ratio, speed])
y_effort = effort

# Train SVR pipeline (includes scaling)
svr_pipeline = make_pipeline(StandardScaler(), SVR(kernel='rbf', C=1.0, epsilon=0.1))
svr_pipeline.fit(X_effort, y_effort)

# Evaluate
y_pred = svr_pipeline.predict(X_effort)
mse = mean_squared_error(y_effort, y_pred)
r2 = r2_score(y_effort, y_pred)
print(f"Effort Regressor MSE: {mse:.4f}, R2: {r2:.4f}")

# Save
effort_path = os.path.join(backend_dir, "effort_regressor.pkl")
joblib.dump(svr_pipeline, effort_path)
print(f"SVR Effort Regressor saved to {effort_path}\n")
