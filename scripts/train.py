"""
IVGuard Model Training Pipeline
Location: scripts/train.py

Fine-tunes YOLO26n on the unified IVGuard dataset (PIV + TUBE).

FINAL TRAINING CONFIGURATION
----------------------------
- Base model : YOLO26n pretrained weights
- Classes    : PIV, TUBE
- Image size : 640x640
- Epochs     : 80 maximum
- Early stop : patience 15
- Checkpoint : every 5 epochs
- Seed       : 42
- Test split : evaluated after training

IMPORTANT:
This script is intended for the final GPU training run.
Preserve the complete results/training/ivguard_yolo26n/
directory after training, not just best.pt.
"""

import argparse
import shutil
import sys
from pathlib import Path

import torch
from ultralytics import YOLO


# ============================================================
# ARGUMENTS
# ============================================================

def parse_args():
    parser = argparse.ArgumentParser(
        description="IVGuard Final YOLO26n Training Pipeline"
    )

    parser.add_argument(
        "--data",
        type=str,
        default="D:/IVGUARD/datasets/processed/ivguard_yolo/data.yaml",
        help="Path to IVGuard data.yaml"
    )

    parser.add_argument(
        "--model",
        type=str,
        default="yolo26n.pt",
        help="Pretrained YOLO26n weights"
    )

    parser.add_argument(
        "--epochs",
        type=int,
        default=80,
        help="Maximum number of training epochs"
    )

    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Training image size"
    )

    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size. Reduce to 8 or 4 if GPU memory is insufficient."
    )

    parser.add_argument(
        "--device",
        type=str,
        default="auto",
        help="Training device: auto, cpu, 0, 1, etc."
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="DataLoader workers"
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
        help="Training output directory"
    )

    parser.add_argument(
        "--name",
        type=str,
        default="ivguard_yolo26n",
        help="Training experiment name"
    )

    parser.add_argument(
        "--save-best-to",
        type=str,
        default="models/trained/ivguard_yolo26n_best.pt",
        help="Final destination for best.pt"
    )

    return parser.parse_args()


# ============================================================
# DEVICE DETECTION
# ============================================================

def get_device(device_argument):

    if device_argument.lower() == "auto":

        if torch.cuda.is_available():

            gpu_name = torch.cuda.get_device_name(0)

            print(f"✅ CUDA GPU detected: {gpu_name}")

            return 0

        print("⚠️ CUDA GPU not detected.")
        print("   Training will run on CPU.")

        return "cpu"

    return device_argument


# ============================================================
# MAIN
# ============================================================

def main():

    args = parse_args()

    print("\n")
    print("=" * 75)
    print("        IVGuard — FINAL YOLO26n TRAINING PIPELINE")
    print("=" * 75)

    # --------------------------------------------------------
    # 1. DATASET VALIDATION
    # --------------------------------------------------------

    data_path = Path(args.data)

    if not data_path.exists():

        print(f"\n❌ ERROR: Dataset configuration not found:")
        print(f"   {data_path}")

        sys.exit(1)

    # --------------------------------------------------------
    # 2. MODEL PATH
    # --------------------------------------------------------

    model_path = Path(args.model)

    if not model_path.exists():

        fallback = Path("models/pretrained") / model_path.name

        if fallback.exists():

            model_path = fallback

        else:

            print(f"\n❌ ERROR: YOLO26n weights not found:")
            print(f"   {model_path}")
            print(f"\nExpected location:")
            print("   yolo26n.pt")
            print("or")
            print("   models/pretrained/yolo26n.pt")

            sys.exit(1)

    # --------------------------------------------------------
    # 3. DEVICE
    # --------------------------------------------------------

    device = get_device(args.device)

    device_name = (
        "GPU"
        if device != "cpu"
        else "CPU"
    )

    # --------------------------------------------------------
    # 4. PRINT FINAL CONFIGURATION
    # --------------------------------------------------------

    print("\nFINAL TRAINING CONFIGURATION")
    print("-" * 75)

    print(f"Dataset           : {data_path}")
    print(f"Base Model        : {model_path}")
    print(f"Device            : {device} ({device_name})")
    print(f"Epochs            : {args.epochs}")
    print(f"Image Size        : {args.imgsz}x{args.imgsz}")
    print(f"Batch Size        : {args.batch}")
    print(f"Workers           : {args.workers}")
    print(f"Early Stop        : {args.patience} epochs")
    print(f"Checkpoint        : Every 5 epochs")
    print(f"Random Seed       : 42")
    print(f"Output            : {args.project}/{args.name}")
    print(f"Best Model        : {args.save_best_to}")

    print("-" * 75)

    # --------------------------------------------------------
    # 5. GPU INFORMATION
    # --------------------------------------------------------

    if torch.cuda.is_available():

        print("\nGPU INFORMATION")
        print("-" * 75)

        print(
            f"GPU Name          : "
            f"{torch.cuda.get_device_name(0)}"
        )

        print(
            f"CUDA Version      : "
            f"{torch.version.cuda}"
        )

        try:

            total_memory = torch.cuda.get_device_properties(
                0
            ).total_memory / (1024 ** 3)

            print(
                f"GPU Memory        : "
                f"{total_memory:.2f} GB"
            )

        except Exception:
            pass

    # --------------------------------------------------------
    # 6. CPU WARNING
    # --------------------------------------------------------

    if device == "cpu":

        print("\n⚠️ WARNING")
        print("-" * 75)

        print(
            "No CUDA GPU is being used."
        )

        print(
            "This is intended to be the final GPU training run."
        )

        print(
            "Verify the GPU before proceeding."
        )

        print("-" * 75)

    # --------------------------------------------------------
    # 7. LOAD PRETRAINED YOLO26n
    # --------------------------------------------------------

    print("\n📦 Loading YOLO26n pretrained weights...")

    try:

        model = YOLO(str(model_path))

    except Exception as e:

        print("\n❌ Failed to load YOLO26n:")
        print(e)

        sys.exit(1)

    print("✅ YOLO26n loaded successfully.")

    # --------------------------------------------------------
    # 8. FINAL TRAINING
    # --------------------------------------------------------

    print("\n")
    print("=" * 75)
    print("🚀 STARTING IVGUARD FINAL TRAINING")
    print("=" * 75)

    print(
        "\nThe model will fine-tune on:"
        "\n  Class 0 → PIV"
        "\n  Class 1 → TUBE"
    )

    print(
        "\nMaximum epochs:",
        args.epochs
    )

    print(
        "Early stopping patience:",
        args.patience
    )

    print(
        "\n⚠️ Do not interrupt the training unless necessary."
    )

    print("=" * 75)

    try:

        results = model.train(

            # Dataset
            data=str(data_path),

            # Training duration
            epochs=args.epochs,

            # Image resolution
            imgsz=args.imgsz,

            # Batch
            batch=args.batch,

            # Device
            device=device,

            # DataLoader
            workers=args.workers,

            # Early stopping
            patience=args.patience,

            # Output
            project=args.project,
            name=args.name,
            exist_ok=True,

            # Checkpointing
            save=True,
            save_period=5,

            # Validation
            val=True,

            # Generate graphs
            plots=True,

            # Reproducibility
            seed=42,

            # Verbose logging
            verbose=True
        )

    except KeyboardInterrupt:

        print("\n")
        print("⚠️ Training manually interrupted.")

        print(
            "\nAny checkpoints already created should remain "
            "inside the training results directory."
        )

        sys.exit(0)

    except Exception as e:

        print("\n")
        print("=" * 75)
        print("❌ TRAINING FAILED")
        print("=" * 75)

        print(e)

        sys.exit(1)

    # --------------------------------------------------------
    # 9. TRAINING COMPLETED
    # --------------------------------------------------------

    print("\n")
    print("=" * 75)
    print("✅ TRAINING COMPLETED")
    print("=" * 75)

    # --------------------------------------------------------
    # 10. LOCATE TRAINING RESULTS
    # --------------------------------------------------------

    run_dir = (
        Path(args.project)
        / args.name
    )

    weights_dir = (
        run_dir
        / "weights"
    )

    best_pt = (
        weights_dir
        / "best.pt"
    )

    last_pt = (
        weights_dir
        / "last.pt"
    )

    # --------------------------------------------------------
    # 11. COPY BEST MODEL
    # --------------------------------------------------------

    dest_best = Path(
        args.save_best_to
    )

    dest_best.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    if best_pt.exists():

        shutil.copy2(
            best_pt,
            dest_best
        )

        print(
            f"\n🏆 Best model copied to:"
            f"\n   {dest_best.resolve()}"
        )

    else:

        print(
            "\n⚠️ WARNING: best.pt was not found."
        )

        if last_pt.exists():

            print(
                "last.pt exists, but it will NOT "
                "automatically replace best.pt."
            )

    # --------------------------------------------------------
    # 12. FINAL TEST EVALUATION
    # --------------------------------------------------------

    print("\n")
    print("=" * 75)
    print("📊 FINAL HELD-OUT TEST EVALUATION")
    print("=" * 75)

    try:

        test_results = model.val(
            data=str(data_path),
            split="test",
            imgsz=args.imgsz,
            device=device,
            plots=True
        )

        print("\nFINAL TEST METRICS")
        print("-" * 75)

        print(
            f"mAP@50       : "
            f"{test_results.box.map50:.4f}"
        )

        print(
            f"mAP@50-95    : "
            f"{test_results.box.map:.4f}"
        )

        print(
            f"Precision     : "
            f"{test_results.box.mp:.4f}"
        )

        print(
            f"Recall        : "
            f"{test_results.box.mr:.4f}"
        )

        # Per-class metrics if available
        try:

            print("\nPer-class mAP@50-95:")

            for class_id, value in enumerate(
                test_results.box.maps
            ):

                class_name = model.names.get(
                    class_id,
                    str(class_id)
                )

                print(
                    f"   {class_name}: "
                    f"{value:.4f}"
                )

        except Exception:

            pass

    except Exception as e:

        print(
            "\n⚠️ Test evaluation could not be completed:"
        )

        print(e)

    # --------------------------------------------------------
    # 13. FINAL OUTPUT SUMMARY
    # --------------------------------------------------------

    print("\n")
    print("=" * 75)
    print("              IVGUARD TRAINING SUMMARY")
    print("=" * 75)

    print(
        f"\nTraining directory:"
        f"\n   {run_dir.resolve()}"
    )

    print(
        f"\nBest trained model:"
        f"\n   {dest_best.resolve()}"
    )

    print(
        f"\nTraining checkpoints:"
        f"\n   {weights_dir.resolve()}"
    )

    print("\nIMPORTANT FILES TO PRESERVE:")
    print("-" * 75)

    print("  ✓ best.pt")
    print("  ✓ last.pt")
    print("  ✓ results.csv")
    print("  ✓ results.png")
    print("  ✓ confusion_matrix.png")
    print("  ✓ PR curves")
    print("  ✓ F1 curves")
    print("  ✓ validation results")
    print("  ✓ all epoch checkpoints")

    print("\n")
    print("=" * 75)
    print("NEXT STEP")
    print("=" * 75)

    print(
        "\nUse the trained model in the IVGuard tracking pipeline:"
    )

    print(
        "\n   python test_tracking_camera.py"
    )

    print(
        "\nThe tracking pipeline should load:"
    )

    print(
        f"\n   {dest_best}"
    )

    print("\n")
    print("=" * 75)


if __name__ == "__main__":
    main()