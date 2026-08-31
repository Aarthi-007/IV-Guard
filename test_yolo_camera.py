import cv2
import numpy as np
import requests
from ultralytics import YOLO

STREAM_URL = "http://192.168.1.9:8080/video"
MODEL_NAME = "yolo26n.pt"


def main():
    print("=" * 60)
    print("  IVGuard - Pretrained YOLO26n Live Stream Detection Test")
    print("=" * 60)

    # 1. Load Pretrained YOLO26n Model
    print(f"📦 Loading model: {MODEL_NAME} ...")
    try:
        model = YOLO(MODEL_NAME)
        print(f"✅ Model {MODEL_NAME} loaded successfully!")
    except Exception as e:
        print(f"❌ Failed to load model {MODEL_NAME}: {e}")
        return

    # 2. Connect to IP Webcam Stream via Requests
    print(f"📡 Connecting to camera stream at {STREAM_URL} ...")
    try:
        stream_response = requests.get(STREAM_URL, stream=True, timeout=10)
        if stream_response.status_code != 200:
            print(f"❌ Connection failed: HTTP status {stream_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return

    print("✅ Camera stream connected successfully!")
    print("🚀 Running YOLO26n inference in real-time...")
    print("ℹ️  Click on the video window and press 'q' to exit.")
    print("-" * 60)

    bytes_buffer = b""

    try:
        # Read stream incrementally
        for chunk in stream_response.iter_content(chunk_size=1024):
            if not chunk:
                print("❌ Stream ended.")
                break

            bytes_buffer += chunk

            # Detect JPEG Start of Image (SOI) and End of Image (EOI) markers
            start_idx = bytes_buffer.find(b"\xff\xd8")
            end_idx = bytes_buffer.find(b"\xff\xd9")

            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                # Extract the complete JPEG frame
                jpg_data = bytes_buffer[start_idx : end_idx + 2]
                bytes_buffer = bytes_buffer[end_idx + 2 :]

                # Decode into OpenCV BGR frame
                frame = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)

                if frame is not None:
                    # Run YOLO26n inference on the frame
                    results = model(frame, verbose=False)

                    # Render detections (bounding boxes, class labels, confidence scores)
                    annotated_frame = results[0].plot()

                    # Display the annotated frame
                    cv2.imshow("IVGuard - Live YOLO26n Detection", annotated_frame)

                # Exit when 'q' key is pressed
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    print("\nQuitting by user request...")
                    break

    except KeyboardInterrupt:
        print("\nInterrupted by user.")
    except Exception as e:
        print(f"❌ Error during stream processing: {e}")
    finally:
        stream_response.close()
        cv2.destroyAllWindows()
        print("✅ Camera stream and OpenCV windows closed.")


if __name__ == "__main__":
    main()
