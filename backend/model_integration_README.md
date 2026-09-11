# Model training + live inference — how to use these two files

## Files
- `train_pothole_yolov8.ipynb` — upload to Google Colab, run top to bottom, download `best.pt`
- `live_inference.py` — run on your laptop, reads webcam/video, detects potholes, pushes them to your dashboard

## Step 1: Train on Colab
1. Go to https://colab.research.google.com, upload `train_pothole_yolov8.ipynb`
2. Runtime → Change runtime type → **T4 GPU**
3. Get a free API key from https://app.roboflow.com/settings/api, paste it into Cell 3
4. Run every cell in order (training takes roughly 20-40 min on the free T4 for this dataset size)
5. Cell 8 downloads `best.pt` to your computer automatically

## Step 2: Run it against your dashboard locally
```bash
# in one terminal - start your existing backend
cd sih/backend
node server.js

# in another terminal - install inference deps
pip install ultralytics opencv-python requests

# run live detection against your webcam
python live_inference.py --weights best.pt --source 0

# or against a pre-recorded dashcam/pothole video
python live_inference.py --weights best.pt --source path/to/video.mp4
```

Then open your dashboard (`sih/frontend/urban-intelligence-gis.html`, served by the backend at
`http://localhost:8787`) in a browser — new pothole pins should appear on the map within
15 seconds of a detection (matches `POLL_INTERVAL_MS` in `app.js`).

## Notes
- **GPS is simulated** in `live_inference.py` (`simulate_gps()`) since a laptop demo has no real
  GPS feed. It jitters around a fixed starting point (edit `DEMO_ROUTE_START` to wherever you're
  demoing). Swap this for a real GPS module reading once you have actual hardware.
- **Category mapping**: `CLASS_TO_CATEGORY` in `live_inference.py` maps your model's class names
  (from Roboflow's `data.yaml`) to your backend's accepted category strings. `pothole` is already
  wired end-to-end. When you train a second class (e.g. zebra crossing, waterlogging), add it to
  this dict — the corresponding category (`missing_zebra`, `waterlog`, etc.) already exists in
  both `backend/server.js`'s `VALID_CATEGORIES` and `frontend/app.js`'s `CATEGORIES`/`ICONS`, so
  no dashboard changes are needed, just uncomment the relevant line.
- **De-duplication**: the script won't re-report the same class more than once every 5 seconds
  (`MIN_SECONDS_BETWEEN_SAME_CLASS`), so it doesn't flood the map with duplicate pins for a
  pothole the bus is driving past for several frames.
