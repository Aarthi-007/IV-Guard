"""
Detection, Tracking, and Telemetry Data Schemas
Location: backend/schemas/detection.py
"""

from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    center_x: float
    center_y: float
    width: int
    height: int


class TrackedObjectPayload(BaseModel):
    track_id: int
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    center: Tuple[float, float]
    displacement_px: float
    relative_to_piv_px: Optional[float] = None
    status: str


class FrameTelemetry(BaseModel):
    frame_number: int
    timestamp: float
    fps: float
    overall_status: str
    piv_anchor_id: Optional[int] = None
    active_tracks: List[TrackedObjectPayload] = Field(default_factory=list)
    alert_message: Optional[str] = None


class SystemStatusResponse(BaseModel):
    camera_connected: bool
    stream_url: str
    model_loaded: bool
    model_path: str
    tracker_type: str
    current_fps: float
    total_frames_processed: int
    active_tracks_count: int
    overall_status: str


class AlertEvent(BaseModel):
    alert_id: str
    timestamp: float
    timestamp_iso: str
    severity: str  # STABLE, WARNING, ALERT
    message: str
    track_id: Optional[int] = None
    class_name: Optional[str] = None
    displacement_px: Optional[float] = None


class UpdateConfigRequest(BaseModel):
    stream_url: Optional[str] = None
    conf_threshold: Optional[float] = None
    displacement_threshold_px: Optional[float] = None
    consecutive_frames_threshold: Optional[int] = None
    inference_imgsz: Optional[int] = None
