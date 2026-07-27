#!/usr/bin/env python3
"""Prepare team headshots for the circles on /about/team.

    python3 scripts/prep-team-headshots.py <src-dir> [--out public/media/team]

Reads the raw portraits, trims the printed frame off them, finds the top of
the head, crops square with consistent headroom, neutralises the backdrop,
matches exposure across the set, upscales, sharpens, and writes JPEGs.

The point is that four portraits shot in four rooms with four cameras have
to read as one set once they sit in a row of circles. Left alone, the
difference in backdrop colour is the first thing the eye catches, and it
reads as a page assembled out of whatever people happened to send.

Nothing here invents detail. If the source is small the output is still
small, it is just cleanly cropped and matched instead of soft and mismatched.
Re-run this the moment real high-resolution originals arrive.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

# Source file, output slug, and an optional headroom override.
#
# Ayomide is wearing a fila, so the crown detector finds the top of the cap
# rather than the top of his head. At the shared headroom the cap runs into
# the circle mask and gets sliced. He gets more room above; nobody else
# needs an override.
MAPPING = [
    ("paste-2.png", "osheanna-tyler-hudson", None),
    ("paste-3.png", "javonte-white", None),
    ("paste-4.png", "ayomide-olatunji", 0.16),
]

# Portraits that are not plain-backdrop ID shots. These skip the frame trim,
# the crown detector, and the backdrop pass, all three of which assume a flat
# wall. Zain's is a phone portrait on a street, so the "backdrop" is a real
# blurred building and flattening it would be vandalism.
#
# Crop is given by hand instead, as fractions of the source: where the top of
# the head sits, where the face is horizontally, and how much room to leave
# above. Measured off a gridded copy of the file rather than guessed.
ENVIRONMENT = [
    {
        "src": "zain-hires-1.jpg",
        "slug": "zain-zaidi",
        "hair_top": 0.265,
        "face_cx": 0.48,
        "headroom": 0.11,
    },
    {
        "src": "ahmed-src.png",
        "slug": "ahmed-agha",
        "hair_top": 0.215,
        "face_cx": 0.47,
        "headroom": 0.10,
        # Framed tight enough that a full-width square put his head across
        # four fifths of the circle. The margin is a hotel lobby rather than
        # a studio wall, so it needs the heavy blur to pass.
        "widen": 0.24,
        "widen_blur": 2.6,
    },
    {
        "src": "sabina-src.jpg",
        "slug": "sabina-aliyev",
        "hair_top": 0.045,
        "face_cx": 0.47,
        "headroom": 0.12,
        # Studio backdrop with nothing in it, so the canvas widens cleanly.
        "widen": 0.20,
        # Flash hotspot across the top of her hair. See reduce_glare().
        "glare": 0.8,
    },
]

# The circle renders at 160 CSS px, so 480 covers a 3x display.
OUT_PX = 480
# Pixels shaved off every side after the frame trim, to kill antialiased
# remnants of the printed rule.
SAFETY_INSET = 3
# Space above the crown, as a fraction of the square. Portrait convention is
# 10 to 15 percent; below that the crop reads as a mugshot.
HEADROOM = 0.13
# Where the background should land after normalisation. High enough to feel
# like a lit backdrop, short of blowing out.
TARGET_BG = 226.0
# The one backdrop all four get moved to. A warm light neutral, picked to sit
# on the site's cream without reading as a cut-out on a white card.
TARGET_BG_RGB = (231.0, 227.0, 219.0)
# How far from a photo's own backdrop colour the correction still reaches,
# as a sum of per-channel distance. Wide enough to catch an unevenly lit
# wall, tight enough to leave hair and clothing alone.
BACKDROP_FALLOFF = 108.0
# Exposure gain is clamped, so a dark original gets lifted without the skin
# tones going flat.
GAIN_RANGE = (0.88, 1.28)


def luminance(rgb: tuple[float, float, float]) -> float:
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def trim_frame(im: Image.Image, max_trim: int = 10) -> Image.Image:
    """Cut the printed border off the outside of a scanned portrait.

    Scanning inward from the edge and stopping at the first non-dark pixel
    does not work here. Several of these have a bright pixel or two of page
    outside the dark rule, so that scan stops before it starts. Instead,
    look at the whole outer band and trim past the LAST dark line found in
    it, which handles a rule at any depth and a shadow outside it.

    Only edges that actually carry a rule get cut. Javonte's frame is open
    at the top and his shirt is near black at the bottom, so a plain "trim
    everything dark" pass would eat his shoulders.
    """
    w, h = im.size
    px = im.load()

    def dark_row(y: int) -> bool:
        vals = [luminance(px[x, y]) for x in range(0, w, max(1, w // 40))]
        return sum(vals) / len(vals) < 120

    def dark_col(x: int) -> bool:
        vals = [luminance(px[x, y]) for y in range(0, h, max(1, h // 40))]
        return sum(vals) / len(vals) < 120

    def last_dark(indices, is_dark) -> int | None:
        found = None
        for i in indices:
            if is_dark(i):
                found = i
        return found

    band = min(max_trim, w // 6, h // 6)

    hit = last_dark(range(band), dark_col)
    left = 0 if hit is None else hit + 1

    hit = last_dark(range(w - 1, w - 1 - band, -1), dark_col)
    right = w - 1 if hit is None else hit - 1

    hit = last_dark(range(band), dark_row)
    top = 0 if hit is None else hit + 1

    # The bottom gets a shallow band rather than the full one, for the
    # dark-clothing reason above.
    hit = last_dark(range(h - 1, h - 1 - min(4, band), -1), dark_row)
    bottom = h - 1 if hit is None else hit - 1

    # A couple of pixels of safety on every side. The rules in these scans
    # are antialiased, so the outermost surviving row is a half-strength
    # grey that the dark test misses. Left in, it is invisible against the
    # original wall and then shows up as a hairline seam the moment the
    # backdrop is flattened. Two pixels off a 142px source costs nothing,
    # and any headroom it takes gets extended back in at crop time.
    inset = SAFETY_INSET
    left = min(left + inset, w // 2 - 1)
    right = max(right - inset, w // 2)
    top = min(top + inset, h // 2 - 1)
    bottom = max(bottom - inset, h // 2)

    return im.crop((left, top, right + 1, bottom + 1))


def background_color(im: Image.Image) -> tuple[float, float, float]:
    """Average of the two top corners, which on an ID portrait is backdrop."""
    w, h = im.size
    box_w, box_h = max(4, w // 6), max(4, h // 10)
    left = im.crop((0, 0, box_w, box_h))
    right = im.crop((w - box_w, 0, w, box_h))
    samples = list(left.getdata()) + list(right.getdata())
    n = len(samples)
    return (
        sum(s[0] for s in samples) / n,
        sum(s[1] for s in samples) / n,
        sum(s[2] for s in samples) / n,
    )


def head_top(im: Image.Image, bg: tuple[float, float, float]) -> int:
    """First row where enough pixels stop looking like the backdrop."""
    w, h = im.size
    px = im.load()
    step = max(1, w // 60)
    threshold = 42
    needed = max(2, int(0.08 * (w / step)))

    for y in range(h):
        hits = 0
        for x in range(0, w, step):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > threshold * 3:
                hits += 1
        if hits >= needed:
            return y
    return int(0.08 * h)


def square_crop(
    im: Image.Image,
    crown: int,
    bg: tuple[float, float, float],
    headroom: float | None = None,
) -> Image.Image:
    """Square crop, horizontally centred, with the crown at HEADROOM.

    When the subject is already near the top of the source there is no
    headroom to take, and clamping the crop to y=0 shaves the top of the
    head. Ayomide's cap is the case. Rather than cut it, extend the backdrop
    upward. The backdrop is being flattened to one colour anyway, so added
    rows are indistinguishable from photographed wall, and the alternative
    is a portrait that looks beheaded inside a circle.
    """
    w, h = im.size
    side = min(w, h)
    top = int(crown - (HEADROOM if headroom is None else headroom) * side)

    if top < 0:
        pad = -top
        fill = (int(bg[0]), int(bg[1]), int(bg[2]))
        padded = Image.new("RGB", (w, h + pad), fill)
        padded.paste(im, (0, pad))
        im, h, top = padded, h + pad, 0

    top = max(0, min(top, h - side))
    left = (w - side) // 2
    return im.crop((left, top, left + side, top + side))


def harmonise_backdrop(
    im: Image.Image, bg: tuple[float, float, float]
) -> Image.Image:
    """Move every backdrop to the same warm neutral, leaving faces alone.

    A global gain would unify the backdrops by dragging four different
    complexions along with them, which is exactly the wrong trade on this
    roster. So the shift is weighted by how close a pixel already is to that
    photo's own backdrop colour. Wall pixels move the whole way, skin and
    clothing barely move at all, and the falloff means no visible edge where
    the correction stops.

    Four rooms, four cameras, one backdrop. That is what makes a row of
    circles read as a set rather than as whatever people happened to send.
    """
    px = im.load()
    w, h = im.size
    dr = TARGET_BG_RGB[0] - bg[0]
    dg = TARGET_BG_RGB[1] - bg[1]
    db = TARGET_BG_RGB[2] - bg[2]

    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            dist = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            if dist >= BACKDROP_FALLOFF:
                continue
            k = 1.0 - (dist / BACKDROP_FALLOFF)
            k *= k  # ease out, so the transition has no hard shoulder
            px[x, y] = (
                max(0, min(255, int(r + k * dr))),
                max(0, min(255, int(g + k * dg))),
                max(0, min(255, int(b + k * db))),
            )
    return im


def match_exposure(im: Image.Image, bg: tuple[float, float, float]) -> Image.Image:
    """Lift or pull the whole frame so the subjects sit at a common level."""
    bg_lum = luminance(bg)
    if bg_lum <= 1:
        return im
    gain = max(GAIN_RANGE[0], min(GAIN_RANGE[1], TARGET_BG / bg_lum))
    if abs(gain - 1.0) < 0.01:
        return im
    return im.point(lambda v: max(0, min(255, int(v * gain))))


def normalise_exposure(im: Image.Image) -> Image.Image:
    """Put every portrait at the same exposure, without touching complexion.

    The obvious version of this, matching the average brightness of each
    face, is wrong and would be worse than doing nothing. Six people do not
    have the same skin tone, and equalising face brightness across them
    literally edits complexion. So the reference is the bright end of the
    frame, the 90th percentile of luminance, which tracks how the shot was
    exposed rather than who is in it. Gain is clamped, so an underexposed
    file gets lifted and nobody gets bleached.
    """
    hist = im.convert("L").histogram()
    total = sum(hist)
    running, p90 = 0, 255
    for value, count in enumerate(hist):
        running += count
        if running >= total * 0.90:
            p90 = value
            break
    if p90 < 1:
        return im
    gain = max(0.92, min(1.16, 224.0 / p90))
    if abs(gain - 1.0) < 0.01:
        return im
    return im.point(lambda v: max(0, min(255, int(v * gain))))


def finish(im: Image.Image) -> Image.Image:
    """Upscale in two steps, then sharpen. One big jump smears edges."""
    im = normalise_exposure(im)
    im = ImageOps.autocontrast(im, cutoff=(0.4, 0.2), preserve_tone=True)
    im = ImageEnhance.Color(im).enhance(1.07)

    w = im.size[0]
    if OUT_PX > w:
        mid = min(OUT_PX, int(w * 1.9))
        im = im.resize((mid, mid), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=3))
        im = im.resize((OUT_PX, OUT_PX), Image.LANCZOS)
    else:
        im = im.resize((OUT_PX, OUT_PX), Image.LANCZOS)

    # Light second pass. Anything stronger and a 142px original starts
    # showing haloes around hair, which reads worse than the softness does.
    return im.filter(ImageFilter.UnsharpMask(radius=1.3, percent=52, threshold=4))


def widen(
    im: Image.Image, pad_frac: float, blur_mult: float = 1.0
) -> tuple[Image.Image, float, float]:
    """Grow the canvas by stretching the backdrop, so the crop can pull back.

    Sabina's portrait is framed tight enough that the widest square available
    is the full width of the file, which puts her head across three quarters
    of the circle. Her backdrop is a soft out-of-focus studio wash with no
    detail in it, so more of it can be manufactured convincingly.

    Stretch, not mirror. Mirroring a wide edge strip was the first attempt
    and it folded the outer edge of her hair back into the frame, which read
    as two dark smudges either side of her head. A narrow outermost strip is
    pure backdrop all the way down, so that is what gets stretched out to
    fill the new margin, then blurred.

    It also works on a busy background if the margin is blurred hard enough,
    which is what blur_mult is for. Ahmed's is a hotel lobby with a
    geometric screen in it, and at three times the base blur the stretched
    margin reads as the same room going out of focus. Turn blur_mult up
    before turning pad_frac up; a wide margin at low blur is where the smear
    starts to show.

    Returns the widened image plus the offsets needed to move the caller's
    hair_top and face_cx fractions into it.
    """
    w, h = im.size
    px, py = int(w * pad_frac), int(h * pad_frac / 2)
    strip = max(2, int(w * 0.03))

    out = Image.new("RGB", (w + px * 2, h + py))
    out.paste(im, (px, py))
    out.paste(im.crop((0, 0, strip, h)).resize((px, h), Image.LANCZOS), (0, py))
    out.paste(
        im.crop((w - strip, 0, w, h)).resize((px, h), Image.LANCZOS), (px + w, py)
    )
    # Top margin comes from the top edge of the now full-width image.
    out.paste(
        out.crop((0, py, out.width, py + strip)).resize(
            (out.width, py), Image.LANCZOS
        ),
        (0, 0),
    )

    blurred = out.filter(ImageFilter.GaussianBlur(max(5, int(w / 40 * blur_mult))))
    mask = Image.new("L", out.size, 255)
    ImageDraw.Draw(mask).rectangle(
        (px + w // 18, py + h // 18, px + w - w // 18, out.height), fill=0
    )
    mask = mask.filter(ImageFilter.GaussianBlur(max(8, int(w / 26 * blur_mult))))
    out = Image.composite(blurred, out, mask)
    return out, (h + py, py), (w + px * 2, px)


def reduce_glare(im: Image.Image, strength: float) -> Image.Image:
    """Take the blue and the sparkle out of a flash hotspot on hair.

    Read the limits before touching this. The hotspot on Sabina's source is
    a large blown-out area across the top of her head, and it looks like a
    photograph of a glossy print rather than a digital original, which is
    where the speckle comes from. Genuinely removing it means inventing hair
    texture that is not in the file, which is not something this script will
    do. What it does instead is take the blue cast off and knock the speckle
    down, which is a real improvement and an honest one.

    Three earlier attempts are worth not repeating. A global highlight knee
    dulled her teeth and the lit side of her face before it touched the hair.
    Local-contrast masking never fired, because the hotspot is large enough
    to contaminate its own neighbourhood. And a colour mask without a
    horizontal bound turned the whole backdrop grey, since the backdrop is
    bright and cool too.
    """
    band, x0, x1, feather = 0.42, 0.19, 0.81, 0.12
    w, h = im.size
    px = im.load()
    small = im.resize((w // 4, h // 4), Image.LANCZOS).filter(
        ImageFilter.MedianFilter(5)
    )
    sp = small.resize((w, h), Image.LANCZOS).load()

    cut, fade = band * h, feather * h
    xa, xb, xf = x0 * w, x1 * w, 0.07 * w

    for y in range(int(cut + fade)):
        gy = 1.0 if y <= cut else max(0.0, 1.0 - (y - cut) / fade)
        if gy <= 0:
            continue
        for x in range(max(0, int(xa - xf)), min(w, int(xb + xf))):
            if x < xa:
                gx = max(0.0, 1.0 - (xa - x) / xf)
            elif x > xb:
                gx = max(0.0, 1.0 - (x - xb) / xf)
            else:
                gx = 1.0
            r, g, b = px[x, y]
            l = luminance((r, g, b))
            if l < 100:
                continue
            warmth = r - b
            if warmth > 24:      # skin, leave it alone
                continue
            m = (
                min(1.0, (24 - warmth) / 32.0)
                * min(1.0, (l - 100) / 55.0)
                * gy
                * gx
                * strength
            )
            if m <= 0:
                continue
            sr, sg, sb = sp[x, y]
            r = r + m * 0.7 * (sr - r)
            g = g + m * 0.7 * (sg - g)
            b = b + m * 0.7 * (sb - b)
            grey = (r + g + b) / 3.0
            r = r + m * (grey - r)
            g = g + m * (grey - g)
            b = b + m * (grey * 0.95 - b)
            d = 1.0 - 0.16 * m
            px[x, y] = (
                max(0, min(255, int(r * d))),
                max(0, min(255, int(g * d))),
                max(0, min(255, int(b * d))),
            )
    return im


def prepare_environment(src: Path, spec: dict) -> Image.Image:
    """Crop and finish a portrait that was shot somewhere real.

    The square is the full width of the source, which is the widest crop
    available and therefore the one that puts the least of the subject's head
    in the frame. On a phone portrait that still runs tighter than an ID
    photo, which is why the headroom is specified per file.
    """
    im = Image.open(src).convert("RGB")

    if spec.get("widen"):
        base_h, base_w = im.size[1], im.size[0]
        im, (new_h, pad_y), (new_w, pad_x) = widen(
            im, spec["widen"], spec.get("widen_blur", 1.0)
        )
        spec = dict(spec)
        spec["hair_top"] = (spec["hair_top"] * base_h + pad_y) / new_h
        spec["face_cx"] = (spec["face_cx"] * base_w + pad_x) / new_w

    w, h = im.size
    side = min(w, h)

    top = int(spec["hair_top"] * h - spec["headroom"] * side)
    top = max(0, min(top, h - side))
    left = int(spec["face_cx"] * w - side / 2)
    left = max(0, min(left, w - side))

    cropped = im.crop((left, top, left + side, top + side))
    if spec.get("glare"):
        cropped = reduce_glare(cropped, spec["glare"])
    return finish(cropped)


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 1

    src = Path(sys.argv[1])
    out = Path("public/media/team")
    if "--out" in sys.argv:
        out = Path(sys.argv[sys.argv.index("--out") + 1])
    out.mkdir(parents=True, exist_ok=True)

    for filename, slug, headroom in MAPPING:
        path = src / filename
        if not path.exists():
            print(f"skip {filename}, not found")
            continue

        im = Image.open(path).convert("RGB")
        original = im.size
        im = trim_frame(im)
        bg = background_color(im)
        crown = head_top(im, bg)
        im = square_crop(im, crown, bg, headroom)
        im = harmonise_backdrop(im, bg)
        im = match_exposure(im, bg)
        im = finish(im)

        dest = out / f"{slug}.jpg"
        im.save(dest, "JPEG", quality=90, optimize=True, progressive=True)
        print(
            f"{slug:24s} {original[0]}x{original[1]} -> {OUT_PX}x{OUT_PX}  "
            f"crown y={crown}  bg={tuple(round(c) for c in bg)}  "
            f"{dest.stat().st_size // 1024}kb"
        )

    for spec in ENVIRONMENT:
        path = src / spec["src"]
        if not path.exists():
            print(f"skip {spec['src']}, not found")
            continue
        original = Image.open(path).size
        im = prepare_environment(path, spec)
        dest = out / f"{spec['slug']}.jpg"
        im.save(dest, "JPEG", quality=90, optimize=True, progressive=True)
        print(
            f"{spec['slug']:24s} {original[0]}x{original[1]} -> {OUT_PX}x{OUT_PX}  "
            f"environment  {dest.stat().st_size // 1024}kb"
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
