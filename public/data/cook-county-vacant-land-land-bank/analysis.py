"""
Vacant Land and the Cook County Land Bank
Descriptive analysis of the City of Chicago City-Owned Land Inventory.

Data source: City of Chicago Department of Planning and Development,
City-Owned Land Inventory, via the Chicago Data Portal (Socrata),
dataset aksk-kvfp. Full table pulled 2026-05-29 (20,732 parcels).

Spatial overlay: 1938 HOLC ("redlining") graded zones for Chicago,
shipped in this repo at
public/data/1938-holc-chicago-map-annotated/holc-chicago-1938-zones.geojson.

This script reads the shipped files by relative path, computes the
descriptive statistics that support the paper, and prints labeled results.
It uses only real columns and reports missingness honestly. Nothing is
imputed. The thesis is descriptive co-location, not causation, and is
scoped to CITY-owned land, not the separately governed CCLBA.

No external geo dependency: point-in-polygon uses a pure-numpy ray-cast.
"""

import json
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "chicago-city-owned-land-inventory.csv")
HOLC = os.path.join(
    HERE, "..", "1938-holc-chicago-map-annotated", "holc-chicago-1938-zones.geojson"
)

pd.set_option("display.width", 120)


def rule(title):
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------
df = pd.read_csv(CSV, dtype=str)
N = len(df)

rule("DATASET OVERVIEW")
print(f"Source: City of Chicago City-Owned Land Inventory (Socrata aksk-kvfp)")
print(f"Total parcels (rows): {N}")
print(f"Columns: {len(df.columns)}")
# the 'last_update' field tells us how current the snapshot is
print(f"last_update value range: {df['last_update'].min()} to {df['last_update'].max()}")

# ---------------------------------------------------------------------------
# 1. Property status mix  (how much inventory is held vs. dispositioned)
# ---------------------------------------------------------------------------
rule("1. PROPERTY STATUS DISTRIBUTION (held vs. disposed)")
ps = df["property_status"].value_counts(dropna=False)
for status, cnt in ps.items():
    label = "(missing)" if pd.isna(status) else status
    print(f"  {label:18s} {cnt:6d}   {100*cnt/N:5.1f}%")
print(f"  {'TOTAL':18s} {N:6d}   100.0%")
held = ps.get("Owned by City", 0)
sold = ps.get("Sold", 0)
print(f"\n  Held ('Owned by City'): {held} ({100*held/N:.1f}%)")
print(f"  Disposed ('Sold'):      {sold} ({100*sold/N:.1f}%)")
print("  Read: a majority of the inventory is still held, not moved.")

# ---------------------------------------------------------------------------
# 2. Managing organization (who holds it)
# ---------------------------------------------------------------------------
rule("2. MANAGING ORGANIZATION (top 10)")
mo = df["managing_organization"]
mo_missing = mo.isna().sum()
print(f"  managing_organization populated for {N - mo_missing} of {N} "
      f"parcels ({100*(N-mo_missing)/N:.1f}%); {mo_missing} are blank.")
print("  Among parcels where it IS populated:")
moc = mo.value_counts(dropna=True)
mo_pop = moc.sum()
for org, cnt in moc.head(10).items():
    print(f"    {org:24s} {cnt:6d}   {100*cnt/mo_pop:5.1f}% of populated")

# ---------------------------------------------------------------------------
# 3. Concentration by community area (ranked)
# ---------------------------------------------------------------------------
rule("3. CITY-OWNED PARCELS BY COMMUNITY AREA (top 12)")
ca = df["community_area_name"]
ca_missing = ca.isna().sum()
print(f"  community_area_name populated for {N - ca_missing} of {N} "
      f"({100*(N-ca_missing)/N:.1f}%); {ca_missing} blank.")
cac = ca.value_counts(dropna=True)
print(f"  {'community area':22s} {'parcels':>8s}  {'% of all':>8s}")
for area, cnt in cac.head(12).items():
    print(f"  {area.title():22s} {cnt:8d}  {100*cnt/N:7.1f}%")
top5 = cac.head(5)
print(f"\n  Top 5 community areas hold {top5.sum()} parcels "
      f"({100*top5.sum()/N:.1f}% of the full inventory).")
print(f"  All five exceed 1,000 parcels: "
      + ", ".join(f"{a.title()} {c}" for a, c in top5.items()))

# ---------------------------------------------------------------------------
# 4. Concentration by ward (ranked)
# ---------------------------------------------------------------------------
rule("4. CITY-OWNED PARCELS BY WARD (top 10)")
wd = df["ward"]
wd_missing = wd.isna().sum()
print(f"  ward populated for {N - wd_missing} of {N} "
      f"({100*(N-wd_missing)/N:.1f}%); {wd_missing} blank.")
wdc = wd.value_counts(dropna=True)
for ward, cnt in wdc.head(10).items():
    # ward stored as float-like string; normalise display
    w = str(int(float(ward)))
    print(f"    Ward {w:>3s}   {cnt:6d}   {100*cnt/N:5.1f}% of all")

# ---------------------------------------------------------------------------
# 5. Sales / disposition funnel  (snapshot)
# ---------------------------------------------------------------------------
rule("5. SALES STATUS FUNNEL (snapshot)")
ss = df["sales_status"]
ss_missing = ss.isna().sum()
print(f"  sales_status populated for {N - ss_missing} of {N} "
      f"({100*(N-ss_missing)/N:.1f}%); {ss_missing} blank "
      "(blank = not in an active sales pipeline).")
ssc = ss.value_counts(dropna=True)
print("  Among parcels with a sales_status:")
for status, cnt in ssc.head(8).items():
    print(f"    {status:26s} {cnt:6d}")

# share ever disposed: date_of_disposition present OR status Sold
disp_date = df["date_of_disposition"].notna()
status_sold = df["property_status"].eq("Sold")
ever_disposed = disp_date | status_sold
print(f"\n  Parcels with a disposition date recorded: {disp_date.sum()} "
      f"({100*disp_date.sum()/N:.1f}%).")
print(f"  Parcels ever disposed (Sold status OR disposition date): "
      f"{ever_disposed.sum()} ({100*ever_disposed.sum()/N:.1f}%).")

# where land actually MOVES vs. SITS: disposition rate by community area
rule("5b. DISPOSITION RATE BY COMMUNITY AREA (areas with >=200 parcels)")
tmp = df.copy()
tmp["disposed"] = ever_disposed
g = tmp.dropna(subset=["community_area_name"]).groupby("community_area_name")
agg = g["disposed"].agg(["size", "sum"])
agg = agg[agg["size"] >= 200].copy()
agg["rate"] = 100 * agg["sum"] / agg["size"]
print("  Lowest disposition rate (land that SITS), top 6:")
for area, r in agg.sort_values("rate").head(6).iterrows():
    print(f"    {area.title():22s} {int(r['size']):5d} parcels  "
          f"{int(r['sum']):4d} disposed  {r['rate']:5.1f}%")
print("  Highest disposition rate (land that MOVES), top 6:")
for area, r in agg.sort_values("rate", ascending=False).head(6).iterrows():
    print(f"    {area.title():22s} {int(r['size']):5d} parcels  "
          f"{int(r['sum']):4d} disposed  {r['rate']:5.1f}%")

# ---------------------------------------------------------------------------
# 6. Land value and lot size by community area (sparse fields, honest caveat)
# ---------------------------------------------------------------------------
rule("6. LAND VALUE AND LOT SIZE (sparsely populated fields)")
lv = pd.to_numeric(df["land_value"], errors="coerce")
# treat non-positive land_value as not meaningfully recorded
lv_valid = lv.where(lv > 0)
print(f"  land_value populated (non-null): {lv.notna().sum()} of {N} "
      f"({100*lv.notna().sum()/N:.1f}%).")
print(f"  land_value > 0 (usable): {lv_valid.notna().sum()} "
      f"({100*lv_valid.notna().sum()/N:.1f}%).  CAVEAT: very sparse.")
print(f"  Among usable land_value: median ${lv_valid.median():,.0f}, "
      f"mean ${lv_valid.mean():,.0f}.")

sq = pd.to_numeric(df["sq_ft"], errors="coerce")
sqc = pd.to_numeric(df["square_footage_city_estimate"], errors="coerce")
sq_valid = sq.where(sq > 0)
sqc_valid = sqc.where(sqc > 0)
print(f"\n  sq_ft populated: {sq.notna().sum()} ({100*sq.notna().sum()/N:.1f}%), "
      f"but only {sq_valid.notna().sum()} are > 0.")
print(f"  square_footage_city_estimate > 0: {sqc_valid.notna().sum()} "
      f"({100*sqc_valid.notna().sum()/N:.1f}%).")
print(f"  Among usable sq_ft > 0: median {sq_valid.median():,.0f} sq ft.")

# median land value by community area, only areas with >=30 usable values
rule("6b. MEDIAN RECORDED LAND VALUE BY COMMUNITY AREA (>=30 usable parcels)")
tmp2 = df.copy()
tmp2["lv"] = lv_valid
gv = tmp2.dropna(subset=["community_area_name", "lv"]).groupby("community_area_name")["lv"]
mv = gv.agg(["size", "median"])
mv = mv[mv["size"] >= 30].sort_values("median")
print("  CAVEAT: land_value is recorded for a minority of parcels; read as")
print("  'recorded values where present', not a full assessment.")
print(f"  {'community area':22s} {'n':>5s} {'median land value':>20s}")
for area, r in mv.head(8).iterrows():
    val = f"${r['median']:,.0f}"
    print(f"  {area.title():22s} {int(r['size']):5d} {val:>20s}")

# ---------------------------------------------------------------------------
# 7. Spatial overlay with 1938 HOLC redlining grades
# ---------------------------------------------------------------------------
rule("7. OVERLAY OF CITY-OWNED PARCELS ON 1938 HOLC GRADES")

with open(HOLC) as f:
    gj = json.load(f)


def normalize_grade(p):
    g = p.get("grade")
    if g is None:
        return None
    g = str(g).strip().upper()
    return g if g in ("A", "B", "C", "D") else None


def iter_rings(geom):
    """Yield each exterior+holes polygon as a list of rings (lon,lat)."""
    t = geom["type"]
    coords = geom["coordinates"]
    if t == "Polygon":
        yield coords
    elif t == "MultiPolygon":
        for poly in coords:
            yield poly


# Build per-grade list of polygons, each polygon = list of rings,
# each ring = numpy array of (lon, lat). Precompute bounding boxes.
polys_by_grade = {"A": [], "B": [], "C": [], "D": []}
for feat in gj["features"]:
    grade = normalize_grade(feat["properties"])
    if grade is None:
        continue
    for poly in iter_rings(feat["geometry"]):
        rings = [np.asarray(r, dtype=float) for r in poly if len(r) >= 4]
        if not rings:
            continue
        ext = rings[0]
        bbox = (ext[:, 0].min(), ext[:, 0].max(), ext[:, 1].min(), ext[:, 1].max())
        polys_by_grade[grade].append((rings, bbox))

n_graded = sum(len(v) for v in polys_by_grade.values())
print(f"  HOLC polygons loaded by grade: "
      + ", ".join(f"{g}={len(polys_by_grade[g])}" for g in "ABCD")
      + f" (total {n_graded}).")


def point_in_ring(x, y, ring):
    """Ray-casting point-in-polygon for a single ring. ring: (n,2) lon,lat."""
    xs = ring[:, 0]
    ys = ring[:, 1]
    n = len(ring)
    inside = False
    j = n - 1
    for i in range(n):
        yi, yj = ys[i], ys[j]
        if (yi > y) != (yj > y):
            xint = (xs[j] - xs[i]) * (y - yi) / (yj - yi) + xs[i]
            if x < xint:
                inside = not inside
        j = i
    return inside


def point_in_polygon(x, y, rings):
    """True if inside exterior ring and not inside any hole."""
    if not point_in_ring(x, y, rings[0]):
        return False
    for hole in rings[1:]:
        if point_in_ring(x, y, hole):
            return False
    return True


def grade_for_point(x, y):
    # D first (most policy-relevant), then C, B, A. A point rarely sits in
    # two graded polygons; if it does we report the worse grade, which is
    # the conservative read for a redlining-persistence claim.
    for grade in ("D", "C", "B", "A"):
        for rings, bbox in polys_by_grade[grade]:
            if x < bbox[0] or x > bbox[1] or y < bbox[2] or y > bbox[3]:
                continue
            if point_in_polygon(x, y, rings):
                return grade
    return None


lat = pd.to_numeric(df["latitude"], errors="coerce")
lon = pd.to_numeric(df["longitude"], errors="coerce")
geocoded = lat.notna() & lon.notna()
ng = int(geocoded.sum())
print(f"  Parcels with latitude/longitude: {ng} of {N} "
      f"({100*ng/N:.1f}%). The {N-ng} without coordinates are excluded "
      "from the overlay.")

xs = lon[geocoded].to_numpy()
ys = lat[geocoded].to_numpy()
grades_out = np.empty(ng, dtype=object)
for k in range(ng):
    grades_out[k] = grade_for_point(xs[k], ys[k])

gr = pd.Series(grades_out)
counts = gr.value_counts(dropna=False)
inside = gr.notna().sum()
print(f"\n  Of {ng} geocoded parcels, {inside} "
      f"({100*inside/ng:.1f}%) fall inside a 1938 graded zone; "
      f"{ng-inside} fall outside the 1938 map footprint.")
print("  Grade of the parcel's location (share of GEOCODED parcels):")
for g in ["A", "B", "C", "D"]:
    c = int(counts.get(g, 0))
    print(f"    Grade {g}: {c:6d}   {100*c/ng:5.1f}% of geocoded   "
          f"{100*c/inside:5.1f}% of those inside the map")
none_c = int(counts.get(np.nan, 0)) if np.nan in counts.index else (ng - inside)
print(f"    Outside graded zones: {ng-inside:6d}   {100*(ng-inside)/ng:5.1f}%")

cd = int(counts.get("C", 0)) + int(counts.get("D", 0))
ab = int(counts.get("A", 0)) + int(counts.get("B", 0))
print(f"\n  C+D (yellow 'declining' + red 'hazardous'): {cd} "
      f"({100*cd/ng:.1f}% of geocoded, {100*cd/inside:.1f}% of those inside).")
print(f"  A+B (green 'best' + blue 'desirable'):     {ab} "
      f"({100*ab/ng:.1f}% of geocoded, {100*ab/inside:.1f}% of those inside).")
if ab > 0:
    print(f"  Ratio of C+D to A+B parcels: {cd/ab:.1f} to 1.")
print("\n  NOTE: descriptive co-location only. The 1938 HOLC map and today's")
print("  city land inventory are 88 years apart; this is persistence of")
print("  disinvestment geography, not a causal claim, and is limited to")
print("  city-owned parcels (not the separately governed CCLBA).")

rule("DONE")
