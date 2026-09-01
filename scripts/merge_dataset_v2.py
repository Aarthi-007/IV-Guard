"""
IVGuard Dataset Merger & Builder for PIV/TUBE v2
Location: scripts/merge_dataset_v2.py

Merges existing processed IVGuard dataset (0: PIV, 1: TUBE) with new annotated dataset in datasets/public/OWN.
Outputs to: datasets/ivguard_piv_tube_v2/
"""

import os
import shutil
import random
from pathlib import Path
from collections import Counter
import cv2
import yaml

RANDOM_SEED = 42

def merge_datasets():
    base_dir = Path("D:/IVGUARD")
    existing_dir = base_dir / "datasets/processed/ivguard_yolo"
    own_dir = base_dir / "datasets/public/OWN"
    output_dir = base_dir / "datasets/ivguard_piv_tube_v2"

    print("=" * 75)
    print("      IVGUARD DATASET MERGER — BUILDING ivguard_piv_tube_v2")
    print("=" * 75)

    # 1. Prepare clean output structure
    if output_dir.exists():
        shutil.rmtree(output_dir)
    
    for split in ['train', 'val', 'test']:
        (output_dir / "images" / split).mkdir(parents=True, exist_ok=True)
        (output_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    # 2. Copy existing dataset (already cleaned 2-class: 0=PIV, 1=TUBE)
    print("\n[Step 1] Copying existing processed dataset from:", existing_dir)
    existing_counts = Counter()
    for split in ['train', 'val', 'test']:
        src_img_dir = existing_dir / "images" / split
        src_lbl_dir = existing_dir / "labels" / split
        
        dst_img_dir = output_dir / "images" / split
        dst_lbl_dir = output_dir / "labels" / split
        
        img_files = list(src_img_dir.glob("*.*"))
        for img in img_files:
            shutil.copy2(img, dst_img_dir / img.name)
            lbl = src_lbl_dir / f"{img.stem}.txt"
            if lbl.exists():
                shutil.copy2(lbl, dst_lbl_dir / lbl.name)
            else:
                # empty label file
                (dst_lbl_dir / f"{img.stem}.txt").write_text("")
            existing_counts[split] += 1
        print(f"   Split '{split}': {existing_counts[split]} images copied.")

    # 3. Add and split new OWN dataset (11 images)
    print("\n[Step 2] Adding and splitting new OWN dataset from:", own_dir)
    own_img_dir = own_dir / "images" / "train"
    own_lbl_dir = own_dir / "labels" / "train"
    
    own_imgs = sorted(list(own_img_dir.glob("*.jpg")) + list(own_img_dir.glob("*.png")))
    random.seed(RANDOM_SEED)
    shuffled_own = list(own_imgs)
    random.shuffle(shuffled_own)
    
    # 11 images: 7 train, 2 val, 2 test
    own_splits = {
        'train': shuffled_own[:7],
        'val': shuffled_own[7:9],
        'test': shuffled_own[9:]
    }
    
    own_counts = Counter()
    for split, files in own_splits.items():
        dst_img_dir = output_dir / "images" / split
        dst_lbl_dir = output_dir / "labels" / split
        for img_path in files:
            target_name = f"own_{img_path.name}"
            target_stem = f"own_{img_path.stem}"
            shutil.copy2(img_path, dst_img_dir / target_name)
            
            src_lbl = own_lbl_dir / f"{img_path.stem}.txt"
            if src_lbl.exists():
                shutil.copy2(src_lbl, dst_lbl_dir / f"{target_stem}.txt")
            else:
                (dst_lbl_dir / f"{target_stem}.txt").write_text("")
            own_counts[split] += 1
        print(f"   OWN Split '{split}': {own_counts[split]} images assigned.")

    # 4. Generate data.yaml
    data_yaml_content = {
        'path': str(output_dir.as_posix()),
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test',
        'nc': 2,
        'names': {
            0: 'PIV',
            1: 'TUBE'
        }
    }
    with open(output_dir / "data.yaml", "w") as f:
        yaml.dump(data_yaml_content, f, sort_keys=False)
    print(f"\n[Step 3] Generated data.yaml at: {output_dir / 'data.yaml'}")

    # 5. Full Dataset Verification & Statistics
    print("\n[Step 4] Full Dataset Audit & Verification...")
    stats = {}
    total_images = 0
    total_labels = 0
    global_classes = Counter()
    
    for split in ['train', 'val', 'test']:
        img_dir = output_dir / "images" / split
        lbl_dir = output_dir / "labels" / split
        
        imgs = list(img_dir.glob("*.*"))
        lbls = list(lbl_dir.glob("*.txt"))
        total_images += len(imgs)
        total_labels += len(lbls)
        
        split_classes = Counter()
        for lf in lbls:
            content = lf.read_text().strip()
            if not content:
                continue
            for line in content.splitlines():
                parts = line.strip().split()
                if not parts:
                    continue
                cls_id = int(parts[0])
                split_classes[cls_id] += 1
                global_classes[cls_id] += 1
                
        stats[split] = {
            'images': len(imgs),
            'labels': len(lbls),
            'piv': split_classes[0],
            'tube': split_classes[1],
            'invalid': sum(v for k, v in split_classes.items() if k not in [0, 1])
        }
        print(f"   {split.upper():5s} -> Images: {len(imgs):4d} | Labels: {len(lbls):4d} | PIV (0): {split_classes[0]:4d} | TUBE (1): {split_classes[1]:4d} | Invalid/BLOOD: {stats[split]['invalid']}")

    print("\n" + "=" * 75)
    print("                      MERGE SUMMARY REPORT")
    print("=" * 75)
    print(f"  Total Merged Images:  {total_images}")
  
    print(f"  Total Label Files:    {total_labels}")
    print(f"  Total PIV Instances:  {global_classes[0]}")
    print(f"  Total TUBE Instances: {global_classes[1]}")
    print(f"  Total BLOOD / Other:  {sum(v for k, v in global_classes.items() if k not in [0, 1])}")
    print("=" * 75)

    assert sum(v for k, v in global_classes.items() if k not in [0, 1]) == 0, "Invalid class IDs found in merged dataset!"
    print("\n[SUCCESS] ivguard_piv_tube_v2 created and verified successfully!")

if __name__ == "__main__":
    merge_datasets()
