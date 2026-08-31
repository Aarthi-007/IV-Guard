"""
Inference Service for IVGuard
Location: backend/services/inference.py

Manages YOLO26n model loading and ByteTrack multi-object tracking.
"""

from typing import List, Optional
import numpy as np

from backend.config import settings
from scripts.tracking.tracker import YOLOTracker, TrackedObject


class InferenceService:
    """Provides YOLO26n detection & ByteTrack tracking inference."""

    def __init__(self):
        self.model_path = settings.get_valid_model_path()
        self.tracker: Optional[YOLOTracker] = None
        self.is_loaded = False
        self.initialize_model()

    def initialize_model(self):
        """Load YOLO model and initialize ByteTrack."""
        try:
            print(f"[InferenceService] Initializing tracker with model: {self.model_path}")
            self.tracker = YOLOTracker(
                model_path=self.model_path,
                tracker_type=settings.tracker_config,
                conf_threshold=settings.conf_threshold,
                iou_threshold=settings.iou_threshold,
                imgsz=settings.inference_imgsz,
            )
            self.is_loaded = True
            print("[InferenceService] Tracker loaded successfully.")
        except Exception as e:
            print(f"[InferenceService] [ERROR] Failed to load tracker: {e}")
            self.is_loaded = False

    def track(self, frame: np.ndarray, frame_number: int) -> List[TrackedObject]:
        """Run tracking on a single frame."""
        if not self.is_loaded or self.tracker is None:
            return []
        return self.tracker.track(frame, frame_number)

    def reload_model(self, new_model_path: str):
        """Reload with new weights."""
        self.model_path = new_model_path
        self.initialize_model()
