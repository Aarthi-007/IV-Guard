"""
IP Camera interface and connection management for IVGuard.
Responsible for managing network camera connections and session lifecycles.
"""


class IPCamera:
    """Interface for IP camera streaming and connection management."""

    def __init__(self, stream_url: str):
        self.stream_url = stream_url

    def connect(self):
        """Establish connection with the IP camera."""
        raise NotImplementedError("IPCamera.connect() will be implemented in future milestones.")

    def disconnect(self):
        """Safely terminate connection with the IP camera."""
        raise NotImplementedError("IPCamera.disconnect() will be implemented in future milestones.")
