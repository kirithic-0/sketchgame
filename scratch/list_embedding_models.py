import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
backend_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", ".env")
if os.path.exists(backend_env_path):
    load_dotenv(dotenv_path=backend_env_path)

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY not found in environment")
else:
    genai.configure(api_key=api_key)
    try:
        print("Available models supporting embedContent:")
        for m in genai.list_models():
            if 'embedContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
