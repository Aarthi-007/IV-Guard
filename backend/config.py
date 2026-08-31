"""
IVGuard Backend Configuration
Location: backend/config.py

Loads central settings from environment variables, YAML config, or defaults.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Camera Settings (Default: Local Laptop Webcam at index 0)
    camera_source: str = "local"
    camera_index: int = 0
    stream_url: str = ""
    camera_timeout: int = 10

    # Model & Tracker
    model_path: str = "models/trained/ivguard_yolo26n_best.pt"
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
        """Resolve available trained model path. Raises FileNotFoundError if missing."""
        p = Path(self.model_path)
        if p.exists():
            return str(p)
        
        # Check if model is in current working directory
        root_m = Path("ivguard_yolo26n_best.pt")
        if root_m.exists():
            return str(root_m)

        raise FileNotFoundError(
            f"Trained IVGuard YOLO26n weights not found at '{self.model_path}'. "
            "Please ensure 'models/trained/ivguard_yolo26n_best.pt' exists."
        )

    class Config:
        env_prefix = "IVGUARD_"
        case_sensitive = False


settings = Settings()
