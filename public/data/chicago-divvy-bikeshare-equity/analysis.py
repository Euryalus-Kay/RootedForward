"""
Who the Divvy Bikeshare System Actually Reaches
===============================================

Descriptive analysis backbone for the Rooted Forward paper
"chicago-divvy-bikeshare-equity".

This script reads four REAL public datasets (all shipped in this folder) and
computes descriptive statistics ONLY. It makes NO rider-level demographic claim
and NO causal claim. It is a dated, geographic map of where Divvy docks and
trips land relative to neighborhood income and racial composition, plus how the
annual-member-versus-casual mix (the only rider category Divvy reports) varies
by area.

Data sources (all public, no API key required):
  1. divvy-bicycle-stations.csv
     Divvy Bicycle Stations, current active station roster.
     City of Chicago Data Portal (Socrata bbyy-e7gq). One row per station with
     total_docks, docks_in_service, status, latitude, longitude.
  2. chicago-community-areas.geojson
     Boundaries of the 77 Chicago community areas.
     City of Chicago Data Portal (Socrata igwz-8jzy). shape_area is in square
     feet (Illinois State Plane East, EPSG:3435).
  3. chicago-community-area-acs-2023.csv
     ACS 5 Year Data by Community Area, most recent year = 2023.
     City of Chicago Data Portal (Socrata 7umk-8dtw). Provides, per community
     area, household-income brackets (under_25_000 ... _125_000), total
     population, and race/ethnicity counts (white_not_hispanic_or_latino,
     hispanic_or_latino, black_or_african_american, asian, etc.).
  4. divvy-trips-2024-by-start-station.csv
     A compact per-start-station summary the project built by aggregating the
     real Divvy public trip files for four seasonal months of 2024
     (January, April, July, October), one month per season so the
     member-vs-casual mix is not biased by the summer casual spike. Raw trips
     are never shipped. Columns: trips, member_trips, casual_trips,
     classic_trips, electric_trips, docked_trips, mean_start_lat/lng,
     dist_sum_m and dist_n (for a straight-line mean trip distance).

Definitions used (stated plainly, no hidden imputation):
  - "Residents of color" share = (total_population - white_not_hispanic_or_latino)
    / total_population. This follows the ACS practice of treating
    white-alone-not-Hispanic as the reference and everyone else as people of
    color. It is a population share, not a rider share.
  - "Lower income" is proxied by the share of households earning under $50,000
    (under_25_000 + _25_000_to_49_999 as a share of all five income brackets).
    The City ACS extract reports brackets, not a single median, so we do not
    invent a median.
  - A station's community area is the polygon that contains its point.
  - A trip's community area is the polygon that contains its mean start point.

Missingness is reported, never silently imputed.
"""

import csv
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
STATIONS = os.path.join(HERE, "divvy-bicycle-stations.csv")
GEOJSON = os.path.join(HERE, "chicago-community-areas.geojson")
ACS = os.path.join(HERE, "chicago-community-area-acs-2023.csv")
TRIPS = os.path.join(HERE, "divvy-trips-2024-by-start-station.csv")

SQFT_PER_SQMI = 27_878_400.0  # 5280^2


# ---------------------------------------------------------------------------
# Geometry: pure-Python point-in-polygon (ray casting), handles MultiPolygon.
# ---------------------------------------------------------------------------
def point_in_ring(lon, lat, ring):
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
    if not polygon:
        return False
    if not point_in_ring(lon, lat, polygon[0]):
        return False
    for hole in polygon[1:]:
        if point_in_ring(lon, lat, hole):
            return False
    return True


def point_in_feature(lon, lat, geometry):
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
# Loaders
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


def fnum(s):
    s = (s or "").strip()
    if s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def load_acs():
    """Return {CA_NAME_UPPER: {...}} with population, race, income brackets."""
    out = {}
    with open(ACS, newline="") as f:
        for r in csv.DictReader(f):
            name = r["community_area"].strip().upper()
            total = fnum(r["total_population"])
            white_nh = fnum(r["white_not_hispanic_or_latino"])
            under25 = fnum(r["under_25_000"]) or 0
            b25_50 = fnum(r["_25_000_to_49_999"]) or 0
            b50_75 = fnum(r["_50_000_to_74_999"]) or 0
            b75_125 = fnum(r["_75_000_to_125_000"]) or 0
            b125 = fnum(r["_125_000"]) or 0
            hh_total = under25 + b25_50 + b50_75 + b75_125 + b125
            poc_share = None
            if total and total > 0 and white_nh is not None:
                poc_share = 100.0 * (total - white_nh) / total
            low_inc_share = None
            if hh_total > 0:
                low_inc_share = 100.0 * (under25 + b25_50) / hh_total
            out[name] = {
                "name": name,
                "total_population": total,
                "white_nh": white_nh,
                "black": fnum(r["black_or_african_american"]),
                "asian": fnum(r["asian"]),
                "hispanic": fnum(r["hispanic_or_latino"]),
                "households": hh_total,
                "low_income_share": low_inc_share,   # % households < $50k
                "poc_share": poc_share,              # % residents of color
            }
    return out


def load_stations():
    rows = []
    with open(STATIONS, newline="") as f:
        for r in csv.DictReader(f):
            lat = fnum(r["latitude"])
            lon = fnum(r["longitude"])
            rows.append({
                "id": r["id"].strip(),
                "name": r["station_name"].strip(),
                "total_docks": fnum(r["total_docks"]),
                "docks_in_service": fnum(r["docks_in_service"]),
                "status": r["status"].strip(),
                "lat": lat,
                "lon": lon,
            })
    return rows


def load_trips():
    rows = []
    with open(TRIPS, newline="") as f:
        for r in csv.DictReader(f):
            rows.append({
                "id": r["start_station_id"].strip(),
                "name": r["start_station_name"].strip(),
                "trips": int(r["trips"]),
                "member": int(r["member_trips"]),
                "casual": int(r["casual_trips"]),
                "classic": int(r["classic_trips"]),
                "electric": int(r["electric_trips"]),
                "docked": int(r["docked_trips"]),
                "lat": fnum(r["mean_start_lat"]),
                "lon": fnum(r["mean_start_lng"]),
                "dist_sum_m": float(r["dist_sum_m"]) if r["dist_sum_m"] else 0.0,
                "dist_n": int(r["dist_n"]),
            })
    return rows


def assign_to_areas(items, areas):
    """Add 'ca' / 'ca_name' to each item via point-in-polygon on (lon,lat)."""
    for it in items:
        it["ca"] = None
        it["ca_name"] = None
        lat, lon = it["lat"], it["lon"]
        if lat is None or lon is None:
            continue
        for a in areas:
            minx, miny, maxx, maxy = a["bbox"]
            if not (minx <= lon <= maxx and miny <= lat <= maxy):
                continue
            if point_in_feature(lon, lat, a["geometry"]):
                it["ca"] = a["ca"]
                it["ca_name"] = a["name"]
                break


# ---------------------------------------------------------------------------
# Small stats helpers
# ---------------------------------------------------------------------------
def quantile(sorted_vals, q):
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
    xs = [p[0] for p in pairs]; ys = [p[1] for p in pairs]
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
    acs = load_acs()
    stations = load_stations()
    trips = load_trips()
    assign_to_areas(stations, areas)
    assign_to_areas(trips, areas)

    print("=" * 72)
    print("WHO THE DIVVY BIKESHARE SYSTEM ACTUALLY REACHES")
    print("Descriptive geographic analysis. No rider-level or causal claims.")
    print("=" * 72)

    # ----- [0] Data integrity / provenance -----
    print("\n[0] DATA INTEGRITY AND MISSINGNESS")
    hr()
    print(f"Divvy stations in roster:                {len(stations)}")
    in_service = sum(1 for s in stations if s["status"].lower() == "in service")
    print(f"  status 'In Service':                   {in_service}")
    print(f"  other status:                          {len(stations) - in_service}")
    coords_ok = sum(1 for s in stations if s["lat"] is not None)
    print(f"  with valid coordinates:                {coords_ok}")
    matched_st = sum(1 for s in stations if s["ca"] is not None)
    print(f"  matched to a Chicago community area:    {matched_st}")
    unmatched_st = [s for s in stations if s["ca"] is None and s["lat"] is not None]
    print(f"  outside the 77 community areas (suburban): {len(unmatched_st)}")
    tot_docks = sum(s["total_docks"] for s in stations if s["total_docks"])
    print(f"Total docks across roster:               {tot_docks:,.0f}")

    print(f"\nCommunity areas (boundaries):            {len(areas)}")
    print(f"Community areas with ACS 2023 data:      {len(acs)}")
    pop_total = sum(v['total_population'] for v in acs.values()
                    if v['total_population'])
    print(f"Citywide population (sum of CAs, ACS5 2023): {pop_total:,.0f}")

    tot_trips = sum(t["trips"] for t in trips)
    matched_trips = sum(t["trips"] for t in trips if t["ca"] is not None)
    print(f"\nTrip-summary start stations:             {len(trips)}")
    print(f"Trips in 4-month sample (Jan/Apr/Jul/Oct 2024): {tot_trips:,}")
    print(f"  trips matched to a community area:      {matched_trips:,} "
          f"({100*matched_trips/tot_trips:.1f}%)")
    print(f"  trips at start stations outside the 77 CAs: "
          f"{tot_trips - matched_trips:,}")
    print("NOTE: the raw Divvy files also contained 338,070 dockless trips with")
    print("no start_station_id (17.6% of 1,925,141 raw rows). Those have no")
    print("fixed origin and are excluded from every station-based number below.")

    # ----- Per community area aggregation -----
    ca = {}
    for a in areas:
        info = acs.get(a["name"], {})
        ca[a["ca"]] = {
            "name": a["name"],
            "sq_mi": a["sq_mi"],
            "pop": info.get("total_population"),
            "poc_share": info.get("poc_share"),
            "low_income_share": info.get("low_income_share"),
            "n_stations": 0,
            "docks": 0,
            "trips": 0,
            "member": 0,
            "casual": 0,
            "electric": 0,
            "classic": 0,
            "dist_sum_m": 0.0,
            "dist_n": 0,
        }
    for s in stations:
        if s["ca"] is None:
            continue
        ca[s["ca"]]["n_stations"] += 1
        if s["total_docks"]:
            ca[s["ca"]]["docks"] += s["total_docks"]
    for t in trips:
        if t["ca"] is None:
            continue
        c = ca[t["ca"]]
        c["trips"] += t["trips"]
        c["member"] += t["member"]
        c["casual"] += t["casual"]
        c["electric"] += t["electric"]
        c["classic"] += t["classic"]
        c["dist_sum_m"] += t["dist_sum_m"]
        c["dist_n"] += t["dist_n"]
    for c in ca.values():
        c["stations_per_10k"] = (
            10_000.0 * c["n_stations"] / c["pop"] if c["pop"] else None)
        c["docks_per_10k"] = (
            10_000.0 * c["docks"] / c["pop"] if c["pop"] else None)

    served = [c for c in ca.values() if c["n_stations"] > 0]
    unserved = [c for c in ca.values() if c["n_stations"] == 0]
    print("\n[1] STATION FOOTPRINT ACROSS THE 77 COMMUNITY AREAS")
    hr()
    print(f"Community areas with at least one Divvy station: {len(served)} of 77")
    print(f"Community areas with NO Divvy station:           {len(unserved)} of 77")
    if unserved:
        print("Unserved community areas (name, % residents of color, % HH < $50k):")
        for c in sorted(unserved,
                        key=lambda x: (x["poc_share"] is None, -(x["poc_share"] or 0))):
            poc = f"{c['poc_share']:.0f}%" if c['poc_share'] is not None else "NA"
            li = f"{c['low_income_share']:.0f}%" if c['low_income_share'] is not None else "NA"
            print(f"    - {c['name'].title():<26} POC {poc:>5}   <$50k {li:>5}")

    # ----- [2] Distributions for classification cut points -----
    poc_vals = sorted(v["poc_share"] for v in ca.values() if v["poc_share"] is not None)
    inc_vals = sorted(v["low_income_share"] for v in ca.values()
                      if v["low_income_share"] is not None)
    poc_med = quantile(poc_vals, 0.5)
    inc_med = quantile(inc_vals, 0.5)
    print("\n[2] HOW NEIGHBORHOODS ARE CLASSIFIED (ACS 2023, 77 community areas)")
    hr()
    print(f"% residents of color:  min {min(poc_vals):.0f}  median {poc_med:.0f}  "
          f"max {max(poc_vals):.0f}")
    print(f"% households < $50k:   min {min(inc_vals):.0f}  median {inc_med:.0f}  "
          f"max {max(inc_vals):.0f}")
    print(f"Median split used below: POC at {poc_med:.1f}% , income at {inc_med:.1f}%")

    # ----- [3] Station and dock supply by % residents of color (quartiles) -----
    def quartile_label_by(vals_sorted, value):
        q1 = quantile(vals_sorted, 0.25)
        q2 = quantile(vals_sorted, 0.50)
        q3 = quantile(vals_sorted, 0.75)
        if value is None:
            return None
        if value <= q1: return "Q1"
        if value <= q2: return "Q2"
        if value <= q3: return "Q3"
        return "Q4"

    QORDER = ["Q1", "Q2", "Q3", "Q4"]

    def group_block(title, keyfn, vals_sorted, q_desc):
        print(f"\n{title}")
        hr()
        print(f"{'Group':<28}{'CAs':>4}{'Pop':>11}{'Stations':>10}"
              f"{'Docks':>8}{'Stns/10k':>10}{'Docks/10k':>11}")
        chart = {}
        for ql in QORDER:
            grp = [c for c in ca.values()
                   if quartile_label_by(vals_sorted, keyfn(c)) == ql]
            pop = sum(c["pop"] for c in grp if c["pop"])
            nst = sum(c["n_stations"] for c in grp)
            dk = sum(c["docks"] for c in grp)
            s10 = 10_000.0 * nst / pop if pop else 0.0
            d10 = 10_000.0 * dk / pop if pop else 0.0
            label = f"{ql} {q_desc[ql]}"
            chart[ql] = {"stns_per_10k": s10, "docks_per_10k": d10,
                         "stations": nst, "docks": dk, "pop": pop,
                         "n_ca": len(grp)}
            print(f"{label:<28}{len(grp):>4}{pop:>11,.0f}{nst:>10}"
                  f"{dk:>8,.0f}{s10:>10.2f}{d10:>11.2f}")
        return chart

    poc_desc = {"Q1": "whitest", "Q2": "", "Q3": "", "Q4": "most POC"}
    inc_desc = {"Q1": "highest income", "Q2": "", "Q3": "", "Q4": "lowest income"}

    poc_chart = group_block(
        "[3] DIVVY SUPPLY BY NEIGHBORHOOD RACIAL COMPOSITION (POC quartiles)",
        lambda c: c["poc_share"], poc_vals, poc_desc)
    inc_chart = group_block(
        "[4] DIVVY SUPPLY BY NEIGHBORHOOD INCOME (% households under $50k, quartiles)",
        lambda c: c["low_income_share"], inc_vals, inc_desc)

    # ----- [5] Member vs casual mix by area type (two-way split) -----
    print("\n[5] MEMBER VS CASUAL MIX BY AREA TYPE")
    print("    Area type = median split on income AND on % residents of color.")
    print("    'Member share' = member_trips / (member + casual) in the 4-mo sample.")
    hr()

    def area_type(c):
        if c["low_income_share"] is None or c["poc_share"] is None:
            return None
        hi_income = c["low_income_share"] <= inc_med   # at/below median low-inc share
        whiter = c["poc_share"] <= poc_med
        if hi_income and whiter:
            return "Higher-income, whiter"
        if (not hi_income) and (not whiter):
            return "Lower-income, more POC"
        return "Mixed"

    TYPES = ["Higher-income, whiter", "Mixed", "Lower-income, more POC"]
    member_chart = {}
    print(f"{'Area type':<26}{'CAs':>4}{'Stations':>10}{'Trips':>12}"
          f"{'Member %':>10}{'Casual %':>10}")
    for ty in TYPES:
        grp = [c for c in ca.values() if area_type(c) == ty]
        nst = sum(c["n_stations"] for c in grp)
        tr = sum(c["trips"] for c in grp)
        mem = sum(c["member"] for c in grp)
        cas = sum(c["casual"] for c in grp)
        denom = mem + cas
        mshare = 100.0 * mem / denom if denom else 0.0
        cshare = 100.0 * cas / denom if denom else 0.0
        member_chart[ty] = {"member_share": mshare, "casual_share": cshare,
                            "trips": tr, "stations": nst, "n_ca": len(grp)}
        print(f"{ty:<26}{len(grp):>4}{nst:>10}{tr:>12,}{mshare:>9.1f}%{cshare:>9.1f}%")
    citywide_mem = sum(c["member"] for c in ca.values())
    citywide_cas = sum(c["casual"] for c in ca.values())
    cw_denom = citywide_mem + citywide_cas
    print(f"{'All matched CAs':<26}{'':>4}{'':>10}{cw_denom:>12,}"
          f"{100*citywide_mem/cw_denom:>9.1f}%{100*citywide_cas/cw_denom:>9.1f}%")

    # ----- [6] Trip volume concentration (top-decile stations) -----
    print("\n[6] TRIP VOLUME CONCENTRATION")
    hr()
    matched_trip_rows = [t for t in trips if t["ca"] is not None]
    matched_trip_rows.sort(key=lambda t: -t["trips"])
    n = len(matched_trip_rows)
    top_decile_n = max(1, n // 10)
    top_decile_trips = sum(t["trips"] for t in matched_trip_rows[:top_decile_n])
    all_matched_trips = sum(t["trips"] for t in matched_trip_rows)
    print(f"Start stations matched to a CA:           {n}")
    print(f"Top-decile stations (count):              {top_decile_n}")
    print(f"Share of all matched trips from top decile: "
          f"{100*top_decile_trips/all_matched_trips:.1f}%")
    print("Top 10 origin stations (station, community area, trips):")
    for t in matched_trip_rows[:10]:
        print(f"    {t['name']:<32}{ca[t['ca']]['name'].title():<20}{t['trips']:>8,}")

    # Concentration by area type.
    print("\nShare of all matched trips originating in each area type:")
    for ty in TYPES:
        grp_ids = {c_ca for c_ca, c in ca.items() if area_type(c) == ty}
        tr = sum(t["trips"] for t in matched_trip_rows if t["ca"] in grp_ids)
        print(f"    {ty:<26}{tr:>12,}  ({100*tr/all_matched_trips:>4.1f}% of trips)")

    # ----- [7] E-bike mix and trip distance by area type -----
    print("\n[7] E-BIKE SHARE AND MEAN STRAIGHT-LINE TRIP DISTANCE BY AREA TYPE")
    print("    Distance = haversine(start,end); only trips with both coords (see dist_n).")
    hr()
    print(f"{'Area type':<26}{'Trips':>12}{'E-bike %':>10}{'Classic %':>11}"
          f"{'Mean dist (km)':>16}")
    ebike_chart = {}
    for ty in TYPES:
        grp = [c for c in ca.values() if area_type(c) == ty]
        tr = sum(c["trips"] for c in grp)
        ele = sum(c["electric"] for c in grp)
        cla = sum(c["classic"] for c in grp)
        rt_denom = ele + cla
        eshare = 100.0 * ele / rt_denom if rt_denom else 0.0
        cshare = 100.0 * cla / rt_denom if rt_denom else 0.0
        dsum = sum(c["dist_sum_m"] for c in grp)
        dn = sum(c["dist_n"] for c in grp)
        mean_km = (dsum / dn) / 1000.0 if dn else float("nan")
        ebike_chart[ty] = {"ebike_share": eshare, "mean_km": mean_km, "trips": tr}
        print(f"{ty:<26}{tr:>12,}{eshare:>9.1f}%{cshare:>10.1f}%{mean_km:>16.2f}")

    # ----- [8] Descriptive correlations across the 77 CAs (no causal claim) -----
    print("\n[8] DESCRIPTIVE CORRELATIONS ACROSS COMMUNITY AREAS (no causal claim)")
    hr()
    poc_list = [c["poc_share"] for c in ca.values()]
    inc_list = [c["low_income_share"] for c in ca.values()]
    d10_list = [c["docks_per_10k"] for c in ca.values()]
    s10_list = [c["stations_per_10k"] for c in ca.values()]
    r_poc_docks = pearson(poc_list, d10_list)
    r_inc_docks = pearson(inc_list, d10_list)
    r_poc_st = pearson(poc_list, s10_list)
    print(f"Pearson r, % residents of color  vs docks per 10k:    {r_poc_docks:+.3f}")
    print(f"Pearson r, % households < $50k    vs docks per 10k:    {r_inc_docks:+.3f}")
    print(f"Pearson r, % residents of color  vs stations per 10k: {r_poc_st:+.3f}")
    print("Interpretation note: negative values mean dock and station supply per")
    print("resident tends to be LOWER in higher-POC and lower-income community")
    print("areas. Descriptive only, over served and unserved areas alike.")

    # ----- [9] Member share vs neighborhood demographics (station-weighted) -----
    print("\n[9] MEMBER SHARE VS NEIGHBORHOOD DEMOGRAPHICS (CA-level, served CAs)")
    hr()
    served_ca = [c for c in ca.values()
                 if c["trips"] > 0 and c["poc_share"] is not None]
    mshare_list = [100.0 * c["member"] / (c["member"] + c["casual"])
                   if (c["member"] + c["casual"]) else None for c in served_ca]
    poc_served = [c["poc_share"] for c in served_ca]
    inc_served = [c["low_income_share"] for c in served_ca]
    r_poc_member = pearson(poc_served, mshare_list)
    r_inc_member = pearson(inc_served, mshare_list)
    print(f"Served community areas with trips:        {len(served_ca)}")
    print(f"Pearson r, % residents of color vs member share: {r_poc_member:+.3f}")
    print(f"Pearson r, % HH < $50k vs member share:          {r_inc_member:+.3f}")
    print("Note: a positive POC-vs-member r would mean higher-POC served areas")
    print("lean MORE toward annual members and less toward casual riders.")

    print("\n" + "=" * 72)
    print("END OF ANALYSIS")
    print("=" * 72)


if __name__ == "__main__":
    main()
