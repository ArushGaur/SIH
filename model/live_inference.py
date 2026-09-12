"""
SIH 26124 — Live road-defect detection -> pushes events + photo to the GIS dashboard.

Runs a trained YOLOv8 model (best.pt from the Colab notebook) against a
webcam or video file. On each new detection it:
  1. Saves a snapshot of that frame (with the box drawn on it) to ./detections/
  2. POSTs the event to your backend's /api/events endpoint, including a
     URL pointing at that saved image, so it shows up live on the Leaflet
     map AND the popup shows the actual detection photo.

Usage:
    python live_inference.py --weights best.pt --source 0
    python live_inference.py --weights best.pt --source dashcam_clip.mp4

Requires:
    pip install ultralytics opencv-python requests

Your backend (sih/backend/server.js) must already be running, and must be
serving this script's ../model/detections/ folder at /detections (already
wired up in server.js):
    node server.js

Folder layout this expects:
    sih/
    ├── backend/   (server.js serves ../model/detections at /detections)
    ├── frontend/
    └── model/
        ├── live_inference.py   <- this file
        ├── best.pt
        └── detections/         <- created automatically, snapshots saved here
"""

import argparse
import os
import time
import random
from datetime import datetime

import requests
import cv2
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_BASE_URL = "http://localhost:8787"   # matches PORT in backend/server.js
BUS_ID = "BUS-DEMO-01"                   # fake bus identity for the demo

# Where snapshots are saved locally, and the URL prefix the backend serves
# them under (see the app.use('/detections', ...) line added to server.js).
DETECTIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "detections")
DETECTIONS_URL_PREFIX = f"{API_BASE_URL}/detections"

# Map your model's class names (from data.yaml, e.g. "pothole") to the
# category strings your backend's VALID_CATEGORIES set accepts. Extend
# this dict (and VALID_CATEGORIES in server.js) as you train more classes.
CLASS_TO_CATEGORY = {
    "pothole": "pothole",
    # "zebra_crossing_missing": "missing_zebra",
    # "waterlogging": "waterlog",
    # "damaged_signboard": "signboard",
}

CONFIDENCE_THRESHOLD = 0.60          # ignore detections below this (raised from 0.40 to cut false positives)
MIN_SECONDS_BETWEEN_SAME_CLASS = 5   # avoid spamming the same pothole every frame

# No real GPS on a laptop demo -> simulate the bus moving along a fixed
# route by walking a small path each time we detect something. Swap this
# for a real GPS module / NMEA feed reading when you have hardware.
DEMO_ROUTE_START = (25.5941, 85.1376)  # Patna, adjust to wherever you're demoing
_last_lat, _last_lng = DEMO_ROUTE_START


def simulate_gps():
    """Fake GPS: jitter slightly from the last point so pins don't all stack."""
    global _last_lat, _last_lng
    _last_lat += random.uniform(-0.0006, 0.0006)
    _last_lng += random.uniform(-0.0006, 0.0006)
    return round(_last_lat, 6), round(_last_lng, 6)


def confidence_to_severity(conf: float) -> str:
    if conf >= 0.85:
        return "High"
    if conf >= 0.60:
        return "Medium"
    return "Low"


def save_snapshot(annotated_frame, category: str) -> str:
    """Save the annotated frame (with box drawn) to disk, return a URL for it."""
    os.makedirs(DETECTIONS_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]  # ms precision, avoids collisions
    filename = f"{category}_{timestamp}.jpg"
    filepath = os.path.join(DETECTIONS_DIR, filename)
    cv2.imwrite(filepath, annotated_frame)
    return f"{DETECTIONS_URL_PREFIX}/{filename}"


def post_event(category: str, confidence: float, image_url: str = None):
    lat, lng = simulate_gps()
    payload = {
        "category": category,
        "lat": lat,
        "lng": lng,
        "confidence": round(confidence * 100),
        "severity": confidence_to_severity(confidence),
        "bus_id": BUS_ID,
        "image_url": image_url,
        "detected_at": None,  # server fills in "now"
    }
    try:
        resp = requests.post(f"{API_BASE_URL}/api/events", json=payload, timeout=3)
        if resp.status_code == 201:
            print(f"[reported] {category} conf={confidence:.2f} -> ({lat}, {lng}) photo={image_url}")
        else:
            print(f"[warn] backend rejected event: {resp.status_code} {resp.text}")
    except requests.exceptions.RequestException as e:
        print(f"[error] could not reach backend at {API_BASE_URL}: {e}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, help="Path to best.pt from Colab training")
    parser.add_argument("--source", default="0", help="Webcam index (e.g. 0) or path to a video file")
    parser.add_argument("--show", action="store_true", default=True, help="Show a live annotated window")
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source

    model = YOLO(args.weights)
    print("Loaded model classes:", model.names)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")

    last_reported_at = {}  # class_name -> timestamp, for de-duplication

    while True:
        ok, frame = cap.read()
        if not ok:
            print("End of stream.")
            break

        results = model.predict(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)[0]
        annotated = results.plot()  # frame with boxes drawn, for the preview window

        for box in results.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            confidence = float(box.conf[0])

            category = CLASS_TO_CATEGORY.get(class_name)
            if category is None:
                continue  # model detected a class we haven't mapped yet

            now = time.time()
            if now - last_reported_at.get(class_name, 0) >= MIN_SECONDS_BETWEEN_SAME_CLASS:
                image_url = save_snapshot(annotated, category)
                post_event(category, confidence, image_url)
                last_reported_at[class_name] = now

        if args.show:
            cv2.imshow("SIH 26124 - Live Detection (press q to quit)", annotated)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()