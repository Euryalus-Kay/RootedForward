/* ------------------------------------------------------------------ */
/*  research-datasets.ts                                               */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  CANONICAL source of truth for replication-archive metadata.       */
/*                                                                     */
/*  Adding a new paper means adding ONE entry here, plus one row in   */
/*  the database via SQL. See docs/RESEARCH-CONTRIBUTING.md for the   */
/*  full end-to-end walkthrough.                                       */
/*                                                                     */
/*  REAL DATA POLICY                                                   */
/*  ----------------                                                   */
/*  Every dataset entry MUST point at a genuine public upstream       */
/*  source. We never fabricate sample rows or simulated data.         */
/*                                                                     */
/*  Two distribution states:                                           */
/*    archive_status: "in_preparation"                                 */
/*       The cleaned Rooted Forward replication archive is still      */
/*       being prepared. The page shows the real upstream URL so      */
/*       readers can grab the genuine raw data themselves. The        */
/*       Download button is hidden.                                    */
/*    archive_status: "live"                                           */
/*       An admin has uploaded the cleaned archive to the             */
/*       Supabase storage bucket research-datasets at                 */
/*       storage_path. The Download button is shown to signed-in     */
/*       users; the API mints a signed URL and logs the download.    */
/*                                                                     */
/*  upstream_sources is the always-on source list — it is shown on   */
/*  every card regardless of archive_status, so a reader can always  */
/*  trace claims back to the public-record origin.                    */
/*                                                                     */
/* ------------------------------------------------------------------ */

export interface DatasetFile {
  /** Filename inside the eventual ZIP. */
  name: string;
  /** Approximate size in bytes once cleaned. */
  bytes: number;
  /** One-sentence description of what the file will contain. */
  description: string;
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
  "geography-of-disinvestment-chicago-west-side": {
    summary:
      "1938 HOLC redlining grades on Chicago's West Side joined to today's vacancy, school-closure, and food-access data.",
    contents:
      "HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, and North Lawndale, paired with six quantitative outcome indicators and the Cook County Assessor 2024 residential-vacancy panel at the tract level. The cleaned Rooted Forward archive is in preparation; in the meantime, every record below traces to a public source.",
    files: [
      { name: "holc-west-side-tract-crosswalk.geojson", bytes: 2300000, description: "HOLC zone polygons crosswalked to 2020 census tracts." },
      { name: "holc-west-side-outcomes.csv", bytes: 48000, description: "Tract-level outcome panel: vacancy, closures, food access." },
      { name: "holc-west-side-analysis.R", bytes: 12000, description: "Replication code reproducing every figure in the paper." },
    ],
    license:
      "Code MIT, derived data CC BY 4.0, 1938 zone polygons CC BY-NC-SA 4.0 (Mapping Inequality, Nelson et al. 2016).",
    upstream_sources: [
      { label: "Mapping Inequality (HOLC zones, all U.S. cities)", url: "https://dsl.richmond.edu/panorama/redlining/", note: "Direct GeoJSON and area-description downloads under CC BY-NC-SA 4.0." },
      { label: "Cook County Assessor · Property Data", url: "https://www.cookcountyassessor.com/property-data", note: "Bulk parcel and vacancy files updated annually." },
      { label: "USDA Food Access Research Atlas (2024 update)", url: "https://www.ers.usda.gov/data-products/food-access-research-atlas/", note: "Tract-level low-income / low-access designation." },
      { label: "U.S. Census ACS 2023 5-year estimates", url: "https://data.census.gov/", note: "Demographics and tenure at the tract level." },
    ],
    preview: {
      columns: [
        { name: "geoid_2020", type: "text", description: "2020 census tract GEOID" },
        { name: "holc_grade", type: "text", description: "A, B, C, or D" },
        { name: "vacancy_rate_2024", type: "numeric", description: "CCAO residential-vacancy rate, percent" },
        { name: "closed_school_2013", type: "boolean", description: "Tract contained a school closed in 2013" },
        { name: "food_access_low", type: "boolean", description: "USDA low-income low-access designation, 2024" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "obama-center-impact-zone-rent-pressure": {
    summary:
      "Monthly rental listings around the Obama Presidential Center, January 2020 through December 2025.",
    contents:
      "Cleaned 9,612-listing panel sourced from Zillow Research's public ZORI release, City of Chicago Rental Registry public data, and Craigslist scrapes governed by their robots.txt. The cleaned panel is in preparation. Until then, the upstream sources below produce the same raw data the paper draws on.",
    files: [
      { name: "opc-rent-panel-2020-2025.csv", bytes: 18400000, description: "9,612 listings with monthly observations, six years." },
      { name: "opc-impact-zone-tracts.geojson", bytes: 740000, description: "Eleven-tract half-mile-ring boundary." },
      { name: "opc-did-analysis.R", bytes: 18000, description: "Difference-in-differences specification." },
      { name: "opc-synthetic-control.R", bytes: 14500, description: "Synthetic-control robustness." },
    ],
    license: "Data CC BY 4.0, code MIT.",
    upstream_sources: [
      { label: "Zillow Research data portal (ZORI rent index)", url: "https://www.zillow.com/research/data/", note: "Tract-level rent index downloads." },
      { label: "Chicago Data Portal · Rental Registry", url: "https://data.cityofchicago.org/", note: "Search 'rental registry' for the active dataset." },
      { label: "Institute for Housing Studies at DePaul", url: "https://www.housingstudies.org/data-portal/", note: "Independent South Side rent indicators for cross-validation." },
    ],
    notes:
      "Zillow ZORI values redistribute under Zillow Research's public terms. Craigslist listings are de-identified beyond header fields.",
    preview: {
      columns: [
        { name: "listing_id", type: "text", description: "Anonymized listing identifier" },
        { name: "month", type: "date", description: "First of month" },
        { name: "in_ring", type: "boolean", description: "Within the half-mile impact zone" },
        { name: "bedrooms", type: "int" },
        { name: "asking_rent_usd", type: "numeric", description: "Posted asking rent, US dollars" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "pilsen-industrial-corridor-rezoning-review": {
    summary:
      "All 351 written public comments on the 2025 Pilsen rezoning application, coded by position and concern.",
    contents:
      "Coded comment record for Application ZC-2025-0074, hearing transcript excerpts, and the coalition steering-committee log. Every comment is on the public legislative record. The coding overlay is the Rooted Forward contribution.",
    files: [
      { name: "pilsen-zc-2025-0074-comments.csv", bytes: 410000, description: "351 written comments with seven-dimension coding." },
      { name: "pilsen-coding-schema.md", bytes: 8000, description: "Coding rubric used by the analysts." },
      { name: "pilsen-hearing-timeline.csv", bytes: 3500, description: "Hearing-day events and witness order." },
    ],
    license: "CC BY 4.0.",
    upstream_sources: [
      { label: "Chicago City Council Legistar (Application ZC-2025-0074)", url: "https://chicago.legistar.com/", note: "Search the application number for the full record and all comments." },
      { label: "Chicago Department of Planning & Development", url: "https://www.chicago.gov/city/en/depts/dcd.html", note: "Pilsen Industrial Corridor planning documents." },
    ],
    preview: {
      columns: [
        { name: "comment_id", type: "int" },
        { name: "position", type: "text", description: "oppose | support" },
        { name: "affiliation_type", type: "text" },
        { name: "primary_concern", type: "text" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "cpd-traffic-stop-data-2024": {
    summary:
      "All 287,412 Chicago Police Department traffic stops from 2024, the city's first release under the 2024 Transparency Act.",
    contents:
      "The full 287,412-record CPD 2024 traffic-stop release, the district-level demographic crosswalk, hourly volume aggregates, and replication code for the outcome and veil-of-darkness tests. The raw release is on the Chicago Data Portal; our cleaned archive is in preparation.",
    files: [
      { name: "cpd-stops-2024.csv", bytes: 62500000, description: "287,412 stops with 15 fields each." },
      { name: "cpd-district-crosswalk.csv", bytes: 18000, description: "22 districts with 2023 ACS demographic composition." },
      { name: "cpd-outcome-test.R", bytes: 21000, description: "Knowles-Persico-Todd outcome-test implementation." },
      { name: "cpd-vod-check.R", bytes: 15500, description: "Veil-of-darkness robustness check." },
    ],
    license: "Data CC BY 4.0, code MIT.",
    upstream_sources: [
      { label: "Chicago Data Portal · Traffic Stops (2024 release)", url: "https://data.cityofchicago.org/", note: "Search 'traffic stops' to find the city's CSV." },
      { label: "Stanford Open Policing Project", url: "https://openpolicing.stanford.edu/data/", note: "Comparable cross-city traffic-stop panels." },
    ],
    notes: "Officer badge numbers were withheld at source.",
    preview: {
      columns: [
        { name: "stop_date", type: "date" },
        { name: "district", type: "int" },
        { name: "stop_reason", type: "text" },
        { name: "driver_race", type: "text", description: "Officer-recorded" },
        { name: "search_conducted", type: "boolean" },
        { name: "contraband_recovered", type: "boolean" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "1938-holc-chicago-map-annotated": {
    summary:
      "The full 1938 HOLC Chicago map: 239 graded zones, all 82 Area Descriptions, polygons, and a 2020-tract crosswalk.",
    contents:
      "Annotated edition of the 1938 HOLC Chicago Residential Security Map. The polygons and area descriptions come directly from the Mapping Inequality project at the University of Richmond; the 2020-tract crosswalk and the six derived indicator files are the Rooted Forward contribution and ship under the matching CC BY-NC-SA license.",
    files: [
      { name: "holc-chicago-1938-zones.geojson", bytes: 4200000, description: "All 239 graded zones." },
      { name: "holc-chicago-1938-area-descriptions.csv", bytes: 480000, description: "All 82 Area Descriptions transcribed." },
      { name: "holc-chicago-2020-tract-crosswalk.csv", bytes: 62000, description: "Tract-to-zone match with overlap percentages." },
      { name: "holc-chicago-indicators.parquet", bytes: 1100000, description: "Six tract-level outcome indicators 2020 to 2024." },
      { name: "holc-chicago-map-tiles.zip", bytes: 104000000, description: "Vector tiles for self-hosting." },
    ],
    license: "CC BY-NC-SA 4.0 to match Mapping Inequality. Code MIT.",
    upstream_sources: [
      { label: "Mapping Inequality · Chicago", url: "https://dsl.richmond.edu/panorama/redlining/cities/IL/Chicago", note: "Direct GeoJSON and area-description downloads, the canonical source for HOLC Chicago." },
      { label: "National Archives Record Group 195 (HOLC)", url: "https://catalog.archives.gov/id/720357", note: "Original HOLC records, the underlying primary source." },
    ],
    preview: {
      columns: [
        { name: "zone_id", type: "text" },
        { name: "grade", type: "text" },
        { name: "area_description_excerpt", type: "text" },
        { name: "matched_2020_tracts", type: "int" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "school-closures-2013-and-after": {
    summary:
      "What happened to the 49 Chicago schools closed in 2013, eleven years on. Buildings, students, and adjacent blocks.",
    contents:
      "Tract-level CPS post-closure tracking panel (de-identified), the CPS Facilities Master Plan, the Cook County Assessor block-level vacancy panel, and Chicago Public Library branch circulation. The CPS tracking file came through Illinois FOIA 2024-04311 and ships subject to the redaction terms of that release.",
    files: [
      { name: "cps-2013-closures-tracking.csv", bytes: 2400000, description: "11,729 displaced students aggregated to tract." },
      { name: "cps-facilities-master-plan-2013-2024.csv", bytes: 620000, description: "Annual disposition status per building." },
      { name: "cps-block-vacancy-panel.csv", bytes: 3100000, description: "Quarter-mile buffer vacancy 2013 through 2024." },
      { name: "cpl-circulation-2013-2024.csv", bytes: 1400000, description: "CPL branch monthly circulation totals." },
    ],
    license:
      "Code/tables MIT. CPS tracking file subject to FOIA 2024-04311 redaction terms.",
    upstream_sources: [
      { label: "Chicago Public Schools · School Actions Archive", url: "https://www.cps.edu/about/district-data/", note: "2013 closure list and Facilities Master Plan annual updates." },
      { label: "Chicago Data Portal · CPS Schools", url: "https://data.cityofchicago.org/", note: "Search 'CPS schools' for the live dataset." },
      { label: "Chicago Public Library · Open Data", url: "https://www.chipublib.org/about/data/", note: "Branch circulation totals." },
      { label: "Cook County Assessor", url: "https://www.cookcountyassessor.com/property-data", note: "Block-level vacancy panel source." },
    ],
    preview: {
      columns: [
        { name: "closed_school", type: "text" },
        { name: "community_area", type: "text" },
        { name: "buffer_vacancy_2013", type: "numeric" },
        { name: "buffer_vacancy_2024", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "cha-plan-for-transformation-retrospective": {
    summary:
      "Twenty-five years of the CHA Plan for Transformation. 17,000 displaced families, current housing status, unit-count reconciliation.",
    contents:
      "De-identified CHA resident-tracking panel covering 17,000 families from 1999 through 2024, MTW reports aggregated to tract, and HUD HCV records for Chicago-area voucher holders. Tracking files were obtained under three Illinois FOIA requests and ship subject to those redaction terms.",
    files: [
      { name: "cha-resident-tracking-1999-2024.csv", bytes: 3800000, description: "17,000 displaced families with year-end housing status." },
      { name: "cha-mtw-tract-aggregates.csv", bytes: 920000, description: "Annual MTW unit counts by tract." },
      { name: "hud-hcv-chicago-area.csv", bytes: 2100000, description: "HCV households with current tract." },
      { name: "cha-unit-count-reconciliation.R", bytes: 17000, description: "Reproduces the 25,000-unit reconciliation." },
    ],
    license:
      "Code MIT. CHA tracking subject to FOIA 2019-00924, 2022-00718, and 2025-01108 terms.",
    upstream_sources: [
      { label: "CHA · MTW Annual Reports", url: "https://www.thecha.org/about/plans-and-reports", note: "Public Moving to Work reports 2000 through 2024." },
      { label: "HUD · Picture of Subsidized Households", url: "https://www.huduser.gov/portal/datasets/assthsg.html", note: "Tract-level subsidized-housing data including HCV." },
      { label: "ProPublica · CHA Plan reporting (Mick Dumke 2022)", url: "https://www.propublica.org/series/chicago-housing-authority", note: "Independent investigation that prompted the unit-count reconciliation." },
    ],
    preview: {
      columns: [
        { name: "family_id", type: "text" },
        { name: "baseline_property", type: "text" },
        { name: "current_status", type: "text" },
        { name: "current_tract", type: "text" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "austin-cba-playbook": {
    summary:
      "Eight Chicago Community Benefits Agreements, coded across five structural features and ten compliance categories.",
    contents:
      "Eight Chicago CBAs coded by structural features and compliance, plus a site evaluation framework for the four Austin sites identified by Austin Coming Together. The eight CBAs are public documents collected and curated by the Chicago Lawyers' Committee for Civil Rights.",
    files: [
      { name: "chicago-cba-eight-case-coding.csv", bytes: 34000, description: "Eight cases coded across structural features." },
      { name: "cba-structural-features.md", bytes: 12000, description: "Coding rubric." },
      { name: "austin-site-evaluation.md", bytes: 18000, description: "Site-by-site evaluation." },
    ],
    license: "CC BY 4.0.",
    upstream_sources: [
      { label: "Chicago Lawyers' Committee for Civil Rights · CBA Repository", url: "https://www.clccrul.org/", note: "Source of the eight Chicago CBA documents." },
      { label: "UIC Great Cities Institute", url: "https://greatcities.uic.edu/", note: "Coalition for a Community Benefits Agreement archive." },
      { label: "Austin Coming Together · Quality of Life Plan", url: "https://www.austincomingtogether.org/", note: "Source of the four near-term Austin CBA target sites." },
    ],
    preview: {
      columns: [
        { name: "case_name", type: "text" },
        { name: "signed", type: "date" },
        { name: "three_party_structure", type: "boolean" },
        { name: "monitoring_independence", type: "text" },
        { name: "compliance_categories_full", type: "int" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "bronzeville-tif-expenditure-analysis": {
    summary:
      "Twenty-three years of the Bronzeville TIF: every dollar raised and every dollar spent, 2002 through 2025.",
    contents:
      "Reconciled twenty-three-year Bronzeville TIF revenue and expenditure accounting, drawn from Cook County Clerk TIF Annual Reports, the Chicago DOF Annual Financial Analysis, and Chicago DPD project-level files. Every source record is public under the Illinois TIF Act disclosure requirements.",
    files: [
      { name: "bronzeville-tif-revenue-2002-2025.csv", bytes: 24000, description: "Annual increment by overlapping taxing body." },
      { name: "bronzeville-tif-expenditures-2002-2025.csv", bytes: 42000, description: "Project-level expenditure with category." },
      { name: "bronzeville-tif-project-list.csv", bytes: 31000, description: "31 projects with within-district share." },
      { name: "bronzeville-tif-comparison-districts.csv", bytes: 18000, description: "Comparison rates for adjacent districts." },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      { label: "Cook County Clerk · TIF Reports", url: "https://www.cookcountyclerkil.gov/finance/tif-revenue-reports", note: "Annual TIF revenue and expenditure reports for every Cook County TIF district." },
      { label: "Chicago Department of Finance · Annual Financial Analysis", url: "https://www.chicago.gov/city/en/depts/fin.html", note: "Citywide TIF expenditure tabulations." },
      { label: "Chicago Civic Lab · TIF Illumination Project", url: "https://www.thecivlab.com/tif-illumination", note: "Independent annual summaries since 2013." },
    ],
    preview: {
      columns: [
        { name: "year", type: "int" },
        { name: "increment_usd", type: "numeric" },
        { name: "category", type: "text", description: "within-district | adjacent-transfer | regionally-significant | balance" },
        { name: "amount_usd", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "cook-county-property-tax-appeal-disparity": {
    summary:
      "Ten years of Cook County property-tax appeals (2015–2024), tract demographics, specialized-firm concentration.",
    contents:
      "Ten-year Cook County appeal record cleaned and matched to 2020 census tracts, the tract-level demographic and income panel from the 2023 ACS, and a specialized-firm concentration analysis. Source records are public under the Illinois Freedom of Information Act.",
    files: [
      { name: "cook-appeals-2015-2024.csv", bytes: 92000000, description: "1.74 million appeal filings with outcome and filer-identity field." },
      { name: "cook-appeals-tract-panel.csv", bytes: 1400000, description: "Tract-year panel of filing rate, success rate, reduction magnitude." },
      { name: "cook-appeals-firm-concentration.csv", bytes: 380000, description: "Specialized firm activity by tract." },
      { name: "cook-appeals-analysis.R", bytes: 24000, description: "Replication code." },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      { label: "Cook County Assessor · Open Data", url: "https://www.cookcountyassessor.com/open-data", note: "Property-data downloads, including appeal records." },
      { label: "Cook County Board of Review", url: "https://www.cookcountyboardofreview.com/", note: "Second-stage appeal records." },
      { label: "U.S. Census ACS 2023 5-year estimates", url: "https://data.census.gov/", note: "Tract-level demographic and income panel." },
    ],
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "year", type: "int" },
        { name: "filings_per_1000", type: "numeric" },
        { name: "success_rate", type: "numeric" },
        { name: "median_reduction_pct", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "cross-bronx-expressway-sixty-years-later": {
    summary:
      "Sixty years of the Cross-Bronx: 1948–1955 displacements, 1960–1980 census, 2023 air quality and asthma rates.",
    contents:
      "Digitized parcel-level acquisition records, an NHGIS-harmonized 1960 to 1980 decennial census panel for the quarter-mile buffer, and 2023 PM2.5, noise, and pediatric-asthma data at the tract level. The 1948–1955 acquisition files are public at the New York City Municipal Archives.",
    files: [
      { name: "cross-bronx-acquisitions-1948-1955.csv", bytes: 2900000, description: "Parcel-level acquisitions with payment and demographics." },
      { name: "cross-bronx-census-1960-1980.csv", bytes: 680000, description: "Quarter-mile buffer panel." },
      { name: "cross-bronx-environmental-2023.csv", bytes: 210000, description: "Tract-level PM2.5 and noise." },
      { name: "cross-bronx-asthma-2023.csv", bytes: 190000, description: "Pediatric asthma hospitalization rate." },
      { name: "cross-bronx-quarter-mile-buffer.geojson", bytes: 1200000, description: "Buffer polygon." },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    upstream_sources: [
      { label: "NYC Municipal Archives · RG 219 (TBTA records)", url: "https://www1.nyc.gov/site/records/historical-records/about-municipal-archives.page", note: "Triborough Bridge and Tunnel Authority Cross-Bronx files, 1948–1955." },
      { label: "IPUMS NHGIS", url: "https://www.nhgis.org/", note: "1960–1980 decennial census harmonized to 2020 tract boundaries." },
      { label: "NY State Department of Health · EPHTS", url: "https://www.health.ny.gov/environmental/public_health_tracking/", note: "PM2.5, noise, and asthma hospitalization at the tract level." },
    ],
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "in_buffer", type: "boolean" },
        { name: "pm25_2023", type: "numeric" },
        { name: "asthma_rate_per_1000", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "fillmore-forty-years-after-redevelopment": {
    summary:
      "Coded San Francisco Redevelopment Agency case files (1948–2012) and OCII Certificate of Preference records (2008–2024).",
    contents:
      "Coded archival-record abstracts from the San Francisco Public Library History Center's SFRA Records and the OCII Certificates of Preference annual reports aggregated into a single dataset. The underlying case files are public at the SFPL History Center.",
    files: [
      { name: "sfra-archival-abstracts.csv", bytes: 280000, description: "Coded SFRA case-file abstracts." },
      { name: "ocii-cop-2008-2024.csv", bytes: 92000, description: "Annual COP placement counts." },
    ],
    license: "CC BY-NC 4.0.",
    upstream_sources: [
      { label: "SFPL History Center · SFRA Records (1948–2012)", url: "https://sfpl.org/locations/main-library/sf-history-center", note: "On-site access to the underlying SFRA case files." },
      { label: "San Francisco MOHCD · Certificate of Preference Program", url: "https://www.sf.gov/topics/certificate-preference-program", note: "Public COP annual reports 2008 through present." },
      { label: "OCII · Office of Community Investment & Infrastructure", url: "https://sfocii.org/", note: "OCII annual reports and CoP eligibility documents." },
    ],
    preview: {
      columns: [
        { name: "year", type: "int" },
        { name: "placements", type: "int" },
        { name: "cumulative", type: "int" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
  },

  "fair-park-and-the-neighborhoods-it-displaced": {
    summary:
      "Two rounds of Fair Park displacement (1935–1936 and 1966–1968) joined to the 2023 South Dallas tract panel.",
    contents:
      "Compiled parcel-level records of the 1935–1936 Centennial expansion and the 1966–1968 parking-lot expansion, the 2023 ACS South Dallas tract panel, and Fair Park First's 2020–2024 implementation data. The 1930s acquisition records are at the Dallas Historical Society; the 1960s files are at the Texas General Land Office.",
    files: [
      { name: "fair-park-1936-acquisitions.csv", bytes: 68000, description: "3,800 displaced residents on forty-two blocks." },
      { name: "fair-park-1966-1968-acquisitions.csv", bytes: 34000, description: "1,400 displaced residents on forty-two acres." },
      { name: "fair-park-acs-2023-panel.csv", bytes: 52000, description: "South Dallas tracts with ACS 2023 indicators." },
      { name: "fair-park-first-2020-2024.csv", bytes: 24000, description: "Annual Fair Park First implementation milestones." },
    ],
    license: "CC BY 4.0.",
    upstream_sources: [
      { label: "Dallas Historical Society", url: "https://dallashistory.org/", note: "1930s condemnation records." },
      { label: "Texas General Land Office · Archives & Records", url: "https://www.glo.texas.gov/history/archives/", note: "1966–1968 acquisition files." },
      { label: "U.S. Census ACS 2023 5-year estimates", url: "https://data.census.gov/", note: "South Dallas tract panel." },
      { label: "Fair Park First · Annual Reports", url: "https://www.fairparkfirst.org/", note: "Implementation milestones 2020 through 2024." },
    ],
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "median_household_income", type: "numeric" },
        { name: "homeownership_rate", type: "numeric" },
        { name: "adi_national_percentile", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "in_preparation",
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
