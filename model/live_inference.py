"""
SIH 26124 — Live road-defect + congestion detection -> pushes to the GIS dashboard.

Runs TWO models against a webcam or video file:
  1. Your custom-trained YOLOv8 model (best.pt) — detects pothole,
     signboard_damaged, waterlogging. On each new detection it encodes the
     annotated frame as a base64 JPEG and POSTs an event to /api/events,
     with that image embedded directly in the `image_url` field as a
     data: URI. The photo is stored inside your Turso database alongside
     the rest of the event row — no separate file server or static
     hosting needed, which matters since your backend is deployed and
     this script runs on your own machine with no shared filesystem.
  2. A stock, pretrained YOLOv8 model (yolov8n.pt, downloaded automatically
     by Ultralytics on first run) — detects vehicles (car/bus/truck/
     motorcycle) using classes it already knows from COCO, no training
     needed. Every few seconds, the vehicle count in view is converted into
     a congestion "heatmap point" and POSTed to /api/heatmap.

Usage:
    # Local testing, against a backend running on your own machine:
    python live_inference.py --weights best.pt --source 0

    # Against your deployed backend (use its real https:// URL, not localhost):
    python live_inference.py --weights best.pt --source clip.mp4 --api-url https://sih-u5m21.sevalla.app

Requires:
    pip install ultralytics opencv-python requests
"""

import argparse
import base64
import time
import random
from collections import deque

import requests
import cv2
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_BASE_URL = "http://localhost:8787"   # overridden by --api-url at runtime; see main()
BUS_ID = "BUS-DEMO-01"                   # fake bus identity for the demo

# JPEG quality for the embedded snapshot (0-100). Lower = smaller payload,
# faster upload, but blockier image. 70 is a reasonable balance for a popup
# thumbnail; drop it further if you hit the backend's request size limit.
SNAPSHOT_JPEG_QUALITY = 70

# Map your CUSTOM model's class names (from the merged data.yaml) to the
# category strings your backend's VALID_CATEGORIES set accepts.
CLASS_TO_CATEGORY = {
    "pothole": "pothole",
    "signboard_damaged": "signboard",
    "waterlogging": "waterlog",
}

CONFIDENCE_THRESHOLD = 0.60          # ignore detections below this
MIN_SECONDS_BETWEEN_SAME_CLASS = 5   # avoid spamming the same defect every frame

# --- Vehicle density / congestion config (second, pretrained model) ---
# COCO class names for vehicles we count. yolov8n.pt already knows these,
# no training required.
VEHICLE_CLASS_NAMES = {"car", "bus", "truck", "motorcycle"}
HEATMAP_REPORT_INTERVAL_SECONDS = 8   # how often to push a congestion reading
CONGESTION_WINDOW_SIZE = 5            # rolling average over this many samples
# Vehicle count -> intensity (0-1) mapping for the heatmap. Tune these based
# on your camera's field of view: a wide-angle bus-front camera will see more
# vehicles per frame than a narrow one, so what counts as "busy" differs.
LOW_TRAFFIC_VEHICLE_COUNT = 2     # at/below this -> intensity ~0.2
HIGH_TRAFFIC_VEHICLE_COUNT = 10   # at/above this -> intensity ~1.0

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


def encode_snapshot(annotated_frame) -> str:
    """Encode the annotated frame as a base64 JPEG data URI - no disk write.

    This embeds directly into the `image_url` field the backend already
    stores as plain TEXT, and the frontend already renders as-is in
    <img src="...">. Browsers treat a data: URI exactly like a normal URL,
    so no frontend changes are needed, and the photo travels with the
    database row instead of depending on a file living on your laptop.
    """
    ok, buffer = cv2.imencode(".jpg", annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, SNAPSHOT_JPEG_QUALITY])
    if not ok:
        return None
    b64_data = base64.b64encode(buffer).decode("ascii")
    return f"data:image/jpeg;base64,{b64_data}"


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


def vehicle_count_to_intensity(vehicle_count: float) -> float:
    """Map a vehicle count to a 0-1 heatmap intensity, clamped at both ends."""
    if HIGH_TRAFFIC_VEHICLE_COUNT == LOW_TRAFFIC_VEHICLE_COUNT:
        return 1.0 if vehicle_count >= HIGH_TRAFFIC_VEHICLE_COUNT else 0.2
    span = HIGH_TRAFFIC_VEHICLE_COUNT - LOW_TRAFFIC_VEHICLE_COUNT
    raw = (vehicle_count - LOW_TRAFFIC_VEHICLE_COUNT) / span
    intensity = 0.2 + raw * 0.8  # keep a floor of 0.2 so low traffic still shows faintly
    return max(0.05, min(1.0, intensity))


def post_heatmap_point(intensity: float):
    lat, lng = simulate_gps()
    payload = {"lat": lat, "lng": lng, "intensity": round(intensity, 2), "source": "vehicle_density"}
    try:
        resp = requests.post(f"{API_BASE_URL}/api/heatmap", json=payload, timeout=3)
        if resp.status_code == 201:
            print(f"[heatmap] intensity={intensity:.2f} -> ({lat}, {lng})")
        else:
            print(f"[warn] backend rejected heatmap point: {resp.status_code} {resp.text}")
    except requests.exceptions.RequestException as e:
        print(f"[error] could not reach backend at {API_BASE_URL}: {e}")


# Optional: also raise a "congestion" event pin (not just a heatmap point)
# when traffic is consistently heavy, so it shows up in the event list too.
CONGESTION_EVENT_THRESHOLD = 0.75
MIN_SECONDS_BETWEEN_CONGESTION_EVENTS = 30
_last_congestion_event_at = 0


def maybe_post_congestion_event(intensity: float):
    global _last_congestion_event_at
    if intensity < CONGESTION_EVENT_THRESHOLD:
        return
    now = time.time()
    if now - _last_congestion_event_at < MIN_SECONDS_BETWEEN_CONGESTION_EVENTS:
        return
    post_event("congestion", intensity)
    _last_congestion_event_at = now


def main():
    global API_BASE_URL

    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, help="Path to your custom-trained best.pt")
    parser.add_argument("--source", default="0", help="Webcam index (e.g. 0) or path to a video file")
    parser.add_argument("--show", action="store_true", default=True, help="Show a live annotated window")
    parser.add_argument(
        "--api-url", default="http://localhost:8787",
        help=(
            "Base URL of your backend. Use http://localhost:8787 when testing "
            "locally, or your deployed backend's real https:// URL (e.g. "
            "https://sih-u5m21.sevalla.app) when the dashboard is deployed — "
            "otherwise saved images will link to your own laptop and nobody "
            "else's browser will be able to load them."
        ),
    )
    parser.add_argument(
        "--no-congestion", action="store_true",
        help="Disable the second (vehicle-counting) model, e.g. on slower hardware",
    )
    args = parser.parse_args()

    API_BASE_URL = args.api_url.rstrip("/")
    print(f"Reporting events to: {API_BASE_URL}")

    source = int(args.source) if args.source.isdigit() else args.source

    defect_model = YOLO(args.weights)
    print("Custom model classes:", defect_model.names)

    vehicle_model = None
    if not args.no_congestion:
        # yolov8n.pt is Ultralytics' small pretrained COCO model. It's
        # downloaded automatically the first time this runs. It already
        # knows "car", "bus", "truck", "motorcycle" - no training needed.
        vehicle_model = YOLO("yolov8n.pt")
        print("Vehicle-counting model loaded (pretrained COCO classes).")

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {source}")

    last_reported_at = {}  # class_name -> timestamp, for de-duplication
    recent_vehicle_counts = deque(maxlen=CONGESTION_WINDOW_SIZE)
    last_heatmap_report_at = 0.0

    while True:
        ok, frame = cap.read()
        if not ok:
            print("End of stream.")
            break

        # --- Pass 1: road defects (pothole / signboard / waterlogging) ---
        results = defect_model.predict(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)[0]
        annotated = results.plot()  # frame with boxes drawn, for the preview window

        for box in results.boxes:
            class_id = int(box.cls[0])
            class_name = defect_model.names[class_id]
            confidence = float(box.conf[0])

            category = CLASS_TO_CATEGORY.get(class_name)
            if category is None:
                continue  # model detected a class we haven't mapped yet

            now = time.time()
            if now - last_reported_at.get(class_name, 0) >= MIN_SECONDS_BETWEEN_SAME_CLASS:
                image_url = encode_snapshot(annotated)
                post_event(category, confidence, image_url)
                last_reported_at[class_name] = now

        # --- Pass 2: vehicle density -> congestion heatmap ---
        if vehicle_model is not None:
            vehicle_results = vehicle_model.predict(frame, conf=0.35, verbose=False)[0]
            vehicle_count = sum(
                1 for box in vehicle_results.boxes
                if vehicle_model.names[int(box.cls[0])] in VEHICLE_CLASS_NAMES
            )
            recent_vehicle_counts.append(vehicle_count)

            now = time.time()
            if now - last_heatmap_report_at >= HEATMAP_REPORT_INTERVAL_SECONDS and recent_vehicle_counts:
                avg_count = sum(recent_vehicle_counts) / len(recent_vehicle_counts)
                intensity = vehicle_count_to_intensity(avg_count)
                post_heatmap_point(intensity)
                maybe_post_congestion_event(intensity)
                last_heatmap_report_at = now

        if args.show:
            cv2.imshow("SIH 26124 - Live Detection (press q to quit)", annotated)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()