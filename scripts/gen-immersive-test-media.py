#!/usr/bin/env python3
"""Generate the synthetic 360 test panorama for the immersive tour system.

Output: public/media/360/test-pano.jpg (4096x2048 equirectangular)
        public/media/360/test-pano-poster.jpg (960x480 preview)

This is a labeled TEST PATTERN, not field footage. It exists so the
hybrid 2D/3D player can be exercised before real underwater captures
are uploaded through the admin dashboard. Run with the analysis venv:

    /Users/zainzaidi/.rf-analysis-venv/bin/python scripts/gen-immersive-test-media.py
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 4096, 2048
HORIZON = int(H * 0.46)  # slightly above center: looking-down bias underwater

# Site palette (globals.css) pushed toward lake water
SURFACE = (122, 178, 192)   # lightened lake blue
SHALLOW = (74, 143, 163)    # #4A8FA3 map lake tone
MID = (38, 92, 108)
DEEP = (18, 52, 63)
FLOOR = (16, 38, 41)
CREAM = (245, 240, 232)     # #F5F0E8
RUST = (196, 93, 62)        # #C45D3E


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(img):
    px = img.load()
    for y in range(H):
        if y < HORIZON:
            t = y / max(HORIZON, 1)
            color = lerp(SURFACE, SHALLOW, t)
        else:
            t = (y - HORIZON) / max(H - HORIZON, 1)
            color = lerp(MID, DEEP, t ** 0.8)
        for x in range(0, W, 8):
            for dx in range(8):
                px[x + dx, y] = color


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_wrapped_text(draw, x, y, text, fnt, fill, anchor="mm"):
    """Draw text at x and again offset by +-W so the equirect seam stays seamless."""
    for ox in (x - W, x, x + W):
        if -600 < ox < W + 600:
            draw.text((ox, y), text, font=fnt, fill=fill, anchor=anchor)


def main():
    random.seed(41)
    img = Image.new("RGB", (W, H))
    vertical_gradient(img)

    # Light shafts from the surface, blurred wedges
    rays = Image.new("L", (W, H), 0)
    rd = ImageDraw.Draw(rays)
    for cx in (300, 900, 1750, 2500, 3300, 3900):
        top_w = random.randint(60, 140)
        bot_w = top_w * random.uniform(3.5, 5.0)
        drift = random.randint(-260, 260)
        rd.polygon(
            [(cx - top_w, 0), (cx + top_w, 0),
             (cx + drift + bot_w, HORIZON + 500), (cx + drift - bot_w, HORIZON + 500)],
            fill=random.randint(26, 46),
        )
    rays = rays.filter(ImageFilter.GaussianBlur(60))
    img.paste(Image.new("RGB", (W, H), (215, 235, 240)), (0, 0), rays)

    draw = ImageDraw.Draw(img, "RGBA")

    # Murky lake floor band
    draw.rectangle([0, int(H * 0.86), W, H], fill=FLOOR + (255,))
    for _ in range(900):
        x = random.randint(0, W - 1)
        y = random.randint(int(H * 0.84), H - 1)
        r = random.randint(1, 4)
        shade = random.randint(-12, 14)
        c = tuple(max(0, min(255, FLOOR[i] + shade)) for i in range(3))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=c + (255,))

    # Suspended sediment
    for _ in range(1400):
        x = random.randint(0, W - 1)
        y = random.randint(int(H * 0.18), int(H * 0.85))
        r = random.choice((1, 1, 1, 2))
        a = random.randint(14, 60)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(225, 238, 240, a))

    # Rising bubble trails (kept off the x=0 seam)
    for bx in (520, 1180, 1620, 2380, 2860, 3520):
        y = int(H * 0.82)
        size = random.uniform(7, 12)
        while y > int(H * 0.2):
            wobble = int(26 * math.sin(y / 90.0 + bx))
            r = size * (1 + (int(H * 0.82) - y) / 1800)
            draw.ellipse(
                [bx + wobble - r, y - r, bx + wobble + r, y + r],
                outline=(230, 244, 246, 120), width=3,
            )
            y -= random.randint(70, 130)

    # Horizon reference line with ticks every 15 degrees
    draw.line([(0, HORIZON), (W, HORIZON)], fill=CREAM + (70,), width=3)
    deg_font = font(30)
    for deg in range(0, 360, 15):
        x = int(deg / 360 * W)
        major = deg % 90 == 0
        tick = 26 if major else 12
        draw.line([(x, HORIZON - tick), (x, HORIZON + tick)], fill=CREAM + (130,), width=4 if major else 2)
        if not major:
            draw_wrapped_text(draw, x, HORIZON + 46, str(deg), deg_font, CREAM + (110,))

    # Compass cards at the horizon. North sits on the seam, so wrap it.
    card_font = font(120, bold=True)
    sub_font = font(34)
    for deg, label in ((0, "N"), (90, "E"), (180, "S"), (270, "W")):
        x = int(deg / 360 * W)
        draw_wrapped_text(draw, x, HORIZON - 120, label, card_font, CREAM + (235,))
        draw_wrapped_text(draw, x, HORIZON - 220, f"{deg:03d}", sub_font, CREAM + (150,))

    # Identity plates, twice around so one is always in view
    title_font = font(64, bold=True)
    plate_font = font(36)
    for x in (1024, 3072):
        draw_wrapped_text(draw, x, int(H * 0.62), "ROOTED FORWARD", title_font, CREAM + (225,))
        draw_wrapped_text(draw, x, int(H * 0.62) + 70, "360 TEST PANORAMA", plate_font, RUST + (255,))
        draw_wrapped_text(
            draw, x, int(H * 0.62) + 122,
            "Synthetic test pattern. Not field footage.", plate_font, CREAM + (160,),
        )

    # Zenith and nadir markers
    draw_wrapped_text(draw, W // 2, 90, "SURFACE (zenith)", font(44, bold=True), CREAM + (200,))
    draw_wrapped_text(draw, W // 2, H - 90, "LAKE BED (nadir)", font(44, bold=True), CREAM + (160,))

    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "media", "360")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, "test-pano.jpg")
    img.save(out, "JPEG", quality=82, optimize=True)

    poster = img.resize((960, 480), Image.LANCZOS)
    poster.save(os.path.join(out_dir, "test-pano-poster.jpg"), "JPEG", quality=80, optimize=True)
    print("wrote", out, os.path.getsize(out) // 1024, "KB")


if __name__ == "__main__":
    main()
