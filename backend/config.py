"""
IVGuard Backend Configuration
Location: backend/config.py

Loads central settings from environment variables, YAML config, or defaults.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Camera Stream
    stream_url: str = "http://192.168.1.9:8080/video"
    camera_timeout: int = 10

    # Model & Tracker
    model_path: str = "models/trained/ivguard_yolo26n_best.pt"
    pretrained_fallback: str = "yolo26n.pt"
    tracker_config: str = "bytetrack.yaml"
    conf_threshold: float = 0.25
    iou_threshold: float = 0.50
    inference_imgsz: int = 480

    # Displacement & Calibration
    init_frames: int = 30
    displacement_threshold_px: float = 15.0
    consecutive_frames_threshold: int = 10
    smoothing_window: int = 5
    grace_period_frames: int = 20

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["*"]

    def get_valid_model_path(self) -> str:
        """Resolve available model path (trained model or base pretrained)."""
        p = Path(self.model_path)
        if p.exists():
            return str(p)
        
        pretrained = Path("models/pretrained/yolo26n.pt")
        if pretrained.exists():
            return str(pretrained)
            
        root_m = Path(self.pretrained_fallback)
        if root_m.exists():
            return str(root_m)
            
        return self.model_path

    class Config:
        env_prefix = "IVGUARD_"
        case_sensitive = False


settings = Settings()
