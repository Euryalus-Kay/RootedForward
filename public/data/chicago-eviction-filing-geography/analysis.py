#!/usr/bin/env python3
"""
Where Chicago Files Evictions and Who Bears the Filings
=======================================================

Descriptive analysis of the geography of residential eviction filings in
Chicago, 2010-2019, using the Law Center for Better Housing (LCBH) Chicago
Evictions Data, Release 2 (published December 2020).

Source files shipped in this directory (unmodified from the LCBH ZIP):
  - eviction_data_comm_area.csv  77 community areas x 10 years (770 rows)
  - eviction_data_chicago.csv    citywide totals, 10 years
  - eviction_data_tract.csv      804 census tracts x 10 years (8,040 rows)
  - census_data_comm_area.csv    ACS 5-year housing-unit counts per area
                                 (2006-2010 and 2014-2018 estimates)

Field-definition notes that govern the analysis (from
eviction_data_field_definitions.pdf):
  - eviction_filings_rate = eviction filings per 100 rental units.
  - eviction_filings_total and the rate INCLUDE sealed and unclear cases.
  - Every other field (representation, eviction orders, back rent) is
    computed on "completed" cases only (unsealed, clear results).
  - back_rent_median excludes $0 values.

This script reports only descriptive statistics. It makes no causal claim.
Every printed number is computed directly from the real CSVs above.
"""

import os
import pandas as pd
import numpy as np

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 50)

HERE = os.path.dirname(os.path.abspath(__file__))


def load():
    area = pd.read_csv(os.path.join(HERE, "eviction_data_comm_area.csv"))
    city = pd.read_csv(os.path.join(HERE, "eviction_data_chicago.csv"))
    tract = pd.read_csv(os.path.join(HERE, "eviction_data_tract.csv"))
    census = pd.read_csv(os.path.join(HERE, "census_data_comm_area.csv"))
    return area, city, tract, census


def hr(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def main():
    area, city, tract, census = load()

    # ---- Data shape and integrity ------------------------------------------
    hr("0. DATA SHAPE AND COMPLETENESS")
    print(f"Community-area file : {area.shape[0]} rows x {area.shape[1]} cols")
    print(f"  years           : {area['filing_year'].min()}-{area['filing_year'].max()}"
          f"  ({area['filing_year'].nunique()} years)")
    print(f"  community areas : {area['area_number'].nunique()} "
          f"(numbers {area['area_number'].min()}-{area['area_number'].max()})")
    print(f"  rows per year   : "
          f"{sorted(area.groupby('filing_year').size().unique().tolist())}")
    print(f"Citywide file       : {city.shape[0]} rows (one per year)")
    print(f"Census-tract file   : {tract.shape[0]} rows, "
          f"{tract['tract'].nunique()} tracts x {tract['filing_year'].nunique()} years")

    key = ["eviction_filings_total", "eviction_filings_rate",
           "eviction_filings_completed", "landlord_represented",
           "tenant_represented", "tenant_prose", "eviction_order_yes",
           "default_eviction_order_yes", "back_rent_median"]
    nulls = area[key].isna().sum()
    print(f"\nMissing values in key community-area fields (of {len(area)} rows):")
    if nulls.sum() == 0:
        print("  none - every community-area row is fully populated, no suppression.")
    else:
        print(nulls[nulls > 0].to_string())

    # =======================================================================
    # ANALYSIS 1: Rank community areas by mean annual filing rate 2010-2019
    # =======================================================================
    hr("1. WHERE FILINGS CONCENTRATE  (mean annual rate per 100 rental units, 2010-2019)")

    area_mean = (area.groupby(["area_number", "area_name"])["eviction_filings_rate"]
                 .mean().reset_index()
                 .sort_values("eviction_filings_rate", ascending=False)
                 .reset_index(drop=True))
    area_mean["rank"] = area_mean.index + 1

    city_mean_rate = city["eviction_filings_rate"].mean()
    print(f"Citywide mean annual filing rate, 2010-2019 : {city_mean_rate:.2f} per 100 rental units")
    print(f"Median community-area mean rate              : {area_mean['eviction_filings_rate'].median():.2f}")
    print(f"Mean across the 77 community areas           : {area_mean['eviction_filings_rate'].mean():.2f}")

    print("\nTop 10 community areas by mean annual filing rate (2010-2019):")
    print(f"{'rank':>4}  {'community area':<26}{'mean rate':>10}{'x citywide':>12}")
    for _, r in area_mean.head(10).iterrows():
        print(f"{int(r['rank']):>4}  {r['area_name']:<26}{r['eviction_filings_rate']:>10.2f}"
              f"{r['eviction_filings_rate']/city_mean_rate:>11.2f}x")

    print("\nBottom 5 community areas by mean annual filing rate (for contrast):")
    for _, r in area_mean.tail(5).iterrows():
        print(f"{int(r['rank']):>4}  {r['area_name']:<26}{r['eviction_filings_rate']:>10.2f}"
              f"{r['eviction_filings_rate']/city_mean_rate:>11.2f}x")

    top10_names = area_mean.head(10)["area_name"].tolist()
    print(f"\nTop-10 areas (highest-burden set): {', '.join(top10_names)}")

    # South Shore specifically, the lead area in the thesis
    ss = area[area["area_name"] == "South Shore"].sort_values("filing_year")
    ss_2019 = ss[ss["filing_year"] == 2019]["eviction_filings_rate"].iloc[0]
    city_2019 = city[city["filing_year"] == 2019]["eviction_filings_rate"].iloc[0]
    ss_mean = ss["eviction_filings_rate"].mean()
    print(f"\nSouth Shore: 2019 rate {ss_2019:.2f} vs citywide 2019 {city_2019:.2f} "
          f"= {ss_2019/city_2019:.2f}x")
    print(f"South Shore: 2010-2019 mean rate {ss_mean:.2f} vs citywide mean "
          f"{city_mean_rate:.2f} = {ss_mean/city_mean_rate:.2f}x")

    # =======================================================================
    # ANALYSIS 2: Share of citywide filings vs share of citywide rental units
    # =======================================================================
    hr("2. OVER-CONCENTRATION  (share of citywide filings vs share of rental units)")

    # Total filings per area across all 10 years (uses eviction_filings_total,
    # which by definition includes sealed/unclear cases - the full filing count).
    area_tot = (area.groupby(["area_number", "area_name"])["eviction_filings_total"]
                .sum().reset_index())
    total_filings_all = area_tot["eviction_filings_total"].sum()
    area_tot["share_filings_pct"] = 100 * area_tot["eviction_filings_total"] / total_filings_all

    # Rental units: ACS 2014-2018 5-year estimate, the more recent period
    # overlapping the filing window. One housing-stock snapshot per area.
    rental = census[census["census_year"] == "2014-2018 5-year estimates"][
        ["area_number", "area_name", "housing_units_rental"]].copy()
    total_rental = rental["housing_units_rental"].sum()
    rental["share_rental_pct"] = 100 * rental["housing_units_rental"] / total_rental

    merged = area_tot.merge(rental, on=["area_number", "area_name"])
    merged["concentration_ratio"] = merged["share_filings_pct"] / merged["share_rental_pct"]
    merged = merged.sort_values("share_filings_pct", ascending=False).reset_index(drop=True)

    print(f"Total residential eviction filings, all 77 areas, 2010-2019 : {total_filings_all:,}")
    print(f"Total rental units, ACS 2014-2018 (sum of 77 areas)         : {total_rental:,}")
    print("\nConcentration ratio = (area's share of filings) / (area's share of rental units).")
    print("A value above 1.0 means the area carries more filings than its rental stock would imply.\n")

    print(f"{'community area':<26}{'%filings':>9}{'%rental':>9}{'ratio':>8}")
    show = merged.head(10)
    for _, r in show.iterrows():
        print(f"{r['area_name']:<26}{r['share_filings_pct']:>8.2f}%{r['share_rental_pct']:>8.2f}%"
              f"{r['concentration_ratio']:>8.2f}")

    top10_filing_share = merged.head(10)["share_filings_pct"].sum()
    top10_rental_share = merged.head(10)["share_rental_pct"].sum()
    print(f"\nTop 10 areas by filing volume together hold "
          f"{top10_filing_share:.1f}% of all citywide filings")
    print(f"  while holding only {top10_rental_share:.1f}% of citywide rental units "
          f"(ratio {top10_filing_share/top10_rental_share:.2f}).")

    # =======================================================================
    # ANALYSIS 3: Time trend 2010-2019, citywide vs top-burden areas
    # =======================================================================
    hr("3. PERSISTENCE OVER TIME  (filing rate by year, 2010-2019)")

    city_trend = city.sort_values("filing_year")[
        ["filing_year", "eviction_filings_total", "eviction_filings_rate"]]
    print("Citywide:")
    print(f"{'year':>6}{'filings':>10}{'rate':>8}")
    for _, r in city_trend.iterrows():
        print(f"{int(r['filing_year']):>6}{int(r['eviction_filings_total']):>10}"
              f"{r['eviction_filings_rate']:>8.2f}")
    c_first = city_trend.iloc[0]
    c_last = city_trend.iloc[-1]
    print(f"\nCitywide filings fell {int(c_first['eviction_filings_total']):,} -> "
          f"{int(c_last['eviction_filings_total']):,} "
          f"({100*(c_last['eviction_filings_total']-c_first['eviction_filings_total'])/c_first['eviction_filings_total']:+.1f}%).")
    print(f"Citywide rate fell {c_first['eviction_filings_rate']:.2f} -> "
          f"{c_last['eviction_filings_rate']:.2f} per 100 rental units.")

    # Rate trend for the four lead high-burden areas
    lead = ["South Shore", "Englewood", "West Englewood", "Auburn Gresham"]
    lead = [a for a in lead if a in area["area_name"].values]
    print(f"\nFiling rate by year for lead high-burden areas vs citywide:")
    pv = area[area["area_name"].isin(lead)].pivot_table(
        index="filing_year", columns="area_name", values="eviction_filings_rate")
    pv = pv[lead]  # column order
    pv["Citywide"] = city.set_index("filing_year")["eviction_filings_rate"]
    header = "  year  " + "".join(f"{c[:14]:>15}" for c in pv.columns)
    print(header)
    for yr, row in pv.iterrows():
        print(f"{int(yr):>6}  " + "".join(f"{v:>15.2f}" for v in row.values))

    print("\nEach lead area's min and max rate over the decade (shows the floor stays high):")
    for a in lead:
        sub = area[area["area_name"] == a]["eviction_filings_rate"]
        print(f"  {a:<18} min {sub.min():>5.2f}  max {sub.max():>5.2f}  mean {sub.mean():>5.2f}")

    # South Shore filing counts and rental stock, for the in-text scale claims
    ss_yr = area[area["area_name"] == "South Shore"].sort_values("filing_year")
    print("\nSouth Shore filings by year (eviction_filings_total):")
    print(f"{'year':>6}{'filings':>10}{'rate':>8}")
    for _, r in ss_yr.iterrows():
        print(f"{int(r['filing_year']):>6}{int(r['eviction_filings_total']):>10}"
              f"{r['eviction_filings_rate']:>8.2f}")
    ss_census = census[census["area_name"] == "South Shore"]
    for _, r in ss_census.iterrows():
        print(f"  South Shore rental units, ACS {r['census_year']}: "
              f"{int(r['housing_units_rental']):,}")

    # 2019 snapshot: the highest-rate areas in the final year of the series
    yr2019 = (area[area["filing_year"] == 2019]
              .nlargest(12, "eviction_filings_rate"))
    print("\nTop 12 community areas by filing rate, 2019 only:")
    print(f"{'rank':>4}  {'community area':<26}{'2019 rate':>10}")
    for i, (_, r) in enumerate(yr2019.iterrows(), 1):
        print(f"{i:>4}  {r['area_name']:<26}{r['eviction_filings_rate']:>10.2f}")

    # Stability of the geography: are the same areas on top every year?
    hr("3b. IS IT THE SAME GEOGRAPHY EVERY YEAR?  (top-10-by-rate membership)")
    top10_each_year = {}
    for yr in sorted(area["filing_year"].unique()):
        yr_top = (area[area["filing_year"] == yr]
                  .nlargest(10, "eviction_filings_rate")["area_name"].tolist())
        top10_each_year[yr] = set(yr_top)
    # Areas that appear in the top 10 in all 10 years
    always = set.intersection(*top10_each_year.values())
    print(f"Community areas in the top 10 by filing rate in ALL 10 years "
          f"({len(always)} areas):")
    for a in sorted(always, key=lambda n: area_mean[area_mean['area_name']==n]['rank'].iloc[0]):
        print(f"  - {a}")
    # how many distinct areas ever touched the top 10
    ever = set().union(*top10_each_year.values())
    print(f"\nDistinct areas that EVER reached the top 10 across the decade: {len(ever)}")
    print(f"(Out of 77. A small, stable set of neighborhoods recurs year after year.)")

    # =======================================================================
    # ANALYSIS 4: Representation and default judgments by burden tier
    # =======================================================================
    hr("4. REPRESENTATION AND DEFAULT JUDGMENTS  (completed cases only)")
    print("Note: representation and eviction-order fields cover COMPLETED cases")
    print("(unsealed, clear results), per the LCBH field definitions.\n")

    # Build per-area completed-case aggregates across all years
    rep = area.groupby(["area_number", "area_name"]).agg(
        completed=("eviction_filings_completed", "sum"),
        landlord_rep=("landlord_represented", "sum"),
        landlord_prose=("landlord_prose", "sum"),
        tenant_rep=("tenant_represented", "sum"),
        tenant_prose=("tenant_prose", "sum"),
        order_yes=("eviction_order_yes", "sum"),
        default_yes=("default_eviction_order_yes", "sum"),
    ).reset_index()
    rep["pct_landlord_rep"] = 100 * rep["landlord_rep"] / rep["completed"]
    rep["pct_tenant_rep"] = 100 * rep["tenant_rep"] / rep["completed"]
    rep["pct_tenant_prose"] = 100 * rep["tenant_prose"] / rep["completed"]
    # default judgments as a share of all completed cases
    rep["pct_default_of_completed"] = 100 * rep["default_yes"] / rep["completed"]

    # Citywide completed-case baseline (sum across years of the Chicago file)
    c_completed = city["eviction_filings_completed"].sum()
    c_landlord_rep = city["landlord_represented"].sum()
    c_tenant_rep = city["tenant_represented"].sum()
    c_tenant_prose = city["tenant_prose"].sum()
    c_default = city["default_eviction_order_yes"].sum()
    print("Citywide, completed cases pooled across 2010-2019:")
    print(f"  landlord represented by attorney : {100*c_landlord_rep/c_completed:5.1f}%")
    print(f"  tenant represented by attorney   : {100*c_tenant_rep/c_completed:5.1f}%")
    print(f"  tenant pro se (no attorney)      : {100*c_tenant_prose/c_completed:5.1f}%")
    print(f"  default eviction order entered   : {100*c_default/c_completed:5.1f}%  "
          f"(of all completed cases)")

    print(f"\nThe representation gap is citywide and stark: landlords have counsel in")
    print(f"{100*c_landlord_rep/c_completed:.0f}% of completed cases, tenants in only "
          f"{100*c_tenant_rep/c_completed:.0f}%.")

    # Show the same metrics for the top-10-rate areas
    top10_set = set(top10_names)
    rep_top = rep[rep["area_name"].isin(top10_set)]
    print(f"\nTop-10-rate areas, completed cases pooled 2010-2019:")
    print(f"{'community area':<26}{'land.rep%':>10}{'ten.rep%':>10}{'ten.prose%':>12}{'default%':>10}")
    rep_top_sorted = rep_top.set_index("area_name").loc[
        [n for n in top10_names if n in rep_top["area_name"].values]].reset_index()
    for _, r in rep_top_sorted.iterrows():
        print(f"{r['area_name']:<26}{r['pct_landlord_rep']:>9.1f}%{r['pct_tenant_rep']:>9.1f}%"
              f"{r['pct_tenant_prose']:>11.1f}%{r['pct_default_of_completed']:>9.1f}%")

    print(f"\nMean tenant-representation rate, top-10-rate areas : "
          f"{rep_top['pct_tenant_rep'].mean():.1f}%")
    rest = rep[~rep["area_name"].isin(top10_set)]
    print(f"Mean tenant-representation rate, other 67 areas    : "
          f"{rest['pct_tenant_rep'].mean():.1f}%")
    print(f"Mean default-judgment rate, top-10-rate areas      : "
          f"{rep_top['pct_default_of_completed'].mean():.1f}%")
    print(f"Mean default-judgment rate, other 67 areas         : "
          f"{rest['pct_default_of_completed'].mean():.1f}%")
    print("\n(Descriptive association only. These are pooled neighborhood rates,")
    print(" not a causal estimate of representation's effect on outcomes.)")

    # =======================================================================
    # ANALYSIS 5: Back rent at filing - how large are the arrears?
    # =======================================================================
    hr("5. BACK RENT AT FILING  (completed cases, citywide pooled 2010-2019)")
    print("Back-rent bands cover completed cases. back_rent_median excludes $0.\n")

    bands = ["back_rent_0", "back_rent_1_to_999", "back_rent_1000_to_2499",
             "back_rent_2500_to_4999", "back_rent_5000_or_more"]
    band_labels = ["$0 (no back rent)", "$1-$999", "$1,000-$2,499",
                   "$2,500-$4,999", "$5,000+"]
    band_tot = city[bands].sum()
    band_total_cases = band_tot.sum()
    print(f"Total completed cases with a back-rent band, 2010-2019: {int(band_total_cases):,}")
    print(f"\n{'back rent at filing':<22}{'cases':>10}{'share':>9}")
    cum = 0.0
    for lab, b in zip(band_labels, bands):
        pct = 100 * band_tot[b] / band_total_cases
        cum += pct
        print(f"{lab:<22}{int(band_tot[b]):>10}{pct:>8.1f}%")
    # Share at or under $2,499 (the "relatively small arrears" claim)
    under_2500 = (band_tot["back_rent_0"] + band_tot["back_rent_1_to_999"]
                  + band_tot["back_rent_1000_to_2499"])
    pct_under_2500 = 100 * under_2500 / band_total_cases
    under_1000 = band_tot["back_rent_0"] + band_tot["back_rent_1_to_999"]
    pct_under_1000 = 100 * under_1000 / band_total_cases
    print(f"\nShare of completed cases with back rent under $1,000  : {pct_under_1000:.1f}%")
    print(f"Share of completed cases with back rent under $2,500  : {pct_under_2500:.1f}%")

    # Median of the yearly citywide medians (a simple summary, not a pooled median)
    med_series = city.sort_values("filing_year")[["filing_year", "back_rent_median"]]
    print(f"\nCitywide median back rent sought by year (excludes $0 cases):")
    print(f"{'year':>6}{'median $':>12}")
    for _, r in med_series.iterrows():
        print(f"{int(r['filing_year']):>6}{r['back_rent_median']:>12.0f}")
    print(f"\nRange of yearly citywide median back rent: "
          f"${med_series['back_rent_median'].min():.0f} to "
          f"${med_series['back_rent_median'].max():.0f}.")

    hr("DONE")
    print("All figures above are computed directly from the LCBH Release 2 CSVs")
    print("shipped in this directory. No values were imputed or fabricated.")


if __name__ == "__main__":
    main()
