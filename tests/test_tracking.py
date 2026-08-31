"""
Unit tests for IVGuard Tracking and Displacement Analyzer
Location: tests/test_tracking.py
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import unittest
from scripts.tracking.tracker import TrackedObject
from scripts.tracking.displacement import DisplacementAnalyzer, TrackingStatus


class TestDisplacementAnalyzer(unittest.TestCase):
    """Test suite for position history, reference calibration, and displacement logic."""

    def setUp(self):
        self.analyzer = DisplacementAnalyzer(
            init_frames=5,
            displacement_threshold_px=10.0,
            consecutive_frames_threshold=3,
            smoothing_window=3,
            grace_period_frames=5,
            purge_frames=10
        )

    def test_initialization_and_calibration(self):
        """Verify calibration establishes median reference center after init_frames."""
        for frame in range(1, 6):
            obj = TrackedObject(
                track_id=1,
                class_id=0,
                class_name="PIV",
                confidence=0.9,
                bbox=(90, 90, 110, 110),
                center=(100.0, 100.0),
                frame_number=frame
            )
            tracks = self.analyzer.update([obj], frame_number=frame)

        track1 = tracks[1]
        self.assertTrue(track1.is_calibrated)
        self.assertEqual(track1.reference_center, (100.0, 100.0))
        self.assertEqual(track1.status, TrackingStatus.STABLE)
        self.assertEqual(track1.current_displacement_px, 0.0)

    def test_displacement_and_noise_rejection(self):
        """Verify single frame displacement spike does NOT immediately trigger movement."""
        # 1. Calibrate 5 frames at (100, 100)
        for frame in range(1, 6):
            obj = TrackedObject(
                track_id=1,
                class_id=0,
                class_name="PIV",
                confidence=0.9,
                bbox=(90, 90, 110, 110),
                center=(100.0, 100.0),
                frame_number=frame
            )
            self.analyzer.update([obj], frame_number=frame)

        # 2. Frame 6: Instantaneous spike to (150, 100) -> 50px displacement
        obj_spike = TrackedObject(
            track_id=1,
            class_id=0,
            class_name="PIV",
            confidence=0.9,
            bbox=(140, 90, 160, 110),
            center=(150.0, 100.0),
            frame_number=6
        )
        tracks = self.analyzer.update([obj_spike], frame_number=6)
        # Should still be STABLE because consecutive_frames_threshold = 3
        self.assertEqual(tracks[1].status, TrackingStatus.STABLE)

        # 3. Frames 7 & 8: Sustained displacement at (150, 100)
        for f in [7, 8]:
            obj_sustained = TrackedObject(
                track_id=1,
                class_id=0,
                class_name="PIV",
                confidence=0.9,
                bbox=(140, 90, 160, 110),
                center=(150.0, 100.0),
                frame_number=f
            )
            tracks = self.analyzer.update([obj_sustained], frame_number=f)

        # After 3 consecutive frames over threshold -> MOVEMENT DETECTED
        self.assertEqual(tracks[1].status, TrackingStatus.MOVEMENT_DETECTED)
        self.assertGreater(tracks[1].current_displacement_px, 10.0)

    def test_relative_piv_tube_distance(self):
        """Verify relative distance calculation between TUBE and PIV anchor."""
        # Frame with PIV at (100, 100) and TUBE at (100, 150) -> distance = 50px
        piv_obj = TrackedObject(
            track_id=1, class_id=0, class_name="PIV",
            confidence=0.95, bbox=(90, 90, 110, 110), center=(100.0, 100.0), frame_number=1
        )
        tube_obj = TrackedObject(
            track_id=2, class_id=1, class_name="TUBE",
            confidence=0.88, bbox=(90, 140, 110, 160), center=(100.0, 150.0), frame_number=1
        )
        tracks = self.analyzer.update([piv_obj, tube_obj], frame_number=1)
        self.assertIsNotNone(tracks[2].relative_to_piv_px)
        self.assertAlmostEqual(tracks[2].relative_to_piv_px, 50.0, places=1)


if __name__ == "__main__":
    unittest.main()
