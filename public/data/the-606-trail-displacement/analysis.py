"""
The 606 and Displacement Pressure in Humboldt Park
Descriptive analysis backbone.

Honest thesis: against a literature documenting steep western-segment home-price
appreciation after the 2015 trail opening, our contribution is a descriptive
census of the modest public subsidy and affordable stock standing against that
pressure. No causal claim, no price effect computed here.

Reads two REAL City of Chicago files mirrored in this repo:
  1. chicago-affordable-rental-housing-developments.csv
     (Dept. of Housing, Affordable Rental Housing Developments list)
  2. chicago-tif-funded-rda-projects.csv
     (Dept. of Planning and Development, TIF/RDA project records)

Corridor definition: the four community areas the 2.7-mile 606 / Bloomingdale
Trail runs through or borders, namely Humboldt Park, West Town, Logan Square,
and Avondale. We filter on the dataset's own community_area field with exact
string matches only. Nothing is imputed. Missingness is reported, not filled.
"""

import os
import pandas as pd
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
AFF_PATH = os.path.join(HERE, "chicago-affordable-rental-housing-developments.csv")
TIF_PATH = os.path.join(HERE, "chicago-tif-funded-rda-projects.csv")

# The four community areas along / bordering the 606 trail.
CORRIDOR = ["Humboldt Park", "West Town", "Logan Square", "Avondale"]

# Western Avenue longitude. The 606 literature splits the trail at Western Ave
# into a lower-income western segment (Humboldt Park side) and a higher-income
# eastern segment (Wicker Park / Bucktown side). Western Ave runs at roughly
# -87.6877 longitude through this stretch of the city.
WESTERN_AVE_LNG = -87.6877


def money(x):
    return f"${x:,.0f}"


print("=" * 72)
print("THE 606 AND DISPLACEMENT PRESSURE IN HUMBOLDT PARK")
print("Descriptive census of subsidized / affordable supply along the corridor")
print("=" * 72)

# ----------------------------------------------------------------------------
# Load
# ----------------------------------------------------------------------------
aff = pd.read_csv(AFF_PATH)
tif = pd.read_csv(TIF_PATH)

print("\n[SOURCE FILES]")
print(f"  Affordable Rental Housing Developments : {len(aff):,} records, "
      f"{aff.shape[1]} columns")
print(f"  TIF/RDA Projects                       : {len(tif):,} records, "
      f"{tif.shape[1]} columns")

# ============================================================================
# ANALYSIS 1 - Census of existing affordable / subsidized rental supply
# ============================================================================
print("\n" + "=" * 72)
print("ANALYSIS 1 - AFFORDABLE RENTAL SUPPLY IN THE FOUR CORRIDOR AREAS")
print("=" * 72)

ac = aff[aff["community_area"].isin(CORRIDOR)].copy()
ac["units_num"] = pd.to_numeric(ac["units"], errors="coerce")

# Honest missingness report.
n_unit_missing = ac["units_num"].isna().sum()
print(f"\nDevelopments in corridor community areas : {len(ac):,}")
print(f"Rows with a missing/non-numeric unit count: {n_unit_missing} "
      f"({n_unit_missing / len(ac) * 100:.1f}%)")

by_ca = (ac.groupby("community_area")["units_num"]
           .agg(developments="count", units="sum")
           .reindex(CORRIDOR))
by_ca["units"] = by_ca["units"].astype(int)

print("\nDevelopments and units by community area:")
print(f"  {'Community area':<16}{'Developments':>14}{'Units':>10}")
for ca, row in by_ca.iterrows():
    print(f"  {ca:<16}{int(row['developments']):>14}{int(row['units']):>10}")

total_devs = int(by_ca["developments"].sum())
total_units = int(by_ca["units"].sum())
print(f"  {'TOTAL':<16}{total_devs:>14}{total_units:>10}")

# Property-type mix (descriptive, helps show what kind of stock this is).
print("\nProperty-type mix of corridor developments:")
ptype = ac["property_type"].fillna("(blank)").value_counts()
for name, cnt in ptype.items():
    print(f"  {name:<24}{cnt:>4}")

# ============================================================================
# ANALYSIS 2 - West-of-Western vs East-of-Western geographic split
# ============================================================================
print("\n" + "=" * 72)
print("ANALYSIS 2 - GEOGRAPHIC SPLIT ACROSS WESTERN AVENUE")
print("=" * 72)
print("Mirrors the literature's western (lower-income) vs eastern split,")
print(f"using only real coordinates. Cut line = Western Ave, lng {WESTERN_AVE_LNG}.")

ac["lng"] = pd.to_numeric(ac["longitude"], errors="coerce")
n_geo_missing = ac["lng"].isna().sum()
print(f"\nDevelopments missing a longitude: {n_geo_missing} "
      f"({n_geo_missing / len(ac) * 100:.1f}%)")

ac["side"] = np.where(ac["lng"] < WESTERN_AVE_LNG,
                      "West of Western", "East of Western")
side = (ac.groupby("side")["units_num"]
          .agg(developments="count", units="sum")
          .reindex(["West of Western", "East of Western"]))
side["units"] = side["units"].astype(int)

print("\nAffordable developments and units by side of Western Ave:")
print(f"  {'Side':<18}{'Developments':>14}{'Units':>10}")
for s, row in side.iterrows():
    print(f"  {s:<18}{int(row['developments']):>14}{int(row['units']):>10}")

west_units = int(side.loc["West of Western", "units"])
west_share = west_units / total_units * 100
print(f"\nWestern-segment share of corridor affordable units: "
      f"{west_units:,} of {total_units:,} = {west_share:.1f}%")
print("(The western, lower-income segment is where the literature documents")
print(" the steepest post-2015 price appreciation and displacement pressure.)")

# ============================================================================
# ANALYSIS 3 - TIF / RDA subsidized projects and committed affordable units
# ============================================================================
print("\n" + "=" * 72)
print("ANALYSIS 3 - TIF / RDA PUBLIC SUBSIDY DIRECTED AT CORRIDOR AFFORDABILITY")
print("=" * 72)

tc = tif[tif["community_area"].isin(CORRIDOR)].copy()
tc["aff_num"] = pd.to_numeric(tc["affordable_units"], errors="coerce")
tc["approved"] = pd.to_numeric(tc["approved_amount"], errors="coerce")
tc["tpc"] = pd.to_numeric(tc["total_project_cost"], errors="coerce")

print(f"\nTIF/RDA project records in corridor community areas : {len(tc):,}")
n_aff_blank = tc["aff_num"].isna().sum()
print(f"  of which carry NO affordable_units value           : {n_aff_blank} "
      f"({n_aff_blank / len(tc) * 100:.1f}%)")
print("  (these are non-residential TIF items such as school, infrastructure,")
print("   and commercial reimbursements; they are excluded from unit totals)")

# Exact matching drops any row whose community_area field lists several
# areas joined by commas. Report those rows so the reader can see exactly
# what the rule excludes (corridor counts are therefore floors).
multi = tif[tif["community_area"].astype(str).str.contains(",", na=False)]
multi_corr = multi[multi["community_area"].astype(str).apply(
    lambda s: any(c in s.split(",") for c in CORRIDOR))]
print(f"\nRecords with comma-joined community_area values "
      f"(excluded by exact match): {len(multi)}")
print(f"  of which name a corridor community area: {len(multi_corr)}")
for _, r in multi_corr.iterrows():
    aff_val = pd.to_numeric(r["affordable_units"], errors="coerce")
    aff_s = "blank" if pd.isna(aff_val) else f"{int(aff_val)}"
    print(f"    {r['project_name']} ({r['community_area']}), "
          f"affordable_units={aff_s}")

# Residential affordable projects only = affordable_units > 0.
res = tc[tc["aff_num"] > 0].copy()
print(f"\nResidential TIF/RDA projects committing affordable units: {len(res):,}")

res_units = int(res["aff_num"].sum())
res_approved = res["approved"].sum()
res_tpc = res["tpc"].sum()
print(f"  Total committed affordable units : {res_units:,}")
print(f"  Total approved TIF subsidy       : {money(res_approved)}")
print(f"  Total project cost               : {money(res_tpc)}")
print(f"  Public subsidy as share of cost  : "
      f"{res_approved / res_tpc * 100:.1f}%")

by_ca_tif = (res.groupby("community_area")
                .agg(projects=("project_name", "count"),
                     aff_units=("aff_num", "sum"),
                     approved=("approved", "sum"))
                .reindex(CORRIDOR)
                .dropna(how="all"))
print("\nResidential TIF/RDA subsidy by community area:")
print(f"  {'Community area':<16}{'Projects':>10}{'Aff units':>11}{'Approved $':>16}")
for ca, row in by_ca_tif.iterrows():
    print(f"  {ca:<16}{int(row['projects']):>10}{int(row['aff_units']):>11}"
          f"{money(row['approved']):>16}")

# ============================================================================
# ANALYSIS 4 - Combined committed affordable supply, west vs east of Western
# ============================================================================
print("\n" + "=" * 72)
print("ANALYSIS 4 - WHERE THE TIF/RDA AFFORDABLE UNITS SIT (W vs E OF WESTERN)")
print("=" * 72)
res["lng"] = pd.to_numeric(res["longitude"], errors="coerce")
n_res_geo_missing = res["lng"].isna().sum()
print(f"\nResidential TIF projects missing a longitude: {n_res_geo_missing} "
      f"({n_res_geo_missing / len(res) * 100:.1f}%)")
res["side"] = np.where(res["lng"] < WESTERN_AVE_LNG,
                       "West of Western", "East of Western")
tif_side = (res.groupby("side")["aff_num"]
              .agg(projects="count", aff_units="sum")
              .reindex(["West of Western", "East of Western"]))
print("\nTIF/RDA committed affordable units by side of Western Ave:")
print(f"  {'Side':<18}{'Projects':>10}{'Aff units':>11}")
for s, row in tif_side.iterrows():
    if pd.isna(row["projects"]):
        continue
    print(f"  {s:<18}{int(row['projects']):>10}{int(row['aff_units']):>11}")
tif_west = int(tif_side.loc["West of Western", "aff_units"])
print(f"\nWestern-segment share of TIF/RDA affordable units: "
      f"{tif_west:,} of {res_units:,} = {tif_west / res_units * 100:.1f}%")

# Boundary check for the 100% figure: name the easternmost residential
# project so the distance to the cut line is visible, not asserted.
em = res.loc[res["lng"].idxmax()]
print(f"\nEasternmost residential project: {em['project_name']}")
print(f"  longitude {em['lng']:.4f} vs Western Ave cut line {WESTERN_AVE_LNG}")

# ============================================================================
# ANALYSIS 5 - Ratio framing: committed supply vs the at-risk 2-4 flat stock
# ============================================================================
print("\n" + "=" * 72)
print("ANALYSIS 5 - DESCRIPTIVE GAP, COMMITTED SUPPLY VS AT-RISK STOCK")
print("=" * 72)
print("This is a framing ratio, NOT a causal estimate. It places the real")
print("committed/subsidized units next to the rough scale of unsubsidized")
print("2-4 flat affordable stock the IHS work flags as exposed along the")
print("corridor. We report only the units we can count from these two files;")
print("the at-risk denominator is left to the literature, not computed here.")

combined_units = total_units + res_units
print(f"\nTotal listed affordable rental units (Analysis 1) : {total_units:,}")
print(f"Total TIF/RDA committed affordable units (Analysis 3): {res_units:,}")
print(f"Combined affordable + committed units              : {combined_units:,}")
print("\nNote: these two counts overlap in part. Several TIF/RDA-financed")
print("buildings (for example Rosa Parks Apts, Zapata Apts) also appear on the")
print("affordable-rental list, so the combined figure is an upper bound, not a")
print("clean sum. We therefore lead with the two counts separately.")

print("\n" + "=" * 72)
print("END OF ANALYSIS")
print("=" * 72)
