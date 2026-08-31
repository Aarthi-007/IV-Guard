"""
Object Tracker Module for IVGuard
Location: scripts/tracking/tracker.py

Integrates YOLO26n with ByteTrack tracking via Ultralytics.
Maintains persistent track IDs, bounding boxes, confidences, and center coordinates across frames.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict
from pathlib import Path
import numpy as np
from ultralytics import YOLO


@dataclass
class TrackedObject:
    """Represents a single tracked object in the current video frame."""
    track_id: int
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2) in pixel space
    center: Tuple[float, float]      # (center_x, center_y) in pixel space
    frame_number: int


class YOLOTracker:
    """Wrapper around YOLO26n and ByteTrack multi-object tracker."""

    def __init__(
        self,
        model_path: str = "models/pretrained/yolo26n.pt",
        tracker_type: str = "bytetrack.yaml",
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.5,
        imgsz: int = 480,
        class_names_override: Optional[Dict[int, str]] = None
    ):
        """
        Initialize the YOLO tracker.
        
        Args:
            model_path: Path to YOLO26n weights.
            tracker_type: Ultralytics tracker config ('bytetrack.yaml' or 'botsort.yaml').
            conf_threshold: Minimum detection confidence threshold.
            iou_threshold: NMS IoU threshold.
            imgsz: Input image inference size for CPU acceleration (default: 480).
            class_names_override: Optional dictionary to map class IDs (e.g. {0: 'PIV', 1: 'TUBE'}).
        """
        # Fallback to root model if pretrained folder model is absent
        model_p = Path(model_path)
        if not model_p.exists():
            root_p = Path("yolo26n.pt")
            if root_p.exists():
                model_p = root_p

        print(f"📦 Loading YOLO26n model from: {model_p}")
        self.model = YOLO(str(model_p))
        self.tracker_type = tracker_type
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.imgsz = imgsz
        
        # Determine class names mapping
        if class_names_override:
            self.class_names = class_names_override
        elif hasattr(self.model, "names") and self.model.names:
            self.class_names = self.model.names
        else:
            self.class_names = {0: "PIV", 1: "TUBE"}
            
        print(f"✅ Tracker initialized with config: {self.tracker_type} (imgsz={self.imgsz})")

    def track(self, frame: np.ndarray, frame_number: int) -> List[TrackedObject]:
        """
        Run detection and ByteTrack tracking on a single frame.

        Args:
            frame: OpenCV BGR image frame (H x W x 3).
            frame_number: Monotonically increasing frame index.

        Returns:
            List of TrackedObject instances active in this frame.
        """
        # Run tracking inference with state persistence
        results = self.model.track(
            source=frame,
            persist=True,
            tracker=self.tracker_type,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            imgsz=self.imgsz,
            verbose=False
        )

        tracked_objects: List[TrackedObject] = []
        
        if not results or len(results) == 0:
            return tracked_objects

        result = results[0]
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            return tracked_objects

        # Extract coordinates, classes, confidences, and tracking IDs
        xyxy = boxes.xyxy.cpu().numpy()  # [N, 4]
        confs = boxes.conf.cpu().numpy()  # [N]
        cls_ids = boxes.cls.cpu().numpy().astype(int)  # [N]
        
        # Track IDs may be None if tracker is initializing or unassigned
        track_ids = boxes.id.cpu().numpy().astype(int) if boxes.id is not None else None

        for idx in range(len(xyxy)):
            track_id = int(track_ids[idx]) if track_ids is not None else -(idx + 1)
            cls_id = int(cls_ids[idx])
            conf = float(confs[idx])
            
            x1, y1, x2, y2 = map(int, xyxy[idx])
            cx = float((x1 + x2) / 2.0)
            cy = float((y1 + y2) / 2.0)
            
            cls_name = self.class_names.get(cls_id, f"Class_{cls_id}")

            tracked_objects.append(
                TrackedObject(
                    track_id=track_id,
                    class_id=cls_id,
                    class_name=cls_name,
                    confidence=conf,
                    bbox=(x1, y1, x2, y2),
                    center=(cx, cy),
                    frame_number=frame_number
                )
            )

        return tracked_objects

    def reset(self):
        """Reset the tracker internal state (e.g. when changing video sources)."""
        if hasattr(self.model, "predictor") and self.model.predictor is not None:
            if hasattr(self.model.predictor, "trackers"):
                self.model.predictor.trackers = None
