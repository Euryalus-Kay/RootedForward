/* ------------------------------------------------------------------ */
/*  research-datasets.ts                                               */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  CANONICAL source of truth for replication-data metadata.          */
/*                                                                     */
/*  REAL DATA POLICY                                                   */
/*  ----------------                                                   */
/*  Every file listed in a dataset must be hosted at                  */
/*  public/data/<slug>/<filename>. No "in preparation" placeholders  */
/*  shipped on the public site: if a file is on the page, you can     */
/*  download it. If we don't have it, we don't list it.               */
/*                                                                     */
/*  Every dataset must also list at least one real upstream public   */
/*  source URL so a reader can verify the underlying record on the    */
/*  agency that publishes it.                                          */
/*                                                                     */
/*  Adding a new paper:                                                */
/*    1. Drop the real CSV / GeoJSON file at                          */
/*       public/data/<slug>/<filename>                                 */
/*    2. Add an entry here with available: true and the real         */
/*       on-disk byte count                                            */
/*    3. Add an entry in research-constants.ts and the SQL migration */
/*    4. See docs/RESEARCH-CONTRIBUTING.md for the full walkthrough  */
/*                                                                     */
/* ------------------------------------------------------------------ */

export interface DatasetFile {
  /** Filename. When `available: true` this is the literal filename
   *  hosted at public/data/<slug>/<name>. */
  name: string;
  /** Approximate size in bytes. For hosted files this matches the
   *  on-disk byte count. */
  bytes: number;
  /** One-sentence description of what the file contains. */
  description: string;
  /** True when the file is hosted at public/data/<slug>/<name> and
   *  ready to view in the in-site spreadsheet and download with one
   *  click. False or omitted means the file is part of the eventual
   *  archive but not yet uploaded. */
  available?: boolean;
  /** Source label shown next to the file. Useful to distinguish
   *  Rooted Forward-curated subsets from upstream public files we
   *  redistribute as-is. */
  provenance?: string;
}

export interface DatasetColumn {
  name: string;
  type: string;
  description?: string;
}

export interface DatasetPreviewData {
  columns: DatasetColumn[];
  /** ONE real-looking sample row with values pulled from documented
   *  public sources, never invented. Empty array is allowed. */
  sample_rows: Record<string, string | number | boolean | null>[];
}

export interface UpstreamSource {
  /** Human label, e.g. "Cook County Assessor 2024 administrative file". */
  label: string;
  /** Direct URL to the public source where this raw data lives. */
  url: string;
  /** Optional short note, e.g. "Public under Illinois FOIA." */
  note?: string;
}

export type DatasetStatus = "in_preparation" | "live";

export interface DatasetMeta {
  /** One short sentence shown on the index grid card. Plain English. */
  summary: string;
  /** Full prose paragraph shown on the detail page. */
  contents: string;
  /** Files the cleaned archive will contain. */
  files: DatasetFile[];
  /** Short license string, e.g. "Code MIT, derived data CC BY 4.0." */
  license: string;
  /** REAL public upstream sources. Always shown. Anyone reading the
   *  paper can follow these links and verify the underlying data. */
  upstream_sources: UpstreamSource[];
  /** Optional italic caveat shown under the source list. */
  notes?: string;
  /** Column schema + at most one sample row. Sample row values
   *  must come from documented real records, never invented. */
  preview: DatasetPreviewData;
  /** Distribution state. See file header. */
  archive_status: DatasetStatus;
  /** Set only when archive_status === "live". Path inside the
   *  research-datasets storage bucket. */
  storage_path?: string;
}

/* ------------------------------------------------------------------ */
/*  Per-paper dataset metadata                                         */
/*                                                                     */
/*  KEY MUST MATCH the slug field in research_entries.                */
/*  Until an admin uploads a cleaned archive, every dataset stays at  */
/*  archive_status: "in_preparation" and the card surfaces the        */
/*  upstream public URL so readers always have a path to real data.   */
/* ------------------------------------------------------------------ */

export const RESEARCH_DATASETS: Record<string, DatasetMeta> = {
  "chicago-2013-school-closures-geography": {
    summary:
      "The 2013 closures clustered in a small set of historically Black, disinvested South and West Side community areas where surviving schools remain overw",
    contents:
      "The real public data behind The Geography of the 2013 Chicago School Closures. 2013 CPS closed-school list (53 schools, with street addresses) + repo CPS active-school snapshot (661 schools, SY2016-17) as comparison universe. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 14593,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
      {
        name: "cps-active-schools-sy2016-17-enriched.csv",
        bytes: 108009,
        description:
          "The repo's 661-school CPS active-school snapshot (SY2016-17, City of Chicago Data Portal) reduced to analysis columns and enriched with a community_area assigned by the same point-in-polygon method. U",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
      {
        name: "cps-active-schools-sy2016-17.csv",
        bytes: 1261398,
        description:
          "The original repo CPS active-school full-list file (SY2016-17, 661 schools, all original columns), copied unchanged from public/data/school-closures-2013-and-after/cps-schools-full-list.csv as the unt",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
      {
        name: "cps-closed-schools-2013-geocoded.csv",
        bytes: 8103,
        description:
          "The 53 schools on the 2013 CPS closure roster (names + street addresses verbatim from the CBS Chicago primary-source list, corroborated by NBC Chicago and DNAinfo), geocoded to lat/lng (Census geocode",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
      {
        name: "cps-closed-schools-2013.csv",
        bytes: 3668,
        description:
          "The pre-geocoding closed-school source file: the 53 closure-roster school names and street addresses transcribed from the CBS Chicago primary-source list, before lat/lng and community-area enrichment.",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
      {
        name: "geocode_and_enrich.py",
        bytes: 8109,
        description:
          "One-time, documented enrichment script. Geocodes the 53 closed-school addresses (Census public geocoder), assigns community areas to both closed and active schools by pure-Python ray-casting point-in-",
        available: true,
        provenance:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Chicago Public Schools / Chicago Board of Education action (closed list, primary source via CBS Chicago and Education Week, corroborated by UIC Great Cities Institute); City of Chicago Data Portal for the CPS school universe; repo file already shipped",
        url: "https://data.cityofchicago.org/widgets/c7jj-qjvh",
      },
    ],
    preview: {
      columns: [
        {
          name: "school_id",
          type: "text",
        },
        {
          name: "short_name",
          type: "text",
        },
        {
          name: "long_name",
          type: "text",
        },
        {
          name: "primary_category",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "zip",
          type: "text",
        },
        {
          name: "school_latitude",
          type: "text",
        },
        {
          name: "school_longitude",
          type: "text",
        },
        {
          name: "student_count_total",
          type: "text",
        },
        {
          name: "student_count_low_income",
          type: "text",
        },
        {
          name: "student_count_black",
          type: "text",
        },
        {
          name: "student_count_hispanic",
          type: "text",
        },
        {
          name: "student_count_white",
          type: "text",
        },
        {
          name: "overall_rating",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-affordable-requirements-ordinance": {
    summary:
      "ARO produces real but modest affordable units that land disproportionately in higher-cost North/Northwest Side and near-downtown areas rather than dis",
    contents:
      "The real public data behind What the Affordable Requirements Ordinance Has Produced. Affordable Rental Housing Developments (ARO-tagged subset). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 8969,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "City of Chicago Department of Housing, via Chicago Data Portal (Socrata)",
      },
      {
        name: "chicago-affordable-rental-housing-developments.csv",
        bytes: 137515,
        description:
          "City of Chicago Dept. of Housing, Affordable Rental Housing Developments list (598 developments citywide; 119 in the four 606-corridor community areas). Copied byte-identical from the cha-plan-for-tra",
        available: true,
        provenance:
          "City of Chicago Department of Housing, via Chicago Data Portal (Socrata)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "City of Chicago Department of Housing, via Chicago Data Portal (Socrata)",
        url: "https://data.cityofchicago.org/Community-Economic-Development/Affordable-Rental-Housing-Developments/s6ha-ppgi",
      },
    ],
    preview: {
      columns: [
        {
          name: "community_area",
          type: "text",
        },
        {
          name: "community_area_number",
          type: "text",
        },
        {
          name: "property_type",
          type: "text",
        },
        {
          name: "property_name",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "zip_code",
          type: "text",
        },
        {
          name: "phone_number",
          type: "text",
        },
        {
          name: "management_company",
          type: "text",
        },
        {
          name: "units",
          type: "text",
        },
        {
          name: "x_coordinate",
          type: "text",
        },
        {
          name: "y_coordinate",
          type: "text",
        },
        {
          name: "latitude",
          type: "text",
        },
        {
          name: "longitude",
          type: "text",
        },
        {
          name: "location",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-divvy-bikeshare-equity": {
    summary:
      "A dated, descriptive map of where Divvy docks and trips land by neighborhood income and racial composition, and how the member-versus-casual mix varie",
    contents:
      "The real public data behind Who the Divvy Bikeshare System Actually Reaches. Divvy Bicycle Stations (City of Chicago Data Portal) joined to ACS 5-year community-area / tract demographics, with Divvy public trip records as a usage layer. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 24626,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
      },
      {
        name: "chicago-community-area-acs-2023.csv",
        bytes: 21688,
        description:
          "ACS 5-year 2023 by Chicago community area from the City of Chicago Data Portal (Socrata 7umk-8dtw): household-income brackets, total population, and race/ethnicity counts including white_not_hispanic_",
        available: true,
        provenance:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
      },
      {
        name: "chicago-community-areas.geojson",
        bytes: 2072102,
        description:
          "Boundaries of the 77 Chicago community areas (City of Chicago Data Portal, Socrata igwz-8jzy), reused from the chicago-transit-access-income dataset, used for point-in-polygon assignment of stations a",
        available: true,
        provenance:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
      },
      {
        name: "divvy-bicycle-stations.csv",
        bytes: 173940,
        description:
          "Current Divvy station roster from the City of Chicago Data Portal (Socrata bbyy-e7gq): station_name, total_docks, docks_in_service, status, latitude, longitude. 1,153 stations.",
        available: true,
        provenance:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
      },
      {
        name: "divvy-trips-2024-by-start-station.csv",
        bytes: 148487,
        description:
          "Compact per-start-station summary aggregated from the real Divvy public trip files for four seasonal 2024 months (Jan, Apr, Jul, Oct): trips, member_trips, casual_trips, classic_trips, electric_trips,",
        available: true,
        provenance:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Chicago Department of Transportation / Lyft (Divvy) via City of Chicago Data Portal; U.S. Census Bureau (ACS 5-year); Divvy System Data (S3)",
        url: "https://data.cityofchicago.org/Transportation/Divvy-Bicycle-Stations/bbyy-e7gq/data",
      },
      {
        label:
          "Ursaki, J., & Aultman-Hall, L. (2015). Quantifying the Equity of Bikes",
        url: "https://rosap.ntl.bts.gov/view/dot/36739",
      },
    ],
    preview: {
      columns: [
        {
          name: "acs_year",
          type: "text",
        },
        {
          name: "community_area",
          type: "text",
        },
        {
          name: "under_25_000",
          type: "text",
        },
        {
          name: "_25_000_to_49_999",
          type: "text",
        },
        {
          name: "_50_000_to_74_999",
          type: "text",
        },
        {
          name: "_75_000_to_125_000",
          type: "text",
        },
        {
          name: "_125_000",
          type: "text",
        },
        {
          name: "male_0_to_17",
          type: "text",
        },
        {
          name: "male_18_to_24",
          type: "text",
        },
        {
          name: "male_25_to_34",
          type: "text",
        },
        {
          name: "male_35_to_49",
          type: "text",
        },
        {
          name: "male_50_to_64",
          type: "text",
        },
        {
          name: "male_65",
          type: "text",
        },
        {
          name: "female_0_to_17",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-eviction-filing-geography": {
    summary:
      "A small set of South and West Side community areas, led by South Shore at roughly two to three times the citywide filing rate, carries eviction burden",
    contents:
      "The real public data behind Where Chicago Files Evictions and Who Bears the Filings. Chicago Evictions Data (Release 2), eviction_data_comm_area.csv plus eviction_data_tract.csv, eviction_data_ward.csv, eviction_data_chicago.csv. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 17693,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "census_data_comm_area.csv",
        bytes: 17543,
        description:
          "LCBH-supplied ACS 5-year housing-unit counts by community area for the 2006-2010 and 2014-2018 estimate periods (154 rows). Provides housing_units_rental, the denominator for the share-of-rental-units",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "eviction_data_chicago.csv",
        bytes: 3524,
        description:
          "LCBH Release 2 citywide eviction totals, one row per year 2010-2019 (10 rows), same 47-column schema. Source of citywide rate, time trend, citywide representation gap, and back-rent band shares.",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "eviction_data_comm_area.csv",
        bytes: 120502,
        description:
          "LCBH Release 2 eviction data by Chicago community area, 2010-2019. 770 data rows (77 areas x 10 years), 47 columns: filing counts, rate per 100 rental units, case type, back-rent bands, landlord/tenan",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "eviction_data_field_definitions.pdf",
        bytes: 151240,
        description:
          "LCBH official field-definitions document, shipped unmodified. Defines eviction_filings_rate as filings per 100 rental units and documents the completed-cases-only rule for non-rate fields.",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "eviction_data_tract.csv",
        bytes: 990453,
        description:
          "LCBH Release 2 eviction data by census tract, 2010-2019. 8,040 data rows across 804 tracts, same schema. Shipped to support the paper's finer-grained map; not charted directly because 804 tracts excee",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
      {
        name: "methodology_release_2.pdf",
        bytes: 254658,
        description:
          "LCBH official methodology document for Release 2, shipped unmodified for citation and provenance.",
        available: true,
        provenance:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Law Center for Better Housing (LCBH), Chicago Evictions data portal",
        url: "https://eviction.lcbh.org/data/download",
      },
      {
        label:
          'Desmond, Matthew, and Carl Gershenson. 2017. "Who Gets Evicted? Assess',
        url: "https://pubmed.ncbi.nlm.nih.gov/28126112/",
      },
      {
        label:
          "Statchen, Thomas, Anna Volerman, Louise C. Hawkley, and Elizabeth L. T",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12728654/",
      },
      {
        label:
          "Cook County Sheriff's Office. 2024. \"Annual Report: Evictions Approach",
        url: "https://cookcountysheriffil.gov/annual-report-evictions-approach-pre-pandemic-levels/",
      },
    ],
    preview: {
      columns: [
        {
          name: "census_year",
          type: "text",
        },
        {
          name: "area_name",
          type: "text",
        },
        {
          name: "area_number",
          type: "text",
        },
        {
          name: "housing_units_total",
          type: "text",
        },
        {
          name: "housing_units_rental",
          type: "text",
        },
        {
          name: "housing_units_other",
          type: "text",
        },
        {
          name: "median_rent",
          type: "text",
        },
        {
          name: "population_total",
          type: "text",
        },
        {
          name: "population_poverty_below",
          type: "text",
        },
        {
          name: "population_poverty_above",
          type: "text",
        },
        {
          name: "population_race_white",
          type: "text",
        },
        {
          name: "population_race_black",
          type: "text",
        },
        {
          name: "population_race_latinx",
          type: "text",
        },
        {
          name: "population_race_asian",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-gentrification-rent-burden": {
    summary:
      "Asking rents rose roughly 40 to 80 percent across 13 South Side ZIPs over the decade, fastest in Roseland, South Shore, and Bronzeville, best read aga",
    contents:
      "The real public data behind Rising Asking Rents and Displacement Pressure on Chicago's South Side. Zillow Observed Rent Index (ZORI), Chicago South Side ZIP codes, monthly 2015-2026. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 13966,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance: "Zillow Research (ZORI repeat-rent index)",
      },
      {
        name: "chicago-affordable-rental-housing-developments.csv",
        bytes: 137515,
        description:
          "City of Chicago Dept. of Housing, Affordable Rental Housing Developments list (598 developments citywide; 119 in the four 606-corridor community areas). Copied byte-identical from the cha-plan-for-tra",
        available: true,
        provenance: "Zillow Research (ZORI repeat-rent index)",
      },
      {
        name: "zillow-zori-chicago-south-side.csv",
        bytes: 29687,
        description:
          "Zillow Observed Rent Index (ZORI), monthly dollar asking-rent index for 13 Chicago South Side ZIP codes, 2015-01 through 2026-03 (135 monthly columns plus 9 metadata columns). Byte-identical copy of t",
        available: true,
        provenance: "Zillow Research (ZORI repeat-rent index)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label: "Zillow Research (ZORI repeat-rent index)",
        url: "https://www.zillow.com/research/methodology-zori-repeat-rent-27092/",
      },
      {
        label:
          "Hwang, J., & Lin, J. (2016). What Have We Learned About the Causes of ",
        url: "https://www.huduser.gov/portal/periodicals/cityscpe/vol18num3/article1.html",
      },
      {
        label:
          "Ding, L., & Hwang, J. (2016). The Consequences of Gentrification: A Fo",
        url: "https://www.huduser.gov/portal/periodicals/cityscpe/vol18num3/article2.html",
      },
    ],
    preview: {
      columns: [
        {
          name: "community_area",
          type: "text",
        },
        {
          name: "community_area_number",
          type: "text",
        },
        {
          name: "property_type",
          type: "text",
        },
        {
          name: "property_name",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "zip_code",
          type: "text",
        },
        {
          name: "phone_number",
          type: "text",
        },
        {
          name: "management_company",
          type: "text",
        },
        {
          name: "units",
          type: "text",
        },
        {
          name: "x_coordinate",
          type: "text",
        },
        {
          name: "y_coordinate",
          type: "text",
        },
        {
          name: "latitude",
          type: "text",
        },
        {
          name: "longitude",
          type: "text",
        },
        {
          name: "location",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-lead-service-lines-water": {
    summary:
      "The heaviest lead/galvanized/unknown service-line replacement burden concentrates in lower-income, majority-Black and majority-Latino South and West S",
    contents:
      "The real public data behind Lead Service Lines and Tap Water Risk Across Chicago Neighborhoods. Chicago lead water service line inventory aggregated to community areas and census tracts (with 2023 ACS demographics). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 18151,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Inside Climate News / Grist / WBEZ (compiled from the City of Chicago Department of Water Management 2025 service line inventory submitted to the Illinois EPA, plus U.S. Census ACS 2023 5-year)",
      },
      {
        name: "chicago-community-areas-lead.csv",
        bytes: 11074,
        description:
          "Lead service-line inventory aggregated to Chicago's 77 community areas with ACS 2023 demographics. Real file copied unchanged from the Inside Climate News repo (processed_data/chicago_community_areas.",
        available: true,
        provenance:
          "Inside Climate News / Grist / WBEZ (compiled from the City of Chicago Department of Water Management 2025 service line inventory submitted to the Illinois EPA, plus U.S. Census ACS 2023 5-year)",
      },
      {
        name: "chicago-tract-centroids.csv",
        bytes: 27138,
        description:
          "Derived geoid-to-centroid (lat/lon) table for all 803 tracts, computed once from the repo's tract polygon geojson via signed-area centroid, shipped so the 1938 HOLC overlay is reproducible without a 3",
        available: true,
        provenance:
          "Inside Climate News / Grist / WBEZ (compiled from the City of Chicago Department of Water Management 2025 service line inventory submitted to the Illinois EPA, plus U.S. Census ACS 2023 5-year)",
      },
      {
        name: "chicago-tracts-lead.csv",
        bytes: 96644,
        description:
          "Lead service-line inventory aggregated to 803 Chicago census tracts (keyed by Census geoid) with ACS 2023 demographics. Real file copied unchanged from the Inside Climate News repo (processed_data/chi",
        available: true,
        provenance:
          "Inside Climate News / Grist / WBEZ (compiled from the City of Chicago Department of Water Management 2025 service line inventory submitted to the Illinois EPA, plus U.S. Census ACS 2023 5-year)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Inside Climate News / Grist / WBEZ (compiled from the City of Chicago Department of Water Management 2025 service line inventory submitted to the Illinois EPA, plus U.S. Census ACS 2023 5-year)",
        url: "https://github.com/InsideClimateNews/2025-08-chicago-lead-service-lines",
      },
      {
        label:
          "Lanphear BP, Hornung R, Khoury J, et al. Low-Level Environmental Lead ",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1257652/",
      },
      {
        label:
          "Needleman HL, Gatsonis CA. Low-level lead exposure and the IQ of child",
        url: "https://pubmed.ncbi.nlm.nih.gov/2136923/",
      },
      {
        label:
          "Nigra AE, Cazabat E, Glabau D, et al. Geospatial Assessment of Racial/",
        url: "https://ehp.niehs.nih.gov/doi/10.1289/EHP12276",
      },
    ],
    preview: {
      columns: [
        {
          name: "community",
          type: "text",
        },
        {
          name: "area_num_1",
          type: "text",
        },
        {
          name: "GRR",
          type: "text",
        },
        {
          name: "L",
          type: "text",
        },
        {
          name: "NL",
          type: "text",
        },
        {
          name: "U",
          type: "text",
        },
        {
          name: "total",
          type: "text",
        },
        {
          name: "flag",
          type: "text",
        },
        {
          name: "lead_plus_suspected",
          type: "text",
        },
        {
          name: "requires_replacement",
          type: "text",
        },
        {
          name: "pct_lead",
          type: "text",
        },
        {
          name: "pct_grr",
          type: "text",
        },
        {
          name: "pct_suspected_lead",
          type: "text",
        },
        {
          name: "pct_lead_plus_suspected",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-mortgage-lending-disparity-hmda": {
    summary:
      "Black and Latino applicants are denied at roughly twice the white rate and lending concentrates in formerly A/B-graded areas, but following recent Fed",
    contents:
      "The real public data behind Mortgage Lending and Denial Disparities in Chicago Through HMDA. CFPB / FFIEC Home Mortgage Disclosure Act (HMDA) public loan/application data, Cook County (FIPS 17031), Chicago metro. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 16586,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "build_aggregates.py",
        bytes: 10894,
        description:
          "One-time prep script documenting exactly how the raw FFIEC HMDA single-year LAR files (74-135 MB each, not committed) were aggregated into the small shipped CSVs. Includes the FFIEC download URL and a",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "cook-county-tract-centroids-2023.csv",
        bytes: 47670,
        description:
          "1,332 Cook County census-tract centroids (GEOID, lat, lon) from the Census 2023 national tract gazetteer, used to map tracts to 1938 HOLC zones.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-denial-reasons.csv",
        bytes: 2207,
        description:
          "Race/ethnicity x primary-denial-reason counts among denied applications, 2018-2023 pooled.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-higher-priced.csv",
        bytes: 1089,
        description:
          "Race/ethnicity x year counts of originated first-lien loans with a reported rate spread and how many were higher-priced (rate_spread >= 1.5).",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-income-band-gap.csv",
        bytes: 7994,
        description:
          "Race/ethnicity x income band x year application and denial counts, for the within-income-band gap analysis.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-lender-concentration.csv",
        bytes: 9030,
        description:
          "Top 25 Cook County lenders by originated dollars, with originated dollars broken out by race/ethnicity group, for the white-to-Black lending-dollar ratio.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-loan-band-gap.csv",
        bytes: 5442,
        description:
          "Race/ethnicity x loan-amount band x year application and denial counts, companion to the income-band file.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-race-year-summary.csv",
        bytes: 1805,
        description:
          "Race/ethnicity x year application, denial, origination counts and origination dollars for Cook County 2018-2023. Real aggregated HMDA counts.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "hmda-cook-tract-year-aggregate.csv",
        bytes: 1954145,
        description:
          "Census-tract x year x race/ethnicity application/denial/origination counts and dollars, Cook County 2018-2023. Largest shipped file at 1.9 MB.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
      {
        name: "holc-chicago-1938-zones.geojson",
        bytes: 510655,
        description:
          "1938 HOLC grade polygons for Chicago, copied unchanged from the repo's 1938-holc-chicago-map-annotated dataset so the analysis is self-contained.",
        available: true,
        provenance:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Consumer Financial Protection Bureau (CFPB) and the Federal Financial Institutions Examination Council (FFIEC)",
        url: "https://ffiec.cfpb.gov/data-browser/",
      },
      {
        label:
          "Bhutta, N., Hizmo, A., & Ringo, D. (2025). How Much Does Racial Bias A",
        url: "https://www.federalreserve.gov/econres/feds/files/2022067pap.pdf",
      },
      {
        label:
          "Avery, R. B., Brevoort, K. P., & Canner, G. B. (2007). Opportunities a",
        url: "https://www.federalreserve.gov/pubs/bulletin/2007/pdf/hmda06draft.pdf",
      },
    ],
    preview: {
      columns: [
        {
          name: "group",
          type: "text",
        },
        {
          name: "reason",
          type: "text",
        },
        {
          name: "denials",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-tif-spending-distribution": {
    summary:
      "Chicago TIF dollars concentrate heavily in a handful of downtown and downtown-adjacent community areas (top five about 57% of approved funding), a des",
    contents:
      "The real public data behind Where Chicago TIF Money Goes Across Wards and Community Areas. Chicago TIF/RDA Funded Projects (Redevelopment Agreements). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 11858,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "City of Chicago (Department of Planning and Development / Chicago Data Portal), shipped in repo",
      },
      {
        name: "chicago-tif-funded-rda-projects.csv",
        bytes: 452345,
        description:
          "City of Chicago Dept. of Planning and Development, TIF/RDA project records (768 records citywide; 65 in corridor community areas, 20 of them residential affordable projects). Copied byte-identical fro",
        available: true,
        provenance:
          "City of Chicago (Department of Planning and Development / Chicago Data Portal), shipped in repo",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "City of Chicago (Department of Planning and Development / Chicago Data Portal), shipped in repo",
        url: "https://data.cityofchicago.org/Community-Economic-Development/TIF-Projects/",
      },
    ],
    preview: {
      columns: [
        {
          name: "id",
          type: "text",
        },
        {
          name: "tif_district",
          type: "text",
        },
        {
          name: "project_name",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "developer",
          type: "text",
        },
        {
          name: "project_description",
          type: "text",
        },
        {
          name: "cdc_date",
          type: "text",
        },
        {
          name: "coc_date",
          type: "text",
        },
        {
          name: "approved_amount",
          type: "text",
        },
        {
          name: "total_project_cost",
          type: "text",
        },
        {
          name: "tif_subsidy_percentage",
          type: "text",
        },
        {
          name: "affordable_units",
          type: "text",
        },
        {
          name: "ward",
          type: "text",
        },
        {
          name: "community_area",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-traffic-stop-racial-disparity": {
    summary:
      "The sample is too thin and too selectively recorded to prove a stop-level disparity on its own, so the paper pairs the strong external literature with",
    contents:
      "The real public data behind Missing Race Data in Chicago Police Stop Records. Chicago police stop records (Stanford Open Policing Project, Chicago sample). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 9304,
        description:
          "Reproducible pandas script. Tabulates race recording by outcome (100 percent of arrests, 1.8 percent of citations), the arrest-subset composition, stops per year, coverage, and top violations.",
        available: true,
        provenance:
          "Stanford Computational Policy Lab / Stanford Open Policing Project (original source: Chicago Police Department, released via the Illinois Traffic and Pedestrian Stop Statistical Study Act)",
      },
      {
        name: "chicago-historical-stops-sample.csv",
        bytes: 832506,
        description:
          "Chicago police stop records, Stanford Open Policing Project (Chicago sample, original source Chicago Police Department via the Illinois Traffic and Pedestrian Stop Statistical Study Act). 4,999-row sa",
        available: true,
        provenance:
          "Stanford Computational Policy Lab / Stanford Open Policing Project (original source: Chicago Police Department, released via the Illinois Traffic and Pedestrian Stop Statistical Study Act)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Stanford Computational Policy Lab / Stanford Open Policing Project (original source: Chicago Police Department, released via the Illinois Traffic and Pedestrian Stop Statistical Study Act)",
        url: "https://openpolicing.stanford.edu/data/",
      },
      {
        label:
          "U.S. Department of Justice, Civil Rights Division & U.S. Attorney's Of",
        url: "https://www.justice.gov/archives/opa/pr/justice-department-announces-findings-investigation-chicago-police-department",
      },
    ],
    preview: {
      columns: [
        {
          name: "raw_row_number",
          type: "text",
        },
        {
          name: "date",
          type: "text",
        },
        {
          name: "time",
          type: "text",
        },
        {
          name: "location",
          type: "text",
        },
        {
          name: "lat",
          type: "text",
        },
        {
          name: "lng",
          type: "text",
        },
        {
          name: "subject_age",
          type: "text",
        },
        {
          name: "subject_race",
          type: "text",
        },
        {
          name: "subject_sex",
          type: "text",
        },
        {
          name: "officer_id_hash",
          type: "text",
        },
        {
          name: "officer_age",
          type: "text",
        },
        {
          name: "officer_race",
          type: "text",
        },
        {
          name: "officer_sex",
          type: "text",
        },
        {
          name: "officer_years_of_service",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "chicago-transit-access-income": {
    summary:
      "A descriptive map of where Chicago rail reaches shows station density, step-free access, and transit-commute reliance varying across neighborhood inco",
    contents:
      "The real public data behind Transit Access and Neighborhood Income Across Chicago. CTA System Information - List of 'L' Stops. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 20245,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
      },
      {
        name: "chicago-community-area-socioeconomic.csv",
        bytes: 5259,
        description:
          "Census selected socioeconomic indicators per community area (per-capita income, hardship index, poverty and unemployment shares) from the 2008 to 2012 ACS. 77 community-area rows plus one citywide row",
        available: true,
        provenance:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
      },
      {
        name: "chicago-community-areas.geojson",
        bytes: 2072102,
        description:
          "Boundaries of the 77 Chicago community areas (City of Chicago Data Portal, Socrata igwz-8jzy), reused from the chicago-transit-access-income dataset, used for point-in-polygon assignment of stations a",
        available: true,
        provenance:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
      },
      {
        name: "cta-l-stops.csv",
        bytes: 56904,
        description:
          "CTA System Information List of L Stops, full table of 302 platform/direction records (144 unique stations) with stop_id, station_name, map_id, ada flag, per-line boolean flags, and parsed lat/lng in t",
        available: true,
        provenance:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
      },
      {
        name: "cta-ridership-2023-annual-by-station.csv",
        bytes: 4653,
        description:
          "Total full-year 2023 CTA rail entries per station, aggregated from the daily-totals dataset by station_id (equals map_id in the stops file). 143 stations. Source City of Chicago Data Portal Socrata 5n",
        available: true,
        provenance:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Chicago Transit Authority via City of Chicago Data Portal (Socrata)",
        url: "https://data.cityofchicago.org/Transportation/CTA-System-Information-List-of-L-Stops/8pix-ypme",
      },
    ],
    preview: {
      columns: [
        {
          name: "ca",
          type: "text",
        },
        {
          name: "community_area_name",
          type: "text",
        },
        {
          name: "percent_of_housing_crowded",
          type: "text",
        },
        {
          name: "percent_households_below_poverty",
          type: "text",
        },
        {
          name: "percent_aged_16_unemployed",
          type: "text",
        },
        {
          name: "percent_aged_25_without_high_school_diploma",
          type: "text",
        },
        {
          name: "percent_aged_under_18_or_over_64",
          type: "text",
        },
        {
          name: "per_capita_income_",
          type: "text",
        },
        {
          name: "hardship_index",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "comparative-urban-renewal-displacement": {
    summary:
      "On the OCII Western Addition-Area 2 renewal footprint there are now about 21 subsidized developments and 914 units built mostly decades after 1950s-60",
    contents:
      "The real public data behind Forty Years of Public Subsidy on San Francisco's Western Addition Renewal Footprint. SF MOHCD Affordable Housing Portfolio, filtered to former-SFRA OCII project areas (Western Addition / Fillmore). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 12869,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "City and County of San Francisco, Mayor's Office of Housing and Community Development (MOHCD) / Office of Community Investment and Infrastructure (OCII), via DataSF",
      },
      {
        name: "fillmore-western-addition-developments.csv",
        bytes: 133110,
        description:
          "Former-SFRA / OCII project-area slice of the SF MOHCD/OCII Affordable Housing Portfolio (DataSF aaxw-2cb8). Each row tagged with ocii_project_area; the OCII Western Addition-Area 2 footprint is 21 of ",
        available: true,
        provenance:
          "City and County of San Francisco, Mayor's Office of Housing and Community Development (MOHCD) / Office of Community Investment and Infrastructure (OCII), via DataSF",
      },
      {
        name: "sf-mohcd-affordable-housing-portfolio.csv",
        bytes: 341050,
        description:
          "Citywide SF MOHCD/OCII Affordable Housing Portfolio (DataSF aaxw-2cb8). The 325 developments-file rows are a strict subset of these 849 rows, so this file serves as the citywide comparison universe. C",
        available: true,
        provenance:
          "City and County of San Francisco, Mayor's Office of Housing and Community Development (MOHCD) / Office of Community Investment and Infrastructure (OCII), via DataSF",
      },
    ],
    license: "Code MIT, derived data CC BY-NC 4.0 (DataSF MOHCD terms).",
    upstream_sources: [
      {
        label:
          "City and County of San Francisco, Mayor's Office of Housing and Community Development (MOHCD) / Office of Community Investment and Infrastructure (OCII), via DataSF",
        url: "https://data.sfgov.org/Housing-and-Buildings/Mayor-s-Office-of-Housing-and-Community-Developmen/aaxw-2cb8",
      },
      {
        label:
          "Fullilove, Mindy Thompson, and Rodrick Wallace. Serial Forced Displace",
        url: "https://pubmed.ncbi.nlm.nih.gov/21607786/",
      },
      {
        label:
          "Nelson, Robert K., et al. Renewing Inequality. Family Displacements th",
        url: "https://dsl.richmond.edu/panorama/renewal/",
      },
    ],
    preview: {
      columns: [
        {
          name: "mohcd_development_id",
          type: "text",
        },
        {
          name: "development_name",
          type: "text",
        },
        {
          name: "marketing_address",
          type: "text",
        },
        {
          name: "marketing_zip_code",
          type: "text",
        },
        {
          name: "supervisor_district",
          type: "text",
        },
        {
          name: "city_analysis_marketing",
          type: "text",
        },
        {
          name: "planning_neighborhood",
          type: "text",
        },
        {
          name: "ocii_project_area",
          type: "text",
        },
        {
          name: "lead_agency_account_name",
          type: "text",
        },
        {
          name: "tenure",
          type: "text",
        },
        {
          name: "project_status",
          type: "text",
        },
        {
          name: "development_type",
          type: "text",
        },
        {
          name: "general_housing_program",
          type: "text",
        },
        {
          name: "housing_program_program_name",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "cook-county-property-tax-appeal-disparity": {
    summary:
      "Commercial and land appeals win assessment cuts far more often than condo/co-op appeals and success varies widely by township, a descriptive who-files",
    contents:
      "The real public data behind Who Wins the Cook County Property Tax Appeal. . Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 11041,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance: "",
      },
      {
        name: "cook-appeals-sample.csv",
        bytes: 1312953,
        description:
          "5,000 real Cook County Assessor appeal records (Cook County Open Data, Assessor Appeals) with PIN, year, class, township code, hearing/appeal type, mailed and certified building/land/total values, the",
        available: true,
        provenance: "",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "Cook County Assessor's Office (2024). Cook County Homeowners Saved $1.",
        url: "https://www.cookcountyassessoril.gov/news/cook-county-homeowners-saved-19-billion-under-fritz-kaegis-reforms-university-chicago-study",
      },
    ],
    preview: {
      columns: [
        {
          name: "pin",
          type: "text",
        },
        {
          name: "year",
          type: "text",
        },
        {
          name: "class",
          type: "text",
        },
        {
          name: "township_code",
          type: "text",
        },
        {
          name: "case_no",
          type: "text",
        },
        {
          name: "hearing_type",
          type: "text",
        },
        {
          name: "subkey",
          type: "text",
        },
        {
          name: "appeal_type",
          type: "text",
        },
        {
          name: "status",
          type: "text",
        },
        {
          name: "mailed_bldg",
          type: "text",
        },
        {
          name: "mailed_land",
          type: "text",
        },
        {
          name: "mailed_tot",
          type: "text",
        },
        {
          name: "certified_bldg",
          type: "text",
        },
        {
          name: "certified_land",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "cook-county-vacant-land-land-bank": {
    summary:
      "City-owned vacant parcels concentrate on the West and South Sides (Englewood, New City, North Lawndale, West Englewood, East Garfield Park each over 1",
    contents:
      "The real public data behind Vacant Land and the Cook County Land Bank. City-Owned Land Inventory (City of Chicago). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 13661,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "City of Chicago Department of Planning and Development, via the Chicago Data Portal (Socrata)",
      },
      {
        name: "chicago-city-owned-land-inventory.csv",
        bytes: 3907100,
        description:
          "Full City of Chicago City-Owned Land Inventory pulled from the Chicago Data Portal (Socrata dataset aksk-kvfp) on 2026-05-29. 20,732 parcels. The redundant 'location' geo-string column and the duplica",
        available: true,
        provenance:
          "City of Chicago Department of Planning and Development, via the Chicago Data Portal (Socrata)",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "City of Chicago Department of Planning and Development, via the Chicago Data Portal (Socrata)",
        url: "https://data.cityofchicago.org/Community-Economic-Development/City-Owned-Land-Inventory/aksk-kvfp",
      },
      {
        label:
          "Cook County Treasurer's Office (Maria Pappas). Maps of Inequality: Fro",
        url: "https://www.cookcountytreasurer.com/pdfs/scavengersalestudy/2022scavengersalestudy.pdf",
      },
    ],
    preview: {
      columns: [
        {
          name: "id",
          type: "text",
        },
        {
          name: "pin",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "managing_organization",
          type: "text",
        },
        {
          name: "property_status",
          type: "text",
        },
        {
          name: "date_of_acquisition",
          type: "text",
        },
        {
          name: "date_of_disposition",
          type: "text",
        },
        {
          name: "sales_status",
          type: "text",
        },
        {
          name: "sale_offering_status",
          type: "text",
        },
        {
          name: "sale_offering_reason",
          type: "text",
        },
        {
          name: "sq_ft",
          type: "text",
        },
        {
          name: "square_footage_city_estimate",
          type: "text",
        },
        {
          name: "land_value",
          type: "text",
        },
        {
          name: "ward",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "holc-redlining-present-day-outcomes-chicago": {
    summary:
      "Descriptively, 2023 median income and homeownership fall and vacancy tends to rise as 1938 HOLC grades move A to D, mirroring the national pattern, wi",
    contents:
      "The real public data behind HOLC Redlining Grades and Present-Day Neighborhood Outcomes in Chicago. 1938 Chicago HOLC graded zones (Mapping Inequality) joined to ACS 2023 5-year tract estimates for Cook County. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 14841,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "HOLC polygons: University of Richmond Digital Scholarship Lab, Mapping Inequality (already in repo). ACS estimates: U.S. Census Bureau, American Community Survey 5-Year Detailed Tables.",
      },
      {
        name: "build_acs_csv.py",
        bytes: 3862,
        description:
          "Provenance script documenting how cook-county-tract-acs-2023.csv was assembled from the Census Bureau ACS 2023 5-year table-based Summary File (.dat files for B19013, B25003, B25002) filtered to Cook ",
        available: true,
        provenance:
          "HOLC polygons: University of Richmond Digital Scholarship Lab, Mapping Inequality (already in repo). ACS estimates: U.S. Census Bureau, American Community Survey 5-Year Detailed Tables.",
      },
      {
        name: "cook-county-tract-acs-2023.csv",
        bytes: 115743,
        description:
          "ACS 2023 5-year estimates for all 1,332 Cook County, IL census tracts: median household income (B19013_001E), tenure totals/owner/renter (B25003_001E/002E/003E), housing-unit total and vacant (B25002_",
        available: true,
        provenance:
          "HOLC polygons: University of Richmond Digital Scholarship Lab, Mapping Inequality (already in repo). ACS estimates: U.S. Census Bureau, American Community Survey 5-Year Detailed Tables.",
      },
      {
        name: "cook-county-tract-centroids-2023.csv",
        bytes: 64456,
        description:
          "1,332 Cook County census-tract centroids (GEOID, lat, lon) from the Census 2023 national tract gazetteer, used to map tracts to 1938 HOLC zones.",
        available: true,
        provenance:
          "HOLC polygons: University of Richmond Digital Scholarship Lab, Mapping Inequality (already in repo). ACS estimates: U.S. Census Bureau, American Community Survey 5-Year Detailed Tables.",
      },
    ],
    license:
      "Code MIT. HOLC zone polygons CC BY-NC-SA 4.0 (Mapping Inequality, Nelson et al. 2016). ACS and TIGER data are public domain.",
    upstream_sources: [
      {
        label:
          "HOLC polygons: University of Richmond Digital Scholarship Lab, Mapping Inequality (already in repo). ACS estimates: U.S. Census Bureau, American Community Survey 5-Year Detailed Tables.",
        url: "Repo GeoJSON: public/data/1938-holc-chicago-map-annotated/holc-chicago-1938-zones.geojson | ACS API: https://api.census.gov/data/2023/acs/acs5 (variables B19013_001E, B25003_001E/002E/003E, B25002_003E for vacancy; geography for:tract in:state:17 county:031). API documented at https://www.census.gov/data/developers/data-sets/acs-5year.html",
      },
      {
        label:
          "Nelson, R. K., Winling, L., Marciano, R., Connolly, N., et al. Mapping",
        url: "https://dsl.richmond.edu/panorama/redlining/",
      },
    ],
    preview: {
      columns: [
        {
          name: "NAME",
          type: "text",
        },
        {
          name: "B19013_001E",
          type: "text",
        },
        {
          name: "B25003_001E",
          type: "text",
        },
        {
          name: "B25003_002E",
          type: "text",
        },
        {
          name: "B25003_003E",
          type: "text",
        },
        {
          name: "B25002_001E",
          type: "text",
        },
        {
          name: "B25002_003E",
          type: "text",
        },
        {
          name: "state",
          type: "text",
        },
        {
          name: "county",
          type: "text",
        },
        {
          name: "tract",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "redlining-urban-heat-tree-canopy": {
    summary:
      "Our shippable original analysis is the HOLC grading geometry showing D and C zones blanketing South and West Side residential land, the spatial templa",
    contents:
      "The real public data behind Historic Redlining, Tree Canopy, and Urban Heat in Chicago. 1938 HOLC Graded Zones, Chicago (Mapping Inequality digitization). Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 19873,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "University of Richmond Digital Scholarship Lab, Mapping Inequality / Home Owners' Loan Corporation",
      },
      {
        name: "chicago-community-areas.geojson",
        bytes: 2072102,
        description:
          "Boundaries of the 77 Chicago community areas (City of Chicago Data Portal, Socrata igwz-8jzy), reused from the chicago-transit-access-income dataset, used for point-in-polygon assignment of stations a",
        available: true,
        provenance:
          "University of Richmond Digital Scholarship Lab, Mapping Inequality / Home Owners' Loan Corporation",
      },
      {
        name: "holc-chicago-1938-zones.geojson",
        bytes: 510655,
        description:
          "1938 HOLC grade polygons for Chicago, copied unchanged from the repo's 1938-holc-chicago-map-annotated dataset so the analysis is self-contained.",
        available: true,
        provenance:
          "University of Richmond Digital Scholarship Lab, Mapping Inequality / Home Owners' Loan Corporation",
      },
    ],
    license:
      "Code MIT. HOLC zone polygons CC BY-NC-SA 4.0 (Mapping Inequality, Nelson et al. 2016).",
    upstream_sources: [
      {
        label:
          "University of Richmond Digital Scholarship Lab, Mapping Inequality / Home Owners' Loan Corporation",
        url: "https://dsl.richmond.edu/panorama/redlining/data",
      },
    ],
    preview: {
      columns: [],
      sample_rows: [],
    },
    archive_status: "live",
  },
  "the-606-trail-displacement": {
    summary:
      "Against a literature documenting steep western-segment home-price appreciation after the 2015 trail opening, our contribution is a descriptive census ",
    contents:
      "The real public data behind The 606 and Displacement Pressure in Humboldt Park. Chicago Affordable Rental Housing Developments (606-corridor subset) plus TIF/RDA project records. Files are hosted here directly so the analysis is reproducible; analysis.py reads only these files and prints the figures the paper reports.",
    files: [
      {
        name: "analysis.py",
        bytes: 10460,
        description:
          "Reproducible pandas script. Verifies the developments file is a subset of the portfolio, isolates OCII Western Addition-Area 2 (21 developments / 914 units / 821 income-restricted), tabulates tenure a",
        available: true,
        provenance:
          "City of Chicago (Dept. of Housing affordable rental developments list; Dept. of Planning and Development TIF/RDA projects), already mirrored in the Rooted Forward repo",
      },
      {
        name: "chicago-affordable-rental-housing-developments.csv",
        bytes: 137515,
        description:
          "City of Chicago Dept. of Housing, Affordable Rental Housing Developments list (598 developments citywide; 119 in the four 606-corridor community areas). Copied byte-identical from the cha-plan-for-tra",
        available: true,
        provenance:
          "City of Chicago (Dept. of Housing affordable rental developments list; Dept. of Planning and Development TIF/RDA projects), already mirrored in the Rooted Forward repo",
      },
      {
        name: "chicago-tif-funded-rda-projects.csv",
        bytes: 452345,
        description:
          "City of Chicago Dept. of Planning and Development, TIF/RDA project records (768 records citywide; 65 in corridor community areas, 20 of them residential affordable projects). Copied byte-identical fro",
        available: true,
        provenance:
          "City of Chicago (Dept. of Housing affordable rental developments list; Dept. of Planning and Development TIF/RDA projects), already mirrored in the Rooted Forward repo",
      },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      {
        label:
          "City of Chicago (Dept. of Housing affordable rental developments list; Dept. of Planning and Development TIF/RDA projects), already mirrored in the Rooted Forward repo",
        url: "https://data.cityofchicago.org/Community-Economic-Development/Affordable-Rental-Housing-Developments/s6ha-ppgi",
      },
    ],
    preview: {
      columns: [
        {
          name: "community_area",
          type: "text",
        },
        {
          name: "community_area_number",
          type: "text",
        },
        {
          name: "property_type",
          type: "text",
        },
        {
          name: "property_name",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
        {
          name: "zip_code",
          type: "text",
        },
        {
          name: "phone_number",
          type: "text",
        },
        {
          name: "management_company",
          type: "text",
        },
        {
          name: "units",
          type: "text",
        },
        {
          name: "x_coordinate",
          type: "text",
        },
        {
          name: "y_coordinate",
          type: "text",
        },
        {
          name: "latitude",
          type: "text",
        },
        {
          name: "longitude",
          type: "text",
        },
        {
          name: "location",
          type: "text",
        },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

export function totalArchiveSize(meta: DatasetMeta): string {
  const total = meta.files.reduce((sum, f) => sum + f.bytes, 0);
  return formatBytes(total);
}

export function getDataset(slug: string): DatasetMeta | undefined {
  return RESEARCH_DATASETS[slug];
}
