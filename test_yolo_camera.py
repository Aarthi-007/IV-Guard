import sys
from pathlib import Path
import cv2
import numpy as np
import requests
from ultralytics import YOLO

STREAM_URL = "0"
TRAINED_PATH = "models/trained/ivguard_yolo26n_best.pt"
MODEL_NAME = TRAINED_PATH if Path(TRAINED_PATH).exists() else "models/pretrained/yolo26n.pt"


def main():
    stream_url = sys.argv[1] if len(sys.argv) > 1 else STREAM_URL
    print("=" * 60)
    print("  IVGuard - Live YOLO26n Detection Test (Local Webcam / IP Stream)")
    print("=" * 60)

    # 1. Load YOLO26n Model
    print(f"📦 Loading model: {MODEL_NAME} ...")
    try:
        model = YOLO(MODEL_NAME)
        print(f"✅ Model {MODEL_NAME} loaded successfully!")
        print(f"   Classes: {model.names}")
    except Exception as e:
        print(f"❌ Failed to load model {MODEL_NAME}: {e}")
        return

    # 2. Open Camera
    if stream_url.isdigit() or not (stream_url.startswith("http://") or stream_url.startswith("https://")):
        src = int(stream_url) if stream_url.isdigit() else stream_url
        print(f"📡 Opening local camera: {src} ...")
        cap = cv2.VideoCapture(src)
        if not cap.isOpened():
            print(f"❌ Cannot open camera index: {src}")
            return

        print("✅ Local camera opened. Press 'q' to exit.")
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame, verbose=False)
            annotated = results[0].plot()
            cv2.imshow("IVGuard - Live YOLO26n Detection", annotated)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()
        print("Camera closed.")
        return

    # HTTP MJPEG Stream
    print(f"📡 Connecting to stream at {stream_url} ...")
    try:
        stream_response = requests.get(stream_url, stream=True, timeout=10)
        if stream_response.status_code != 200:
            print(f"❌ Connection failed: HTTP status {stream_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return

    print("✅ Camera stream connected. Press 'q' to exit.")
    bytes_buffer = b""

    try:
        for chunk in stream_response.iter_content(chunk_size=1024):
            if not chunk:
                break
            bytes_buffer += chunk

            start_idx = bytes_buffer.find(b"\xff\xd8")
            end_idx = bytes_buffer.find(b"\xff\xd9")

            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                jpg_data = bytes_buffer[start_idx : end_idx + 2]
                bytes_buffer = bytes_buffer[end_idx + 2 :]

                frame = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is not None:
                    results = model(frame, verbose=False)
                    annotated_frame = results[0].plot()
                    cv2.imshow("IVGuard - Live YOLO26n Detection", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except KeyboardInterrupt:
        pass
    finally:
        stream_response.close()
        cv2.destroyAllWindows()
        print("Camera stream closed.")


if __name__ == "__main__":
    main()
