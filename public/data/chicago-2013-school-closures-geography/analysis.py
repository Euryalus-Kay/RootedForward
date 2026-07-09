#!/usr/bin/env python3
"""
The Geography of the 2013 Chicago School Closures
==================================================
Descriptive analysis for the Rooted Forward research paper.

Honest thesis (descriptive only): the 2013 CPS closures clustered in a
small set of historically Black, disinvested South and West Side community
areas, where the surviving school system remains overwhelmingly low-income
and majority-Black. Outcome claims (test scores, displacement harm) are NOT
made here; they belong to the UChicago Consortium and peer-reviewed work.

Two real datasets, both shipped in this folder:

  cps-closed-schools-2013-geocoded.csv
      53 schools on the 2013 CPS closure PROPOSAL list. Names and street
      addresses transcribed verbatim from the CBS Chicago primary-source
      list (corroborated name-for-name by NBC Chicago, and by the DNAinfo
      consolidation list). Geocoded to lat/lng with the U.S. Census Bureau
      public geocoder (Public_AR_Current); two addresses the Census file
      could not match (Garfield Park Prep at the Faraday building, and
      Trumbull at 5200 N Ashland which Census mis-snapped to 5200 S) were
      fixed with OpenStreetMap Nominatim and annotated in matched_address.
      Community area assigned by point-in-polygon against the City of
      Chicago official 77-area boundary file. See geocode_and_enrich.py.

  cps-active-schools-sy2016-17-enriched.csv
      661 active CPS schools, SY2016-17 snapshot from the City of Chicago
      Data Portal (repo file, unchanged columns), with the same community
      area assigned by the same point-in-polygon method. This is the
      post-closure "surviving system" used as descriptive context.

THE ROSTER IS NOT THE CLOSURE LIST. The 53-school list is the slate that
went into the May 22, 2013 board vote. At that vote the board spared four
elementary schools (widely reported at the time, e.g. WGN and CBS coverage
of the 6-0 vote): Manierre (Near North Side), Ericson (East Garfield
Park), Garvey (Washington Heights), and Mahalia Jackson (Auburn Gresham).
All four appear ACTIVE in the SY2016-17 file at the same addresses, which
this script verifies directly. Every closure statistic below is therefore
computed on the 49 schools that actually closed; proposal-roster (53)
figures are printed separately where useful.

Run:
    python analysis.py
"""

import os
import math
import pandas as pd

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 40)

HERE = os.path.dirname(os.path.abspath(__file__))
CLOSED = os.path.join(HERE, "cps-closed-schools-2013-geocoded.csv")
ACTIVE = os.path.join(HERE, "cps-active-schools-sy2016-17-enriched.csv")

# The four schools spared at the May 22, 2013 vote (names as they appear
# in the roster file). Provenance: contemporaneous WGN / CBS Chicago
# reporting on the board vote; existence verified below against the
# SY2016-17 active file by street address.
SPARED = {
    "Manierre Elementary School",
    "Ericson Elementary Scholastic Academy",
    "Garvey M Elementary School",
    "Mahalia Jackson Elementary School",
}


def rule(title):
    print("\n" + "=" * 78)
    print(title)
    print("=" * 78)


# Chicago "sides" by community area, used only to summarize geography.
# Standard groupings of the 77 community areas. North Side here means
# anything north of the Loop that is not the West Side cluster.
WEST_SIDE = {
    "AUSTIN", "EAST GARFIELD PARK", "WEST GARFIELD PARK", "NORTH LAWNDALE",
    "SOUTH LAWNDALE", "HUMBOLDT PARK", "WEST TOWN", "NEAR WEST SIDE",
    "LOWER WEST SIDE",
}

SOUTH_SIDE = {
    "DOUGLAS", "OAKLAND", "FULLER PARK", "GRAND BOULEVARD", "KENWOOD",
    "WASHINGTON PARK", "HYDE PARK", "WOODLAWN", "SOUTH SHORE", "BRIDGEPORT",
    "GREATER GRAND CROSSING", "ENGLEWOOD", "WEST ENGLEWOOD", "AUBURN GRESHAM",
    "CHATHAM", "AVALON PARK", "SOUTH CHICAGO", "BURNSIDE", "CALUMET HEIGHTS",
    "ROSELAND", "PULLMAN", "SOUTH DEERING", "EAST SIDE", "WEST PULLMAN",
    "RIVERDALE", "HEGEWISCH", "ARMOUR SQUARE", "NEW CITY", "WASHINGTON HEIGHTS",
    "MORGAN PARK", "BEVERLY", "MOUNT GREENWOOD", "MCKINLEY PARK", "BRIGHTON PARK",
    "GAGE PARK", "CLEARING", "WEST LAWN", "CHICAGO LAWN", "WEST ELSDON",
    "ARCHER HEIGHTS", "GARFIELD RIDGE", "ASHBURN",
}


def side_of(ca):
    if ca in WEST_SIDE:
        return "West Side"
    if ca in SOUTH_SIDE:
        return "South Side"
    return "North/Central"


def haversine_miles(lat1, lon1, lat2, lon2):
    R = 3958.7613  # earth radius, miles
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def main():
    roster = pd.read_csv(CLOSED)
    active = pd.read_csv(ACTIVE)

    rule("0. DATA LOADED, MISSINGNESS, AND THE SPARED FOUR")
    print("2013 closure PROPOSAL roster (primary-source list): %d schools" % len(roster))
    print("  with geocoded lat/lng : %d" % roster["latitude"].notna().sum())
    print("  with community area   : %d" % roster["community_area"].notna().sum())
    print("Active-school snapshot (SY2016-17)                : %d schools" % len(active))
    print("  with community area   : %d" % active["community_area"].notna().sum())
    for col in ["student_count_total", "student_count_low_income", "student_count_black"]:
        miss = active[col].isna().sum()
        print("  active missing %-26s: %d" % (col, miss))

    # geocoding provenance, from the matched_address annotations
    hand_fixed = roster["matched_address"].str.contains("Nominatim", na=False)
    print("\nGeocoding provenance (matched_address field):")
    print("  matched by U.S. Census Bureau geocoder : %d" % (~hand_fixed).sum())
    print("  hand-fixed via OpenStreetMap Nominatim : %d" % hand_fixed.sum())
    for _, r in roster[hand_fixed].iterrows():
        print("    %-46s %s" % (r["school_name"], r["matched_address"]))

    # the four schools spared at the vote: verify each is ACTIVE in SY2016-17
    print("\nSpared at the May 22, 2013 vote (verified active in SY2016-17 file):")
    act_addr = set(active["address"].str.upper().str.strip())
    for name in sorted(SPARED):
        r = roster[roster["school_name"] == name].iloc[0]
        in_active = r["street_address"].upper().strip() in act_addr
        print("  %-46s %-20s active in SY2016-17 file: %s"
              % (name, r["community_area"].title(), in_active))
        assert in_active, "spared school not found in active file: " + name
    closed = roster[~roster["school_name"].isin(SPARED)].copy()
    print("\nSchools that actually closed: %d of the %d-school roster"
          % (len(closed), len(roster)))

    # the closed schools themselves are gone from the active file;
    # many of their BUILDINGS were reused by other schools
    act_names = set(active["long_name"].str.upper())
    name_overlap = [n for n in closed["school_name"] if n.upper() in act_names]
    reused = closed["street_address"].str.upper().str.strip().isin(act_addr)
    print("Closed schools appearing by name in the SY2016-17 file : %d" % len(name_overlap))
    print("Closed building addresses housing a different school in")
    print("SY2016-17 (building reuse)                             : %d of %d"
          % (reused.sum(), len(closed)))

    # closed schools that are duplicates by address (co-located programs)
    dup = closed[closed.duplicated("street_address", keep=False)].sort_values("street_address")
    print("\nCo-located closed schools sharing one building address (real, not error):")
    for _, r in dup.iterrows():
        print("  %-46s %s" % (r["school_name"], r["street_address"]))

    # ---------------------------------------------------------------
    rule("1. CLOSURES BY COMMUNITY AREA (concentration), ACTUAL CLOSURES ONLY")
    by_ca = closed["community_area"].value_counts()
    print("The %d closures span %d of Chicago's 77 community areas."
          % (len(closed), closed["community_area"].nunique()))
    print("(The 53-school proposal roster spans %d areas; Near North Side and"
          % roster["community_area"].nunique())
    print(" Washington Heights appear on the roster only via spared schools.)\n")
    print("Community area                  closures   share of %d" % len(closed))
    print("-" * 56)
    for ca, n in by_ca.items():
        print("%-30s %6d   %9.1f%%" % (ca.title(), n, 100 * n / len(closed)))
    print("-" * 56)
    # report concentration at clean count breaks, not arbitrary tie-breaks
    top4 = by_ca[by_ca >= 4]
    top7 = by_ca[by_ca >= 3]
    top12 = by_ca[by_ca >= 2]
    print("Areas with 4+ closures: %d areas, %d closures (%.1f%% of %d)"
          % (len(top4), top4.sum(), 100 * top4.sum() / len(closed), len(closed)))
    print("Areas with 3+ closures: %d areas, %d closures (%.1f%%)"
          % (len(top7), top7.sum(), 100 * top7.sum() / len(closed)))
    print("Areas with 2+ closures: %d areas, %d closures (%.1f%%)"
          % (len(top12), top12.sum(), 100 * top12.sum() / len(closed)))

    # ---------------------------------------------------------------
    rule("2. CLOSURES BY SIDE OF THE CITY, ACTUAL CLOSURES ONLY")
    closed["side"] = closed["community_area"].map(side_of)
    side_counts = closed["side"].value_counts()
    print("Side            closed schools    share")
    print("-" * 44)
    for s, n in side_counts.items():
        print("%-14s %12d   %7.1f%%" % (s, n, 100 * n / len(closed)))
    sw = side_counts.get("South Side", 0) + side_counts.get("West Side", 0)
    print("-" * 44)
    print("South + West Side combined: %d of %d closures (%.1f%%)."
          % (sw, len(closed), 100 * sw / len(closed)))
    north = side_counts.get("North/Central", 0)
    print("North/Central closures    : %d of %d (%.1f%%)."
          % (north, len(closed), 100 * north / len(closed)))
    print("North/Central closed schools (the rare non-South/West closures):")
    for _, r in closed[closed["side"] == "North/Central"].iterrows():
        print("  %-40s %s" % (r["school_name"], r["community_area"].title()))
    # proposal-roster comparison
    roster2 = roster.copy()
    roster2["side"] = roster2["community_area"].map(side_of)
    rsc = roster2["side"].value_counts()
    rsw = rsc.get("South Side", 0) + rsc.get("West Side", 0)
    print("\nFor reference, the 53-school proposal roster: South %d, West %d,"
          % (rsc.get("South Side", 0), rsc.get("West Side", 0)))
    print("North/Central %d; South+West %d of %d (%.1f%%)."
          % (rsc.get("North/Central", 0), rsw, len(roster2), 100 * rsw / len(roster2)))

    # ---------------------------------------------------------------
    rule("3. WHAT WAS CLOSED: SCHOOL LEVEL, ACTUAL CLOSURES ONLY")
    lvl = closed["primary_category"].value_counts()
    label = {"ES": "Elementary (ES)", "MS": "Middle (MS)", "HS": "High (HS)"}
    print("Level                closures    share")
    print("-" * 42)
    for k in ["ES", "MS", "HS"]:
        n = lvl.get(k, 0)
        print("%-18s %9d   %7.1f%%" % (label.get(k, k), n, 100 * n / len(closed)))
    print("-" * 42)
    print("Elementary share of all closures: %.1f%%" % (100 * lvl.get("ES", 0) / len(closed)))
    print("High schools closed: %d. The action targeted neighborhood" % lvl.get("HS", 0))
    print("elementary schools, not high schools.")
    print("(The 3 'MS' rows are middle-grade programs: Canter, Pershing West,")
    print(" and Williams Middle Prep, each paired with an elementary building.)")

    # ---------------------------------------------------------------
    rule("4. THE SURVIVING SYSTEM IN SY2016-17 (post-closure context)")
    a = active.copy()
    for c in ["student_count_total", "student_count_low_income", "student_count_black",
              "student_count_hispanic", "student_count_white"]:
        a[c] = pd.to_numeric(a[c], errors="coerce")
    a["pct_black"] = 100 * a["student_count_black"] / a["student_count_total"]
    a["pct_low_income"] = 100 * a["student_count_low_income"] / a["student_count_total"]
    valid = a[a["student_count_total"] > 0]
    maj_black = (valid["pct_black"] >= 50).sum()
    print("Active schools with enrollment > 0: %d of %d" % (len(valid), len(a)))
    print("Majority-Black active schools (>=50%% Black): %d (%.1f%% of %d)"
          % (maj_black, 100 * maj_black / len(valid), len(valid)))
    sys_low = 100 * valid["student_count_low_income"].sum() / valid["student_count_total"].sum()
    sys_black = 100 * valid["student_count_black"].sum() / valid["student_count_total"].sum()
    print("System-wide enrollment-weighted low-income share: %.1f%%" % sys_low)
    print("System-wide enrollment-weighted Black share      : %.1f%%" % sys_black)
    zip_counts = active["zip"].value_counts()
    print("ZIP code with the most surviving schools: %s with %d (next: %s with %d)"
          % (zip_counts.index[0], zip_counts.iloc[0], zip_counts.index[1], zip_counts.iloc[1]))
    n_ms = (active["primary_category"] == "MS").sum()
    print("Standalone middle schools (MS) active in SY2016-17: %d" % n_ms)

    # the community areas that lost the most schools: surviving demographics there
    rule("5. SURVIVING SCHOOLS IN THE HARDEST-HIT COMMUNITY AREAS")
    top_cas = by_ca.head(10).index.tolist()
    print("For the 10 community areas with the most actual 2013 closures (ties")
    print("at 2 closures broken by the value_counts ordering), the profile of")
    print("the schools that REMAINED open in SY2016-17:\n")
    print("%-24s closed  surv.  surv.%%blk  surv.%%low-inc" % "Community area")
    print("-" * 70)
    for ca in top_cas:
        sub = valid[valid["community_area"] == ca]
        n_surv = len(sub)
        if n_surv > 0 and sub["student_count_total"].sum() > 0:
            pb = 100 * sub["student_count_black"].sum() / sub["student_count_total"].sum()
            pl = 100 * sub["student_count_low_income"].sum() / sub["student_count_total"].sum()
        else:
            pb = pl = float("nan")
        print("%-24s %6d %6d %9.1f %13.1f"
              % (ca.title(), int(by_ca[ca]), n_surv, pb, pl))

    # ---------------------------------------------------------------
    rule("6. WHERE THE SYSTEM CONTRACTED MOST (closed-to-surviving ratio)")
    surv_by_ca = valid["community_area"].value_counts()
    ratio_rows = []
    for ca in by_ca.index:
        nc = int(by_ca[ca])
        ns = int(surv_by_ca.get(ca, 0))
        ratio = nc / ns if ns > 0 else float("inf")
        ratio_rows.append((ca, nc, ns, ratio))
    ratio_df = pd.DataFrame(ratio_rows, columns=["ca", "closed", "surviving", "ratio"])
    ratio_df = ratio_df.sort_values("ratio", ascending=False)
    print("Closed-to-surviving ratio (higher = system contracted harder here).")
    print("Actual closures only; areas with at least 1 surviving school.\n")
    print("%-24s closed  surviving  closed-per-surviving" % "Community area")
    print("-" * 66)
    finite = ratio_df[ratio_df["ratio"] != float("inf")]
    for _, r in finite.head(12).iterrows():
        print("%-24s %6d %10d %18.2f"
              % (r["ca"].title(), int(r["closed"]), int(r["surviving"]), r["ratio"]))
    wt = ratio_df[ratio_df["ca"] == "WEST TOWN"]
    if len(wt):
        r = wt.iloc[0]
        print("West Town for comparison: %d closed, %d surviving, ratio %.2f"
              % (int(r["closed"]), int(r["surviving"]), r["ratio"]))

    # ---------------------------------------------------------------
    rule("7. NEAREST SURVIVING SAME-LEVEL SCHOOL (geometric travel proxy)")
    print("For each ACTUALLY CLOSED school, straight-line distance to the")
    print("nearest surviving school of the same level (ES->ES, MS->MS) in")
    print("SY2016-17. Purely geometric. Not actual routes or outcomes.")
    print("Spared schools are excluded from the closed side; left in, they")
    print("match themselves in the active file at ~0.00 mi (shown below).\n")
    av = active.copy()
    av["lat"] = pd.to_numeric(av["school_latitude"], errors="coerce")
    av["lng"] = pd.to_numeric(av["school_longitude"], errors="coerce")

    def nearest(row):
        pool = av[(av["primary_category"] == row["primary_category"]) & av["lat"].notna()]
        if len(pool) == 0:
            pool = av[av["lat"].notna()]
        return min(
            haversine_miles(row["latitude"], row["longitude"], r.lat, r.lng)
            for r in pool.itertuples()
        )

    for name in sorted(SPARED):
        r = roster[roster["school_name"] == name].iloc[0]
        print("  (spared) %-42s %.3f mi  <- itself, still open" % (name, nearest(r)))

    closed["nearest_same_level_mi"] = closed.apply(nearest, axis=1)
    s = closed["nearest_same_level_mi"]
    print("\nClosed schools measured: %d" % len(s))
    print("Mean distance to nearest surviving same-level school : %.2f mi" % s.mean())
    print("Median                                               : %.2f mi" % s.median())
    print("Min / Max                                            : %.2f / %.2f mi"
          % (s.min(), s.max()))
    print("Share within 0.5 mi of a surviving same-level school : %.1f%%"
          % (100 * (s <= 0.5).mean()))
    print("Share within 1.0 mi                                  : %.1f%%"
          % (100 * (s <= 1.0).mean()))
    print("\nFarthest 5 closed schools from a surviving same-level school:")
    far = closed.sort_values("nearest_same_level_mi", ascending=False).head(5)
    for _, r in far.iterrows():
        print("  %-40s %5.2f mi  (%s)"
              % (r["school_name"], r["nearest_same_level_mi"], r["community_area"].title()))
    print("\nNearest 3 (distances near zero mean another school was operating")
    print("in or beside the closed building by SY2016-17):")
    near = closed.sort_values("nearest_same_level_mi").head(3)
    for _, r in near.iterrows():
        pool = av[(av["primary_category"] == r["primary_category"]) & av["lat"].notna()]
        dists = [(haversine_miles(r["latitude"], r["longitude"], x.lat, x.lng), x.long_name)
                 for x in pool.itertuples()]
        d, nm = min(dists)
        print("  %-40s %5.3f mi -> %s" % (r["school_name"], d, nm))

    # ---------------------------------------------------------------
    rule("8. HEADLINE NUMBERS FOR THE PAPER")
    print("Schools on the 2013 proposal roster (primary source): %d" % len(roster))
    print("Spared at the May 22 vote (active in SY2016-17)     : %d" % len(SPARED))
    print("Schools that actually closed                        : %d" % len(closed))
    print("Community areas touched by an actual closure        : %d of 77"
          % closed["community_area"].nunique())
    print("Share of closures on the South or West Side         : %.1f%% (%d of %d)"
          % (100 * sw / len(closed), sw, len(closed)))
    print("Share of closures that were elementary              : %.1f%% (%d of %d)"
          % (100 * lvl.get("ES", 0) / len(closed), lvl.get("ES", 0), len(closed)))
    print("Top community area (West Town) closures             : %d" % by_ca.iloc[0])
    print("Surviving SY2016-17 schools that are majority-Black : %d of %d (%.1f%%)"
          % (maj_black, len(valid), 100 * maj_black / len(valid)))
    print("Surviving-system Black enrollment share             : %.1f%%" % sys_black)
    print("Surviving-system low-income enrollment share        : %.1f%%" % sys_low)
    print("Median closed-school distance to nearest same-level : %.2f mi" % s.median())


if __name__ == "__main__":
    main()
