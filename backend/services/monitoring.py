"""
Monitoring Pipeline Service for IVGuard
Location: backend/services/monitoring.py

Ties CameraService, InferenceService, DisplacementAnalyzer, and AlertManager
into a continuous background loop with telemetry broadcasting.
"""

import asyncio
import threading
import time
from typing import Optional, List, Dict, Callable
import cv2
import numpy as np

from backend.config import settings
from backend.schemas.detection import (
    BoundingBox,
    TrackedObjectPayload,
    FrameTelemetry,
    SystemStatusResponse
)
from backend.services.camera import CameraService
from backend.services.inference import InferenceService
from backend.services.alert_manager import BackendAlertManager
from scripts.tracking.displacement import DisplacementAnalyzer, TrackingStatus
from test_tracking_camera import draw_hud


class MonitoringService:
    """Core real-time processing pipeline."""

    def __init__(
        self,
        camera_service: CameraService,
        inference_service: InferenceService,
        alert_manager: BackendAlertManager
    ):
        self.camera = camera_service
        self.inference = inference_service
        self.alert_manager = alert_manager

        self.analyzer = DisplacementAnalyzer(
            init_frames=settings.init_frames,
            displacement_threshold_px=settings.displacement_threshold_px,
            consecutive_frames_threshold=settings.consecutive_frames_threshold,
            smoothing_window=settings.smoothing_window,
            grace_period_frames=settings.grace_period_frames
        )

        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.frame_number = 0
        self.current_fps = 0.0
        self.total_frames_processed = 0

        self.latest_telemetry: Optional[FrameTelemetry] = None
        self.latest_annotated_frame: Optional[np.ndarray] = None
        self.lock = threading.Lock()

        # Telemetry listeners / callbacks
        self.listeners: List[Callable[[FrameTelemetry], None]] = []

    def start(self):
        """Start camera and background processing thread."""
        if self.is_running:
            return
        self.camera.start()
        self.is_running = True
        self.thread = threading.Thread(target=self._processing_loop, daemon=True)
        self.thread.start()
        print("[MonitoringService] Background monitoring pipeline started.")

    def _processing_loop(self):
        fps_start = time.time()
        fps_counter = 0

        while self.is_running:
            ret, frame = self.camera.get_latest_frame(timeout=0.5)
            if not ret or frame is None:
                time.sleep(0.01)
                continue

            self.frame_number += 1
            self.total_frames_processed += 1
            fps_counter += 1
            now = time.time()

            if now - fps_start >= 1.0:
                self.current_fps = round(fps_counter / (now - fps_start), 1)
                fps_counter = 0
                fps_start = now

            # 1. Run Tracker
            tracked_objs = self.inference.track(frame, self.frame_number)

            # 2. Run Displacement Analyzer
            track_histories = self.analyzer.update(tracked_objs, self.frame_number, now)
            overall_status = self.analyzer.get_overall_system_status()

            # 3. Evaluate Alerts
            alert_event = self.alert_manager.evaluate_status(overall_status, track_histories)
            alert_msg = alert_event.message if alert_event else None

            # 4. Build Telemetry Payload
            active_payloads: List[TrackedObjectPayload] = []
            for obj in tracked_objs:
                th = track_histories.get(obj.track_id)
                disp = th.current_displacement_px if th else 0.0
                rel_piv = th.relative_to_piv_px if th and th.relative_to_piv_px is not None else None
                status_str = th.status.value if th else TrackingStatus.INITIALIZING.value

                x1, y1, x2, y2 = obj.bbox
                cx, cy = obj.center
                bbox_schema = BoundingBox(
                    x1=x1, y1=y1, x2=x2, y2=y2,
                    center_x=cx, center_y=cy,
                    width=x2 - x1, height=y2 - y1
                )

                active_payloads.append(
                    TrackedObjectPayload(
                        track_id=obj.track_id,
                        class_id=obj.class_id,
                        class_name=obj.class_name,
                        confidence=round(obj.confidence, 3),
                        bbox=bbox_schema,
                        center=(round(cx, 1), round(cy, 1)),
                        displacement_px=round(disp, 2),
                        relative_to_piv_px=round(rel_piv, 2) if rel_piv is not None else None,
                        status=status_str
                    )
                )

            telemetry = FrameTelemetry(
                frame_number=self.frame_number,
                timestamp=now,
                fps=self.current_fps,
                overall_status=overall_status.value,
                piv_anchor_id=self.analyzer.primary_piv_track_id,
                active_tracks=active_payloads,
                alert_message=alert_msg
            )

            # 5. Render HUD for live feed endpoint
            annotated = draw_hud(
                frame=frame.copy(),
                tracked_objects=tracked_objs,
                track_histories=track_histories,
                overall_status=overall_status,
                fps=self.current_fps,
                frame_number=self.frame_number,
                primary_piv_id=self.analyzer.primary_piv_track_id
            )

            with self.lock:
                self.latest_telemetry = telemetry
                self.latest_annotated_frame = annotated

            # 6. Notify listeners
            for listener in list(self.listeners):
                try:
                    listener(telemetry)
                except Exception as e:
                    pass

    def add_listener(self, callback: Callable[[FrameTelemetry], None]):
        """Register a callback for new telemetry frames."""
        self.listeners.append(callback)

    def remove_listener(self, callback: Callable[[FrameTelemetry], None]):
        """Unregister a telemetry callback."""
        if callback in self.listeners:
            self.listeners.remove(callback)

    def get_annotated_frame(self, frame_in=None) -> np.ndarray:
        """Get latest rendered HUD frame."""
        with self.lock:
            if self.latest_annotated_frame is not None:
                return self.latest_annotated_frame.copy()
        return np.zeros((480, 640, 3), dtype=np.uint8)

    def get_system_status(self) -> SystemStatusResponse:
        """Construct full system status summary."""
        with self.lock:
            active_cnt = len(self.latest_telemetry.active_tracks) if self.latest_telemetry else 0
            overall = self.latest_telemetry.overall_status if self.latest_telemetry else "INITIALIZING"

        return SystemStatusResponse(
            camera_source=self.camera.camera_source,
            camera_index=self.camera.camera_index,
            stream_url=self.camera.stream_url,
            camera_connected=self.camera.is_connected,
            model_loaded=self.inference.is_loaded,
            model_path=self.inference.model_path,
            tracker_type=settings.tracker_config,
            current_fps=self.current_fps,
            total_frames_processed=self.total_frames_processed,
            active_tracks_count=active_cnt,
            overall_status=overall
        )

    def generate_mjpeg_stream(self):
        """Yields live multipart MJPEG stream containing the latest annotated HUD frames."""
        import cv2
        while self.is_running:
            with self.lock:
                frame = self.latest_annotated_frame.copy() if self.latest_annotated_frame is not None else None
                is_connected = self.camera.is_connected
                source_label = "Laptop Webcam" if self.camera.camera_source == "local" else "External Camera"
                err_msg = self.camera.connection_error

            if not is_connected or frame is None:
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                msg = err_msg or f"Connecting to {source_label}..."
                if len(msg) > 40:
                    msg = msg[:37] + "..."
                cv2.putText(placeholder, f"Connecting to {source_label}...", (80, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(placeholder, msg, (80, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)
                _, jpeg = cv2.imencode('.jpg', placeholder)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
                time.sleep(0.2)
                continue

            _, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.033)

    def stop(self):
        """Stop processing loop and camera."""
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        self.camera.stop()
