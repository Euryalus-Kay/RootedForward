#!/usr/bin/env python3
"""One page announcing the app, in the same furniture as the tool posters.

The picture is a real screen from the shipping build rather than a
mockup, so nothing on the poster is a thing the app does not do.
"""
import base64, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[3]
FONTS = ROOT / "ios/Resources/Fonts"
SHOT = ROOT / "ios/AppStore/raw/11-map-whole-route.png"
LOGO = ROOT / "ios/Assets.xcassets/LogoMark.imageset/LogoMark.png"
OUT = pathlib.Path(__file__).parent / "out" / "0-app-announcement.png"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()

HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family:"RFSerif"; src:url(data:font/ttf;base64,%(serif)s) format("truetype"); font-weight:200 900; }
@font-face { font-family:"RFSans";  src:url(data:font/ttf;base64,%(sans)s)  format("truetype"); font-weight:100 1000; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:1080px; height:1350px; overflow:hidden; }
body { background:#F5F0E8; display:flex; flex-direction:column;
       font-family:"RFSans", system-ui, sans-serif; color:#1A1A1A; }
.banner { flex:0 0 118px; display:flex; align-items:center; gap:18px; padding:0 60px; }
.banner img { width:60px; height:60px; display:block; }
.banner .who { font-family:"RFSerif", Georgia, serif; font-weight:600; font-size:34px;
               color:#1B3A2D; letter-spacing:-.01em; }
.page { flex:1 1 auto; display:flex; flex-direction:column; padding:30px 60px 46px; min-height:0; }
.stats { display:flex; gap:56px; margin-top:34px; }
.stats .n { font-family:"RFSerif",serif; font-weight:600; font-size:58px; color:#1B3A2D; line-height:1; }
.stats .l { font-size:21px; color:rgba(26,26,26,.62); margin-top:9px; }
.row { display:flex; gap:52px; flex:1 1 auto; min-height:0; margin-top:42px; }
.col { flex:1 1 auto; display:flex; flex-direction:column; min-width:0; }
h1 { font-family:"RFSerif", Georgia, serif; font-weight:600; font-size:104px; line-height:0.98;
     color:#1B3A2D; letter-spacing:-.018em; }
.dek { font-size:29px; line-height:1.48; color:rgba(26,26,26,.78); margin-top:22px; max-width:900px; }
ul { list-style:none; }
li { font-size:26px; font-weight:500; color:rgba(26,26,26,.8); margin-bottom:20px;
     display:flex; gap:20px; align-items:baseline; }
li:before { content:"\\2013"; color:#C45D3E; font-weight:600; flex:0 0 auto; }
.cta { margin-top:auto; }
.cta .store { font-family:"RFSerif",serif; font-weight:600; font-size:38px; color:#C45D3E; }
.cta .sub { font-size:23px; color:rgba(26,26,26,.6); margin-top:10px; }
.shot { flex:0 0 auto; align-self:stretch; }
.shot img { height:100%%; width:auto; display:block; border-radius:30px; }
.cta .site { font-family:"RFSerif",serif; font-weight:600; font-size:26px;
             color:#1B3A2D; margin-top:22px; }
</style></head><body>
<div class="banner"><img src="data:image/png;base64,%(logo)s"><div class="who">Rooted Forward</div></div>
<div class="page">
  <h1>Walk Hyde Park</h1>
  <div class="dek">A free audio walking tour of how one Chicago neighborhood decided who could live in it. From Paul Cornell's stone to Harper Court.</div>
  <div class="stats">
    <div><div class="n">13</div><div class="l">stops</div></div>
    <div><div class="n">4</div><div class="l">miles</div></div>
    <div><div class="n">55</div><div class="l">minutes of audio</div></div>
    <div><div class="n">3</div><div class="l">optional detours</div></div>
  </div>
  <div class="row">
  <div class="col">
    <ul>
      <li>Narrated at every stop, with the full text there to read instead</li>
      <li>A map of the route with your own position on it</li>
      <li>Works offline, so it runs with no signal</li>
    </ul>
    <div class="cta">
      <div class="store">Free on the App Store</div>
      <div class="sub">No ads, no account. iPhone, iOS 17 or newer.</div>
      <div class="site">rooted-forward.org</div>
    </div>
  </div>
  <div class="shot"><img src="data:image/png;base64,%(shot)s"></div>
  </div>
</div>
</body></html>"""

src = pathlib.Path(__file__).parent / "html" / "app-announcement.html"
src.parent.mkdir(exist_ok=True)
src.write_text(HTML % dict(serif=b64(FONTS / "SourceSerif4-VF.ttf"),
                           sans=b64(FONTS / "DMSans-VF.ttf"),
                           logo=b64(LOGO), shot=b64(SHOT)))
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--force-device-scale-factor=1", "--window-size=1080,1350",
                f"--screenshot={OUT}", f"file://{src}"], capture_output=True, check=True)
print("wrote", OUT)
