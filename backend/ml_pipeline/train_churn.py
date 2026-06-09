import os
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Ensure output directory exists
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(backend_dir, exist_ok=True)

print("Training Churn Prediction Model...")
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
