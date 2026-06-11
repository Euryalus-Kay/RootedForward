#!/usr/bin/env python3
"""
Forty Years of Public Subsidy on San Francisco's Western Addition Renewal Footprint
===================================================================================

Original descriptive analysis for the Rooted Forward research paper
"comparative-urban-renewal-displacement".

DATA (real, shipped in this folder, unmodified):
  - fillmore-western-addition-developments.csv (325 rows)
        A former-SFRA / OCII project-area slice of the MOHCD/OCII Affordable
        Housing Portfolio. Every row carries an `ocii_project_area` label.
  - sf-mohcd-affordable-housing-portfolio.csv (849 rows)
        The citywide MOHCD/OCII Affordable Housing Portfolio. The 325 rows in
        the developments file are a strict subset of these 849 rows (verified
        below by id containment), so this file is the citywide comparison
        universe.

SOURCE: City and County of San Francisco, Mayor's Office of Housing and
Community Development (MOHCD) / Office of Community Investment and
Infrastructure (OCII), published via DataSF (Socrata dataset aaxw-2cb8).

WHAT THIS SCRIPT DOES (all numbers printed are computed from the CSVs):
  1. Isolates the OCII "Western Addition-Area 2" renewal footprint and counts
     developments, total units, and income-restricted units.
  2. Tabulates tenure (rental vs ownership) and development type on the
     footprint and compares to the citywide portfolio.
  3. Builds a construction-decade timeline of when WA-Area 2 subsidized units
     came online.
  4. Computes who the rebuilt stock serves (senior, formerly-homeless, and
     bedroom-mix shares) on the footprint vs citywide.
  5. Prints the rebuilt-unit counts beside the EXTERNAL historical displacement
     record (city ~5,893-household estimate; ~250 Certificate-of-Preference
     holders housed 2014-2024). Those displacement figures are NOT computed
     from this dataset; they come from the literature and city records and are
     printed only for framing.

Missingness is reported, never silently imputed.

Run:
  /Users/zainzaidi/.rf-analysis-venv/bin/python analysis.py
"""

import os
import pandas as pd

pd.set_option("display.width", 100)

HERE = os.path.dirname(os.path.abspath(__file__))
DEV_PATH = os.path.join(HERE, "fillmore-western-addition-developments.csv")
PORT_PATH = os.path.join(HERE, "sf-mohcd-affordable-housing-portfolio.csv")

BEDROOM_COLS = [
    "sro_units_rollup",
    "studios_units_rollup",
    "_1_bedroom_units_rollup",
    "_2_bedroom_units_rollup",
    "_3_bedroom_units_rollup",
    "_4_bedroom_units_rollup",
    "_5_bedroom_units_rollup",
]


def rule(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


def main():
    dev = pd.read_csv(DEV_PATH)
    port = pd.read_csv(PORT_PATH)

    rule("0. DATA LOADED AND STRUCTURE VERIFIED")
    print(f"developments file rows : {len(dev)}")
    print(f"citywide portfolio rows: {len(port)}")
    dev_ids = set(dev["mohcd_development_id"])
    port_ids = set(port["mohcd_development_id"])
    print(f"developments ids also present in citywide portfolio: "
          f"{len(dev_ids & port_ids)} of {len(dev_ids)}")
    print(f"developments ids NOT in citywide portfolio: {len(dev_ids - port_ids)}")
    print("-> the renewal-footprint file is a strict subset of the citywide "
          "portfolio,\n   so the 849-row portfolio is used as the citywide "
          "comparison universe.")

    # ------------------------------------------------------------------
    # 1. The OCII Western Addition-Area 2 renewal footprint
    # ------------------------------------------------------------------
    rule("1. OCII WESTERN ADDITION-AREA 2 RENEWAL FOOTPRINT")
    wa2 = dev[dev["ocii_project_area"] == "Western Addition-Area 2"].copy()
    wa2_units = int(wa2["total_project_units"].sum())
    wa2_incr = int(wa2["income_restricted_resid_units"].sum())
    print(f"subsidized developments on the footprint : {len(wa2)}")
    print(f"total project units                      : {wa2_units}")
    print(f"income-restricted residential units      : {wa2_incr}")
    print(f"income-restricted share of total units   : "
          f"{100 * wa2_incr / wa2_units:.1f}%")
    print(f"missing total_project_units rows         : "
          f"{wa2['total_project_units'].isna().sum()}")
    print(f"missing income_restricted rows           : "
          f"{wa2['income_restricted_resid_units'].isna().sum()}")

    print("\nAll OCII project areas in the developments file "
          "(in-OCII rows only), by units:")
    in_ocii = dev[dev["ocii_project_area"] != "Not in an OCII Project Area"]
    by_area = (
        in_ocii.groupby("ocii_project_area")
        .agg(
            developments=("mohcd_development_id", "count"),
            total_units=("total_project_units", "sum"),
            income_restricted=("income_restricted_resid_units", "sum"),
        )
        .sort_values("total_units", ascending=False)
        .astype({"total_units": int, "income_restricted": int})
    )
    print(by_area.to_string())
    print(f"\nTOTAL across all OCII project areas: "
          f"{by_area['developments'].sum()} developments, "
          f"{by_area['total_units'].sum()} units, "
          f"{by_area['income_restricted'].sum()} income-restricted.")

    # ------------------------------------------------------------------
    # 2. Tenure and development-type mix vs citywide
    # ------------------------------------------------------------------
    rule("2. TENURE AND DEVELOPMENT-TYPE MIX (FOOTPRINT vs CITYWIDE)")

    print(">> Tenure, Western Addition-Area 2 (count of developments):")
    wa2_ten = wa2["tenure"].value_counts(dropna=False)
    for k, v in wa2_ten.items():
        print(f"   {k:12s}: {v:3d}  ({100 * v / len(wa2):.1f}%)")

    print("\n>> Tenure, citywide portfolio (count of developments):")
    port_ten = port["tenure"].value_counts(dropna=False)
    for k, v in port_ten.items():
        print(f"   {k:12s}: {v:3d}  ({100 * v / len(port):.1f}%)")

    print("\n>> Development type, Western Addition-Area 2:")
    for k, v in wa2["development_type"].value_counts(dropna=False).items():
        print(f"   {k:18s}: {v:3d}  ({100 * v / len(wa2):.1f}%)")

    print("\n>> Development type, citywide portfolio:")
    for k, v in port["development_type"].value_counts(dropna=False).items():
        print(f"   {k:18s}: {v:3d}  ({100 * v / len(port):.1f}%)")

    # ------------------------------------------------------------------
    # 3. Construction-decade timeline on the footprint
    # ------------------------------------------------------------------
    rule("3. WHEN THE FOOTPRINT WAS REBUILT (CONSTRUCTION DECADE)")
    wa2["constr_date"] = pd.to_datetime(
        wa2["estimated_actual_construction"], errors="coerce"
    )
    n_bad = wa2["constr_date"].isna().sum()
    print(f"developments with a parseable construction date: "
          f"{wa2['constr_date'].notna().sum()} of {len(wa2)} "
          f"(unparseable/blank: {n_bad})")
    print(f"earliest dated construction: {wa2['constr_date'].min().date()}")
    print(f"latest dated construction  : {wa2['constr_date'].max().date()} "
          f"(some rows are still in progress / future-dated)")

    wa2_dated = wa2[wa2["constr_date"].notna()].copy()
    wa2_dated["decade"] = (wa2_dated["constr_date"].dt.year // 10 * 10).astype(int)
    dec = (
        wa2_dated.groupby("decade")
        .agg(
            developments=("mohcd_development_id", "count"),
            units=("total_project_units", "sum"),
        )
        .astype({"units": int})
        .sort_index()
    )
    print("\nWestern Addition-Area 2 subsidized units coming online, by decade:")
    print(f"   {'decade':>8}  {'developments':>12}  {'units':>6}")
    for d, row in dec.iterrows():
        print(f"   {str(d) + 's':>8}  {row['developments']:>12d}  {row['units']:>6d}")
    print("\nClearance of the Western Addition occurred in the 1950s-60s; the "
          "earliest\nsubsidized rebuild dated on this footprint is "
          f"{wa2['constr_date'].min().date()} and the bulk arrives in the "
          "2000s-2010s.")

    # ------------------------------------------------------------------
    # 4. Who the rebuilt stock serves
    # ------------------------------------------------------------------
    rule("4. WHO THE REBUILT STOCK SERVES (FOOTPRINT vs CITYWIDE)")
    wa2_tot = wa2_units
    port_tot = int(port["total_project_units"].sum())

    def share(df, col, denom):
        return int(df[col].sum()), 100 * df[col].sum() / denom

    print("Formerly-homeless and senior units (share of total units):")
    for label, col in [("formerly-homeless", "homeless_units_rollup"),
                       ("senior", "senior_units_rollup")]:
        w_n, w_p = share(wa2, col, wa2_tot)
        c_n, c_p = share(port, col, port_tot)
        print(f"   {label:18s}  footprint: {w_n:5d} ({w_p:4.1f}%)   "
              f"citywide: {c_n:6d} ({c_p:4.1f}%)")

    print("\nNOTE on senior_units_rollup: this field is sparsely reported. Only "
          f"{(port['senior_units_rollup'] > 0).sum()} of {len(port)} citywide "
          f"developments and {(wa2['senior_units_rollup'] > 0).sum()} of "
          f"{len(wa2)} footprint developments\nrecord any senior units, so the "
          "senior share understates senior housing and is shown for "
          "transparency only.")

    print("\nBedroom mix on the Western Addition-Area 2 footprint "
          "(share of total units):")
    for col in BEDROOM_COLS:
        n, p = share(wa2, col, wa2_tot)
        nice = (col.replace("_units_rollup", "")
                   .replace("_", " ").strip()
                   .replace("sro", "SRO").replace("studios", "studio"))
        print(f"   {nice:12s}: {n:4d}  ({p:4.1f}%)")
    wa2_bed_sum = int(wa2[BEDROOM_COLS].sum().sum())
    print(f"   sum of bedroom rollups: {wa2_bed_sum} of {wa2_tot} total units "
          f"({100 * wa2_bed_sum / wa2_tot:.1f}%); the remainder is treatment "
          "beds / unspecified.")

    print("\nBedroom mix citywide portfolio (share of total units):")
    for col in BEDROOM_COLS:
        n, p = share(port, col, port_tot)
        nice = (col.replace("_units_rollup", "")
                   .replace("_", " ").strip()
                   .replace("sro", "SRO").replace("studios", "studio"))
        print(f"   {nice:12s}: {n:5d}  ({p:4.1f}%)")

    # Small-unit (SRO + studio) concentration, footprint vs citywide
    small_cols = ["sro_units_rollup", "studios_units_rollup"]
    wa2_small = 100 * wa2[small_cols].sum().sum() / wa2_tot
    port_small = 100 * port[small_cols].sum().sum() / port_tot
    print(f"\nSmall units (SRO + studio) share -> footprint: {wa2_small:.1f}%   "
          f"citywide: {port_small:.1f}%")
    fam_cols = ["_2_bedroom_units_rollup", "_3_bedroom_units_rollup",
                "_4_bedroom_units_rollup", "_5_bedroom_units_rollup"]
    wa2_fam = 100 * wa2[fam_cols].sum().sum() / wa2_tot
    port_fam = 100 * port[fam_cols].sum().sum() / port_tot
    print(f"Family-size units (2BR+) share   -> footprint: {wa2_fam:.1f}%   "
          f"citywide: {port_fam:.1f}%")

    # ------------------------------------------------------------------
    # 5. Rebuilt vs removed (EXTERNAL displacement figures)
    # ------------------------------------------------------------------
    rule("5. REBUILT (THIS DATA) vs REMOVED (EXTERNAL LITERATURE FIGURES)")
    print("Computed from this dataset:")
    print(f"   subsidized units rebuilt on the WA-Area 2 footprint : {wa2_units}")
    print(f"   of which income-restricted                          : {wa2_incr}")
    print("\nEXTERNAL figures (NOT computed from this dataset; from the "
          "historical\nrecord and city documents, cited in the paper):")
    DISPLACED_HOUSEHOLDS = 5893          # city's own Western Addition displacement estimate
    COP_HOUSED_2014_2024 = 250           # Certificate-of-Preference holders housed, 2014-2024
    print(f"   households displaced by Western Addition renewal     : "
          f"~{DISPLACED_HOUSEHOLDS} (city estimate, external)")
    print(f"   Certificate-of-Preference holders housed 2014-2024   : "
          f"~{COP_HOUSED_2014_2024} (external)")
    print("\nFraming ratio (external displacement vs rebuilt subsidized units):")
    print(f"   rebuilt subsidized units per displaced household     : "
          f"{wa2_units / DISPLACED_HOUSEHOLDS:.2f}")
    print(f"   i.e. ~{wa2_units} subsidized units now stand against an "
          f"estimated ~{DISPLACED_HOUSEHOLDS}\n   households removed decades "
          "earlier. The rebuild is partial and slow.")
    print("\nIMPORTANT: the displacement counts above are external inputs for "
          "framing only.\nThis dataset does not contain or measure the people "
          "displaced in the 1950s-60s.")


if __name__ == "__main__":
    main()
