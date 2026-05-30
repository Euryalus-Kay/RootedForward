"""
Transit Access and Neighborhood Income Across Chicago
=====================================================

Descriptive analysis backbone for the Rooted Forward paper
"chicago-transit-access-income".

This script reads four REAL public datasets (all shipped in this folder) and
computes descriptive statistics only. It makes NO causal claims and computes NO
door-to-door travel times.

Data sources (all public, no API key required):
  1. cta-l-stops.csv
     CTA System Information - List of 'L' Stops.
     Chicago Transit Authority via City of Chicago Data Portal (Socrata 8pix-ypme).
     One row per platform/direction; dedupe by map_id for unique stations.
  2. chicago-community-areas.geojson
     Boundaries of the 77 Chicago community areas.
     City of Chicago Data Portal (Socrata igwz-8jzy). shape_area is in square
     feet (Illinois State Plane East, EPSG:3435).
  3. chicago-community-area-socioeconomic.csv
     Census Data - Selected socioeconomic indicators in Chicago, 2008-2012.
     City of Chicago Data Portal (Socrata kn9c-c2s2). Provides per-capita income
     and a hardship index for each of the 77 community areas plus a citywide row.
  4. cta-ridership-2023-annual-by-station.csv
     CTA - Ridership - 'L' Station Entries - Daily Totals (Socrata 5neh-572f),
     aggregated by this project to total 2023 entries per station_id. station_id
     in the ridership file equals map_id in the L-stops file.

The script reports missingness honestly and never imputes.
"""

import csv
import json
import math
import re
import os

HERE = os.path.dirname(os.path.abspath(__file__))

L_STOPS = os.path.join(HERE, "cta-l-stops.csv")
GEOJSON = os.path.join(HERE, "chicago-community-areas.geojson")
SOCIOECON = os.path.join(HERE, "chicago-community-area-socioeconomic.csv")
RIDERSHIP = os.path.join(HERE, "cta-ridership-2023-annual-by-station.csv")

LINE_FLAGS = ["red", "blue", "g", "brn", "p", "y", "pnk", "o"]
LINE_LABEL = {
    "red": "Red", "blue": "Blue", "g": "Green", "brn": "Brown",
    "p": "Purple", "y": "Yellow", "pnk": "Pink", "o": "Orange",
}

SQFT_PER_SQMI = 27_878_400.0  # 5280^2


# ---------------------------------------------------------------------------
# Geometry: pure-Python point-in-polygon (ray casting), handles MultiPolygon.
# ---------------------------------------------------------------------------
def point_in_ring(lon, lat, ring):
    """Ray-casting test for a point against a single linear ring [[lon,lat],...]."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-300) + xi
        ):
            inside = not inside
        j = i
    return inside


def point_in_polygon(lon, lat, polygon):
    """polygon = [outer_ring, hole1, hole2, ...]. Inside outer and not in any hole."""
    if not polygon:
        return False
    if not point_in_ring(lon, lat, polygon[0]):
        return False
    for hole in polygon[1:]:
        if point_in_ring(lon, lat, hole):
            return False
    return True


def point_in_feature(lon, lat, geometry):
    """Handle Polygon and MultiPolygon GeoJSON geometries."""
    gtype = geometry["type"]
    coords = geometry["coordinates"]
    if gtype == "Polygon":
        return point_in_polygon(lon, lat, coords)
    if gtype == "MultiPolygon":
        for poly in coords:
            if point_in_polygon(lon, lat, poly):
                return True
    return False


def bbox_of_geometry(geometry):
    """Quick reject bounding box for a geometry."""
    minx = miny = math.inf
    maxx = maxy = -math.inf

    def scan(coords):
        nonlocal minx, miny, maxx, maxy
        for x, y in coords:
            if x < minx: minx = x
            if x > maxx: maxx = x
            if y < miny: miny = y
            if y > maxy: maxy = y

    gtype = geometry["type"]
    coords = geometry["coordinates"]
    if gtype == "Polygon":
        for ring in coords:
            scan(ring)
    elif gtype == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                scan(ring)
    return minx, miny, maxx, maxy


# ---------------------------------------------------------------------------
# Load community areas (boundaries + land area in sq mi).
# ---------------------------------------------------------------------------
def load_community_areas():
    with open(GEOJSON) as f:
        gj = json.load(f)
    areas = []
    for feat in gj["features"]:
        props = feat["properties"]
        name = props["community"].strip().upper()
        area_num = str(int(props["area_numbe"]))
        shape_area_sqft = float(props["shape_area"])
        geom = feat["geometry"]
        areas.append({
            "ca": area_num,
            "name": name,
            "sq_mi": shape_area_sqft / SQFT_PER_SQMI,
            "geometry": geom,
            "bbox": bbox_of_geometry(geom),
        })
    return areas


# ---------------------------------------------------------------------------
# Load socioeconomic income per community area.
# ---------------------------------------------------------------------------
def load_socioeconomic():
    """Return {ca_number: {name, per_capita_income, hardship}} for the 77 CAs."""
    out = {}
    citywide = None
    with open(SOCIOECON, newline="") as f:
        for row in csv.DictReader(f):
            ca_raw = row["ca"].strip()
            name = row["community_area_name"].strip().upper()
            inc = row["per_capita_income_"].strip()
            hard = row["hardship_index"].strip()
            rec = {
                "name": name,
                "per_capita_income": int(inc) if inc else None,
                "hardship": int(hard) if hard else None,
            }
            if ca_raw == "" or name.startswith("CHICAGO"):
                citywide = rec
                continue
            out[str(int(float(ca_raw)))] = rec
    return out, citywide


# ---------------------------------------------------------------------------
# Load L stops, dedupe to unique stations, parse coordinates.
# ---------------------------------------------------------------------------
def parse_latlon(loc):
    if not loc:
        return (None, None)
    m = re.search(r"\(([-\d.]+),\s*([-\d.]+)\)", loc)
    if not m:
        return (None, None)
    return (float(m.group(1)), float(m.group(2)))  # (lat, lon)


def load_stations():
    """One record per unique map_id. ada True if ANY platform at the station is ADA.
       Line flags True if ANY platform carries the line."""
    rows = []
    with open(L_STOPS, newline="") as f:
        for r in csv.DictReader(f):
            lat, lon = parse_latlon(r.get("location", ""))
            rows.append({
                "stop_id": r["stop_id"],
                "map_id": r["map_id"],
                "station_name": r["station_name"].strip(),
                "ada": str(r["ada"]).strip().lower() == "true",
                "lat": lat,
                "lon": lon,
                "lines": {l: str(r[l]).strip().lower() == "true" for l in LINE_FLAGS},
            })

    stations = {}
    for r in rows:
        mid = r["map_id"]
        if mid not in stations:
            stations[mid] = {
                "map_id": mid,
                "station_name": r["station_name"],
                "ada_any": False,
                "lat": r["lat"],
                "lon": r["lon"],
                "lines": {l: False for l in LINE_FLAGS},
            }
        s = stations[mid]
        s["ada_any"] = s["ada_any"] or r["ada"]
        for l in LINE_FLAGS:
            s["lines"][l] = s["lines"][l] or r["lines"][l]
        # Keep a coordinate if the first was missing.
        if s["lat"] is None and r["lat"] is not None:
            s["lat"], s["lon"] = r["lat"], r["lon"]
    return rows, list(stations.values())


# ---------------------------------------------------------------------------
# Load 2023 ridership keyed by station_id (== map_id).
# ---------------------------------------------------------------------------
def load_ridership():
    out = {}
    with open(RIDERSHIP, newline="") as f:
        for r in csv.DictReader(f):
            out[r["station_id"].strip()] = {
                "name": r["stationname"].strip(),
                "rides": int(r["annual_rides_2023"]),
            }
    return out


# ---------------------------------------------------------------------------
# Assign each station to a community area via point-in-polygon.
# ---------------------------------------------------------------------------
def assign_stations_to_areas(stations, areas):
    for s in stations:
        s["ca"] = None
        s["ca_name"] = None
        lat, lon = s["lat"], s["lon"]
        if lat is None or lon is None:
            continue
        for a in areas:
            minx, miny, maxx, maxy = a["bbox"]
            if not (minx <= lon <= maxx and miny <= lat <= maxy):
                continue
            if point_in_feature(lon, lat, a["geometry"]):
                s["ca"] = a["ca"]
                s["ca_name"] = a["name"]
                break


def quantile(sorted_vals, q):
    """Linear-interpolation quantile on a sorted list."""
    if not sorted_vals:
        return None
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    pos = q * (len(sorted_vals) - 1)
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return sorted_vals[lo]
    frac = pos - lo
    return sorted_vals[lo] * (1 - frac) + sorted_vals[hi] * frac


def mean(xs):
    xs = [x for x in xs if x is not None]
    return sum(xs) / len(xs) if xs else float("nan")


def pearson(xs, ys):
    pairs = [(x, y) for x, y in zip(xs, ys) if x is not None and y is not None]
    if len(pairs) < 3:
        return float("nan")
    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]
    mx, my = mean(xs), mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return float("nan")
    return num / (dx * dy)


def hr():
    print("-" * 72)


# ===========================================================================
# MAIN
# ===========================================================================
def main():
    areas = load_community_areas()
    socio, citywide = load_socioeconomic()
    stop_rows, stations = load_stations()
    ridership = load_ridership()
    assign_stations_to_areas(stations, areas)

    print("=" * 72)
    print("TRANSIT ACCESS AND NEIGHBORHOOD INCOME ACROSS CHICAGO")
    print("Descriptive analysis. No causal claims, no door-to-door travel times.")
    print("=" * 72)

    # ----- Data integrity / provenance -----
    print("\n[0] DATA INTEGRITY CHECK")
    hr()
    print(f"CTA L-stop platform/direction records: {len(stop_rows)}")
    print(f"Unique rail stations (by map_id):       {len(stations)}")
    ada_rows = sum(1 for r in stop_rows if r["ada"])
    print(f"ADA-accessible stop records:            {ada_rows}")
    print(f"Non-accessible stop records:            {len(stop_rows) - ada_rows}")
    print(f"ADA share of stop records:              {100*ada_rows/len(stop_rows):.1f}%")
    print(f"Chicago community areas (boundaries):   {len(areas)}")
    print(f"Community areas with income data:       {len(socio)}")
    coords_ok = sum(1 for s in stations if s['lat'] is not None)
    print(f"Stations with valid coordinates:        {coords_ok} of {len(stations)}")
    matched = sum(1 for s in stations if s["ca"] is not None)
    print(f"Stations matched to a community area:    {matched} of {len(stations)}")
    unmatched = [s for s in stations if s["ca"] is None]
    if unmatched:
        print(f"Unmatched stations (likely suburban, outside city limits): {len(unmatched)}")
        for s in unmatched:
            print(f"    - {s['station_name']} ({s['lat']}, {s['lon']})")
    rship_total_2023 = sum(v["rides"] for v in ridership.values())
    print(f"Stations with 2023 ridership totals:    {len(ridership)}")
    print(f"Total CTA rail entries, full-year 2023: {rship_total_2023:,}")

    # ----- Per community area: station counts, density, income -----
    ca_stats = {}
    for a in areas:
        ca_stats[a["ca"]] = {
            "name": a["name"],
            "sq_mi": a["sq_mi"],
            "n_stations": 0,
            "n_ada": 0,
            "income": socio.get(a["ca"], {}).get("per_capita_income"),
            "hardship": socio.get(a["ca"], {}).get("hardship"),
            "lines": set(),
            "rides": 0,
        }
    for s in stations:
        if s["ca"] is None:
            continue
        cs = ca_stats[s["ca"]]
        cs["n_stations"] += 1
        if s["ada_any"]:
            cs["n_ada"] += 1
        for l in LINE_FLAGS:
            if s["lines"][l]:
                cs["lines"].add(l)
        r = ridership.get(s["map_id"])
        if r:
            cs["rides"] += r["rides"]
    for cs in ca_stats.values():
        cs["density"] = cs["n_stations"] / cs["sq_mi"] if cs["sq_mi"] else 0.0

    served = [cs for cs in ca_stats.values() if cs["n_stations"] > 0]
    unserved = [cs for cs in ca_stats.values() if cs["n_stations"] == 0]
    print("\n[1] RAIL FOOTPRINT ACROSS THE 77 COMMUNITY AREAS")
    hr()
    print(f"Community areas with at least one rail station: {len(served)} of {len(ca_stats)}")
    print(f"Community areas with NO rail station:           {len(unserved)} of {len(ca_stats)}")

    # ----- Income quartiles across all 77 CAs -----
    inc_vals = sorted(cs["income"] for cs in ca_stats.values() if cs["income"] is not None)
    q1 = quantile(inc_vals, 0.25)
    q2 = quantile(inc_vals, 0.50)
    q3 = quantile(inc_vals, 0.75)
    print("\n[2] PER-CAPITA INCOME DISTRIBUTION ACROSS COMMUNITY AREAS")
    hr()
    print(f"Community areas with income data: {len(inc_vals)}")
    print(f"Min per-capita income:    ${min(inc_vals):,}")
    print(f"Q1 (25th percentile):     ${q1:,.0f}")
    print(f"Median (50th percentile): ${q2:,.0f}")
    print(f"Q3 (75th percentile):     ${q3:,.0f}")
    print(f"Max per-capita income:    ${max(inc_vals):,}")

    def income_quartile(inc):
        if inc is None:
            return None
        if inc <= q1:
            return "Q1 lowest income"
        if inc <= q2:
            return "Q2"
        if inc <= q3:
            return "Q3"
        return "Q4 highest income"

    QORDER = ["Q1 lowest income", "Q2", "Q3", "Q4 highest income"]

    # ----- A1: rail access by income quartile -----
    print("\n[3] RAIL ACCESS BY INCOME QUARTILE OF COMMUNITY AREA")
    print("    (community areas grouped into income quartiles; counts summed)")
    hr()
    print(f"{'Income group':<20}{'CAs':>5}{'Stations':>10}{'Land sq mi':>12}"
          f"{'Stns/sq mi':>12}{'% CAs served':>14}")
    quartile_density_for_chart = {}
    quartile_servedshare_for_chart = {}
    for ql in QORDER:
        grp = [cs for cs in ca_stats.values() if income_quartile(cs["income"]) == ql]
        n_ca = len(grp)
        n_st = sum(cs["n_stations"] for cs in grp)
        sqmi = sum(cs["sq_mi"] for cs in grp)
        dens = n_st / sqmi if sqmi else 0.0
        served_share = 100 * sum(1 for cs in grp if cs["n_stations"] > 0) / n_ca if n_ca else 0.0
        quartile_density_for_chart[ql] = dens
        quartile_servedshare_for_chart[ql] = served_share
        print(f"{ql:<20}{n_ca:>5}{n_st:>10}{sqmi:>12.1f}{dens:>12.2f}{served_share:>13.0f}%")

    # ----- A2: ADA accessibility by income quartile -----
    print("\n[4] STEP-FREE (ADA) STATION ACCESS BY INCOME QUARTILE")
    print("    (share of stations in the group that are ADA-accessible)")
    hr()
    print(f"{'Income group':<20}{'Stations':>10}{'ADA stations':>14}{'ADA share':>12}")
    ada_share_for_chart = {}
    for ql in QORDER:
        grp = [cs for cs in ca_stats.values() if income_quartile(cs["income"]) == ql]
        n_st = sum(cs["n_stations"] for cs in grp)
        n_ada = sum(cs["n_ada"] for cs in grp)
        share = 100 * n_ada / n_st if n_st else 0.0
        ada_share_for_chart[ql] = share
        print(f"{ql:<20}{n_st:>10}{n_ada:>14}{share:>11.1f}%")
    # Citywide station-level ADA share for reference.
    tot_st = sum(cs["n_stations"] for cs in ca_stats.values())
    tot_ada = sum(cs["n_ada"] for cs in ca_stats.values())
    print(f"{'All city stations':<20}{tot_st:>10}{tot_ada:>14}"
          f"{100*tot_ada/tot_st:>11.1f}%")

    # ----- A4: ridership-by-income profile -----
    print("\n[5] 2023 RIDERSHIP PROFILE BY INCOME QUARTILE")
    print("    (total full-year 2023 entries at stations within each income group)")
    hr()
    print(f"{'Income group':<20}{'Stations':>10}{'2023 entries':>16}{'Entries/station':>18}")
    for ql in QORDER:
        grp = [cs for cs in ca_stats.values() if income_quartile(cs["income"]) == ql]
        n_st = sum(cs["n_stations"] for cs in grp)
        rides = sum(cs["rides"] for cs in grp)
        per = rides / n_st if n_st else 0.0
        print(f"{ql:<20}{n_st:>10}{rides:>16,}{per:>18,.0f}")

    # ----- A5: line coverage and South/West gaps -----
    print("\n[6] RAIL-LINE COVERAGE BY NUMBER OF COMMUNITY AREAS SERVED")
    hr()
    print(f"{'Line':<10}{'Stations':>10}{'Community areas served':>26}")
    line_ca_count = {}
    for l in LINE_FLAGS:
        n_st = sum(1 for s in stations if s["lines"][l] and s["ca"] is not None)
        cas = {s["ca"] for s in stations if s["lines"][l] and s["ca"] is not None}
        line_ca_count[l] = len(cas)
        print(f"{LINE_LABEL[l]:<10}{n_st:>10}{len(cas):>26}")

    # Unserved community areas with their income, to surface the South/West pattern.
    print("\n[7] COMMUNITY AREAS WITH NO RAIL STATION, RANKED BY INCOME (LOWEST FIRST)")
    print("    (illustrates that many rail gaps sit in lower-income areas)")
    hr()
    uns_with_inc = sorted(
        [cs for cs in unserved if cs["income"] is not None],
        key=lambda c: c["income"],
    )
    print(f"Unserved community areas with income data: {len(uns_with_inc)}")
    print(f"{'Community area':<28}{'Per-capita income':>18}{'Hardship':>10}")
    for cs in uns_with_inc[:15]:
        print(f"{cs['name'].title():<28}${cs['income']:>16,}{cs['hardship'] if cs['hardship'] is not None else 'NA':>10}")
    med_inc_unserved = quantile(sorted(c["income"] for c in uns_with_inc), 0.5)
    med_inc_served = quantile(
        sorted(cs["income"] for cs in served if cs["income"] is not None), 0.5)
    print(f"\nMedian per-capita income, UNSERVED community areas: ${med_inc_unserved:,.0f}")
    print(f"Median per-capita income, SERVED community areas:   ${med_inc_served:,.0f}")

    # ----- Top rail-density community areas for context -----
    print("\n[8] TOP 10 COMMUNITY AREAS BY RAIL STATION DENSITY")
    hr()
    print(f"{'Community area':<24}{'Stations':>9}{'Stns/sq mi':>12}{'Per-cap income':>16}")
    for cs in sorted(served, key=lambda c: c["density"], reverse=True)[:10]:
        inc = f"${cs['income']:,}" if cs["income"] is not None else "NA"
        print(f"{cs['name'].title():<24}{cs['n_stations']:>9}{cs['density']:>12.2f}{inc:>16}")

    # ----- Correlation: income vs station density across served CAs -----
    print("\n[9] DESCRIPTIVE CORRELATION (no causal claim)")
    hr()
    inc_list = [cs["income"] for cs in ca_stats.values()]
    dens_list = [cs["density"] for cs in ca_stats.values()]
    r_inc_dens = pearson(inc_list, dens_list)
    hard_list = [cs["hardship"] for cs in ca_stats.values()]
    r_hard_dens = pearson(hard_list, dens_list)
    print(f"Pearson r, per-capita income vs station density (77 CAs): {r_inc_dens:+.3f}")
    print(f"Pearson r, hardship index vs station density (77 CAs):    {r_hard_dens:+.3f}")
    print("Interpretation note: a positive income-density r and a negative")
    print("hardship-density r both describe the same pattern, namely rail density")
    print("tends to be higher in higher-income, lower-hardship community areas.")
    print("This is descriptive only.")

    print("\n" + "=" * 72)
    print("END OF ANALYSIS")
    print("=" * 72)


if __name__ == "__main__":
    main()
