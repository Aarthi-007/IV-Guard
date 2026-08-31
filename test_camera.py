import cv2
import numpy as np
import requests

STREAM_URL = "http://192.168.1.9:8080/video"


def main():
    print(f"Connecting to camera stream at {STREAM_URL} ...")
    try:
        # Open HTTP stream with stream=True
        stream_response = requests.get(STREAM_URL, stream=True, timeout=10)
        if stream_response.status_code != 200:
            print(f"❌ Failed to connect: HTTP status {stream_response.status_code}")
            return
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")
        return

    print("✅ Camera stream connected successfully!")
    print("Press 'q' inside the video window to exit.")

    bytes_buffer = b""

    try:
        # Read stream incrementally
        for chunk in stream_response.iter_content(chunk_size=1024):
            if not chunk:
                print("❌ Stream ended.")
                break

            bytes_buffer += chunk

            # Find JPEG SOI (Start of Image) and EOI (End of Image) markers
            start_idx = bytes_buffer.find(b"\xff\xd8")
            end_idx = bytes_buffer.find(b"\xff\xd9")

            # Check if a complete JPEG frame is present
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                # Extract the full JPEG binary data
                jpg_data = bytes_buffer[start_idx : end_idx + 2]
                # Retain remaining bytes in the buffer for the next frame
                bytes_buffer = bytes_buffer[end_idx + 2 :]

                # Decode JPEG frame to OpenCV image array
                frame = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)

                if frame is not None:
                    cv2.imshow("IVGuard - Live Phone Camera", frame)

                # Press 'q' to quit
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    print("Quitting by user request...")
                    break

    except KeyboardInterrupt:
        print("\nInterrupted by user.")
    except Exception as e:
        print(f"❌ Error while reading stream: {e}")
    finally:
        stream_response.close()
        cv2.destroyAllWindows()
        print("Camera stream closed.")


if __name__ == "__main__":
    main()