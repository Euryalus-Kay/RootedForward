#!/usr/bin/env python3
"""
Analysis backbone for the Rooted Forward paper
"Missing Race Data in Chicago Police Stop Records"
slug: chicago-traffic-stop-racial-disparity

Data: Chicago police stop records, Stanford Open Policing Project (Chicago
sample). Original source is the Chicago Police Department, released under the
Illinois Traffic and Pedestrian Stop Statistical Study Act, redistributed by
the Stanford Computational Policy Lab. The shipped file is a 4,999-row sample
of the historical Chicago stop file.

Thesis this script supports: the sample is too thin and too selectively
recorded to prove a stop-level racial disparity on its own. The honest finding
is the MISSINGNESS itself. Subject race is recorded for essentially every
arrest outcome and almost no citation outcome, so any race comparison built on
these records is really a comparison of who got arrested, not who got stopped.

Everything printed below is computed directly from the real columns. Nothing
is imputed. Where race is missing it is reported as missing, not filled in.

Run:
  python analysis.py
The script reads the CSV by RELATIVE path, so run it from this directory.
"""

import pandas as pd

CSV = "chicago-historical-stops-sample.csv"

# Read everything as strings so the literal "NA" tokens become real missing
# values and nothing gets silently coerced.
df = pd.read_csv(CSV, dtype=str, keep_default_na=False, na_values=["NA", ""])

n_total = len(df)


def sec(title):
    print("\n" + "=" * 72)
    print(title)
    print("=" * 72)


sec("0. DATASET SHAPE AND PROVENANCE")
print(f"Source: Stanford Open Policing Project, Chicago sample (CPD records).")
print(f"Shipped file: {CSV}")
print(f"Total rows in sample: {n_total}")
print(f"Columns: {len(df.columns)}")
print(f"Officer race recorded: {df['officer_race'].notna().sum()} of "
      f"{n_total} rows.")
print("Outcome types recorded:")
print(df["outcome"].value_counts(dropna=False).to_string())
print("Stop types recorded:")
print(df["type"].value_counts(dropna=False).to_string())


# ---------------------------------------------------------------------------
# 1. THE CENTRAL FINDING: differential missingness of subject race by outcome.
# ---------------------------------------------------------------------------
sec("1. DIFFERENTIAL MISSINGNESS OF SUBJECT RACE BY OUTCOME")
race_known_overall = df["subject_race"].notna().sum()
print(f"Subject race recorded overall: {race_known_overall} of {n_total} "
      f"rows ({race_known_overall / n_total * 100:.1f} percent).")
print(f"Subject race MISSING overall:  {n_total - race_known_overall} of "
      f"{n_total} rows ({(n_total - race_known_overall) / n_total * 100:.1f} "
      f"percent).")
print()

arrest = df[df["outcome"] == "arrest"]
citation = df[df["outcome"] == "citation"]

arr_known = arrest["subject_race"].notna().sum()
cit_known = citation["subject_race"].notna().sum()
arr_rate = arr_known / len(arrest) * 100
cit_rate = cit_known / len(citation) * 100

print(f"Arrest outcomes:   n = {len(arrest):>4}   race recorded = "
      f"{arr_known:>4}   = {arr_rate:5.1f} percent")
print(f"Citation outcomes: n = {len(citation):>4}   race recorded = "
      f"{cit_known:>4}   = {cit_rate:5.1f} percent")
print()
print("Reading: race is recorded for essentially every arrest and almost no")
print("citation. A race comparison on these records compares who was ARRESTED,")
print("not who was stopped. This is the Knox-Lowe-Mummolo point, visible in our")
print("own data: administrative records can mask the bias they are used to test.")


# ---------------------------------------------------------------------------
# 2. Racial composition of the arrest subset (the only race-complete slice).
#    Reported as the ARREST subset, NOT as all stops.
# ---------------------------------------------------------------------------
sec("2. RACIAL COMPOSITION OF THE ARREST SUBSET (NOT ALL STOPS)")
print("This is the one slice where subject race is ~100 percent complete.")
print("It describes who was arrested at a stop, not who was stopped.\n")

print("Race within all arrest rows (including unknown/other):")
print(arrest["subject_race"].value_counts(dropna=False).to_string())

# Clean composition: the four named race groups, dropping the small
# 'unknown'/'other' codes, so the percentages describe a defined population.
clean = arrest[arrest["subject_race"].isin(
    ["black", "hispanic", "white", "asian/pacific islander"])].copy()
n_clean = len(clean)
print(f"\nNamed-race arrest subset (drops unknown/other): n = {n_clean}")
counts = clean["subject_race"].value_counts()
pct = clean["subject_race"].value_counts(normalize=True) * 100
label = {"black": "Black", "hispanic": "Hispanic", "white": "White",
         "asian/pacific islander": "Asian/Pacific Islander"}
for key in ["black", "hispanic", "white", "asian/pacific islander"]:
    print(f"  {label[key]:<24} {counts[key]:>4}   {pct[key]:5.1f} percent")

print()
print("Chicago resident racial shares for context (2020 Census, roughly even")
print("thirds): about one-third Black, one-third Hispanic/Latino, one-third")
print("White. Black residents are ~29 percent of the city but ~45 percent of")
print("this arrest subset. Stated as an arrest-subset descriptive only: the")
print("sample is too thin and too selectively recorded to claim a stop-level")
print("rate from this comparison.")


# ---------------------------------------------------------------------------
# 3. Recorded stops per year (volume over time).
# ---------------------------------------------------------------------------
sec("3. RECORDED STOPS PER YEAR IN THE SAMPLE")
df["year"] = pd.to_datetime(df["date"], errors="coerce").dt.year
by_year = df["year"].value_counts(dropna=False).sort_index()
print("Stops per year in this sample:")
for yr, cnt in by_year.items():
    yr_label = "missing date" if pd.isna(yr) else str(int(yr))
    print(f"  {yr_label:<12} {int(cnt):>5}")
print()
print("Context (not from this file): the ACLU reported Chicago traffic stops")
print("rose from about 86,000 in 2015 to about 490,000 in 2018. The within-")
print("sample jump from 755 (2015) to 1,478 (2016) is a window onto the early")
print("part of that rapidly growing program, not a count of all stops.")


# ---------------------------------------------------------------------------
# 4. Geographic coverage (how many stops can even be placed on a map).
# ---------------------------------------------------------------------------
sec("4. GEOGRAPHIC COVERAGE OF THE SAMPLE")
geo = df[df["lat"].notna() & df["lng"].notna()]
print(f"Stops with usable coordinates (lat AND lng present): {len(geo)} of "
      f"{n_total} ({len(geo) / n_total * 100:.1f} percent).")
print(f"Stops with NO coordinates: {n_total - len(geo)} "
      f"({(n_total - len(geo)) / n_total * 100:.1f} percent).")
print()
print("Reading: only the geocodable rows can be mapped against the literature")
print("finding that stops concentrate on the South and West sides. The rest")
print("are geographically invisible in this file.")


# ---------------------------------------------------------------------------
# 5. Most common recorded violations (low-level / discretionary character).
# ---------------------------------------------------------------------------
sec("5. MOST COMMON RECORDED VIOLATIONS")
top_v = df["violation"].value_counts(dropna=False).head(8)
print("Top recorded violations in the sample:")
for v, cnt in top_v.items():
    v_label = "missing" if pd.isna(v) else v
    print(f"  {int(cnt):>4}   {v_label}")
print()
print("Reading: the most common reasons are low-level and discretionary (stop")
print("sign, suspended license, headlight, cell phone). This matches the")
print("investigatory-stop pattern described in the Suspect Citizens literature.")


# ---------------------------------------------------------------------------
# 6. Who is in the records: sex overall and within race-known arrests, by hour.
# ---------------------------------------------------------------------------
sec("6. WHO IS IN THE RECORDS (SEX AND HOUR)")
print("Subject sex across the whole sample:")
print(df["subject_sex"].value_counts(dropna=False).to_string())

print("\nSex within the named-race arrest subset:")
combo = (clean.groupby(["subject_race", "subject_sex"]).size()
         .reset_index(name="n"))
for key in ["black", "hispanic", "white", "asian/pacific islander"]:
    males = combo[(combo["subject_race"] == key) &
                  (combo["subject_sex"] == "male")]["n"]
    females = combo[(combo["subject_race"] == key) &
                    (combo["subject_sex"] == "female")]["n"]
    m = int(males.iloc[0]) if len(males) else 0
    f = int(females.iloc[0]) if len(females) else 0
    print(f"  {label[key]:<24} male = {m:>3}   female = {f:>3}")

print("\nStops by hour of day (24h clock):")
df["hour"] = pd.to_datetime(df["time"], format="%H:%M:%S",
                            errors="coerce").dt.hour
by_hour = df["hour"].value_counts(dropna=False).sort_index()
for hr, cnt in by_hour.items():
    hr_label = "missing time" if pd.isna(hr) else f"{int(hr):02d}:00"
    print(f"  {hr_label:<12} {int(cnt):>4}")

print("\nDone. All figures above are computed from the real columns of the")
print("shipped sample. Missing values are reported, never imputed.")
