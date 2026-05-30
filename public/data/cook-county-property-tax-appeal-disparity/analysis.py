#!/usr/bin/env python3
"""
Who Wins the Cook County Property Tax Appeal
=============================================

Descriptive analysis backbone for the Rooted Forward paper
"Who Wins the Cook County Property Tax Appeal".

DATA
----
public/data/cook-county-property-tax-appeal-disparity/cook-appeals-sample.csv
A 5,000-row sample of Cook County Assessor administrative appeal records
(Cook County Open Data, Assessor Appeals). One row = one parcel appeal.
Each row carries the PIN, tax year, property class, township code, the
appeal/hearing type, the values the Assessor mailed (the proposed
assessment), the values certified after the appeal, an assessor "change"
flag, and up to three reason codes.

WHAT THIS SCRIPT DOES
---------------------
A strictly descriptive who-files-and-who-wins portrait:
  1. Profiles the sample (years present, appeal-type mix, township mix).
  2. Defines an appeal "win" as a real reduction in total assessed value
     (certified_tot < mailed_tot) and reports the win rate by property
     appeal type and by township.
  3. Reports the size of the cut won (median percent reduction) for the
     appeals that did win, again by appeal type.
  4. Reports filing share (who shows up) vs win share (who walks away with
     a cut) by appeal type.

HONESTY NOTES (see also the printed CAVEATS block)
  - The sample is 99.2% tax year 2003. All rate/share statistics below are
    computed on the tax-year-2003 rows ONLY so that one assessment cycle is
    not mixed with stray rows from other years.
  - "Win" = the certified total came in below the mailed total. This is the
    taxpayer's actual economic outcome. It is NOT identical to the
    Assessor's own "change" flag, which also flips when a building/land
    split is re-balanced but the total is unchanged. The script prints the
    cross-tab so the reader can see the gap.
  - Rows with a missing certified total (pending/open cases) are excised
    from win-rate denominators and counted explicitly, never imputed.
  - This file describes WHO files and WHO wins. It makes NO claim about
    race or income. Any regressivity-by-race/income argument in the paper
    is carried by the cited literature, not by these numbers.

Run:
  python analysis.py
"""

import os
import pandas as pd
import numpy as np

pd.set_option("display.width", 120)
pd.set_option("display.max_columns", 30)

HERE = os.path.dirname(os.path.abspath(__file__))
CSV = os.path.join(HERE, "cook-appeals-sample.csv")

# Cook County Assessor township codes -> names.
# Source: Cook County Assessor's Office (CCAO) township numbering, the
# standard two-digit codes used in the Assessor's administrative files.
# Verified internally against PIN area prefixes in this same sample
# (each township code maps 1:1 to a distinct PIN area).
TOWNSHIP_NAMES = {
    "10": "Barrington", "16": "Elk Grove", "17": "Evanston",
    "18": "Hanover", "20": "Leyden", "22": "Maine", "23": "New Trier",
    "24": "Niles", "25": "Northfield", "26": "Norwood Park",
    "29": "Palatine", "35": "Schaumburg", "38": "Wheeling",
    "11": "Berwyn", "12": "Bloom", "13": "Bremen", "14": "Calumet",
    "15": "Cicero", "19": "Lemont", "21": "Lyons", "27": "Oak Park",
    "28": "Orland", "30": "Palos", "31": "Proviso", "32": "Rich",
    "33": "River Forest", "34": "Riverside", "36": "Stickney",
    "37": "Thornton", "39": "Worth",
    "70": "Hyde Park", "71": "Jefferson", "72": "Lake", "73": "Lake View",
    "74": "North Chicago", "75": "Rogers Park", "76": "South Chicago",
    "77": "West Chicago",
}


def banner(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------
df = pd.read_csv(CSV, dtype=str)

# Numeric value columns: coerce, leaving non-parseable as NaN (not 0).
for col in ["mailed_tot", "certified_tot"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

banner("0. SAMPLE OVERVIEW (all rows, before any filtering)")
print(f"Total rows in shipped file        : {len(df):,}")
print(f"Distinct PINs                     : {df['pin'].nunique():,}")
print("\nTax years present (raw):")
yr = df["year"].value_counts(dropna=False).sort_index()
for y, n in yr.items():
    print(f"  {str(y):>8} : {n:>5}")
print(f"\nShare of rows that are tax year 2003: "
      f"{(df['year'] == '2003').mean() * 100:.1f}%")

# ---------------------------------------------------------------------------
# Restrict to tax year 2003 (the 99.2% bulk = one assessment cycle)
# ---------------------------------------------------------------------------
d = df[df["year"] == "2003"].copy()
banner("1. ANALYSIS COHORT (tax year 2003 only)")
print(f"Tax-year-2003 appeal rows         : {len(d):,}")

# ---------------------------------------------------------------------------
# Define the outcome
# ---------------------------------------------------------------------------
# A "win" = the certified total assessed value came in BELOW the mailed
# total. That is the taxpayer's real economic outcome of the appeal.
d["reduction"] = d["mailed_tot"] - d["certified_tot"]
d["won"] = d["reduction"] > 0

# Honest handling of missing outcomes: rows with no certified total are
# pending / not-yet-closed and cannot be scored. Drop them from win-rate
# denominators and report how many were dropped.
missing_outcome = d["certified_tot"].isna().sum()
scored = d[d["certified_tot"].notna()].copy()

banner("2. OUTCOME DEFINITION AND DATA QUALITY")
print(f"2003 rows                                  : {len(d):,}")
print(f"  ...with a missing certified total (open) : {missing_outcome:,}"
      f"  (excluded from win rates, not imputed)")
print(f"  ...scored (certified total present)      : {len(scored):,}")
incr = (scored["reduction"] < 0).sum()
flat = (scored["reduction"] == 0).sum()
down = (scored["reduction"] > 0).sum()
print(f"\nAmong scored 2003 appeals:")
print(f"  assessment cut (won)        : {down:,}  ({down/len(scored)*100:.1f}%)")
print(f"  no change in total          : {flat:,}  ({flat/len(scored)*100:.1f}%)")
print(f"  assessment raised           : {incr:,}  ({incr/len(scored)*100:.1f}%)")

# Cross-tab our reduction-based win vs the Assessor's own "change" flag,
# so the reader can see why we do not just trust the flag.
banner("3. WHY WE USE THE VALUE MATH, NOT THE 'change' FLAG")
ct = pd.crosstab(
    scored["change"].fillna("(blank)"),
    np.where(scored["won"], "certified < mailed", "certified >= mailed"),
)
print("Assessor 'change' flag (rows) vs actual total-value movement:")
print(ct)
print("\nNote: the 'change' flag also flips when a building/land split is")
print("re-balanced at an unchanged total, so it overstates taxpayer wins.")

# ---------------------------------------------------------------------------
# 4. Win rate by appeal type
# ---------------------------------------------------------------------------
banner("4. WIN RATE BY PROPERTY APPEAL TYPE (tax year 2003, scored rows)")
sc = scored[scored["appeal_type"].notna()].copy()
by_type = (
    sc.groupby("appeal_type")
    .agg(appeals=("won", "size"), wins=("won", "sum"))
    .assign(win_rate_pct=lambda x: (x["wins"] / x["appeals"] * 100).round(1))
    .sort_values("win_rate_pct", ascending=False)
)
print(by_type.to_string())
print(f"\nMissing appeal_type (excluded here): "
      f"{scored['appeal_type'].isna().sum()}")

# ---------------------------------------------------------------------------
# 5. Size of the cut won, by appeal type (winners only)
# ---------------------------------------------------------------------------
banner("5. SIZE OF THE CUT, WINNERS ONLY (median % reduction in total)")
winners = sc[sc["won"]].copy()
winners["pct_cut"] = winners["reduction"] / winners["mailed_tot"] * 100
cut_by_type = (
    winners.groupby("appeal_type")
    .agg(
        winners=("pct_cut", "size"),
        median_pct_cut=("pct_cut", "median"),
        mean_pct_cut=("pct_cut", "mean"),
    )
    .round(1)
    .sort_values("median_pct_cut", ascending=False)
)
print(cut_by_type.to_string())

# ---------------------------------------------------------------------------
# 6. Who files vs who wins (share of filings vs share of wins)
# ---------------------------------------------------------------------------
banner("6. FILING SHARE vs WIN SHARE BY APPEAL TYPE (scored 2003 rows)")
total_appeals = len(sc)
total_wins = int(sc["won"].sum())
share = (
    sc.groupby("appeal_type")
    .agg(appeals=("won", "size"), wins=("won", "sum"))
)
share["filing_share_pct"] = (share["appeals"] / total_appeals * 100).round(1)
share["win_share_pct"] = (share["wins"] / total_wins * 100).round(1)
share = share.sort_values("filing_share_pct", ascending=False)
print(share[["appeals", "filing_share_pct", "wins", "win_share_pct"]].to_string())
print(f"\nTotal scored appeals: {total_appeals:,} | total wins: {total_wins:,}")

# ---------------------------------------------------------------------------
# 7. Win rate by township (only townships with a meaningful sample)
# ---------------------------------------------------------------------------
banner("7. WIN RATE BY TOWNSHIP (tax year 2003, >=100 scored appeals)")
scored["township"] = scored["township_code"].map(TOWNSHIP_NAMES).fillna(
    "code " + scored["township_code"].astype(str)
)
by_town = (
    scored.groupby("township")
    .agg(appeals=("won", "size"), wins=("won", "sum"))
)
by_town["win_rate_pct"] = (by_town["wins"] / by_town["appeals"] * 100).round(1)
by_town_big = by_town[by_town["appeals"] >= 100].sort_values(
    "win_rate_pct", ascending=False
)
print(by_town_big.to_string())
print(f"\nTownships shown (>=100 scored appeals): {len(by_town_big)}")
print(f"Highest township win rate : {by_town_big['win_rate_pct'].max():.1f}%")
print(f"Lowest township win rate  : {by_town_big['win_rate_pct'].min():.1f}%")
print(f"Spread (high - low)       : "
      f"{by_town_big['win_rate_pct'].max() - by_town_big['win_rate_pct'].min():.1f} "
      f"percentage points")

banner("CAVEATS")
print("""\
- Sample: 5,000 Cook County Assessor appeal records (Cook County Open Data,
  Assessor Appeals). 99.2% are tax year 2003; all rate/share figures above
  use the tax-year-2003 rows only. This is one assessment cycle, not a
  multi-year trend.
- 'Win' = certified total assessed value below the mailed total. It is the
  Assessor's first-stage decision only. It does NOT include the Cook County
  Board of Review or the Illinois Property Tax Appeal Board, where many
  denied owners win cuts later, so true cumulative success is higher than
  shown here.
- Township win rates are first-stage outcomes on a single-year sample and
  reflect that year's property mix per township; they are descriptive, not
  causal.
- These figures describe WHO FILES and WHO WINS. They carry NO information
  about the race or income of owners. Any regressivity-by-race/income claim
  in the paper rests on the cited literature, not on this file.""")

print("\nDONE.")
