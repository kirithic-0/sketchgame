# GeoSketch ML Pipelines & Models

This folder contains the machine learning pipelines and training scripts used to generate the models served by the GeoSketch API. For a resume, this showcases a full end-to-end MLOps workflow from synthetic/telemetry data generation through model fitting and serialization.

---

## 1. Churn Prediction & Preemptive Caching (`train_churn.py`)
*   **Algorithm:** Random Forest Classifier (`sklearn.ensemble.RandomForestClassifier`)
*   **Task:** Binary classification predicting whether a player will complete the 5-round game match based on metrics gathered up to Round 2. If completion probability is high ($>0.85$), the backend preemptively triggers background tasks to pre-fetch Mapillary street imagery and generate AI prompts for the remaining rounds, improving response latency.
*   **Features (8):**
    1.  `r1_score`: Player score in Round 1.
    2.  `r2_score`: Player score in Round 2.
    3.  `score_drop`: Difference between Round 1 and Round 2 scores (`r1_score - r2_score`).
    4.  `r1_strokes`: Number of strokes drawn in Round 1.
    5.  `r2_strokes`: Number of strokes drawn in Round 2.
    6.  `r1_time`: Drawing time elapsed in Round 1.
    7.  `r2_time`: Drawing time elapsed in Round 2.
    8.  `is_custom_name`: Whether the player set a custom username instead of remaining anonymous ($0$ or $1$).

---

## 2. Playstyle Persona Clustering (`train_persona.py`)
*   **Algorithm:** K-Means Clustering (`sklearn.cluster.KMeans`) and `StandardScaler`
*   **Task:** Unsupervised clustering grouping players into three distinct playstyle archetypes based on their cumulative game metrics.
*   **Features (4):**
    1.  `avg_draw_time`: Average time spent drawing per round.
    2.  `avg_stroke_count`: Average stroke count per drawing.
    3.  `retry_count`: Number of times the canvas was cleared/reset.
    4.  `average_score`: Average evaluation score across all rounds.
*   **Playstyle Archetypes:**
    *   **The Speedrunner:** Characterized by low drawing time and low stroke counts.
    *   **The Perfectionist Artist:** Characterized by high drawing time, high stroke counts, and high scores.
    *   **The Chaos Agent:** Characterized by high canvas retry counts and highly variable scores.

---

## 3. Drawing Effort & Complexity Regressor (`train_effort.py`)
*   **Algorithm:** Support Vector Regression (SVR) inside a scaling pipeline (`sklearn.pipeline.make_pipeline`)
*   **Task:** Regression predicting a continuous drawing effort score (ranging from $0.0$ to $10.0$). The effort score is used to apply scoring bonuses or penalties to the base AI evaluation (e.g., penalizing low-effort single-line scribbles or rewarding detailed drawings).
*   **Features (4):**
    1.  `stroke_count`: Total strokes in the canvas.
    2.  `total_points`: Total coordinate points in all strokes.
    3.  `bbox_area_ratio`: Bounding box coverage area ratio compared to the canvas.
    4.  `drawing_speed`: Average coordinates logged per second.

---

## 4. Embedding Similarity Score Regressor (`train_score.py`)
*   **Algorithm:** Support Vector Regression (SVR) inside a scaling pipeline
*   **Task:** Continuous regression mapping semantic cosine similarity scores of text embeddings (obtained from Gemini Embeddings comparing the AI GM's target state and visual outcome) to final game scores ($0$ to $100$).
*   **Features (1):**
    1.  `similarity`: Cosine similarity float value, typically concentrated in the range $[0.85, 0.95]$.

---

## Retraining the Models
To retrain the models and output fresh pickled files (`.pkl`) into the `backend/` directory, run the individual scripts from the workspace root:

```bash
python backend/ml_pipeline/train_churn.py
python backend/ml_pipeline/train_persona.py
python backend/ml_pipeline/train_effort.py
python backend/ml_pipeline/train_score.py
```
