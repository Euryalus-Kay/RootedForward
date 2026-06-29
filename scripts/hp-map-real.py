#!/usr/bin/env python3
"""Build a REAL dark street-map basemap for the film's locator, with the true
Hyde Park community-area boundary projected onto it.

Fetches CARTO dark (OpenStreetMap-derived) raster tiles for a frame centered on
Hyde Park, stitches + crops them to a 16:9 canvas, projects the real Hyde Park
polygon and label anchors into that pixel space, and writes:
  data/hp-basemap.png        the stitched real map (warm-dark, ready to tint)
  data/hp-map-real.json      { size, hp_polygon[[x,y]...], labels[...], attribution }

The renderer's map_scene reads these. Cached: re-run only to change the frame.
Attribution required on screen: (c) OpenStreetMap contributors, (c) CARTO.
"""
import json, math, os, io, urllib.request
import numpy as np
from scipy import ndimage
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Z = 15                       # tile zoom (street detail without clutter)
BW, BH = 2560, 1440          # basemap canvas (16:9), downscaled to 1920 at render -> crisp
CTR_LAT, CTR_LON = 41.7908, -87.5815   # Hyde Park centered, the lake opens to the right
TILE = "https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"

def world_px(lat, lon, z=Z):
    n = 256 * 2 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y

# canvas origin in world pixels (top-left)
cx, cy = world_px(CTR_LAT, CTR_LON)
ox, oy = cx - BW / 2, cy - BH / 2

def to_canvas(lat, lon):
    x, y = world_px(lat, lon)
    return (x - ox, y - oy)

def fetch_tile(tx, ty):
    cache = os.path.join(ROOT, "data", "tiles", f"{Z}_{tx}_{ty}.png")
    os.makedirs(os.path.dirname(cache), exist_ok=True)
    if os.path.exists(cache):
        return Image.open(cache).convert("RGB")
    url = TILE.format(z=Z, x=tx, y=ty)
    req = urllib.request.Request(url, headers={"User-Agent": "rooted-forward-map/1.0 (civic documentary)"})
    d = urllib.request.urlopen(req, timeout=30).read()
    open(cache, "wb").write(d)
    return Image.open(io.BytesIO(d)).convert("RGB")

# --- stitch the tiles covering [ox..ox+BW] x [oy..oy+BH] ---
tx0, ty0 = int(ox // 256), int(oy // 256)
tx1, ty1 = int((ox + BW) // 256), int((oy + BH) // 256)
big = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
n = 0
for tx in range(tx0, tx1 + 1):
    for ty in range(ty0, ty1 + 1):
        big.paste(fetch_tile(tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))
        n += 1
print(f"stitched {n} tiles at z{Z}")
# crop to the exact canvas
crop_x = int(ox - tx0 * 256); crop_y = int(oy - ty0 * 256)
base = big.crop((crop_x, crop_y, crop_x + BW, crop_y + BH))

# --- cinematic recolor: the CARTO dark map is grayscale (land ~14, water ~38,
# parks ~11). Repaint it in the film palette: warm-dark land with faint warm
# streets, forest-tinted parks, a deep-teal lake (flood-filled from open water
# so scattered building fills of the same gray are not mistaken for water). ---
arr = np.array(base).astype(np.float32)
g = arr[:, :, 0]
near = np.abs(arr - 38.0).max(axis=2) < 9          # flat ~38 gray == water-or-building
lbl, _ = ndimage.label(near)
seed = 0
for xx in range(BW - 5, BW // 2, -1):              # seed from the open lake (right edge)
    if near[BH // 2, xx]:
        seed = lbl[BH // 2, xx]; break
lake = ndimage.binary_fill_holes(lbl == seed) if seed else near
park = (g <= 12.5) & ~lake
out = np.empty_like(arr)
out[..., 0] = g * 1.30 + 5                          # land: warm dark, faint warm streets
out[..., 1] = g * 1.05 + 3
out[..., 2] = g * 0.80 + 2
out[park, 0] = g[park] * 1.00 + 10                  # parks: forest-dark
out[park, 1] = g[park] * 1.70 + 14
out[park, 2] = g[park] * 1.10 + 10
out[lake, 0] = g[lake] * 0.30 + 11                  # lake: deep teal (kept dark + cinematic)
out[lake, 1] = g[lake] * 0.66 + 24
out[lake, 2] = g[lake] * 0.78 + 30
base = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGB")
base.save(os.path.join(ROOT, "data", "hp-basemap.png"))

# --- project the real Hyde Park polygon (largest ring of the HYDE PARK area) ---
g = json.load(open(os.path.join(ROOT, "data/geo/ca.geojson")))
def rings(geom):
    if geom["type"] == "Polygon":
        return geom["coordinates"]
    return [r for poly in geom["coordinates"] for r in poly]
hp_feat = next(f for f in g["features"] if f["properties"].get("community") == "HYDE PARK")
hp_rings = rings(hp_feat["geometry"])
hp_ring = max(hp_rings, key=len)                 # outer boundary
hp_poly = [[round(x, 1), round(y, 1)] for x, y in (to_canvas(p[1], p[0]) for p in hp_ring)]

def centroid(community):
    f = next(ff for ff in g["features"] if ff["properties"].get("community") == community)
    pts = [p for r in rings(f["geometry"]) for p in r]
    return (sum(p[1] for p in pts) / len(pts), sum(p[0] for p in pts) / len(pts))

# label anchors: (text, lat, lon, role)
khp = centroid("HYDE PARK")
labels = [
    {"t": "HYDE PARK",       "xy": list(to_canvas(*khp)),                 "role": "hero"},
    {"t": "KENWOOD",         "xy": list(to_canvas(*centroid("KENWOOD"))), "role": "nbr"},
    {"t": "WOODLAWN",        "xy": list(to_canvas(*centroid("WOODLAWN"))),"role": "nbr"},
    {"t": "WASHINGTON PARK", "xy": list(to_canvas(41.7918, -87.6155)),    "role": "park"},
    {"t": "JACKSON PARK",    "xy": list(to_canvas(41.7806, -87.5790)),    "role": "park"},
    {"t": "THE MIDWAY",      "xy": list(to_canvas(41.7905, -87.5985)),    "role": "thin"},
    {"t": "LAKE MICHIGAN",   "xy": list(to_canvas(41.7980, -87.5520)),    "role": "lake"},
]
out = {
    "size": [BW, BH],
    "hp_polygon": hp_poly,
    "hp_center": list(to_canvas(*khp)),
    "labels": labels,
    "attribution": "Map data (c) OpenStreetMap contributors, (c) CARTO",
}
json.dump(out, open(os.path.join(ROOT, "data", "hp-map-real.json"), "w"))
print("HP polygon points:", len(hp_poly), "center:", out["hp_center"])
print("wrote data/hp-basemap.png + data/hp-map-real.json")
