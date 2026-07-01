from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import shutil

app = Flask(__name__)

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, 'data')
UNCLASSIFIED_DIR = os.path.join(DATA_DIR, 'unclassified')
GOOD_DIR = os.path.join(DATA_DIR, 'good')
BAD_DIR = os.path.join(DATA_DIR, 'bad')

# Ensure directories exist
os.makedirs(UNCLASSIFIED_DIR, exist_ok=True)
os.makedirs(GOOD_DIR, exist_ok=True)
os.makedirs(BAD_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/images')
def get_images():
    # Get up to 20 images from the unclassified folder
    images = [f for f in os.listdir(UNCLASSIFIED_DIR) if f.endswith('.jpg') or f.endswith('.png')]
    batch = images[:20]
    return jsonify({"images": batch, "remaining": len(images)})

@app.route('/api/submit', methods=['POST'])
def submit():
    data = request.json
    bad_images = data.get('bad', [])
    all_images = data.get('all', [])
    
    good_images = [img for img in all_images if img not in bad_images]
    
    moved_good = 0
    moved_bad = 0
    
    for img in bad_images:
        src = os.path.join(UNCLASSIFIED_DIR, img)
        dst = os.path.join(BAD_DIR, img)
        if os.path.exists(src):
            shutil.move(src, dst)
            moved_bad += 1
            
    for img in good_images:
        src = os.path.join(UNCLASSIFIED_DIR, img)
        dst = os.path.join(GOOD_DIR, img)
        if os.path.exists(src):
            shutil.move(src, dst)
            moved_good += 1
            
    return jsonify({
        "status": "success", 
        "moved_good": moved_good,
        "moved_bad": moved_bad
    })

@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(UNCLASSIFIED_DIR, filename)

if __name__ == '__main__':
    print(f"Starting server... Make sure you have images in {UNCLASSIFIED_DIR}")
    app.run(debug=True, port=5001)
