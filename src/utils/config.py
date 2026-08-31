"""
Configuration loader for IVGuard.
Reads YAML configuration files into structured Python dictionaries.
"""

from pathlib import Path
import yaml


def load_config(config_path: str = "configs/config.yaml") -> dict:
    """Load and parse YAML configuration file."""
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found at: {config_path}")

    with open(path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config or {}
