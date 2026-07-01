import os
import random
import math
import requests
import json
from dotenv import load_dotenv

# Load env variables from the main project root
load_dotenv(dotenv_path='../../.env')

MAPILLARY_TOKEN = os.getenv('VITE_MAPILLARY_ACCESS_TOKEN')
if not MAPILLARY_TOKEN:
    print("Error: VITE_MAPILLARY_ACCESS_TOKEN not found in ../../.env")
    exit(1)

CITIES = [
  { 'name': 'Tokyo', 'lat': 35.6762, 'lng': 139.6503, 'country': 'Japan' },
  { 'name': 'Paris', 'lat': 48.8566, 'lng': 2.3522, 'country': 'France' },
  { 'name': 'New York', 'lat': 40.7128, 'lng': -74.0060, 'country': 'USA' },
  { 'name': 'London', 'lat': 51.5074, 'lng': -0.1278, 'country': 'UK' },
  { 'name': 'Rome', 'lat': 41.9028, 'lng': 12.4964, 'country': 'Italy' },
]

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'unclassified')
os.makedirs(DATA_DIR, exist_ok=True)

def download_images(target_count=100):
    downloaded = 0
    print(f"Starting download of {target_count} images to {DATA_DIR}...")
    
    while downloaded < target_count:
        city = random.choice(CITIES)
        latOffset = (random.random() - 0.5) * 0.2
        lngOffset = (random.random() - 0.5) * 0.2
        
        lat = round(city['lat'] + latOffset, 5)
        lng = round(city['lng'] + lngOffset, 5)
        
        url = f"https://graph.mapillary.com/images?lat={lat}&lng={lng}&radius=200&limit=50&access_token={MAPILLARY_TOKEN}&fields=id,thumb_1024_url"
        
        try:
            res = requests.get(url)
            if res.status_code == 200:
                data = res.json().get('data', [])
                for img_data in data:
                    if downloaded >= target_count:
                        break
                    
                    img_id = img_data.get('id')
                    img_url = img_data.get('thumb_1024_url')
                    
                    if not img_url:
                        continue
                        
                    file_path = os.path.join(DATA_DIR, f"{img_id}.jpg")
                    if os.path.exists(file_path):
                        continue # Skip if already downloaded
                        
                    # Download the actual image
                    img_res = requests.get(img_url)
                    if img_res.status_code == 200:
                        with open(file_path, 'wb') as f:
                            f.write(img_res.content)
                        downloaded += 1
                        if downloaded % 10 == 0:
                            print(f"Downloaded {downloaded}/{target_count} images...")
            else:
                print(f"Mapillary API Error: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"Error fetching from Mapillary: {e}")

    print(f"Successfully downloaded {downloaded} images.")

if __name__ == "__main__":
    download_images(100)
