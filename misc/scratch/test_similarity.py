import os
import math
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
if os.path.exists(backend_env_path):
    load_dotenv(dotenv_path=backend_env_path)

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
genai.configure(api_key=api_key)

def get_similarity(outcome, target):
    try:
        emb_res = genai.embed_content(
            model="models/gemini-embedding-001",
            content=[outcome, target],
            task_type="semantic_similarity"
        )
        embeddings = emb_res['embedding']
        v1, v2 = embeddings[0], embeddings[1]
        
        dot_product = sum(x*y for x, y in zip(v1, v2))
        magnitude1 = math.sqrt(sum(x*x for x in v1))
        magnitude2 = math.sqrt(sum(y*y for y in v2))
        return dot_product / (magnitude1 * magnitude2) if magnitude1 and magnitude2 else 0.0
    except Exception as e:
        print(f"Error: {e}")
        return 0.0

target_state = "the bicycle is destroyed, broken, or gone"

test_cases = [
    ("PERFECT MATCH (Clean state description)", "The bicycle is vaporized and completely destroyed."),
    ("PARTIAL MATCH (Clean state description)", "The bicycle is slightly damaged and blocked."),
    ("COMPLETE MISS (Clean state description)", "The bicycle is completely intact and untouched.")
]

print(f"Target State: '{target_state}'\n")
for label, outcome in test_cases:
    sim = get_similarity(outcome, target_state)
    print(f"{label}:")
    print(f"  Outcome: '{outcome}'")
    print(f"  Raw Cosine Similarity: {sim:.4f}")
