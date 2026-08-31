"""
Alert Manager Service for IVGuard
Location: backend/services/alert_manager.py

Translates displacement metrics into engineering alerts:
- STABLE
- WARNING ("Abnormal IV-line displacement detected — human assessment recommended.")
- CRITICAL
"""

import time
import uuid
from datetime import datetime
from typing import List, Optional
from collections import deque

from backend.schemas.detection import AlertEvent
from scripts.tracking.displacement import TrackingStatus


class BackendAlertManager:
    """Manages alert states, threshold notifications, and alert history."""

    def __init__(self, max_history: int = 100, cooldown_seconds: float = 3.0):
        self.max_history = max_history
        self.cooldown_seconds = cooldown_seconds
        self.alert_history: deque[AlertEvent] = deque(maxlen=max_history)
        self.last_alert_time: float = 0.0

    def evaluate_status(
        self,
        overall_status: TrackingStatus,
        active_tracks: dict
    ) -> Optional[AlertEvent]:
        """Evaluate current tracking status and create an AlertEvent if warranted."""
        now = time.time()
        
        if overall_status == TrackingStatus.MOVEMENT_DETECTED:
            # Check cooldown to prevent duplicate alert spamming
            if now - self.last_alert_time >= self.cooldown_seconds:
                # Find the track with highest displacement
                moved_track = None
                max_disp = 0.0
                for track in active_tracks.values():
                    if track.status == TrackingStatus.MOVEMENT_DETECTED and track.current_displacement_px > max_disp:
                        max_disp = track.current_displacement_px
                        moved_track = track

                alert = AlertEvent(
                    alert_id=str(uuid.uuid4())[:8],
                    timestamp=now,
                    timestamp_iso=datetime.fromtimestamp(now).isoformat(),
                    severity="WARNING",
                    message="Abnormal IV-line displacement detected — human assessment recommended.",
                    track_id=moved_track.track_id if moved_track else None,
                    class_name=moved_track.class_name if moved_track else None,
                    displacement_px=max_disp if moved_track else None
                )
                self.alert_history.appendleft(alert)
                self.last_alert_time = now
                return alert

        return None

    def get_recent_alerts(self, limit: int = 20) -> List[AlertEvent]:
        """Return the most recent alert events."""
        return list(self.alert_history)[:limit]
