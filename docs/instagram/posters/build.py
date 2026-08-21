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

SERIF = b64(FONTS / "SourceSerif4-VF.ttf")
SANS = b64(FONTS / "DMSans-VF.ttf")

CREDITS = json.loads((pathlib.Path(__file__).parent / "credits.json").read_text())

def credit(name):
    if name not in CREDITS:
        sys.exit(f"no credit on file for {name}")
    return CREDITS[name]

CSS = """
@font-face { font-family:"RFSerif"; src:url(data:font/ttf;base64,%(serif)s) format("truetype"); font-weight:200 900; }
@font-face { font-family:"RFSans";  src:url(data:font/ttf;base64,%(sans)s)  format("truetype"); font-weight:100 1000; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1350px; overflow:hidden; }
body { background:#F5F0E8; position:relative;
       font-family:"RFSans", system-ui, sans-serif; color:#1A1A1A; }
.edge { position:absolute; inset:18px; border:1px solid rgba(26,26,26,.20); pointer-events:none; z-index:40; }
.edge:after { content:""; position:absolute; inset:7px; border:1px solid rgba(26,26,26,.11); }
.kicker { font-size:22px; font-weight:500; letter-spacing:.01em; color:#6E6A5E; }
h1 { font-family:"RFSerif", Georgia, serif; font-weight:600; color:#1B3A2D;
     letter-spacing:-.015em; }
.cred { font-size:17px; line-height:1.35; color:#6E6A5E; }
.folio { font-family:"RFSerif", Georgia, serif; font-size:22px; color:#6E6A5E; }
"""

RULE = ('<svg width="132" height="13" viewBox="0 0 132 13">'
        '<g stroke="#C45D3E" stroke-width="1.6" fill="none">'
        '<line x1="1" y1="6.5" x2="131" y2="6.5"/>'
        '<line x1="1" y1="1" x2="1" y2="12"/><line x1="131" y1="1" x2="131" y2="12"/>'
        '<line x1="33.5" y1="3.5" x2="33.5" y2="9.5"/><line x1="66" y1="3.5" x2="66" y2="9.5"/>'
        '<line x1="98.5" y1="3.5" x2="98.5" y2="9.5"/></g></svg>')

COVER = """<!doctype html><html><head><meta charset="utf-8"><style>%(css)s
body { display:flex; flex-direction:column; }
.photo { flex:0 0 auto; height:772px; position:relative; overflow:hidden; }
.photo img { width:100%%; height:100%%; object-fit:cover; object-position:%(pos)s;
             display:block; transform:scale(1.045); transform-origin:center; }
.photo:after { content:""; position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(245,240,232,0) 66%%, rgba(245,240,232,.94) 100%%); }
.mast { position:absolute; left:64px; top:52px; z-index:20; display:flex; align-items:center;
        gap:13px; background:rgba(245,240,232,.93); padding:10px 20px 10px 12px;
        border:1px solid rgba(26,26,26,.14); }
.mast .dot { width:34px; height:34px; border-radius:50%%; background:#1B3A2D; color:#F5F0E8;
  font-family:"RFSerif",serif; font-weight:600; font-size:16px; display:flex;
  align-items:center; justify-content:center; letter-spacing:.02em; }
.mast .who { font-family:"RFSerif",serif; font-weight:600; font-size:25px; color:#1B3A2D; }
.panel { flex:1 1 auto; min-height:0; display:flex; flex-direction:column;
         padding:30px 76px 52px; background:#F5F0E8; position:relative; z-index:5; }
h1 { font-size:%(size)spx; line-height:1.03; margin-top:22px; }
ul { list-style:none; margin-top:30px; border-top:1px solid #DDD6C8; }
li { border-bottom:1px solid #DDD6C8; padding:16px 0; font-size:26px; font-weight:500;
     color:rgba(26,26,26,.82); display:flex; gap:20px; align-items:baseline; }
li b { font-family:"RFSerif",serif; font-weight:600; font-size:18px; color:#C45D3E; min-width:24px; }
.foot { margin-top:auto; padding-top:26px; display:flex; justify-content:space-between;
        align-items:flex-end; gap:40px; }
.foot .cred { max-width:720px; }
</style></head><body>
<div class="photo"><img src="%(photo)s">
  <div class="mast"><div class="dot">RF</div><div class="who">Rooted Forward</div></div>
</div>
<div class="panel">
  <div class="kicker">The tools of segregation</div>
  <div style="margin-top:16px">%(rule)s</div>
  <h1>%(title)s</h1>
  <ul>%(items)s</ul>
  <div class="foot"><div class="cred">%(credit)s</div><div class="folio">%(folio)s</div></div>
</div>
<div class="edge"></div></body></html>"""

STORY = """<!doctype html><html><head><meta charset="utf-8"><style>%(css)s
body { display:flex; flex-direction:column; padding:74px 76px 52px; }
.top { display:flex; gap:36px; flex:1 1 auto; min-height:0; }
.col { width:620px; display:flex; flex-direction:column; }
h1 { font-size:54px; line-height:1.09; margin-top:18px; }
.body { margin-top:30px; }
.body p { font-size:26px; line-height:1.6; color:rgba(26,26,26,.86); margin-bottom:18px; }
.pull { margin-top:auto; border-top:2px solid #C45D3E; padding-top:16px; }
.pull .n { font-family:"RFSerif",serif; font-weight:600; font-size:76px; color:#C45D3E; line-height:1; }
.pull .l { font-size:22px; line-height:1.4; color:rgba(26,26,26,.7); margin-top:9px; }
.rail { width:274px; flex:0 0 274px; }
.plate { background:#FBF8F2; border:1px solid rgba(26,26,26,.20); padding:11px;
         box-shadow:5px 5px 0 rgba(27,58,45,.09); }
.rail .plate { margin-bottom:22px; }
.plate img { width:100%%; height:186px; object-fit:cover; display:block;
             border:1px solid rgba(26,26,26,.14); }
.plate .cap { font-size:15px; line-height:1.32; color:#6E6A5E; margin-top:9px; }
.bottom { display:flex; justify-content:space-between; align-items:flex-end;
          gap:40px; margin-top:34px; }
.bottom .plate { width:404px; flex:0 0 404px; }
.bottom .plate img { height:172px; }
.foot { padding-bottom:6px; text-align:right; }
.foot .site { font-family:"RFSerif",serif; font-size:24px; color:#1B3A2D; font-weight:600; }
.foot .folio { margin-top:8px; }
</style></head><body>
<div class="top">
  <div class="col">
    <div class="kicker">%(kicker)s</div>
    <div style="margin-top:14px">%(rule)s</div>
    <h1>%(head)s</h1>
    <div class="body">%(paras)s</div>
    <div class="pull"><div class="n">%(stat)s</div><div class="l">%(statlabel)s</div></div>
  </div>
  <div class="rail">%(rail)s</div>
</div>
<div class="bottom">
  <div class="plate"><img src="%(w_img)s"><div class="cap">%(w_cap)s</div></div>
  <div class="foot"><div class="site">rooted-forward.org</div><div class="folio">%(folio)s</div></div>
</div>
<div class="edge"></div></body></html>"""

def plate(name, cap):
    return f'<div class="plate"><img src="{img(name)}"><div class="cap">{cap}</div></div>'

def build(tool, n, total):
    folio = f"{n} of {total}"
    items = "".join(
        f"<li><b>{i+1}</b><span>{t}</span></li>" for i, t in enumerate(tool["items"]))
    cover = COVER % dict(
        css=CSS % dict(serif=SERIF, sans=SANS), rule=RULE,
        photo=img(tool["cover"]), pos=tool.get("pos", "center 40%"),
        title=tool["title"], size=tool.get("size", 82), items=items,
        credit=credit(tool["cover"]), folio=folio)
    rail = "".join(plate(nm, cp) for nm, cp in tool["rail"])
    story = STORY % dict(
        css=CSS % dict(serif=SERIF, sans=SANS), rule=RULE,
        kicker=tool["title"], head=tool["head"],
        paras="".join(f"<p>{p}</p>" for p in tool["body"]),
        stat=tool["stat"], statlabel=tool["statlabel"], rail=rail,
        w_img=img(tool["wide"][0]), w_cap=tool["wide"][1], folio=folio)
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
