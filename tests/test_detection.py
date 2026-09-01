"""
Unit and integration tests for YOLO detection module.
Strictly verifies 2-class model specification (0: PIV, 1: TUBE).
"""

import unittest
from pathlib import Path
from ultralytics import YOLO
from backend.services.inference import InferenceService


class TestDetectionModule(unittest.TestCase):
    """Test suite for YOLO detector components."""

    def test_trained_model_classes(self):
        """Verify the trained model contains exactly 2 classes: 0=PIV, 1=TUBE."""
        model_path = Path("models/trained/ivguard_yolo26n_best.pt")
        self.assertTrue(model_path.exists(), f"Model not found at {model_path}")
        
        model = YOLO(str(model_path))
        self.assertEqual(len(model.names), 2, f"Expected 2 classes, found {len(model.names)}: {model.names}")
        self.assertEqual(model.names[0], "PIV")
        self.assertEqual(model.names[1], "TUBE")

    def test_inference_service_initialization(self):
        """Verify InferenceService loads the 2-class model without error."""
        infer = InferenceService()
        self.assertTrue(infer.is_loaded)
        self.assertEqual(infer.tracker.class_names[0], "PIV")
        self.assertEqual(infer.tracker.class_names[1], "TUBE")
        self.assertEqual(len(infer.tracker.class_names), 2)


if __name__ == "__main__":
    unittest.main()
