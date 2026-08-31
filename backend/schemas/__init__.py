"""
Pydantic Schemas for IVGuard API and WebSocket payloads.
"""

from .detection import (
    BoundingBox,
    TrackedObjectPayload,
    FrameTelemetry,
    SystemStatusResponse,
    AlertEvent,
    UpdateConfigRequest
)

__all__ = [
    "BoundingBox",
    "TrackedObjectPayload",
    "FrameTelemetry",
    "SystemStatusResponse",
    "AlertEvent",
    "UpdateConfigRequest"
]
