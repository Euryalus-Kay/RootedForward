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
      53 schools on the 2013 CPS closure list. Names and street addresses
      transcribed verbatim from the CBS Chicago primary-source list
      (corroborated name-for-name by NBC Chicago, and by the DNAinfo
      consolidation list). Geocoded to lat/lng with the U.S. Census Bureau
      public geocoder (Public_AR_Current); two addresses the Census file
      could not match (Garfield Park Prep at the Faraday building, and
      Trumbull at 5200 N Ashland which Census mis-snapped to 5200 S) were
      fixed with OpenStreetMap Nominatim. Community area assigned by
      point-in-polygon against the City of Chicago official 77-area
      boundary file. See geocode_and_enrich.py for the full provenance.

  cps-active-schools-sy2016-17-enriched.csv
      661 active CPS schools, SY2016-17 snapshot from the City of Chicago
      Data Portal (repo file, unchanged columns), with the same community
      area assigned by the same point-in-polygon method. This is the
      post-closure "surviving system" used as descriptive context.

A note on counts. The board's action originally slated 53 elementary
schools; 4 were spared hours before the May 22, 2013 vote, and the action
is most often summarized as "50 schools" (49 elementary plus the Mason
high-school program). This analysis uses the full 53-building primary-source
list, which is the roster published with addresses; the distinction is
stated in the paper and in data_caveats. Nothing here depends on whether
the headline number is 49, 50, or 53.

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
    "LOWER WEST SIDE", "EAST SIDE",  # EAST SIDE is far SE, handled below
}
# correct EAST SIDE (far southeast) out of West Side
WEST_SIDE.discard("EAST SIDE")

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
    closed = pd.read_csv(CLOSED)
    active = pd.read_csv(ACTIVE)

    rule("0. DATA LOADED AND MISSINGNESS")
    print("Closed-school list (2013 CPS closure roster): %d schools" % len(closed))
    print("  with geocoded lat/lng : %d" % closed["latitude"].notna().sum())
    print("  with community area   : %d" % closed["community_area"].notna().sum())
    print("Active-school snapshot (SY2016-17)          : %d schools" % len(active))
    print("  with community area   : %d" % active["community_area"].notna().sum())
    for col in ["student_count_total", "student_count_low_income", "student_count_black"]:
        miss = active[col].isna().sum()
        print("  active missing %-26s: %d" % (col, miss))
    # closed schools that are duplicates by address (co-located programs)
    dup = closed[closed.duplicated("street_address", keep=False)].sort_values("street_address")
    print("\nCo-located closed schools sharing one building address (real, not error):")
    for _, r in dup.iterrows():
        print("  %-46s %s" % (r["school_name"], r["street_address"]))

    # ---------------------------------------------------------------
    rule("1. CLOSURES BY COMMUNITY AREA (concentration)")
    by_ca = closed["community_area"].value_counts()
    print("Closed schools span %d of Chicago's 77 community areas.\n" % closed["community_area"].nunique())
    print("Community area                  closures   share of 53")
    print("-" * 56)
    cum = 0
    for ca, n in by_ca.items():
        cum += n
        print("%-30s %6d   %9.1f%%" % (ca.title(), n, 100 * n / len(closed)))
    print("-" * 56)
    top5 = by_ca.head(5)
    print("Top 5 community areas hold %d of %d closures (%.1f%%)."
          % (top5.sum(), len(closed), 100 * top5.sum() / len(closed)))
    top10 = by_ca.head(10)
    print("Top 10 community areas hold %d of %d closures (%.1f%%)."
          % (top10.sum(), len(closed), 100 * top10.sum() / len(closed)))

    # ---------------------------------------------------------------
    rule("2. CLOSURES BY SIDE OF THE CITY")
    closed = closed.copy()
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

    # ---------------------------------------------------------------
    rule("3. WHAT WAS CLOSED: SCHOOL LEVEL")
    lvl = closed["primary_category"].value_counts()
    label = {"ES": "Elementary (ES)", "MS": "Middle (MS)", "HS": "High (HS)"}
    print("Level                closures    share")
    print("-" * 42)
    for k, n in lvl.items():
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

    # the community areas that lost the most schools: surviving demographics there
    rule("5. SURVIVING SCHOOLS IN THE HARDEST-HIT COMMUNITY AREAS")
    top_cas = by_ca.head(10).index.tolist()
    print("For the 10 community areas with the most 2013 closures, the profile")
    print("of the schools that REMAINED open in SY2016-17:\n")
    print("%-24s closed  surv.  surv.%%blk  surv.%%low-inc" % "Community area")
    print("-" * 70)
    rows_for_chart = []
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
        rows_for_chart.append((ca.title(), int(by_ca[ca]), n_surv, pb, pl))

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
    print("Restricted to community areas with at least 1 surviving school.\n")
    print("%-24s closed  surviving  closed-per-surviving" % "Community area")
    print("-" * 66)
    finite = ratio_df[ratio_df["ratio"] != float("inf")]
    for _, r in finite.head(12).iterrows():
        print("%-24s %6d %10d %18.2f"
              % (r["ca"].title(), int(r["closed"]), int(r["surviving"]), r["ratio"]))

    # ---------------------------------------------------------------
    rule("7. NEAREST SURVIVING SAME-LEVEL SCHOOL (geometric travel proxy)")
    print("For each closed school, straight-line distance to the nearest")
    print("SURVIVING school of the same level (ES->ES, MS->MS) in SY2016-17.")
    print("Purely geometric. Not a claim about actual routes or outcomes.\n")
    av = active.copy()
    av["lat"] = pd.to_numeric(av["school_latitude"], errors="coerce")
    av["lng"] = pd.to_numeric(av["school_longitude"], errors="coerce")
    # surviving ES pool also serves closed MS (middle grades fold into K-8 ES),
    # but we match strictly same primary_category first; report counts.
    dists = []
    for _, cs in closed.iterrows():
        cs_level = cs["primary_category"]
        pool = av[(av["primary_category"] == cs_level) & av["lat"].notna()]
        if len(pool) == 0:
            pool = av[av["lat"].notna()]
        best = min(
            haversine_miles(cs["latitude"], cs["longitude"], r.lat, r.lng)
            for r in pool.itertuples()
        )
        dists.append(best)
    closed["nearest_same_level_mi"] = dists
    s = pd.Series(dists)
    print("Closed schools measured: %d" % len(s))
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

    # ---------------------------------------------------------------
    rule("8. HEADLINE NUMBERS FOR THE PAPER")
    print("Closed schools on the 2013 roster (primary source) : %d" % len(closed))
    print("Community areas touched by a closure               : %d of 77"
          % closed["community_area"].nunique())
    print("Share of closures on the South or West Side        : %.1f%%"
          % (100 * sw / len(closed)))
    print("Share of closures that were elementary             : %.1f%%"
          % (100 * lvl.get("ES", 0) / len(closed)))
    print("Top community area (West Town) closures            : %d" % by_ca.iloc[0])
    print("Surviving SY2016-17 schools that are majority-Black : %d of %d (%.1f%%)"
          % (maj_black, len(valid), 100 * maj_black / len(valid)))
    print("Surviving-system Black enrollment share            : %.1f%%" % sys_black)
    print("Surviving-system low-income enrollment share        : %.1f%%" % sys_low)
    print("Median closed-school distance to nearest same-level  : %.2f mi" % s.median())


if __name__ == "__main__":
    main()
