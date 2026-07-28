#!/usr/bin/env python3
"""Crop a USGS historical topographic sheet to a walking tour's frame.

The tour maps are drawn as SVG over a printed survey plate. The plate
has to line up with the geometry frame exactly, or the drawn streets
sit beside the engraved ones instead of on them. USGS sheets are in a
projected coordinate system (Transverse Mercator on Clarke 1866 for
the New York sheets) while the tour frame is plain equirectangular, so
this resamples rather than crops: every output pixel is a lat/lng under
the tour's own projection, looked up in the sheet's projection.

Then it tones the result the way the Chicago plate was toned, lifting
it toward the site's cream so the route line and stop markers stay
legible on top of it.

Usage:
  python3 scripts/walk-base-map.py \
      --src harlem-1947.tif --out public/media/harlem-walk/map-base-1947.jpg \
      --lat-min 40.798 --lat-max 40.838 --lng-min -73.975 --lng-max -73.920 \
      --width 2000
"""
import argparse
import math

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def read_geotiff_reference(path):
    """ModelPixelScale, ModelTiepoint and the projection geokeys."""
    import struct

    f = open(path, "rb")
    head = f.read(8)
    e = "<" if head[:2] == b"II" else ">"
    off = struct.unpack(e + "I", head[4:8])[0]
    f.seek(off)
    n = struct.unpack(e + "H", f.read(2))[0]
    size = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8}
    tags = {}
    for _ in range(n):
        tag, typ, cnt = struct.unpack(e + "HHI", f.read(8))
        vo = f.read(4)
        total = size.get(typ, 1) * cnt
        if total <= 4:
            data = vo[:total]
        else:
            p = struct.unpack(e + "I", vo)[0]
            cur = f.tell()
            f.seek(p)
            data = f.read(total)
            f.seek(cur)
        if typ == 12:
            tags[tag] = struct.unpack(e + f"{cnt}d", data)
        elif typ == 3:
            tags[tag] = struct.unpack(e + f"{cnt}H", data)
        elif typ == 4:
            tags[tag] = struct.unpack(e + f"{cnt}I", data)
        else:
            tags[tag] = data
    f.close()

    scale = tags[33550]
    tie = tags[33922]
    gk = tags[34735]
    dbl = tags.get(34736, ())
    keys = {}
    for i in range(4, len(gk), 4):
        key, loc, cnt, val = gk[i : i + 4]
        keys[key] = dbl[val : val + cnt] if loc == 34736 else val
    return {
        "px": scale[0],
        "py": scale[1],
        "x0": tie[3],
        "y0": tie[4],
        "lat0": keys[3081][0],
        "lon0": keys[3080][0],
        "k0": keys.get(3092, (1.0,))[0],
        "fe": keys.get(3082, (0.0,))[0],
        "fn": keys.get(3083, (0.0,))[0],
        "a": keys.get(2057, (6378206.4,))[0],
        "invf": keys.get(2059, (294.9786982139006,))[0],
    }


def tm_forward(lat, lon, ref):
    """Transverse Mercator forward, ellipsoidal. Returns projected x, y.

    Standard Snyder series, good to millimetres over a quadrangle.
    """
    a = ref["a"]
    f = 1.0 / ref["invf"]
    e2 = 2 * f - f * f
    ep2 = e2 / (1 - e2)
    k0 = ref["k0"]
    lat0 = math.radians(ref["lat0"])
    lon0 = math.radians(ref["lon0"])

    phi = np.radians(lat)
    lam = np.radians(lon)

    def meridian_arc(p):
        return a * (
            (1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * p
            - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * np.sin(2 * p)
            + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * np.sin(4 * p)
            - (35 * e2**3 / 3072) * np.sin(6 * p)
        )

    N = a / np.sqrt(1 - e2 * np.sin(phi) ** 2)
    T = np.tan(phi) ** 2
    C = ep2 * np.cos(phi) ** 2
    A = (lam - lon0) * np.cos(phi)
    M = meridian_arc(phi)
    M0 = meridian_arc(np.array(lat0))

    x = k0 * N * (
        A
        + (1 - T + C) * A**3 / 6
        + (5 - 18 * T + T**2 + 72 * C - 58 * ep2) * A**5 / 120
    ) + ref["fe"]
    y = k0 * (
        M
        - M0
        + N
        * np.tan(phi)
        * (
            A**2 / 2
            + (5 - T + 9 * C + 4 * C**2) * A**4 / 24
            + (61 - 58 * T + T**2 + 600 * C - 330 * ep2) * A**6 / 720
        )
    ) + ref["fn"]
    return x, y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--lat-min", type=float, required=True)
    ap.add_argument("--lat-max", type=float, required=True)
    ap.add_argument("--lng-min", type=float, required=True)
    ap.add_argument("--lng-max", type=float, required=True)
    ap.add_argument("--width", type=int, default=2000)
    ap.add_argument(
        "--lift",
        type=float,
        default=0.55,
        help="how far to pull the sheet toward the site's cream, 0 to 1",
    )
    args = ap.parse_args()

    ref = read_geotiff_reference(args.src)
    src = np.asarray(Image.open(args.src).convert("RGB"))
    sh, sw = src.shape[:2]

    # the output grid is the tour's own frame, so viewBox maths on the
    # site lands on the same pixels
    lat_mid = (args.lat_min + args.lat_max) / 2
    cos_lat = math.cos(math.radians(lat_mid))
    W = args.width
    H = round(
        W * (args.lat_max - args.lat_min) / ((args.lng_max - args.lng_min) * cos_lat)
    )

    lon = np.linspace(args.lng_min, args.lng_max, W)[None, :]
    lat = np.linspace(args.lat_max, args.lat_min, H)[:, None]
    lon = np.broadcast_to(lon, (H, W))
    lat = np.broadcast_to(lat, (H, W))

    px, py = tm_forward(lat, lon, ref)
    col = np.rint((px - ref["x0"]) / ref["px"]).astype(np.int64)
    row = np.rint((ref["y0"] - py) / ref["py"]).astype(np.int64)

    inside = (col >= 0) & (col < sw) & (row >= 0) & (row < sh)
    if not inside.all():
        missing = 100 * (1 - inside.mean())
        print(f"warning: {missing:.2f}% of the frame falls outside the sheet")
    np.clip(col, 0, sw - 1, out=col)
    np.clip(row, 0, sh - 1, out=row)

    out = src[row, col]

    # Tone it back so the drawn map reads on top. The sheet's own
    # ink stays visible as fabric; its contrast does not compete.
    cream = np.array([250, 246, 237], dtype=np.float32)
    toned = out.astype(np.float32)
    grey = toned.mean(axis=2, keepdims=True)
    toned = 0.72 * grey + 0.28 * toned          # most of the colour out
    toned = cream + (toned - cream) * (1 - args.lift)
    toned = np.clip(toned, 0, 255).astype(np.uint8)

    Image.fromarray(toned).save(args.out, quality=88, optimize=True, progressive=True)
    print(f"{args.out}  {W}x{H}  aspect {W / H:.4f}")


if __name__ == "__main__":
    main()
