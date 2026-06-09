import os
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report

# Ensure output directory exists
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
os.makedirs(backend_dir, exist_ok=True)

print("Starting generation of mock datasets and model training...\n")

# =====================================================================
# MODEL 1: Player Churn Prediction & Preemptive Caching (Random Forest)
# =====================================================================
print("--- 1. Training Churn Prediction Model ---")
np.random.seed(42)
num_samples = 1000

r1_score = np.random.randint(20, 100, num_samples)
r2_score = np.random.randint(10, 100, num_samples)
score_drop = r1_score - r2_score
r1_strokes = np.random.randint(5, 80, num_samples)
r2_strokes = np.random.randint(2, 60, num_samples)
r1_time = np.random.randint(5, 60, num_samples)
r2_time = np.random.randint(3, 45, num_samples)
is_custom_name = np.random.binomial(1, 0.6, num_samples)

# Logic to determine churn (quit before round 5)
churn_probability = (
    0.3 * (100 - r2_score) / 100 +
    0.2 * (score_drop > 20) +
    0.2 * (r2_strokes < 10) +
    0.2 * (r2_time < 8) -
    0.1 * is_custom_name
)
churn_probability = np.clip(churn_probability, 0, 1)
will_complete = np.random.binomial(1, 1 - churn_probability)

# Stack features into a 2D numpy array
X_churn = np.column_stack([
    r1_score,
    r2_score,
    score_drop,
    r1_strokes,
    r2_strokes,
    r1_time,
    r2_time,
    is_custom_name
])
y_churn = will_complete

X_train, X_test, y_train, y_test = train_test_split(X_churn, y_churn, test_size=0.2, random_state=42)

churn_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
churn_model.fit(X_train, y_train)

# Output evaluation
y_pred = churn_model.predict(X_test)
print("Churn Model Evaluation:")
print(classification_report(y_test, y_pred))

# Save
churn_path = os.path.join(backend_dir, "churn_predictor.pkl")
joblib.dump(churn_model, churn_path)
print(f"Churn predictor saved to {churn_path}\n")


# =====================================================================
# MODEL 2: Playstyle Persona Clustering (K-Means)
# =====================================================================
print("--- 2. Training Playstyle Persona Clustering Model ---")
n_samples = 300

# Speedrunners: Low draw time, low stroke count, high retry rate, moderate/lower scores
speedrunners = np.random.multivariate_normal(
    mean=[10, 5, 2.5, 60],
    cov=[[4, 1, 0.5, 10], [1, 2, 0.1, 5], [0.5, 0.1, 1, 2], [10, 5, 2, 50]],
    size=100
)

# Artists: High draw time, high stroke count, low retries, high scores
artists = np.random.multivariate_normal(
    mean=[45, 40, 0.5, 85],
    cov=[[25, 10, 0.1, 15], [10, 30, 0.1, 10], [0.1, 0.1, 0.2, 1], [15, 10, 1, 30]],
    size=100
)

# Chaos Agents: Medium time, medium strokes, high retries, variable scores
chaos_agents = np.random.multivariate_normal(
    mean=[20, 15, 4.0, 40],
    cov=[[16, 4, 1, 20], [4, 9, 0.5, 10], [1, 0.5, 2, 5], [20, 10, 5, 100]],
    size=100
)

data = np.vstack([speedrunners, artists, chaos_agents])
data = np.clip(data, 0, None)  # Ensure non-negative features

scaler = StandardScaler()
scaled_features = scaler.fit_transform(data)

kmeans = KMeans(n_clusters=3, random_state=42)
kmeans.fit(scaled_features)

# Save Scaler and Model
scaler_path = os.path.join(backend_dir, "persona_scaler.pkl")
kmeans_path = os.path.join(backend_dir, "persona_kmeans.pkl")
joblib.dump(scaler, scaler_path)
joblib.dump(kmeans, kmeans_path)
print(f"K-Means persona scaler saved to {scaler_path}")
print(f"K-Means persona model saved to {kmeans_path}\n")


# =====================================================================
# MODEL 3: Drawing Effort & Complexity Scorer (SVR Regression)
# =====================================================================
print("--- 3. Training Drawing Effort & Complexity Regressor ---")
n_reg_samples = 200

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

# Save
effort_path = os.path.join(backend_dir, "effort_regressor.pkl")
joblib.dump(svr_pipeline, effort_path)
print(f"SVR Effort Regressor saved to {effort_path}\n")

print("All custom ML models generated and saved successfully!")
