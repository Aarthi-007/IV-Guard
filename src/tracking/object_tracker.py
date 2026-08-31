"""
Object tracker module for tracking detected key components (arm, IV line, IV stand) across frames.
"""


class ObjectTracker:
    """Maintains consistent tracking identities and spatial trajectories across video frames."""

    def __init__(self, tracker_type: str = "bytetrack"):
        self.tracker_type = tracker_type

    def update(self, detections, frame):
        """Update tracker state with new bounding box detections."""
        raise NotImplementedError("ObjectTracker.update() will be implemented in future milestones.")
