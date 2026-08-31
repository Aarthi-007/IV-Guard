"""
FastAPI REST Routes for IVGuard
Location: backend/api/routes.py
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from backend.config import settings
from backend.schemas.detection import (
    SystemStatusResponse,
    FrameTelemetry,
    AlertEvent,
    UpdateConfigRequest
)

router = APIRouter(prefix="/api", tags=["IVGuard API"])

# Global container holding active monitoring service instance
_monitoring_service = None


def set_monitoring_service(service):
    global _monitoring_service
    _monitoring_service = service


def get_monitoring_service():
    if _monitoring_service is None:
        raise HTTPException(status_code=503, detail="Monitoring service not initialized.")
    return _monitoring_service


@router.get("/status", response_model=SystemStatusResponse)
async def get_status(service=Depends(get_monitoring_service)):
    """Retrieve system operational health, camera connection, and FPS."""
    return service.get_system_status()


@router.get("/telemetry/latest", response_model=Optional[FrameTelemetry])
async def get_latest_telemetry(service=Depends(get_monitoring_service)):
    """Retrieve the most recent frame tracking and displacement telemetry."""
    with service.lock:
        return service.latest_telemetry


@router.get("/alerts", response_model=List[AlertEvent])
async def get_alerts(limit: int = 20, service=Depends(get_monitoring_service)):
    """Retrieve recent abnormal displacement warning events."""
    return service.alert_manager.get_recent_alerts(limit=limit)


@router.get("/video-feed")
async def get_video_feed(service=Depends(get_monitoring_service)):
    """
    Stream live annotated MJPEG video for browser <img> tags and dashboard preview.
    Usage: <img src="http://localhost:8000/api/video-feed" />
    """
    return StreamingResponse(
        service.camera.generate_mjpeg_stream(get_annotated_frame_fn=service.get_annotated_frame),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.post("/config", response_model=dict)
async def update_config(config_req: UpdateConfigRequest, service=Depends(get_monitoring_service)):
    """Dynamically update stream URL or detection/displacement thresholds."""
    updated = {}
    if config_req.displacement_threshold_px is not None:
        service.analyzer.displacement_threshold_px = config_req.displacement_threshold_px
        updated["displacement_threshold_px"] = config_req.displacement_threshold_px

    if config_req.consecutive_frames_threshold is not None:
        service.analyzer.consecutive_frames_threshold = config_req.consecutive_frames_threshold
        updated["consecutive_frames_threshold"] = config_req.consecutive_frames_threshold

    if config_req.conf_threshold is not None:
        service.inference.tracker.conf_threshold = config_req.conf_threshold
        updated["conf_threshold"] = config_req.conf_threshold

    if config_req.stream_url is not None and config_req.stream_url != service.camera.stream_url:
        service.camera.stream_url = config_req.stream_url
        updated["stream_url"] = config_req.stream_url

    return {"status": "success", "updated_parameters": updated}
