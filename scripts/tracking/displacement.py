"""
Displacement Analyzer Module for IVGuard
Location: scripts/tracking/displacement.py

Calculates image-space displacement metrics and maintains temporal position histories:
- Euclidean displacement from calibrated reference position
- Temporal smoothing and noise rejection
- Relative spatial distance between TUBE and PIV anchor
- Engineering status classification: INITIALIZING, STABLE, MOVEMENT DETECTED, LOST TRACK
"""

import math
import time
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple
import numpy as np

from .tracker import TrackedObject


class TrackingStatus(Enum):
    INITIALIZING = "INITIALIZING"
    STABLE = "STABLE"
    MOVEMENT_DETECTED = "MOVEMENT DETECTED"
    LOST_TRACK = "LOST TRACK"


@dataclass
class TrackHistory:
    """Maintains position history and displacement statistics for a single track ID."""
    track_id: int
    class_id: int
    class_name: str
    positions: deque = field(default_factory=lambda: deque(maxlen=60))  # (frame_num, cx, cy, timestamp)
    reference_center: Optional[Tuple[float, float]] = None
    is_calibrated: bool = False
    last_seen_frame: int = 0
    consecutive_movement_frames: int = 0
    status: TrackingStatus = TrackingStatus.INITIALIZING
    current_displacement_px: float = 0.0
    smoothed_center: Optional[Tuple[float, float]] = None
    relative_to_piv_px: Optional[float] = None


class DisplacementAnalyzer:
    """
    Computes image-space displacement metrics, establishes reference baselines,
    and classifies movement status across video frames.
    
    NOTE ON CAMERA MOTION:
    All displacement metrics calculated here are in IMAGE-SPACE PIXELS (px).
    """

    def __init__(
        self,
        init_frames: int = 30,
        displacement_threshold_px: float = 15.0,
        consecutive_frames_threshold: int = 10,
        smoothing_window: int = 5,
        grace_period_frames: int = 20,
        purge_frames: int = 60
    ):
        """
        Args:
            init_frames: Number of stable frames needed to establish baseline reference position.
            displacement_threshold_px: Image-space displacement threshold (pixels) to consider as potential movement.
            consecutive_frames_threshold: Number of consecutive frames exceeding threshold before triggering MOVEMENT DETECTED.
            smoothing_window: Moving window size for centroid smoothing to reject single-frame detection jitter.
            grace_period_frames: Number of missing frames tolerated before marking a track as LOST TRACK.
            purge_frames: Number of missing frames before completely removing stale track history.
        """
        self.init_frames = init_frames
        self.displacement_threshold_px = displacement_threshold_px
        self.consecutive_frames_threshold = consecutive_frames_threshold
        self.smoothing_window = smoothing_window
        self.grace_period_frames = grace_period_frames
        self.purge_frames = purge_frames

        self.tracks: Dict[int, TrackHistory] = {}
        self.primary_piv_track_id: Optional[int] = None
        self.total_frames_seen: int = 0

    def reset(self):
        """Clear all track histories and reset baseline calibration to INITIALIZING."""
        self.tracks.clear()
        self.primary_piv_track_id = None
        self.total_frames_seen = 0

    def update(
        self,
        tracked_objects: List[TrackedObject],
        frame_number: int,
        timestamp: Optional[float] = None
    ) -> Dict[int, TrackHistory]:
        """
        Update tracking history and calculate displacements for the current frame.

        Args:
            tracked_objects: Detections from YOLOTracker for the current frame.
            frame_number: Current frame index.
            timestamp: Monotonic timestamp (defaults to time.time()).

        Returns:
            Dictionary of all active and tracked TrackHistory objects.
        """
        if timestamp is None:
            timestamp = time.time()

        self.total_frames_seen += 1
        seen_track_ids = set()
        piv_positions: Dict[int, Tuple[float, float]] = {}

        # 1. Update active detections
        for obj in tracked_objects:
            tid = obj.track_id
            seen_track_ids.add(tid)

            if tid not in self.tracks:
                self.tracks[tid] = TrackHistory(
                    track_id=tid,
                    class_id=obj.class_id,
                    class_name=obj.class_name
                )

            track = self.tracks[tid]
            track.last_seen_frame = frame_number
            track.class_name = obj.class_name
            track.class_id = obj.class_id
            track.positions.append((frame_number, obj.center[0], obj.center[1], timestamp))

            # Temporal smoothing (moving average of last N positions)
            recent_pts = list(track.positions)[-self.smoothing_window:]
            avg_x = sum(p[1] for p in recent_pts) / len(recent_pts)
            avg_y = sum(p[2] for p in recent_pts) / len(recent_pts)
            track.smoothed_center = (avg_x, avg_y)

            # Check if this object is a PIV (Anchor: Class 0)
            if "piv" in obj.class_name.lower() or "catheter" in obj.class_name.lower() or obj.class_id == 0:
                piv_positions[tid] = track.smoothed_center
                if self.primary_piv_track_id is None or self.primary_piv_track_id == tid:
                    self.primary_piv_track_id = tid

            # Establish / update reference position
            if not track.is_calibrated:
                if len(track.positions) >= self.init_frames:
                    # Calculate median position across initialization frames
                    xs = [p[1] for p in track.positions]
                    ys = [p[2] for p in track.positions]
                    track.reference_center = (float(np.median(xs)), float(np.median(ys)))
                    track.is_calibrated = True
                    track.status = TrackingStatus.STABLE
                    track.current_displacement_px = 0.0
                else:
                    track.status = TrackingStatus.INITIALIZING
                    track.current_displacement_px = 0.0

            # Calculate displacement from established reference position
            if track.is_calibrated and track.reference_center is not None:
                dx = track.smoothed_center[0] - track.reference_center[0]
                dy = track.smoothed_center[1] - track.reference_center[1]
                disp = math.sqrt(dx * dx + dy * dy)
                track.current_displacement_px = round(disp, 2)

                # Noise handling: require sustained displacement over consecutive frames
                if disp > self.displacement_threshold_px:
                    track.consecutive_movement_frames += 1
                    if track.consecutive_movement_frames >= self.consecutive_frames_threshold:
                        track.status = TrackingStatus.MOVEMENT_DETECTED
                    else:
                        track.status = TrackingStatus.STABLE
                else:
                    track.consecutive_movement_frames = max(0, track.consecutive_movement_frames - 1)
                    track.status = TrackingStatus.STABLE

        # 2. Update Primary PIV anchor reference
        if piv_positions:
            if self.primary_piv_track_id not in piv_positions:
                self.primary_piv_track_id = next(iter(piv_positions.keys()))
        elif self.primary_piv_track_id is not None:
            piv_track = self.tracks.get(self.primary_piv_track_id)
            if piv_track and (frame_number - piv_track.last_seen_frame) > self.grace_period_frames:
                self.primary_piv_track_id = None

        # 3. Calculate Relative PIV-TUBE Distance
        anchor_piv_pos = piv_positions.get(self.primary_piv_track_id) if self.primary_piv_track_id else None

        for tid in seen_track_ids:
            track = self.tracks[tid]
            # Check if this object is a TUBE (Tubing: Class 1)
            if "tube" in track.class_name.lower() or track.class_id == 1:
                if anchor_piv_pos is not None and track.smoothed_center is not None:
                    rx = track.smoothed_center[0] - anchor_piv_pos[0]
                    ry = track.smoothed_center[1] - anchor_piv_pos[1]
                    rel_dist = math.sqrt(rx * rx + ry * ry)
                    track.relative_to_piv_px = round(rel_dist, 2)
                else:
                    track.relative_to_piv_px = None
            else:
                track.relative_to_piv_px = None

        # 4. Handle Missing Tracks and Grace Period
        all_track_ids = list(self.tracks.keys())
        for tid in all_track_ids:
            if tid not in seen_track_ids:
                track = self.tracks[tid]
                frames_missing = frame_number - track.last_seen_frame

                if frames_missing > self.purge_frames:
                    del self.tracks[tid]
                elif frames_missing > self.grace_period_frames:
                    track.status = TrackingStatus.LOST_TRACK
                else:
                    pass

        return self.tracks

    def get_overall_system_status(self) -> TrackingStatus:
        """Determines the aggregated system status across currently active tracks."""
        if not self.tracks:
            return TrackingStatus.INITIALIZING if self.total_frames_seen < self.init_frames else TrackingStatus.LOST_TRACK

        active_tracks = [t for t in self.tracks.values() if t.status != TrackingStatus.LOST_TRACK]
        if not active_tracks:
            return TrackingStatus.LOST_TRACK

        # If any active track is still calibrating its baseline, status is INITIALIZING
        has_init = any(t.status == TrackingStatus.INITIALIZING for t in active_tracks)
        if has_init:
            return TrackingStatus.INITIALIZING

        # Check for confirmed sustained movement
        has_movement = any(t.status == TrackingStatus.MOVEMENT_DETECTED for t in active_tracks)
        if has_movement:
            return TrackingStatus.MOVEMENT_DETECTED

        # Stable calibrated tracks
        has_stable = any(t.status == TrackingStatus.STABLE for t in active_tracks)
        if has_stable:
            return TrackingStatus.STABLE

        return TrackingStatus.LOST_TRACK
