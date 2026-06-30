#!/usr/bin/env python3
# ------------------------------------------------------------------
# Museum-grade renderer for the Hyde Park tour.
#
# Builds a cinematic film from the same edit the site plays: a title
# sequence, chapter dividers, a unified grade (warm duotone for the
# archival stills, muted color for present-day photos), slow Ken Burns,
# crossfades within chapters, vignette and fine grain, elegant PIL
# typography for titles / lower-thirds / source credits, and an end
# card. Placeholder host / 360 / present-day slots become designed
# "to be filmed" cards.
#
# Inputs: src/lib/immersive/tours/hyde-park.ts, data/hp-research.json,
# public/media/hyde-park/{credits.json, vo/durations.json, vo/*.mp3}.
# Output: public/media/hyde-park/video/hyde-park-museum.mp4
# ------------------------------------------------------------------

import json, os, re, subprocess, sys, shutil, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = os.getcwd()
TMP = "/tmp/hpmuseum"
OUTDIR = os.path.join(ROOT, "public/media/hyde-park/video")
VO_DIR = os.path.join(ROOT, "public/media/hyde-park/vo")
shutil.rmtree(TMP, ignore_errors=True)
os.makedirs(TMP, exist_ok=True)
os.makedirs(OUTDIR, exist_ok=True)

W, H, FPS = 1920, 1080, 24
XFADE = 0.9            # crossfade between shots inside a chapter
EDGE = 0.6            # fade from / to black at chapter and card edges

# ---- palette (site tokens) ----
CREAM = (245, 240, 232)
CREAM2 = (228, 220, 206)
INK = (24, 23, 21)
FOREST = (18, 33, 25)
FOREST2 = (30, 54, 41)
RUST = (197, 93, 62)
WARM = (150, 142, 128)

# ---- fonts ----
BASK = "/System/Library/Fonts/Supplemental/Baskerville.ttc"
GILL = "/System/Library/Fonts/Supplemental/GillSans.ttc"
_F = {}
def font(path, size, index=0):
    k = (path, size, index)
    if k not in _F:
        _F[k] = ImageFont.truetype(path, size, index=index)
    return _F[k]
def serif(size, w="reg"):
    return font(BASK, size, {"reg":0,"bold":1,"italic":2,"bolditalic":3,"semi":4}[w])
def sans(size, w="reg"):
    return font(GILL, size, {"reg":0,"bold":1,"italic":2,"semi":4,"light":7}[w])

# ---- pseudo-3D helpers (perspective warps, extruded type) ----
def find_coeffs(src, dst):
    # 8 perspective coefficients mapping dst -> src (PIL's convention)
    A = []
    for (xd, yd), (xs, ys) in zip(dst, src):
        A.append([xd, yd, 1, 0, 0, 0, -xs*xd, -xs*yd])
        A.append([0, 0, 0, xd, yd, 1, -ys*xd, -ys*yd])
    return np.linalg.solve(np.array(A, float), np.array(src, float).reshape(8))

def extruded_text(text, fnt, face, deep=(150, 70, 46), depth=18, alpha=255, scale=1.0):
    """Return an RGBA layer of `text` extruded into depth, bright face on top.
    Cheap enough to call per frame at 1080p."""
    pad = int(60*scale); depth = max(2, int(depth*scale))
    probe = ImageDraw.Draw(Image.new("RGBA", (4, 4)))
    bb = probe.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    cw, ch = tw + pad*2 + depth, th + pad*2 + depth
    layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0)); dl = ImageDraw.Draw(layer)
    ox, oy = pad - bb[0], pad - bb[1]
    for k in range(depth, 0, -1):
        f = k / depth
        col = tuple(int(deep[i]*f + FOREST[i]*(1-f)*0.4) for i in range(3))
        dl.text((ox + k*0.85, oy + k*1.0), text, font=fnt, fill=col + (255,))
    dl.text((ox, oy), text, font=fnt, fill=face + (255,))
    if alpha < 255:
        a = layer.split()[3].point(lambda v: v*alpha//255); layer.putalpha(a)
    return layer, ox, oy

# ---- text helpers ----
def tracked_width(draw, text, fnt, tracking):
    return sum(draw.textlength(c, font=fnt) + tracking for c in text) - (tracking if text else 0)

def draw_tracked(draw, xy, text, fnt, fill, tracking=0, anchor="la", shadow=None):
    x, y = xy
    if anchor in ("ma", "mm"):
        x -= tracked_width(draw, text, fnt, tracking) / 2
    if anchor in ("ra",):
        x -= tracked_width(draw, text, fnt, tracking)
    if shadow:
        sx, sy, sc = shadow
        cx = x
        for c in text:
            draw.text((cx+sx, y+sy), c, font=fnt, fill=sc)
            cx += draw.textlength(c, font=fnt) + tracking
    cx = x
    for c in text:
        draw.text((cx, y), c, font=fnt, fill=fill)
        cx += draw.textlength(c, font=fnt) + tracking

def wrap(draw, text, fnt, maxw):
    words = text.split()
    lines, cur = [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if draw.textlength(t, font=fnt) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines

def rule(draw, cx, y, w, color=RUST, h=3):
    draw.rectangle([cx - w//2, y, cx + w//2, y + h], fill=color)

# ---- card generators (full-frame PNG) ----
def base_card(bg):
    img = Image.new("RGB", (W, H), bg)
    return img, ImageDraw.Draw(img)

def grain_card(img, amount=6):
    # subtle paper-like texture so flat cards don't read as digital
    import random
    random.seed(7)
    noise = Image.effect_noise((W, H), amount).convert("L")
    return Image.composite(img, img, noise) if False else img

def title_card(path):
    img, d = base_card(FOREST)
    cx = W // 2
    draw_tracked(d, (cx, 352), "ROOTED FORWARD PRESENTS", sans(27, "light"), RUST, tracking=11, anchor="ma")
    d.text((cx, 545), "Hyde Park", font=serif(170, "reg"), fill=CREAM, anchor="mm")
    d.text((cx, 690), "Built and Rebuilt", font=serif(70, "italic"), fill=CREAM, anchor="mm")
    rule(d, cx, 770, 130)
    draw_tracked(d, (cx, 905), "A HISTORY OF THE GROUND BENEATH A CHICAGO NEIGHBORHOOD",
                 sans(23, "light"), (CREAM[0],CREAM[1],CREAM[2]), tracking=7, anchor="ma")
    img.save(path)

def divider_card(path, n, era, title):
    img, d = base_card(CREAM)
    cx = W // 2
    draw_tracked(d, (cx, 350), f"CHAPTER {n:02d}", sans(26, "semi"), RUST, tracking=13, anchor="ma")
    draw_tracked(d, (cx, 404), era.upper(), sans(23, "light"), WARM, tracking=9, anchor="ma")
    fnt = serif(92, "reg")
    lines = wrap(d, title, fnt, 1360)
    lh = 110
    total = (len(lines) - 1) * lh
    ty = 600 - total / 2
    for ln in lines:
        d.text((cx, ty), ln, font=fnt, fill=INK, anchor="mm")
        ty += lh
    rule(d, cx, int(600 + total / 2 + 82), 110)
    img.save(path)

def end_card(path):
    img, d = base_card(FOREST)
    cx = W // 2
    d.text((cx, 410), "Rooted Forward", font=serif(108, "reg"), fill=CREAM, anchor="mm")
    rule(d, cx, 505, 120)
    d.text((cx, 600), "The ground keeps moving.", font=serif(54, "italic"), fill=CREAM, anchor="mm")
    draw_tracked(d, (cx, 770), "HYDE PARK . CHICAGO . ROOTED-FORWARD.ORG",
                 sans(24, "light"), WARM, tracking=8, anchor="ma")
    img.save(path)

def sources_card(path):
    img, d = base_card(FOREST)
    cx = W // 2
    draw_tracked(d, (cx, 300), "SOURCES AND CREDITS", sans(26, "semi"), RUST, tracking=12, anchor="ma")
    d.text((cx, 388), "On the public record", font=serif(58, "italic"), fill=CREAM, anchor="mm")
    lines = [
        "Archival images via Wikimedia Commons, including the Library of",
        "Congress, The New York Public Library, and Creative Commons",
        "contributors, each credited on screen.",
        "",
        "Narration here is a scratch recording, to be replaced with a read.",
        "Drone footage by Rooted Forward. The 360 look-arounds are real captures.",
    ]
    y = 500
    for ln in lines:
        if ln:
            d.text((cx, y), ln, font=sans(30, "light"), fill=(214, 209, 199), anchor="mm")
        y += 52
    img.save(path)

def placeholder_card(path, eyebrow, title, instruction):
    img, d = base_card(FOREST2)
    # faint frame to read as a film slate, not a finished shot
    d.rectangle([70, 70, W-70, H-70], outline=(CREAM[0],CREAM[1],CREAM[2]), width=2)
    cx = W // 2
    draw_tracked(d, (cx, 300), eyebrow, sans(25, "semi"), RUST, tracking=12, anchor="ma")
    tlines = wrap(d, title, serif(66, "reg"), 1300)
    ty = 418 - (len(tlines) - 1) * 40
    for i, ln in enumerate(tlines):
        d.text((cx, ty + i * 80), ln, font=serif(66, "reg"), fill=CREAM, anchor="mm")
    base = ty + (len(tlines) - 1) * 80
    rule(d, cx, base + 66, 90)
    # the shot description, what to film here, in its own block
    draw_tracked(d, (cx, base + 112), "SHOOT THIS", sans(20, "semi"), (170,162,148), tracking=8, anchor="ma")
    dy = base + 156
    for i, ln in enumerate(wrap(d, instruction, sans(31, "light"), 1160)):
        d.text((cx, dy + i * 50), ln, font=sans(31, "light"), fill=(214,209,199), anchor="mm")
    img.save(path)

# ---- transparent overlays composited over footage ----
def lower_third(path, label, value):
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    x, y = 130, 812
    d.rectangle([x, y+6, x+6, y+92], fill=RUST)
    draw_tracked(d, (x+26, y), label.upper(), sans(23, "semi"),
                 (CREAM[0],CREAM[1],CREAM[2],255), tracking=6,
                 shadow=(2,2,(0,0,0,160)))
    d.text((x+26, y+38), value, font=serif(52, "reg"), fill=(CREAM[0],CREAM[1],CREAM[2],255))
    # soft shadow for legibility on bright footage
    return _drop(img, path)

def credit_overlay(path, text):
    # top-right corner: clear of the bottom subtitle band and the top-left wall
    # label, so a long credit can never collide with a wide caption line.
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_tracked(d, (W-120, 70), text.upper(), sans(19, "light"),
                 (CREAM[0],CREAM[1],CREAM[2],205), tracking=4, anchor="ra",
                 shadow=(1,1,(0,0,0,150)))
    return _drop(img, path)

def annotation_label(path, label, sub):
    """A curator's wall label in the upper-left safe zone: a serif name over a
    tracked sans line, on a SOLID dark plate so the text stays fully legible over
    any image, light maps and bright skies included. Long names word-wrap and the
    plate sizes itself to fit, so nothing overruns the frame."""
    x, y = 132, 150
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    tf = serif(48, "reg")
    sf = sans(21, "semi")
    tick_w, gap, lh = 6, 14, 56
    pad_x, pad_y = 24, 16
    # wrap the name so a long title never runs off the frame
    lines = wrap(d, label, tf, 660) or [label]
    title_w = max([d.textlength(ln, font=tf) for ln in lines] + [0.0])
    sub_w = tracked_width(d, sub.upper(), sf, 5) if sub else 0.0
    block_w = int(max(title_w, sub_w))
    title_h = lh * len(lines)
    block_h = title_h + (8 + 28 if sub else 0)
    tx = x + tick_w + gap
    # the solid plate, sized to the block, high-opacity so it reads on anything
    d.rounded_rectangle(
        [x - pad_x, y - pad_y, tx + block_w + pad_x, y + block_h + pad_y],
        radius=4, fill=(9, 11, 10, 226),
    )
    # rust tick down the left edge of the title
    d.rectangle([x, y + 2, x + tick_w - 1, y + title_h - 8], fill=RUST)
    cy = y - 6
    for ln in lines:
        d.text((tx + 1, cy + 2), ln, font=tf, fill=(0, 0, 0, 150))  # shadow
        d.text((tx, cy), ln, font=tf, fill=(245, 241, 234, 255))
        cy += lh
    if sub:
        draw_tracked(d, (tx, cy + 4), sub.upper(), sf, (214, 209, 199, 250),
                     tracking=5, shadow=(1, 1, (0, 0, 0, 170)))
    img.save(path)
    return path

def _drop(img, path):
    # render a faint blurred dark copy behind the text for contrast
    alpha = img.split()[3]
    glow = Image.new("RGBA", (W, H), (0,0,0,0))
    glow.putalpha(alpha.filter(ImageFilter.GaussianBlur(6)))
    dark = Image.new("RGBA", (W, H), (0,0,0,150))
    dark.putalpha(glow.split()[3])
    out = Image.alpha_composite(dark, img)
    out.save(path)
    return path

# ---- fast typography preview ----
if "--cards" in sys.argv:
    title_card(os.path.join(TMP, "t_title.png"))
    divider_card(os.path.join(TMP, "t_div.png"), 6, "1952 to 1970s", "The University Rebuilds the Neighborhood")
    end_card(os.path.join(TMP, "t_end.png"))
    placeholder_card(os.path.join(TMP, "t_ph.png"), "360 LOOK-AROUND . TO BE FILMED",
                     "Jackson Park today", "A 360 capture where the 1893 fair once stood.")
    # lower-third + credit composited over a mid-gray frame to judge legibility
    base = Image.new("RGBA", (W, H), (96, 94, 90, 255))
    lower_third(os.path.join(TMP, "t_lt.png"), "Buildings marked for demolition", "638 buildings")
    credit_overlay(os.path.join(TMP, "t_cr.png"), "C. D. Arnold, 1893")
    for ov in ("t_lt.png", "t_cr.png"):
        base = Image.alpha_composite(base, Image.open(os.path.join(TMP, ov)).convert("RGBA"))
    base.convert("RGB").save(os.path.join(TMP, "t_overlays.png"))
    print("cards written to", TMP)
    sys.exit(0)

# ---- ffmpeg helpers ----
def run(args):
    p = subprocess.run(["ffmpeg","-y","-loglevel","error",*args],
                       capture_output=True, text=True)
    if p.returncode != 0:
        sys.stderr.write("FFMPEG FAIL:\n"+" ".join(args[:30])+"\n"+p.stderr[-1400:]+"\n")
        raise SystemExit(1)

def probe(path):
    p = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                        "-of","default=nk=1:nw=1",path], capture_output=True, text=True)
    try: return float(p.stdout.strip())
    except: return 0.0

# ---- motion-graphics engine (PIL frame sequences) ----
def ease_out(p): p = max(0.0, min(1.0, p)); return 1 - (1 - p) ** 3
def ease_io(p): p = max(0.0, min(1.0, p)); return p * p * (3 - 2 * p)
def elem(t, start, dur): return max(0.0, min(1.0, (t - start) / max(0.01, dur)))

def put_text(base, xy, text, fnt, color, alpha=255, dy=0, tracking=0, anchor="mm"):
    """Composite alpha text onto an RGBA frame, with optional letter tracking."""
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy[0], xy[1] + dy
    rgba = (color[0], color[1], color[2], 255)
    if tracking:
        a2 = "ma" if anchor in ("mm", "ma") else ("ra" if anchor in ("rm", "ra") else "la")
        draw_tracked(d, (x, y), text, fnt, rgba, tracking=tracking, anchor=a2)
    else:
        d.text((x, y), text, font=fnt, fill=rgba, anchor=anchor)
    if alpha < 255:
        a = layer.split()[3].point(lambda v: v * max(0, min(255, int(alpha))) // 255)
        layer.putalpha(a)
    return Image.alpha_composite(base, layer)

def seq_clip(frame_fn, dur, out, silent=True, fade=True):
    n = max(2, int(round(dur * FPS)))
    d = os.path.join(TMP, "seq_" + os.path.basename(out).replace(".mp4", ""))
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d, exist_ok=True)
    for i in range(n):
        frame_fn(i / FPS).save(os.path.join(d, f"{i:05d}.png"))
    # keep the flat motion cards clean: a faint vignette for depth, no grain
    # (temporal noise read as low quality on the type-heavy cards)
    vf = "vignette=PI/6,format=yuv420p"
    if fade:
        vf = f"fade=t=in:st=0:d=0.4,fade=t=out:st={dur-0.45:.2f}:d=0.45," + vf
    args = ["-framerate", str(FPS), "-i", os.path.join(d, "%05d.png")]
    if silent:
        args += ["-f", "lavfi", "-t", f"{dur}", "-i", "anullsrc=r=48000:cl=stereo"]
    args += ["-vf", vf, "-r", str(FPS), "-t", f"{dur}",
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p"]
    if silent:
        args += ["-c:a", "aac", "-ar", "48000", "-ac", "2"]
    args += [out]
    run(args)

def animated_title(out, dur=5.5):
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.15, 0.7)); b = put_text(b, (cx, 352), "ROOTED FORWARD PRESENTS", sans(27, "light"), RUST, int(255*e), int((1-e)*18), 11, "ma")
        e = ease_out(elem(t, 0.40, 0.9)); b = put_text(b, (cx, 545), "Hyde Park", serif(170), CREAM, int(255*e), int((1-e)*34), 0, "mm")
        e = ease_out(elem(t, 0.75, 0.8)); b = put_text(b, (cx, 690), "Built and Rebuilt", serif(70, "italic"), CREAM, int(255*e), int((1-e)*20), 0, "mm")
        e = ease_out(elem(t, 1.05, 0.7))
        if e > 0:
            dd = ImageDraw.Draw(b); w = int(130*e); dd.rectangle([cx-w//2, 770, cx+w//2, 773], fill=RUST+(255,))
        e = ease_out(elem(t, 1.35, 0.9)); b = put_text(b, (cx, 905), "A HISTORY OF THE GROUND BENEATH A CHICAGO NEIGHBORHOOD", sans(23, "light"), CREAM, int(215*e), int((1-e)*12), 7, "ma")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

# real locator map of the South Side, built from city community-area boundaries
MAP_INK = (13, 16, 15)
MAP_LAND = (22, 27, 24)
LAKE = (26, 49, 55)
NBLINE = (48, 60, 52)
PARK = (46, 82, 58)
PARKLINE = (70, 112, 84)
_REALMAP = None

def _real_map_layers():
    # the real CARTO/OSM dark street map graded to the film palette, plus the
    # true Hyde Park boundary as a glow + translucent fill + crisp rim.
    mp = json.load(open(os.path.join(ROOT, "data/hp-map-real.json")))
    bw, bh = mp["size"]; sx, sy = W / bw, H / bh
    base = Image.open(os.path.join(ROOT, "data/hp-basemap.png")).convert("RGB").resize((W, H), Image.LANCZOS).convert("RGBA")
    poly = [(x * sx, y * sy) for x, y in mp["hp_polygon"]]
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).line(poly + [poly[0]], fill=RUST + (255,), width=15, joint="curve")
    glow = glow.filter(ImageFilter.GaussianBlur(11))
    hp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); hd = ImageDraw.Draw(hp)
    hd.polygon(poly, fill=(214, 108, 64, 60))
    hd.line(poly + [poly[0]], fill=(238, 152, 98, 255), width=3, joint="curve")
    hp_layer = Image.alpha_composite(glow, hp)
    hpc = (mp["hp_center"][0] * sx, mp["hp_center"][1] * sy)
    role = {
        "hero": (serif(52, "semi"), CREAM, 1),
        "nbr":  (sans(17, "light"), WARM, 2),
        "park": (sans(15, "light"), (150, 186, 162), 3),
        "thin": (sans(13, "light"), (150, 186, 162), 3),
        "lake": (sans(25, "light"), (150, 176, 180), 8),
    }
    start = {"hero": 1.2, "nbr": 1.7, "park": 2.0, "thin": 2.1, "lake": 2.3}
    labels = []
    for L in mp["labels"]:
        fnt, col, tr = role[L["role"]]
        labels.append((L["t"], L["xy"][0] * sx, L["xy"][1] * sy, fnt, col, tr, start[L["role"]], L["role"]))
    return base, hp_layer, labels, hpc, mp.get("attribution", "")

def map_scene(out, dur=7.6):
    global _REALMAP
    if _REALMAP is None:
        _REALMAP = _real_map_layers()
    base, hp_layer, labels, hpc, attrib = _REALMAP
    def fn(t):
        f = base.copy()
        a = ease_out(elem(t, 0.5, 1.1))
        if a > 0:
            lay = hp_layer.copy(); lay.putalpha(hp_layer.split()[3].point(lambda v: int(v * a)))
            f = Image.alpha_composite(f, lay)
        for (txt, x, y, fnt, col, tr, st, rl) in labels:
            e = ease_out(elem(t, st, 0.7))
            if e <= 0: continue
            if rl == "hero":
                f = put_text(f, (int(x), int(y)), txt, fnt, INK, int(140 * e), 7, tr, "mm")
            f = put_text(f, (int(x), int(y)), txt, fnt, col, int(255 * e), 0, tr, "mm")
        # gentle push-in toward Hyde Park (map + geographic labels move together)
        z = 1.0 + 0.055 * ease_io(elem(t, 0.0, dur * 0.95))
        if z > 1.001:
            cw, ch = int(W / z), int(H / z)
            x0 = int(max(0, min(W - cw, hpc[0] - cw / 2)))
            y0 = int(max(0, min(H - ch, hpc[1] - ch / 2)))
            f = f.crop((x0, y0, x0 + cw, y0 + ch)).resize((W, H), Image.BICUBIC)
        # fixed UI layer: eyebrow + map attribution
        et = ease_out(elem(t, 0.1, 0.7))
        f = put_text(f, (W // 2, 96), "ON THE SOUTH SIDE OF CHICAGO", sans(26, "semi"), RUST, int(255 * et), int((1 - et) * 12), 12, "ma")
        at = ease_out(elem(t, 2.7, 0.9))
        f = put_text(f, (W - 26, H - 28), attrib, sans(12, "light"), (122, 122, 118), int(140 * at), 0, 1, "rm")
        return f.convert("RGB")
    seq_clip(fn, dur, out)

def _parse_stat(value):
    m = re.search(r"([\d][\d,\.]*)", value)
    if not m: return ("", None, value, False)
    numstr = m.group(1).replace(",", "")
    try: target = float(numstr) if "." in numstr else int(numstr)
    except: return ("", None, value, False)
    # a bare four-digit year (1673, 1893, 1948, 2022) must never get a thousands
    # comma; only true magnitudes >= 1000 do
    v = value.strip()
    is_year = bool(re.fullmatch(r"1[5-9]\d{2}|20\d{2}", numstr))   # the leading number is a year
    is_range = bool(re.search(r"\d\s*(?:to|–|—|-)\s*\d", value))
    has_month = bool(re.match(r"(?i)(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b", v))
    comma = isinstance(target, int) and target >= 1000
    # `count` marks a plain magnitude integer that gets comma-grouped; years,
    # date ranges, month-dates, prices, and decimals render exactly as authored
    count = isinstance(target, int) and not is_year and not is_range and not has_month
    return (value[:m.start()], target, value[m.end():], comma, count)

def _fmt_num(n, comma):
    n = int(round(n)); return f"{n:,}" if comma else str(n)

def stat_scene(out, label, value, context, src="", dur=4.4, bg=FOREST):
    prefix, target, suffix, comma, count = _parse_stat(value)
    def fn(t):
        b = Image.new("RGBA", (W, H), bg + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 360), label.upper(), sans(27, "semi"), RUST, int(255*e), int((1-e)*14), 11, "ma")
        # no count-up: comma-group a plain magnitude, otherwise show the value
        # exactly as authored (years, ranges, dates, prices stay literal)
        shown = (prefix + _fmt_num(target, comma) + suffix) if count else value
        # the hero number is extruded into depth for a dimensional read; it also
        # eases up a few pixels as it lands, like settling onto the wall
        e2 = ease_out(elem(t, 0.28, 0.5))
        if e2 > 0:
            rise = int((1 - e2) * 26)
            lyr, ox, oy = extruded_text(shown, serif(186, "semi"), CREAM, depth=17, alpha=int(255*e2))
            b.alpha_composite(lyr, (cx - lyr.width//2, 548 - lyr.height//2 + rise))
        e3 = ease_out(elem(t, 0.7, 0.6))
        if e3 > 0:
            d = ImageDraw.Draw(b); w = int(120*e3); d.rectangle([cx-w//2, 694, cx+w//2, 697], fill=RUST+(255,))
        e4 = ease_out(elem(t, 0.9, 0.9)); b = put_text(b, (cx, 772), context, sans(31, "light"), (214,209,199), int(255*e4), int((1-e4)*12), 0, "mm")
        # a quiet on-screen source line, so every number on the wall is attributable
        if src:
            e5 = ease_out(elem(t, 1.15, 0.9))
            if e5 > 0:
                b = put_text(b, (cx, 840), "SOURCE  " + src.upper(), sans(16, "light"), (132, 150, 138), int(210*e5), 0, 6, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def chart_bars_scene(out, dur=6.0):
    """The renewal return-rate gap, two pseudo-3D bars to a shared scale. The
    Black bar stops visibly short so the shortfall reads physically. Numbers
    are shown rounded to match the spoken narration."""
    base, topY = 822, 372; full = base - topY
    cols = [("WHITE FAMILIES", 0.46, 46, CREAM, 600),
            ("BLACK FAMILIES", 0.17, 17, RUST, 1120)]
    bw = 200
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2; d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 232), "WHO GOT TO STAY", sans(28, "semi"), RUST, int(255*e), int((1-e)*12), 11, "ma")
        e = ease_out(elem(t, 0.35, 0.6)); b = put_text(b, (cx, 292), "Families who lost their homes and stayed in Hyde Park", sans(30, "light"), (214, 209, 199), int(255*e), 0, 0, "mm")
        d = ImageDraw.Draw(b)
        bl = ease_io(elem(t, 0.5, 0.7)); d.line([(540, base), (540 + int(840*bl), base)], fill=(120, 110, 96), width=2)
        for k, (lab, frac, val, col, x) in enumerate(cols):
            ga = ease_out(elem(t, 1.0 + k*0.85, 1.5))
            bh = int(full * frac * ga); y = base - bh
            if bh > 2:
                d.polygon([(x+bw, y), (x+bw+24, y-15), (x+bw+24, base-15), (x+bw, base)], fill=tuple(int(c*0.55) for c in col))
                d.polygon([(x, y), (x+24, y-15), (x+bw+24, y-15), (x+bw, y)], fill=tuple(int(c*0.80) for c in col))
                d.rectangle([x, y, x+bw, base], fill=col)
                cu = int(round(val * ga))
                b = put_text(b, (x+bw//2, y-66), f"{cu}%", serif(94, "semi"), col, 255, 0, 0, "mm"); d = ImageDraw.Draw(b)
            la = ease_out(elem(t, 1.2 + k*0.85, 0.6)); b = put_text(b, (x+bw//2, base+40), lab, sans(24, "semi"), (214, 209, 199), int(255*la), 0, 4, "ma"); d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 3.1, 0.8)); b = put_text(b, (cx, 956), "In the first University of Chicago renewal projects", sans(24, "light"), WARM, int(255*e), 0, 0, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def chart_wealthgap_scene(out, dur=6.8):
    """The racial wealth gap today, in the same pseudo-3D bars as the renewal
    chart, so the film closes on the line it has been drawing all along.
    Median family wealth, Federal Reserve 2022 Survey of Consumer Finances."""
    base, topY = 824, 392; full = base - topY
    mx = 300000.0
    cols = [("WHITE FAMILIES", 285000, CREAM, 540),
            ("BLACK FAMILIES", 45000, RUST, 1180)]
    bw = 200
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2; d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 214), "THE GAP IT LEFT", sans(28, "semi"), RUST, int(255*e), int((1-e)*12), 11, "ma")
        e = ease_out(elem(t, 0.35, 0.6)); b = put_text(b, (cx, 274), "Median family wealth in America today", sans(30, "light"), (214, 209, 199), int(255*e), 0, 0, "mm")
        d = ImageDraw.Draw(b)
        bl = ease_io(elem(t, 0.5, 0.7)); d.line([(480, base), (480 + int(960*bl), base)], fill=(120, 110, 96), width=2)
        for k, (lab, val, col, x) in enumerate(cols):
            ga = ease_out(elem(t, 1.0 + k*0.9, 1.5)); bh = int(full * (val/mx) * ga); y = base - bh
            if bh > 2:
                d.polygon([(x+bw, y), (x+bw+24, y-15), (x+bw+24, base-15), (x+bw, base)], fill=tuple(int(c*0.55) for c in col))
                d.polygon([(x, y), (x+24, y-15), (x+bw+24, y-15), (x+bw, y)], fill=tuple(int(c*0.80) for c in col))
                d.rectangle([x, y, x+bw, base], fill=col)
                cu = int(round(val * ga / 1000.0))
                b = put_text(b, (x+bw//2, y-58), f"${cu}K", serif(80, "semi"), col, 255, 0, 0, "mm"); d = ImageDraw.Draw(b)
            la = ease_out(elem(t, 1.2 + k*0.9, 0.6)); b = put_text(b, (x+bw//2, base+40), lab, sans(24, "semi"), (214, 209, 199), int(255*la), 0, 4, "ma"); d = ImageDraw.Draw(b)
        rc = ease_out(elem(t, 3.0, 0.9))
        if rc > 0:
            b = put_text(b, (cx, 506), "MORE THAN", sans(22, "semi"), (210, 150, 110), int(235*rc), 0, 7, "ma")
            b = put_text(b, (cx, 584), "6 to 1", serif(78, "semi"), CREAM, int(255*rc), 0, 0, "mm"); d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 3.7, 0.8)); b = put_text(b, (cx, 892), "SOURCE  FEDERAL RESERVE, 2022 SURVEY OF CONSUMER FINANCES", sans(16, "light"), (132, 150, 138), int(210*e), 0, 6, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def chart_hierarchy_scene(out, dur=7.2):
    """The racial 'desirability' ladder Chicago's real-estate industry built and
    Homer Hoyt carried to Washington. Shown to indict, not endorse, the invented
    logic at the root of redlining."""
    rows = [("English, German, Scandinavian", 1.00, CREAM),
            ("Northern Italians",              0.72, (206, 178, 120)),
            ("Poles, Lithuanians, Greeks",     0.56, (196, 150, 96)),
            ("Southern Italians",              0.44, (190, 128, 84)),
            ("Jews and Mexicans",              0.30, (178, 100, 70)),
            ("Black and Asian Americans",      0.13, RUST)]
    lx, bx, bw, topY, rh = 540, 920, 540, 360, 86
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 182), "RANKED BY THEIR EFFECT ON LAND VALUES", sans(25, "semi"), RUST, int(255*e), int((1-e)*10), 8, "ma")
        e = ease_out(elem(t, 0.35, 0.6)); b = put_text(b, (cx, 236), "The hierarchy Chicago's real-estate industry invented, then taught the nation", sans(25, "light"), (214, 209, 199), int(255*e), 0, 0, "mm")
        for i, (name, frac, col) in enumerate(rows):
            ra = ease_out(elem(t, 0.85 + i*0.34, 0.7))
            if ra <= 0:
                continue
            y = topY + i*rh
            b = put_text(b, (lx, y + 20), name, sans(27, "light"), (224, 219, 209), int(255*ra), 0, 0, "rm")
            d = ImageDraw.Draw(b); w = int(bw * frac * ra)
            d.rectangle([bx, y + 8, bx + max(2, w), y + 50], fill=col)
        e = ease_out(elem(t, 2.7, 0.7)); b = put_text(b, (bx, topY - 24), "MOST VALUED", sans(15, "light"), WARM, int(200*e), 0, 4, "la")
        e = ease_out(elem(t, 3.1, 0.7)); b = put_text(b, (bx, topY + len(rows)*rh + 6), "DEEMED HARMFUL", sans(15, "light"), WARM, int(200*e), 0, 4, "la")
        e = ease_out(elem(t, 3.7, 0.8)); b = put_text(b, (cx, 962), "SOURCE  CHICAGO REAL-ESTATE APPRAISAL, 1920s TO 1930s", sans(16, "light"), (132, 150, 138), int(210*e), 0, 6, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

GRAPHICS = {"wealth-gap": chart_wealthgap_scene, "hierarchy": chart_hierarchy_scene}

if "--probegfx" in sys.argv:
    chart_wealthgap_scene(os.path.join(TMP, "g_wealth.mp4"), 6.0)
    chart_hierarchy_scene(os.path.join(TMP, "g_hier.mp4"), 6.0)
    for nm in ["g_wealth", "g_hier"]:
        run(["-sseof", "-1.5", "-i", os.path.join(TMP, nm + ".mp4"), "-frames:v", "1",
             os.path.join("/tmp", nm + ".jpg")])
    print("PROBEGFX done")
    sys.exit(0)

if "--map" in sys.argv:
    map_scene(os.path.join(TMP, "g_map.mp4"), 7.6)
    for t in ["0.8", "2.6", "5.0", "7.2"]:
        run(["-ss", t, "-i", os.path.join(TMP, "g_map.mp4"), "-frames:v", "1", f"/tmp/map_t{t}.jpg"])
    print("MAP done")
    sys.exit(0)

def chart_area_scene(out, dur=6.6):
    """Chicago's Black population 1910 to 1940, an area-over-time reveal. Real
    U.S. Census counts; the curve steepens through the 1920s like the migration
    itself, and a terminal number counts up to 278,000."""
    x0, x1, base, topY = 360, 1500, 808, 392
    pts = [(1910, 44103), (1920, 109458), (1930, 233903), (1940, 277731)]
    mx = 300000
    def X(yr): return x0 + (yr-1910)/30.0*(x1-x0)
    def Y(v): return base - v/mx*(base-topY)
    full_poly = [(X(yr), Y(v)) for yr, v in pts]
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2; d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 212), "THE GREAT MIGRATION REACHES CHICAGO", sans(28, "semi"), RUST, int(255*e), int((1-e)*12), 9, "ma")
        d = ImageDraw.Draw(b)
        ax = ease_io(elem(t, 0.4, 0.7)); d.line([(x0, base), (x0+int((x1-x0)*ax), base)], fill=(120, 110, 96), width=2)
        # progressive left-to-right reveal of the filled curve
        rv = ease_io(elem(t, 0.8, 3.0)); revX = x0 + (x1-x0)*rv
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
        ld.polygon([(x0, base)] + full_poly + [(X(1940), base)], fill=(72, 53, 45, 255))
        ld.line(full_poly, fill=RUST + (255,), width=5, joint="curve")
        if revX < x1:
            ld.rectangle([int(revX), 0, W, H], fill=(0, 0, 0, 0))
            # hard clear to the right of the reveal edge
            clear = Image.new("RGBA", (W - int(revX), H), (0, 0, 0, 0))
            layer.paste(clear, (int(revX), 0))
        b.alpha_composite(layer)
        d = ImageDraw.Draw(b)
        for yr, v in pts:
            if X(yr) <= revX + 4:
                d.ellipse([X(yr)-7, Y(v)-7, X(yr)+7, Y(v)+7], fill=CREAM)
                da = ease_out(elem(t, 0.8 + (X(yr)-x0)/(x1-x0)*3.0, 0.5))
                b = put_text(b, (X(yr), Y(v)-40), f"{v:,}", sans(26, "semi"), CREAM, int(255*da), 0, 0, "mm")
                b = put_text(b, (X(yr), base+38), str(yr), sans(24, "light"), (214, 209, 199), int(255*da), 0, 0, "mm")
                d = ImageDraw.Draw(b)
        tc = ease_out(elem(t, 3.8, 1.2))
        if tc > 0:
            # the terminal number sits in the open space above the low left of
            # the curve, clear of the title and the 1940 node label
            shown = f"{int(round((40000+(278000-40000)*tc)/1000.0))*1000:,}"
            b = put_text(b, (600, 470), shown, serif(104, "semi"), CREAM, int(255*tc), 0, 0, "mm")
            b = put_text(b, (600, 540), "BLACK CHICAGOANS BY 1940", sans(21, "semi"), RUST, int(255*tc), 0, 5, "ma")
            d = ImageDraw.Draw(b)
        e = ease_out(elem(t, 0.9, 0.8)); b = put_text(b, (cx, 952), "Most of it held inside a thin strip of the South Side", sans(24, "light"), WARM, int(255*e), 0, 0, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

# The overarching timeline. One neighborhood across 170 years; the same
# years recur as a hero sequence and as a "you are here" ribbon on dividers.
TIMELINE = [
    (1853, "1853", "Cornell's lakefront"),
    (1890, "1890", "The University"),
    (1893, "1893", "The World's Fair"),
    (1948, "1948", "The color line"),
    (1958, "1958", "Urban renewal"),
    (2026, "2026", "Today"),
]
TL_MIN, TL_MAX = TIMELINE[0][0], TIMELINE[-1][0]
def tl_pos(year):
    return (year - TL_MIN) / (TL_MAX - TL_MIN)

def timeline_scene(out, dur=9.0):
    x0, x1, ly = 200, W - 200, int(H * 0.52)
    def px(p):
        return x0 + p * (x1 - x0)
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,))
        d = ImageDraw.Draw(b)
        # the spine draws in left to right (sweep slightly past the end so the
        # final marker's label also fades up)
        lp = ease_io(elem(t, 0.7, 2.0)) * 1.06
        d.line([(x0, ly), (int(min(px(lp), x1)), ly)], fill=(214, 209, 199, 255), width=2)
        texts = []
        for i, (yr, ylab, slab) in enumerate(TIMELINE):
            mp = tl_pos(yr)
            if lp < mp:
                continue
            ae = min(1.0, max(0.0, (lp - mp) / 0.06))
            above = (i % 2 == 0)
            ty = ly - 13 if above else ly + 13
            d.line([(int(px(mp)), ly), (int(px(mp)), ty)], fill=RUST + (255,), width=2)
            r = 5
            d.ellipse([px(mp) - r, ly - r, px(mp) + r, ly + r], fill=RUST + (255,))
            yy = ly - 76 if above else ly + 36
            sy = ly - 44 if above else ly + 68
            texts.append(((px(mp), yy), ylab, serif(42, "semi"), CREAM, int(255 * ae)))
            texts.append(((px(mp), sy), slab, sans(20, "light"), (214, 209, 199), int(215 * ae)))
        for xy, txt, fnt, col, al in texts:
            b = put_text(b, xy, txt, fnt, col, al, 0, 0, "mm")
        cx = W // 2
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 250), "FROM 1853 TO TODAY", sans(26, "semi"), RUST, int(255*e), int((1-e)*12), 12, "ma")
        e = ease_out(elem(t, 0.28, 0.7)); b = put_text(b, (cx, 322), "The ground keeps moving", serif(56, "italic"), CREAM, int(255*e), int((1-e)*14), 0, "mm")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def _divider_ribbon(b, t, tl_year):
    """A small to-scale timeline at the foot of a divider, current year lit."""
    if tl_year is None:
        return b
    rx0, rx1, ry = 380, W - 380, H - 150
    te = ease_out(elem(t, 0.55, 0.9))
    if te <= 0:
        return b
    d = ImageDraw.Draw(b)
    d.line([(rx0, ry), (int(rx0 + (rx1 - rx0) * te), ry)], fill=(170, 158, 140, 255), width=2)
    for yr, ylab, slab in TIMELINE:
        mx = rx0 + tl_pos(yr) * (rx1 - rx0)
        if (mx - rx0) / (rx1 - rx0) > te:
            continue
        cur = (yr == tl_year)
        rr = 7 if cur else 4
        col = RUST if cur else (165, 153, 136)
        d.ellipse([mx - rr, ry - rr, mx + rr, ry + rr], fill=col + (255,))
    mx = rx0 + tl_pos(tl_year) * (rx1 - rx0)
    return put_text(b, (mx, ry + 30), f"{tl_year}", sans(22, "semi"), RUST, int(255 * te), 0, 2, "mm")

def ribbon_overlay(path, year):
    """The same to-scale timeline, drawn full over a soft scrim band, to
    re-composite on the head of a chapter's first shot so the spine reads as
    continuous across the dip even over a busy photograph."""
    rx0, rx1, ry = 380, W - 380, H - 150
    # a soft, blurred dark band gives the thin ribbon a consistent surface
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(band).rounded_rectangle([rx0 - 70, ry - 50, rx1 + 70, ry + 62],
                                           radius=40, fill=(10, 18, 13, 150))
    b = band.filter(ImageFilter.GaussianBlur(30))
    d = ImageDraw.Draw(b)
    d.line([(rx0, ry), (rx1, ry)], fill=(190, 178, 160, 255), width=2)
    for yr, _, _ in TIMELINE:
        mx = rx0 + tl_pos(yr) * (rx1 - rx0)
        cur = (yr == year); rr = 8 if cur else 4
        col = RUST if cur else (182, 170, 153)
        d.ellipse([mx - rr, ry - rr, mx + rr, ry + rr], fill=col + (255,))
    mx = rx0 + tl_pos(year) * (rx1 - rx0)
    b = put_text(b, (mx, ry + 32), f"{year}", sans(22, "semi"), RUST, 255, 0, 2, "mm")
    b.save(path)
    return path

def animated_divider(out, n, era, title, dur=4.2, tl_year=None):
    fnt = serif(92)
    lines = wrap(ImageDraw.Draw(Image.new("RGB", (8, 8))), title, fnt, 1360)
    def fn(t):
        b = Image.new("RGBA", (W, H), CREAM + (255,)); cx = W // 2
        kicker = "INTRODUCTION" if n <= 0 else f"CHAPTER {n:02d}"
        e = ease_out(elem(t, 0.10, 0.6)); b = put_text(b, (cx, 330), kicker, sans(26, "semi"), RUST, int(255*e), int((1-e)*12), 13, "ma")
        e = ease_out(elem(t, 0.25, 0.6)); b = put_text(b, (cx, 384), era.upper(), sans(23, "light"), WARM, int(255*e), int((1-e)*10), 9, "ma")
        lh = 110; total = (len(lines)-1)*lh; ty = 560 - total/2
        for j, ln in enumerate(lines):
            e = ease_out(elem(t, 0.45 + j*0.13, 0.7)); b = put_text(b, (cx, int(ty + j*lh)), ln, fnt, INK, int(255*e), int((1-e)*22), 0, "mm")
        e = ease_out(elem(t, 0.45 + len(lines)*0.13, 0.6))
        if e > 0:
            d = ImageDraw.Draw(b); w = int(110*e); ry = int(560 + total/2 + 70); d.rectangle([cx-w//2, ry, cx+w//2, ry+3], fill=RUST+(255,))
        b = _divider_ribbon(b, t, tl_year)
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def animated_sources(out, dur=7.0):
    lines = ["Archival images via Wikimedia Commons, including the Library of",
             "Congress, The New York Public Library, and Creative Commons",
             "contributors, each credited on screen.", "",
             "Drone footage and 360 captures by Rooted Forward."]
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.1, 0.6)); b = put_text(b, (cx, 300), "SOURCES AND CREDITS", sans(26, "semi"), RUST, int(255*e), int((1-e)*12), 12, "ma")
        e = ease_out(elem(t, 0.3, 0.8)); b = put_text(b, (cx, 388), "On the public record", serif(58, "italic"), CREAM, int(255*e), int((1-e)*16), 0, "mm")
        y = 500
        for i, ln in enumerate(lines):
            if ln:
                e = ease_out(elem(t, 0.6 + i*0.12, 0.7)); b = put_text(b, (cx, y), ln, sans(30, "light"), (214,209,199), int(255*e), int((1-e)*10), 0, "mm")
            y += 52
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def animated_end(out, dur=8.5):
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.2, 0.9)); b = put_text(b, (cx, 372), "Rooted Forward", serif(108), CREAM, int(255*e), int((1-e)*26), 0, "mm")
        e = ease_out(elem(t, 0.6, 0.6))
        if e > 0:
            d = ImageDraw.Draw(b); w = int(120*e); d.rectangle([cx-w//2, 466, cx+w//2, 469], fill=RUST+(255,))
        e = ease_out(elem(t, 0.85, 0.9)); b = put_text(b, (cx, 556), "The ground keeps moving.", serif(54, "italic"), CREAM, int(255*e), int((1-e)*16), 0, "mm")
        # the open question resolves into a live call, not a full stop
        e = ease_out(elem(t, 1.25, 0.9)); b = put_text(b, (cx, 678), "Who gets to stay is still being decided.", serif(34), CREAM2, int(220*e), int((1-e)*12), 0, "mm")
        e = ease_out(elem(t, 1.55, 0.8)); b = put_text(b, (cx, 742), "Follow the work at rooted-forward.org", sans(25, "semi"), RUST, int(255*e), 0, 1, "mm")
        e = ease_out(elem(t, 1.95, 0.9)); b = put_text(b, (cx, 838), "HYDE PARK . CHICAGO", sans(22, "light"), WARM, int(255*e), 0, 8, "ma")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

if "--demo" in sys.argv:
    clips = []
    animated_title(os.path.join(TMP, "d_title.mp4")); clips.append(os.path.join(TMP, "d_title.mp4"))
    map_scene(os.path.join(TMP, "d_map.mp4")); clips.append(os.path.join(TMP, "d_map.mp4"))
    animated_divider(os.path.join(TMP, "d_div.mp4"), 6, "1952 to 1970s", "The University Rebuilds the Neighborhood"); clips.append(os.path.join(TMP, "d_div.mp4"))
    stat_scene(os.path.join(TMP, "d_stat.mp4"), "Buildings marked for demolition", "638", "in the Hyde Park and Kenwood renewal plan"); clips.append(os.path.join(TMP, "d_stat.mp4"))
    stat_scene(os.path.join(TMP, "d_stat2.mp4"), "Visitors over six months", "27 million", "to the 1893 World's Columbian Exposition", bg=(20,30,40)); clips.append(os.path.join(TMP, "d_stat2.mp4"))
    lf = os.path.join(TMP, "demo.txt")
    open(lf, "w").write("\n".join(f"file '{c}'" for c in clips))
    out = os.path.join(OUTDIR, "hp_demo.mp4")
    run(["-f", "concat", "-safe", "0", "-i", lf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", out])
    print("DEMO", out)
    sys.exit(0)

GRADE = {
 # warm duotone for the archival stills (curves-based sepia ramp)
 "archival": ("format=gbrp,hue=s=0,"
              "curves=r='0/0.05 0.5/0.5 1/0.98':g='0/0.035 0.5/0.45 1/0.87':b='0/0.02 0.5/0.37 1/0.72',"
              "eq=contrast=1.07:brightness=0.008,"
              "vignette=PI/4.5,noise=alls=8:allf=t+u"),
 # muted but alive color for present-day photos (kept distinct from the
 # archival duotone, without going flat and gray)
 "modern": ("eq=saturation=0.66:contrast=1.07:brightness=0.006,"
            "curves=preset=lighter,eq=contrast=1.03,"
            "colorbalance=rm=0.05:gm=0.01:bm=-0.06:rh=0.05:gh=0.02:bh=-0.05,"
            "vignette=PI/4.5,noise=alls=5:allf=t+u"),
 "none": "vignette=PI/4.5",
}

def render_card_clip(png, dur, out, zoom=True):
    frames = max(2, int(round(dur*FPS)))
    if zoom:
        # single still in, zoompan generates exactly `frames` frames (no -loop,
        # which would multiply frames and blow up render time)
        z = (f"scale={int(W*1.06)}:{int(H*1.06)},zoompan=z='min(zoom+0.00018,1.06)':d={frames}:"
             f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")
        img_in = ["-i", png]
    else:
        z = f"scale={W}:{H},fps={FPS}"
        img_in = ["-loop", "1", "-t", f"{dur}", "-i", png]
    vf = (f"{z},fade=t=in:st=0:d=0.5,fade=t=out:st={dur-0.5:.2f}:d=0.5,format=yuv420p")
    run([*img_in,
         "-f","lavfi","-t",f"{dur}","-i","anullsrc=r=48000:cl=stereo",
         "-vf",vf,"-r",str(FPS),"-t",f"{dur}",
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
         "-c:a","aac","-ar","48000","-ac","2",out])

# color-only grades (vignette + grain are added to the whole frame, not the photo)
GRADE_COLOR = {
 # a true warm duotone: desaturate, then map black-to-white onto a warm
 # sepia ramp via curves so the highlights read cream and the shadows read
 # warm brown, instead of the flat gray a weak colorbalance push left behind
 "archival": ("format=gbrp,hue=s=0,"
              "curves=r='0/0.05 0.5/0.5 1/0.98':g='0/0.035 0.5/0.45 1/0.87':b='0/0.02 0.5/0.37 1/0.72',"
              "eq=contrast=1.07:brightness=0.008"),
 "modern": ("eq=saturation=0.66:contrast=1.07:brightness=0.006,curves=preset=lighter,eq=contrast=1.03,"
            "colorbalance=rm=0.05:gm=0.01:bm=-0.06:rh=0.05:gh=0.02:bh=-0.05"),
 "none": "",
}

def render_shot(src, dur, grade, out, kb_idx=0, overlays=None):
    """One shot. The photo is shown COMPLETE and contained (never cropping
    the subject), over a blurred, darkened copy of itself that fills the
    16:9 frame. Motion comes from a slow drift on the backdrop."""
    frames = max(2, int(round(dur*FPS)))
    # a gentle CONTINUOUS zoom across the whole shot on the blurred backdrop, so
    # the frame keeps breathing end to end instead of locking after a couple
    # seconds (the old decelerate-to-stop read as static)
    cap = [1.18, 1.165, 1.185, 1.16][kb_idx % 4]
    bgz = f"1.0+{(cap-1.0)/frames:.6f}*on"
    # the sharp foreground slowly pans the FULL duration (a continuous drift from
    # one side to the other), never holding. No scale, so the subject never crops.
    dx = [26, -24, 22, -28][kb_idx % 4]; dy = [-16, 14, -18, 15][kb_idx % 4]
    color = GRADE_COLOR.get(grade, "")
    # contain box leaves a margin so nothing ever touches the frame edge
    fw, fh = int(W * 0.865), int(H * 0.915)
    fg = f"scale={fw}:{fh}:force_original_aspect_ratio=decrease,setsar=1"
    if color:
        fg += "," + color
    base = (
        f"[0:v]split=2[bg][fg];"
        f"[bg]scale={int(W*1.25)}:{int(H*1.25)}:force_original_aspect_ratio=increase,"
        f"crop={int(W*1.25)}:{int(H*1.25)},"
        f"zoompan=z='{bgz}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS},"
        f"gblur=sigma=38,eq=brightness=-0.26:saturation=0.38[bgb];"
        f"[fg]{fg}[fgc];"
        # continuous parallax: the crisp foreground drifts slowly across the full
        # shot (from +offset to -offset) so it is always in motion, never locking
        f"[bgb][fgc]overlay=x='(W-w)/2+({dx})*(1-2*t/{dur:.3f})':y='(H-h)/2+({dy})*(1-2*t/{dur:.3f})',"
        f"vignette=PI/4.2,noise=alls=7:allf=t+u,format=yuv420p[base]"
    )
    inputs = ["-i", src]
    parts = [base]
    last = "[base]"
    for i, ov in enumerate(overlays or []):
        png, a, b = ov["png"], ov["a"], ov["b"]
        slide = ov.get("slide", 0)
        inputs += ["-loop","1","-t",f"{dur}","-i", png]
        idx = i + 1
        parts.append(f"[{idx}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.5:alpha=1,"
                     f"fade=t=out:st={max(a,b-0.5):.2f}:d=0.5:alpha=1[o{idx}]")
        # data lower-thirds slide up into place as they fade in
        yexpr = f"'max(0,{slide}-(t-{a:.2f})*{slide/0.45:.0f})'" if slide else "0"
        parts.append(f"{last}[o{idx}]overlay=x=0:y={yexpr}:enable='between(t,{a:.2f},{b:.2f})'[c{idx}]")
        last = f"[c{idx}]"
    fc = ";".join(parts)
    run([*inputs, "-filter_complex", fc, "-map", last, "-t", f"{dur}", "-r", str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p", out])

# ---- animated map highlights ----------------------------------------------
# When a deep-dive shows a historical map, we don't just hold the still: we draw
# the SPECIFIC thing being narrated on top of it and animate it in, a pulsing
# point, a route that draws on, or an outlined region, with a label and a slow
# focus push toward it. Driven by MAP_HILITE (image id -> spec), populated per
# chapter. spec = {"kind": "point"|"route"|"region", "pts": [[nx,ny], ...],
# "label": "...", "focus": [nx,ny] (optional)} with coords normalized 0..1 of the
# map image.
MAP_HILITE = {}
_GLOW = (230, 122, 80)
_GLOW_HOT = (246, 206, 162)

def _map_archival(im):
    """A gentle warm archival tone for maps so they marry the film, keeping the
    document fully legible (light grade, not a heavy sepia that hides detail)."""
    im = ImageEnhance.Color(im).enhance(0.62)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    a = np.asarray(im).astype(np.float32)
    a[..., 0] = np.clip(a[..., 0] * 1.05 + 6, 0, 255)
    a[..., 2] = np.clip(a[..., 2] * 0.92, 0, 255)
    return Image.fromarray(a.astype("uint8"))

def _polyline_partial(P, frac):
    """The polyline drawn up to `frac` of its total length (last segment lerped)."""
    if frac <= 0:
        return [P[0]]
    if frac >= 1:
        return list(P)
    segs = [(P[i], P[i + 1], math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]))
            for i in range(len(P) - 1)]
    total = sum(L for *_, L in segs) or 1.0
    target = frac * total
    acc, out = 0.0, [P[0]]
    for a, b, L in segs:
        if acc + L < target:
            out.append(b); acc += L
        else:
            r = (target - acc) / L if L else 0
            out.append((a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r))
            break
    return out

def _map_label(fr, text, anchor, alpha):
    """A compact, fully-legible label plate near the highlight."""
    d = ImageDraw.Draw(fr, "RGBA")
    f = sans(27, "semi")
    tw = d.textlength(text, font=f)
    ax, ay = anchor
    bx = int(min(max(ax - tw / 2 - 18, 44), W - tw - 64))
    by = int(min(max(ay - 26, 30), H - 92))
    d.rounded_rectangle([bx, by, bx + tw + 36, by + 48], radius=4,
                        fill=(9, 11, 10, int(0.88 * alpha)))
    d.rectangle([bx + 9, by + 11, bx + 13, by + 37], fill=RUST + (alpha,))
    d.text((bx + 22, by + 9), text, font=f, fill=(245, 241, 234, alpha))

def map_highlight_clip(img_path, dur, out, spec, credit=None):
    """Render a map with an animated highlight of the place/route being narrated,
    plus a slow focus push so the eye is led to the exact spot."""
    src = _map_archival(Image.open(img_path).convert("RGB"))
    fw, fh = int(W * 0.93), int(H * 0.94)
    r = min(fw / src.width, fh / src.height)
    fgw, fgh = max(1, int(src.width * r)), max(1, int(src.height * r))
    fg = src.resize((fgw, fgh), Image.LANCZOS)
    ox, oy = (W - fgw) // 2, (H - fgh) // 2
    bg = src.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(42))
    bg = ImageEnhance.Brightness(bg).enhance(0.40)
    base = bg.convert("RGBA")
    base.alpha_composite(fg.convert("RGBA"), (ox, oy))
    P = [(ox + nx * fgw, oy + ny * fgh) for nx, ny in spec.get("pts", [])]
    kind = spec.get("kind", "point")
    label = spec.get("label", "")
    if spec.get("focus"):
        fx, fy = ox + spec["focus"][0] * fgw, oy + spec["focus"][1] * fgh
    elif P:
        fx, fy = sum(p[0] for p in P) / len(P), sum(p[1] for p in P) / len(P)
    else:
        fx, fy = W / 2, H / 2

    def fn(t):
        fr = base.copy()
        d = ImageDraw.Draw(fr, "RGBA")
        e = ease_out(min(1.0, (t - 0.3) / max(0.8, dur * 0.42)))
        pulse = 0.5 + 0.5 * math.sin(t * 3.0)
        if kind == "region" and len(P) >= 3:
            hole = Image.new("L", (W, H), 175)
            ImageDraw.Draw(hole).polygon(P, fill=0)
            dim = Image.new("RGBA", (W, H), (6, 8, 9, 255)); dim.putalpha(hole)
            fr.alpha_composite(dim)
            d = ImageDraw.Draw(fr, "RGBA")
            d.line(list(P) + [P[0]], fill=_GLOW + (255,), width=5, joint="curve")
        elif kind == "route" and len(P) >= 2:
            seg = _polyline_partial(P, e)
            if len(seg) >= 2:
                d.line(seg, fill=(60, 30, 18, 220), width=11, joint="curve")  # halo
                d.line(seg, fill=_GLOW + (255,), width=6, joint="curve")
                hx, hy = seg[-1]; rr = 9 + 5 * pulse
                d.ellipse([hx - rr, hy - rr, hx + rr, hy + rr],
                          outline=_GLOW_HOT + (255,), width=3)
        elif P:  # point
            cx, cy = P[0]; rr = 16 + 11 * pulse
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=_GLOW + (255,), width=4)
            d.ellipse([cx - 28, cy - 28, cx + 28, cy + 28], outline=(_GLOW[0], _GLOW[1], _GLOW[2], int(120 * pulse)), width=2)
            d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=RUST + (255,))
        if label and e > 0.1:
            la = int(255 * ease_out(min(1.0, (t - 0.5) / 0.6)))
            if kind == "route" and len(P) >= 2:
                anchor = (P[-1][0], P[-1][1] - 40)
            elif kind == "region":
                anchor = (sum(p[0] for p in P) / len(P), min(p[1] for p in P) - 40)
            elif P:
                anchor = (P[0][0], P[0][1] - 44)
            else:
                anchor = (W / 2, 120)
            _map_label(fr, label, anchor, la)
        # gentle continuous focus push toward the highlighted spot
        z = 1.0 + 0.13 * ease_io(min(1.0, t / dur))
        cw, ch = int(W / z), int(H / z)
        cx = int(min(max(fx - cw / 2, 0), W - cw))
        cy = int(min(max(fy - ch / 2, 0), H - ch))
        fr = fr.crop((cx, cy, cx + cw, cy + ch)).resize((W, H), Image.LANCZOS)
        # the attribution, in fixed screen space (drawn after the crop), bottom-right
        if credit:
            dc = ImageDraw.Draw(fr, "RGBA")
            cf = sans(20, "light")
            cw2 = dc.textlength(credit.upper(), font=cf)
            dc.text((W - cw2 - 46 + 1, H - 50 + 1), credit.upper(), font=cf, fill=(0, 0, 0, 150))
            dc.text((W - cw2 - 46, H - 50), credit.upper(), font=cf, fill=(206, 200, 190, 220))
        return fr.convert("RGB")

    seq_clip(fn, dur, out, fade=True)

# Flat HLG drone footage -> the film's warm archival tone. Tonemap runs after the
# downscale to 1080 so it is fast; the look stays full color (so "now" reads
# against the sepia "then") but tonally married to the archival grade.
GRADE_DRONE = (
    # scale/zoompan upstream drop the HLG color tags, so force the input
    # interpretation (BT.2020 / HLG) before tonemapping to BT.709.
    "zscale=tin=arib-std-b67:min=2020_ncl:pin=2020:t=linear:npl=100,"
    "tonemap=hable:desat=0,"
    "zscale=t=bt709:m=bt709:p=bt709:r=tv,format=gbrp,"
    "eq=contrast=1.06:saturation=0.9:gamma=0.97:gamma_r=1.03:gamma_b=0.95,"
    "colorbalance=rm=.04:rh=.03:bh=-.04:bs=-.03,unsharp=3:3:0.4"
)
# Old SDR archival film (1897 Edison, 1941). No tonemap; lift contrast and warm
# it toward the sepia stills so it lives in the same world.
GRADE_FILM = (
    "eq=contrast=1.12:brightness=0.015:saturation=0.65:gamma=0.98,"
    "colorbalance=rm=.07:rh=.06:gh=.01:bh=-.06:bs=-.05,unsharp=3:3:0.3"
)
GRADE_MODES = {"drone": GRADE_DRONE, "film": GRADE_FILM}

def video_shot(src, in_sec, dur, out, overlays=None, kb_idx=0, mode="drone",
               stabilize=False, speed=1.0, crop=None, push=0.0):
    """A real footage clip: trim + (optional crop / speed / stabilize) + grade +
    scale-to-fill 1920x1080 + the film's vignette/grain + the same overlay system
    as render_shot, so it drops into xfade_chain like any other shot. `crop` is a
    4K crop string w:h:x:y for a punch-in; `push` adds a slow zoom for life;
    `mode` picks the grade (drone HLG vs old archival film)."""
    pre = []
    trf = None
    if crop:
        pre.append(f"crop={crop}")
    pre.append("scale=1920:1080:force_original_aspect_ratio=increase,setsar=1,crop=1920:1080")
    if stabilize:
        trf = out + ".trf"
        run(["-ss", f"{in_sec:.3f}", "-t", f"{dur:.3f}", "-i", src, "-vf",
             ("crop=" + crop + "," if crop else "") +
             "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
             "vidstabdetect=shakiness=6:result=" + trf, "-f", "null", "-"])
        pre.append(f"vidstabtransform=input={trf}:zoom=4:smoothing=22:optzoom=1")
    # grade FIRST (the HLG tonemap needs the upstream colorspace intact), then
    # an optional slow push, then vignette/grain. zoompan after the grade keeps
    # it clear of the colorspace conversion.
    pre.append(GRADE_MODES.get(mode, GRADE_DRONE))
    pre.append("format=yuv420p")
    if push and push > 0.001:
        frames = max(2, int(round(dur*FPS)))
        z = f"1.0+{push:.4f}*(1-1/(1+on*0.03))"
        pre.append(f"zoompan=z='{z}':d={frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")
    grain = 6 if mode == "drone" else 10
    pre.append(f"vignette=PI/4.8,noise=alls={grain}:allf=t+u,format=yuv420p")
    if abs(speed-1.0) > 1e-3:
        pre.append(f"setpts={1.0/speed:.4f}*PTS")
    base = f"[0:v]{','.join(pre)}[base]"
    inputs = ["-ss", f"{in_sec:.3f}", "-t", f"{dur:.3f}", "-i", src]
    parts = [base]; last = "[base]"
    for i, ov in enumerate(overlays or []):
        png, a, b = ov["png"], ov["a"], ov["b"]; slide = ov.get("slide", 0)
        inputs += ["-loop","1","-t",f"{dur}","-i", png]; idx = i+1
        parts.append(f"[{idx}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.5:alpha=1,"
                     f"fade=t=out:st={max(a,b-0.5):.2f}:d=0.5:alpha=1[o{idx}]")
        yexpr = f"'max(0,{slide}-(t-{a:.2f})*{slide/0.45:.0f})'" if slide else "0"
        parts.append(f"{last}[o{idx}]overlay=x=0:y={yexpr}:enable='between(t,{a:.2f},{b:.2f})'[c{idx}]")
        last = f"[c{idx}]"
    run([*inputs, "-filter_complex", ";".join(parts), "-map", last, "-t", f"{dur}", "-r", str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p", out])
    if trf and os.path.exists(trf):
        os.remove(trf)

def xfade_chain(files, durs, out):
    if len(files) == 1:
        shutil.copy(files[0], out); return
    inputs = []
    for f in files:
        inputs += ["-i", f]
    parts = []
    cur = "[0:v]"
    running = durs[0]
    for k in range(1, len(files)):
        off = running - XFADE
        nxt = f"[x{k}]" if k < len(files)-1 else "[vout]"
        parts.append(f"{cur}[{k}:v]xfade=transition=fade:duration={XFADE}:offset={off:.3f}{nxt}")
        cur = nxt
        running = running + durs[k] - XFADE
    run([*inputs, "-filter_complex", ";".join(parts), "-map", "[vout]",
         "-r", str(FPS), "-c:v","libx264","-preset","veryfast","-crf","20",
         "-pix_fmt","yuv420p", out])

# Subtitles as ASS with explicit 1920x1080 play resolution, so they sit
# pinned to the very bottom and never drift up into the lower-thirds.
ASS_HEADER = (
    "[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n"
    "ScaledBorderAndShadow: yes\nWrapStyle: 0\n\n"
    "[V4+ Styles]\n"
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
    "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
    "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
    # bright near-white text on a semi-opaque dark BOX (BorderStyle 3), so the
    # caption is guaranteed legible over any background, bright maps included.
    # OutlineColour is the box fill (~75% opaque warm near-black); Outline = box pad
    "Style: Default,Gill Sans,46,&H00F4F7FB,&H000000FF,&H40120F0E,&H90000000,"
    "0,0,0,0,100,100,0,0,3,7,0,2,260,260,74,1\n\n"
    "[Events]\n"
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
)

def ass_time(s):
    cs = int(round((s % 1)*100)); t = int(s)
    return f"{t//3600}:{(t%3600)//60:02d}:{t%60:02d}.{cs:02d}"

def write_ass(cues, path):
    with open(path, "w") as f:
        f.write(ASS_HEADER)
        for c in cues:
            txt = c["text"].replace("\n", " ").strip()
            f.write(f"Dialogue: 0,{ass_time(c['startSec'])},{ass_time(c['endSec'])},Default,,0,0,0,,{txt}\n")

def finish_chapter(silent, dur, vo_path, ass, out):
    # tpad clones the last frame if the picture is shorter than dur, so the full
    # voiceover always has video under it and is never truncated by -t.
    vf = (f"[0:v]tpad=stop_mode=clone:stop_duration=12,"
          f"fade=t=in:st=0:d={EDGE},fade=t=out:st={dur-EDGE:.2f}:d={EDGE},"
          f"subtitles='{ass}'[v];[1:a]apad[a]")
    run(["-i", silent, "-i", vo_path, "-filter_complex", vf,
         "-map","[v]","-map","[a]","-t", f"{dur:.2f}", "-r", str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
         "-c:a","aac","-ar","48000","-ac","2", out])

# Curated, concise data callouts per chapter. Every value traces to a
# verified figure. Shown as elegant lower-thirds on the archival shots.
# secondary lower-thirds (the hero number is shown full-frame, not here)
CALLOUTS = {
 "formation": [("Deeded for the rail station", "60 acres")],
 "worlds-fair": [("Reopened as a museum", "1933")],
 "university": [("Rockefeller's first pledge", "$600,000")],
 "color-line": [("Covenants struck down", "1948")],
 "urban-renewal": [("Acres in the renewal plan", "856 acres"),
                   ("Buildings marked to fall", "638")],
}

def srt_time(s):
    ms = int(round((s % 1)*1000)); t = int(s)
    return f"{t//3600:02d}:{(t%3600)//60:02d}:{t%60:02d},{ms:03d}"

# ---- load data ----
def load_tour():
    txt = open(os.path.join(ROOT,"src/lib/immersive/tours/hyde-park.ts")).read()
    return json.loads(re.search(r"=\s*(\{[\s\S]*\});\s*$", txt).group(1))

tour = load_tour()
research = {c["chapterId"]: c for c in json.load(open(os.path.join(ROOT,"data/hp-research.json")))["chapters"]}
credits = json.load(open(os.path.join(ROOT,"public/media/hyde-park/credits.json")))
durations = json.load(open(os.path.join(ROOT, VO_DIR, "durations.json"))) if os.path.exists(os.path.join(VO_DIR,"durations.json")) else {}

def local(url):
    return os.path.join(ROOT, "public", url.lstrip("/"))

PANO_INSTR = {
 "pano-hyde-park": ("57th Street and the lakefront", "A 360 capture at 57th Street Beach, looking to the skyline."),
 "pano-jackson-park": ("Jackson Park today", "A 360 capture where the 1893 fair once stood."),
 "pano-main-quad": ("The Main Quadrangles", "A 360 capture inside the University of Chicago quads."),
 "pano-55th-street": ("55th Street, rebuilt ground", "A 360 capture along the blocks urban renewal cleared."),
 "pano-obama-center": ("The Obama Center, Jackson Park", "A 360 capture at the Presidential Center site."),
}

# ids forced to the sepia archival grade because they are modern colour
# reproductions of a historical subject and otherwise break the period tone
FORCE_ARCHIVAL = {
    "dd-land-5", "dd-redlining-14", "dd-redlining-15", "protective-club-era",
    "dd-university-5", "dd-university-8", "dd-color-line-14",
}

def chapter_image_grade(clipid):
    if clipid.startswith("intro-mg"): return "archival"
    if clipid in FORCE_ARCHIVAL: return "archival"
    c = credits.get(clipid)
    if not c: return "archival"
    lic = (c.get("license") or "")
    yr = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", c.get("date","") or "")
    period = ("public domain" in lic.lower()) or (yr and int(yr.group(1)) < 1945)
    return "archival" if period else "modern"

# Cold-open montage for the intro: a fast tease of the eras to come,
# pulled from the archival stills already in the film.
# no cold-open montage: it reused chapter images. The intro plays the host
# opening, the 57th Street 360, and present-day Hyde Park b-roll under the
# orientation narration, so every still appears exactly once in its chapter.
INTRO_MONTAGE = []

def figures_for(cid):
    fs = research.get(cid,{}).get("verify",{}).get("verifiedFigures",[])
    out = []
    for f in fs:
        val = f.get("value","").strip()
        what = f.get("what","").strip()
        if val and what and len(val) < 26:
            # short label from the "what"
            lab = re.split(r",|\(", what)[0].strip()
            lab = " ".join(lab.split()[:6])
            out.append((lab, val))
    return out

# Hand-curated clean credits per image (institution or author), so no raw
# archive labels or uploader handles ever appear on screen.
CREDIT_OVERRIDE = {
 "color-line-1": "The New York Public Library",
 "color-line-3": "Joelean Hall",
 "color-line-4": "Wikimedia Commons",
 "formation-1": "Wikimedia Commons",
 "formation-2": "N. H. Shepherd",
 "formation-4": "Library of Congress",
 "university-1": "Tichnor Brothers",
 "university-2": "Library of Congress",
 "university-3": "Scientific American, 1907",
 "university-4": "Wikimedia Commons",
 "urban-renewal-1": "Chicago Aerial Survey, 1928",
 "urban-renewal-3": "Wikimedia Commons",
 "urban-renewal-4": "Warren LeMay",
 "worlds-fair-1": "C. D. Arnold, 1893",
 "worlds-fair-3": "C. D. Arnold, 1893",
 "worlds-fair-4": "C. D. Arnold, 1893",
 "worlds-fair-6": "C. D. Arnold, 1893",
 "worlds-fair-7": "C. D. Arnold, 1893",
 "formation-5": "Wikimedia Commons",
 "formation-6": "Leslie's Illustrated, 1856",
 "university-5": "Chicago Inter Ocean, 1893",
 "color-line-5": "Russell Lee, 1941",
 "color-line-6": "Wikimedia Commons",
 "color-line-7": "Russell Lee, 1941",
}

def credit_text(clipid):
    import html
    if clipid in CREDIT_OVERRIDE:
        return CREDIT_OVERRIDE[clipid]
    c = credits.get(clipid)
    if not c: return None
    art = html.unescape((c.get("artist") or "").strip())
    is_pd = "public domain" in (c.get("license") or "").lower()
    who = re.sub(r"\(?\d{3,4}[-–]\d{0,4}\)?", "", art).strip(" ,")
    who = re.sub(r",?\s*(photographer|publisher).*$", "", who, flags=re.I).strip(" ,")
    who = re.sub(r"\s+from\s+.*$", "", who, flags=re.I).strip(" ,")
    who = who.split(",")[0].strip()
    who = re.sub(r"\s*\(.*$", "", who).strip()  # drop parenthetical aliases / open parens
    # OpenStreetMap-derived maps get the data credit, not the wiki editor handle
    if "openstreetmap" in art.lower():
        return "OpenStreetMap"
    # Commons uploader handle / wiki username / unknown -> clean museum credit, on
    # ANY license (not just PD): a bare one-token name, a name with a digit, or a
    # "user:" / wiki marker reads as a handle, never a real attribution
    handle = (
        (not who)
        or re.search(r"wiki(p|m)edia|user:|\bat en\b|^unknown", who + " " + art, re.I)
        or bool(re.search(r"\d", who))   # a name with a digit is a Commons handle, not an artist
    )
    if handle:
        return "Wikimedia Commons"
    # only show a plausible photo-era year, not a subject's death year
    yr = re.search(r"\b(18\d\d|19[0-2]\d)\b", c.get("date", "") or "")
    return who[:34] + (", " + yr.group(1) if yr else "")

# ---- build scenes ----
# Keep the silent opening short so narration starts soon. The overarching
# timeline lives on every chapter divider's "you are here" ribbon, so the
# standalone hero timeline is dropped from the open.
scenes = []
if "--deepdive" not in sys.argv:
    ttl = os.path.join(TMP, "scene_title.mp4"); animated_title(ttl, 4.4)
    scenes.append(ttl)
    mp = os.path.join(TMP, "scene_map.mp4"); map_scene(mp, 6.6)
    scenes.append(mp)

# which point on the timeline each chapter sits at, for the divider ribbon
DIV_YEAR = {"land": 1833, "formation": 1853, "university": 1890, "worlds-fair": 1893,
            "color-line": 1908, "redlining": 1940, "urban-renewal": 1958, "present": 2026}

# ---- real footage clips ----------------------------------------------------
# id -> (source path, in-point seconds, grade mode, extra video_shot opts).
# Display duration comes from the storyboard anchors, like any still. Drone is
# the owner's 4K HLG (graded warm, full color = "now"); film is public-domain
# archival (graded toward the sepia stills = "then"), labeled honestly.
CLIPS = {
 "cornell-stone":    ("Live Media/DJI_0156.MP4",  1.0, "drone", {}),
 "lakefront-reveal": ("Live Media/DJI_0160.MP4",  2.0, "drone", {}),
 "greystone-rise":   ("Live Media/DJI_0158.MP4",  1.0, "drone", {}),
 "ic-tracks":        ("Live Media/DJI_0162.MP4",  9.0, "drone", {}),
 "ic-tracks-detail": ("Live Media/DJI_0166.MP4",  0.3, "drone", {}),
 "old-new-pan":      ("Live Media/DJI_0163.MP4",  2.0, "drone", {}),
 "campus-quads":     ("Live Media/DJI_0172.MP4",  5.0, "drone", {}),
 "campus-quads2":    ("Live Media/DJI_0175.MP4",  3.0, "drone", {}),
 "midway-now":       ("Live Media/DJI_0169.MP4", 16.0, "drone", {}),
 "jackson-lagoon":   ("Live Media/DJI_0179.MP4", 17.0, "drone", {}),
 "obama-aerial":     ("Live Media/DJI_0176.MP4",  0.5, "drone", {}),
 "obama-aerial2":    ("Live Media/DJI_0177.MP4",  2.0, "drone", {}),
 "obama-hero":       ("Live Media/DJI_0180.MP4", 35.0, "drone", {}),
 "film-1897-street": ("Live Media/archival/1897_edison_corner-madison-state-chicago_LOC-00694183.mp4",  8.0, "film", {}),
 "film-1897-trolley":("Live Media/archival/1897_edison_armours-electric-trolley_LOC-00694146.mp4",       6.0, "film", {}),
 "film-1941-city":   ("Live Media/archival/1941_lets-see-chicago_LOC-2023600637.mp4",                   75.0, "film", {}),
}
# wall label + sub + credit per clip (the curator's quiet caption on footage)
CLIP_INFO = {
 "cornell-stone":    ("Paul Cornell's stone", "Promontory Point, today", "Drone, Rooted Forward"),
 "lakefront-reveal": ("Hyde Park, today", "Seven miles south of the Loop", "Drone, Rooted Forward"),
 "greystone-rise":   ("Hyde Park, today", "The greystones Cornell sold", "Drone, Rooted Forward"),
 "ic-tracks":        ("The Illinois Central, today", "Still on the lakefront it built", "Drone, Rooted Forward"),
 "ic-tracks-detail": ("The tracks today", "The embankment that split the neighborhood", "Drone, Rooted Forward"),
 "old-new-pan":      ("Hyde Park, today", "Old and new, side by side", "Drone, Rooted Forward"),
 "campus-quads":     ("The University of Chicago, today", "The Gothic quads Cobb laid out", "Drone, Rooted Forward"),
 "campus-quads2":    ("The main quadrangles, today", "", "Drone, Rooted Forward"),
 "midway-now":       ("The Midway Plaisance, today", "The green spine the fair left", "Drone, Rooted Forward"),
 "jackson-lagoon":   ("Jackson Park, today", "The 1893 fairgrounds from the air", "Drone, Rooted Forward"),
 "obama-aerial":     ("The Obama Center, today", "On the ground that held the fair", "Drone, Rooted Forward"),
 "obama-aerial2":    ("The Obama Center", "Jackson Park, today", "Drone, Rooted Forward"),
 "obama-hero":       ("The Obama Center", "Jackson Park, today", "Drone, Rooted Forward"),
 "film-1897-street": ("Chicago, 1897", "Madison and State Streets", "Edison, Library of Congress"),
 "film-1897-trolley":("Chicago, 1897", "An electric line through the yards", "Edison, Library of Congress"),
 "film-1941-city":   ("Chicago, 1941", "from 'Let's See Chicago'", "Library of Congress"),
}

CARD_CLIPS = {"host-intro":("HOST ON CAMERA","Open with you to camera","Film your intro piece. The script is in the shot list."),
              "host-close":("HOST ON CAMERA","Close with you to camera","Film your closing piece to camera."),
              }

# The exact shot to film for each placeholder, printed on the slate so the
# card itself tells you what goes there. (headline, what to shoot).
SHOT_DESC = {
 "host-intro": ("Your opening, to camera",
   "Stand on a Hyde Park sidewalk with greystone two-flats and the lakefront behind you. Handheld, framed medium, warm daylight. Deliver the opening lines to camera, then walk a few slow steps as the operator drifts with you."),
 "pano-hyde-park": ("57th Street Beach, look around",
   "Set the 3D camera level on the sand at 57th Street Beach, the downtown skyline low across the water. Capture a full slow turn so a viewer can look from the lake back to the neighborhood. Clear daylight, calm water, no one crossing close to the lens."),
 "present-intro": ("Present-day Hyde Park",
   "Gather establishing footage of greystone two-flats, the University of Chicago Gothic quad, and the Olmsted parkland along the lake. Include one high wide shot from a rooftop or rise to sell the seven miles south of the Loop. Slow pushes, soft daylight."),
 "present-present": ("The Center and Woodlawn",
   "Film the Obama Center tower from several angles in Jackson Park, including a low upward shot for the height, and a wide lakefront establishing shot. Then move to East Woodlawn streets, newer renovations beside older homes. No recognizable faces without a release."),
 "pano-obama-center": ("The Obama Center, look around",
   "Place the 3D camera on the lawn near the base of the Obama Center tower in Jackson Park. Capture a full level turn taking in the Center, the parkland, and the lake, the same ground that held the 1893 fair. Even daylight, tripod steady."),
 "host-close": ("Your closing, to camera",
   "Walk a Jackson Park path with the Obama Center over your shoulder, the operator tracking alongside, framed medium in warm late daylight. Deliver the closing question to camera, then stop and hold as you look back toward the Center."),
}

# Real 360 captures (Insta360), used as the auto-panning beat in the flat film
# and as the drag-to-look-around viewer on the website. ref -> (equirect jpg,
# on-screen title, initial yaw fraction 0..1).
PANO_FILE = {
 "pano-founding": ("public/media/hyde-park/360/founding-rock.jpg", "Where it began", 0.30),
 "pano-cobb":     ("public/media/hyde-park/360/cobb-hall.jpg",     "Outside Cobb Hall", 0.12),
 "pano-quad-now": ("public/media/hyde-park/360/modern-quad.jpg",   "The University of Chicago now", 0.0),
}

def pano_card(ref, dur, out):
    """A real 360 capture, auto-panned so the flat film previews the look-around.
    On the website this exact spot becomes a drag-to-look-around viewer; the flat
    MP4 cannot move, so it pans on its own and invites the viewer to the site."""
    rel, title, yaw0 = PANO_FILE.get(ref, ("public/media/hyde-park/360/cobb-hall.jpg", "Look around", 0.0))
    src = os.path.join(ROOT, rel)
    pano = Image.open(src).convert("RGB").resize((2160, H))
    strip = Image.new("RGB", (4320, H)); strip.paste(pano, (0, 0)); strip.paste(pano, (2160, 0))
    start = int(yaw0 * 2160)
    def fn(tt):
        x = (start + int((tt / dur) * 1000)) % 2160   # slow drift, ~half a turn
        frame = strip.crop((x, 0, x + W, H)).convert("RGBA")
        # label rides the TOP so it never collides with the bottom subtitles
        scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(scrim).rectangle([0, 0, W, 232], fill=(8, 13, 10, 150))
        scrim = scrim.filter(ImageFilter.GaussianBlur(30))
        frame = Image.alpha_composite(frame, scrim)
        e = ease_out(elem(tt, 0.2, 0.7)); cx = W // 2
        frame = put_text(frame, (cx, 96), title, serif(46, "reg"), CREAM, int(245 * e), 0, 0, "mm")
        frame = put_text(frame, (cx, 150), "DRAG TO LOOK AROUND ON THE WEBSITE", sans(20, "light"), (200, 196, 186), int(210 * e), 0, 6, "mm")
        return frame.convert("RGB")
    seq_clip(fn, dur, out)

# Full-frame count-up stat moment for each history chapter's hero number.
HERO = {
 "formation": ("Acres Cornell bought in 1853", "300", "of lakefront prairie, between 51st and 55th", "Hyde Park Historical Society"),
 "worlds-fair": ("Visitors over six months", "27 million", "to the 1893 World's Columbian Exposition", "Chicago Historical Society"),
 "university": ("Students on opening day", "594", "when the University of Chicago opened, 1892", "University of Chicago archives"),
 "color-line": ("Black Chicagoans by 1940", "278,000", "up from about forty thousand in 1910", "U.S. Census, Chicago"),
 "urban-renewal": ("Families displaced", "about 4,000", "by the Hyde Park and Kenwood renewal", "Hirsch, Making the Second Ghetto"),
}

# Custom stat cards keyed by a storyboard ref, so the big numbers in a chapter
# become their own beat instead of pinning one image on screen for 20+ seconds.
# (label, big number, context line, on-screen source)
STATS = {
 "pop":       ("Residents by 1889", "85,000", "up from about a thousand in the 1860s, annexed to Chicago that year", "U.S. Census, Hyde Park Township"),
 "pledge":    ("Rockefeller's founding pledge", "$600,000", "for a new Baptist university in Chicago, 1889", "University of Chicago archives"),
 "match":     ("Other donors had to match", "$400,000", "before the gift was real. They did, and it incorporated in 1890", "University of Chicago archives"),
 "acres":     ("Acres in the renewal plan", "856", "across Hyde Park and Kenwood, the largest such plan in the country", "Hyde Park-Kenwood Urban Renewal Plan, 1958"),
 "buildings": ("Buildings marked to fall", "638", "the first came down May 10, 1955, before the City Council approved the plan in 1958", "South East Chicago Commission"),
 "fell":      ("Black population after renewal", "down 40%", "and then the university looked south, toward Woodlawn", "Hyde Park-Kenwood, 1950 to 1970"),
 "acres-ceded":("Acres ceded in 1833", "5 million", "the last great tract east of the Mississippi, the Chicago region among it", "Treaty of Chicago, 1833"),
 "uofc-covenant":("The university spent defending covenants", "$83,000", "between 1933 and 1947, to keep the blocks around its campus white", "Hirsch, Making the Second Ghetto"),
 "club":      ("Members of the Protective Club", "350", "white Hyde Park homeowners organized to push Black residents out, from 1908", "Spear, Black Chicago"),
 "color-tax": ("Stripped from Black Chicago", "$3 billion", "and more, in markups on homes sold to Black families on contract, 1950s to 1960s", "Duke and NCRC, 2019"),
}

# Museum wall labels. Each names a detail that has been visually confirmed in
# the actual photograph and states only a fact from the research or credits.
# They emerge on the beat the narration names the subject, then rest, the way
# a curator quietly points. Verified by the elevation annotation panel.
ANNOT = {
 "formation-1": ("Paul Cornell", "Founder of Hyde Park"),
 "formation-5": ("The Hyde Park House", "Cornell's lakefront hotel"),
 "formation-6": ("The Illinois Central", "The railroad that built the suburb"),
 "university-3": ("John D. Rockefeller", "The university's first benefactor"),
 "university-5": ("Marshall Field", "Gave the first ten acres"),
 "university-2": ("William Rainey Harper", "The first president"),
 "university-1": ("Cobb Hall", "The first building, 1892"),
 "worlds-fair-6": ("The first Ferris Wheel", "Built for the 1893 fair"),
 "worlds-fair-1": ("The Court of Honor", "They called it the White City"),
 "worlds-fair-3": ("The Palace of Fine Arts", "The one building that survived"),
 "worlds-fair-7": ("The Midway Plaisance", "A mile of the fair"),
 "worlds-fair-10": ("The Court of Honor", "From the Administration Building"),
 "worlds-fair-8": ("Olmsted's lagoon", "The Wooded Island, 1893"),
 "color-line-5": ("Chicago's Black Belt", "Photographed in 1941"),
 "color-line-4": ("A covenanted block", "The clause was in the deed"),
 "ic-embankment-hist": ("The Illinois Central tracks", "The rail line that split the lakefront"),
 "midway-village-hist": ("The Midway Plaisance", "Peoples staged as exhibits, 1893"),
 "homer-hoyt": ("The redlining map", "Federal security grades, Chicago"),
 "woodlawn-hist": ("Chicago's South Side", "The Black Belt, 1941"),
 "urban-renewal-1": ("Hyde Park before clearance", "Photographed in 1928"),
 "urban-renewal-3": ("University Apartments", "Built on cleared land"),
 "urban-renewal-4": ("55th Street today", "The corridor renewal rebuilt"),
 "university-5": ("Marshall Field", "Gave the first ten acres"),
 "land-potawatomi": ("Chief Wabaunsee", "A Potawatomi leader of the Three Fires"),
 "land-treaty-chicago": ("The Treaty of Chicago", "Signed in 1833"),
 "land-early-chicago": ("Chicago in 1833", "Prairie at the river's mouth"),
 "formation-ic-train": ("The Illinois Central", "The railroad that made the suburb"),
 "douglas-portrait": ("Senator Stephen Douglas", "His land held the first university"),
 "first-uofc": ("The first University of Chicago", "Founded in the 1850s, closed 1886"),
 "fannie-barrier-williams": ("Fannie Barrier Williams", "A resident who refused to leave"),
 "jesse-binga": ("Jesse Binga", "The banker who lent to Black families"),
 "great-migration": ("The Great Migration", "Arriving in Chicago"),
 "black-belt-street": ("Inside the Black Belt", "Photographed in 1941"),
 "white-city-night": ("The Court of Honor", "They called it the White City"),
 "midway-1893-crowd": ("The Midway Plaisance", "Beyond the White City"),
}

# ---- narration-synced storyboards (history chapters) ----
# Each shot is (kind, ref, anchor). The anchor is a phrase from the
# voiceover; the shot appears exactly when that phrase is spoken, so every
# image, stat, and callout lines up with what the narration is talking about.
# callouts are (label, value, anchor) and attach to whatever shot covers
# their moment.
STORY = {
 # Every chapter is a narration-synced storyboard now, so stills, real footage
 # (clip), archival film, 360 panos, graphics and stat cards all crossfade as one.
 "intro": {
   "shots": [
     # opens on the real lakefront reveal, carrying "runs right up to Lake Michigan"
     ("clip", "lakefront-reveal", "On the South Side"),  # the lakefront, today
     ("clip", "greystone-rise", "look permanent"),      # greystones
     ("clip", "campus-quads2", "Then a university"),    # the campus
     ("clip", "obama-aerial2", "This is the story"),    # hand to the deep history
   ],
   "callouts": [],
 },
 "land": {
   "shots": [
     ("img", "land-early-chicago", "prairie and marsh"),
     ("img", "land-potawatomi", "Potawatomi land"),
     ("img", "land-treaty-chicago", "Black Hawk War"),
     ("stat", "acres-ceded", "five million"),
     ("pano", "pano-founding", "the old trail"),        # the lakefront today (then-and-now)
     ("clip", "cornell-stone", "Paul Cornell bought"),  # hand-off to Cornell
   ],
   "callouts": [],
 },
 "formation": {
   "shots": [
     ("img", "formation-1", "named it Hyde Park"),      # Paul Cornell opens the chapter on the naming
     ("img", "formation-ic-train", "handed the Illinois Central"),  # the historic IC, on its real line
     ("clip", "ic-tracks", "six trains a day"),         # the tracks today, then-and-now
     ("img", "formation-5", "four-story wood hotel"),   # the Hyde Park House
     ("img", "formation-2", "Mary Todd Lincoln"),       # Mary Todd Lincoln
     ("stat", "pop", "eighty-five thousand"),           # population to 85k by 1889
     ("img", "formation-4", "sold the place as selective"),  # the bird's-eye, the sorting begins
   ],
   "callouts": [("Deeded to the railroad", "60 acres", "sixty acres"),
                ("A lakefront house, vs the south", "$7,000 to $2,000", "seven thousand")],
 },
 "university": {
   "shots": [
     ("img", "first-uofc", "not the first University"), # the first U of C (Douglas land)
     ("img", "university-3", "one man's money"),        # Rockefeller
     ("stat", "pledge", "six hundred thousand"),        # $600,000 pledge
     ("img", "university-5", "Marshall Field gave"),    # Marshall Field, the land gift (breaks the stat hold)
     ("img", "university-2", "William Rainey Harper"),  # Harper
     ("img", "university-1", "Gothic quads"),           # Cobb Hall, historic
     ("clip", "campus-quads", "you still walk through"),# the quads today
     ("pano", "pano-cobb", "protected"),                # the Cobb Hall 360
     ("img", "university-4", "decide who got to live"), # the foreshadow
   ],
   "callouts": [],
 },
 "worlds-fair": {
   "shots": [
     ("img", "worlds-fair-10", "not a park"),           # the fair, establishing
     ("img", "worlds-fair-8", "lagoons"),               # Olmsted's lagoons
     ("img", "white-city-night", "Court of Honor"),     # the White City
     ("stat", None, "twenty-seven million"),            # 27 million visitors
     ("img", "ic-embankment-hist", "wall of earth"),    # the historical IC tracks that split the neighborhood
     ("clip", "jackson-lagoon", "valuable ground"),     # the fairgrounds, today
   ],
   "callouts": [],
 },
 "color-line": {
   "shots": [
     ("img", "protective-club-era", "started with a club"),  # Hyde Park, the era
     ("stat", "club", "three hundred and fifty"),       # 350 members
     ("img", "fannie-barrier-williams", "Fannie Barrier Williams"),  # her portrait
     ("img", "racial-hierarchy-doc", "racially restrictive covenant"),  # the covenant
     ("stat", "uofc-covenant", "eighty-three thousand"),  # $83k university funding
     ("chart", "great-migration", "two hundred seventy-eight thousand"),  # migration
     ("img", "color-line-5", "the Black Belt"),         # the real Black Belt tenement, 1941
     ("img", "color-line-7", "kitchenette apartments"), # kitchenette life
   ],
   "callouts": [],
 },
 "redlining": {
   "shots": [
     ("graphic", "hierarchy", "ranked races"),          # the ladder owns the "ranked races" line
     ("img", "homer-hoyt", "drawn onto maps"),          # the real Chicago HOLC redlining map
     ("img", "university-1", "Hyde Park classroom"),    # the U of C, where the idea was built (historical)
     ("img", "color-line-4", "Not until 1948"),         # the covenanted house, re-anchored onto the Shelley line
   ],
   "callouts": [("Covenants struck down", "1948", "Shelley")],
 },
 "urban-renewal": {
   "shots": [
     ("img", "urban-renewal-1", "In 1952"),             # the 1928 aerial, the Commission
     ("img", "urban-renewal-4", "Julian Levi ran it"),  # the corridor today (breaks the long aerial)
     ("stat", "acres", "eight hundred fifty-six"),      # 856 acres in the plan
     ("stat", "buildings", "six hundred thirty-eight"), # 638 buildings marked to fall
     ("stat", None, "four thousand"),                   # ~4,000 families displaced
     ("img", "urban-renewal-3", "twenty-nine million"), # the rebuilt blocks, $29M of its own money
     ("chart", "return-rate", "forty-six"),             # who got to stay, 46% vs 17%
     ("stat", "fell", "fell by about forty percent"),   # Black population down 40%
     ("img", "woodlawn-hist", "toward Woodlawn"),       # the next target, breaks the long stat hold
   ],
   "callouts": [("The university's own money", "$29M", "twenty-nine million")],
 },
 "present": {
   "shots": [
     ("clip", "obama-hero", "Obama Presidential Center opened"),  # the Obama Center, one example
     ("clip", "jackson-lagoon", "held the 1893 World's Fair"),    # Jackson Park, ties back to the fair
     ("clip", "old-new-pan", "home prices doubled"),    # the changing blocks, old beside new (broadens past Obama)
     ("img", "woodlawn-hist", "bought on contract"),    # the older wound, South Side contract-era housing
     ("stat", "color-tax", "three to four billion"),    # the color tax (carries "simply vanished")
     ("graphic", "wealth-gap", "six to one"),           # the wealth-gap bars
     # closes on the slowly panning Gothic quad as the final question lands
     ("pano", "pano-quad-now", "An institution arrives"),  # the University of Chicago now
   ],
   "callouts": [],
 },
}

def anchor_time(cues, kw, vo, vodur, fallback=None):
    """When the phrase is spoken. Prefer the exact caption-cue start; if the
    phrase was split across captions, fall back to its character position in
    the full voiceover (robust to any splitting)."""
    kw = kw.lower()
    for c in cues:
        if kw in c["text"].lower():
            return c["startSec"]
    idx = vo.lower().find(kw)
    if idx >= 0 and vo:
        return (idx / len(vo)) * vodur
    return fallback

def build_story_chapter(cid, seq, vodur, cues):
    shots = STORY[cid]["shots"]
    cos = STORY[cid].get("callouts", [])
    vo = research.get(cid, {}).get("script", {}).get("voiceover", "") or ""
    n = len(shots)
    # find the moment each shot is narrated, keep them in order
    T = [anchor_time(cues, sh[2], vo, vodur, vodur * i / n) for i, sh in enumerate(shots)]
    T[0] = 0.0
    for i in range(1, n):
        if T[i] < T[i - 1] + 2.8:
            T[i] = T[i - 1] + 2.8
    # durations, adjusted so the crossfade lands each shot on its anchor
    durs = []
    for i in range(n):
        nxt = T[i + 1] if i + 1 < n else (vodur + 1.0)
        durs.append(max(2.8, (nxt - T[i]) + XFADE))
    # Full-frame cards (stat count-ups, charts, graphics) read as static after
    # their reveal, so they should not hold the screen too long. Cap each kind
    # and spread the saved time across the real images and clips, which hold
    # gracefully under a slow push. sum(durs) is preserved, so the chapter still
    # covers the full voiceover and the crossfade offsets stay aligned (the chart
    # clip is rendered at its capped dur, matching what the chain expects).
    CAP = {"stat": 9.0, "chart": 9.0, "graphic": 10.0}
    IMG_CAP = 11.5
    saved = 0.0
    for i in range(n):
        ki = shots[i][0]
        if ki in CAP and durs[i] > CAP[ki]:
            saved += durs[i] - CAP[ki]
            durs[i] = CAP[ki]
    # give the saved time only to images/clips that still have room (so an
    # already-long establishing shot never gets longer), capping each at IMG_CAP
    for _ in range(6):
        room = [k for k in range(n) if shots[k][0] in ("img", "clip") and durs[k] < IMG_CAP - 0.05]
        if saved <= 0.1 or not room:
            break
        per = saved / len(room)
        for k in room:
            add = min(per, IMG_CAP - durs[k])
            durs[k] += add
            saved -= add
    # any remainder is spread EVENLY across all image/clip shots, never dumped on
    # one shot (which used to make a single still hold 30-48s and read as dead)
    if saved > 0.1:
        imgs = [k for k in range(n) if shots[k][0] in ("img", "clip")]
        if imgs:
            per = saved / len(imgs)
            for k in imgs:
                durs[k] += per
        else:
            durs[-1] += saved
    # assign each callout to the shot that is on screen when it is said
    assign = {}
    for lab, val, anc in cos:
        tc = anchor_time(cues, anc, vo, vodur, None)
        if tc is None:
            continue
        idx = 0
        for i in range(n):
            if T[i] <= tc:
                idx = i
        # never put a callout on a full-frame stat or chart; use the nearest image
        if shots[idx][0] in ("stat", "chart", "graphic", "card", "pano"):
            j = idx + 1
            while j < n and shots[j][0] in ("stat", "chart", "graphic", "card", "pano"):
                j += 1
            if j >= n:
                j = idx - 1
                while j >= 0 and shots[j][0] in ("stat", "chart", "graphic", "card", "pano"):
                    j -= 1
            idx = max(0, min(n - 1, j))
        lt = max(0.6, min(tc - T[idx], durs[idx] - 3.2))
        assign.setdefault(idx, []).append((lab, val, lt))
    files = []
    for i, (kind, ref, anchor) in enumerate(shots):
        dur = durs[i]
        out = os.path.join(TMP, f"{cid}_st{i}.mp4")
        if kind == "stat":
            spec = STATS[ref] if ref else HERO[cid]
            stat_scene(out, *spec, dur=dur)
            files.append(out)
            continue
        if kind == "chart":
            # dur is already capped above, so the clip length matches what the
            # crossfade chain expects (no truncation of later shots)
            if ref == "return-rate":
                chart_bars_scene(out, dur=dur)
            elif ref == "great-migration":
                chart_area_scene(out, dur=dur)
            files.append(out)
            continue
        if kind == "graphic":
            GRAPHICS[ref](out, dur)
            files.append(out)
            continue
        if kind == "clip":
            src, in0, mode, opts = CLIPS[ref]
            overlays = []
            lab, sub, cred = CLIP_INFO.get(ref, ("", "", ""))
            if cred:
                p = os.path.join(TMP, f"{cid}_st{i}_cr.png"); credit_overlay(p, cred)
                overlays.append({"png": p, "a": 0.7, "b": min(dur - 0.5, 4.6)})
            if lab and dur > 3.0:
                p = os.path.join(TMP, f"{cid}_st{i}_an.png"); annotation_label(p, lab, sub)
                a0 = min(1.3, dur * 0.16)
                overlays.append({"png": p, "a": a0, "b": min(dur - 0.4, a0 + 4.4), "slide": 16})
            if i == 0 and DIV_YEAR.get(cid) is not None:
                p = os.path.join(TMP, f"{cid}_st0_rib.png"); ribbon_overlay(p, DIV_YEAR[cid])
                overlays.insert(0, {"png": p, "a": 0.0, "b": 2.0})
            video_shot(os.path.join(ROOT, src), in0, dur, out,
                       overlays=overlays, kb_idx=i, mode=mode, **opts)
            files.append(out)
            continue
        if kind == "card":
            ttl, instr = SHOT_DESC.get(ref, ("Footage to film", "Film the location named in the shot list."))
            p = os.path.join(TMP, f"{cid}_st{i}_ph.png")
            placeholder_card(p, "HOST ON CAMERA . TO BE FILMED", ttl, instr)
            render_card_clip(p, dur, out, zoom=True)
            files.append(out)
            continue
        if kind == "pano":
            pano_card(ref, dur, out)
            PANO_SEGS.append({"cid": cid, "off": sum(durs[:i]) - i * XFADE, "dur": dur})
            files.append(out)
            continue
        asset = seq["assets"].get(ref)
        url = asset["url"] if asset else (credits[ref]["file"] if ref in credits else None)
        if not url:
            continue
        overlays = []
        ct = credit_text(ref)
        if ct:
            p = os.path.join(TMP, f"{cid}_st{i}_cr.png"); credit_overlay(p, ct)
            overlays.append({"png": p, "a": 0.7, "b": min(dur - 0.5, 4.6)})
        for j, (lab, val, lt) in enumerate(assign.get(i, [])):
            p = os.path.join(TMP, f"{cid}_st{i}_lt{j}.png"); lower_third(p, lab, val)
            # keep the chip entirely inside the shot's solid window, never bleeding
            # into the cross-dissolve, so two callouts can never ghost together
            a = max(lt, XFADE + 0.1)
            b = min(dur - XFADE - 0.15, a + 3.6)
            if b > a + 0.6:
                overlays.append({"png": p, "a": a, "b": b, "slide": 18})
        # the curator's wall label, emerging once the still has settled
        if ref in ANNOT and dur > 3.0:
            p = os.path.join(TMP, f"{cid}_st{i}_an.png"); annotation_label(p, *ANNOT[ref])
            a0 = min(1.3, dur * 0.16)
            overlays.append({"png": p, "a": a0, "b": min(dur - 0.4, a0 + 4.4), "slide": 16})
        # the timeline spine carries across the dip: the chapter's first shot
        # re-shows the same lit ribbon from the divider, then lets it recede
        if i == 0 and cid in DIV_YEAR:
            p = os.path.join(TMP, f"{cid}_st0_rib.png"); ribbon_overlay(p, DIV_YEAR[cid])
            overlays.insert(0, {"png": p, "a": 0.0, "b": 2.0})
        # a map shot draws its specific place/route on top, animated, instead of
        # holding a dead still; it carries its own label + credit
        if ref in MAP_HILITE:
            map_highlight_clip(local(url), dur, out, MAP_HILITE[ref], credit_text(ref))
            files.append(out)
            continue
        render_shot(local(url), dur, chapter_image_grade(ref), out, kb_idx=i, overlays=overlays)
        files.append(out)
    return files, durs

if "--probe3d" in sys.argv:
    chart_bars_scene(os.path.join(TMP, "p_bars.mp4"), 6.6)
    chart_area_scene(os.path.join(TMP, "p_area.mp4"), 6.8)
    p = os.path.join(TMP, "p_an.png"); annotation_label(p, *ANNOT["worlds-fair-6"])
    pr = os.path.join(TMP, "p_rib.png"); ribbon_overlay(pr, 1893)
    render_shot(local(credits["worlds-fair-6"]["file"]), 6.0, "archival",
                os.path.join(TMP, "p_shot.mp4"), kb_idx=0,
                overlays=[{"png": pr, "a": 0.0, "b": 2.0},
                          {"png": p, "a": 1.0, "b": 5.4, "slide": 16}])
    run(["-ss", "0.6", "-i", os.path.join(TMP, "p_shot.mp4"), "-frames:v", "1", "/tmp/p_rib.jpg"])
    for nm in ["p_bars", "p_area", "p_shot"]:
        run(["-sseof", "-2", "-i", os.path.join(TMP, nm + ".mp4"), "-frames:v", "1",
             os.path.join("/tmp", nm + ".jpg")])
    print("PROBE3D done")
    sys.exit(0)

# ====================================================================
#  DEEP-DIVE MODE: render one chapter's standalone ~12-minute film from
#  data/hp-deepdive/<id>.sections.json, reusing the whole overview engine
#  (build_story_chapter, dividers, grade, stats, graphics, sources/end).
#  Each "section" of the deep dive is rendered exactly like an overview
#  history chapter. VO is read from vo-<id>__<sectionId>.mp3 (generated
#  separately by scripts/hp-vo-openai.mjs).
# ====================================================================
def deepdive_title(out, title, sub, dur=4.6):
    fnt = serif(150) if len(title) <= 22 else (serif(120) if len(title) <= 30 else serif(92))
    lines = wrap(ImageDraw.Draw(Image.new("RGB", (8, 8))), title, fnt, 1500)
    lh = int(fnt.size * 1.06)
    def fn(t):
        b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W // 2
        e = ease_out(elem(t, 0.15, 0.7)); b = put_text(b, (cx, 300), "ROOTED FORWARD . A DETAILED FILM", sans(26, "light"), RUST, int(255 * e), int((1 - e) * 16), 10, "ma")
        total = (len(lines) - 1) * lh; ty = 545 - total // 2
        for j, ln in enumerate(lines):
            e = ease_out(elem(t, 0.40 + j * 0.13, 0.85)); b = put_text(b, (cx, int(ty + j * lh)), ln, fnt, CREAM, int(255 * e), int((1 - e) * 30), 0, "mm")
        e = ease_out(elem(t, 0.55 + len(lines) * 0.13, 0.7))
        if e > 0:
            dd = ImageDraw.Draw(b); w = int(130 * e); ry = int(ty + len(lines) * lh + 30); dd.rectangle([cx - w // 2, ry, cx + w // 2, ry + 3], fill=RUST + (255,))
        if sub:
            e = ease_out(elem(t, 0.9 + len(lines) * 0.13, 0.9)); b = put_text(b, (cx, int(ty + len(lines) * lh + 96)), sub.upper(), sans(23, "light"), CREAM, int(215 * e), int((1 - e) * 12), 6, "ma")
        return b.convert("RGB")
    seq_clip(fn, dur, out)

def make_cues(vo, vodur):
    """Approximate subtitle cues by splitting the narration into sentences and
    distributing the measured VO duration by word count. Good enough to pin the
    captions and to time each shot to its anchor phrase."""
    import re as _re
    sents = [s.strip() for s in _re.split(r'(?<=[.?!])\s+', vo.strip()) if s.strip()]
    wc = [max(1, len(s.split())) for s in sents]
    tot = sum(wc)
    cues, acc = [], 0.0
    for s, w in zip(sents, wc):
        d = vodur * w / tot
        cues.append({"startSec": round(acc, 2), "endSec": round(acc + d, 2), "text": s})
        acc += d
    return cues

def render_deepdive(ddid):
    global research, STORY, STATS, DIV_YEAR, scenes, CHAPTER_MARKS, PANO_SEGS
    dd = json.load(open(os.path.join(ROOT, "data", "hp-deepdive", f"{ddid}.sections.json")))
    secs = dd["sections"]
    # merge the deep dive's stats / wall labels into the shared dicts
    for k, v in dd.get("stats", {}).items():
        STATS[k] = tuple(v)
    for k, v in dd.get("annot", {}).items():
        ANNOT[k] = tuple(v)
    # the per-chapter animated map highlights (image id -> {kind, pts, label, focus})
    MAP_HILITE.clear()
    MAP_HILITE.update(dd.get("maps", {}))
    # register each section as a "chapter" the engine already knows how to build
    for s in secs:
        fsid = f"{ddid}__{s['id']}"
        research[fsid] = {"script": {"voiceover": s["voiceover"]}, "era": s.get("era", ""), "working": s["title"]}
        STORY[fsid] = {"shots": [tuple(x) for x in s["shots"]], "callouts": [tuple(c) for c in s.get("callouts", [])]}
        # only register a timeline year when the section actually has one; a None
        # here would make build_story_chapter's `cid in DIV_YEAR` true and crash
        # ribbon_overlay(None)
        if s.get("year") is not None:
            DIV_YEAR[fsid] = s.get("year")
    # validate every image ref resolves before spending render time
    def _imgfile_ok(ref):
        fp = credits.get(ref, {}).get("file")
        if not fp:
            return False
        fs = os.path.join(ROOT, "public" + fp) if fp.startswith("/media/") else os.path.join(ROOT, fp)
        return os.path.exists(fs)
    missing = []
    for s in secs:
        for kind, ref, _ in s["shots"]:
            if kind == "img" and not _imgfile_ok(ref):
                missing.append(f"img:{ref}")
            if kind == "stat" and ref and ref not in STATS:
                missing.append(f"stat:{ref}")
            if kind == "clip" and ref not in CLIPS:
                missing.append(f"clip:{ref}")
            if kind == "graphic" and ref not in GRAPHICS:
                missing.append(f"graphic:{ref}")
    if missing:
        print("DEEPDIVE MISSING REFS:", sorted(set(missing)))
        sys.exit(2)

    CHAPTER_MARKS = []
    PANO_SEGS = []
    tcard = os.path.join(TMP, f"dd_{ddid}_title.mp4")
    deepdive_title(tcard, dd["title"], dd.get("subtitle", ""), 4.6)
    scenes = [tcard]
    for si, s in enumerate(secs, start=1):
        fsid = f"{ddid}__{s['id']}"
        dvc = os.path.join(TMP, f"dd_{fsid}_div.mp4")
        animated_divider(dvc, si, s.get("era", ""), s["title"], 4.0, s.get("year"))
        CHAPTER_MARKS.append({"id": s["id"], "title": s["title"], "era": s.get("era", ""), "year": s.get("year"), "sceneIdx": len(scenes)})
        scenes.append(dvc)
        vo_path = os.path.join(VO_DIR, f"vo-{fsid}.mp3")
        vodur = probe(vo_path)
        # prefer force-aligned cues (captions + shots land on the actual voice);
        # fall back to proportional timing if alignment hasn't been run
        cue_path = os.path.join(ROOT, "data/hp-deepdive/cues", f"{fsid}.json")
        if os.path.exists(cue_path):
            cues = json.load(open(cue_path))
        else:
            cues = make_cues(s["voiceover"], vodur)
        shot_files, durs = build_story_chapter(fsid, {"assets": {}}, vodur, cues)
        silent = os.path.join(TMP, f"dd_{fsid}_silent.mp4")
        xfade_chain(shot_files, durs, silent)
        chdur = probe(silent)
        ass = os.path.join(TMP, f"dd_{fsid}.ass"); write_ass(cues, ass)
        chap = os.path.join(TMP, f"dd_{fsid}_chap.mp4")
        finish_chapter(silent, max(chdur, vodur + 0.5), vo_path, ass, chap)
        scenes.append(chap)
        print(f"  section {s['id']}: {len(shot_files)} shots, {chdur:.1f}s", flush=True)
    scc = os.path.join(TMP, f"dd_{ddid}_src.mp4"); animated_sources(scc, 7.0); scenes.append(scc)
    ecc = os.path.join(TMP, f"dd_{ddid}_end.mp4"); animated_end(ecc, 7.0); scenes.append(ecc)

    listf = os.path.join(TMP, f"dd_{ddid}_scenes.txt")
    with open(listf, "w") as f:
        for s in scenes:
            f.write(f"file '{s}'\n")
    out = os.path.join(OUTDIR, f"deepdive-{ddid}.mp4")
    run(["-f", "concat", "-safe", "0", "-i", listf, "-c:v", "libx264", "-preset", "slow",
         "-crf", "18", "-pix_fmt", "yuv420p", "-x264-params", "ref=5:bframes=4",
         "-c:a", "aac", "-ar", "48000", "-ac", "2", "-b:a", "192k", "-movflags", "+faststart", out])
    print("WROTE", out, f"{probe(out):.1f}s")
    run(["-ss", "2.4", "-i", out, "-frames:v", "1", "-q:v", "3", os.path.join(OUTDIR, f"deepdive-{ddid}-poster.jpg")])
    cum, starts = 0.0, []
    for s in scenes:
        starts.append(cum); cum += probe(s)
    chapters_out = [{"id": "opening", "title": dd["title"], "era": "Begin", "year": None, "startSec": 0.0}]
    for m in CHAPTER_MARKS:
        chapters_out.append({"id": m["id"], "title": m["title"], "era": m["era"], "year": m["year"], "startSec": round(starts[m["sceneIdx"]], 2)})
    mark_scene = {m["id"]: m["sceneIdx"] for m in CHAPTER_MARKS}
    panos_out = []
    for ps in PANO_SEGS:
        # ps cid is the full section id "<dd>__<sid>"; map back to the section id
        sid = ps["cid"].split("__", 1)[-1]
        if sid not in mark_scene:
            continue
        base = starts[mark_scene[sid] + 1]; s0 = base + ps["off"]
        panos_out.append({"cid": sid, "startSec": round(s0, 2), "endSec": round(s0 + ps["dur"], 2)})
    json.dump({"video": f"/media/hyde-park/video/deepdive-{ddid}.mp4",
               "poster": f"/media/hyde-park/video/deepdive-{ddid}-poster.jpg",
               "duration": round(cum, 2), "chapters": chapters_out, "panos": panos_out},
              open(os.path.join(OUTDIR, f"deepdive-{ddid}.chapters.json"), "w"), indent=2)
    print("WROTE", f"deepdive-{ddid}.chapters.json", len(chapters_out), "sections, total", round(cum, 1), "s")

if "--deepdive" in sys.argv:
    render_deepdive(sys.argv[sys.argv.index("--deepdive") + 1])
    sys.exit(0)

order = ["intro","land","formation","university","worlds-fair","color-line","redlining","urban-renewal","present"]
stops = {s["id"]: s for s in tour["stops"]}
CHAPTER_MARKS = []  # for the website's clickable timeline
PANO_SEGS = []      # absolute time windows of the 360 beats, for the web player

_chnum = 0
for ci, cid in enumerate(order, start=1):
    stop = stops[cid]
    rc = research.get(cid, {})
    era = rc.get("era", stop.get("kicker",""))
    title = rc.get("working", stop["title"])
    # the intro is unnumbered; the real chapters count 01..08 from "The Ground Before"
    if cid != "intro":
        _chnum += 1
    # animated divider (a short one for the intro so narration starts sooner)
    dvc = os.path.join(TMP, f"scene_div_{cid}.mp4")
    animated_divider(dvc, _chnum if cid != "intro" else 0, era, title,
                     2.4 if cid == "intro" else 4.2, DIV_YEAR.get(cid))
    CHAPTER_MARKS.append({"id": cid, "title": title, "era": era, "year": DIV_YEAR.get(cid), "sceneIdx": len(scenes)})
    scenes.append(dvc)

    seq = stop["sequence"]
    vodur = durations.get(f"vo-{cid}", probe(os.path.join(VO_DIR, f"vo-{cid}.mp3")))
    cues = seq.get("subtitles", [])

    if cid in STORY:
        # history chapters: every shot synced to the narration
        shot_files, durs = build_story_chapter(cid, seq, vodur, cues)
    else:
        # framing chapters: host / 360 / present cards, plus the intro montage
        segs = list(seq["segments"])
        if cid == "intro":
            montage = []
            for j, im in enumerate(INTRO_MONTAGE):
                if im not in credits:
                    continue
                sid = f"intro-mg-{j}"
                seq["assets"][sid] = {"url": credits[im]["file"], "kind": "image", "is360": False, "poster": None}
                montage.append({"clipId": sid, "inSec": 0, "outSec": 3.2, "mode": "2d"})
            segs = [segs[0]] + montage + segs[1:]
        durs = [max(0.6, s["outSec"] - s["inSec"]) for s in segs]
        n = len(segs)
        need = vodur + 0.8 + (n - 1) * XFADE
        ssum = sum(durs)
        if ssum > 0:
            durs = [d * need / ssum for d in durs]
        shot_files = []
        for si, seg in enumerate(segs):
            clipid = seg["clipId"]; dur = durs[si]
            out = os.path.join(TMP, f"{cid}_s{si}.mp4")
            asset = seq["assets"][clipid]
            if not asset.get("is360") and not clipid.startswith(("host-", "present-")):
                overlays = []
                ct = credit_text(clipid)
                if ct:
                    p = os.path.join(TMP, f"{cid}_s{si}_cr.png"); credit_overlay(p, ct)
                    overlays.append({"png": p, "a": 0.7, "b": min(dur - 0.5, 4.6)})
                render_shot(local(asset["url"]), dur, chapter_image_grade(clipid), out, kb_idx=si, overlays=overlays)
            elif asset.get("is360"):
                # an auto-panning 360 preview, draggable on the website
                pano_card(clipid, dur, out)
                # remember where this 360 beat sits in the chapter, so the web
                # player can show "View in 3D" only while a 360 is on screen.
                # offset of shot si in an xfade chain = sum(durs[:si]) - si*XFADE
                off = sum(durs[:si]) - si * XFADE
                PANO_SEGS.append({"cid": cid, "off": off, "dur": dur})
            else:
                eb = "HOST ON CAMERA . TO BE FILMED" if clipid.startswith("host-") else "PRESENT DAY FOOTAGE . TO BE FILMED"
                # each placeholder names the exact shot to film at this point
                t, instr = SHOT_DESC.get(clipid,
                    PANO_INSTR.get(clipid, ("Footage to film", "Film the location named in the shot list.")))
                p = os.path.join(TMP, f"{cid}_s{si}_ph.png"); placeholder_card(p, eb, t, instr)
                render_card_clip(p, dur, out, zoom=True)
            shot_files.append(out)

    silent = os.path.join(TMP, f"{cid}_silent.mp4")
    xfade_chain(shot_files, durs, silent)
    chdur = probe(silent)
    # subtitles, pinned to the bottom via ASS
    cues = seq.get("subtitles", [])
    ass = os.path.join(TMP, f"{cid}.ass")
    write_ass(cues, ass)
    chap = os.path.join(TMP, f"scene_chap_{cid}.mp4")
    # never let the chapter be shorter than its narration
    target = max(chdur, vodur + 0.5)
    finish_chapter(silent, target, os.path.join(VO_DIR, f"vo-{cid}.mp3"), ass, chap)
    scenes.append(chap)
    print(f"  chapter {cid}: {len(shot_files)} shots, {chdur:.1f}s", flush=True)

# animated sources + end card
scc = os.path.join(TMP, "scene_sources.mp4"); animated_sources(scc, 7.0)
scenes.append(scc)
ecc = os.path.join(TMP, "scene_end.mp4"); animated_end(ecc, 7.5)
scenes.append(ecc)

# concat all scenes
listf = os.path.join(TMP, "scenes.txt")
with open(listf, "w") as f:
    for s in scenes:
        f.write(f"file '{s}'\n")
out = os.path.join(OUTDIR, "hyde-park-museum.mp4")
run(["-f","concat","-safe","0","-i",listf,"-c:v","libx264","-preset","slow",
     "-crf","18","-pix_fmt","yuv420p","-x264-params","ref=5:bframes=4",
     "-c:a","aac","-ar","48000","-ac","2","-b:a","192k",
     "-movflags","+faststart", out])
print("WROTE", out, f"{probe(out):.1f}s")

# a poster frame for the web player (a held title beat)
run(["-ss","2.6","-i",out,"-frames:v","1","-q:v","3",
     os.path.join(OUTDIR,"poster.jpg")])

# chapter timestamps for the website's clickable timeline
cum, starts = 0.0, []
for s in scenes:
    starts.append(cum); cum += probe(s)
chapters_out = [{"id":"opening","title":"Hyde Park, Built and Rebuilt","era":"Begin","year":None,"startSec":0.0}]
for m in CHAPTER_MARKS:
    chapters_out.append({"id":m["id"],"title":m["title"],"era":m["era"],
                         "year":m["year"],"startSec":round(starts[m["sceneIdx"]],2)})
# 360 windows: the chapter clip sits one scene after its divider mark
mark_scene = {m["id"]: m["sceneIdx"] for m in CHAPTER_MARKS}
panos_out = []
for ps in PANO_SEGS:
    base = starts[mark_scene[ps["cid"]] + 1]
    s0 = base + ps["off"]
    panos_out.append({"cid": ps["cid"], "startSec": round(s0, 2),
                      "endSec": round(s0 + ps["dur"], 2)})
json.dump({"video":"/media/hyde-park/video/hyde-park-museum.mp4",
           "poster":"/media/hyde-park/video/poster.jpg",
           "duration":round(cum,2),"chapters":chapters_out,"panos":panos_out},
          open(os.path.join(OUTDIR,"chapters.json"),"w"), indent=2)
print("WROTE chapters.json", len(chapters_out), "marks,", len(panos_out), "360 windows, total", round(cum,1),"s")
