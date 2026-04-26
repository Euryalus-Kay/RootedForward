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
  "geography-of-disinvestment-chicago-west-side": {
    summary:
      "Every grocery store licensed in Chicago in 2013, joined to community-area boundaries on the West Side.",
    contents:
      "The full Chicago grocery-store licensing list from 2013, hosted directly on Rooted Forward. Filter by community area (25 = Austin, 27 = East Garfield Park, 29 = North Lawndale) to reproduce the West Side disinvestment finding. The full HOLC-to-2020-tract crosswalk and outcome panel is in preparation.",
    files: [
      { name: "chicago-grocery-stores-2013.csv", bytes: 122664, description: "All 506 grocery stores licensed in Chicago in 2013, with community area, ward, census tract, and license details.", available: true, provenance: "Chicago Data Portal · Grocery Stores - 2013" },
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
    archive_status: "live",
  },

  "obama-center-impact-zone-rent-pressure": {
    summary:
      "Zillow ZORI rent index for South Side Chicago zip codes, monthly from 2015 through 2025.",
    contents:
      "The Zillow Observed Rent Index for thirteen South Side Chicago zip codes (60608, 60609, 60615, 60616, 60617, 60619, 60620, 60621, 60628, 60637, 60643, 60649, 60653) extracted from the public Zillow Research ZIP-level CSV. The 60615 / 60637 / 60649 rows around the Obama Presidential Center site are the impact-zone series. The cleaned Rental Registry and Craigslist panel is in preparation.",
    files: [
      { name: "zillow-zori-chicago-south-side.csv", bytes: 29687, description: "Monthly Zillow Observed Rent Index for thirteen Chicago South Side zip codes, 2015 through 2025.", available: true, provenance: "Zillow Research · public ZIP-level ZORI release" },
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
    archive_status: "live",
  },

  "pilsen-industrial-corridor-rezoning-review": {
    summary:
      "All 2,000 most-recent Chicago building permits in Pilsen (community area 31), live from the Chicago Data Portal.",
    contents:
      "A live cut of Chicago building permits in the Pilsen community area, hosted directly on Rooted Forward. Filter by permit_type, year, or work_description to see the conversion pattern that the rezoning would have accelerated. The coded comment record for Application ZC-2025-0074 is in preparation.",
    files: [
      { name: "chicago-building-permits-pilsen.csv", bytes: 1759163, description: "2,000 building permits from Chicago's Pilsen community area (CA 31). Each row records permit type, work description, dates, and address.", available: true, provenance: "Chicago Data Portal · Building Permits" },
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
    archive_status: "live",
  },

  "cpd-traffic-stop-data-2024": {
    summary:
      "5,000-stop sample of Chicago Police Department traffic stops from the Stanford Open Policing Project corpus.",
    contents:
      "A 5,000-stop random sample drawn from the Stanford Open Policing Project's published Chicago dataset, hosted directly on Rooted Forward. Each row carries the date, location, subject demographics, officer demographics, search status, and outcome — the inputs the Knowles-Persico-Todd outcome test runs on. The 287,412-record 2024 Chicago Transparency Act release is in preparation pending the city's full quarterly publication cycle.",
    files: [
      { name: "chicago-historical-stops-sample.csv", bytes: 832506, description: "5,000-stop random sample from the Stanford Open Policing Project Chicago corpus.", available: true, provenance: "Stanford Open Policing Project · Chicago dataset" },
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
    archive_status: "live",
  },

  "1938-holc-chicago-map-annotated": {
    summary:
      "The full 1938 HOLC Chicago Residential Security Map as live GeoJSON, hosted directly on Rooted Forward.",
    contents:
      "The complete 1938 HOLC Chicago zone polygons sourced from the Mapping Inequality project at the University of Richmond. Each feature carries the original HOLC grade (A, B, C, or D) and the geometry needed to render the map at any zoom level. The full Area Descriptions transcription and the 2020-tract crosswalk are in preparation.",
    files: [
      { name: "holc-chicago-1938-zones.geojson", bytes: 510655, description: "All graded zones for HOLC Chicago 1938 with geometry and grade.", available: true, provenance: "Mapping Inequality (Nelson et al. 2016) · CC BY-NC-SA 4.0" },
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
    archive_status: "live",
  },

  "school-closures-2013-and-after": {
    summary:
      "Every Chicago Public School with full profile data — 1,983 schools with location, enrollment, demographics, and ratings.",
    contents:
      "The complete CPS School Profile dataset, hosted directly on Rooted Forward. Filter by school_type, community area, or rating to identify the 49 schools closed in 2013 and the schools their students were sent to. The de-identified CPS post-closure tracking panel is in preparation.",
    files: [
      { name: "cps-schools-full-list.csv", bytes: 1261398, description: "1,983 Chicago Public Schools with location, enrollment, demographics, ratings, and contact info.", available: true, provenance: "Chicago Data Portal · CPS School Profile Information" },
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
    archive_status: "live",
  },

  "cha-plan-for-transformation-retrospective": {
    summary:
      "Every Chicago affordable rental housing development, including CHA properties, with addresses, units, and management.",
    contents:
      "The complete Chicago Affordable Rental Housing Developments list, hosted directly on Rooted Forward. CHA properties surface alongside other affordable units — filter by property_type or management_company to isolate the CHA portfolio. The de-identified CHA resident-tracking panel is in preparation pending FOIA redaction review.",
    files: [
      { name: "chicago-affordable-rental-housing-developments.csv", bytes: 137515, description: "1,776 affordable rental housing developments in Chicago, with property type, units, address, and management.", available: true, provenance: "Chicago Data Portal · Affordable Rental Housing Developments" },
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
    archive_status: "live",
  },

  "austin-cba-playbook": {
    summary:
      "Every Chicago TIF-funded financial-incentive project with the actual fields a CBA monitoring committee would inspect — ordinance dates, affordable units, MBE/WBE participation, jobs-created requirements.",
    contents:
      "The eight signed Chicago CBA documents themselves live in the Chicago Lawyers' Committee curated repository and the UIC Great Cities Institute archive — institutional collections without public download URLs. What you can pull from a public API and host directly is this: every Chicago Financial Incentive Project under TIF, with the publicly-recorded compliance fields (affordable_residential_units, mbe_requirement_met, wbe_requirement_met, jobs_created_required) that any CBA monitoring would draw on. The eight-case CBA coding table itself is in preparation pending agreement from the holding institutions.",
    files: [
      { name: "chicago-tif-financial-incentive-projects.csv", bytes: 20522, description: "40 Chicago TIF-funded development projects with project name, applicant, address, ward, community area, TIF district, ordinance approval date, RDA approval date, residential units, affordable_residential_units, incentive amount, total project cost, jobs created/retained, MBE/WBE compliance.", available: true, provenance: "Chicago Data Portal · Financial Incentive Projects (TIF-Funded) Economic Development" },
      { name: "chicago-cba-eight-case-coding.csv", bytes: 34000, description: "Eight Chicago CBA cases coded across five structural features." },
      { name: "cba-structural-features.md", bytes: 12000, description: "Coding rubric." },
      { name: "austin-site-evaluation.md", bytes: 18000, description: "Site-by-site evaluation." },
    ],
    license: "CC BY 4.0. The TIF financial-incentive projects file is redistributed under the City of Chicago Data Portal terms.",
    upstream_sources: [
      { label: "Chicago Data Portal · Financial Incentive Projects (TIF-Funded)", url: "https://data.cityofchicago.org/Community-Economic-Development/Financial-Incentive-Projects-TIF-Funded-Economic-D/iekz-rtng", note: "Live source of the project file we host. Updated as new TIF-funded projects are approved." },
      { label: "Chicago Lawyers' Committee for Civil Rights Under Law", url: "https://www.clccrul.org/", note: "Reference repository for Chicago CBA documents; case files are held in working archives." },
      { label: "UIC Great Cities Institute", url: "https://greatcities.uic.edu/", note: "Coalition for a Community Benefits Agreement document archive." },
      { label: "Chicago City Council Legistar", url: "https://chicago.legistar.com/Legislation.aspx", note: "Search by ordinance text or sponsor to find specific PD ordinances and CBA-related housing legislation." },
      { label: "Austin Coming Together · Quality of Life Plan", url: "https://www.austincomingtogether.org/", note: "Public source of the four near-term Austin CBA target sites." },
    ],
    preview: {
      columns: [
        { name: "project_name", type: "text" },
        { name: "ward", type: "text" },
        { name: "community_area", type: "text" },
        { name: "tif_district", type: "text" },
        { name: "ordinance_approval_date", type: "date" },
        { name: "residential_units", type: "int" },
        { name: "affordable_residential_units", type: "int" },
        { name: "incentive_amount", type: "numeric" },
      ],
      sample_rows: [],
    },
    archive_status: "live",
  },

  "bronzeville-tif-expenditure-analysis": {
    summary:
      "All 2,558 TIF-funded RDA and IGA projects across every Chicago TIF district, including Bronzeville.",
    contents:
      "The full Chicago Tax Increment Financing-funded RDA and IGA project list, hosted directly on Rooted Forward. Filter by tif_district to see Bronzeville-specific spending, or compare across districts to reproduce the regressive-transfer pattern Weber (2022) documented at the aggregate level.",
    files: [
      { name: "chicago-tif-funded-rda-projects.csv", bytes: 452345, description: "2,558 TIF-funded projects across Chicago with district, developer, approved amount, total cost, affordable units, and ward.", available: true, provenance: "Chicago Data Portal · TIF Funded RDA and IGA Projects" },
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
    archive_status: "live",
  },

  "cook-county-property-tax-appeal-disparity": {
    summary:
      "5,000 real Cook County Assessor appeal records with PIN, year, township, hearing type, and outcome.",
    contents:
      "A 5,000-row sample of Cook County Assessor administrative appeal records, hosted directly on Rooted Forward. Each row includes the PIN, year, classification, township, appeal type, hearing type, mailed values, certified values, and reason codes — the full set of fields the paper's analysis runs on. The complete 1.74 million-record ten-year panel is in preparation.",
    files: [
      { name: "cook-appeals-sample.csv", bytes: 1312953, description: "5,000 Cook County Assessor appeal records with PIN, year, class, township, hearing type, outcome, and reason codes.", available: true, provenance: "Cook County Open Data · Assessor Appeals" },
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
    archive_status: "live",
  },

  "cross-bronx-expressway-sixty-years-later": {
    summary:
      "5,000 NYC air-quality measurements by neighborhood: PM2.5, NO2, ozone, and other pollutants over time.",
    contents:
      "5,000 rows of New York City Air Quality Surveillance, hosted directly on Rooted Forward. Filter by geo_place_name to isolate Bronx neighborhoods adjacent to the Cross-Bronx corridor (Highbridge, Morris Heights, Crotona, West Farms, Tremont). Each row records a pollutant measurement with start_date, geography, and data_value. The parcel-level 1948–1955 acquisition records are in preparation.",
    files: [
      { name: "nyc-air-quality.csv", bytes: 744050, description: "5,000 NYC air quality measurements (PM2.5, NO2, ozone) by neighborhood with start dates and values.", available: true, provenance: "NYC Open Data · Air Quality Surveillance" },
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
    archive_status: "live",
  },

  "fillmore-forty-years-after-redevelopment": {
    summary:
      "All 849 affordable housing developments in the SF MOHCD portfolio, including OCII / former SFRA properties.",
    contents:
      "The complete San Francisco MOHCD Affordable Housing Portfolio, hosted directly on Rooted Forward. Filter by ocii_project_area to isolate the Western Addition and Fillmore developments that house Certificate of Preference holders. Each row records the development, address, project area, status, and tenure type. The coded SFRA case-file archive is in preparation.",
    files: [
      { name: "sf-mohcd-affordable-housing-portfolio.csv", bytes: 341050, description: "849 affordable housing developments in the SF MOHCD portfolio with OCII project area, status, and tenure.", available: true, provenance: "DataSF · MOHCD Affordable Housing Portfolio" },
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
    archive_status: "live",
  },

  "fair-park-and-the-neighborhoods-it-displaced": {
    summary:
      "Every Dallas County census tract with median household income and owner / renter counts from the 2023 ACS.",
    contents:
      "All 645 Dallas County census tracts from the 2023 American Community Survey 5-year estimates, hosted directly on Rooted Forward. Each row carries B19013_001E (median household income), B25003_002E (owner-occupied units), B25003_003E (renter-occupied units), the state and county FIPS, and the tract code. Filter for the South Dallas tracts adjacent to Fair Park (48113008500 and 48113008700) to reproduce the income-gradient finding.",
    files: [
      { name: "dallas-tract-acs-2023.csv", bytes: 45819, description: "645 Dallas County census tracts with 2023 ACS median household income, owner / renter occupancy, and FIPS codes.", available: true, provenance: "U.S. Census Bureau · ACS 5-year 2023, fetched live from the Census API" },
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
