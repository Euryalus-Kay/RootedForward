#!/usr/bin/env python3
# Prototype the pseudo-3D looks (extruded type, perspective photo plane) in PIL
# so we can eyeball quality before wiring them into the museum renderer.
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1920, 1080
FOREST = (18, 33, 25); CREAM = (245, 240, 232); RUST = (197, 93, 62); WARM = (150, 142, 128)
BASK = "/System/Library/Fonts/Supplemental/Baskerville.ttc"
GILL = "/System/Library/Fonts/Supplemental/GillSans.ttc"
def serif(sz, i=0): return ImageFont.truetype(BASK, sz, index=i)
def sans(sz, i=1): return ImageFont.truetype(GILL, sz, index=i)

def find_coeffs(src, dst):
    # solve the 8 perspective coefficients mapping dst -> src (PIL's convention)
    A = []
    for (xd, yd), (xs, ys) in zip(dst, src):
        A.append([xd, yd, 1, 0, 0, 0, -xs*xd, -xs*yd])
        A.append([0, 0, 0, xd, yd, 1, -ys*xd, -ys*yd])
    A = np.array(A, float); B = np.array(src, float).reshape(8)
    return np.linalg.solve(A, B)

def extruded_number(text, depth=22, face=CREAM, deep=(150, 70, 46)):
    """A dimensional number: many darkening offset copies behind a bright face."""
    fnt = serif(210, 4)
    pad = 80
    tmp = Image.new("RGBA", (10, 10)); d = ImageDraw.Draw(tmp)
    bb = d.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    cw, ch = tw + pad*2, th + pad*2 + depth
    layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox, oy = pad - bb[0], pad - bb[1]
    # extrusion: step from deep to a mid tone, back to front
    for k in range(depth, 0, -1):
        f = k / depth
        col = tuple(int(deep[i]*f + FOREST[i]*(1-f)*0.5) for i in range(3))
        dd = ImageDraw.Draw(layer)
        dd.text((ox + k*0.8, oy + k*1.0), text, font=fnt, fill=col + (255,))
    # soft contact shadow under the face
    ImageDraw.Draw(layer).text((ox, oy), text, font=fnt, fill=face + (255,))
    # a subtle top-down sheen on the face
    sheen = Image.new("L", (cw, ch), 0)
    for y in range(ch):
        ImageDraw.Draw(sheen).line([(0, y), (cw, y)], fill=int(40*(1 - y/ch)))
    face_lift = Image.new("RGBA", (cw, ch), (255, 255, 255, 0)); face_lift.putalpha(sheen)
    mask = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(mask).text((ox, oy), text, font=fnt, fill=255)
    layer = Image.composite(Image.alpha_composite(layer, face_lift), layer, mask)
    return layer

def card_a():
    b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W//2
    d = ImageDraw.Draw(b)
    d.text((cx, 300), "BLACK CHICAGOANS BY 1940", font=sans(28, 4), fill=RUST, anchor="mm")
    num = extruded_number("278,000")
    b.alpha_composite(num, (cx - num.width//2, 430))
    d.rectangle([cx-60, 800, cx+60, 803], fill=RUST)
    d.text((cx, 868), "up from about forty thousand in 1910", font=sans(31, 7), fill=(214, 209, 199), anchor="mm")
    return b.convert("RGB")

def perspective_photo(src_path):
    """A photo set on a plane tilted back into depth, with a faint reflection."""
    bg = Image.new("RGBA", (W, H), FOREST + (255,))
    ph = Image.open(src_path).convert("RGBA")
    # contain to a working size
    pw, ph2 = 1180, 760
    ph.thumbnail((pw, ph2))
    iw, ih = ph.size
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # place flat, then warp: top edge pulled in (recedes), bottom edge wider (near)
    px0, py0 = (W - iw)//2, 230
    flat = Image.new("RGBA", (W, H), (0, 0, 0, 0)); flat.alpha_composite(ph, (px0, py0))
    inset = int(iw * 0.10); lift = int(ih * 0.06)
    src = [(px0, py0), (px0+iw, py0), (px0+iw, py0+ih), (px0, py0+ih)]
    dst = [(px0+inset, py0+lift), (px0+iw-inset, py0+lift), (px0+iw, py0+ih), (px0, py0+ih)]
    coeffs = find_coeffs(src, dst)
    warped = flat.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    # reflection: flip the warped plane, fade it under
    refl = warped.transpose(Image.FLIP_TOP_BOTTOM)
    ra = refl.split()[3].point(lambda v: v*38//255)
    refl.putalpha(ra)
    bg.alpha_composite(refl, (0, int(ih*0.72)))
    bg = bg.filter(ImageFilter.GaussianBlur(0))
    bg.alpha_composite(warped)
    return bg.convert("RGB")

def chart_bars():
    """Paired-bar comparison, the renewal return-rate gap. Pseudo-3D bars."""
    b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W//2
    d = ImageDraw.Draw(b)
    d.text((cx, 210), "WHO GOT TO STAY", font=sans(28, 4), fill=RUST, anchor="mm")
    d.text((cx, 268), "Families who lost homes and stayed in Hyde Park", font=sans(30, 7), fill=(214, 209, 199), anchor="mm")
    base = 820; top = 360; full = base - top
    cols = [("WHITE FAMILIES", 0.46, "46%", CREAM, 640), ("BLACK FAMILIES", 0.17, "17%", RUST, 1280)]
    bw = 168
    for lab, frac, val, col, x in cols:
        bh = int(full * frac)
        y = base - bh
        # 3D side face
        d.polygon([(x+bw, y), (x+bw+26, y-16), (x+bw+26, base-16), (x+bw, base)], fill=tuple(int(c*0.6) for c in col))
        d.polygon([(x, y), (x+26, y-16), (x+bw+26, y-16), (x+bw, y)], fill=tuple(int(c*0.8) for c in col))
        d.rectangle([x, y, x+bw, base], fill=col)
        d.text((x+bw//2, y-70), val, font=serif(96, 4), fill=col, anchor="mm")
        d.text((x+bw//2, base+44), lab, font=sans(24, 4), fill=(214, 209, 199), anchor="mm")
    d.line([(560, base), (1480, base)], fill=(120, 110, 96), width=2)
    d.text((cx, 980), "In the first University of Chicago renewal projects, 1955 to 1965", font=sans(24, 7), fill=WARM, anchor="mm")
    return b.convert("RGB")

def chart_area():
    """Black population growth 1910 to 1940, an area-over-time chart."""
    b = Image.new("RGBA", (W, H), FOREST + (255,)); cx = W//2
    d = ImageDraw.Draw(b)
    d.text((cx, 200), "BLACK CHICAGO, 1910 TO 1940", font=sans(28, 4), fill=RUST, anchor="mm")
    x0, x1, base, top = 360, 1560, 800, 380
    pts = [(1910, 44103), (1920, 109458), (1930, 233903), (1940, 277731)]
    mx = 290000
    def X(yr): return x0 + (yr-1910)/(1940-1910)*(x1-x0)
    def Y(v): return base - v/mx*(base-top)
    poly = [(X(p[0]), Y(p[1])) for p in pts]
    fill = poly + [(X(1940), base), (X(1910), base)]
    d.polygon(fill, fill=(70, 52, 44))
    d.line(poly, fill=RUST, width=5, joint="curve")
    for yr, v in pts:
        d.ellipse([X(yr)-7, Y(v)-7, X(yr)+7, Y(v)+7], fill=CREAM)
        d.text((X(yr), Y(v)-40), f"{v:,}", font=sans(26, 4), fill=CREAM, anchor="mm")
        d.text((X(yr), base+38), str(yr), font=sans(24, 7), fill=(214, 209, 199), anchor="mm")
    d.line([(x0, base), (x1, base)], fill=(120, 110, 96), width=2)
    d.text((cx, 980), "Most of it held inside a thin strip of the South Side", font=sans(24, 7), fill=WARM, anchor="mm")
    return b.convert("RGB")

if __name__ == "__main__":
    card_a().save("/tmp/proto_stat.jpg", quality=92)
    perspective_photo("public/media/hyde-park/img/worlds-fair-1.jpg").save("/tmp/proto_persp.jpg", quality=92)
    chart_bars().save("/tmp/proto_bars.jpg", quality=92)
    chart_area().save("/tmp/proto_area.jpg", quality=92)
    tiles = ["/tmp/proto_stat.jpg", "/tmp/proto_persp.jpg", "/tmp/proto_bars.jpg", "/tmp/proto_area.jpg"]
    s = Image.new("RGB", (2*760, 2*428), (10, 10, 10))
    for i, t in enumerate(tiles):
        s.paste(Image.open(t).resize((760, 428)), ((i % 2)*760, (i//2)*428))
    s.save("/tmp/proto_3d.jpg", quality=92)
    print("wrote /tmp/proto_3d.jpg")
