"""
Alert Manager for IVGuard.
Translates displacement analysis outputs into engineering alert states:
- NORMAL
- WARNING ("Abnormal IV-line displacement detected — human assessment recommended.")
- CRITICAL_ALERT
"""

from enum import Enum


class AlertState(Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    ALERT = "ALERT"


class AlertManager:
    """Manages alert states and generates engineering warnings."""

    def __init__(self, warning_message: str = "Abnormal IV-line displacement detected — human assessment recommended."):
        self.warning_message = warning_message
        self.current_state = AlertState.NORMAL

    def process_score(self, displacement_score: float) -> AlertState:
        """Process displacement score and update alert state."""
        raise NotImplementedError("AlertManager.process_score() will be implemented in future milestones.")
