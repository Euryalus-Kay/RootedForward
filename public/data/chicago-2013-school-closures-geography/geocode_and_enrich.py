#!/usr/bin/env python3
"""
One-time enrichment step for the Chicago 2013 school-closures geography paper.

Inputs (real data, both shipped in this folder):
  - cps-closed-schools-2013.csv      53 schools slated for closure in the
                                      2013 CPS action, names + street addresses
                                      transcribed verbatim from the CBS Chicago
                                      primary-source list (corroborated by NBC
                                      Chicago and DNAinfo).
  - cps-active-schools-sy2016-17.csv  661 active CPS schools, SY2016-17 snapshot
                                      from the City of Chicago Data Portal
                                      (repo file, unchanged), with lat/lng and
                                      demographics.

What this does:
  1. Geocodes each closed-school street address to lat/lng using the U.S.
     Census Bureau public geocoder (Public_AR_Current benchmark). No key.
  2. Assigns a Chicago community area to every closed school AND every active
     school by point-in-polygon against the City of Chicago official
     77-community-area boundary file (Data Portal dataset igwz-8jzy).
  3. Writes two enriched CSVs the analysis reads:
       cps-closed-schools-2013-geocoded.csv
       cps-active-schools-sy2016-17-enriched.csv

Point-in-polygon is a pure-Python ray-casting test (no shapely dependency),
applied to each polygon / multipolygon ring in the boundary file.

Re-running is safe: results are deterministic given the same source files.
The geocoder is hit once per address with a short pause to be polite.
"""

import csv
import json
import os
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CLOSED_IN = os.path.join(HERE, "cps-closed-schools-2013.csv")
ACTIVE_IN = os.path.join(HERE, "cps-active-schools-sy2016-17.csv")
CA_GEOJSON = "/tmp/chicago_ca.geojson"  # official Chicago community-area boundaries
CLOSED_OUT = os.path.join(HERE, "cps-closed-schools-2013-geocoded.csv")
ACTIVE_OUT = os.path.join(HERE, "cps-active-schools-sy2016-17-enriched.csv")

UA = {"User-Agent": "rooted-forward-research/1.0 (civic research; contact site admin)"}


# ---------------------------------------------------------------- geocoding
def census_geocode(one_line_address):
    """Return (lat, lng, matched_address, zip) or (None, None, None, None)."""
    params = urllib.parse.urlencode(
        {
            "address": one_line_address,
            "benchmark": "Public_AR_Current",
            "format": "json",
        }
    )
    url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" + params
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    matches = d["result"]["addressMatches"]
    if not matches:
        return None, None, None, None
    m = matches[0]
    lat = float(m["coordinates"]["y"])
    lng = float(m["coordinates"]["x"])
    zipc = m.get("addressComponents", {}).get("zip")
    return lat, lng, m["matchedAddress"], zipc


# ------------------------------------------------------- point in polygon
def point_in_ring(lng, lat, ring):
    """Ray-casting test. ring is a list of [lng, lat] pairs."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        intersect = ((yi > lat) != (yj > lat)) and (
            lng < (xj - xi) * (lat - yi) / (yj - yi + 1e-18) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside


def point_in_polygon(lng, lat, polygon):
    """polygon is a list of rings; first ring outer, rest holes."""
    if not polygon:
        return False
    if not point_in_ring(lng, lat, polygon[0]):
        return False
    for hole in polygon[1:]:
        if point_in_ring(lng, lat, hole):
            return False
    return True


def load_community_areas():
    with open(CA_GEOJSON) as f:
        gj = json.load(f)
    feats = gj["features"]
    areas = []  # (name, geom_type, coords)
    for ft in feats:
        name = ft["properties"]["community"]
        geom = ft["geometry"]
        areas.append((name, geom["type"], geom["coordinates"]))
    return areas


def community_area_for(lng, lat, areas):
    for name, gtype, coords in areas:
        if gtype == "Polygon":
            if point_in_polygon(lng, lat, coords):
                return name
        elif gtype == "MultiPolygon":
            for poly in coords:
                if point_in_polygon(lng, lat, poly):
                    return name
    return None


# ----------------------------------------------------------------- driver
def main():
    areas = load_community_areas()
    print("Loaded %d Chicago community-area polygons." % len(areas))

    # --- closed schools: geocode + community area ---
    with open(CLOSED_IN, newline="") as f:
        closed = list(csv.DictReader(f))
    print("Geocoding %d closed-school addresses ..." % len(closed))

    failures = []
    for row in closed:
        one_line = "%s, %s, %s" % (row["street_address"], row["city"], row["state"])
        try:
            lat, lng, matched, zipc = census_geocode(one_line)
        except Exception as e:
            lat = lng = matched = zipc = None
            print("  ! geocode error for %s: %r" % (row["school_name"], e))
        if lat is None:
            failures.append(row["school_name"])
            row["latitude"] = ""
            row["longitude"] = ""
            row["zip"] = ""
            row["matched_address"] = ""
            row["community_area"] = ""
        else:
            ca = community_area_for(lng, lat, areas)
            row["latitude"] = "%.6f" % lat
            row["longitude"] = "%.6f" % lng
            row["zip"] = zipc or ""
            row["matched_address"] = matched
            row["community_area"] = ca or ""
        time.sleep(0.4)

    cols = [
        "school_name",
        "street_address",
        "city",
        "state",
        "primary_category",
        "closure_status",
        "latitude",
        "longitude",
        "zip",
        "community_area",
        "matched_address",
    ]
    with open(CLOSED_OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for row in closed:
            w.writerow({k: row.get(k, "") for k in cols})
    print("Wrote %s" % os.path.basename(CLOSED_OUT))
    if failures:
        print("  geocode FAILURES (%d): %s" % (len(failures), ", ".join(failures)))
    else:
        print("  all closed-school addresses geocoded.")

    # --- active schools: community area from existing lat/lng ---
    with open(ACTIVE_IN, newline="") as f:
        active = list(csv.DictReader(f))
    print("Assigning community areas to %d active schools ..." % len(active))
    keep = [
        "school_id",
        "short_name",
        "long_name",
        "primary_category",
        "address",
        "zip",
        "school_latitude",
        "school_longitude",
        "student_count_total",
        "student_count_low_income",
        "student_count_black",
        "student_count_hispanic",
        "student_count_white",
        "overall_rating",
        "school_year",
    ]
    unassigned = 0
    out_rows = []
    for row in active:
        try:
            lat = float(row["school_latitude"])
            lng = float(row["school_longitude"])
            ca = community_area_for(lng, lat, areas)
        except Exception:
            ca = None
        if ca is None:
            unassigned += 1
        d = {k: row.get(k, "") for k in keep}
        d["community_area"] = ca or ""
        out_rows.append(d)
    with open(ACTIVE_OUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=keep + ["community_area"])
        w.writeheader()
        w.writerows(out_rows)
    print("Wrote %s" % os.path.basename(ACTIVE_OUT))
    print("  active schools with no community-area match: %d" % unassigned)


if __name__ == "__main__":
    main()
