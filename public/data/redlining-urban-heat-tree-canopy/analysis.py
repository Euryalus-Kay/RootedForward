#!/usr/bin/env python3
"""
Historic Redlining, Tree Canopy, and Urban Heat in Chicago
Original analysis backbone: the 1938 HOLC grading GEOMETRY for Chicago.

What this script does, using ONLY real public data:

  1. Grade distribution and land share. Counts of A/B/C/D zones and each
     grade's share of total graded HOLC residential AREA in 1938 Chicago.
     Area is recomputed from the real polygon geometry with an equal-area
     projection (not the raw squared-degree `area` field, which distorts
     with latitude).

  2. Geographic footprint of D ("hazardous") vs A ("best") zones, summarized
     from real polygon centroids: mean centroid latitude/longitude and the
     north/south, east/west split. Shows D clustering on the South and West
     Sides while A/B sit on the far North and Northwest.

  3. Residential vs commercial/industrial composition by grade, from the
     real residential / commercial / industrial boolean flags on each zone.

  4. Community-area cross-walk. A real spatial join (area-weighted polygon
     centroid into present-day Chicago community-area boundaries) counting
     how many of the 77 community areas are touched by each HOLC grade,
     and specifically by D-grading. This is a count/overlap, NOT a causal
     estimate and NOT a temperature or canopy number.

What this script does NOT do: it computes NO Chicago temperature, land-surface
temperature, or tree-canopy number. The convergent peer-reviewed literature on
those disparities is discussed in the paper text and cited there; none of it is
recomputed here, by design.

Data shipped alongside this script (read by relative path):
  - holc-chicago-1938-zones.geojson
      1938 HOLC Graded Zones, Chicago. University of Richmond Digital
      Scholarship Lab, Mapping Inequality / Home Owners' Loan Corporation.
      https://dsl.richmond.edu/panorama/redlining/data
      703 polygons (city_id 45 = Chicago); 683 graded A-D, 20 ungraded.
  - chicago-community-areas.geojson
      Boundaries of the 77 official Chicago community areas.
      City of Chicago Open Data Portal, dataset igwz-8jzy.
      https://data.cityofchicago.org/resource/igwz-8jzy.geojson

No randomness, no imputation. Run:
  python analysis.py
"""

import json
import math
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
HOLC_PATH = os.path.join(HERE, "holc-chicago-1938-zones.geojson")
CCA_PATH = os.path.join(HERE, "chicago-community-areas.geojson")

GRADE_LABEL = {
    "A": 'A ("best")',
    "B": 'B ("still desirable")',
    "C": 'C ("definitely declining")',
    "D": 'D ("hazardous")',
}


# --------------------------------------------------------------------------
# Geometry helpers (pure Python, no geopandas / shapely needed)
# --------------------------------------------------------------------------

def normalize_grade(g):
    """Trim stray whitespace ('A ', 'C ') and empty strings to None."""
    if g is None:
        return None
    g = g.strip()
    return g if g else None


def iter_polygons(geometry):
    """Yield each polygon (list of rings) from Polygon or MultiPolygon."""
    if geometry is None:
        return
    gtype = geometry["type"]
    coords = geometry["coordinates"]
    if gtype == "Polygon":
        yield coords
    elif gtype == "MultiPolygon":
        for poly in coords:
            yield poly


# Equal-area-ish local planar projection centered on Chicago.
# Equirectangular: x scaled by cos(reference latitude). Degrees -> km via
# 111.32 km per degree of latitude. For a metro the size of Chicago (lat span
# ~0.8 deg) this preserves relative areas to well under a percent, which is
# all the grade-SHARE comparison needs. Absolute km^2 are approximate.
DEG_KM = 111.32
REF_LAT = 41.84  # central latitude of Chicago, set once below from the data


def lonlat_to_xy(lon, lat, ref_lat):
    x = lon * DEG_KM * math.cos(math.radians(ref_lat))
    y = lat * DEG_KM
    return x, y


def ring_signed_area_xy(ring, ref_lat):
    """Shoelace signed area (km^2) of a ring of [lon, lat] points."""
    pts = [lonlat_to_xy(p[0], p[1], ref_lat) for p in ring]
    s = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        s += x0 * y1 - x1 * y0
    return s / 2.0


def polygon_area_and_centroid(poly, ref_lat):
    """
    Area (km^2, holes subtracted) and area-weighted centroid (lon, lat) of one
    polygon. Ring 0 is the exterior, any further rings are holes. Centroid is
    computed in projected x/y then converted back to lon/lat.
    """
    if not poly:
        return 0.0, None
    total_area = 0.0
    cx = 0.0
    cy = 0.0
    for ri, ring in enumerate(poly):
        if len(ring) < 3:
            continue
        pts = [lonlat_to_xy(p[0], p[1], ref_lat) for p in ring]
        a = 0.0
        rcx = 0.0
        rcy = 0.0
        n = len(pts)
        for i in range(n):
            x0, y0 = pts[i]
            x1, y1 = pts[(i + 1) % n]
            cross = x0 * y1 - x1 * y0
            a += cross
            rcx += (x0 + x1) * cross
            rcy += (y0 + y1) * cross
        a = a / 2.0
        if a == 0:
            continue
        rcx = rcx / (6.0 * a)
        rcy = rcy / (6.0 * a)
        # Exterior ring contributes positive area; holes (later rings)
        # subtract. Use absolute area, with holes flipped negative.
        signed = a if ri == 0 else -abs(a)
        total_area += signed
        cx += rcx * signed
        cy += rcy * signed
    total_area_abs = abs(total_area)
    if total_area_abs == 0:
        return 0.0, None
    cx /= total_area
    cy /= total_area
    # convert projected centroid back to lon/lat
    lat = cy / DEG_KM
    lon = cx / (DEG_KM * math.cos(math.radians(ref_lat)))
    return total_area_abs, (lon, lat)


def feature_area_and_centroid(geometry, ref_lat):
    """Sum area over all polygons of a feature; area-weighted overall centroid."""
    total = 0.0
    cx = 0.0
    cy = 0.0
    for poly in iter_polygons(geometry):
        a, c = polygon_area_and_centroid(poly, ref_lat)
        if c is None or a == 0:
            continue
        total += a
        cx += c[0] * a
        cy += c[1] * a
    if total == 0:
        return 0.0, None
    return total, (cx / total, cy / total)


def point_in_ring(lon, lat, ring):
    """Ray-casting point-in-polygon test against a single ring of [lon, lat]."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi) + xi
        ):
            inside = not inside
        j = i
    return inside


def point_in_geometry(lon, lat, geometry):
    """True if (lon, lat) is inside a Polygon/MultiPolygon (holes respected)."""
    for poly in iter_polygons(geometry):
        if not poly:
            continue
        if point_in_ring(lon, lat, poly[0]):
            in_hole = False
            for hole in poly[1:]:
                if point_in_ring(lon, lat, hole):
                    in_hole = True
                    break
            if not in_hole:
                return True
    return False


# --------------------------------------------------------------------------
# Load data
# --------------------------------------------------------------------------

def load_features(path):
    with open(path) as f:
        return json.load(f)["features"]


def main():
    holc = load_features(HOLC_PATH)
    cca = load_features(CCA_PATH)

    # Set reference latitude from the real centers of the HOLC bounds.
    lats = []
    for ft in holc:
        b = ft["properties"].get("bounds")
        if b:
            lats.append((b[0][0] + b[1][0]) / 2.0)
    ref_lat = sum(lats) / len(lats) if lats else REF_LAT

    print("=" * 72)
    print("HISTORIC REDLINING, TREE CANOPY, AND URBAN HEAT IN CHICAGO")
    print("Original analysis: 1938 HOLC grading geometry for Chicago")
    print("=" * 72)
    print()
    print("Sources")
    print("  HOLC zones : University of Richmond Digital Scholarship Lab,")
    print("               Mapping Inequality / Home Owners' Loan Corporation,")
    print("               1938 Chicago digitization.")
    print("  Community  : City of Chicago Open Data Portal, 77 community")
    print("  areas        areas (dataset igwz-8jzy).")
    print(f"  Projection : local equirectangular, reference latitude "
          f"{ref_lat:.3f} deg N.")
    print()

    # ----------------------------------------------------------------
    # Build a clean per-zone table from the real properties + geometry.
    # ----------------------------------------------------------------
    zones = []
    for ft in holc:
        p = ft["properties"]
        grade = normalize_grade(p.get("grade"))
        area_km2, centroid = feature_area_and_centroid(ft["geometry"], ref_lat)
        zones.append(
            {
                "area_id": p.get("area_id"),
                "grade": grade,
                "area_km2": area_km2,
                "centroid": centroid,  # (lon, lat) or None
                "residential": bool(p.get("residential")),
                "commercial": bool(p.get("commercial")),
                "industrial": bool(p.get("industrial")),
            }
        )

    n_total = len(zones)
    n_geom_ok = sum(1 for z in zones if z["centroid"] is not None and z["area_km2"] > 0)

    print("-" * 72)
    print("0. DATA INTEGRITY CHECK")
    print("-" * 72)
    print(f"  HOLC features parsed                : {n_total}")
    print(f"  Features with usable polygon area   : {n_geom_ok}")
    print(f"  Features missing usable geometry    : {n_total - n_geom_ok}")
    n_graded = sum(1 for z in zones if z["grade"] in GRADE_LABEL)
    n_ungraded = sum(1 for z in zones if z["grade"] not in GRADE_LABEL)
    print(f"  Graded A-D                          : {n_graded}")
    print(f"  Ungraded (no A/B/C/D label)         : {n_ungraded}")
    print()

    # ----------------------------------------------------------------
    # 1. Grade distribution and land share (graded zones only)
    # ----------------------------------------------------------------
    print("-" * 72)
    print("1. GRADE DISTRIBUTION AND LAND SHARE (1938, graded A-D zones)")
    print("-" * 72)

    count_by_grade = defaultdict(int)
    area_by_grade = defaultdict(float)
    for z in zones:
        if z["grade"] in GRADE_LABEL:
            count_by_grade[z["grade"]] += 1
            area_by_grade[z["grade"]] += z["area_km2"]

    total_graded_area = sum(area_by_grade[g] for g in GRADE_LABEL)
    total_graded_count = sum(count_by_grade[g] for g in GRADE_LABEL)

    print(f"  {'Grade':<28}{'Zones':>7}{'Zone %':>9}"
          f"{'Area km2':>11}{'Area %':>9}")
    for g in ["A", "B", "C", "D"]:
        c = count_by_grade[g]
        a = area_by_grade[g]
        cpct = 100.0 * c / total_graded_count
        apct = 100.0 * a / total_graded_area
        print(f"  {GRADE_LABEL[g]:<28}{c:>7}{cpct:>8.1f}%"
              f"{a:>11.1f}{apct:>8.1f}%")
    print(f"  {'TOTAL graded':<28}{total_graded_count:>7}{100.0:>8.1f}%"
          f"{total_graded_area:>11.1f}{100.0:>8.1f}%")
    print()
    # Headline framing numbers
    cd_count = count_by_grade["C"] + count_by_grade["D"]
    cd_area = area_by_grade["C"] + area_by_grade["D"]
    d_area_pct = 100.0 * area_by_grade["D"] / total_graded_area
    a_area_pct = 100.0 * area_by_grade["A"] / total_graded_area
    cd_area_pct = 100.0 * cd_area / total_graded_area
    print(f"  C and D zones combined              : {cd_count} of "
          f"{total_graded_count} graded zones "
          f"({100.0*cd_count/total_graded_count:.1f}%)")
    print(f"  C and D share of graded HOLC area   : {cd_area_pct:.1f}%")
    print(f"  D ('hazardous') share of area       : {d_area_pct:.1f}%")
    print(f"  A ('best') share of area            : {a_area_pct:.1f}%")
    print(f"  Ratio of D-graded area to A-graded  : "
          f"{area_by_grade['D']/area_by_grade['A']:.1f}x")
    print()

    # ----------------------------------------------------------------
    # 2. Geographic footprint: D vs A across the city, from centroids
    # ----------------------------------------------------------------
    print("-" * 72)
    print("2. GEOGRAPHIC FOOTPRINT OF D VS A ZONES (real polygon centroids)")
    print("-" * 72)
    print("   Latitude rises going north; longitude rises (less negative)")
    print("   going east. Chicago's Loop sits near 41.88 N, -87.63 W.")
    print()

    # city-wide centroid reference (area-weighted over all graded zones)
    def grade_centroid_stats(grade):
        lons, lats, weights = [], [], []
        for z in zones:
            if z["grade"] == grade and z["centroid"] is not None:
                lons.append(z["centroid"][0])
                lats.append(z["centroid"][1])
                weights.append(z["area_km2"])
        if not lats:
            return None
        wsum = sum(weights)
        mlat = sum(la * w for la, w in zip(lats, weights)) / wsum
        mlon = sum(lo * w for lo, w in zip(lons, weights)) / wsum
        return {
            "mean_lat": mlat,
            "mean_lon": mlon,
            "min_lat": min(lats),
            "max_lat": max(lats),
            "n": len(lats),
        }

    print(f"  {'Grade':<28}{'Mean lat':>10}{'Mean lon':>11}{'Zones':>7}")
    stats = {}
    for g in ["A", "B", "C", "D"]:
        s = grade_centroid_stats(g)
        stats[g] = s
        print(f"  {GRADE_LABEL[g]:<28}{s['mean_lat']:>10.4f}"
              f"{s['mean_lon']:>11.4f}{s['n']:>7}")
    print()
    dlat = stats["A"]["mean_lat"] - stats["D"]["mean_lat"]
    print(f"  Mean A-zone centroid sits {dlat:.3f} deg of latitude NORTH")
    print(f"  of the mean D-zone centroid (about {dlat*DEG_KM:.1f} km).")
    print()

    # South/West vs North split. Loop reference.
    LOOP_LAT, LOOP_LON = 41.88, -87.63
    print("  Share of each grade's zones located SOUTH of the Loop "
          f"(lat < {LOOP_LAT}):")
    for g in ["A", "B", "C", "D"]:
        south = sum(
            1 for z in zones
            if z["grade"] == g and z["centroid"] is not None
            and z["centroid"][1] < LOOP_LAT
        )
        tot = stats[g]["n"]
        print(f"    {GRADE_LABEL[g]:<28}{south:>4} of {tot:<4} "
              f"({100.0*south/tot:>5.1f}%)")
    print()
    print("  Share of each grade's zones on the far North Side "
          f"(lat > 41.95):")
    for g in ["A", "B", "C", "D"]:
        north = sum(
            1 for z in zones
            if z["grade"] == g and z["centroid"] is not None
            and z["centroid"][1] > 41.95
        )
        tot = stats[g]["n"]
        print(f"    {GRADE_LABEL[g]:<28}{north:>4} of {tot:<4} "
              f"({100.0*north/tot:>5.1f}%)")
    print()

    # ----------------------------------------------------------------
    # 3. Residential / commercial / industrial composition by grade
    # ----------------------------------------------------------------
    print("-" * 72)
    print("3. LAND-USE FLAGS BY GRADE (residential / commercial / industrial)")
    print("-" * 72)
    print("  Counts of zones the 1930s graders marked with each use flag.")
    print()
    print(f"  {'Grade':<28}{'Resid.':>8}{'Comm.':>7}{'Indus.':>8}{'Zones':>7}")
    for g in ["A", "B", "C", "D"]:
        res = sum(1 for z in zones if z["grade"] == g and z["residential"])
        com = sum(1 for z in zones if z["grade"] == g and z["commercial"])
        ind = sum(1 for z in zones if z["grade"] == g and z["industrial"])
        tot = count_by_grade[g]
        print(f"  {GRADE_LABEL[g]:<28}{res:>8}{com:>7}{ind:>8}{tot:>7}")
    # ungraded row
    res_u = sum(1 for z in zones if z["grade"] not in GRADE_LABEL and z["residential"])
    com_u = sum(1 for z in zones if z["grade"] not in GRADE_LABEL and z["commercial"])
    ind_u = sum(1 for z in zones if z["grade"] not in GRADE_LABEL and z["industrial"])
    print(f"  {'Ungraded':<28}{res_u:>8}{com_u:>7}{ind_u:>8}{n_ungraded:>7}")
    print()
    res_all = sum(1 for z in zones if z["grade"] in GRADE_LABEL and z["residential"])
    print(f"  Of {n_graded} graded zones, {res_all} carry the residential "
          f"flag ({100.0*res_all/n_graded:.1f}%).")
    print("  Residential dominates every grade: HOLC graded neighborhoods")
    print("  where people lived, which is why the grades map onto today's")
    print("  residential heat and canopy patterns the literature reports.")
    print()

    # ----------------------------------------------------------------
    # 4. Community-area cross-walk (real spatial join)
    # ----------------------------------------------------------------
    print("-" * 72)
    print("4. PRESENT-DAY COMMUNITY AREAS TOUCHED BY EACH HOLC GRADE")
    print("-" * 72)
    print("  Spatial join: each HOLC zone's area-weighted centroid is")
    print("  located inside one of the 77 official Chicago community areas.")
    print("  A community area is 'touched' by a grade if at least one zone")
    print("  of that grade has its centroid there. This is an overlap COUNT,")
    print("  not a causal estimate.")
    print()

    n_cca = len(cca)
    # Map each zone centroid to a community area
    grades_in_cca = defaultdict(set)   # cca_name -> set of grades present
    zones_located = 0
    zones_unlocated = 0
    cca_for_grade = defaultdict(set)   # grade -> set of cca names
    for z in zones:
        c = z["centroid"]
        if c is None:
            continue
        lon, lat = c
        hit = None
        for ft in cca:
            if point_in_geometry(lon, lat, ft["geometry"]):
                hit = ft["properties"].get("community")
                break
        if hit is None:
            zones_unlocated += 1
            continue
        zones_located += 1
        if z["grade"] in GRADE_LABEL:
            grades_in_cca[hit].add(z["grade"])
            cca_for_grade[z["grade"]].add(hit)

    print(f"  Community areas in boundary file    : {n_cca}")
    print(f"  HOLC zone centroids located in a CA : {zones_located} of "
          f"{n_geom_ok}")
    print(f"  Centroids falling outside all CAs   : {zones_unlocated} "
          f"(lake/edge; reported, not dropped silently)")
    print()
    print(f"  {'Grade':<28}{'Community areas touched':>24}")
    for g in ["A", "B", "C", "D"]:
        print(f"  {GRADE_LABEL[g]:<28}{len(cca_for_grade[g]):>20} of {n_cca}")
    print()
    d_cca = cca_for_grade["D"]
    a_cca = cca_for_grade["A"]
    cd_cca = cca_for_grade["C"] | cca_for_grade["D"]
    any_cca = set().union(*[cca_for_grade[g] for g in GRADE_LABEL]) if n_graded else set()
    print(f"  Community areas with ANY graded zone      : {len(any_cca)} of {n_cca}")
    print(f"  Community areas touched by a D zone        : {len(d_cca)} of {n_cca}")
    print(f"  Community areas touched by a C OR D zone   : {len(cd_cca)} of {n_cca}")
    print(f"  Community areas touched by an A zone        : {len(a_cca)} of {n_cca}")
    d_not_a = d_cca - a_cca
    print(f"  Community areas with a D zone but NO A zone : {len(d_not_a)} of {n_cca}")
    print()
    print("  Community areas touched by a D ('hazardous') zone, alphabetical:")
    line = "    "
    for name in sorted(d_cca):
        title = name.title()
        if len(line) + len(title) + 2 > 72:
            print(line.rstrip())
            line = "    "
        line += title + ", "
    if line.strip():
        print(line.rstrip().rstrip(","))
    print()

    print("=" * 72)
    print("END. Every number above is computed from the two real GeoJSON")
    print("files in this folder. No temperature or tree-canopy value is")
    print("computed here; those disparities are reported from the cited")
    print("peer-reviewed literature in the paper text.")
    print("=" * 72)


if __name__ == "__main__":
    main()
