"""
YOLO Detector wrapper for loading weights and running real-time inference.
Responsible for detecting patient arm/hand, IV tubing, and IV stand.
"""


class YOLODetector:
    """Wrapper class for Ultralytics YOLO model inference."""

    def __init__(self, model_path: str, conf_threshold: float = 0.25):
        self.model_path = model_path
        self.conf_threshold = conf_threshold

    def load_model(self):
        """Load YOLO model weights into memory."""
        raise NotImplementedError("YOLODetector.load_model() will be implemented in future milestones.")

    def detect(self, frame):
        """Run object detection on an input image/frame."""
        raise NotImplementedError("YOLODetector.detect() will be implemented in future milestones.")
