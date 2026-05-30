"""
Analysis for "What the Affordable Requirements Ordinance Has Produced"
Rooted Forward research paper, slug: chicago-affordable-requirements-ordinance

DATA
----
File: chicago-affordable-rental-housing-developments.csv
Source: City of Chicago Department of Housing, "Affordable Rental Housing
        Developments," via the Chicago Data Portal (Socrata dataset s6ha-ppgi).
        https://data.cityofchicago.org/Community-Economic-Development/Affordable-Rental-Housing-Developments/s6ha-ppgi
Shipped file is byte-identical to the repo copy and was cross-checked against
the live Socrata endpoint on 2026-05-29: count(*) = 598 developments,
156 with property_type = 'ARO', sum(units) for ARO = 1727. The schema is the
documented 14 columns.

NOTE ON ROW COUNT: a `wc -l` of the CSV reports ~1,777 physical lines because
the trailing `location` (WKT POINT) field contains embedded newlines. The true
record count, confirmed both by Python's csv module and by the live Socrata
count(*), is 598 developments. We report 598, not 1,776.

This dataset is a point-in-time snapshot of CITY-DOH-LISTED affordable rental
developments. ARO units inside otherwise market-rate buildings appear here only
because the building registered them with the City; the file is the City's own
roster, not a comprehensive census of every ARO unit ever produced. All counts
below are descriptive (where ARO-listed units sit today), not causal.

WHAT THIS SCRIPT DOES
---------------------
1. ARO's share of the affordable-rental roster (developments and units).
2. Community-area ranking of ARO developments and ARO units (geographic
   concentration).
3. Distribution of units per ARO development (set-aside size).
4. ARO vs non-ARO siting contrast by community area.
All numbers are printed with clear labels so the paper can cite them directly.
"""

import pandas as pd

CSV = "chicago-affordable-rental-housing-developments.csv"

# Chicago's 77 community areas. The City's affordable-rental roster covers a
# subset; we report how many of the 77 host any listed development and any ARO.
TOTAL_CHICAGO_COMMUNITY_AREAS = 77


def hr(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def main():
    df = pd.read_csv(CSV)

    # ---- Honest data-quality reporting -------------------------------------
    hr("0. DATA QUALITY AND MISSINGNESS")
    print(f"Total developments in file (records, not physical lines): {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print(f"Rows missing 'units': {df['units'].isna().sum()}")
    print(f"Rows missing 'latitude': {df['latitude'].isna().sum()}")
    print(f"Rows missing 'longitude': {df['longitude'].isna().sum()}")
    print(f"Rows missing 'community_area': {df['community_area'].isna().sum()}")
    # Normalize property_type whitespace/case only for the ARO flag; we do NOT
    # silently merge the misspelled 'Multfamily'/'Mutifamily' etc. categories.
    pt = df["property_type"].astype(str).str.strip()
    aro_mask = pt.str.upper() == "ARO"
    print(f"Rows flagged ARO (property_type == 'ARO', case-insensitive): {int(aro_mask.sum())}")

    aro = df[aro_mask].copy()
    non_aro = df[~aro_mask].copy()

    # ---- 1. ARO share of the roster ----------------------------------------
    hr("1. ARO SHARE OF THE CITY AFFORDABLE-RENTAL ROSTER")
    total_dev = len(df)
    aro_dev = len(aro)
    total_units = df["units"].sum()
    aro_units = aro["units"].sum()
    print(f"Affordable-rental developments listed (total): {total_dev}")
    print(f"  of which ARO-tagged developments:           {aro_dev}")
    print(f"  ARO share of developments:                  {aro_dev / total_dev * 100:.1f}%")
    print()
    print(f"Total units across all listed developments:   {int(total_units)}")
    print(f"  of which ARO units:                         {int(aro_units)}")
    print(f"  ARO share of units:                         {aro_units / total_units * 100:.1f}%")
    print()
    print("Interpretation: ARO is about a quarter of the LISTED DEVELOPMENTS")
    print("but a much smaller share of UNITS, because ARO set-asides are small")
    print("pockets of affordability inside larger market-rate buildings.")

    # ---- 2. Geographic concentration of ARO --------------------------------
    hr("2. ARO GEOGRAPHIC CONCENTRATION (community-area ranking)")
    n_ca_any = df["community_area"].nunique()
    n_ca_aro = aro["community_area"].nunique()
    print(f"Community areas hosting ANY listed development: {n_ca_any} of {TOTAL_CHICAGO_COMMUNITY_AREAS}")
    print(f"Community areas hosting ANY ARO development:    {n_ca_aro} of {TOTAL_CHICAGO_COMMUNITY_AREAS}")
    print()

    by_dev = (
        aro.groupby("community_area")
        .agg(aro_developments=("property_name", "count"), aro_units=("units", "sum"))
        .sort_values(["aro_developments", "aro_units"], ascending=False)
    )
    by_units = by_dev.sort_values(["aro_units", "aro_developments"], ascending=False)

    print("Top 8 community areas by ARO DEVELOPMENT count:")
    print(f"{'community_area':<22}{'developments':>14}{'units':>10}")
    for ca, row in by_dev.head(8).iterrows():
        print(f"{ca:<22}{int(row['aro_developments']):>14}{int(row['aro_units']):>10}")
    print()

    print("Top 8 community areas by ARO UNIT count:")
    print(f"{'community_area':<22}{'units':>10}{'developments':>14}")
    for ca, row in by_units.head(8).iterrows():
        print(f"{ca:<22}{int(row['aro_units']):>10}{int(row['aro_developments']):>14}")
    print()

    top5_units = by_units.head(5)["aro_units"].sum()
    print(f"Top 5 community areas hold {int(top5_units)} of {int(aro_units)} ARO units "
          f"({top5_units / aro_units * 100:.1f}%).")

    # ---- 3. Units per ARO development (set-aside size) ---------------------
    hr("3. UNITS PER ARO DEVELOPMENT (set-aside size distribution)")
    u = aro["units"].dropna()
    print(f"ARO developments with a units value: {len(u)} (missing: {aro['units'].isna().sum()})")
    print(f"Mean units per ARO development:   {u.mean():.1f}")
    print(f"Median units per ARO development: {u.median():.1f}")
    print(f"Min / Max units:                  {int(u.min())} / {int(u.max())}")
    print()
    # Bucket the set-aside sizes into legible bins.
    bins = [
        ("1 unit", (u == 1).sum()),
        ("2 to 5 units", ((u >= 2) & (u <= 5)).sum()),
        ("6 to 10 units", ((u >= 6) & (u <= 10)).sum()),
        ("11 to 25 units", ((u >= 11) & (u <= 25)).sum()),
        ("26+ units", (u >= 26).sum()),
    ]
    print("Distribution of ARO developments by set-aside size:")
    print(f"{'size bucket':<18}{'developments':>14}{'share':>10}")
    for label, cnt in bins:
        print(f"{label:<18}{int(cnt):>14}{cnt / len(u) * 100:>9.1f}%")
    print()
    share_5_or_fewer = ((u <= 5).sum()) / len(u) * 100
    print(f"Share of ARO developments with 5 or fewer affordable units: {share_5_or_fewer:.1f}%")

    # ---- 4. ARO vs non-ARO siting contrast ---------------------------------
    hr("4. ARO vs NON-ARO SITING CONTRAST (by community area)")
    # Non-ARO = the rest of the City roster (CHA/multifamily/senior/supportive).
    print(f"Non-ARO listed developments: {len(non_aro)}  (units: {int(non_aro['units'].sum())})")
    print()
    # Build a side-by-side community-area table: ARO dev count vs non-ARO dev count.
    aro_ct = aro.groupby("community_area").size().rename("aro_dev")
    non_ct = non_aro.groupby("community_area").size().rename("nonaro_dev")
    contrast = pd.concat([aro_ct, non_ct], axis=1).fillna(0).astype(int)

    print("Community areas with the MOST ARO developments, shown beside their")
    print("non-ARO (CHA / multifamily / senior / supportive) development counts:")
    print(f"{'community_area':<22}{'ARO dev':>9}{'non-ARO dev':>13}")
    for ca, row in contrast.sort_values("aro_dev", ascending=False).head(8).iterrows():
        print(f"{ca:<22}{row['aro_dev']:>9}{row['nonaro_dev']:>13}")
    print()
    print("Community areas with the MOST NON-ARO developments, shown beside")
    print("their ARO counts (these skew to historically disinvested areas):")
    print(f"{'community_area':<22}{'non-ARO dev':>13}{'ARO dev':>9}")
    for ca, row in contrast.sort_values("nonaro_dev", ascending=False).head(8).iterrows():
        print(f"{ca:<22}{row['nonaro_dev']:>13}{row['aro_dev']:>9}")
    print()

    # How many community areas have non-ARO listings but ZERO ARO listings?
    nonaro_only = contrast[(contrast["aro_dev"] == 0) & (contrast["nonaro_dev"] > 0)]
    both = contrast[(contrast["aro_dev"] > 0) & (contrast["nonaro_dev"] > 0)]
    aro_only = contrast[(contrast["aro_dev"] > 0) & (contrast["nonaro_dev"] == 0)]
    print(f"Community areas with non-ARO listings but ZERO ARO: {len(nonaro_only)}")
    print(f"Community areas with both ARO and non-ARO listings:  {len(both)}")
    print(f"Community areas with ARO but ZERO non-ARO listings:  {len(aro_only)}")

    hr("DONE")


if __name__ == "__main__":
    main()
