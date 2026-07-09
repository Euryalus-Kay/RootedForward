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

import json, os, re, subprocess, sys, shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

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
        "Host segments and 360 look-arounds are placeholders, to be filmed.",
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
    draw_tracked(d, (cx, 400), eyebrow, sans(25, "semi"), RUST, tracking=12, anchor="ma")
    for i, ln in enumerate(wrap(d, title, serif(78, "reg"), 1300)):
        d.text((cx, 480 + i*86), ln, font=serif(78, "reg"), fill=CREAM, anchor="mm")
    for i, ln in enumerate(wrap(d, instruction, sans(28, "light"), 1180)):
        d.text((cx, 660 + i*42), ln, font=sans(28, "light"), fill=(205,200,190), anchor="mm")
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
    img = Image.new("RGBA", (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    draw_tracked(d, (W-120, 1012), text.upper(), sans(19, "light"),
                 (CREAM[0],CREAM[1],CREAM[2],205), tracking=4, anchor="ra",
                 shadow=(1,1,(0,0,0,150)))
    return _drop(img, path)

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

GRADE = {
 # warm duotone for the archival stills
 "archival": ("hue=s=0,curves=preset=medium_contrast,eq=contrast=1.05:brightness=0.012,"
              "colorbalance=rs=0.07:gs=0.03:bs=-0.06:rm=0.05:gm=0.0:bm=-0.05:rh=0.05:gh=0.02:bh=-0.04,"
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

def render_shot(src, dur, grade, out, kb_idx=0, overlays=None):
    """One shot: photo + grade + slow Ken Burns + composited overlays."""
    frames = max(2, int(round(dur*FPS)))
    # slow Ken Burns, alternating gentle direction
    dirs = [
        ("min(zoom+0.00035,1.10)", "iw/2-(iw/zoom/2)+(on/{f})*60", "ih/2-(ih/zoom/2)"),
        ("if(eq(on,1),1.10,max(zoom-0.00035,1.0))", "iw/2-(iw/zoom/2)-(on/{f})*60", "ih/2-(ih/zoom/2)"),
        ("min(zoom+0.0003,1.09)", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)+(on/{f})*50"),
        ("min(zoom+0.0003,1.09)", "iw/2-(iw/zoom/2)-(on/{f})*50", "ih/2-(ih/zoom/2)"),
    ]
    z, xex, yex = dirs[kb_idx % len(dirs)]
    xex = xex.format(f=frames); yex = yex.format(f=frames)
    base = (f"[0:v]scale={int(W*1.32)}:{int(H*1.32)}:force_original_aspect_ratio=increase,"
            f"crop={int(W*1.32)}:{int(H*1.32)},"
            f"zoompan=z='{z}':d={frames}:x='{xex}':y='{yex}':s={W}x{H}:fps={FPS},"
            f"{GRADE[grade]},format=yuv420p[base]")
    inputs = ["-i", src]
    parts = [base]
    last = "[base]"
    for i, ov in enumerate(overlays or []):
        png, a, b = ov["png"], ov["a"], ov["b"]
        inputs += ["-loop","1","-t",f"{dur}","-i", png]
        idx = i + 1
        parts.append(f"[{idx}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.5:alpha=1,"
                     f"fade=t=out:st={max(a,b-0.5):.2f}:d=0.5:alpha=1[o{idx}]")
        parts.append(f"{last}[o{idx}]overlay=enable='between(t,{a:.2f},{b:.2f})'[c{idx}]")
        last = f"[c{idx}]"
    fc = ";".join(parts)
    run([*inputs, "-filter_complex", fc, "-map", last, "-t", f"{dur}", "-r", str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p", out])

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
    "Style: Default,Gill Sans,44,&H00E8F0F5,&H000000FF,&HA01A1512,&H64000000,"
    "0,0,0,0,100,100,0,0,1,2,2,2,260,260,70,1\n\n"
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
    vf = (f"[0:v]fade=t=in:st=0:d={EDGE},fade=t=out:st={dur-EDGE:.2f}:d={EDGE},"
          f"subtitles='{ass}'[v];[1:a]apad[a]")
    run(["-i", silent, "-i", vo_path, "-filter_complex", vf,
         "-map","[v]","-map","[a]","-t", f"{dur:.2f}", "-r", str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
         "-c:a","aac","-ar","48000","-ac","2", out])

# Curated, concise data callouts per chapter. Every value traces to a
# verified figure. Shown as elegant lower-thirds on the archival shots.
CALLOUTS = {
 "formation": [("Land Cornell bought, 1853", "300 acres"),
               ("Deeded for the rail station", "60 acres")],
 "worlds-fair": [("Visitors over six months", "27 million"),
                 ("Reopened as a museum", "1933")],
 "university": [("Rockefeller's first pledge", "$600,000"),
                ("Students on opening day", "594")],
 "color-line": [("Black Chicagoans by 1940", "278,000"),
                ("Covenants struck down", "1948")],
 "urban-renewal": [("Acres in the renewal plan", "856 acres"),
                   ("Buildings marked to fall", "638"),
                   ("Families displaced", "about 4,000")],
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

def chapter_image_grade(clipid):
    if clipid.startswith("intro-mg"): return "archival"
    c = credits.get(clipid)
    if not c: return "archival"
    lic = (c.get("license") or "")
    yr = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", c.get("date","") or "")
    period = ("public domain" in lic.lower()) or (yr and int(yr.group(1)) < 1945)
    return "archival" if period else "modern"

# Cold-open montage for the intro: a fast tease of the eras to come,
# pulled from the archival stills already in the film.
INTRO_MONTAGE = ["formation-4", "worlds-fair-1", "university-1", "urban-renewal-1", "worlds-fair-2"]

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

def credit_text(clipid):
    c = credits.get(clipid)
    if not c: return None
    who = re.sub(r"\(?\d{3,4}[-–]\d{0,4}\)?","", c.get("artist","")).strip(" ,")
    who = re.sub(r",?\s*(photographer|publisher).*$","", who, flags=re.I).strip(" ,")
    who = re.sub(r"\s+from\s+.*$","", who, flags=re.I).strip(" ,")  # drop "from <place>"
    who = who.split(",")[0].strip()  # first author / handle only
    yr = re.search(r"\b(1[5-9]\d\d|20\d\d)\b", c.get("date","") or "")
    return (who[:34] + (", "+yr.group(1) if yr else "")) if who else None

# ---- build scenes ----
scenes = []
card = os.path.join(TMP, "title.png"); title_card(card)
ttl = os.path.join(TMP, "scene_title.mp4"); render_card_clip(card, 9.0, ttl)
scenes.append(ttl)

CARD_CLIPS = {"host-intro":("HOST ON CAMERA","Open with you to camera","Film your intro piece. The script is in the shot list."),
              "host-close":("HOST ON CAMERA","Close with you to camera","Film your closing piece to camera."),
              }

order = ["intro","formation","worlds-fair","university","color-line","urban-renewal","present"]
stops = {s["id"]: s for s in tour["stops"]}

for ci, cid in enumerate(order, start=1):
    stop = stops[cid]
    rc = research.get(cid, {})
    era = rc.get("era", stop.get("kicker",""))
    title = rc.get("working", stop["title"])
    # divider
    dv = os.path.join(TMP, f"div_{cid}.png"); divider_card(dv, ci, era, title)
    dvc = os.path.join(TMP, f"scene_div_{cid}.mp4"); render_card_clip(dv, 4.0, dvc, zoom=True)
    scenes.append(dvc)

    seq = stop["sequence"]
    segs = list(seq["segments"])
    # Cold-open montage: tease the eras under the intro narration, right
    # after the host card, before the look-around and present-day cards.
    if cid == "intro":
        montage = []
        for j, im in enumerate(INTRO_MONTAGE):
            if im not in credits:
                continue
            sid = f"intro-mg-{j}"
            seq["assets"][sid] = {"url": credits[im]["file"], "kind": "image", "is360": False, "poster": None}
            montage.append({"clipId": sid, "inSec": 0, "outSec": 3.2, "mode": "2d"})
        segs = [segs[0]] + montage + segs[1:]
    vodur = durations.get(f"vo-{cid}", probe(os.path.join(VO_DIR, f"vo-{cid}.mp3")))
    # base durations from the edit
    durs = [max(0.6, s["outSec"]-s["inSec"]) for s in segs]
    n = len(segs)
    # size the chapter so it runs just past the VO once the xfades overlap,
    # scaling every shot evenly (shrinks the intro to fit its montage)
    need = vodur + 0.8 + (n - 1) * XFADE
    s = sum(durs)
    if s > 0:
        durs = [d * need / s for d in durs]

    figs = CALLOUTS.get(cid, [])
    fig_i = 0
    shot_files = []
    for si, seg in enumerate(segs):
        clipid = seg["clipId"]
        asset = seq["assets"][clipid]
        dur = durs[si]
        out = os.path.join(TMP, f"{cid}_s{si}.mp4")
        overlays = []
        # credit overlay for real photos
        if not asset.get("is360") and not clipid.startswith(("host-","present-")):
            ct = credit_text(clipid)
            if ct:
                p = os.path.join(TMP, f"{cid}_s{si}_cr.png"); credit_overlay(p, ct)
                overlays.append({"png":p,"a":0.7,"b":min(dur-0.5, 4.6)})
            # one data lower-third per archival shot, in order
            if 1 <= si and fig_i < min(3, len(figs)) and dur > 4:
                lab, val = figs[fig_i]; fig_i += 1
                p = os.path.join(TMP, f"{cid}_s{si}_lt.png"); lower_third(p, lab, val)
                overlays.append({"png":p,"a":min(2.0,dur*0.25),"b":dur-0.4})
            grade = chapter_image_grade(clipid)
            render_shot(local(asset["url"]), dur, grade, out, kb_idx=si, overlays=overlays)
        else:
            # placeholder slate -> elegant designed card
            if asset.get("is360"):
                eb = "360 LOOK-AROUND . TO BE FILMED"
                t, instr = PANO_INSTR.get(clipid, ("A 360 capture", "Film a 360 here."))
            elif clipid.startswith("host-"):
                eb = "HOST ON CAMERA . TO BE FILMED"
                t, instr = CARD_CLIPS[clipid][1], CARD_CLIPS[clipid][2]
            else:
                eb, t, instr = "PRESENT DAY . TO BE FILMED", "Present-day footage", "Film the location named in the shot list."
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
    finish_chapter(silent, chdur, os.path.join(VO_DIR, f"vo-{cid}.mp3"), ass, chap)
    scenes.append(chap)
    print(f"  chapter {cid}: {len(segs)} shots, {chdur:.1f}s", flush=True)

# sources + end card
sc = os.path.join(TMP, "sources.png"); sources_card(sc)
scc = os.path.join(TMP, "scene_sources.mp4"); render_card_clip(sc, 7.0, scc)
scenes.append(scc)
ec = os.path.join(TMP, "end.png"); end_card(ec)
ecc = os.path.join(TMP, "scene_end.mp4"); render_card_clip(ec, 8.0, ecc)
scenes.append(ecc)

# concat all scenes
listf = os.path.join(TMP, "scenes.txt")
with open(listf, "w") as f:
    for s in scenes:
        f.write(f"file '{s}'\n")
out = os.path.join(OUTDIR, "hyde-park-museum.mp4")
run(["-f","concat","-safe","0","-i",listf,"-c:v","libx264","-preset","medium",
     "-crf","18","-pix_fmt","yuv420p","-c:a","aac","-ar","48000","-ac","2",
     "-movflags","+faststart", out])
print("WROTE", out, f"{probe(out):.1f}s")
