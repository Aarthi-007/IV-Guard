import sys
import cv2
import numpy as np
import requests

DEFAULT_URL = "0"  # Default: local laptop webcam


def main():
    stream_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"Connecting to camera stream at {stream_url} ...")

    # Local webcam (0, 1) or video file
    if stream_url.isdigit() or not (stream_url.startswith("http://") or stream_url.startswith("https://") or stream_url.startswith("rtsp://")):
        src = int(stream_url) if stream_url.isdigit() else stream_url
        cap = cv2.VideoCapture(src)
        if not cap.isOpened():
            print(f"[ERROR] Failed to open video source: {src}")
            return
        print(f"[SUCCESS] Video source {src} opened successfully! Press 'q' to exit.")
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            cv2.imshow("IVGuard - Live Camera", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
        cap.release()
        cv2.destroyAllWindows()
        return

    # HTTP MJPEG Stream
    try:
        stream_response = requests.get(stream_url, stream=True, timeout=10)
        if stream_response.status_code != 200:
            print(f"[ERROR] Failed to connect: HTTP status {stream_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Connection error: {e}")
        return

    print("[SUCCESS] Camera stream connected successfully!")
    print("Press 'q' inside the video window to exit.")

    bytes_buffer = b""

    try:
        for chunk in stream_response.iter_content(chunk_size=4096):
            if not chunk:
                print("Stream ended.")
                break

            bytes_buffer += chunk

            last_frame = None
            while True:
                start_idx = bytes_buffer.find(b"\xff\xd8")
                if start_idx == -1:
                    bytes_buffer = b""
                    break

                if start_idx > 0:
                    bytes_buffer = bytes_buffer[start_idx:]

                end_idx = bytes_buffer.find(b"\xff\xd9")
                if end_idx != -1:
                    last_frame = bytes_buffer[: end_idx + 2]
                    bytes_buffer = bytes_buffer[end_idx + 2 :]
                else:
                    break

            if last_frame is not None:
                frame = cv2.imdecode(np.frombuffer(last_frame, dtype=np.uint8), cv2.IMREAD_COLOR)
                if frame is not None:
                    cv2.imshow("IVGuard - Live Camera", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("Quitting by user request...")
                break

    except KeyboardInterrupt:
        print("\nInterrupted by user.")
    except Exception as e:
        print(f"[ERROR] Error while reading stream: {e}")
    finally:
        stream_response.close()
        cv2.destroyAllWindows()
        print("Camera stream closed.")


if __name__ == "__main__":
    main()