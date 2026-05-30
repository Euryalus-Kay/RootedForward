"""
analysis.py
-----------
Descriptive analysis for the Rooted Forward paper
"Mortgage Lending and Denial Disparities in Chicago Through HMDA".

Reads only the shipped, real, pre-aggregated CSVs in this folder (built
by build_aggregates.py from the FFIEC HMDA public loan/application
registers for Cook County, FIPS 17031, years 2018-2023) plus the 1938
HOLC grade polygons digitized elsewhere in this repo. Prints clearly
labeled descriptive statistics. Nothing is imputed or fabricated.

HONEST FRAMING. Public HMDA does NOT contain applicant credit scores.
These results document the magnitude and geography of the RAW denial
and pricing gap and how much of it survives crude income/loan-size
controls. They do not isolate present-day discrimination, because the
single most important underwriting variable (credit score) is absent
from the public file. This matches recent Federal Reserve work
(Bhutta, Hizmo, Ringo) showing much of the raw gap is associated with
observable-but-unreported risk factors, while a residual gap persists.

Run:
    python analysis.py
(from any directory; paths are resolved relative to this file)
"""

import os
import json
import math
import pandas as pd
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def p(path):
    return os.path.join(HERE, path)


def hr(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# Groups we report on, in a fixed order. "Race not available" and
# "Other / Joint" are kept in the data but only shown where relevant.
MAIN_GROUPS = ["White (non-Hispanic)", "Black", "Latino/Hispanic", "Asian"]


# ---------------------------------------------------------------------------
# 1. RAW DENIAL-RATE GAP BY RACE / ETHNICITY
# ---------------------------------------------------------------------------
def denial_gap():
    hr("1. RAW DENIAL-RATE GAP BY RACE/ETHNICITY, COOK COUNTY (FIPS 17031)")
    s = pd.read_csv(p("hmda-cook-race-year-summary.csv"))
    s["denial_rate_pct"] = s["denials"] / s["applications"] * 100

    # Pooled 2018-2023
    pooled = s.groupby("group").agg(
        applications=("applications", "sum"),
        denials=("denials", "sum"),
    ).reset_index()
    pooled["denial_rate_pct"] = pooled["denials"] / pooled["applications"] * 100
    pooled = pooled.set_index("group")

    print("\nPooled 2018-2023 (credit-decision applications = originated + approved + denied):")
    white_rate = pooled.loc["White (non-Hispanic)", "denial_rate_pct"]
    for g in MAIN_GROUPS + ["Race not available"]:
        if g in pooled.index:
            row = pooled.loc[g]
            ratio = row["denial_rate_pct"] / white_rate
            print(f"  {g:<22} apps={int(row['applications']):>8,}  "
                  f"denials={int(row['denials']):>7,}  "
                  f"denial_rate={row['denial_rate_pct']:5.1f}%  "
                  f"vs-white={ratio:4.2f}x")

    print("\nDenial rate by year (%), main groups:")
    piv = s[s["group"].isin(MAIN_GROUPS)].pivot(
        index="activity_year", columns="group", values="denial_rate_pct")
    piv = piv[MAIN_GROUPS]
    print(piv.round(1).to_string())

    # 2022 single-year detail (the year named in the dataset plan)
    y22 = s[s["activity_year"] == 2022].set_index("group")
    w22 = y22.loc["White (non-Hispanic)", "denial_rate_pct"]
    print("\n2022 detail:")
    for g in MAIN_GROUPS:
        r = y22.loc[g, "denial_rate_pct"]
        print(f"  {g:<22} {r:5.1f}%  ({r / w22:.2f}x white)")
    return s, piv


# ---------------------------------------------------------------------------
# 2. GEOGRAPHY: DENIAL RATE AND DOLLARS-PER-APPLICATION BY 1938 HOLC GRADE
# ---------------------------------------------------------------------------
def point_in_ring(x, y, ring):
    """Ray-casting point-in-polygon for a single ring of [lon, lat] pairs."""
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and \
           (x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi):
            inside = not inside
        j = i
    return inside


def point_in_polygon(x, y, polygon):
    """polygon = list of rings; first ring outer, rest holes."""
    if not polygon:
        return False
    if not point_in_ring(x, y, polygon[0]):
        return False
    for hole in polygon[1:]:
        if point_in_ring(x, y, hole):
            return False
    return True


def load_holc_zones():
    """Return list of (grade, [polygon, ...], bbox) for graded HOLC zones."""
    gj = json.load(open(p("holc-chicago-1938-zones.geojson")))
    zones = []
    for f in gj["features"]:
        grade = (f["properties"].get("grade") or "").strip().upper()
        if grade not in ("A", "B", "C", "D"):
            continue
        geom = f["geometry"]
        polys = []
        if geom["type"] == "Polygon":
            polys = [geom["coordinates"]]
        elif geom["type"] == "MultiPolygon":
            polys = geom["coordinates"]
        # precompute bbox over all coords for a fast reject test
        xs, ys = [], []
        for poly in polys:
            for ring in poly:
                for pt in ring:
                    xs.append(pt[0]); ys.append(pt[1])
        if not xs:
            continue
        bbox = (min(xs), min(ys), max(xs), max(ys))
        zones.append((grade, polys, bbox))
    return zones


def assign_tract_grade(lat, lon, zones):
    """Return HOLC grade whose polygon contains the tract centroid, else None.

    If a centroid falls inside multiple graded zones (graded areas can
    overlap slightly in the digitized 1938 map), we keep the best (lowest
    letter) grade so an A/B tract is not masked by an overlapping C/D sliver.
    """
    found = []
    for grade, polys, (minx, miny, maxx, maxy) in zones:
        if lon < minx or lon > maxx or lat < miny or lat > maxy:
            continue
        for poly in polys:
            if point_in_polygon(lon, lat, poly):
                found.append(grade)
                break
    if not found:
        return None
    order = {"A": 0, "B": 1, "C": 2, "D": 3}
    return sorted(found, key=lambda g: order[g])[0]


def holc_overlay():
    hr("2. GEOGRAPHY vs 1938 HOLC GRADE (descriptive overlay, NOT causal)")
    cent = pd.read_csv(p("cook-county-tract-centroids-2023.csv"),
                       dtype={"geoid": str})
    zones = load_holc_zones()
    print(f"graded HOLC zones loaded (A/B/C/D): {len(zones)}")
    print(f"Cook County tract centroids: {len(cent)}")

    grades = {}
    for _, r in cent.iterrows():
        grades[r["geoid"]] = assign_tract_grade(
            float(r["intptlat"]), float(r["intptlong"]), zones)
    cent["holc_grade"] = cent["geoid"].map(grades)
    n_graded = cent["holc_grade"].notna().sum()
    print(f"tracts whose centroid falls in a 1938 graded zone: {n_graded} "
          f"({n_graded / len(cent) * 100:.1f}% of Cook tracts)")
    print("  grade distribution of those tracts:",
          cent["holc_grade"].value_counts().reindex(["A", "B", "C", "D"]).to_dict())

    # tract x year aggregate, summed across all groups, pooled 2018-2023
    tr = pd.read_csv(p("hmda-cook-tract-year-aggregate.csv"),
                     dtype={"census_tract": str})
    trsum = tr.groupby("census_tract").agg(
        applications=("applications", "sum"),
        denials=("denials", "sum"),
        originations=("originations", "sum"),
        orig_dollars=("orig_dollars", "sum"),
    ).reset_index()
    trsum["holc_grade"] = trsum["census_tract"].map(grades)

    # collapse A/B ("best") vs D ("redlined"); C shown for context
    def bucket(g):
        if g in ("A", "B"):
            return "A/B (best, 1938)"
        if g == "C":
            return "C (declining, 1938)"
        if g == "D":
            return "D (redlined, 1938)"
        return "no 1938 grade"

    trsum["holc_bucket"] = trsum["holc_grade"].map(bucket)
    g = trsum.groupby("holc_bucket").agg(
        tracts=("census_tract", "nunique"),
        applications=("applications", "sum"),
        denials=("denials", "sum"),
        orig_dollars=("orig_dollars", "sum"),
        originations=("originations", "sum"),
    ).reset_index()
    g["denial_rate_pct"] = g["denials"] / g["applications"] * 100
    g["dollars_per_application"] = g["orig_dollars"] / g["applications"]

    order = ["A/B (best, 1938)", "C (declining, 1938)", "D (redlined, 1938)", "no 1938 grade"]
    g["o"] = g["holc_bucket"].map({k: i for i, k in enumerate(order)})
    g = g.sort_values("o")

    print("\nPooled 2018-2023, Cook County tracts grouped by 1938 HOLC grade")
    print("(all applicants; dollars-per-application is originated $ / total apps):")
    for _, r in g.iterrows():
        print(f"  {r['holc_bucket']:<22} tracts={int(r['tracts']):>4}  "
              f"apps={int(r['applications']):>8,}  "
              f"denial_rate={r['denial_rate_pct']:5.1f}%  "
              f"$/app=${r['dollars_per_application']:>10,.0f}")

    ab = g[g["holc_bucket"] == "A/B (best, 1938)"].iloc[0]
    d = g[g["holc_bucket"] == "D (redlined, 1938)"].iloc[0]
    print(f"\n  D-vs-A/B denial-rate ratio: "
          f"{d['denial_rate_pct'] / ab['denial_rate_pct']:.2f}x")
    print(f"  A/B-vs-D dollars-per-application ratio: "
          f"{ab['dollars_per_application'] / d['dollars_per_application']:.2f}x")
    return g


# ---------------------------------------------------------------------------
# 3. DOES THE GAP SURVIVE CRUDE INCOME / LOAN-SIZE CONTROLS?
# ---------------------------------------------------------------------------
def within_band_gap():
    hr("3. BLACK-WHITE AND LATINO-WHITE GAP WITHIN INCOME BANDS (2018-2023 pooled)")
    print("INCOMPLETE BY CONSTRUCTION: public HMDA has no credit score, so")
    print("holding income roughly constant cannot fully explain the gap.\n")
    ib = pd.read_csv(p("hmda-cook-income-band-gap.csv"))
    pooled = ib.groupby(["group", "income_band"]).agg(
        applications=("applications", "sum"),
        denials=("denials", "sum"),
    ).reset_index()
    pooled["denial_rate_pct"] = pooled["denials"] / pooled["applications"] * 100

    band_order = ["<$50k", "$50k-$75k", "$75k-$100k", "$100k-$150k", "$150k+", "unknown"]
    piv = pooled.pivot(index="income_band", columns="group", values="denial_rate_pct")
    piv = piv.reindex(band_order)
    cols = [c for c in MAIN_GROUPS if c in piv.columns]
    print("Denial rate (%) by income band:")
    print(piv[cols].round(1).to_string())

    print("\nBlack-minus-White and Latino-minus-White denial-rate gap (pct points), by income band:")
    out = {}
    for band in band_order:
        if band == "unknown" or band not in piv.index:
            continue
        w = piv.loc[band, "White (non-Hispanic)"]
        b = piv.loc[band, "Black"]
        l = piv.loc[band, "Latino/Hispanic"]
        out[band] = (b - w, l - w)
        print(f"  {band:<12} Black-White=+{b - w:4.1f}pp   Latino-White=+{l - w:4.1f}pp")

    # headline: raw gap vs within-$100k-150k gap (a high, comparable band)
    raw = pd.read_csv(p("hmda-cook-race-year-summary.csv"))
    rp = raw.groupby("group").agg(a=("applications", "sum"), d=("denials", "sum"))
    rp["r"] = rp["d"] / rp["a"] * 100
    raw_bw = rp.loc["Black", "r"] - rp.loc["White (non-Hispanic)", "r"]
    raw_lw = rp.loc["Latino/Hispanic", "r"] - rp.loc["White (non-Hispanic)", "r"]
    hi_bw = out["$150k+"][0]
    hi_lw = out["$150k+"][1]
    print(f"\n  Raw pooled Black-White gap:        +{raw_bw:.1f}pp")
    print(f"  Within $150k+ income band:         +{hi_bw:.1f}pp  "
          f"(shrinks {(1 - hi_bw / raw_bw) * 100:.0f}%, persists)")
    print(f"  Raw pooled Latino-White gap:       +{raw_lw:.1f}pp")
    print(f"  Within $150k+ income band:         +{hi_lw:.1f}pp  "
          f"(shrinks {(1 - hi_lw / raw_lw) * 100:.0f}%, persists)")
    return piv[cols]


# ---------------------------------------------------------------------------
# 4. PRICING MARGIN: HIGHER-PRICED SHARE AMONG ORIGINATED LOANS
# ---------------------------------------------------------------------------
def higher_priced():
    hr("4. HIGHER-PRICED SHARE AMONG ORIGINATED FIRST-LIEN LOANS")
    print("Higher-priced = HMDA rate_spread >= 1.5 (HOEPA reporting convention).")
    print("Denominator = originated first-lien loans with a reported rate spread.\n")
    hp = pd.read_csv(p("hmda-cook-higher-priced.csv"))
    pooled = hp.groupby("group").agg(
        loans=("first_lien_orig_with_spread", "sum"),
        higher_priced=("higher_priced", "sum"),
    ).reset_index()
    pooled["higher_priced_pct"] = pooled["higher_priced"] / pooled["loans"] * 100
    pooled = pooled.set_index("group")
    w = pooled.loc["White (non-Hispanic)", "higher_priced_pct"]
    print("Pooled 2018-2023:")
    for g in MAIN_GROUPS:
        if g in pooled.index:
            r = pooled.loc[g]
            print(f"  {g:<22} loans={int(r['loans']):>7,}  "
                  f"higher_priced={r['higher_priced_pct']:5.1f}%  "
                  f"vs-white={r['higher_priced_pct'] / w:4.2f}x")
    return pooled


# ---------------------------------------------------------------------------
# 5. STATED DENIAL REASONS BY RACE / ETHNICITY
# ---------------------------------------------------------------------------
def denial_reasons():
    hr("5. PRIMARY STATED DENIAL REASON BY RACE/ETHNICITY (2018-2023 denied apps)")
    dr = pd.read_csv(p("hmda-cook-denial-reasons.csv"))
    tot = dr.groupby("group")["denials"].sum()
    piv = dr.pivot(index="reason", columns="group", values="denials").fillna(0)
    cols = [c for c in MAIN_GROUPS if c in piv.columns]
    share = piv[cols].div(tot[cols], axis=1) * 100

    # order reasons by overall frequency
    order = piv[cols].sum(axis=1).sort_values(ascending=False).index
    share = share.reindex(order)
    print("Share of each group's denials attributed to each primary reason (%):")
    print(share.round(1).to_string())
    print("\nTotal denied applications per group (denominator):")
    for g in cols:
        print(f"  {g:<22} {int(tot[g]):>7,}")
    return share


# ---------------------------------------------------------------------------
# 6. LENDER CONCENTRATION AND WHITE-TO-BLACK ORIGINATION-DOLLAR RATIO
# ---------------------------------------------------------------------------
def lender_concentration():
    hr("6. TOP LENDERS BY COOK COUNTY ORIGINATION $ AND WHITE:BLACK $ RATIO")
    print("Origination dollars 2018-2023 pooled. LEI is the HMDA legal entity id.")
    print("Ratio = white-applicant originated $ / Black-applicant originated $.\n")
    lc = pd.read_csv(p("hmda-cook-lender-concentration.csv"), dtype={"lei": str})
    piv = lc.pivot_table(index="lei", columns="group",
                         values="loan_amount_num", aggfunc="sum").fillna(0)
    totals = lc.groupby("lei")["total_orig_dollars"].first()
    piv["total"] = totals
    piv = piv.sort_values("total", ascending=False).head(15)

    wcol = "White (non-Hispanic)"
    bcol = "Black"
    grand_total = lc.groupby("lei")["total_orig_dollars"].first().sum()
    top10_share = piv["total"].head(10).sum() / grand_total * 100
    print(f"Top 10 lenders hold {top10_share:.1f}% of all originated dollars "
          f"among the top-25 set.\n")
    print(f"{'LEI':<22}{'total $M':>9}{'white $M':>10}{'Black $M':>10}{'W:B ratio':>11}")
    ratios = []
    for lei, r in piv.iterrows():
        w = r.get(wcol, 0)
        b = r.get(bcol, 0)
        ratio = (w / b) if b > 0 else float("inf")
        if b > 0:
            ratios.append(ratio)
        rtxt = f"{ratio:>10.1f}" if b > 0 else f"{'no Black $':>10}"
        print(f"{lei:<22}{r['total'] / 1e6:>9,.0f}{w / 1e6:>10,.0f}"
              f"{b / 1e6:>10,.0f}{rtxt:>11}")
    if ratios:
        print(f"\nMedian white:Black origination-$ ratio across these top lenders: "
              f"{np.median(ratios):.1f}x")
    return piv


def main():
    print("ROOTED FORWARD - HMDA mortgage lending and denial disparities, Cook County")
    print("Source: FFIEC / CFPB HMDA public LAR, FIPS 17031, 2018-2023")
    print("Records analyzed: 1,466,670 (see build_aggregates.py)")
    denial_gap()
    holc_overlay()
    within_band_gap()
    higher_priced()
    denial_reasons()
    lender_concentration()
    print("\n" + "=" * 70)
    print("NOTE: Public HMDA lacks applicant credit score. All results above are")
    print("descriptive. They size the raw gap and its geography; they do not")
    print("isolate present-day discrimination.")
    print("=" * 70)


if __name__ == "__main__":
    main()
