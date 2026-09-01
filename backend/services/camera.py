"""
Camera Service for IVGuard
Location: backend/services/camera.py

Handles asynchronous zero-latency video acquisition from local laptop webcam (cv2.VideoCapture(0))
or optional IP camera streams.
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

    def __init__(
        self,
        camera_source: Optional[str] = None,
        camera_index: Optional[int] = None,
        stream_url: Optional[str] = None
    ):
        self.camera_source = str(camera_source or settings.camera_source).strip().lower()
        self.camera_index = int(camera_index if camera_index is not None else settings.camera_index)
        self.stream_url = str(stream_url if stream_url is not None else settings.stream_url).strip()

        self.latest_frame: Optional[np.ndarray] = None
        self.is_connected = False
        self.is_running = False
        self.lock = threading.Lock()
        self.thread: Optional[threading.Thread] = None
        self.new_frame_event = threading.Event()
        self.connection_error: Optional[str] = None
        self._current_response: Optional[requests.Response] = None
        self._config_changed = threading.Event()

    def _normalize_stream_url(self, url: str) -> str:
        """Ensure IP Webcam URLs point to the /video MJPEG stream instead of the HTML landing page."""
        clean_url = str(url).strip()
        if not clean_url:
            return clean_url
        if clean_url.startswith("http://") or clean_url.startswith("https://"):
            if clean_url.endswith(":8080") or clean_url.endswith(":8080/"):
                clean_url = clean_url.rstrip("/") + "/video"
            elif not any(clean_url.endswith(ext) for ext in ["/video", "/mjpeg", "/shot.jpg", ".m3u8", ".mjpeg", "/feed"]):
                if ":8080" in clean_url and not clean_url.endswith("/video"):
                    clean_url = clean_url.rstrip("/") + "/video"
        return clean_url

    def set_camera_config(self, camera_source: str, camera_index: int = 0, stream_url: str = ""):
        """Dynamically update camera source (local vs ip_camera) and trigger instant reconnection."""
        normalized_url = self._normalize_stream_url(stream_url)
        with self.lock:
            self.camera_source = str(camera_source).strip().lower()
            self.camera_index = int(camera_index)
            self.stream_url = normalized_url
            self.is_connected = False
            self.connection_error = "Switching camera source..."

        if self._current_response is not None:
            try:
                self._current_response.close()
            except Exception:
                pass
        self._config_changed.set()

    def set_stream_url(self, new_url: str):
        """Legacy helper for updating stream URL or camera index string."""
        url_str = str(new_url).strip()
        if url_str.isdigit():
            self.set_camera_config(camera_source="local", camera_index=int(url_str), stream_url="")
        elif url_str.startswith("http://") or url_str.startswith("https://") or url_str.startswith("rtsp://"):
            self.set_camera_config(camera_source="ip_camera", camera_index=0, stream_url=url_str)
        elif url_str == "" or url_str == "local":
            self.set_camera_config(camera_source="local", camera_index=0, stream_url="")
        else:
            self.set_camera_config(camera_source="local", camera_index=0, stream_url=url_str)

    def start(self):
        """Start the background streaming worker thread."""
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def _worker(self):
        while self.is_running:
            self._config_changed.clear()

            if self.camera_source == "local":
                self._stream_cv2_local_webcam(self.camera_index)
            elif self.camera_source == "ip_camera" and self.stream_url:
                self._stream_http_mjpeg(self.stream_url)
            else:
                # Default fallback: local webcam 0
                self._stream_cv2_local_webcam(0)

    def _stream_cv2_local_webcam(self, index: int):
        """Local laptop webcam acquisition using cv2.VideoCapture(index) with zero-latency buffer."""
        cap = None
        try:
            print(f"[CameraService] Opening Local Webcam (index {index}) ...")
            # Try DirectShow backend on Windows first for fast capture initiation
            try:
                cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
                if not cap.isOpened():
                    cap = cv2.VideoCapture(index)
            except Exception:
                cap = cv2.VideoCapture(index)

            if cap is None or not cap.isOpened():
                self.is_connected = False
                self.connection_error = f"Cannot open local webcam at index {index}"
                print(f"[CameraService] [ERROR] Failed to open local webcam {index}")
                time.sleep(1.5)
                return

            # Set hardware capture properties for zero latency & optimal resolution
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)

            self.is_connected = True
            self.connection_error = None
            print(f"[CameraService] Local Webcam (index {index}) connected successfully.")

            while self.is_running and not self._config_changed.is_set():
                ret, frame = cap.read()
                if not ret or frame is None:
                    print(f"[CameraService] [WARN] Empty frame from webcam {index}. Retrying...")
                    time.sleep(0.05)
                    break

                with self.lock:
                    self.latest_frame = frame
                self.new_frame_event.set()
                time.sleep(0.005)  # Yield CPU to inference pipeline

        except Exception as e:
            self.is_connected = False
            self.connection_error = f"Webcam error: {str(e)}"
            print(f"[CameraService] Exception in webcam capture: {e}")
            time.sleep(1.5)
        finally:
            if cap is not None:
                try:
                    cap.release()
                except Exception:
                    pass
            self.is_connected = False

    def _stream_http_mjpeg(self, url: str):
        """Optional HTTP MJPEG network stream reader for external cameras."""
        target_url = self._normalize_stream_url(url)
        bytes_buffer = b""
        session = requests.Session()
        try:
            print(f"[CameraService] Connecting to IP Camera stream: {target_url} ...")
            response = session.get(target_url, stream=True, timeout=settings.camera_timeout)
            self._current_response = response

            if response.status_code != 200:
                self.is_connected = False
                self.connection_error = f"HTTP status {response.status_code}"
                time.sleep(1.5)
                return

            self.is_connected = True
            self.connection_error = None
            print(f"[CameraService] IP Camera connected successfully to {url}")

            for chunk in response.iter_content(chunk_size=4096):
                if not self.is_running or self._config_changed.is_set():
                    break
                if not chunk:
                    continue

                bytes_buffer += chunk

                # Robust JPEG frame extraction
                while True:
                    start_idx = bytes_buffer.find(b"\xff\xd8")
                    if start_idx == -1:
                        bytes_buffer = b""
                        break
                    end_idx = bytes_buffer.find(b"\xff\xd9", start_idx)
                    if end_idx == -1:
                        if start_idx > 0:
                            bytes_buffer = bytes_buffer[start_idx:]
                        break

                    jpg_data = bytes_buffer[start_idx : end_idx + 2]
                    bytes_buffer = bytes_buffer[end_idx + 2 :]

                    frame = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                    if frame is not None:
                        if frame.shape[0] > 720:
                            frame = cv2.resize(frame, (640, 480))
                        with self.lock:
                            self.latest_frame = frame
                            self.is_connected = True
                            self.connection_error = None
                        self.new_frame_event.set()

                if len(bytes_buffer) > 100000:
                    bytes_buffer = bytes_buffer[-20000:]

        except Exception as e:
            if not self._config_changed.is_set():
                self.is_connected = False
                self.connection_error = str(e)
                time.sleep(1.5)
        finally:
            try:
                session.close()
            except Exception:
                pass
            self._current_response = None

    def get_latest_frame(self, timeout: float = 1.0) -> Tuple[bool, Optional[np.ndarray]]:
        """Retrieve the newest available frame in a thread-safe manner."""
        with self.lock:
            if self.latest_frame is not None and self.is_connected:
                return True, self.latest_frame.copy()
        if self.new_frame_event.wait(timeout=timeout):
            with self.lock:
                if self.latest_frame is not None:
                    return True, self.latest_frame.copy()
        with self.lock:
            if self.latest_frame is not None:
                return True, self.latest_frame.copy()
        return False, None

    def generate_mjpeg_stream(self, get_annotated_frame_fn=None) -> Generator[bytes, None, None]:
        """Yields multipart MJPEG stream bytes for web browser video tags."""
        while self.is_running:
            ret, frame = self.get_latest_frame(timeout=0.5)
            if not ret or frame is None:
                # Return clean placeholder if camera is initializing/reconnecting
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                source_label = "Laptop Webcam" if self.camera_source == "local" else "External Camera"
                msg = self.connection_error or f"Connecting to {source_label}..."
                if len(msg) > 40:
                    msg = msg[:37] + "..."
                cv2.putText(
                    placeholder,
                    f"Connecting to {source_label}...",
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

            _, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    def stop(self):
        """Safely terminate camera worker thread and release hardware handles."""
        self.is_running = False
        self._config_changed.set()
        if self._current_response is not None:
            try:
                self._current_response.close()
            except Exception:
                pass
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
