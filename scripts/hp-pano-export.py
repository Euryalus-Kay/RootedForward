#!/usr/bin/env python3
"""Stitch the owner's Insta360 dual-fisheye .insp captures into proper full
equirectangular panoramas for the website PanoViewer and the film's pano cards.

The .insp files are DUAL-FISHEYE (two ~193 deg circular lenses side by side,
11904x5952). The earlier pipeline mistakenly resized them straight to 2:1, so the
viewer showed black gaps. This projects fisheye -> equirectangular (ffmpeg v360)
so the sphere is fully covered, with a per-pano yaw so the key subject faces the
default (front) view. Writes 4096x2048 web JPEGs + 1280x640 posters.
"""
import os, subprocess, sys
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LM = os.path.join(ROOT, "Live Media")
OUT = os.path.join(ROOT, "public/media/hyde-park/360")
FOV = 193  # Insta360 lens FOV; slight overlap fills the sphere with no black gaps

# id -> (source .insp, yaw to bring the key subject to the front-center view)
PANOS = {
    "founding-rock": ("IMG_20260628_114430_00_007.insp", 20),    # the Cornell memorial stone, centered
    "cobb-hall":     ("IMG_20260628_123325_00_013.insp", 90),    # the Gothic facade / entrance
    "modern-quad":   ("IMG_20260628_123420_00_015.insp", 180),   # the University of Chicago Gothic main quad
}

def run(args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + args, check=True)

only = sys.argv[1] if len(sys.argv) > 1 else None
for pid, (src, yaw) in PANOS.items():
    if only and only != pid:
        continue
    clean = f"/tmp/df_{pid}.jpg"
    Image.open(os.path.join(LM, src)).convert("RGB").save(clean, quality=96)  # strip Insta360 trailer
    web = os.path.join(OUT, f"{pid}.jpg")
    run(["-i", clean,
         "-vf", f"v360=dfisheye:e:ih_fov={FOV}:iv_fov={FOV}:yaw={yaw}:w=4096:h=2048,format=yuv420p",
         "-q:v", "2", web])
    Image.open(web).resize((1280, 640), Image.LANCZOS).save(os.path.join(OUT, f"{pid}-poster.jpg"), quality=88)
    print(f"{pid}: stitched from {src} (yaw {yaw}) -> {web}")
print("done")
