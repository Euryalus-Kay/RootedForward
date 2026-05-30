"""
build_aggregates.py
-------------------
ONE-TIME data-preparation step for the Rooted Forward paper
"Mortgage Lending and Denial Disparities in Chicago Through HMDA".

The raw FFIEC HMDA loan/application registers (LAR) for Cook County
(FIPS 17031) are 74-135 MB per year and far too large to ship in a
public web repo. This script reads those raw single-year files from a
local staging directory and writes a set of small, fully documented
aggregate CSVs that preserve every number the published analysis needs
while keeping the shipped footprint under a few hundred kilobytes.

Raw source (downloaded once, not committed):
    https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?states=IL&years=<YEAR>&counties=17031
    for YEAR in 2018..2023, saved as /tmp/hmda_cook_<YEAR>.csv

No values are imputed, smoothed, or fabricated. Every aggregate row is a
plain count or dollar sum of real reported records. Missing fields are
carried through as their own explicit category (for example a "Race Not
Available" group, or an "unknown" income band) rather than dropped or
filled.

Outputs (written next to this script):
    hmda-cook-tract-year-aggregate.csv   tract x year x race/eth counts + $ sums
    hmda-cook-race-year-summary.csv      race/eth x year application/denial counts
    hmda-cook-income-band-gap.csv        race/eth x income band x year outcome counts
    hmda-cook-higher-priced.csv          race/eth x year higher-priced origination counts
    hmda-cook-denial-reasons.csv         race/eth x denial-reason counts (denied apps)
    hmda-cook-lender-concentration.csv   lender (lei) x race/eth origination $ (top lenders)
"""

import os
import pandas as pd
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
STAGING = "/tmp"  # raw single-year files live here, not in the repo
YEARS = [2018, 2019, 2020, 2021, 2022, 2023]

# --- HMDA action_taken codes (official FFIEC spec) -------------------------
# 1 originated, 2 approved-not-accepted, 3 denied, 4 withdrawn,
# 5 file closed for incompleteness, 6 purchased loan,
# 7 preapproval request denied, 8 preapproval request approved-not-accepted.
# A "credit decision" was made on actions 1, 2, 3 (and 7/8 for preapproval).
# Following CFPB denial-rate convention we use originated+approved+denied as
# the application denominator and EXCLUDE withdrawn (4), incomplete (5), and
# purchased loans (6, which are not decisions on a new applicant).
DECISION_ACTIONS = {"1", "2", "3"}
DENIED_ACTIONS = {"3"}
ORIGINATED_ACTIONS = {"1"}

# --- Race / ethnicity grouping --------------------------------------------
# HMDA splits race (derived_race) from ethnicity (derived_ethnicity).
# To avoid double counting we build one mutually exclusive group:
# anyone Hispanic-or-Latino by derived_ethnicity is "Latino/Hispanic";
# everyone else is classified by derived_race. This mirrors how the Federal
# Reserve reports HMDA denial rates (Hispanic white applicants are counted
# as Hispanic, not white).
def race_eth_group(derived_race, derived_ethnicity):
    eth = (derived_ethnicity or "").strip()
    race = (derived_race or "").strip()
    if eth == "Hispanic or Latino":
        return "Latino/Hispanic"
    if race == "White":
        # white here means non-Hispanic white because Hispanic was caught above
        return "White (non-Hispanic)"
    if race == "Black or African American":
        return "Black"
    if race == "Asian":
        return "Asian"
    if race in ("Race Not Available", "", "Free Form Text Only"):
        return "Race not available"
    # Joint, American Indian/Alaska Native, Native Hawaiian/PI, 2+ minority
    return "Other / Joint"

# Denial reason code -> label (FFIEC spec). Only used for denied apps.
DENIAL_REASON_LABELS = {
    "1": "Debt-to-income ratio",
    "2": "Employment history",
    "3": "Credit history",
    "4": "Collateral",
    "5": "Insufficient cash",
    "6": "Unverifiable information",
    "7": "Incomplete application",
    "8": "Mortgage insurance denied",
    "9": "Other",
    "10": "Not applicable",
}

USECOLS = [
    "activity_year", "lei", "census_tract", "county_code",
    "derived_race", "derived_ethnicity", "action_taken",
    "loan_amount", "income", "debt_to_income_ratio",
    "rate_spread", "lien_status", "loan_purpose",
    "denial_reason-1",
]


def income_band(income_thousands):
    """Coarse income bands from HMDA `income` (reported in $ thousands)."""
    if pd.isna(income_thousands):
        return "unknown"
    v = income_thousands  # already in thousands
    if v < 50:
        return "<$50k"
    if v < 75:
        return "$50k-$75k"
    if v < 100:
        return "$75k-$100k"
    if v < 150:
        return "$100k-$150k"
    return "$150k+"


def loan_band(amount):
    """Coarse loan-amount bands from HMDA `loan_amount` (in dollars)."""
    if pd.isna(amount):
        return "unknown"
    if amount < 150000:
        return "<$150k"
    if amount < 300000:
        return "$150k-$300k"
    if amount < 500000:
        return "$300k-$500k"
    return "$500k+"


def load_year(year):
    path = os.path.join(STAGING, f"hmda_cook_{year}.csv")
    df = pd.read_csv(path, usecols=USECOLS, dtype=str, low_memory=False)
    # keep Cook County only (the API already filters, but be explicit)
    df = df[df["county_code"] == "17031"].copy()
    df["group"] = [
        race_eth_group(r, e)
        for r, e in zip(df["derived_race"], df["derived_ethnicity"])
    ]
    df["loan_amount_num"] = pd.to_numeric(df["loan_amount"], errors="coerce")
    df["income_num"] = pd.to_numeric(df["income"], errors="coerce")
    df["rate_spread_num"] = pd.to_numeric(df["rate_spread"], errors="coerce")
    df["activity_year"] = year
    return df


def main():
    frames = [load_year(y) for y in YEARS]
    all_df = pd.concat(frames, ignore_index=True)
    print(f"loaded {len(all_df):,} Cook County HMDA records across {YEARS}")

    decision = all_df[all_df["action_taken"].isin(DECISION_ACTIONS)].copy()
    decision["is_denied"] = decision["action_taken"].isin(DENIED_ACTIONS).astype(int)
    decision["is_orig"] = decision["action_taken"].isin(ORIGINATED_ACTIONS).astype(int)

    # 1) race x year summary -------------------------------------------------
    summ = decision.groupby(["activity_year", "group"]).agg(
        applications=("action_taken", "size"),
        denials=("is_denied", "sum"),
        originations=("is_orig", "sum"),
        orig_dollars=("loan_amount_num", lambda s: s[decision.loc[s.index, "is_orig"] == 1].sum()),
    ).reset_index()
    summ.to_csv(os.path.join(HERE, "hmda-cook-race-year-summary.csv"), index=False)

    # 2) tract x year x group aggregate -------------------------------------
    tract = decision.groupby(["activity_year", "census_tract", "group"]).agg(
        applications=("action_taken", "size"),
        denials=("is_denied", "sum"),
        originations=("is_orig", "sum"),
        orig_dollars=("loan_amount_num", lambda s: s[decision.loc[s.index, "is_orig"] == 1].sum()),
    ).reset_index()
    tract.to_csv(os.path.join(HERE, "hmda-cook-tract-year-aggregate.csv"), index=False)

    # 3) income band gap -----------------------------------------------------
    decision["income_band"] = decision["income_num"].apply(income_band)
    decision["loan_band"] = decision["loan_amount_num"].apply(loan_band)
    iband = decision.groupby(["activity_year", "group", "income_band"]).agg(
        applications=("action_taken", "size"),
        denials=("is_denied", "sum"),
    ).reset_index()
    iband.to_csv(os.path.join(HERE, "hmda-cook-income-band-gap.csv"), index=False)

    lband = decision.groupby(["activity_year", "group", "loan_band"]).agg(
        applications=("action_taken", "size"),
        denials=("is_denied", "sum"),
    ).reset_index()
    lband.to_csv(os.path.join(HERE, "hmda-cook-loan-band-gap.csv"), index=False)

    # 4) higher-priced originated loans -------------------------------------
    # Higher-priced first-lien: rate_spread >= 1.5 (HMDA/HOEPA convention).
    # We restrict to originated, first-lien (lien_status == "1") loans where a
    # rate spread was reported (NA means the loan was exempt from rate-spread
    # reporting, so it is excluded from the priced/unpriced denominator).
    orig = all_df[all_df["action_taken"].isin(ORIGINATED_ACTIONS)].copy()
    orig_fl = orig[(orig["lien_status"] == "1") & orig["rate_spread_num"].notna()].copy()
    orig_fl["higher_priced"] = (orig_fl["rate_spread_num"] >= 1.5).astype(int)
    hp = orig_fl.groupby(["activity_year", "group"]).agg(
        first_lien_orig_with_spread=("higher_priced", "size"),
        higher_priced=("higher_priced", "sum"),
    ).reset_index()
    hp.to_csv(os.path.join(HERE, "hmda-cook-higher-priced.csv"), index=False)

    # 5) denial reasons by group --------------------------------------------
    denied = all_df[all_df["action_taken"].isin(DENIED_ACTIONS)].copy()
    denied["reason"] = denied["denial_reason-1"].map(DENIAL_REASON_LABELS)
    # codes outside the spec (e.g. blank, "1111") become "Not reported / other code"
    denied["reason"] = denied["reason"].fillna("Not reported / other code")
    dr = denied.groupby(["group", "reason"]).size().reset_index(name="denials")
    dr.to_csv(os.path.join(HERE, "hmda-cook-denial-reasons.csv"), index=False)

    # 6) lender concentration ------------------------------------------------
    # Origination dollars by lender (lei) and race/eth group. We keep only the
    # white and Black columns the paper needs plus total, and ship the top 25
    # lenders by total Chicago/Cook origination dollars to bound file size.
    orig2 = all_df[all_df["action_taken"].isin(ORIGINATED_ACTIONS)].copy()
    orig2["loan_amount_num"] = pd.to_numeric(orig2["loan_amount"], errors="coerce")
    lender = orig2.groupby(["lei", "group"])["loan_amount_num"].sum().reset_index()
    lender_total = orig2.groupby("lei")["loan_amount_num"].sum().reset_index(
        name="total_orig_dollars")
    top25 = lender_total.sort_values("total_orig_dollars", ascending=False).head(25)
    lender_top = lender[lender["lei"].isin(top25["lei"])]
    lender_top = lender_top.merge(top25, on="lei", how="left")
    lender_top = lender_top.sort_values(["total_orig_dollars", "lei", "group"],
                                        ascending=[False, True, True])
    lender_top.to_csv(os.path.join(HERE, "hmda-cook-lender-concentration.csv"), index=False)

    print("wrote aggregate CSVs:")
    for fn in [
        "hmda-cook-race-year-summary.csv",
        "hmda-cook-tract-year-aggregate.csv",
        "hmda-cook-income-band-gap.csv",
        "hmda-cook-loan-band-gap.csv",
        "hmda-cook-higher-priced.csv",
        "hmda-cook-denial-reasons.csv",
        "hmda-cook-lender-concentration.csv",
    ]:
        p = os.path.join(HERE, fn)
        print(f"  {fn}: {os.path.getsize(p):,} bytes")


if __name__ == "__main__":
    main()
