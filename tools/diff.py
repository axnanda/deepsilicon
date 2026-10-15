"""Pixel-diff two screenshot dirs produced by shoot.mjs.

usage: python3 tools/diff.py <dirA> <dirB> <outDir>
Prints per-file size and % differing pixels; writes red-highlighted diff images.
"""
import os
import sys

import numpy as np
from PIL import Image

a_dir, b_dir, out_dir = sys.argv[1:4]
os.makedirs(out_dir, exist_ok=True)
for name in sorted(os.listdir(a_dir)):
    pb = os.path.join(b_dir, name)
    if not name.endswith(".png") or not os.path.exists(pb):
        continue
    a = np.asarray(Image.open(os.path.join(a_dir, name)).convert("RGB")).astype(int)
    b = np.asarray(Image.open(pb).convert("RGB")).astype(int)
    h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
    mask = np.abs(a[:h, :w] - b[:h, :w]).sum(axis=2) > 24
    pct = 100 * mask.mean()
    rows = np.where(mask.any(axis=1))[0]
    span = f"rows {rows.min()}-{rows.max()}" if len(rows) else "-"
    print(f"{name:28s} A={a.shape[1]}x{a.shape[0]} B={b.shape[1]}x{b.shape[0]} diff={pct:.3f}% {span}")
    vis = (a[:h, :w] * 0.35).astype(np.uint8)
    vis[mask] = [255, 0, 0]
    Image.fromarray(vis).save(os.path.join(out_dir, name))
