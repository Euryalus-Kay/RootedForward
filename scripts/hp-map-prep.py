#!/usr/bin/env python3
# Project the real Chicago South Side geography (community-area boundaries from
# the city open-data GeoJSON, plus the two big parks and the Midway) onto the
# 1920x1080 canvas, so the film's locator map is a real map, not abstract boxes.
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 1080
# map frame inside the canvas
MX0, MY0, MX1, MY1 = 70, 150, 1850, 1016
# geographic window around Hyde Park (lng west..east, lat south..north)
LNG0, LNG1 = -87.658, -87.536
LAT0, LAT1 = 41.760, 41.816
LAT_C = 41.793
CDEG = math.cos(math.radians(LAT_C))

geoW = (LNG1 - LNG0) * CDEG
geoH = (LAT1 - LAT0)
mapW, mapH = (MX1 - MX0), (MY1 - MY0)
S = min(mapW / geoW, mapH / geoH)
offx = MX0 + (mapW - geoW * S) / 2
offy = MY0 + (mapH - geoH * S) / 2

def proj(lng, lat):
    x = offx + (lng - LNG0) * CDEG * S
    y = offy + (LAT1 - lat) * S
    return [round(x, 1), round(y, 1)]

def simplify(ring, tol=2.2):
    # drop points closer than tol px to the previous kept point
    out = [ring[0]]
    for p in ring[1:]:
        dx = p[0] - out[-1][0]; dy = p[1] - out[-1][1]
        if dx * dx + dy * dy >= tol * tol:
            out.append(p)
    if out[-1] != out[0]:
        out.append(out[0])
    return out

def centroid(ring):
    a = 0.0; cx = 0.0; cy = 0.0
    for i in range(len(ring) - 1):
        x0, y0 = ring[i]; x1, y1 = ring[i + 1]
        cr = x0 * y1 - x1 * y0
        a += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr
    if abs(a) < 1e-6:
        xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
        return [sum(xs) / len(xs), sum(ys) / len(ys)]
    a *= 0.5
    return [round(cx / (6 * a), 1), round(cy / (6 * a), 1)]

ca = json.load(open(os.path.join(ROOT, "data/geo/ca.geojson")))
WANT = ["HYDE PARK", "KENWOOD", "WASHINGTON PARK", "WOODLAWN", "GRAND BOULEVARD",
        "OAKLAND", "DOUGLAS", "SOUTH SHORE", "GREATER GRAND CROSSING", "FULLER PARK",
        "ENGLEWOOD", "GRAND CROSSING"]

def rings_of(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    out = []
    for poly in polys:
        out.append(poly[0])  # outer ring
    return out

neighborhoods = []
for f in ca["features"]:
    name = f["properties"]["community"]
    if name not in WANT:
        continue
    paths = []
    biggest = None; biggest_n = 0
    for ring in rings_of(f["geometry"]):
        pr = simplify([proj(c[0], c[1]) for c in ring])
        if len(pr) >= 4:
            paths.append(pr)
            if len(pr) > biggest_n:
                biggest_n = len(pr); biggest = pr
    if not paths:
        continue
    neighborhoods.append({
        "name": name.title(),
        "hp": name == "HYDE PARK",
        "paths": paths,
        "label": centroid(biggest),
    })

def rect(lng0, lat0, lng1, lat1):
    return [proj(lng0, lat1), proj(lng1, lat1), proj(lng1, lat0), proj(lng0, lat0), proj(lng0, lat1)]

# real-ish park footprints (Chicago grid), with the Midway connecting them
parks = [
    {"name": "Washington Park", "path": rect(-87.6168, 41.7905, -87.6068, 41.8095), "label": None},
    {"name": "Jackson Park", "path": rect(-87.5878, 41.7660, -87.5755, 41.7930), "label": None},
    {"name": "Midway Plaisance", "path": rect(-87.6068, 41.7872, -87.5878, 41.7895), "label": None, "thin": True},
]
for p in parks:
    xs = [c[0] for c in p["path"]]; ys = [c[1] for c in p["path"]]
    p["label"] = [round(sum(xs)/len(xs), 1), round(sum(ys)/len(ys), 1)]

out = {"W": W, "H": H, "frame": [MX0, MY0, MX1, MY1],
       "neighborhoods": neighborhoods, "parks": parks,
       "loop": proj(-87.6298, 41.8786)}  # the Loop, far north (off-frame direction)
json.dump(out, open(os.path.join(ROOT, "data/hp-map.json"), "w"))
print("wrote data/hp-map.json:", len(neighborhoods), "neighborhoods,", len(parks), "parks")
for n in neighborhoods:
    print("  ", n["name"], "hp" if n["hp"] else "", "rings", len(n["paths"]), "pts", sum(len(p) for p in n["paths"]))
