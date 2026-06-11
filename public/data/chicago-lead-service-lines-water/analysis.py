"""
Lead Service Lines and Tap Water Risk Across Chicago Neighborhoods
==================================================================

Descriptive analysis backbone for the Rooted Forward paper
  slug: chicago-lead-service-lines-water

Real data only. Every number printed here comes from the shipped files.

Data sources (all real, all public):
  - chicago-community-areas-lead.csv  (77 Chicago community areas)
  - chicago-tracts-lead.csv           (803 Chicago census tracts)
    Both compiled by Inside Climate News / Grist / WBEZ from the City of
    Chicago Department of Water Management 2025 lead service-line inventory
    submitted to the Illinois EPA, joined to U.S. Census ACS 2023 5-year
    demographics.
    https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines
  - For the historical overlay (Analysis 5):
      * chicago-tract-centroids.csv  (geoid -> lat/lon centroid for all 803
        tracts, derived once from the repo's tract polygons and shipped here
        so the overlay is reproducible without a 3 MB geojson), and
      * the 1938 HOLC graded-zone polygons for Chicago, read by relative path
        from the sibling data folder 1938-holc-chicago-map-annotated/.

Lead-classification column meanings (from the inventory):
  L   = confirmed lead service line
  GRR = galvanized requiring replacement (downstream of lead, treated as lead)
  U   = unknown / suspected lead (material not verified)
  NL  = not lead (copper, plastic, etc.)
  total = L + GRR + U + NL
  requires_replacement = L + GRR + U
  pct_requires_replacement = 100 * requires_replacement / total
  pct_replaced = share of lines already replaced (Y) out of those tracked

No values are imputed. Where a field is missing we say so and drop only
those rows from the specific statistic, never silently.
"""

import json
import os
import numpy as np
import pandas as pd

pd.set_option("display.width", 160)
pd.set_option("display.max_columns", 40)

HERE = os.path.dirname(os.path.abspath(__file__))
CA_CSV = os.path.join(HERE, "chicago-community-areas-lead.csv")
TR_CSV = os.path.join(HERE, "chicago-tracts-lead.csv")
# Geojson lives in sibling data folders shipped elsewhere in the repo.
DATA_ROOT = os.path.dirname(HERE)
HOLC_GEOJSON = os.path.join(
    DATA_ROOT, "1938-holc-chicago-map-annotated", "holc-chicago-1938-zones.geojson"
)
# Small shipped centroid table (geoid, centroid_lat, centroid_lon).
CENTROIDS_CSV = os.path.join(HERE, "chicago-tract-centroids.csv")


def hr(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------
ca = pd.read_csv(CA_CSV)
tr = pd.read_csv(TR_CSV)

hr("0. DATA SHAPE AND MISSINGNESS")
print(f"Community-area rows: {len(ca)}   columns: {ca.shape[1]}")
print(f"Census-tract rows:   {len(tr)}   columns: {tr.shape[1]}")

# Honest missingness report on the columns we will actually use.
ca_use = ["pct_requires_replacement", "pct_replaced", "median_household_income",
          "pct_poverty", "pct_minority", "pct_not_lead", "total"]
tr_use = ["pct_requires_replacement", "pct_lead", "pct_replaced",
          "median_household_income", "pct_poverty", "pct_minority", "total"]
print("\nCommunity-area missing counts (key fields):")
print(ca[ca_use].isna().sum().to_string())
print("\nCensus-tract missing counts (key fields):")
print(tr[tr_use].isna().sum().to_string())


# ===========================================================================
# ANALYSIS 1
# Rank the 77 community areas by share of service lines requiring replacement.
# ===========================================================================
hr("1. COMMUNITY AREAS RANKED BY % SERVICE LINES REQUIRING REPLACEMENT")
print("requires_replacement = confirmed lead (L) + galvanized req. repl. (GRR)")
print("                       + unknown/suspected (U), as a share of total.\n")

ca_rank = ca.sort_values("pct_requires_replacement", ascending=False).reset_index(drop=True)
top = ca_rank.head(12)[
    ["community", "total", "L", "GRR", "U", "NL",
     "pct_requires_replacement", "median_household_income", "pct_black_nonhispanic",
     "pct_hispanic", "pct_minority"]
].copy()
top.insert(0, "rank", range(1, len(top) + 1))
print("Top 12 community areas (highest replacement burden):")
print(top.to_string(index=False,
      formatters={"median_household_income": lambda v: f"{v:,.0f}"}))

print("\nBottom 8 community areas (lowest replacement burden):")
bot = ca_rank.tail(8)[
    ["community", "total", "pct_requires_replacement",
     "median_household_income", "pct_black_nonhispanic", "pct_hispanic", "pct_minority"]
].copy()
bot.insert(0, "rank", range(len(ca_rank) - 7, len(ca_rank) + 1))
print(bot.to_string(index=False,
      formatters={"median_household_income": lambda v: f"{v:,.0f}"}))

# Where do the top 10 sit? Report their median income vs the citywide median.
top10 = ca_rank.head(10)
print(f"\nTop-10 community areas: median of their median_household_income = "
      f"${top10['median_household_income'].median():,.0f}")
print(f"All 77 community areas: median of median_household_income       = "
      f"${ca['median_household_income'].median():,.0f}")
print(f"Top-10 mean pct_minority = {top10['pct_minority'].mean():.1f}%   "
      f"| all-77 mean pct_minority = {ca['pct_minority'].mean():.1f}%")


# ===========================================================================
# ANALYSIS 2
# Bivariate association across 803 tracts:
# replacement burden vs income, poverty, minority share.
# ===========================================================================
hr("2. TRACT-LEVEL ASSOCIATION  (replacement burden vs demographics)")
print("Descriptive association only. Not a causal estimate.\n")

corr_cols = ["pct_requires_replacement", "pct_lead", "median_household_income",
             "pct_poverty", "pct_minority", "pct_black_nonhispanic", "pct_hispanic"]
tr_corr = tr[corr_cols].dropna()
print(f"Tracts with complete data for correlation: {len(tr_corr)} of {len(tr)}")

print("\nPearson correlation with pct_requires_replacement:")
for c in ["median_household_income", "pct_poverty", "pct_minority",
          "pct_black_nonhispanic", "pct_hispanic"]:
    r = tr_corr["pct_requires_replacement"].corr(tr_corr[c])
    print(f"  {c:<28} r = {r:+.3f}")

print("\nPearson correlation with pct_lead (confirmed lead only):")
for c in ["median_household_income", "pct_poverty", "pct_minority"]:
    r = tr_corr["pct_lead"].corr(tr_corr[c])
    print(f"  {c:<28} r = {r:+.3f}")

# Binned comparison by income quintile of tracts.
tr_inc = tr.dropna(subset=["median_household_income", "pct_requires_replacement"]).copy()
tr_inc["income_quintile"] = pd.qcut(tr_inc["median_household_income"], 5,
                                    labels=["Q1 lowest", "Q2", "Q3", "Q4", "Q5 highest"])
binned = tr_inc.groupby("income_quintile", observed=True).agg(
    n_tracts=("pct_requires_replacement", "size"),
    mean_pct_requires_replacement=("pct_requires_replacement", "mean"),
    median_income=("median_household_income", "median"),
    mean_pct_minority=("pct_minority", "mean"),
)
print("\nMean replacement burden by tract income quintile:")
print(binned.round(1).to_string())

q1 = binned.loc["Q1 lowest", "mean_pct_requires_replacement"]
q5 = binned.loc["Q5 highest", "mean_pct_requires_replacement"]
print(f"\nLowest-income quintile mean = {q1:.1f}%  vs  "
      f"highest-income quintile mean = {q5:.1f}%   "
      f"(gap = {q1 - q5:+.1f} pts)")

# Binned comparison by minority-share quartile.
tr_min = tr.dropna(subset=["pct_minority", "pct_requires_replacement"]).copy()
tr_min["minority_quartile"] = pd.qcut(tr_min["pct_minority"], 4,
                                      labels=["Q1 least", "Q2", "Q3", "Q4 most"])
binned_min = tr_min.groupby("minority_quartile", observed=True).agg(
    n_tracts=("pct_requires_replacement", "size"),
    mean_pct_requires_replacement=("pct_requires_replacement", "mean"),
    mean_pct_minority=("pct_minority", "mean"),
)
print("\nMean replacement burden by tract minority-share quartile:")
print(binned_min.round(1).to_string())


# ===========================================================================
# ANALYSIS 3
# Citywide totals and composition.
# ===========================================================================
hr("3. CITYWIDE TOTALS AND MATERIAL COMPOSITION")
print("Summed from the 77-community-area file (covers the full inventory).\n")

L = int(ca["L"].sum())
GRR = int(ca["GRR"].sum())
U = int(ca["U"].sum())
NL = int(ca["NL"].sum())
total = int(ca["total"].sum())
req = L + GRR + U
print(f"Total service lines in inventory : {total:,}")
print(f"  Confirmed lead (L)             : {L:,}   ({100*L/total:.1f}%)")
print(f"  Galvanized req. replace (GRR)  : {GRR:,}   ({100*GRR/total:.1f}%)")
print(f"  Unknown / suspected lead (U)   : {U:,}   ({100*U/total:.1f}%)")
print(f"  Not lead (NL)                  : {NL:,}   ({100*NL/total:.1f}%)")
print(f"  ----")
print(f"  Requires replacement (L+GRR+U) : {req:,}   ({100*req/total:.1f}%)")

# Cross-check against the per-area requires_replacement column.
req_col = int(ca["requires_replacement"].sum())
print(f"\nCross-check: sum of per-area requires_replacement column = {req_col:,} "
      f"(matches L+GRR+U: {req_col == req})")

# How the NOT-LEAD share varies by community area.
ca_nl = ca.sort_values("pct_not_lead", ascending=False)
print("\nHighest not-lead share (cleanest pipes), top 6 community areas:")
print(ca_nl.head(6)[["community", "pct_not_lead", "pct_requires_replacement",
                     "median_household_income", "pct_minority"]].to_string(
      index=False, formatters={"median_household_income": lambda v: f"{v:,.0f}"}))
print("\nLowest not-lead share, bottom 6 community areas:")
print(ca_nl.tail(6)[["community", "pct_not_lead", "pct_requires_replacement",
                     "median_household_income", "pct_minority"]].to_string(
      index=False, formatters={"median_household_income": lambda v: f"{v:,.0f}"}))


# ===========================================================================
# ANALYSIS 4
# Replacement progress so far, and equity of remediation.
# ===========================================================================
hr("4. REPLACEMENT PROGRESS SO FAR  (equity-of-remediation check)")
print("pct_replaced = share already replaced among lines tracked for status.\n")

# Citywide replaced share from raw Y/N counts in the community-area file.
Y = int(ca["Y"].sum())
N = int(ca["N"].sum())
tracked = Y + N
print(f"Citywide replacement status counts: replaced (Y) = {Y:,}, "
      f"not yet (N) = {N:,}")
print(f"Citywide share replaced among tracked lines = {100*Y/tracked:.2f}%")

print("\nCommunity areas with the most replacement so far (top 6 by pct_replaced):")
ca_rep = ca.sort_values("pct_replaced", ascending=False)
print(ca_rep.head(6)[["community", "pct_replaced", "pct_requires_replacement",
                      "median_household_income", "pct_minority"]].to_string(
      index=False, formatters={"median_household_income": lambda v: f"{v:,.0f}"}))

# Equity of remediation at tract level: does pct_replaced track income / minority?
tr_rep = tr.dropna(subset=["pct_replaced", "median_household_income",
                           "pct_minority"]).copy()
# Only tracts with at least some lines tracked for status are meaningful; the
# pct_replaced field is 0 where nothing has been done, which is real, so keep all.
print(f"\nTracts used for remediation-equity correlation: {len(tr_rep)} of {len(tr)}")
r_inc = tr_rep["pct_replaced"].corr(tr_rep["median_household_income"])
r_min = tr_rep["pct_replaced"].corr(tr_rep["pct_minority"])
r_pov = tr_rep["pct_replaced"].corr(tr_rep["pct_poverty"])
print(f"  corr(pct_replaced, median_household_income) = {r_inc:+.3f}")
print(f"  corr(pct_replaced, pct_minority)            = {r_min:+.3f}")
print(f"  corr(pct_replaced, pct_poverty)             = {r_pov:+.3f}")

# Mean replaced share, top vs bottom income quintile.
tr_rep["income_quintile"] = pd.qcut(tr_rep["median_household_income"], 5,
                                    labels=["Q1 lowest", "Q2", "Q3", "Q4", "Q5 highest"])
rep_binned = tr_rep.groupby("income_quintile", observed=True).agg(
    n_tracts=("pct_replaced", "size"),
    mean_pct_replaced=("pct_replaced", "mean"),
    mean_pct_requires_replacement=("pct_requires_replacement", "mean"),
)
print("\nMean replacement progress by tract income quintile:")
print(rep_binned.round(2).to_string())


# ===========================================================================
# ANALYSIS 5
# Spatial overlay: 2025 tract lead burden vs 1938 HOLC grade.
# Pure-numpy point-in-polygon (no geopandas). Each tract is placed by its
# centroid into the HOLC zone(s) it falls within; we take the modal grade.
# ===========================================================================
hr("5. HISTORICAL OVERLAY  (1938 HOLC grade vs 2025 tract lead burden)")
print("Descriptive correspondence between a 1938 map and a 2025 inventory.")
print("No causal claim. Tract assigned to a HOLC grade by centroid location.\n")

if not os.path.exists(CENTROIDS_CSV) or not os.path.exists(HOLC_GEOJSON):
    print("SKIPPED: required overlay inputs not found.")
    print(f"  centroids csv exists: {os.path.exists(CENTROIDS_CSV)}")
    print(f"  HOLC geojson exists:  {os.path.exists(HOLC_GEOJSON)}")
else:
    def point_in_ring(px, py, ring):
        """Ray-casting test, ring is list of (lon, lat)."""
        pts = np.asarray(ring, dtype=float)
        x, y = pts[:, 0], pts[:, 1]
        x1, y1 = np.roll(x, -1), np.roll(y, -1)
        cond = ((y > py) != (y1 > py))
        with np.errstate(divide="ignore", invalid="ignore"):
            xint = (x1 - x) * (py - y) / (y1 - y) + x
        inside = np.logical_and(cond, px < xint)
        return bool(inside.sum() % 2 == 1)

    def point_in_polygon(px, py, geom):
        t = geom["type"]
        polys = geom["coordinates"] if t == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            if point_in_ring(px, py, poly[0]):
                # subtract holes
                in_hole = any(point_in_ring(px, py, h) for h in poly[1:])
                if not in_hole:
                    return True
        return False

    # Load HOLC zones, keep graded ones, precompute bounding boxes for speed.
    holc = json.load(open(HOLC_GEOJSON))
    zones = []
    for f in holc["features"]:
        g = (f["properties"].get("grade") or "").strip().upper()
        if g not in ("A", "B", "C", "D"):
            continue
        geom = f["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        all_pts = np.vstack([np.asarray(p[0], dtype=float) for p in polys])
        bbox = (all_pts[:, 0].min(), all_pts[:, 0].max(),
                all_pts[:, 1].min(), all_pts[:, 1].max())
        zones.append({"grade": g, "geom": geom, "bbox": bbox})
    from collections import Counter
    print(f"HOLC graded zones loaded: {len(zones)}  "
          f"grade counts = {dict(Counter(z['grade'] for z in zones))}")

    # Load shipped tract centroids, assign each to a HOLC grade by location.
    cent = pd.read_csv(CENTROIDS_CSV)
    cent["geoid"] = cent["geoid"].astype(str)
    tract_grade = {}
    order = {"D": 4, "C": 3, "B": 2, "A": 1}
    for _, row in cent.iterrows():
        geoid = row["geoid"]
        cy, cx = float(row["centroid_lat"]), float(row["centroid_lon"])  # lat, lon
        hit_grades = []
        for z in zones:
            xmin, xmax, ymin, ymax = z["bbox"]
            if not (xmin <= cx <= xmax and ymin <= cy <= ymax):
                continue
            if point_in_polygon(cx, cy, z["geom"]):
                hit_grades.append(z["grade"])
        if hit_grades:
            # modal grade among overlapping zones (ties -> worst grade D>C>B>A)
            cnt = Counter(hit_grades)
            best = max(cnt.values())
            tied = [g for g, c in cnt.items() if c == best]
            tract_grade[geoid] = max(tied, key=lambda g: order[g])

    matched = len(tract_grade)
    print(f"Tracts whose centroid falls inside a 1938 HOLC graded zone: "
          f"{matched} of {len(cent)}")
    print("(Tracts outside the 1938 mapped area are excluded, not imputed.)")

    tr2 = tr.copy()
    tr2["geoid"] = tr2["geoid"].astype(str)
    tr2["holc_grade"] = tr2["geoid"].map(tract_grade)
    matched_tr = tr2.dropna(subset=["holc_grade"]).copy()

    grade_summary = matched_tr.groupby("holc_grade").agg(
        n_tracts=("pct_requires_replacement", "size"),
        mean_pct_requires_replacement=("pct_requires_replacement", "mean"),
        mean_pct_lead=("pct_lead", "mean"),
        mean_pct_suspected=("pct_suspected_lead", "mean"),
        mean_median_income=("median_household_income", "mean"),
        mean_pct_minority=("pct_minority", "mean"),
    ).reindex(["A", "B", "C", "D"])
    print("\nPresent-day lead burden by 1938 HOLC grade (A=best, D='hazardous'):")
    print(grade_summary.round(1).to_string())

    # A/B (favored) vs C/D (declining/hazardous) pooled comparison.
    ab = matched_tr[matched_tr["holc_grade"].isin(["A", "B"])]
    cd = matched_tr[matched_tr["holc_grade"].isin(["C", "D"])]
    print(f"\nPooled A/B zones: {len(ab)} tracts, "
          f"mean pct_requires_replacement = {ab['pct_requires_replacement'].mean():.1f}%")
    print(f"Pooled C/D zones: {len(cd)} tracts, "
          f"mean pct_requires_replacement = {cd['pct_requires_replacement'].mean():.1f}%")
    print(f"Difference (C/D minus A/B) = "
          f"{cd['pct_requires_replacement'].mean() - ab['pct_requires_replacement'].mean():+.1f} pts")
    print(f"\nD ('hazardous') zones mean pct_requires_replacement = "
          f"{matched_tr[matched_tr['holc_grade']=='D']['pct_requires_replacement'].mean():.1f}%")
    print(f"A ('best') zones    mean pct_requires_replacement = "
          f"{matched_tr[matched_tr['holc_grade']=='A']['pct_requires_replacement'].mean():.1f}%")

print("\n" + "=" * 78)
print("END OF ANALYSIS")
print("=" * 78)
