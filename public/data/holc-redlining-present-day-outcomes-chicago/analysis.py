"""
HOLC Redlining Grades and Present-Day Neighborhood Outcomes in Chicago
======================================================================

Descriptive cross-section. We assign each 2023 Cook County census tract to a
1938 HOLC grade by point-in-polygon (the tract's official internal point falls
inside an A, B, C, or D HOLC residential zone), then summarize 2023 ACS
outcomes by grade. No causal claims are made here; the gradient is descriptive.

REAL DATA, no fabrication. All inputs are shipped in this folder or referenced
from the repo:

  1. holc-chicago-1938-zones.geojson
     1938 HOLC graded zones for Chicago. University of Richmond Digital
     Scholarship Lab, Mapping Inequality. (Already in repo.)
     public/data/1938-holc-chicago-map-annotated/

  2. cook-county-tract-acs-2023.csv
     ACS 2023 5-year estimates for every Cook County, IL census tract.
     U.S. Census Bureau, American Community Survey, table-based Summary File.
     Built from acsdt5y2023-b19013/b25003/b25002.dat (median income, tenure,
     occupancy). Variables kept with their familiar API names.

  3. cook-county-tract-centroids-2023.csv
     Official tract internal points (INTPTLAT/INTPTLON) and land area (ALAND),
     U.S. Census Bureau 2023 TIGER/Line tract file for Illinois, Cook County.

  Optional cross-link (already in repo):
  4. chicago-affordable-rental-housing-developments.csv  (City of Chicago)
  5. chicago-tif-funded-rda-projects.csv                 (City of Chicago)

Run:
  /Users/zainzaidi/.rf-analysis-venv/bin/python analysis.py
"""

import csv
import json
import os

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
# HERE = <repo>/public/data/holc-redlining-present-day-outcomes-chicago
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))  # repo root

HOLC_GEOJSON = os.path.join(
    REPO, "public", "data", "1938-holc-chicago-map-annotated",
    "holc-chicago-1938-zones.geojson",
)
ACS_CSV = os.path.join(HERE, "cook-county-tract-acs-2023.csv")
CENTROID_CSV = os.path.join(HERE, "cook-county-tract-centroids-2023.csv")
CHA_CSV = os.path.join(
    REPO, "public", "data", "cha-plan-for-transformation-retrospective",
    "chicago-affordable-rental-housing-developments.csv",
)
TIF_CSV = os.path.join(
    REPO, "public", "data", "bronzeville-tif-expenditure-analysis",
    "chicago-tif-funded-rda-projects.csv",
)

GRADES = ["A", "B", "C", "D"]
INCOME_NA = -666666666  # Census "not available / suppressed" sentinel for medians


# ----------------------------------------------------------------------------
# Geometry: build per-grade polygon lists, point-in-polygon via ray casting
# ----------------------------------------------------------------------------
def load_holc_polygons(path):
    """Return {grade: [ring_arrays...]} where each ring is an (n,2) array of
    [lon, lat]. We only keep exterior rings of residential A/B/C/D zones.
    HOLC grade strings are stripped of stray whitespace."""
    with open(path, encoding="utf-8") as f:
        gj = json.load(f)
    polys = {g: [] for g in GRADES}
    raw_grade_counts = {}
    for feat in gj["features"]:
        grade = (feat["properties"].get("grade") or "").strip().upper()
        raw_grade_counts[grade or "(none)"] = raw_grade_counts.get(grade or "(none)", 0) + 1
        if grade not in GRADES:
            continue
        geom = feat["geometry"]
        gtype = geom["type"]
        if gtype == "Polygon":
            rings = [geom["coordinates"]]
        elif gtype == "MultiPolygon":
            rings = geom["coordinates"]
        else:
            continue
        for poly in rings:
            # poly[0] is the exterior ring; ignore holes for assignment
            ext = np.asarray(poly[0], dtype=float)
            if ext.shape[0] >= 4:
                polys[grade].append(ext)
    return polys, raw_grade_counts


def point_in_ring(lon, lat, ring):
    """Ray-casting point-in-polygon for a single ring of [lon, lat] points."""
    x = ring[:, 0]
    y = ring[:, 1]
    n = len(ring)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = x[i], y[i]
        xj, yj = x[j], y[j]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-15) + xi
        ):
            inside = not inside
        j = i
    return inside


def ring_bbox(ring):
    return ring[:, 0].min(), ring[:, 0].max(), ring[:, 1].min(), ring[:, 1].max()


def assign_grade(lon, lat, polys, bboxes):
    """Return the HOLC grade whose polygon contains the point, or None.
    If a point somehow falls in more than one grade (overlapping source
    polygons), the first grade hit in A,B,C,D order wins; such overlaps are
    rare and counted separately by the caller if needed."""
    for grade in GRADES:
        for ring, bb in zip(polys[grade], bboxes[grade]):
            xmin, xmax, ymin, ymax = bb
            if lon < xmin or lon > xmax or lat < ymin or lat > ymax:
                continue
            if point_in_ring(lon, lat, ring):
                return grade
    return None


# ----------------------------------------------------------------------------
# Load data
# ----------------------------------------------------------------------------
print("=" * 78)
print("HOLC REDLINING GRADES AND PRESENT-DAY OUTCOMES IN CHICAGO (COOK COUNTY)")
print("Descriptive 2023 ACS outcomes by 1938 HOLC grade. No causal claims.")
print("=" * 78)

polys, raw_grade_counts = load_holc_polygons(HOLC_GEOJSON)
print("\n1938 HOLC zones by grade label (raw feature counts, whitespace stripped):")
for g in sorted(raw_grade_counts):
    print(f"  {g:>8}: {raw_grade_counts[g]:>4} polygons")
print("  Residential A/B/C/D zones used for tract assignment. "
      "Commercial/Industrial/ungraded zones are not a grade and are dropped.")
n_rings = {g: len(polys[g]) for g in GRADES}
print("  Exterior rings per grade used in point-in-polygon:",
      ", ".join(f"{g}={n_rings[g]}" for g in GRADES))

bboxes = {g: [ring_bbox(r) for r in polys[g]] for g in GRADES}

acs = pd.read_csv(ACS_CSV, dtype={"state": str, "county": str, "tract": str})
acs["geoid"] = acs["state"].str.zfill(2) + acs["county"].str.zfill(3) + acs["tract"].str.zfill(6)

cen = pd.read_csv(CENTROID_CSV, dtype={"geoid": str})
cen["intptlat"] = pd.to_numeric(cen["intptlat"], errors="coerce")
cen["intptlon"] = pd.to_numeric(cen["intptlon"], errors="coerce")

df = acs.merge(cen[["geoid", "intptlat", "intptlon", "aland_sqm"]], on="geoid", how="inner")
print(f"\nCook County tracts: ACS={len(acs)}, centroids={len(cen)}, merged={len(df)}")

# Numeric coercion. Income sentinel -666666666 becomes NaN (honest missing).
for c in ["B19013_001E", "B25003_001E", "B25003_002E", "B25003_003E",
          "B25002_001E", "B25002_003E", "aland_sqm"]:
    df[c] = pd.to_numeric(df[c], errors="coerce")
n_inc_na = int((df["B19013_001E"] == INCOME_NA).sum())
df.loc[df["B19013_001E"] == INCOME_NA, "B19013_001E"] = np.nan
print(f"Median-income cells flagged as Census 'not available' "
      f"({INCOME_NA}) and set to missing: {n_inc_na}")
print(f"Note: ACS top-codes the highest median-income bracket at $250,001.")

# Assign each tract to a HOLC grade by its official internal point.
grades_assigned = []
for lon, lat in zip(df["intptlon"].values, df["intptlat"].values):
    if np.isnan(lon) or np.isnan(lat):
        grades_assigned.append(None)
    else:
        grades_assigned.append(assign_grade(lon, lat, polys, bboxes))
df["holc_grade"] = grades_assigned

in_holc = df[df["holc_grade"].isin(GRADES)].copy()
print(f"\nTracts whose centroid falls inside a 1938 HOLC residential zone: "
      f"{len(in_holc)} of {len(df)}")
print("(Cook County is far larger than the 1938 mapped area, so most tracts "
      "have no grade; this is expected and those tracts are excluded.)")


# ----------------------------------------------------------------------------
# Analysis 1: count and land-area share of tracts by grade
# ----------------------------------------------------------------------------
print("\n" + "-" * 78)
print("1. PRESENT-DAY TRACTS BY 1938 HOLC GRADE  (count and land-area share)")
print("-" * 78)
counts = in_holc.groupby("holc_grade").size().reindex(GRADES).fillna(0).astype(int)
land = in_holc.groupby("holc_grade")["aland_sqm"].sum().reindex(GRADES).fillna(0)
land_km2 = land / 1e6
total_land_km2 = land_km2.sum()
print(f"{'Grade':<6}{'Tracts':>8}{'Tract share':>14}{'Land km2':>12}{'Land share':>13}")
for g in GRADES:
    tshare = counts[g] / counts.sum() * 100
    lshare = land_km2[g] / total_land_km2 * 100
    print(f"{g:<6}{counts[g]:>8}{tshare:>13.1f}%{land_km2[g]:>12.1f}{lshare:>12.1f}%")
print(f"{'Total':<6}{counts.sum():>8}{'100.0%':>14}{total_land_km2:>12.1f}{'100.0%':>13}")


# ----------------------------------------------------------------------------
# Analysis 2: 2023 median household income by grade (median of tract medians)
# ----------------------------------------------------------------------------
print("\n" + "-" * 78)
print("2. 2023 MEDIAN HOUSEHOLD INCOME BY 1938 HOLC GRADE  (B19013_001E)")
print("   Median of tract medians and interquartile range. USD.")
print("-" * 78)
print(f"{'Grade':<6}{'n tracts':>10}{'n w/ income':>13}{'Median':>12}{'Q1':>11}{'Q3':>11}")
inc_median_by_grade = {}
for g in GRADES:
    sub = in_holc[in_holc["holc_grade"] == g]["B19013_001E"].dropna()
    med = sub.median()
    q1 = sub.quantile(0.25)
    q3 = sub.quantile(0.75)
    inc_median_by_grade[g] = med
    n_with = len(sub)
    n_all = int(counts[g])
    print(f"{g:<6}{n_all:>10}{n_with:>13}{med:>12,.0f}{q1:>11,.0f}{q3:>11,.0f}")


# ----------------------------------------------------------------------------
# Analysis 3: homeownership rate by grade (aggregated owner / (owner+renter))
# ----------------------------------------------------------------------------
print("\n" + "-" * 78)
print("3. HOMEOWNERSHIP RATE BY 1938 HOLC GRADE")
print("   Owner-occupied / (owner + renter) = B25003_002E / B25003_001E,")
print("   summed across all tracts in the grade (occupied units only).")
print("-" * 78)
print(f"{'Grade':<6}{'Owner units':>14}{'Total occ.':>13}{'Homeownership':>16}")
own_rate_by_grade = {}
for g in GRADES:
    sub = in_holc[in_holc["holc_grade"] == g]
    owner = sub["B25003_002E"].sum()
    total_occ = sub["B25003_001E"].sum()
    rate = owner / total_occ * 100 if total_occ > 0 else float("nan")
    own_rate_by_grade[g] = rate
    print(f"{g:<6}{owner:>14,.0f}{total_occ:>13,.0f}{rate:>15.1f}%")


# ----------------------------------------------------------------------------
# Analysis 4: vacancy rate by grade (vacant / total housing units)
# ----------------------------------------------------------------------------
print("\n" + "-" * 78)
print("4. VACANCY RATE BY 1938 HOLC GRADE")
print("   Vacant / total housing units = B25002_003E / B25002_001E,")
print("   summed across all tracts in the grade.")
print("-" * 78)
print(f"{'Grade':<6}{'Vacant units':>15}{'Total units':>14}{'Vacancy rate':>15}")
vac_rate_by_grade = {}
for g in GRADES:
    sub = in_holc[in_holc["holc_grade"] == g]
    vacant = sub["B25002_003E"].sum()
    total_hu = sub["B25002_001E"].sum()
    rate = vacant / total_hu * 100 if total_hu > 0 else float("nan")
    vac_rate_by_grade[g] = rate
    print(f"{g:<6}{vacant:>15,.0f}{total_hu:>14,.0f}{rate:>14.1f}%")


# ----------------------------------------------------------------------------
# Analysis 5: present-day gap ratio table (D as % of A, etc.) no causal claim
# ----------------------------------------------------------------------------
print("\n" + "-" * 78)
print("5. PRESENT-DAY GAP RATIOS RELATIVE TO GRADE A  (descriptive only)")
print("-" * 78)
a_inc = inc_median_by_grade["A"]
print(f"Median household income, grade X median as % of grade A median:")
for g in GRADES:
    pct = inc_median_by_grade[g] / a_inc * 100
    print(f"  {g}: {inc_median_by_grade[g]:>9,.0f}  ({pct:>5.1f}% of A)")
print(f"\nHomeownership rate, grade X minus grade A (percentage points):")
for g in GRADES:
    print(f"  {g}: {own_rate_by_grade[g]:>5.1f}%  ({own_rate_by_grade[g]-own_rate_by_grade['A']:+5.1f} pp vs A)")
print(f"\nVacancy rate, grade X minus grade A (percentage points):")
for g in GRADES:
    print(f"  {g}: {vac_rate_by_grade[g]:>5.1f}%  ({vac_rate_by_grade[g]-vac_rate_by_grade['A']:+5.1f} pp vs A)")


# ----------------------------------------------------------------------------
# Analysis 6 (optional cross-link): public housing and TIF dollars vs 1938 grade
# ----------------------------------------------------------------------------
def load_points(path, latcol, loncol, enc="utf-8"):
    """Read a CSV with the csv module (handles multiline quoted fields) and
    return a list of (lon, lat) for rows with valid coordinates, plus totals."""
    pts = []
    n_records = 0
    with open(path, encoding=enc, newline="") as f:
        for row in csv.DictReader(f):
            n_records += 1
            try:
                lat = float(row[latcol]); lon = float(row[loncol])
            except (ValueError, TypeError, KeyError):
                continue
            pts.append((lon, lat))
    return pts, n_records


def grade_counts_for_points(pts):
    out = {g: 0 for g in GRADES}
    out["(no grade)"] = 0
    for lon, lat in pts:
        g = assign_grade(lon, lat, polys, bboxes)
        if g in GRADES:
            out[g] += 1
        else:
            out["(no grade)"] += 1
    return out

print("\n" + "-" * 78)
print("6. WHERE PUBLIC HOUSING AND TIF DOLLARS SIT RELATIVE TO 1938 GRADES")
print("   Descriptive point-in-polygon counts. City of Chicago open data.")
print("-" * 78)

cha_pts, cha_n = load_points(CHA_CSV, "latitude", "longitude")
cha_g = grade_counts_for_points(cha_pts)
cha_in = sum(cha_g[g] for g in GRADES)
print(f"\nChicago affordable rental housing developments: {cha_n} records, "
      f"{len(cha_pts)} geocoded.")
print(f"  Falling inside a 1938 HOLC graded zone: {cha_in}")
for g in GRADES:
    share = cha_g[g] / cha_in * 100 if cha_in else 0
    print(f"    Grade {g}: {cha_g[g]:>4}  ({share:>5.1f}% of graded-zone developments)")
print(f"    Outside any 1938 HOLC zone: {cha_g['(no grade)']}")

tif_pts, tif_n = load_points(TIF_CSV, "latitude", "longitude", enc="latin1")
tif_g = grade_counts_for_points(tif_pts)
tif_in = sum(tif_g[g] for g in GRADES)
print(f"\nTIF / RDA funded projects: {tif_n} records, {len(tif_pts)} geocoded.")
print(f"  Falling inside a 1938 HOLC graded zone: {tif_in}")
for g in GRADES:
    share = tif_g[g] / tif_in * 100 if tif_in else 0
    print(f"    Grade {g}: {tif_g[g]:>4}  ({share:>5.1f}% of graded-zone projects)")
print(f"    Outside any 1938 HOLC zone: {tif_g['(no grade)']}")

print("\n" + "=" * 78)
print("DONE. Every figure above is computed from the shipped real data files.")
print("=" * 78)
