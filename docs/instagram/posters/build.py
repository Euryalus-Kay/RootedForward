#!/usr/bin/env python3
"""Builds the Instagram carousel posters for the tools of segregation.

Two slides per tool. Slide one is a cover, a full bleed archival
photograph over a cream panel carrying the name and what the post
covers. Slide two is the history, a single text column with small
framed photographs set around it.

Everything is drawn from the repository's own artwork and every
photograph keeps its printed credit, the same rule the app follows.
Renders through headless Chrome so the real brand faces are used.
"""
import base64, json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
MEDIA = ROOT / "public/media/hyde-park-walk"
SITE = ROOT / "public/media/site"
FONTS = ROOT / "ios/Resources/Fonts"
OUT = pathlib.Path(__file__).parent / "out"
BUILD = pathlib.Path(__file__).parent / "html"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

W, H = 1080, 1350

def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()

def img(name):
    p = MEDIA / name
    if not p.exists():
        p = SITE / name
    if not p.exists():
        sys.exit(f"missing artwork: {name}")
    return "data:image/jpeg;base64," + b64(p)

LOGO = "data:image/png;base64," + b64(ROOT / "ios/Assets.xcassets/LogoMark.imageset/LogoMark.png")
SERIF = b64(FONTS / "SourceSerif4-VF.ttf")
SANS = b64(FONTS / "DMSans-VF.ttf")

CREDITS = json.loads((pathlib.Path(__file__).parent / "credits.json").read_text())
SHORT = json.loads((pathlib.Path(__file__).parent / "short-credits.json").read_text())

def sources(names):
    """One credit line for a slide, deduped, since the pictures no
    longer carry a caption apiece."""
    out = []
    for n in names:
        if n not in SHORT:
            sys.exit(f"no short credit on file for {n}")
        if SHORT[n] not in out:
            out.append(SHORT[n])
    return "Photographs. " + " ".join(out)

def credit(name):
    if name not in CREDITS:
        sys.exit(f"no credit on file for {name}")
    return CREDITS[name]

CSS = """
@font-face { font-family:"RFSerif"; src:url(data:font/ttf;base64,%(serif)s) format("truetype"); font-weight:200 900; }
@font-face { font-family:"RFSans";  src:url(data:font/ttf;base64,%(sans)s)  format("truetype"); font-weight:100 1000; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1350px; overflow:hidden; }
body { background:#F5F0E8; position:relative; display:flex; flex-direction:column;
       font-family:"RFSans", system-ui, sans-serif; color:#1A1A1A; }
.banner { flex:0 0 118px; background:#F5F0E8; display:flex; align-items:center;
          gap:18px; padding:0 60px; }
.banner img { width:60px; height:60px; display:block; }
.banner .who { font-family:"RFSerif", Georgia, serif; font-weight:600; font-size:34px;
               color:#1B3A2D; letter-spacing:-.01em; }
h1 { font-family:"RFSerif", Georgia, serif; font-weight:600; color:#1B3A2D;
     letter-spacing:-.015em; }
.cred { font-size:17px; line-height:1.4; color:#6E6A5E; }
"""

RULE = ('<svg width="132" height="13" viewBox="0 0 132 13">'
        '<g stroke="#C45D3E" stroke-width="1.6" fill="none">'
        '<line x1="1" y1="6.5" x2="131" y2="6.5"/>'
        '<line x1="1" y1="1" x2="1" y2="12"/><line x1="131" y1="1" x2="131" y2="12"/>'
        '<line x1="33.5" y1="3.5" x2="33.5" y2="9.5"/><line x1="66" y1="3.5" x2="66" y2="9.5"/>'
        '<line x1="98.5" y1="3.5" x2="98.5" y2="9.5"/></g></svg>')

COVER = """<!doctype html><html><head><meta charset="utf-8"><style>%(css)s
.photo { flex:0 0 auto; height:700px; position:relative; overflow:hidden; }
.photo img { width:100%%; height:100%%; object-fit:cover; object-position:%(pos)s;
             display:block; transform:scale(%(zoom)s); transform-origin:center; }
.panel { flex:1 1 auto; min-height:0; display:flex; flex-direction:column;
         padding:52px 60px 46px; }
h1 { font-size:%(size)spx; line-height:1.03; }
ul { list-style:none; margin-top:40px; }
li { font-size:28px; font-weight:500; color:rgba(26,26,26,.8); margin-bottom:20px; }
.foot { margin-top:auto; padding-top:30px; display:flex; justify-content:space-between;
        align-items:flex-end; gap:40px; }
.foot .cred { max-width:760px; }
.foot .folio { font-family:"RFSerif",serif; font-size:22px; color:#6E6A5E; }
</style></head><body>
<div class="banner"><img src="%(logo)s"><div class="who">Rooted Forward</div></div>
<div class="photo"><img src="%(photo)s"></div>
<div class="panel">
  <h1>%(title)s</h1>
  <ul>%(items)s</ul>
  <div class="foot"><div class="cred">%(credit)s</div><div class="folio">%(folio)s</div></div>
</div>
</body></html>"""

STORY = """<!doctype html><html><head><meta charset="utf-8"><style>%(css)s
.page { flex:1 1 auto; min-height:0; display:flex; flex-direction:column; padding:22px 60px 46px; }
.toolname { font-family:"RFSerif",serif; font-weight:600; font-size:27px; color:#C45D3E; margin-bottom:16px; }
.top { display:flex; gap:40px; flex:1 1 auto; min-height:0; }
.col { width:600px; display:flex; flex-direction:column; }
h1 { font-size:52px; line-height:1.1; }
.body { margin-top:32px; }
.body p { font-size:26px; line-height:1.6; color:rgba(26,26,26,.86); margin-bottom:18px; }
.pull { margin-top:auto; }
.pull .n { font-family:"RFSerif",serif; font-weight:600; font-size:80px; color:#C45D3E; line-height:1; }
.pull .l { font-size:23px; line-height:1.42; color:rgba(26,26,26,.72); margin-top:10px; }
.rail { width:320px; flex:0 0 320px; }
.rail img { width:100%%; height:246px; object-fit:cover; display:block; margin-bottom:24px; }
.rail img:last-child { margin-bottom:0; }
.bottom { display:flex; justify-content:flex-end; align-items:flex-end; margin-top:28px; }
.foot { text-align:right; padding-bottom:4px; }
.foot .site { font-family:"RFSerif",serif; font-size:24px; color:#1B3A2D; font-weight:600; }
.foot .folio { font-family:"RFSerif",serif; font-size:22px; color:#6E6A5E; margin-top:6px; }
.sources { margin-top:22px; }
</style></head><body>
<div class="banner"><img src="%(logo)s"><div class="who">Rooted Forward</div></div>
<div class="page">
  <div class="toolname">%(kicker)s</div>
  <div class="top">
    <div class="col">
      <h1>%(head)s</h1>
      <div class="body">%(paras)s</div>
      <div class="pull"><div class="n">%(stat)s</div><div class="l">%(statlabel)s</div></div>
    </div>
    <div class="rail">%(rail)s</div>
  </div>
  <div class="bottom">
    <div class="foot"><div class="site">rooted-forward.org</div><div class="folio">%(folio)s</div></div>
  </div>
  <div class="cred sources">%(sources)s</div>
</div>
</body></html>"""


def build(tool, n, total):
    folio = f"{n} of {total}"
    items = "".join(f"<li>{t}</li>" for t in tool["items"])
    cover = COVER % dict(
        css=CSS % dict(serif=SERIF, sans=SANS), rule=RULE,
        logo=LOGO, photo=img(tool["cover"]), pos=tool.get("pos", "center 40%"),
        zoom=tool.get("zoom", 1.045),
        title=tool["title"], size=tool.get("size", 82), items=items,
        credit=credit(tool["cover"]), folio=folio)
    strip = list(tool["rail"]) + [tool["wide"]]
    rail = "".join(f'<img src="{img(n)}">' for n in strip)
    story = STORY % dict(
        css=CSS % dict(serif=SERIF, sans=SANS), rule=RULE,
        logo=LOGO, kicker=tool["plain"], head=tool["head"],
        paras="".join(f"<p>{p}</p>" for p in tool["body"]),
        stat=tool["stat"], statlabel=tool["statlabel"], rail=rail,
        folio=folio, sources=sources(strip))
    return cover, story

def render(html, target):
    src = BUILD / (target.stem + ".html")
    src.write_text(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", f"--window-size={W},{H}",
                    f"--screenshot={target}", f"file://{src}"],
                   capture_output=True, check=True)

if __name__ == "__main__":
    TOOLS = json.loads((pathlib.Path(__file__).parent / "tools.json").read_text())
    OUT.mkdir(exist_ok=True); BUILD.mkdir(exist_ok=True)
    for i, tool in enumerate(TOOLS, 1):
        cover, story = build(tool, i, len(TOOLS))
        slug = tool["slug"]
        render(cover, OUT / f"{i}-{slug}-a.png")
        render(story, OUT / f"{i}-{slug}-b.png")
        print(f"  {i}. {tool['title']}")
    print(f"\n{len(TOOLS)*2} slides in {OUT}")
