"""
IVGuard Dataset Quality Analysis & Visual Preview
Location: scripts/dataset_quality_analysis.py

Analyzes bounding boxes, class co-occurrence, aspect ratios, and generates visual previews.
"""

from pathlib import Path
from collections import Counter, defaultdict
import cv2
import numpy as np

def analyze_dataset_quality():
    dataset_dir = Path("D:/IVGUARD/datasets/ivguard_piv_tube_v2")
    preview_dir = dataset_dir / "preview"
    preview_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 75)
    print("         IVGUARD DATASET QUALITY & GEOMETRY ANALYSIS")
    print("=" * 75)
    
    piv_boxes = []
    tube_boxes = []
    image_stats = {
        'piv_only': 0,
        'tube_only': 0,
        'both': 0,
        'empty': 0
    }
    
    all_images = list((dataset_dir / "images").glob("*/*.*"))
    print(f"Total dataset images analyzed: {len(all_images)}")
    
    sample_for_preview = []
    
    for img_path in all_images:
        split = img_path.parent.name
        lbl_path = dataset_dir / "labels" / split / f"{img_path.stem}.txt"
        
        has_piv = False
        has_tube = False
        
        if not lbl_path.exists() or lbl_path.stat().st_size == 0:
            image_stats['empty'] += 1
            continue
            
        lines = lbl_path.read_text().strip().splitlines()
        for line in lines:
            parts = line.strip().split()
            if not parts:
                continue
            cls_id = int(parts[0])
            xc, yc, w, h = map(float, parts[1:])
            
            if cls_id == 0:
                has_piv = True
                piv_boxes.append((w, h, w * h, w / h if h > 0 else 1.0))
            elif cls_id == 1:
                has_tube = True
                tube_boxes.append((w, h, w * h, w / h if h > 0 else 1.0))
                
        if has_piv and has_tube:
            image_stats['both'] += 1
            if len(sample_for_preview) < 10 or "own" in img_path.name:
                sample_for_preview.append((img_path, lbl_path))
        elif has_piv:
            image_stats['piv_only'] += 1
        elif has_tube:
            image_stats['tube_only'] += 1
            
    print("\n--- Image Co-occurrence Distribution ---")
    print(f"  Images with Both PIV & TUBE: {image_stats['both']:4d} ({image_stats['both']/len(all_images)*100:.1f}%)")
    print(f"  Images with PIV only:        {image_stats['piv_only']:4d} ({image_stats['piv_only']/len(all_images)*100:.1f}%)")
    print(f"  Images with TUBE only:       {image_stats['tube_only']:4d} ({image_stats['tube_only']/len(all_images)*100:.1f}%)")
    print(f"  Images with No annotations:  {image_stats['empty']:4d}")
    
    print("\n--- Bounding Box Geometry Statistics ---")
    if piv_boxes:
        p_w = [b[0] for b in piv_boxes]
        p_h = [b[1] for b in piv_boxes]
        p_a = [b[2] for b in piv_boxes]
        print(f"  PIV (Class 0) Count: {len(piv_boxes)}")
        print(f"    Avg Width : {np.mean(p_w)*100:.2f}% (Min: {np.min(p_w)*100:.2f}%, Max: {np.max(p_w)*100:.2f}%)")
        print(f"    Avg Height: {np.mean(p_h)*100:.2f}% (Min: {np.min(p_h)*100:.2f}%, Max: {np.max(p_h)*100:.2f}%)")
        print(f"    Avg Area  : {np.mean(p_a)*100:.2f}% of image")
        
    if tube_boxes:
        t_w = [b[0] for b in tube_boxes]
        t_h = [b[1] for b in tube_boxes]
        t_a = [b[2] for b in tube_boxes]
        print(f"  TUBE (Class 1) Count: {len(tube_boxes)}")
        print(f"    Avg Width : {np.mean(t_w)*100:.2f}% (Min: {np.min(t_w)*100:.2f}%, Max: {np.max(t_w)*100:.2f}%)")
        print(f"    Avg Height: {np.mean(t_h)*100:.2f}% (Min: {np.min(t_h)*100:.2f}%, Max: {np.max(t_h)*100:.2f}%)")
        print(f"    Avg Area  : {np.mean(t_a)*100:.2f}% of image")

    # Generate Visual Preview on 8 representative sample images
    print("\n--- Generating Visual Annotation Previews ---")
    for idx, (img_path, lbl_path) in enumerate(sample_for_preview[:8]):
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        h_img, w_img = img.shape[:2]
        lines = lbl_path.read_text().strip().splitlines()
        for line in lines:
            parts = line.strip().split()
            if not parts:
                continue
            cls_id = int(parts[0])
            xc, yc, w, h = map(float, parts[1:])
            
            x1 = int((xc - w / 2.0) * w_img)
            y1 = int((yc - h / 2.0) * h_img)
            x2 = int((xc + w / 2.0) * w_img)
            y2 = int((yc + h / 2.0) * h_img)
            
            color = (255, 200, 0) if cls_id == 0 else (0, 165, 255) # PIV Cyan/Blue, TUBE Orange
            label_text = "PIV [0]" if cls_id == 0 else "TUBE [1]"
            
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 3)
            cv2.putText(img, label_text, (x1, max(25, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            
        out_name = f"preview_{idx+1}_{img_path.stem}.jpg"
        cv2.imwrite(str(preview_dir / out_name), img)
        print(f"  Saved preview: {preview_dir / out_name}")
        
    print("\n[SUCCESS] Quality analysis completed. Previews saved to:", preview_dir)

if __name__ == "__main__":
    analyze_dataset_quality()
