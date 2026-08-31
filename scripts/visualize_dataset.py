"""
Visual Label Verification Script for IVGuard Dataset
Location: scripts/visualize_dataset.py

Randomly samples images from the processed dataset, renders bounding boxes and class names:
- Class 0: PIV (Cyan/Blue)
- Class 1: TUBE (Orange/Green)
Saves output visualization images to results/detections/sample_visualizations/
"""

import os
import random
from pathlib import Path
import cv2
import yaml

CLASS_COLORS = {
    0: (255, 144, 30),   # PIV: Dodger Blue / Cyan (BGR)
    1: (0, 165, 255)     # TUBE: Orange (BGR)
}

CLASS_NAMES = {
    0: "PIV",
    1: "TUBE"
}

def draw_yolo_boxes(image, label_path):
    """Draw bounding boxes and class labels onto the image."""
    h, w, _ = image.shape
    if not label_path.exists():
        return image
        
    with open(label_path, 'r', encoding='utf-8') as f:
        for line in f:
            tokens = line.strip().split()
            if len(tokens) != 5:
                continue
            cls_id = int(tokens[0])
            xc, yc, bw, bh = map(float, tokens[1:])
            
            # Convert normalized YOLO format to pixel coordinates
            x1 = int((xc - bw / 2.0) * w)
            y1 = int((yc - bh / 2.0) * h)
            x2 = int((xc + bw / 2.0) * w)
            y2 = int((yc + bh / 2.0) * h)
            
            # Clamp to image boundaries
            x1 = max(0, min(w - 1, x1))
            y1 = max(0, min(h - 1, y1))
            x2 = max(0, min(w - 1, x2))
            y2 = max(0, min(h - 1, y2))
            
            color = CLASS_COLORS.get(cls_id, (0, 255, 0))
            name = CLASS_NAMES.get(cls_id, f"Class {cls_id}")
            
            # Draw box
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # Draw label banner
            label_text = f"{name} (id:{cls_id})"
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.5
            thickness = 1
            (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, thickness)
            
            # Draw filled background for text
            text_y1 = max(0, y1 - text_h - 6)
            text_y2 = y1
            cv2.rectangle(image, (x1, text_y1), (x1 + text_w + 6, text_y2), color, -1)
            cv2.putText(image, label_text, (x1 + 3, text_y2 - 3), font, font_scale, (0, 0, 0), thickness, cv2.LINE_AA)
            
    return image

def visualize_dataset_samples(num_samples=10, seed=42):
    base_dir = Path("D:/IVGUARD")
    dataset_dir = base_dir / "datasets/processed/ivguard_yolo"
    output_dir = base_dir / "results/detections/sample_visualizations"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    img_files = list((dataset_dir / "images").rglob("*.jpg")) + list((dataset_dir / "images").rglob("*.png"))
    if not img_files:
        print(f"[ERROR] No images found in {dataset_dir / 'images'}")
        return
        
    random.seed(seed)
    sampled = random.sample(img_files, min(num_samples, len(img_files)))
    
    print(f"Generating visual verification samples for {len(sampled)} images...")
    for idx, img_path in enumerate(sampled, 1):
        # Infer split from parent
        split = img_path.parent.name
        lbl_path = dataset_dir / "labels" / split / f"{img_path.stem}.txt"
        
        img = cv2.imread(str(img_path))
        if img is None:
            continue
            
        annotated = draw_yolo_boxes(img.copy(), lbl_path)
        out_name = f"sample_{idx:02d}_{split}_{img_path.name}"
        out_path = output_dir / out_name
        cv2.imwrite(str(out_path), annotated)
        print(f"  [{idx}/{len(sampled)}] Saved: {out_path.name}")
        
    print(f"\n[OK] Visual inspection samples saved to: {output_dir}")

if __name__ == '__main__':
    visualize_dataset_samples(num_samples=10)
