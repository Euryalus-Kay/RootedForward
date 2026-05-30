"""
Build cook-county-tract-acs-2023.csv from the U.S. Census Bureau ACS 2023
5-year table-based Summary File (.dat extracts already pulled to /tmp).

Source files (official Census Bureau, keyless FTP mirror):
  https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/
    acsdt5y2023-b19013.dat  -> median household income
    acsdt5y2023-b25003.dat  -> tenure (owner/renter)
    acsdt5y2023-b25002.dat  -> occupancy status (vacant)
  documentation/Geos20235YR.txt -> GEO_ID to NAME crosswalk

We keep only Cook County, IL census tracts (GEO_ID prefix 1400000US17031),
write the estimate columns the paper needs, and ship a small CSV.

This builder runs once to produce the shipped file. analysis.py reads the
shipped CSV, not these raw .dat files.
"""
import csv

GEO_PREFIX = "1400000US17031"  # summary level 140 (tract), state 17, county 031


def load_table(path, geoid_col, value_cols):
    """Read a pipe-delimited .dat, return {fips11: {outname: value}} for Cook tracts."""
    out = {}
    with open(path, encoding="utf-8") as f:
        header = f.readline().rstrip("\n").split("|")
        idx = {name: header.index(src) for src, name in value_cols.items()}
        gidx = header.index(geoid_col)
        for line in f:
            parts = line.rstrip("\n").split("|")
            geoid = parts[gidx]
            if not geoid.startswith(GEO_PREFIX):
                continue
            fips11 = geoid.split("US")[1]  # 11-digit tract FIPS
            rec = {}
            for name, i in idx.items():
                raw = parts[i].strip()
                rec[name] = raw
            out[fips11] = rec
    return out


# Census ACS estimate columns. In the table-based SF, variable B19013_001E
# is stored as column B19013_E001 (E = estimate). We rename back to the
# familiar API variable names for the shipped file.
inc = load_table("/tmp/b19013.dat", "GEO_ID", {"B19013_E001": "B19013_001E"})
ten = load_table(
    "/tmp/b25003.dat", "GEO_ID",
    {"B25003_E001": "B25003_001E", "B25003_E002": "B25003_002E", "B25003_E003": "B25003_003E"},
)
occ = load_table(
    "/tmp/b25002.dat", "GEO_ID",
    {"B25002_E001": "B25002_001E", "B25002_E003": "B25002_003E"},
)

# Geography names
names = {}
with open("/tmp/cook_geos_raw.txt", encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("|")
        # GEO_ID is the field that starts with 1400000US; NAME is the next field
        for i, p in enumerate(parts):
            if p.startswith(GEO_PREFIX):
                geoid = p
                name = parts[i + 1] if i + 1 < len(parts) else ""
                fips11 = geoid.split("US")[1]
                names[fips11] = name
                break

# Union of tract keys across the three tables (should all match: 1332)
all_fips = sorted(set(inc) | set(ten) | set(occ))
print(f"income tracts={len(inc)} tenure tracts={len(ten)} occupancy tracts={len(occ)} union={len(all_fips)}")

cols = [
    "NAME", "B19013_001E",
    "B25003_001E", "B25003_002E", "B25003_003E",
    "B25002_001E", "B25002_003E",
    "state", "county", "tract",
]

out_path = "public/data/holc-redlining-present-day-outcomes-chicago/cook-county-tract-acs-2023.csv"
with open(out_path, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for fips in all_fips:
        state, county, tract = fips[:2], fips[2:5], fips[5:]
        row = {
            "NAME": names.get(fips, ""),
            "state": state, "county": county, "tract": tract,
        }
        row.update(inc.get(fips, {}))
        row.update(ten.get(fips, {}))
        row.update(occ.get(fips, {}))
        # Fill any missing variable cells with empty string (honest blank, no imputation)
        for c in cols:
            row.setdefault(c, "")
        w.writerow(row)

print(f"wrote {out_path}")
