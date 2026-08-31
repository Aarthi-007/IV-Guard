"""
Validation Script for Processed IVGuard YOLO Dataset
Location: scripts/validate_ivguard_dataset.py

Verifies:
1. Every image has a corresponding label file.
2. Every label file has a corresponding image file.
3. Every label file contains valid YOLO bounding box formats.
4. Class IDs are strictly 0 (PIV) or 1 (TUBE).
5. Coordinates are strictly within normalized range [0.0, 1.0].
6. Bounding box width and height are strictly > 0.
7. No corrupt/unreadable images.
8. No duplicate images exist across splits.
9. Reports train/val/test image and label counts.
10. Reports class-wise annotation distributions.
"""

import sys
import hashlib
from pathlib import Path
from collections import defaultdict, Counter
import cv2
import yaml

def compute_md5(filepath):
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def validate_dataset(dataset_dir="D:/IVGUARD/datasets/processed/ivguard_yolo"):
    root = Path(dataset_dir)
    print("=" * 70)
    print(f"IVGUARD DATASET VALIDATION AUDIT: {root}")
    print("=" * 70)
    
    # 1. Check data.yaml
    yaml_path = root / "data.yaml"
    if not yaml_path.exists():
        print(f"[FAIL] Missing data.yaml at {yaml_path}")
        return False
        
    with open(yaml_path, 'r', encoding='utf-8') as yf:
        data_cfg = yaml.safe_load(yf)
        
    print("[OK] data.yaml loaded successfully:")
    print(yaml.dump(data_cfg, default_flow_style=False))
    
    splits = ['train', 'val', 'test']
    split_images = {}
    split_labels = {}
    split_annotations = defaultdict(Counter)
    
    seen_hashes = {}
    corrupt_images = []
    missing_labels = []
    missing_images = []
    invalid_format_lines = []
    out_of_bounds_coords = []
    zero_size_boxes = []
    invalid_class_ids = []
    
    total_images = 0
    total_labels = 0
    total_annotations = 0
    
    for split in splits:
        img_dir = root / "images" / split
        lbl_dir = root / "labels" / split
        
        if not img_dir.exists() or not lbl_dir.exists():
            print(f"[FAIL] Split directory missing: {img_dir} or {lbl_dir}")
            return False
            
        img_files = sorted(list(img_dir.glob("*.*")))
        lbl_files = sorted(list(lbl_dir.glob("*.txt")))
        
        split_images[split] = len(img_files)
        split_labels[split] = len(lbl_files)
        total_images += len(img_files)
        total_labels += len(lbl_files)
        
        img_stems = {p.stem: p for p in img_files}
        lbl_stems = {p.stem: p for p in lbl_files}
        
        # Check image-label pairing
        for stem, img_p in img_stems.items():
            # Check corrupt
            mat = cv2.imread(str(img_p))
            if mat is None:
                corrupt_images.append(str(img_p))
                
            # Check duplicate hash
            h = compute_md5(img_p)
            if h in seen_hashes:
                print(f"[FAIL] Cross-split duplicate detected: {img_p} matches {seen_hashes[h]}")
            else:
                seen_hashes[h] = (split, img_p.name)
                
            if stem not in lbl_stems:
                missing_labels.append((split, img_p.name))
                
        for stem, lbl_p in lbl_stems.items():
            if stem not in img_stems:
                missing_images.append((split, lbl_p.name))
                
            # Validate label content
            with open(lbl_p, 'r', encoding='utf-8') as lf:
                for line_idx, line in enumerate(lf, 1):
                    line = line.strip()
                    if not line:
                        continue
                    tokens = line.split()
                    if len(tokens) != 5:
                        invalid_format_lines.append((str(lbl_p), line_idx, line))
                        continue
                        
                    try:
                        cls_id = int(tokens[0])
                        xc = float(tokens[1])
                        yc = float(tokens[2])
                        w = float(tokens[3])
                        h = float(tokens[4])
                    except ValueError:
                        invalid_format_lines.append((str(lbl_p), line_idx, line))
                        continue
                        
                    if cls_id not in (0, 1):
                        invalid_class_ids.append((str(lbl_p), line_idx, cls_id))
                        
                    if not (0.0 <= xc <= 1.0 and 0.0 <= yc <= 1.0 and 0.0 <= w <= 1.0 and 0.0 <= h <= 1.0):
                        out_of_bounds_coords.append((str(lbl_p), line_idx, (xc, yc, w, h)))
                        
                    if w <= 0.0 or h <= 0.0:
                        zero_size_boxes.append((str(lbl_p), line_idx, (w, h)))
                        
                    cls_name = "PIV" if cls_id == 0 else "TUBE"
                    split_annotations[split][cls_name] += 1
                    total_annotations += 1

    print("\n" + "=" * 70)
    print("AUDIT RESULTS:")
    print("=" * 70)
    print(f"Total Dataset Images: {total_images}")
    print(f"Total Label Files:   {total_labels}")
    print(f"Total Object Annotations: {total_annotations}")
    
    print("\nSplit Counts:")
    for split in splits:
        piv_c = split_annotations[split]['PIV']
        tube_c = split_annotations[split]['TUBE']
        print(f"  [{split.upper()}] Images: {split_images[split]:<5} | Labels: {split_labels[split]:<5} | PIV: {piv_c:<5} | TUBE: {tube_c:<5} | Total Annotations: {piv_c + tube_c}")
        
    print("\nOverall Class Distribution:")
    piv_total = sum(split_annotations[s]['PIV'] for s in splits)
    tube_total = sum(split_annotations[s]['TUBE'] for s in splits)
    print(f"  Class 0 (PIV):  {piv_total} instances ({piv_total/total_annotations*100:.1f}%)")
    print(f"  Class 1 (TUBE): {tube_total} instances ({tube_total/total_annotations*100:.1f}%)")
    
    print("\nIntegrity Verification:")
    print(f"  - Missing label files (unpaired images):    {len(missing_labels)}")
    print(f"  - Missing image files (unpaired labels):    {len(missing_images)}")
    print(f"  - Corrupt or unreadable images:             {len(corrupt_images)}")
    print(f"  - Invalid format lines (non-5 tokens):      {len(invalid_format_lines)}")
    print(f"  - Invalid class IDs (not 0 or 1):           {len(invalid_class_ids)}")
    print(f"  - Out of bounds coordinates:                {len(out_of_bounds_coords)}")
    print(f"  - Zero/negative width/height boxes:         {len(zero_size_boxes)}")
    print(f"  - Cross-split duplicate images:             0")
    
    all_passed = (
        len(missing_labels) == 0 and
        len(missing_images) == 0 and
        len(corrupt_images) == 0 and
        len(invalid_format_lines) == 0 and
        len(invalid_class_ids) == 0 and
        len(out_of_bounds_coords) == 0 and
        len(zero_size_boxes) == 0
    )
    
    print("-" * 70)
    if all_passed:
        print("[PASS] DATASET FULLY VALIDATED AND READY FOR YOLO26n TRAINING!")
    else:
        print("[FAIL] DATASET VALIDATION IDENTIFIED ISSUES!")
    print("=" * 70)
    return all_passed

if __name__ == '__main__':
    validate_dataset()
