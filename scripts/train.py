"""
IVGuard Final Training Pipeline — PIV/TUBE v2
Location: scripts/train.py

Fine-tunes YOLO26n on the merged IVGuard dataset v2 (PIV + TUBE, zero BLOOD).
Saves final model to: models/trained/ivguard_yolo26n_piv_tube_v2.pt
"""

import argparse
import shutil
import sys
from pathlib import Path
import torch
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(
        description="IVGuard Final YOLO26n Training Pipeline (PIV/TUBE v2)"
    )

    parser.add_argument(
        "--data",
        type=str,
        default="datasets/ivguard_piv_tube_v2/data.yaml",
        help="Path to merged 2-class data.yaml"
    )

    parser.add_argument(
        "--model",
        type=str,
        default="models/trained/ivguard_yolo26n_best.pt",
        help="Base model weights for fine-tuning"
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="Maximum training epochs"
    )

    parser.add_argument(
        "--imgsz",
        type=int,
        default=480,
        help="Training image size"
    )

    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size"
    )

    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Device (auto, cpu, 0)"
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=2,
        help="Workers for DataLoader"
    )

    parser.add_argument(
        "--patience",
        type=int,
        default=15,
        help="Early stopping patience"
    )

    parser.add_argument(
        "--project",
        type=str,
        default="results/training",
        help="Training results project dir"
    )

    parser.add_argument(
        "--name",
        type=str,
        default="ivguard_yolo26n_piv_tube_v2",
        help="Experiment name"
    )

    parser.add_argument(
        "--save-best-to",
        type=str,
        default="models/trained/ivguard_yolo26n_piv_tube_v2.pt",
        help="Final destination for new best model"
    )

    return parser.parse_args()


def get_device(device_arg):
    if device_arg.lower() == "auto":
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            print(f"CUDA GPU detected: {gpu_name}")
            return 0
        print("CUDA GPU not detected. Training will execute on CPU.")
        return "cpu"
    return device_arg


def main():
    args = parse_args()

    print("\n" + "=" * 75)
    print("      IVGUARD — YOLO26n PIV/TUBE v2 TRAINING & FINE-TUNING")
    print("=" * 75)

    data_path = Path(args.data).resolve()
    if not data_path.exists():
        print(f"\n[ERROR] Dataset configuration not found: {data_path}")
        sys.exit(1)

    model_path = Path(args.model)
    if not model_path.exists():
        if Path("models/pretrained/yolo26n.pt").exists():
            model_path = Path("models/pretrained/yolo26n.pt")
        elif Path("yolo26n.pt").exists():
            model_path = Path("yolo26n.pt")

    device = get_device(args.device)
    project_path = Path(args.project).resolve()
    dest_best = Path(args.save_best_to).resolve()

    print(f"  Dataset Config:     {data_path}")
    print(f"  Base Model:         {model_path}")
    print(f"  Training Device:    {device}")
    print(f"  Epochs:             {args.epochs}")
    print(f"  Image Size:         {args.imgsz}")
    print(f"  Batch Size:         {args.batch}")
    print(f"  Output Project:     {project_path / args.name}")
    print(f"  Save Best Weights:  {dest_best}")
    print("=" * 75)

    print("\nLoading base model weights...")
    model = YOLO(str(model_path))

    print("\nStarting fine-tuning on 2-class merged dataset (0: PIV, 1: TUBE)...")
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
        save_period=5,
        val=True,
        plots=True,
        seed=42,
        # Moderate regularizing augmentations to prevent overfitting
        degrees=5.0,
        translate=0.05,
        scale=0.1,
        fliplr=0.5,
        mosaic=0.5,
        verbose=True
    )

    # Save to final destination
    run_dir = project_path / args.name
    best_pt = run_dir / "weights" / "best.pt"
    last_pt = run_dir / "weights" / "last.pt"

    dest_best.parent.mkdir(parents=True, exist_ok=True)
    if best_pt.exists():
        shutil.copy2(best_pt, dest_best)
        print(f"\n[SUCCESS] Best model saved to: {dest_best}")
    elif last_pt.exists():
        shutil.copy2(last_pt, dest_best)
        print(f"\n[SUCCESS] Last model saved to: {dest_best}")

    # Evaluate on held-out test set
    print("\nRunning final evaluation on held-out test split...")
    test_metrics = None
    try:
        test_model = YOLO(str(dest_best))
        test_metrics = test_model.val(
            data=str(data_path),
            split="test",
            imgsz=args.imgsz,
            device=device,
            plots=True
        )
        print("\n" + "=" * 75)
        print("                 HELD-OUT TEST SET METRICS")
        print("=" * 75)
        print(f"  Precision:   {test_metrics.box.mp:.4f}")
        print(f"  Recall:      {test_metrics.box.mr:.4f}")
        print(f"  mAP@50:      {test_metrics.box.map50:.4f}")
        print(f"  mAP@50-95:   {test_metrics.box.map:.4f}")
        print("=" * 75)
    except Exception as e:
        print(f"Test evaluation note: {e}")

    # Programmatic verification
    final_model = YOLO(str(dest_best))
    print(f"\nFinal Model Class Verification: {final_model.names}")
    assert final_model.names == {0: "PIV", 1: "TUBE"}, f"Model class mismatch: {final_model.names}"
    print("[SUCCESS] Verified new model has exactly 2 classes: {0: 'PIV', 1: 'TUBE'}")


if __name__ == "__main__":
    main()