# IVGuard — Vision-Based Detection of Abnormal IV-Line Displacement

## 1. Project Objective

**IVGuard** is a computer-vision-based early-warning research system designed to detect abnormal visible movement and displacement of an intravenous (IV) line setup in real-time.

The system visually observes:
1. **Patient's arm / hand**
2. **IV tubing**
3. **IV stand**

The system establishes a calibrated normal visual configuration baseline and detects significant or sustained spatial deviations from that configuration.

---

> ### ⚠️ Critical Medical Disclaimer
>
> **IVGuard is strictly an engineering early-warning prototype and NOT a medical diagnostic system.**
>
> The system does **NOT** diagnose medical conditions and must **NOT** claim to detect:
> - Extravasation or infiltration
> - Infection or phlebitis
> - Catheter failure or occlusion
> - Blood-flow or vascular problems
> - Drug reactions
> - Cancer or any other physiological condition
>
> The intended output is purely an engineering warning:
> **"Abnormal IV-line displacement detected — human assessment recommended."**

---

## 2. Current Architecture

```
Android Smartphone (Camera)
        ↓
    IP Webcam
        ↓
   Wi-Fi Network
        ↓
  Processing Laptop
        ↓
  Python / OpenCV
        ↓
       YOLO
        ↓
 Future Tracking
        ↓
 Future Displacement Analysis
        ↓
 Future Alert System
        ↓
 Future Dashboard
```

> **Note**: In the current working prototype, an Android smartphone running IP Webcam provides the live camera stream over Wi-Fi, and a laptop performs processing. There is no Raspberry Pi in the current prototype. Edge hardware or CCTV cameras may be evaluated in later phases.

---

## 3. Current Development Status

The following proof-of-concept milestones have been successfully completed:
- [x] Android phone configured as IP Webcam
- [x] Phone and laptop communicating over Wi-Fi
- [x] IP Webcam stream verified in browser and VLC (`http://192.168.1.9:8080/video`)
- [x] Python receiving MJPEG stream via HTTP requests
- [x] OpenCV displaying the live stream smoothly
- [x] Ultralytics installed and configured
- [x] YOLO pretrained weights (`yolo26n.pt`) downloaded
- [x] YOLO inference successfully running on the live phone-camera stream

---

## 4. Installation & Environment Setup

### Prerequisites
- Python 3.10+ installed
- Active virtual environment

### Virtual Environment Instructions (Windows PowerShell)

```powershell
# Navigate to the project root
cd D:\IVGUARD

# Activate existing virtual environment
.\.venv\Scripts\Activate.ps1

# Install / update project dependencies
pip install -r requirements.txt
```

---

## 5. Running Existing Live Tests

### A. Standalone IP Camera Stream Test
Verifies live video frame capture from the phone camera:
```powershell
python test_camera.py
```
*(Press `q` on the OpenCV window to exit)*

### B. Live YOLO Inference Test
Verifies real-time object detection running on the incoming camera feed:
```powershell
python test_yolo_camera.py
```
*(Press `q` on the OpenCV window to exit)*

---

## 6. Project Structure

```
D:/IVGUARD/
│
├── .venv/                      # Python virtual environment
│
├── models/
│   ├── pretrained/             # Pretrained weights (e.g. yolo26n.pt)
│   └── trained/                # Custom trained weights for IVGuard
│
├── datasets/
│   ├── public/                 # Downloaded public datasets (IV / tubing)
│   ├── raw/                    # Original unprocessed collected images
│   ├── processed/              # Cleaned and converted datasets
│   └── ivguard/                # Final unified YOLO dataset for training
│       ├── train/              # Training images and labels
│       ├── val/                # Validation images and labels
│       └── test/               # Test set images and labels
│
├── videos/
│   ├── raw/                    # Original raw recordings
│   ├── normal/                 # Stable baseline IV configuration recordings
│   ├── movement/               # Normal patient/arm movement recordings
│   └── abnormal/               # Controlled abnormal displacement scenarios
│
├── src/                        # Core modular research source code
│   ├── camera/                 # Stream acquisition & IP camera interface
│   ├── detection/              # YOLO detector wrappers
│   ├── tracking/               # Multi-object temporal tracking
│   ├── analysis/               # Spatial geometry, baseline, & displacement metrics
│   ├── alerts/                 # Warning logic & alert state manager
│   └── utils/                  # Config loader, logger, & common helpers
│
├── scripts/                    # Research & operational scripts
│   ├── collect_video.py        # Video recording utility
│   ├── extract_frames.py       # Frame extraction from video datasets
│   ├── inspect_dataset.py      # Dataset validation and stats
│   ├── train.py                # Model fine-tuning script
│   └── evaluate.py             # Performance benchmark & metrics calculation
│
├── tests/                      # Unit & integration test suites
│   ├── test_camera.py
│   ├── test_detection.py
│   ├── test_tracking.py
│   └── test_analysis.py
│
├── results/                    # Experimental outputs & benchmark logs
│   ├── detections/
│   ├── training/
│   ├── evaluation/
│   └── videos/
│
├── dashboard/                  # Future monitoring interface
├── configs/
│   └── config.yaml             # Central project configuration
│
├── test_camera.py              # Preserved standalone camera test
├── test_yolo_camera.py         # Preserved standalone YOLO camera test
├── requirements.txt            # Project dependencies
├── README.md                   # Project documentation
└── .gitignore                  # Git ignore rules
```

---

## 7. Planned Future Pipeline

```
Camera Stream
     ↓
Frame Acquisition
     ↓
YOLO Detection (Arm, IV Tubing, IV Stand)
     ↓
Multi-Object Tracking
     ↓
Spatial & Geometric Relationship Modeling
     ↓
Normal Baseline Calibration
     ↓
Temporal Movement Analysis
     ↓
Displacement Metric Calculation
     ↓
Decision & Warning Logic
     ↓
Alert State (Normal / Warning / Critical)
     ↓
Monitoring Dashboard
```

---

## 8. Research Benchmark Metrics

To support IEEE-quality research rigor, the codebase is structured to systematically log and evaluate:
- **Detection Performance**: Precision, Recall, mAP@50, mAP@50-95
- **Tracking Consistency**: ID switches, MOTA, MOTP
- **Error Rates**: False Positive Rate (FPR), False Negative Rate (FNR)
- **Real-Time Latency**: Frame acquisition latency, inference time (ms/frame), processing FPS
- **Displacement Accuracy**: Sensitivity, specificity, and alert latency across normal vs. abnormal movement scenarios
