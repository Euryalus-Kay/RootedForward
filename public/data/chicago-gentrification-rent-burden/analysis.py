#!/usr/bin/env python3
"""
Rising Asking Rents and Displacement Pressure on Chicago's South Side
=====================================================================

Original analysis backbone for the Rooted Forward research paper
"chicago-gentrification-rent-burden".

Real data only. Two real public datasets, both shipped unchanged in this folder:

  1. zillow-zori-chicago-south-side.csv
     Zillow Observed Rent Index (ZORI), a repeat-rent, dollar-denominated
     asking-rent index (smoothed, 35th-65th percentile of the market,
     controlling for stock quality). Monthly, 2015-01 through 2026-03.
     13 South Side / South-lakefront Chicago ZIP codes, all Cook County.
     Source: Zillow Research, https://www.zillow.com/research/data/
     Methodology: https://www.zillow.com/research/methodology-zori-repeat-rent-27092/

  2. chicago-affordable-rental-housing-developments.csv
     City of Chicago "Affordable Rental Housing Developments" open dataset.
     One row per subsidized/affordable rental development, with community
     area, ZIP, and unit count. Source: City of Chicago Data Portal.

WHAT THIS SCRIPT DOES (descriptive only, no causal claims):
  A. Per-ZIP cumulative ZORI growth, first non-null month to latest month.
  B. Common-baseline indexed trajectories (base = 2018-01 = 100) for the
     subset of ZIPs with complete coverage back to that month, to compare
     the SHAPE of acceleration including the post-2021 surge.
  C. Year-over-year December-to-December growth by ZIP and year, to see
     which years drove the largest jumps.
  D. Cross-reference: count affordable rental developments and units that
     fall inside the 13 ZORI ZIP codes (the affordable-housing buffer in
     the same footprint as the fastest market-rent growth). Ratio only.
  E. Latest-month dollar dispersion across the 13 ZIPs.

Missingness is reported, never imputed. ZIPs enter the panel in different
months (Zillow only publishes a ZIP-month when it has enough signal), so
analyses that need a common baseline are run only on the ZIPs that actually
have that baseline, and the dropped ZIPs are listed explicitly.
"""

import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ZORI_FILE = os.path.join(HERE, "zillow-zori-chicago-south-side.csv")
AFF_FILE = os.path.join(HERE, "chicago-affordable-rental-housing-developments.csv")

# South Side / South-lakefront neighborhood labels for the 13 ZORI ZIPs.
# These are the dominant Chicago community areas covered by each ZIP; they
# are descriptive labels for the write-up, not used in any computation.
ZIP_LABELS = {
    "60608": "Pilsen / Little Village",
    "60609": "Back of the Yards / New City",
    "60615": "Hyde Park / Kenwood",
    "60616": "Near South / Bridgeport",
    "60617": "South Chicago / East Side",
    "60619": "Chatham / Avalon Park",
    "60620": "Auburn Gresham",
    "60621": "Englewood",
    "60628": "Roseland / West Pullman",
    "60637": "Woodlawn",
    "60643": "Beverly / Morgan Park",
    "60649": "South Shore",
    "60653": "Bronzeville / Douglas",
}

BAR = "=" * 70


def load_zori():
    """Return (month_cols, rows) where each row is (zip, {month: float})."""
    with open(ZORI_FILE, newline="") as f:
        reader = list(csv.reader(f))
    header = reader[0]
    month_cols = header[9:]  # cols 0-8 are metadata; the rest are YYYY-MM-DD
    rows = []
    for raw in reader[1:]:
        zip_code = raw[2]  # RegionName
        series = {}
        for m, v in zip(month_cols, raw[9:]):
            v = v.strip()
            if v != "":
                series[m] = float(v)
        rows.append((zip_code, series))
    return month_cols, rows


def fmt_pct(x):
    return f"{x:+.1f}%"


def main():
    month_cols, zori = load_zori()
    first_month, last_month = month_cols[0], month_cols[-1]
    n_zips = len(zori)

    print(BAR)
    print("DATASET 1  Zillow Observed Rent Index (ZORI), South Side ZIPs")
    print(BAR)
    print(f"ZIP codes (regions): {n_zips}")
    print(f"Monthly columns:     {len(month_cols)}  ({first_month} to {last_month})")
    total_cells = n_zips * len(month_cols)
    filled = sum(len(s) for _, s in zori)
    print(f"Panel completeness:  {filled}/{total_cells} ZIP-months populated "
          f"({100 * filled / total_cells:.1f}%); the rest are blank in the "
          f"source and are NOT imputed.")
    print()

    # ---- Per-ZIP coverage (honest missingness) -------------------------
    print("Per-ZIP coverage (first populated month varies by ZIP):")
    print(f"  {'ZIP':<6} {'neighborhood':<26} {'first mo':<11} "
          f"{'months':>7} {'gaps':>5}")
    coverage = {}
    for zip_code, series in zori:
        present = [m for m in month_cols if m in series]
        fm = present[0]
        # gaps = blanks between first populated month and the last column
        span = month_cols[month_cols.index(fm):]
        gaps = sum(1 for m in span if m not in series)
        coverage[zip_code] = (fm, len(present), gaps)
        print(f"  {zip_code:<6} {ZIP_LABELS[zip_code]:<26} {fm:<11} "
              f"{len(present):>7} {gaps:>5}")
    print()

    # ====================================================================
    # A. Per-ZIP cumulative growth, first non-null month -> latest month
    # ====================================================================
    print(BAR)
    print("A. CUMULATIVE ASKING-RENT GROWTH, first populated month -> "
          f"{last_month}")
    print(BAR)
    print("   NOTE: baseline month differs by ZIP (see coverage above), so")
    print("   ZIPs with late starts (e.g. 60643 starts 2023) are measured")
    print("   over a shorter window. Section B re-runs on a common baseline.")
    print()
    growth = []
    for zip_code, series in zori:
        present = [m for m in month_cols if m in series]
        fm, lm = present[0], present[-1]
        fv, lv = series[fm], series[lm]
        pct = (lv / fv - 1.0) * 100.0
        growth.append((zip_code, fm, fv, lm, lv, pct))
    growth.sort(key=lambda r: r[5], reverse=True)

    print(f"  {'rank':<5}{'ZIP':<6} {'neighborhood':<26} {'base$':>8} "
          f"{'latest$':>9} {'window':<11} {'growth':>8}")
    for i, (zip_code, fm, fv, lm, lv, pct) in enumerate(growth, 1):
        print(f"  {i:<5}{zip_code:<6} {ZIP_LABELS[zip_code]:<26} {fv:>8.0f} "
              f"{lv:>9.0f} {fm[:7]:<11} {fmt_pct(pct):>8}")
    pcts = [r[5] for r in growth]
    print()
    print(f"  Range across all {n_zips} ZIPs: {min(pcts):.1f}% to {max(pcts):.1f}%")
    print(f"  Median ZIP growth: {sorted(pcts)[len(pcts)//2]:.1f}%")
    top3 = growth[:3]
    print("  Steepest three: " + ", ".join(
        f"{z} {ZIP_LABELS[z]} {fmt_pct(p)}" for z, _, _, _, _, p in top3))
    print()

    # ====================================================================
    # B. Common-baseline indexed trajectories (base 2018-01 = 100)
    # ====================================================================
    BASE = "2018-01-31"
    print(BAR)
    print(f"B. INDEXED TRAJECTORIES, base {BASE[:7]} = 100 "
          "(common-coverage subset)")
    print(BAR)
    have_base = [(z, s) for z, s in zori if BASE in s and last_month in s]
    dropped = [z for z, s in zori if BASE not in s]
    print(f"  ZIPs with a populated {BASE[:7]} value: {len(have_base)} of "
          f"{n_zips}.")
    print(f"  Dropped for lack of {BASE[:7]} baseline: "
          f"{', '.join(dropped) if dropped else 'none'} "
          f"({', '.join(ZIP_LABELS[z] for z in dropped)})")
    print()
    # Index a handful of comparison checkpoints to show the shape.
    checkpoints = ["2018-01-31", "2020-01-31", "2021-06-30",
                   "2022-06-30", "2024-01-31", last_month]
    cp_labels = [c[:7] for c in checkpoints]
    print(f"  {'ZIP':<6} {'neighborhood':<26} " +
          " ".join(f"{l:>8}" for l in cp_labels))
    indexed_latest = []
    for zip_code, series in sorted(have_base,
                                   key=lambda r: r[1][last_month] / r[1][BASE],
                                   reverse=True):
        base_v = series[BASE]
        cells = []
        for c in checkpoints:
            if c in series:
                cells.append(f"{100 * series[c] / base_v:>8.0f}")
            else:
                cells.append(f"{'NA':>8}")
        idx_latest = 100 * series[last_month] / base_v
        indexed_latest.append((zip_code, idx_latest))
        print(f"  {zip_code:<6} {ZIP_LABELS[zip_code]:<26} " + " ".join(cells))
    print()
    print(f"  Indexed level at {last_month[:7]} (base {BASE[:7]} = 100), "
          "subset summary:")
    vals = [v for _, v in indexed_latest]
    print(f"    highest: {indexed_latest[0][0]} "
          f"{ZIP_LABELS[indexed_latest[0][0]]} = {indexed_latest[0][1]:.0f}")
    print(f"    lowest:  {indexed_latest[-1][0]} "
          f"{ZIP_LABELS[indexed_latest[-1][0]]} = {indexed_latest[-1][1]:.0f}")
    print(f"    mean indexed level: {sum(vals)/len(vals):.0f}")
    print()

    # ====================================================================
    # C. Year-over-year Dec->Dec growth by ZIP and year
    # ====================================================================
    print(BAR)
    print("C. YEAR-OVER-YEAR GROWTH (Dec -> Dec), by ZIP and year")
    print(BAR)
    dec_cols = {c[:4]: c for c in month_cols if c.endswith("-12-31")}
    years_sorted = sorted(dec_cols.keys())
    # Build year transitions like 2018->2019 ... using December levels.
    transitions = list(zip(years_sorted[:-1], years_sorted[1:]))
    # Per-year average YoY across ZIPs that have BOTH Decembers populated.
    print(f"  {'year':<11} {'ZIPs w/ data':>13} {'avg YoY':>9} "
          f"{'min':>7} {'max':>7}")
    year_avgs = []
    for y0, y1 in transitions:
        c0, c1 = dec_cols[y0], dec_cols[y1]
        deltas = []
        for _, series in zori:
            if c0 in series and c1 in series:
                deltas.append((series[c1] / series[c0] - 1.0) * 100.0)
        if deltas:
            avg = sum(deltas) / len(deltas)
            year_avgs.append((f"{y0}->{y1}", avg))
            print(f"  {y0}->{y1:<5} {len(deltas):>13} {avg:>8.1f}% "
                  f"{min(deltas):>6.1f}% {max(deltas):>6.1f}%")
    print()
    year_avgs_sorted = sorted(year_avgs, key=lambda r: r[1], reverse=True)
    print("  Years ranked by average South Side YoY asking-rent growth:")
    for label, avg in year_avgs_sorted:
        print(f"    {label}: {avg:+.1f}%")
    print(f"  Hottest transition: {year_avgs_sorted[0][0]} "
          f"({year_avgs_sorted[0][1]:+.1f}%). "
          f"Coolest: {year_avgs_sorted[-1][0]} "
          f"({year_avgs_sorted[-1][1]:+.1f}%).")
    print()

    # ====================================================================
    # D. Cross-reference: affordable-housing buffer inside the ZORI ZIPs
    # ====================================================================
    print(BAR)
    print("D. AFFORDABLE RENTAL HOUSING inside the 13 ZORI ZIP codes")
    print(BAR)
    zori_zips = set(ZIP_LABELS.keys())
    with open(AFF_FILE, newline="") as f:
        aff = list(csv.DictReader(f))
    total_dev = len(aff)
    total_units = 0.0
    bad_units = 0
    for row in aff:
        try:
            total_units += float(row["units"])
        except (ValueError, KeyError):
            bad_units += 1
    print(f"  Citywide file: {total_dev} developments; "
          f"{total_units:,.0f} units total "
          f"({bad_units} row(s) with non-numeric unit count).")

    in_dev = 0
    in_units = 0.0
    per_zip = {z: [0, 0.0] for z in zori_zips}
    for row in aff:
        z = (row.get("zip_code") or "").strip()
        if z in zori_zips:
            in_dev += 1
            try:
                u = float(row["units"])
            except (ValueError, KeyError):
                u = 0.0
            in_units += u
            per_zip[z][0] += 1
            per_zip[z][1] += u
    print(f"  Inside the 13 ZORI ZIPs: {in_dev} developments; "
          f"{in_units:,.0f} units.")
    print(f"  That is {100 * in_dev / total_dev:.0f}% of the city's "
          f"affordable developments and "
          f"{100 * in_units / total_units:.0f}% of its affordable units, "
          "concentrated in this South Side footprint.")
    print()
    print("  Affordable stock by ZIP (developments / units), with that ZIP's")
    print("  cumulative ZORI growth from Section A for context:")
    growth_by_zip = {r[0]: r[5] for r in growth}
    print(f"  {'ZIP':<6} {'neighborhood':<26} {'devs':>5} {'units':>7} "
          f"{'rent growth':>12}")
    for z in sorted(zori_zips, key=lambda z: per_zip[z][1], reverse=True):
        d, u = per_zip[z]
        print(f"  {z:<6} {ZIP_LABELS[z]:<26} {d:>5} {u:>7.0f} "
              f"{fmt_pct(growth_by_zip[z]):>12}")
    print()

    # ====================================================================
    # E. Latest-month dollar dispersion across the 13 ZIPs
    # ====================================================================
    print(BAR)
    print(f"E. DOLLAR DISPERSION across the 13 ZIPs at {last_month[:7]}")
    print(BAR)
    latest = sorted(((z, s[last_month]) for z, s in zori if last_month in s),
                    key=lambda r: r[1])
    lo_z, lo_v = latest[0]
    hi_z, hi_v = latest[-1]
    vals = [v for _, v in latest]
    mean_v = sum(vals) / len(vals)
    print(f"  All {len(latest)} ZIPs report a {last_month[:7]} value.")
    print(f"  Lowest:  {lo_z} {ZIP_LABELS[lo_z]} = ${lo_v:,.0f}")
    print(f"  Highest: {hi_z} {ZIP_LABELS[hi_z]} = ${hi_v:,.0f}")
    print(f"  Spread:  ${hi_v - lo_v:,.0f} "
          f"({hi_v / lo_v:.2f}x between top and bottom ZIP)")
    print(f"  Mean across ZIPs: ${mean_v:,.0f}")
    print()
    print("  Every ZIP, cheapest to priciest, latest month:")
    for z, v in latest:
        print(f"    {z}  {ZIP_LABELS[z]:<26} ${v:,.0f}")
    print()
    print(BAR)
    print("END OF ANALYSIS")
    print(BAR)


if __name__ == "__main__":
    main()
