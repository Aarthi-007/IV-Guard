"""
IVGuard - Real-time YOLO26n Object Tracking & Image-Space Displacement Test
Location: test_tracking_camera.py

Features:
- Threaded zero-latency MJPEG stream reader (eliminates buffer lag)
- YOLO26n with ByteTrack tracking via Ultralytics
- Image-space displacement & relative PIV-TUBE distance calculation
- Real-time HUD overlay and CSV session logging
"""

import csv
import math
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple
import cv2
import numpy as np
import requests

from scripts.tracking.tracker import YOLOTracker, TrackedObject
from scripts.tracking.displacement import DisplacementAnalyzer, TrackHistory, TrackingStatus

# -----------------------------------------------------------------------------
# Configuration Constants
# -----------------------------------------------------------------------------
STREAM_URL = "0"  # Default: local laptop webcam index 0
MODEL_PATH = "models/trained/ivguard_yolo26n_best.pt" if Path("models/trained/ivguard_yolo26n_best.pt").exists() else "models/pretrained/yolo26n.pt"
TRACKER_CONFIG = "bytetrack.yaml"
CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.5
INFERENCE_IMGSZ = 480            # 480p inference size for smooth CPU performance (can set 640)

# Displacement & Noise Parameters
INIT_FRAMES = 30                 # Stable frames for reference baseline calibration
DISPLACEMENT_THRESHOLD_PX = 15.0  # Image-space pixel movement threshold
CONSECUTIVE_FRAMES_THRESH = 10   # Sustained frames needed to trigger MOVEMENT DETECTED
SMOOTHING_WINDOW = 5             # Moving average window for centroid jitter reduction

# Color Palette (BGR)
COLOR_PIV = (255, 144, 30)       # Cyan / Dodger Blue
COLOR_TUBE = (0, 165, 255)       # Amber / Orange
COLOR_DEFAULT = (200, 200, 200)  # Light Gray
COLOR_GREEN = (0, 220, 0)        # Stable
COLOR_RED = (0, 50, 255)         # Movement Detected
COLOR_YELLOW = (0, 215, 255)     # Initializing
COLOR_GRAY = (128, 128, 128)     # Lost Track


class ThreadedMJPEGReader:
    """
    Background worker thread that continuously consumes camera feeds (HTTP MJPEG, local webcam index, or video file)
    and stores only the most recent frame, eliminating network buffer buildup and lag.
    """

    def __init__(self, stream_url: str):
        self.stream_url = str(stream_url).strip()
        self.latest_frame = None
        self.is_running = False
        self.lock = threading.Lock()
        self.thread = None
        self.new_frame_event = threading.Event()
        self.connected_event = threading.Event()
        self.connection_error = None

    def start(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._stream_worker, daemon=True)
        self.thread.start()
        # Wait up to 6 seconds for initial connection
        if not self.connected_event.wait(timeout=6.0):
            if self.connection_error:
                raise ConnectionError(self.connection_error)
            raise TimeoutError(f"Timed out waiting for camera stream at {self.stream_url}")
        return self

    def _stream_worker(self):
        target = self.stream_url
        is_numeric = target.isdigit()
        is_local = not (target.startswith("http://") or target.startswith("https://") or target.startswith("rtsp://"))

        if is_numeric or is_local:
            self._worker_cv2(int(target) if is_numeric else target)
        else:
            self._worker_http(target)

    def _worker_http(self, url: str):
        bytes_buffer = b""
        session = requests.Session()
        try:
            stream_response = session.get(url, stream=True, timeout=10)
            if stream_response.status_code != 200:
                self.connection_error = f"HTTP status {stream_response.status_code}"
                self.connected_event.set()
                return

            self.connected_event.set()

            for chunk in stream_response.iter_content(chunk_size=4096):
                if not self.is_running:
                    break
                if not chunk:
                    continue

                bytes_buffer += chunk

                # Robust extraction of latest full JPEG frame
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
                        jpg_data = bytes_buffer[: end_idx + 2]
                        bytes_buffer = bytes_buffer[end_idx + 2 :]
                        last_frame = jpg_data
                    else:
                        break

                if last_frame is not None:
                    decoded = cv2.imdecode(np.frombuffer(last_frame, dtype=np.uint8), cv2.IMREAD_COLOR)
                    if decoded is not None:
                        with self.lock:
                            self.latest_frame = decoded
                        self.new_frame_event.set()

                if len(bytes_buffer) > 100000:
                    bytes_buffer = bytes_buffer[-20000:]

        except Exception as e:
            self.connection_error = str(e)
            self.connected_event.set()
        finally:
            try:
                session.close()
            except Exception:
                pass
            self.is_running = False

    def _worker_cv2(self, source):
        try:
            cap = cv2.VideoCapture(source)
            if not cap.isOpened():
                self.connection_error = f"Cannot open capture source: {source}"
                self.connected_event.set()
                return

            self.connected_event.set()
            while self.is_running:
                ret, frame = cap.read()
                if not ret or frame is None:
                    if isinstance(source, str):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue
                    break

                with self.lock:
                    self.latest_frame = frame
                self.new_frame_event.set()
                time.sleep(0.015)

            cap.release()
        except Exception as e:
            self.connection_error = str(e)
            self.connected_event.set()
        finally:
            self.is_running = False

    def read_latest(self, timeout=1.0) -> Tuple[bool, Optional[np.ndarray]]:
        """Fetch the freshest available frame with zero latency."""
        if self.new_frame_event.wait(timeout=timeout):
            self.new_frame_event.clear()
            with self.lock:
                if self.latest_frame is not None:
                    return True, self.latest_frame.copy()
        return False, None

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)


def get_class_color(class_name: str, class_id: int) -> Tuple[int, int, int]:
    """Return distinct color for PIV vs TUBE."""
    c_lower = class_name.lower()
    if "piv" in c_lower or "catheter" in c_lower or class_id == 0:
        return COLOR_PIV
    elif "tube" in c_lower or class_id == 1:
        return COLOR_TUBE
    return COLOR_DEFAULT


def get_status_color(status: TrackingStatus) -> Tuple[int, int, int]:
    """Return color matching tracking status badge."""
    if status == TrackingStatus.STABLE:
        return COLOR_GREEN
    elif status == TrackingStatus.MOVEMENT_DETECTED:
        return COLOR_RED
    elif status == TrackingStatus.INITIALIZING:
        return COLOR_YELLOW
    return COLOR_GRAY


def draw_hud(
    frame: np.ndarray,
    tracked_objects: list,
    track_histories: Dict[int, TrackHistory],
    overall_status: TrackingStatus,
    fps: float,
    frame_number: int,
    primary_piv_id: Optional[int]
) -> np.ndarray:
    """Renders visual bounding boxes, displacement overlays, and HUD banner."""
    h, w, _ = frame.shape
    overlay = frame.copy()

    # Find anchor PIV position for drawing connecting lines
    piv_center = None
    if primary_piv_id and primary_piv_id in track_histories:
        piv_track = track_histories[primary_piv_id]
        if piv_track.smoothed_center:
            piv_center = (int(piv_track.smoothed_center[0]), int(piv_track.smoothed_center[1]))

    # 1. Draw Detections, Trails, and Displacements
    for obj in tracked_objects:
        tid = obj.track_id
        track = track_histories.get(tid)
        color = get_class_color(obj.class_name, obj.class_id)
        x1, y1, x2, y2 = obj.bbox
        cx, cy = int(obj.center[0]), int(obj.center[1])

        # Bounding box
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)

        # Centroid dot
        cv2.circle(overlay, (cx, cy), 4, color, -1)

        # Position Trail (last 15 points)
        if track and len(track.positions) > 1:
            pts = [(int(p[1]), int(p[2])) for p in list(track.positions)[-15:]]
            for i in range(1, len(pts)):
                cv2.line(overlay, pts[i - 1], pts[i], color, 1, cv2.LINE_AA)

        # Relative Distance Line to PIV Anchor
        if piv_center and ("tube" in obj.class_name.lower() or obj.class_id == 1):
            cv2.line(overlay, (cx, cy), piv_center, (200, 200, 200), 1, cv2.LINE_AA)
            if track and track.relative_to_piv_px is not None:
                mid_x = (cx + piv_center[0]) // 2
                mid_y = (cy + piv_center[1]) // 2
                cv2.putText(
                    overlay,
                    f"Rel: {track.relative_to_piv_px:.1f}px",
                    (mid_x + 5, mid_y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.38,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA
                )

        # Tag Header (Class + Track ID + Confidence)
        tag_text = f"{obj.class_name} #{tid} ({obj.confidence:.2f})"
        (tw, th), _ = cv2.getTextSize(tag_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        tag_y1 = max(0, y1 - th - 6)
        cv2.rectangle(overlay, (x1, tag_y1), (x1 + tw + 6, y1), color, -1)
        cv2.putText(overlay, tag_text, (x1 + 3, y1 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

        # Displacement Info under Bounding Box
        if track:
            status_color = get_status_color(track.status)
            disp_str = f"Disp: {track.current_displacement_px:.1f}px [{track.status.value}]"
            cv2.putText(
                overlay,
                disp_str,
                (x1, min(h - 5, y2 + 14)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.38,
                status_color,
                1,
                cv2.LINE_AA
            )

    # 2. Top Status HUD Bar
    cv2.rectangle(overlay, (0, 0), (w, 42), (25, 25, 25), -1)
    
    # Title & FPS
    cv2.putText(
        overlay,
        f"IVGuard - YOLO26n Tracking | FPS: {fps:.1f} | Frame: {frame_number}",
        (10, 18),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.45,
        (220, 220, 220),
        1,
        cv2.LINE_AA
    )
    
    # Subtitle: Image-space notice
    cv2.putText(
        overlay,
        "Mode: Image-Space Displacement (px) | Zero-Latency Stream",
        (10, 34),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.35,
        (160, 160, 160),
        1,
        cv2.LINE_AA
    )

    # Overall Status Badge (Top Right)
    badge_text = f" STATUS: {overall_status.value} "
    badge_color = get_status_color(overall_status)
    (bw, bh), _ = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
    badge_x = w - bw - 15
    cv2.rectangle(overlay, (badge_x, 8), (badge_x + bw, 34), badge_color, -1)
    cv2.putText(
        overlay,
        badge_text,
        (badge_x, 26),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (0, 0, 0) if overall_status != TrackingStatus.MOVEMENT_DETECTED else (255, 255, 255),
        2,
        cv2.LINE_AA
    )

    # Blend overlay slightly for clean look
    cv2.addWeighted(overlay, 0.92, frame, 0.08, 0, frame)
    return frame


def main():
    stream_url = sys.argv[1] if len(sys.argv) > 1 else STREAM_URL
    print("=" * 65)
    print("  IVGuard - YOLO26n Real-Time Object Tracking & Displacement Test")
    print("=" * 65)
    print(f"  Model:       {MODEL_PATH}")
    print(f"  Camera:      {stream_url}")
    print(f"  Tracker:     {TRACKER_CONFIG} (ByteTrack)")
    print(f"  Inference:   imgsz={INFERENCE_IMGSZ}")
    print(f"  Classes:     PIV (0), TUBE (1)")
    print(f"  Mode:        Image-Space Displacement (px) [Zero-Latency]")
    print("=" * 65)

    # 1. Initialize Tracker & Displacement Analyzer
    try:
        tracker = YOLOTracker(
            model_path=MODEL_PATH,
            tracker_type=TRACKER_CONFIG,
            conf_threshold=CONF_THRESHOLD,
            iou_threshold=IOU_THRESHOLD,
            imgsz=INFERENCE_IMGSZ,
            class_names_override={0: "PIV", 1: "TUBE"}
        )
    except Exception as e:
        print(f"[ERROR] Failed to initialize YOLO26n tracker: {e}")
        return

    analyzer = DisplacementAnalyzer(
        init_frames=INIT_FRAMES,
        displacement_threshold_px=DISPLACEMENT_THRESHOLD_PX,
        consecutive_frames_threshold=CONSECUTIVE_FRAMES_THRESH,
        smoothing_window=SMOOTHING_WINDOW
    )

    # 2. Setup CSV Logger
    log_dir = Path("results/tracking")
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file_path = log_dir / f"tracking_log_{timestamp_str}.csv"
    csv_file = open(csv_file_path, mode="w", newline="", encoding="utf-8")
    csv_writer = csv.writer(csv_file)
    csv_writer.writerow([
        "timestamp", "frame", "track_id", "class", "confidence",
        "center_x", "center_y", "displacement_px", "relative_to_piv_px", "status"
    ])
    print(f"📊 Logging tracking telemetry to: {csv_file_path}")

    # 3. Start Zero-Latency Threaded Stream Reader
    print(f"📡 Connecting to camera stream at {stream_url} ...")
    try:
        stream_reader = ThreadedMJPEGReader(stream_url).start()
    except Exception as e:
        print(f"[ERROR] Camera connection error: {e}")
        csv_file.close()
        return

    print("[OK] Camera stream connected with zero-latency buffer!")
    print("[INFO] Press 'q' inside the video window to stop.")
    print("-" * 65)

    frame_number = 0
    fps_start_time = time.time()
    fps_frame_count = 0
    current_fps = 0.0

    try:
        while True:
            ret, frame = stream_reader.read_latest(timeout=1.0)
            if not ret or frame is None:
                if not stream_reader.is_running:
                    print("[WARN] Camera stream ended.")
                    break
                continue

            frame_number += 1
            fps_frame_count += 1
            now = time.time()

            # Calculate smoothed FPS
            if now - fps_start_time >= 1.0:
                current_fps = fps_frame_count / (now - fps_start_time)
                fps_frame_count = 0
                fps_start_time = now

            # Run ByteTrack Tracking on Frame
            tracked_objects = tracker.track(frame, frame_number)

            # Update Displacement Analyzer
            track_histories = analyzer.update(tracked_objects, frame_number, now)
            overall_status = analyzer.get_overall_system_status()

            # Log to CSV
            for obj in tracked_objects:
                th = track_histories.get(obj.track_id)
                disp = th.current_displacement_px if th else 0.0
                rel_piv = th.relative_to_piv_px if th and th.relative_to_piv_px is not None else ""
                st = th.status.value if th else TrackingStatus.INITIALIZING.value

                csv_writer.writerow([
                    f"{now:.3f}",
                    frame_number,
                    obj.track_id,
                    obj.class_name,
                    f"{obj.confidence:.3f}",
                    f"{obj.center[0]:.1f}",
                    f"{obj.center[1]:.1f}",
                    f"{disp:.2f}",
                    f"{rel_piv}",
                    st
                ])

            # Periodic Console Summary (every 60 frames ~ 2s)
            if frame_number % 60 == 0:
                summary_parts = []
                for obj in tracked_objects:
                    th = track_histories.get(obj.track_id)
                    disp_val = th.current_displacement_px if th else 0.0
                    st_val = th.status.value if th else "INIT"
                    rel_str = f" | rel_piv={th.relative_to_piv_px:.1f}px" if (th and th.relative_to_piv_px is not None) else ""
                    summary_parts.append(f"{obj.class_name} #{obj.track_id}: disp={disp_val:.1f}px [{st_val}]{rel_str}")
                
                if summary_parts:
                    print(f"[Frame {frame_number:05d} | {current_fps:.1f} FPS] " + " | ".join(summary_parts))
                else:
                    print(f"[Frame {frame_number:05d} | {current_fps:.1f} FPS] No active tracks | Status: {overall_status.value}")

            # Draw Visual Overlays & Display
            annotated_frame = draw_hud(
                frame=frame,
                tracked_objects=tracked_objects,
                track_histories=track_histories,
                overall_status=overall_status,
                fps=current_fps,
                frame_number=frame_number,
                primary_piv_id=analyzer.primary_piv_track_id
            )

            cv2.imshow("IVGuard - Live YOLO26n Tracking & Displacement", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                print("\n[INFO] Exit requested by user.")
                break

    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by keyboard.")
    except Exception as e:
        print(f"\n[ERROR] Stream processing exception: {e}")
    finally:
        stream_reader.stop()
        csv_file.close()
        cv2.destroyAllWindows()
        print(f"[OK] Stream closed. Session telemetry saved to: {csv_file_path}")


if __name__ == "__main__":
    main()
