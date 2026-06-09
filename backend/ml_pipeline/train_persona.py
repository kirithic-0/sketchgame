import os
import numpy as np
import joblib
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(backend_dir, exist_ok=True)

print("Training Playstyle Persona Clustering Model...")
n_samples = 300

np.random.seed(42)

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

labels = kmeans.labels_
score = silhouette_score(scaled_features, labels)
print(f"K-Means silhouette score: {score:.4f}")

# Save Scaler and Model
scaler_path = os.path.join(backend_dir, "persona_scaler.pkl")
kmeans_path = os.path.join(backend_dir, "persona_kmeans.pkl")
joblib.dump(scaler, scaler_path)
joblib.dump(kmeans, kmeans_path)
print(f"K-Means persona scaler saved to {scaler_path}")
print(f"K-Means persona model saved to {kmeans_path}\n")
