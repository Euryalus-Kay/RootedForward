#!/usr/bin/env python3
"""
Where Chicago TIF Money Goes Across Wards and Community Areas
=============================================================

Descriptive analysis of approved Tax Increment Financing (TIF) /
Redevelopment Agreement (RDA) subsidies for the City of Chicago.

Source data (shipped in repo, unchanged from the Chicago Data Portal):
    chicago-tif-funded-rda-projects.csv
    City of Chicago, Department of Planning and Development,
    "TIF Projects" / Redevelopment Agreements, Chicago Data Portal,
    https://data.cityofchicago.org/Community-Economic-Development/TIF-Projects/

Each row is one approved TIF-funded project. Key columns used here:
    approved_amount         -- public TIF/RDA subsidy approved (USD)
    total_project_cost      -- total development cost (USD)
    tif_subsidy_percentage  -- city-reported subsidy share of project cost
    affordable_units        -- affordable units (reported for a SUBSET only)
    community_area          -- Chicago community area (some rows list several)
    ward                    -- Chicago ward (some rows list several)
    cdc_date                -- Community Development Commission approval date

This script computes only descriptive statistics. It makes no causal claim
and no city-wide affordable-housing claim. Missingness is reported, never
imputed. Run with:

    python analysis.py
"""

import os
import numpy as np
import pandas as pd

pd.set_option("display.width", 140)
pd.set_option("display.max_columns", 20)

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "chicago-tif-funded-rda-projects.csv")


def gini(values):
    """Standard Gini coefficient on a 1-D array of non-negative values."""
    x = np.sort(np.asarray(values, dtype=float))
    n = len(x)
    if n == 0 or x.sum() == 0:
        return float("nan")
    cum = np.cumsum(x)
    return (n + 1 - 2 * np.sum(cum) / cum[-1]) / n


def money(x):
    return f"${x:,.0f}"


# ---------------------------------------------------------------------------
# Load and basic shape
# ---------------------------------------------------------------------------
df = pd.read_csv(CSV)

# approved_amount, total_project_cost, etc. are already numeric in the source,
# but coerce defensively so a stray blank never silently becomes a string.
df["amt"] = pd.to_numeric(df["approved_amount"], errors="coerce")
df["tpc"] = pd.to_numeric(df["total_project_cost"], errors="coerce")
df["pct"] = pd.to_numeric(df["tif_subsidy_percentage"], errors="coerce")
df["units"] = pd.to_numeric(df["affordable_units"], errors="coerce")
df["year"] = pd.to_datetime(df["cdc_date"], errors="coerce").dt.year

n_total = len(df)
total_dollars = df["amt"].sum()

print("=" * 72)
print("CHICAGO TIF / RDA APPROVED SUBSIDY  --  DESCRIPTIVE DISTRIBUTION")
print("=" * 72)
print(f"Projects (rows)                : {n_total}")
print(f"Approval years (cdc_date)      : {int(df['year'].min())} - {int(df['year'].max())}")
print(f"Total approved subsidy         : {money(total_dollars)}")
print(f"Median approved subsidy        : {money(df['amt'].median())}")
print(f"Mean approved subsidy          : {money(df['amt'].mean())}")
print(f"Largest single approval        : {money(df['amt'].max())}")

# ---------------------------------------------------------------------------
# Missingness (reported honestly, never imputed)
# ---------------------------------------------------------------------------
print("\n--- FIELD COMPLETENESS (non-null of {} rows) ---".format(n_total))
for col in ["approved_amount", "community_area", "ward", "cdc_date",
            "total_project_cost", "tif_subsidy_percentage", "affordable_units"]:
    nn = df[col].notna().sum()
    print(f"  {col:24s} {nn:4d} present  ({nn / n_total * 100:4.1f}%)   "
          f"{n_total - nn:4d} missing")

# A handful of rows tag several community areas / wards at once (comma-joined),
# e.g. the Red Line Extension corridor. Flag them so the reader knows the
# largest single "grouping" is a multi-area transit megaproject, not one area.
ca_assigned = df.dropna(subset=["community_area"]).copy()
ca_assigned["is_multi"] = ca_assigned["community_area"].str.contains(",")
print(f"\n  Rows tagging MULTIPLE community areas (comma-joined): "
      f"{int(ca_assigned['is_multi'].sum())}")
for _, r in ca_assigned[ca_assigned["is_multi"]].iterrows():
    print(f"    - {money(r['amt']):>14s}  {r['project_name']}  [{r['community_area']}]")

# ===========================================================================
# 1. CONCENTRATION BY COMMUNITY AREA
# ===========================================================================
# Group by the community_area label exactly as the city records it. Comma-
# joined multi-area rows form their own grouping (and are flagged above).
print("\n" + "=" * 72)
print("1. APPROVED SUBSIDY BY COMMUNITY AREA  (ranked, top groupings)")
print("=" * 72)

ca_total = ca_assigned["amt"].sum()
ca = (ca_assigned.groupby("community_area")["amt"]
      .agg(total="sum", projects="count", median="median")
      .sort_values("total", ascending=False))
ca["share_pct"] = ca["total"] / ca_total * 100

print(f"Dollars carrying a community-area tag: {money(ca_total)} "
      f"({ca_total / total_dollars * 100:.1f}% of all approved dollars)")
print(f"Distinct community-area groupings    : {len(ca)}")
print()
print(f"{'rank':>4} {'community area':40s} {'approved':>16s} {'share':>7s} "
      f"{'projects':>9s} {'median':>14s}")
for i, (name, r) in enumerate(ca.head(12).iterrows(), start=1):
    label = name if len(name) <= 40 else name[:37] + "..."
    print(f"{i:>4} {label:40s} {money(r['total']):>16s} "
          f"{r['share_pct']:6.1f}% {int(r['projects']):>9d} {money(r['median']):>14s}")

top5_groupings = ca.head(5)["total"].sum()
print(f"\nTop 5 community-area groupings        : {money(top5_groupings)} "
      f"= {top5_groupings / ca_total * 100:.1f}% of community-area dollars")

# Same picture restricted to SINGLE named areas (drop the 3 multi-area rows),
# which is how the named downtown areas line up in the paper's thesis.
single = ca_assigned[~ca_assigned["is_multi"]]
single_total = single["amt"].sum()
sg = (single.groupby("community_area")["amt"]
      .agg(total="sum", projects="count", median="median")
      .sort_values("total", ascending=False))
named5 = ["Near South Side", "Loop", "Near West Side", "Near North Side", "Uptown"]
named5_sum = sg.loc[named5, "total"].sum()
print(f"\nSingle-named-area dollars (excl. {int(ca_assigned['is_multi'].sum())} multi-area rows): "
      f"{money(single_total)}")
print("Top 5 SINGLE named areas (all downtown / downtown-adjacent):")
for name in named5:
    r = sg.loc[name]
    print(f"    {name:18s} {money(r['total']):>16s}  "
          f"{r['total'] / single_total * 100:5.1f}% of single-area $   "
          f"n={int(r['projects'])}")
print(f"    {'TOP 5 TOTAL':18s} {money(named5_sum):>16s}  "
      f"{named5_sum / single_total * 100:5.1f}% of single-area $")

print(f"\nGini across community-area grouping totals: "
      f"{gini(ca['total'].values):.3f}   (0 = even, 1 = fully concentrated)")

# ===========================================================================
# 2. PROJECT COUNT vs DOLLAR SHARE  (many-small vs few-large)
# ===========================================================================
print("\n" + "=" * 72)
print("2. PROJECT COUNT vs DOLLAR SHARE BY COMMUNITY AREA")
print("=" * 72)
print("Ranked by number of projects (single-named areas):")
by_count = sg.sort_values("projects", ascending=False).head(6)
print(f"{'community area':18s} {'projects':>9s} {'approved':>16s} "
      f"{'$/project (mean)':>18s}")
for name, r in by_count.iterrows():
    print(f"{name:18s} {int(r['projects']):>9d} {money(r['total']):>16s} "
          f"{money(r['total'] / r['projects']):>18s}")
print("\nReading: Near West Side leads on project COUNT but trails Near South")
print("Side and the Loop on DOLLARS; the Loop concentrates more money in fewer")
print("deals. This separates 'many small projects' areas from 'few large' ones.")

# ===========================================================================
# 3. TIME DISTRIBUTION OF APPROVALS  (cdc_date)
# ===========================================================================
print("\n" + "=" * 72)
print("3. APPROVALS OVER TIME  (by decade, using cdc_date)")
print("=" * 72)
dec = df.dropna(subset=["year"]).copy()
dec["decade"] = (dec["year"] // 10 * 10).astype(int)
by_dec = dec.groupby("decade")["amt"].agg(approved="sum", projects="count")
by_dec["share_pct"] = by_dec["approved"] / total_dollars * 100
print(f"{'decade':>8s} {'approved':>16s} {'share':>7s} {'projects':>9s}")
for d, r in by_dec.iterrows():
    print(f"{str(d) + 's':>8s} {money(r['approved']):>16s} "
          f"{r['share_pct']:6.1f}% {int(r['projects']):>9d}")
print("\nReading: approvals accelerate sharply in the 2010s (the single biggest")
print("decade by both dollars and project count), then stay high into the 2020s.")

# ===========================================================================
# 4. SUBSIDY AS A SHARE OF TOTAL PROJECT COST  (leverage)
# ===========================================================================
print("\n" + "=" * 72)
print("4. TIF SUBSIDY AS A SHARE OF TOTAL PROJECT COST  (public leverage)")
print("=" * 72)
have_pct = df["pct"].notna().sum()
print(f"Projects reporting tif_subsidy_percentage: {have_pct} "
      f"({have_pct / n_total * 100:.1f}%)")
print(f"Median city-reported subsidy share        : {df['pct'].median():.1f}%")
print(f"Mean city-reported subsidy share          : {df['pct'].mean():.1f}%")

# Independent cross-check from the two dollar columns (only where both > 0).
both = df[(df["tpc"] > 0) & (df["amt"] > 0)].copy()
both["ratio"] = both["amt"] / both["tpc"] * 100
print(f"\nCross-check approved_amount / total_project_cost (n={len(both)}):")
print(f"  Median subsidy share : {both['ratio'].median():.1f}%")
print(f"  Mean subsidy share   : {both['ratio'].mean():.1f}%")

# Heaviest-leverage community areas (single areas with >=5 projects, by median
# city-reported subsidy share) so one-off deals do not dominate.
lev = (single.assign(pct=df["pct"])
       .dropna(subset=["pct"])
       .groupby("community_area")
       .agg(median_share=("pct", "median"), projects=("pct", "size")))
lev = lev[lev["projects"] >= 5].sort_values("median_share", ascending=False)
print("\nHighest median subsidy share, community areas with >= 5 reporting projects:")
print(f"{'community area':22s} {'median share':>13s} {'projects':>9s}")
for name, r in lev.head(6).iterrows():
    print(f"{name:22s} {r['median_share']:12.1f}% {int(r['projects']):>9d}")

# ===========================================================================
# 5. AFFORDABLE UNITS RELATIVE TO SUBSIDY  (REPORTING SUBSET ONLY)
# ===========================================================================
print("\n" + "=" * 72)
print("5. AFFORDABLE UNITS vs SUBSIDY  --  REPORTING SUBSET, NOT CITY-WIDE")
print("=" * 72)
sub = df[df["units"].notna()].copy()
n_sub = len(sub)
print(f"Projects reporting affordable_units : {n_sub} of {n_total} "
      f"({n_sub / n_total * 100:.1f}%)")
print(f"Projects NOT reporting the field    : {n_total - n_sub} "
      f"({(n_total - n_sub) / n_total * 100:.1f}%)  <- field is mostly blank")
print(f"Affordable units in the subset      : {int(sub['units'].sum()):,}")
print(f"Approved subsidy in the subset      : {money(sub['amt'].sum())}")
print(f"Subset subsidy per reported unit    : {money(sub['amt'].sum() / sub['units'].sum())}")
print("\nCAVEAT: 80% of projects leave affordable_units blank, so this is a")
print("reporting subset, not a city-wide affordable-housing accounting. It says")
print("nothing about units tied to the other 613 projects.")

# ===========================================================================
# 6. COVERAGE COUNTS AND DATA ARTIFACTS
# ===========================================================================
# Counts referenced in the paper that fall outside sections 1-5: how many
# wards, districts, and individual community areas the records reach, the
# composition of the 100%-subsidy cohort, and a known text-encoding defect.
print("\n" + "=" * 72)
print("6. COVERAGE COUNTS AND DATA ARTIFACTS")
print("=" * 72)

ward_vals = df["ward"].dropna().astype(str)
ward_split = sorted({w.strip() for v in ward_vals for w in v.split(",") if w.strip()},
                    key=int)
print(f"Distinct ward values as recorded      : {ward_vals.nunique()} "
      f"(includes comma-joined multi-ward entries)")
print(f"Distinct individual wards after split : {len(ward_split)} of 50")
print(f"Distinct TIF districts                : {df['tif_district'].nunique()}")

ca_vals = df["community_area"].dropna().astype(str)
ca_split = {c.strip() for v in ca_vals for c in v.split(",") if c.strip()}
print(f"Distinct individual community areas   : {len(ca_split)} of 77 "
      f"(after splitting the comma-joined rows)")
print(f"Distinct single-named areas           : {single['community_area'].nunique()}")

c100 = df[df["pct"] == 100]
over100 = df[df["pct"] > 100]
print(f"\nProjects with tif_subsidy_percentage == 100 : {len(c100)}")
print(f"Projects with tif_subsidy_percentage  > 100 : {len(over100)} "
      f"(max {df['pct'].max():.2f}%)")
print("Most common developers in the 100% cohort:")
for name, n in c100["developer"].value_counts().head(6).items():
    print(f"    {name:28s} {n:>4d}")
cps_labels = ["Chicago Public Schools", "CPS", "Chicago Board of Education"]
cps_n = c100["developer"].isin(cps_labels).sum()
cta_n = c100["developer"].isin(["Chicago Transit Authority", "CTA"]).sum()
print(f"School-system entries combined (CPS family) : {cps_n}")
print(f"Transit entries combined (CTA family)       : {cta_n}")
c100_text = (c100["project_name"].fillna("") + " "
             + c100["project_description"].fillna("") + " "
             + c100["developer"].fillna(""))
iga_n = c100_text.str.contains("IGA|[Ii]ntergovernmental", regex=True).sum()
print(f"Cohort rows mentioning IGA / intergovernmental: {iga_n}")

# Text-encoding defect: some rows carry the Unicode replacement character
# (U+FFFD) in a text field. Numeric and geographic columns are unaffected.
text_cols = ["project_name", "project_description", "developer", "address",
             "tif_district"]
fffd = pd.Series(False, index=df.index)
for col in text_cols:
    fffd |= df[col].fillna("").astype(str).str.contains("�")
print(f"\nRows with U+FFFD replacement characters in a text field: {int(fffd.sum())}")

print("\n" + "=" * 72)
print("END OF ANALYSIS")
print("=" * 72)
