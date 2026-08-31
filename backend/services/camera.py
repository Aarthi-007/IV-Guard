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
    """Threaded camera reader ensuring zero-latency real-time video acquisition with auto-reconnect."""

    def __init__(self, stream_url: Optional[str] = None):
        self.stream_url = str(stream_url or settings.stream_url).strip()
        self.latest_frame: Optional[np.ndarray] = None
        self.is_connected = False
        self.is_running = False
        self.lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None
        self.new_frame_event = threading.Event()
        self.connection_error: Optional[str] = None
        self._current_response: Optional[requests.Response] = None
        self._url_changed = threading.Event()

    def set_stream_url(self, new_url: str):
        """Dynamically update stream URL and trigger instant reconnection."""
        new_url = str(new_url).strip()
        if not new_url:
            return
        with self.lock:
            if self.stream_url == new_url:
                return
            self.stream_url = new_url
            self.is_connected = False
            self.connection_error = "Reconnecting to new stream URL..."
            
        # Close existing HTTP response to break active blocking iter_content
        if self._current_response is not None:
            try:
                self._current_response.close()
            except Exception:
                pass
        self._url_changed.set()

    def start(self):
        """Start the background streaming worker."""
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def _worker(self):
        while self.is_running:
            self._url_changed.clear()
            target_url = self.stream_url

            # 1. Check if source is a numeric local webcam (e.g. "0", "1") or local video file
            is_numeric_cam = target_url.isdigit()
            is_local_video = not (target_url.startswith("http://") or target_url.startswith("https://") or target_url.startswith("rtsp://"))

            if is_numeric_cam or is_local_video:
                self._stream_cv2_capture(int(target_url) if is_numeric_cam else target_url)
            else:
                self._stream_http_mjpeg(target_url)

    def _stream_http_mjpeg(self, url: str):
        bytes_buffer = b""
        session = requests.Session()
        try:
            print(f"[CameraService] Connecting to HTTP stream: {url} ...")
            response = session.get(url, stream=True, timeout=settings.camera_timeout)
            self._current_response = response

            if response.status_code != 200:
                self.is_connected = False
                self.connection_error = f"HTTP status {response.status_code}"
                time.sleep(1.5)
                return

            self.is_connected = True
            self.connection_error = None
            print(f"[CameraService] Connected successfully to {url}")

            for chunk in response.iter_content(chunk_size=4096):
                if not self.is_running or self._url_changed.is_set():
                    break
                if not chunk:
                    continue

                bytes_buffer += chunk

                # Robust JPEG frame extractor
                last_frame_bytes = None
                while True:
                    start_idx = bytes_buffer.find(b"\xff\xd8")
                    if start_idx == -1:
                        # No SOI marker; clear buffer to avoid accumulating garbage
                        bytes_buffer = b""
                        break

                    # Trim leading garbage before SOI marker
                    if start_idx > 0:
                        bytes_buffer = bytes_buffer[start_idx:]

                    end_idx = bytes_buffer.find(b"\xff\xd9")
                    if end_idx != -1:
                        last_frame_bytes = bytes_buffer[: end_idx + 2]
                        bytes_buffer = bytes_buffer[end_idx + 2 :]
                    else:
                        break

                if last_frame_bytes is not None:
                    frame = cv2.imdecode(np.frombuffer(last_frame_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
                    if frame is not None:
                        with self.lock:
                            self.latest_frame = frame
                        self.new_frame_event.set()

                # Keep buffer bounded to prevent memory growth
                if len(bytes_buffer) > 100000:
                    bytes_buffer = bytes_buffer[-20000:]

        except Exception as e:
            if not self._url_changed.is_set():
                self.is_connected = False
                self.connection_error = str(e)
                time.sleep(1.5)
        finally:
            try:
                session.close()
            except Exception:
                pass
            self._current_response = None

    def _stream_cv2_capture(self, source):
        """Fallback stream reader using cv2.VideoCapture for local webcams or video files."""
        try:
            print(f"[CameraService] Opening OpenCV VideoCapture source: {source} ...")
            cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                self.is_connected = False
                self.connection_error = f"Cannot open capture source: {source}"
                time.sleep(1.5)
                return

            self.is_connected = True
            self.connection_error = None
            print(f"[CameraService] Capture source opened successfully.")

            while self.is_running and not self._url_changed.is_set():
                ret, frame = cap.read()
                if not ret or frame is None:
                    # If video file reached end, loop it
                    if isinstance(source, str):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    break

                with self.lock:
                    self.latest_frame = frame
                self.new_frame_event.set()
                time.sleep(0.015)  # Cap loop rate for local files

            cap.release()
        except Exception as e:
            self.is_connected = False
            self.connection_error = str(e)
            time.sleep(1.5)

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
                msg = self.connection_error or f"Connecting to {self.stream_url}..."
                if len(msg) > 40:
                    msg = msg[:37] + "..."
                cv2.putText(
                    placeholder,
                    "Connecting to Camera Stream...",
                    (80, 220),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2
                )
                cv2.putText(
                    placeholder,
                    msg,
                    (80, 260),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 165, 255),
                    1
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
        self._url_changed.set()
        if self._current_response is not None:
            try:
                self._current_response.close()
            except Exception:
                pass
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
