"""
IVGuard Model Training Pipeline
Location: scripts/train.py

Fine-tunes YOLO26n on the unified IVGuard dataset (PIV + TUBE).
Supports automatic device detection (CUDA/CPU), early stopping, metric reporting,
and saves the resulting best weights to models/trained/.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path
import torch
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="IVGuard YOLO26n Model Training Script")
    parser.add_argument(
        "--data",
        type=str,
        default="datasets/data.yaml",
        help="Path to data.yaml dataset config"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolo26n.pt",
        help="Pretrained model weights (e.g. yolo26n.pt or models/pretrained/yolo26n.pt)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=30,
        help="Number of training epochs (default: 30)"
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Image size for training (default: 640; use 480 for faster CPU training)"
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size (default: 16; use 8 or 4 if CPU/RAM is constrained)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Device to run on: 'auto', 'cpu', '0', etc."
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=2,
        help="DataLoader workers (default: 2 for Windows stability)"
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=15,
        help="Early stopping patience in epochs without improvement (default: 15)"
    )
    parser.add_argument(
        "--project",
        type=str,
        default="results/training",
        help="Directory to save training logs and checkpoints"
    )
    parser.add_argument(
        "--name",
        type=str,
        default="ivguard_yolo26n",
        help="Experiment name for the training run"
    )
    parser.add_argument(
        "--save-best-to",
        type=str,
        default="models/trained/ivguard_yolo26n_best.pt",
        help="Destination path to copy the best trained weights"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 70)
    print("  IVGuard — YOLO26n Custom Model Training Pipeline")
    print("=" * 70)

    # 1. Validate paths
    data_path = Path(args.data).resolve()
    if not data_path.exists():
        print(f"[ERROR] Dataset configuration not found at: {data_path}")
        sys.exit(1)

    model_path = Path(args.model)
    if not model_path.exists():
        # Check models/pretrained fallback
        fallback = Path("models/pretrained") / model_path.name
        if fallback.exists():
            model_path = fallback
        else:
            print(f"[INFO] Local model weights not found at {model_path} or models/pretrained/{model_path.name}.")
            print("       Ultralytics will attempt to download the pretrained weights automatically...")
            model_path = Path(model_path.name)

    # 2. Determine device
    if args.device == "auto":
        device = 0 if torch.cuda.is_available() else "cpu"
    else:
        device = args.device

    project_path = Path(args.project).resolve()
    dest_best = Path(args.save_best_to).resolve()

    print(f"  Dataset Config:     {data_path}")
    print(f"  Base Model:         {model_path}")
    print(f"  Training Device:    {device} ({'GPU' if device != 'cpu' else 'CPU'})")
    print(f"  Epochs:             {args.epochs}")
    print(f"  Image Size:         {args.imgsz}")
    print(f"  Batch Size:         {args.batch}")
    print(f"  Output Project:     {project_path / args.name}")
    print(f"  Save Best Weights:  {dest_best}")
    print("=" * 70)

    if device == "cpu":
        print("[INFO] Training on CPU. To accelerate training:")
        print("       - You can use --imgsz 480 or --batch 8")
        print("       - Training will take several minutes depending on CPU performance.")
        print("-" * 70)

    # 3. Load Model
    print(f"📦 Loading YOLO26n base weights from {model_path}...")
    model = YOLO(str(model_path))

    # 4. Start Training
    print("🚀 Starting training run...")
    try:
        results = model.train(
            data=str(data_path),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            device=device,
            workers=args.workers,
            patience=args.patience,
            project=str(project_path),
            name=args.name,
            exist_ok=True,
            save=True,
            plots=True,
            verbose=True
        )
    except KeyboardInterrupt:
        print("\n[WARN] Training interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Training failed: {e}")
        sys.exit(1)

    print("\n" + "=" * 70)
    print("  Training Completed Successfully!")
    print("=" * 70)

    # 5. Locate and Copy Best Weights
    run_dir = project_path / args.name
    best_pt = run_dir / "weights" / "best.pt"
    last_pt = run_dir / "weights" / "last.pt"

    dest_best.parent.mkdir(parents=True, exist_ok=True)

    if best_pt.exists():
        shutil.copy2(best_pt, dest_best)
        print(f"✅ Best weights saved to: {dest_best}")
    elif last_pt.exists():
        shutil.copy2(last_pt, dest_best)
        print(f"✅ Last weights saved to: {dest_best}")
    else:
        print(f"[WARN] Trained weights not found at {best_pt} or {last_pt}. Copy skipped.")

    # 6. Evaluation & Summary
    print("\n📊 Evaluating trained model on test split...")
    try:
        val_results = model.val(
            data=str(data_path),
            split="test",
            imgsz=args.imgsz,
            device=device,
            project=str(project_path),
            name=f"{args.name}_val"
        )
        print(f"   mAP@50:    {val_results.box.map50:.4f}")
        print(f"   mAP@50-95: {val_results.box.map:.4f}")
    except Exception as e:
        print(f"   [INFO] Validation skip / notice: {e}")

    print("\n" + "=" * 70)
    print("  NEXT STEPS:")
    print("=" * 70)
    print("  To use your trained weights in the live tracking pipeline:")
    print(f"  python test_tracking_camera.py")
    print(f"  (Or pass model_path='{dest_best}' to YOLOTracker)")
    print("=" * 70)


if __name__ == "__main__":
    main()
