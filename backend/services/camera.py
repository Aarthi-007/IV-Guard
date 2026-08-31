"""
Camera Service for IVGuard
Location: backend/services/camera.py

Handles asynchronous zero-latency MJPEG stream acquisition from the IP Webcam.
Provides thread-safe access to raw and annotated frames for REST, WebSocket, and video endpoints.
"""

import threading
import time
from typing import Optional, Tuple, Generator
import cv2
import numpy as np
import requests

from backend.config import settings


class CameraService:
    """Threaded IP Webcam reader ensuring zero-latency real-time video acquisition."""

    def __init__(self, stream_url: Optional[str] = None):
        self.stream_url = stream_url or settings.stream_url
        self.latest_frame: Optional[np.ndarray] = None
        self.is_connected = False
        self.is_running = False
        self.lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None
        self.new_frame_event = threading.Event()
        self.connection_error: Optional[str] = None

    def start(self):
        """Start the background streaming worker."""
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def _worker(self):
        while self.is_running:
            bytes_buffer = b""
            try:
                print(f"[CameraService] Connecting to {self.stream_url} ...")
                response = requests.get(self.stream_url, stream=True, timeout=settings.camera_timeout)
                if response.status_code != 200:
                    self.is_connected = False
                    self.connection_error = f"HTTP status {response.status_code}"
                    time.sleep(2.0)
                    continue

                self.is_connected = True
                self.connection_error = None
                print(f"[CameraService] Connected successfully to {self.stream_url}")

                for chunk in response.iter_content(chunk_size=2048):
                    if not self.is_running:
                        break
                    if not chunk:
                        continue

                    bytes_buffer += chunk

                    # Extract latest JPEG
                    last_frame_bytes = None
                    while True:
                        start_idx = bytes_buffer.find(b"\xff\xd8")
                        end_idx = bytes_buffer.find(b"\xff\xd9")
                        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                            last_frame_bytes = bytes_buffer[start_idx : end_idx + 2]
                            bytes_buffer = bytes_buffer[end_idx + 2 :]
                        else:
                            break

                    if last_frame_bytes is not None:
                        frame = cv2.imdecode(np.frombuffer(last_frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
                        if frame is not None:
                            with self.lock:
                                self.latest_frame = frame
                            self.new_frame_event.set()

                    if len(bytes_buffer) > 100000:
                        bytes_buffer = bytes_buffer[-20000:]

            except Exception as e:
                self.is_connected = False
                self.connection_error = str(e)
                time.sleep(2.0)

    def get_latest_frame(self, timeout: float = 1.0) -> Tuple[bool, Optional[np.ndarray]]:
        """Retrieve the newest frame."""
        if self.new_frame_event.wait(timeout=timeout):
            self.new_frame_event.clear()
            with self.lock:
                if self.latest_frame is not None:
                    return True, self.latest_frame.copy()
        return False, None

    def generate_mjpeg_stream(self, get_annotated_frame_fn=None) -> Generator[bytes, None, None]:
        """Yields multipart MJPEG stream bytes for web browser video tags."""
        while self.is_running:
            ret, frame = self.get_latest_frame(timeout=0.5)
            if not ret or frame is None:
                # Return placeholder if camera offline
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(
                    placeholder,
                    "Connecting to Camera Stream...",
                    (120, 240),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2
                )
                _, jpeg = cv2.imencode('.jpg', placeholder)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
                time.sleep(0.5)
                continue

            if get_annotated_frame_fn is not None:
                frame = get_annotated_frame_fn(frame)

            _, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    def stop(self):
        """Safely terminate camera worker thread."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
