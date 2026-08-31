"""
WebSocket Telemetry Streaming for IVGuard
Location: backend/api/websocket.py
"""

import asyncio
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.schemas.detection import FrameTelemetry

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages active WebSocket client connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_json(self, data: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    Real-time telemetry WebSocket endpoint.
    Broadcasts live tracking coordinates, displacement, and alert states to connected frontends.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and accept ping/pong or control messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


def broadcast_telemetry_frame(telemetry: FrameTelemetry, loop: asyncio.AbstractEventLoop):
    """Callback triggered on every processed frame to broadcast telemetry."""
    if manager.active_connections and loop and loop.is_running():
        payload = telemetry.model_dump()
        asyncio.run_coroutine_threadsafe(manager.broadcast_json(payload), loop)
