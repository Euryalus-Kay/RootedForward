#!/usr/bin/env python3
# Build a styled HTML of the production plan (same content as the .docx) for a
# clean PDF via headless Chrome.
import json, os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
research = json.load(open(os.path.join(ROOT, "data/hp-research.json")))
credits = json.load(open(os.path.join(ROOT, "public/media/hyde-park/credits.json")))
ORDER = ["intro", "formation", "university", "worlds-fair", "color-line", "urban-renewal", "present"]
by = {c["chapterId"]: c for c in research["chapters"]}
e = html.escape
def clean_credit(s):
    s = html.unescape(s or "")
    return re.sub(r"\s+", " ", s).strip(" .,;")

PANOS = [
    ("pano-hyde-park", "57th Street Beach, facing the skyline across the lakefront"),
    ("pano-main-quad", "The center of the University of Chicago Main Quadrangles"),
    ("pano-jackson-park", "Jackson Park, by the Museum of Science and Industry and the Wooded Island"),
    ("pano-55th-street", "55th Street, or the University Park townhouses, the rebuilt ground"),
    ("pano-obama-center", "The Obama Presidential Center site in Jackson Park"),
]
BROLL = [("present-intro", "Chapter 01"), ("present-formation", "Chapter 02"), ("present-present", "Chapter 07")]

CSS = """
@page { size: letter; margin: 22mm 20mm; }
* { box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; color:#222019; font-size:11pt; line-height:1.45; margin:0; }
h1 { font-size:30pt; color:#1E3A2B; margin:0 0 2pt; }
.sub { font-style:italic; font-size:15pt; color:#B04A2E; margin:0 0 16pt; }
h2 { font-size:18pt; color:#1E3A2B; margin:18pt 0 4pt; }
h3 { font-family:'Gill Sans','Helvetica Neue',sans-serif; font-size:12pt; color:#B04A2E; margin:14pt 0 4pt; }
.eyebrow { font-family:'Gill Sans','Helvetica Neue',sans-serif; font-size:9pt; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#B04A2E; margin:12pt 0 2pt; }
.eyebrow.green { color:#1E3A2B; }
.lede { color:#6B665E; }
blockquote { border-left:3px solid #B04A2E; margin:4pt 0 10pt; padding:2pt 0 2pt 14px; font-style:italic; font-size:11.5pt; color:#33302B; }
ul { margin:2pt 0 8pt; padding-left:18px; }
li { margin:1pt 0; font-size:10.5pt; }
li .meta { color:#6B665E; }
.rule { border-bottom:1px solid #D8D1C5; margin:10pt 0; }
.built b { color:#1E3A2B; }
.pb { page-break-before: always; }
.chapter { page-break-inside: avoid; }
.title-block { padding-top: 28mm; }
"""

P = []
def w(s): P.append(s)

w(f"<!doctype html><meta charset=utf-8><style>{CSS}</style>")
# title
w("<div class='title-block'>")
w("<h1>Hyde Park, Built and Rebuilt</h1>")
w("<div class='sub'>Production plan, script, and shot list</div>")
w("<div class='eyebrow'>A history of the ground beneath a Chicago neighborhood &nbsp;.&nbsp; Rooted Forward</div>")
w("<p class='lede'>An immersive documentary for rooted-forward.org. Seven chapters carry Hyde Park from Paul "
  "Cornell's 1853 lakefront bet through the University of Chicago, the 1893 World's Fair, the racial covenants, "
  "university-led urban renewal, and the present-day Obama Center. The cut already plays end to end with labeled "
  "placeholders, so you can watch it before filming anything.</p>")
w("</div>")

w("<h2>How this works</h2>")
w("<p>The archival photographs in the cut are real, public-domain or Creative Commons images, and they stay. The "
  "narration you hear now is a scratch machine voice. You re-record every voiceover below in your own voice, then "
  "film the host pieces, the 360 look-arounds, and the present-day b-roll and swap them in for the placeholders. "
  "Upload a clip in /admin/studio or /admin/immersive and point the matching id at it; the cut updates in place.</p>")

w("<h3>Everything you film, in one place</h3>")
w("<div class='eyebrow green'>Your two pieces to camera</div><ul>")
w("<li><b>host-intro</b> <span class='meta'>&nbsp; Chapter 01 opening, on a Hyde Park sidewalk</span></li>")
w("<li><b>host-close</b> <span class='meta'>&nbsp; Chapter 07 close, in Jackson Park by the Obama Center</span></li></ul>")
w("<div class='eyebrow green'>360 captures with your 3D camera</div><ul>")
for pid, desc in PANOS: w(f"<li><b>{e(pid)}</b> <span class='meta'>&nbsp; {e(desc)}</span></li>")
w("</ul><div class='eyebrow green'>Present-day b-roll</div><ul>")
for bid, ch in BROLL: w(f"<li><b>{e(bid)}</b> <span class='meta'>&nbsp; {e(ch)}</span></li>")
w("</ul>")

w("<div class='pb'></div><h2>The chapters</h2>")
num = 0
for cid in ORDER:
    c = by[cid]; num += 1
    sc = c.get("script", {})
    w("<div class='chapter'>")
    w("<div class='rule'></div>")
    w(f"<div class='eyebrow'>Chapter {num:02d} &nbsp;.&nbsp; {e(c.get('era',''))}</div>")
    w(f"<h2 style='margin-top:2pt'>{e(c.get('working') or cid)}</h2>")
    host = (sc.get("hostScript") or "").strip()
    if host:
        w("<div class='eyebrow green'>Say this on camera</div>")
        w(f"<blockquote>{e(host)}</blockquote>")
    vo = (sc.get("voiceover") or "").strip()
    if vo:
        w("<div class='eyebrow green'>Record this voiceover</div>")
        w(f"<blockquote>{e(vo)}</blockquote>")
    shot = (sc.get("shotNotes") or "").strip()
    if shot:
        w("<div class='eyebrow green'>Shots and direction</div>")
        w(f"<p>{e(shot)}</p>")
    ims = sorted((k, v) for k, v in credits.items() if k.startswith(cid + "-"))
    if ims:
        w("<div class='eyebrow green'>Archival stills already in the cut</div><ul>")
        for k, v in ims:
            name = clean_credit(re.sub(r"\.(jpg|png|tif|JPG)$", "", v.get("commonsTitle", k).replace("File:", "")))
            who = clean_credit(v.get("artist", ""))
            meta = clean_credit(v.get("license", "")) + (f"  .  {who}" if who and who.lower() != "unknown" else "")
            w(f"<li>{e(name)} <span class='meta'>&nbsp; {e(meta)}</span></li>")
        w("</ul>")
    w("</div>")

w("<div class='pb'></div><h2>What the film already does</h2>")
w("<p>This is not a storyboard on paper. The cut is rendered and runs about six and a half minutes. Built into it:</p>")
built = [
    ("A warm-duotone archival look", "Every historical photo is graded to a consistent sepia and shown complete over a blurred copy of itself, so faces and buildings are never cropped."),
    ("An animated locator map and master timeline", "A stylized South Side map shows Washington Park and Jackson Park framing Hyde Park, and a 1853-to-today timeline runs as a hero sequence and as a lit ribbon that carries across every chapter."),
    ("Two verified data charts", "The renewal return-rate gap as paired bars, 46 percent of white families stayed versus 17 percent of Black families, and the Black population growth from about 40,000 in 1910 to about 278,000 by 1940 as an animated census curve."),
    ("Museum wall labels", "Fifteen labels emerge on the beat the narration names a subject, the Ferris Wheel, the Court of Honor, Rockefeller, the Hansberry House, each pointing at a confirmed detail."),
    ("Dimensional stat moments", "The hero numbers, 300 acres, 594 students, about 4,000 families, are extruded into depth and count up, then hold."),
    ("Disciplined motion", "Each shot makes one slow move and settles, sized to read on a large wall."),
]
w("<ul class='built'>")
for h, t in built: w(f"<li><b>{e(h)}.</b> {e(t)}</li>")
w("</ul>")
w("<h3>Ground rules the film keeps</h3><ul>")
for t in ["Real, verified facts only. No invented numbers, quotes, dates, or sources.",
          "Every image is genuinely public domain or Creative Commons, credited on screen and in the sources.",
          "No em-dashes and no colons inside sentences in any on-screen text, the most reliable AI tells."]:
    w(f"<li>{e(t)}</li>")
w("</ul>")

w("<div class='pb'></div><h2>Verified sources</h2>")
w("<p class='lede'>Pulled from the fact-check pass. Each chapter's claims were checked against these.</p>")
seen = set()
for cid in ORDER:
    srcs = (by[cid].get("verify", {}) or {}).get("sources") or (by[cid].get("research", {}) or {}).get("sources") or []
    srcs = [s for s in srcs if s and (isinstance(s, str)) and s not in seen]
    if not srcs: continue
    for s in srcs: seen.add(s)
    w(f"<div class='eyebrow green'>{e(by[cid].get('working', cid))}</div><ul>")
    for s in srcs: w(f"<li>{e(s)}</li>")
    w("</ul>")

out = "/tmp/hp-plan.html"
open(out, "w").write("".join(P))
print("WROTE", out, len("".join(P)), "bytes,", num, "chapters,", len(seen), "sources")
