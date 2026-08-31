"""
IVGuard Dataset Preparation Script
Processes public datasets into a unified YOLO object detection dataset for YOLO26n.
- Dataset 1: Extracts PIV (bbox, class 0) & TUBE (polygon -> bbox conversion, class 1); Discards BLOOD.
- Dataset 2: Deterministic 80/10/10 split for IV-CATHETER (mapped to PIV, class 0).
- Dataset 3: Excluded (no spatial annotations).
- Deduplication: MD5 hash tracking.
- Output: datasets/processed/ivguard_yolo/
"""

import os
import shutil
import hashlib
import random
from pathlib import Path
from collections import defaultdict, Counter
import cv2
import yaml

RANDOM_SEED = 42

def compute_md5(filepath):
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def polygon_to_bbox(coords):
    """
    Converts normalized polygon coordinates [x1, y1, x2, y2, ...] to normalized YOLO bbox [xc, yc, w, h].
    Clamps coordinates to [0.0, 1.0].
    """
    xs = coords[0::2]
    ys = coords[1::2]
    
    x_min = max(0.0, min(xs))
    x_max = min(1.0, max(xs))
    y_min = max(0.0, min(ys))
    y_max = min(1.0, max(ys))
    
    w = x_max - x_min
    h = y_max - y_min
    xc = x_min + (w / 2.0)
    yc = y_min + (h / 2.0)
    
    return xc, yc, w, h

def prepare_ivguard_dataset():
    base_dir = Path("D:/IVGUARD")
    d1_dir = base_dir / "datasets/public/1"
    d2_dir = base_dir / "datasets/public/2"
    output_dir = base_dir / "datasets/processed/ivguard_yolo"
    
    # Create target directories
    for split in ['train', 'val', 'test']:
        (output_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (output_dir / "labels" / split).mkdir(parents=True, exist_ok=True)
        
    seen_hashes = {}  # hash -> (split, target_img_name)
    stats = {
        'd1_images_processed': 0,
        'd2_images_processed': 0,
        'duplicates_skipped': 0,
        'corrupt_images': 0,
        'blood_annotations_discarded': 0,
        'piv_annotations': 0,
        'tube_annotations': 0,
        'tube_polygons_converted': 0,
        'split_images': Counter(),
        'split_labels': Counter(),
        'split_annotations': defaultdict(Counter)
    }
    
    print("=" * 70)
    print("STEP 1: Processing Dataset 1 (Peripheral intravenous access 4)...")
    print("=" * 70)
    
    # Mapping for D1:
    # 0 = BLOOD -> discard
    # 1 = PIV -> 0 (PIV)
    # 2 = TUBE -> 1 (TUBE)
    
    d1_split_mapping = {
        'train': 'train',
        'valid': 'val',
        'test': 'test'
    }
    
    for src_split, target_split in d1_split_mapping.items():
        src_img_dir = d1_dir / src_split / "images"
        src_lbl_dir = d1_dir / src_split / "labels"
        
        valid_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        img_files = sorted([p for p in src_img_dir.glob('*') if p.suffix.lower() in valid_exts])
        
        for img_path in img_files:
            # Check image readability
            img_mat = cv2.imread(str(img_path))
            if img_mat is None:
                print(f"[WARN] Corrupt image found in D1: {img_path}")
                stats['corrupt_images'] += 1
                continue
                
            img_hash = compute_md5(img_path)
            if img_hash in seen_hashes:
                print(f"[WARN] Exact duplicate image skipped: {img_path.name} matches {seen_hashes[img_hash]}")
                stats['duplicates_skipped'] += 1
                continue
                
            target_img_name = f"d1_{src_split}_{img_path.name}"
            target_lbl_name = f"d1_{src_split}_{img_path.stem}.txt"
            
            target_img_path = output_dir / "images" / target_split / target_img_name
            target_lbl_path = output_dir / "labels" / target_split / target_lbl_name
            
            # Read and process corresponding label file
            src_lbl_path = src_lbl_dir / f"{img_path.stem}.txt"
            out_label_lines = []
            
            if src_lbl_path.exists():
                with open(src_lbl_path, 'r', encoding='utf-8') as lf:
                    for line in lf:
                        line = line.strip()
                        if not line:
                            continue
                        tokens = line.split()
                        try:
                            cls_id = int(tokens[0])
                        except ValueError:
                            continue
                            
                        if cls_id == 0:  # BLOOD
                            stats['blood_annotations_discarded'] += 1
                            continue
                        elif cls_id == 1:  # PIV -> map to class 0
                            # YOLO bounding box: cls_id xc yc w h
                            coords = [float(x) for x in tokens[1:]]
                            if len(coords) == 4:
                                xc, yc, w, h = coords
                                # validate coordinates
                                if w > 0 and h > 0 and 0 <= xc <= 1 and 0 <= yc <= 1:
                                    out_label_lines.append(f"0 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                                    stats['piv_annotations'] += 1
                                    stats['split_annotations'][target_split]['PIV'] += 1
                        elif cls_id == 2:  # TUBE -> map to class 1
                            coords = [float(x) for x in tokens[1:]]
                            if len(coords) == 4:  # Already bounding box
                                xc, yc, w, h = coords
                                if w > 0 and h > 0 and 0 <= xc <= 1 and 0 <= yc <= 1:
                                    out_label_lines.append(f"1 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                                    stats['tube_annotations'] += 1
                                    stats['split_annotations'][target_split]['TUBE'] += 1
                            elif len(coords) >= 6 and len(coords) % 2 == 0:  # Polygon
                                xc, yc, w, h = polygon_to_bbox(coords)
                                if w > 0 and h > 0 and 0 <= xc <= 1 and 0 <= yc <= 1:
                                    out_label_lines.append(f"1 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                                    stats['tube_annotations'] += 1
                                    stats['tube_polygons_converted'] += 1
                                    stats['split_annotations'][target_split]['TUBE'] += 1
            
            # Copy image
            shutil.copy2(img_path, target_img_path)
            # Write label file (even if empty, for background images)
            with open(target_lbl_path, 'w', encoding='utf-8') as out_f:
                if out_label_lines:
                    out_f.write("\n".join(out_label_lines) + "\n")
                    
            seen_hashes[img_hash] = (target_split, target_img_name)
            stats['d1_images_processed'] += 1
            stats['split_images'][target_split] += 1
            stats['split_labels'][target_split] += 1

    print(f"[OK] Dataset 1 processed: {stats['d1_images_processed']} images transferred.")
    print(f"   Discarded {stats['blood_annotations_discarded']} BLOOD annotations.")
    print(f"   Converted {stats['tube_polygons_converted']} TUBE polygon annotations into bounding boxes.")

    print("\n" + "=" * 70)
    print("STEP 2: Processing Dataset 2 (IV Catheter)...")
    print("=" * 70)
    
    # Dataset 2: deterministic 80/10/10 split
    d2_img_dir = d2_dir / "train/images"
    d2_lbl_dir = d2_dir / "train/labels"
    
    d2_img_files = sorted([p for p in d2_img_dir.glob('*') if p.suffix.lower() in {'.jpg', '.jpeg', '.png'}])
    
    # Deterministic shuffle
    rng = random.Random(RANDOM_SEED)
    shuffled_indices = list(range(len(d2_img_files)))
    rng.shuffle(shuffled_indices)
    
    n_total = len(d2_img_files)
    n_train = int(round(n_total * 0.80))   # 57 * 0.8 = 45.6 -> 46
    n_val = int(round(n_total * 0.10))     # 57 * 0.1 = 5.7 -> 6
    n_test = n_total - n_train - n_val     # 57 - 46 - 6 = 5
    
    d2_splits = {}
    for idx, orig_idx in enumerate(shuffled_indices):
        if idx < n_train:
            d2_splits[d2_img_files[orig_idx]] = 'train'
        elif idx < n_train + n_val:
            d2_splits[d2_img_files[orig_idx]] = 'val'
        else:
            d2_splits[d2_img_files[orig_idx]] = 'test'
            
    print(f"Dataset 2 split allocation: {n_train} train, {n_val} val, {n_test} test (Total: {n_total})")
    
    for img_path, target_split in d2_splits.items():
        img_mat = cv2.imread(str(img_path))
        if img_mat is None:
            print(f"[WARN] Corrupt image found in D2: {img_path}")
            stats['corrupt_images'] += 1
            continue
            
        img_hash = compute_md5(img_path)
        if img_hash in seen_hashes:
            print(f"[WARN] Exact duplicate image skipped: {img_path.name} matches {seen_hashes[img_hash]}")
            stats['duplicates_skipped'] += 1
            continue
            
        target_img_name = f"d2_{img_path.name}"
        target_lbl_name = f"d2_{img_path.stem}.txt"
        
        target_img_path = output_dir / "images" / target_split / target_img_name
        target_lbl_path = output_dir / "labels" / target_split / target_lbl_name
        
        src_lbl_path = d2_lbl_dir / f"{img_path.stem}.txt"
        out_label_lines = []
        
        if src_lbl_path.exists():
            with open(src_lbl_path, 'r', encoding='utf-8') as lf:
                for line in lf:
                    line = line.strip()
                    if not line:
                        continue
                    tokens = line.split()
                    try:
                        cls_id = int(tokens[0])
                    except ValueError:
                        continue
                    # IV-CATHETER (class 0 in D2) -> map to PIV (class 0)
                    coords = [float(x) for x in tokens[1:]]
                    if len(coords) == 4:
                        xc, yc, w, h = coords
                        if w > 0 and h > 0 and 0 <= xc <= 1 and 0 <= yc <= 1:
                            out_label_lines.append(f"0 {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}")
                            stats['piv_annotations'] += 1
                            stats['split_annotations'][target_split]['PIV'] += 1
                            
        shutil.copy2(img_path, target_img_path)
        with open(target_lbl_path, 'w', encoding='utf-8') as out_f:
            if out_label_lines:
                out_f.write("\n".join(out_label_lines) + "\n")
                
        seen_hashes[img_hash] = (target_split, target_img_name)
        stats['d2_images_processed'] += 1
        stats['split_images'][target_split] += 1
        stats['split_labels'][target_split] += 1

    print(f"[OK] Dataset 2 processed: {stats['d2_images_processed']} images transferred.")

    print("\n" + "=" * 70)
    print("STEP 3: Generating data.yaml...")
    print("=" * 70)
    
    data_yaml_content = {
        'path': 'D:/IVGUARD/datasets/processed/ivguard_yolo',
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test',
        'nc': 2,
        'names': {
            0: 'PIV',
            1: 'TUBE'
        }
    }
    
    yaml_path = output_dir / "data.yaml"
    with open(yaml_path, 'w', encoding='utf-8') as yf:
        yaml.dump(data_yaml_content, yf, default_flow_style=False, sort_keys=False)
    print(f"[OK] Created clean data.yaml at {yaml_path}")
    
    print("\n" + "=" * 70)
    print("PREPARATION SUMMARY:")
    print("=" * 70)
    print(f"Total Unified Images: {sum(stats['split_images'].values())}")
    print(f"  - Train Images: {stats['split_images']['train']}")
    print(f"  - Val Images:   {stats['split_images']['val']}")
    print(f"  - Test Images:  {stats['split_images']['test']}")
    print(f"Total Annotations: {stats['piv_annotations'] + stats['tube_annotations']}")
    print(f"  - PIV (Class 0):  {stats['piv_annotations']}")
    print(f"  - TUBE (Class 1): {stats['tube_annotations']}")
    print(f"Discarded BLOOD Annotations: {stats['blood_annotations_discarded']}")
    print(f"Converted TUBE Polygons: {stats['tube_polygons_converted']}")
    print(f"Duplicate Images Removed: {stats['duplicates_skipped']}")
    print(f"Corrupt Images Encountered: {stats['corrupt_images']}")

if __name__ == '__main__':
    prepare_ivguard_dataset()
