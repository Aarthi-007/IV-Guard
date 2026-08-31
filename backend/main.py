"""
IVGuard Backend Application Entry Point
Location: backend/main.py

FastAPI application providing:
- Zero-latency video MJPEG streaming (/api/video-feed)
- REST telemetry and system status endpoints (/api/status, /api/telemetry/latest, /api/alerts)
- Real-time WebSocket telemetry stream (/ws/telemetry)
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.config import settings
from backend.services.camera import CameraService
from backend.services.inference import InferenceService
from backend.services.alert_manager import BackendAlertManager
from backend.services.monitoring import MonitoringService
from backend.api.routes import router as api_router, set_monitoring_service
from backend.api.websocket import router as ws_router, broadcast_telemetry_frame

# Global services
camera_service = None
inference_service = None
alert_manager = None
monitoring_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global camera_service, inference_service, alert_manager, monitoring_service

    print("=" * 70)
    print("  IVGuard Backend Server Starting...")
    print("=" * 70)

    # 1. Initialize Services
    camera_service = CameraService(stream_url=settings.stream_url)
    inference_service = InferenceService()
    alert_manager = BackendAlertManager()

    monitoring_service = MonitoringService(
        camera_service=camera_service,
        inference_service=inference_service,
        alert_manager=alert_manager
    )

    # 2. Bind to REST routes
    set_monitoring_service(monitoring_service)

    # 3. Hook WebSocket broadcaster
    loop = asyncio.get_running_loop()

    def on_telemetry(telemetry):
        broadcast_telemetry_frame(telemetry, loop)

    monitoring_service.add_listener(on_telemetry)

    # 4. Start Background Monitoring
    monitoring_service.start()

    print(f"✅ Camera Stream:  {settings.stream_url}")
    print(f"✅ Model Weights:  {inference_service.model_path}")
    print(f"✅ Video Feed:     http://localhost:{settings.port}/api/video-feed")
    print(f"✅ Swagger Docs:   http://localhost:{settings.port}/docs")
    print("=" * 70)

    yield

    # Shutdown
    print("\n[IVGuard Backend] Shutting down background services...")
    if monitoring_service:
        monitoring_service.stop()
    print("[IVGuard Backend] Shutdown complete.")


app = FastAPI(
    title="IVGuard Backend API",
    description="Real-Time Vision-Based Detection of Abnormal IV-Line Displacement",
    version="0.1.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(api_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    """Root endpoint providing system summary and documentation links."""
    return {
        "project": "IVGuard",
        "objective": "Vision-Based Detection of Abnormal IV-Line Displacement",
        "disclaimer": "Engineering early-warning prototype; not a medical diagnostic system.",
        "endpoints": {
            "status": "/api/status",
            "latest_telemetry": "/api/telemetry/latest",
            "alerts": "/api/alerts",
            "video_feed": "/api/video-feed",
            "websocket": "/ws/telemetry",
            "docs": "/docs"
        }
    }


def start():
    """Run uvicorn server directly."""
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=False
    )


if __name__ == "__main__":
    start()
