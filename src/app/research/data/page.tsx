/* ------------------------------------------------------------------ */
/*  /research/data                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Public catalog of replication datasets for every published paper. */
/*                                                                     */
/*  Visual treatment matches /education (full-width hero, intro,     */
/*  stats strip, structured grid, forest CTA at the bottom).           */
/*                                                                     */
/*  Functional behavior:                                               */
/*    - On-page preview of column schema + sample rows per dataset    */
/*    - Auth-gated "Download archive" button (DatasetDownloadButton) */
/*    - Each download writes a row in dataset_downloads, surfaced in */
/*      the admin dashboard under /admin/research/data-usage          */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import DatasetDownloadButton from "@/components/research/DatasetDownloadButton";
import DatasetPreview, {
  type DatasetPreviewData,
} from "@/components/research/DatasetPreview";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Research Data | Rooted Forward",
  description:
    "Replication datasets, analysis code, and supplementary tables for every Rooted Forward research paper. Sign in to download.",
};

export const revalidate = 600;

/* ------------------------------------------------------------------ */
/*  Data fetcher                                                       */
/* ------------------------------------------------------------------ */

async function fetchPublishedEntries(): Promise<ResearchEntry[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) return PLACEHOLDER_RESEARCH_ENTRIES;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_entries")
      .select("*")
      .eq("status", "published")
      .order("published_date", { ascending: false });
    if (error || !data || data.length === 0) return PLACEHOLDER_RESEARCH_ENTRIES;
    return data.map((row) => ({
      ...row,
      authors: row.authors ?? [],
      reviewers: row.reviewers ?? [],
      citations: normalizeCitations(row.citations),
      related_campaign_ids: row.related_campaign_ids ?? [],
      related_tour_slugs: row.related_tour_slugs ?? [],
    })) as ResearchEntry[];
  } catch {
    return PLACEHOLDER_RESEARCH_ENTRIES;
  }
}

/* ------------------------------------------------------------------ */
/*  Per-paper dataset metadata                                         */
/* ------------------------------------------------------------------ */

interface DatasetMeta {
  contents: string;
  files: { name: string; bytes: number; description: string }[];
  license: string;
  source: string;
  notes?: string;
  preview: DatasetPreviewData;
}

const DATASETS: Record<string, DatasetMeta> = {
  "geography-of-disinvestment-chicago-west-side": {
    contents:
      "HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, and North Lawndale, paired with six quantitative outcome indicators and the Cook County Assessor 2024 residential-vacancy panel at the tract level.",
    files: [
      { name: "holc-west-side-tract-crosswalk.geojson", bytes: 2300000, description: "Polygon geometry with HOLC grade and 2020 tract GEOIDs." },
      { name: "holc-west-side-outcomes.csv", bytes: 48000, description: "104 D-graded tracts plus 37 comparison tracts with 6 outcome columns." },
      { name: "holc-west-side-analysis.R", bytes: 12000, description: "Replication code for all tables and figures." },
    ],
    license:
      "Code MIT, derived data CC BY 4.0, 1938 zone polygons CC BY-NC-SA 4.0 (Mapping Inequality, Nelson et al. 2016).",
    source:
      "Mapping Inequality (Nelson et al. 2016), Cook County Assessor 2024, US Census ACS 2023 5-year.",
    preview: {
      columns: [
        { name: "geoid_2020", type: "text", description: "2020 census tract GEOID" },
        { name: "holc_grade", type: "text", description: "A, B, C, or D" },
        { name: "vacancy_rate_2024", type: "numeric", description: "Cook County Assessor residential-vacancy rate, percent" },
        { name: "closed_school_2013", type: "boolean", description: "True if a tract contained a school closed in the 2013 wave" },
        { name: "food_access_low", type: "boolean", description: "USDA low-income low-access designation, 2024" },
      ],
      sample_rows: [
        { geoid_2020: "17031250100", holc_grade: "D", vacancy_rate_2024: 8.4, closed_school_2013: true, food_access_low: true },
        { geoid_2020: "17031070200", holc_grade: "A", vacancy_rate_2024: 1.9, closed_school_2013: false, food_access_low: false },
      ],
    },
  },
  "obama-center-impact-zone-rent-pressure": {
    contents:
      "Cleaned 9,612-listing panel from Zillow ZORI, Craigslist scrapes, and the Chicago Rental Registry covering January 2020 through December 2025.",
    files: [
      { name: "opc-rent-panel-2020-2025.csv", bytes: 18400000, description: "9,612 listings, monthly observations across six years." },
      { name: "opc-impact-zone-tracts.geojson", bytes: 740000, description: "Eleven-tract half-mile-ring boundary." },
      { name: "opc-did-analysis.R", bytes: 18000, description: "Difference-in-differences specification." },
      { name: "opc-synthetic-control.R", bytes: 14500, description: "Synthetic-control robustness check." },
    ],
    license: "Data CC BY 4.0, code MIT.",
    source: "Zillow Research, Craigslist scrapes, Chicago Rental Registry.",
    notes:
      "Zillow ZORI values redistributed under Zillow Research's public terms.",
    preview: {
      columns: [
        { name: "listing_id", type: "text", description: "Anonymized listing identifier" },
        { name: "month", type: "date", description: "First of month" },
        { name: "in_ring", type: "boolean", description: "True if within the half-mile impact zone" },
        { name: "bedrooms", type: "int" },
        { name: "asking_rent_usd", type: "numeric", description: "Posted asking rent, US dollars" },
      ],
      sample_rows: [
        { listing_id: "L8842", month: "2020-01-01", in_ring: true, bedrooms: 2, asking_rent_usd: 1075 },
        { listing_id: "L8842", month: "2025-12-01", in_ring: true, bedrooms: 2, asking_rent_usd: 1516 },
      ],
    },
  },
  "pilsen-industrial-corridor-rezoning-review": {
    contents:
      "Coded 351-comment public record for Application ZC-2025-0074, hearing transcript excerpts, and the coalition steering-committee log.",
    files: [
      { name: "pilsen-zc-2025-0074-comments.csv", bytes: 410000, description: "351 written comments coded along seven dimensions." },
      { name: "pilsen-coding-schema.md", bytes: 8000, description: "Coding rubric used by the analysts." },
      { name: "pilsen-hearing-timeline.csv", bytes: 3500, description: "Hearing-day events and witness order." },
    ],
    license: "CC BY 4.0.",
    source:
      "City of Chicago Office of the Clerk legislative-information system. Comment records public under Illinois FOIA.",
    preview: {
      columns: [
        { name: "comment_id", type: "int" },
        { name: "position", type: "text", description: "oppose | support" },
        { name: "affiliation_type", type: "text" },
        { name: "primary_concern", type: "text" },
      ],
      sample_rows: [
        { comment_id: 1, position: "oppose", affiliation_type: "resident", primary_concern: "displacement" },
        { comment_id: 2, position: "support", affiliation_type: "developer_associated", primary_concern: "economic_growth" },
      ],
    },
  },
  "cpd-traffic-stop-data-2024": {
    contents:
      "Cleaned 2024 stop-level panel of 287,412 records, district-level demographic crosswalk, hourly volume aggregates, wild-cluster-bootstrap implementation, and outcome-test and veil-of-darkness replication code.",
    files: [
      { name: "cpd-stops-2024.csv", bytes: 62500000, description: "287,412 stops with 15 fields each." },
      { name: "cpd-district-crosswalk.csv", bytes: 18000, description: "22 districts with 2023 ACS demographic composition." },
      { name: "cpd-outcome-test.R", bytes: 21000, description: "Knowles-Persico-Todd outcome-test implementation." },
      { name: "cpd-vod-check.R", bytes: 15500, description: "Veil-of-darkness robustness check." },
    ],
    license: "Data CC BY 4.0, code MIT.",
    source:
      "Chicago Police Department, 2024 Traffic Stop Data Transparency Act release.",
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
      sample_rows: [
        { stop_date: "2024-03-15", district: 7, stop_reason: "investigatory", driver_race: "black", search_conducted: true, contraband_recovered: false },
        { stop_date: "2024-07-22", district: 16, stop_reason: "moving_violation", driver_race: "white", search_conducted: false, contraband_recovered: null },
      ],
    },
  },
  "1938-holc-chicago-map-annotated": {
    contents:
      "Annotated edition of the 1938 HOLC Chicago Residential Security Map with all 239 graded zones, 82 Area Descriptions, GeoJSON polygons, a 2020-tract crosswalk, and six quantitative indicator files.",
    files: [
      { name: "holc-chicago-1938-zones.geojson", bytes: 4200000, description: "All 239 graded zones." },
      { name: "holc-chicago-1938-area-descriptions.csv", bytes: 480000, description: "All 82 Area Descriptions transcribed." },
      { name: "holc-chicago-2020-tract-crosswalk.csv", bytes: 62000, description: "Tract-to-zone match with overlap percentages." },
      { name: "holc-chicago-indicators.parquet", bytes: 1100000, description: "Six tract-level outcome indicators 2020 to 2024." },
      { name: "holc-chicago-map-tiles.zip", bytes: 104000000, description: "Vector tiles for self-hosting." },
    ],
    license: "CC BY-NC-SA 4.0 to match Mapping Inequality. Code MIT.",
    source:
      "Mapping Inequality (Nelson et al. 2016), National Archives RG 195, US Census 2020 TIGER/Line.",
    preview: {
      columns: [
        { name: "zone_id", type: "text" },
        { name: "grade", type: "text" },
        { name: "area_description_excerpt", type: "text" },
        { name: "matched_2020_tracts", type: "int" },
      ],
      sample_rows: [
        { zone_id: "D-12", grade: "D", area_description_excerpt: "Area is heavily deteriorated. Housing is substandard...", matched_2020_tracts: 4 },
      ],
    },
  },
  "school-closures-2013-and-after": {
    contents:
      "CPS post-closure student-tracking panel de-identified at the tract level, the 2013 to 2024 Facilities Master Plan, the Cook County Assessor block-level vacancy panel, and CPL branch circulation records.",
    files: [
      { name: "cps-2013-closures-tracking.csv", bytes: 2400000, description: "11,729 displaced students aggregated to tract." },
      { name: "cps-facilities-master-plan-2013-2024.csv", bytes: 620000, description: "Annual updates with disposition status per building." },
      { name: "cps-block-vacancy-panel.csv", bytes: 3100000, description: "Quarter-mile buffer vacancy 2013 to 2024." },
      { name: "cpl-circulation-2013-2024.csv", bytes: 1400000, description: "CPL branch monthly circulation totals." },
    ],
    license:
      "Code/tables MIT. CPS file subject to FOIA 2024-04311 redaction terms.",
    source:
      "Chicago Public Schools, CPS Facilities Master Plan, Cook County Assessor, Chicago Public Library.",
    preview: {
      columns: [
        { name: "closed_school", type: "text" },
        { name: "community_area", type: "text" },
        { name: "buffer_vacancy_2013", type: "numeric" },
        { name: "buffer_vacancy_2024", type: "numeric" },
      ],
      sample_rows: [
        { closed_school: "Henson Elementary", community_area: "North Lawndale", buffer_vacancy_2013: 11.2, buffer_vacancy_2024: 17.8 },
      ],
    },
  },
  "cha-plan-for-transformation-retrospective": {
    contents:
      "De-identified CHA resident-tracking panel covering 17,000 families from 1999 through 2024, MTW reports aggregated to tract, HUD HCV records for Chicago-area voucher holders.",
    files: [
      { name: "cha-resident-tracking-1999-2024.csv", bytes: 3800000, description: "17,000 displaced families with year-end housing status." },
      { name: "cha-mtw-tract-aggregates.csv", bytes: 920000, description: "Annual MTW unit counts by tract." },
      { name: "hud-hcv-chicago-area.csv", bytes: 2100000, description: "HCV households with current tract." },
      { name: "cha-unit-count-reconciliation.R", bytes: 17000, description: "Reproduces the 25,000-unit reconciliation table." },
    ],
    license:
      "Code MIT. CHA tracking subject to FOIA 2019-00924, 2022-00718, and 2025-01108 terms.",
    source: "Chicago Housing Authority (Illinois FOIA), HUD HCV administrative file.",
    preview: {
      columns: [
        { name: "family_id", type: "text" },
        { name: "baseline_property", type: "text" },
        { name: "current_status", type: "text" },
        { name: "current_tract", type: "text" },
      ],
      sample_rows: [
        { family_id: "F00432", baseline_property: "Robert Taylor", current_status: "voucher", current_tract: "17031250100" },
        { family_id: "F11892", baseline_property: "Cabrini", current_status: "return_mixed_income", current_tract: "17031081600" },
      ],
    },
  },
  "austin-cba-playbook": {
    contents:
      "Coded eight-case Chicago CBA outcome table, the five-feature structural-coding schema, the Spearman implementation, and the Austin site evaluation framework.",
    files: [
      { name: "chicago-cba-eight-case-coding.csv", bytes: 34000, description: "Eight cases coded across structural features." },
      { name: "cba-structural-features.md", bytes: 12000, description: "Coding rubric." },
      { name: "austin-site-evaluation.md", bytes: 18000, description: "Site-by-site evaluation." },
    ],
    license: "CC BY 4.0.",
    source:
      "Chicago Lawyers' Committee CBA Repository, UIC Great Cities Institute.",
    preview: {
      columns: [
        { name: "case_name", type: "text" },
        { name: "signed", type: "date" },
        { name: "three_party_structure", type: "boolean" },
        { name: "monitoring_independence", type: "text" },
        { name: "compliance_categories_full", type: "int" },
      ],
      sample_rows: [
        { case_name: "Hyde Park", signed: "2008-04-12", three_party_structure: true, monitoring_independence: "strong", compliance_categories_full: 7 },
      ],
    },
  },
  "bronzeville-tif-expenditure-analysis": {
    contents:
      "Reconciled twenty-three-year Bronzeville TIF revenue and expenditure accounting, 2002 through 2025.",
    files: [
      { name: "bronzeville-tif-revenue-2002-2025.csv", bytes: 24000, description: "Annual increment by overlapping taxing body." },
      { name: "bronzeville-tif-expenditures-2002-2025.csv", bytes: 42000, description: "Project-level expenditure with category." },
      { name: "bronzeville-tif-project-list.csv", bytes: 31000, description: "31 projects with within-district share." },
      { name: "bronzeville-tif-comparison-districts.csv", bytes: 18000, description: "Comparison rates for adjacent districts." },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    source:
      "Cook County Clerk TIF Annual Reports 2002 through 2025, Chicago DOF, Chicago DPD.",
    preview: {
      columns: [
        { name: "year", type: "int" },
        { name: "increment_usd", type: "numeric" },
        { name: "category", type: "text", description: "within-district | adjacent-transfer | regionally-significant | balance" },
        { name: "amount_usd", type: "numeric" },
      ],
      sample_rows: [
        { year: 2008, increment_usd: 18420000, category: "within-district", amount_usd: 7368000 },
        { year: 2008, increment_usd: 18420000, category: "regionally-significant", amount_usd: 5347800 },
      ],
    },
  },
  "cook-county-property-tax-appeal-disparity": {
    contents:
      "Ten-year Cook County appeal record (2015 through 2024), cleaned and matched to 2020 census tracts; the tract-level demographic and income panel from the 2023 ACS five-year estimates; the specialized-firm concentration analysis.",
    files: [
      { name: "cook-appeals-2015-2024.csv", bytes: 92000000, description: "1.74 million appeal filings with outcome and filer-identity field." },
      { name: "cook-appeals-tract-panel.csv", bytes: 1400000, description: "Tract-year panel of filing rate, success rate, reduction magnitude." },
      { name: "cook-appeals-firm-concentration.csv", bytes: 380000, description: "Specialized firm activity by tract." },
      { name: "cook-appeals-analysis.R", bytes: 24000, description: "Replication code." },
    ],
    license: "Code MIT, derived data CC BY 4.0.",
    source:
      "Cook County Assessor and Cook County Board of Review, Illinois FOIA.",
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "year", type: "int" },
        { name: "filings_per_1000", type: "numeric" },
        { name: "success_rate", type: "numeric" },
        { name: "median_reduction_pct", type: "numeric" },
      ],
      sample_rows: [
        { tract_geoid: "17031250100", year: 2024, filings_per_1000: 39.0, success_rate: 0.40, median_reduction_pct: 6.8 },
        { tract_geoid: "17031070200", year: 2024, filings_per_1000: 93.0, success_rate: 0.72, median_reduction_pct: 9.2 },
      ],
    },
  },
  "cross-bronx-expressway-sixty-years-later": {
    contents:
      "Digitized parcel-level acquisition records from the Triborough Bridge and Tunnel Authority's 1948 through 1955 Cross-Bronx construction, an NHGIS-harmonized 1960 through 1980 decennial census panel, and 2023 PM2.5, noise, and pediatric-asthma data at the tract level.",
    files: [
      { name: "cross-bronx-acquisitions-1948-1955.csv", bytes: 2900000, description: "Parcel-level acquisitions with payment and demographics." },
      { name: "cross-bronx-census-1960-1980.csv", bytes: 680000, description: "Quarter-mile buffer panel." },
      { name: "cross-bronx-environmental-2023.csv", bytes: 210000, description: "Tract-level PM2.5 and noise." },
      { name: "cross-bronx-asthma-2023.csv", bytes: 190000, description: "Pediatric asthma hospitalization rate." },
      { name: "cross-bronx-quarter-mile-buffer.geojson", bytes: 1200000, description: "Buffer polygon." },
    ],
    license: "Code MIT, derived data CC BY 4.0. Source files public at NYC Municipal Archives RG 219.",
    source: "NYC Municipal Archives RG 219, IPUMS NHGIS, NY State DOH.",
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "in_buffer", type: "boolean" },
        { name: "pm25_2023", type: "numeric" },
        { name: "asthma_rate_per_1000", type: "numeric" },
      ],
      sample_rows: [
        { tract_geoid: "36005002800", in_buffer: true, pm25_2023: 11.4, asthma_rate_per_1000: 18.2 },
        { tract_geoid: "36005014800", in_buffer: false, pm25_2023: 7.8, asthma_rate_per_1000: 6.8 },
      ],
    },
  },
  "fillmore-forty-years-after-redevelopment": {
    contents:
      "Coded archival-record abstracts from the SFPL History Center's SFRA Records (1948 through 2012) and OCII Certificates of Preference annual reports aggregated into a single dataset.",
    files: [
      { name: "sfra-archival-abstracts.csv", bytes: 280000, description: "Coded SFRA case-file abstracts." },
      { name: "ocii-cop-2008-2024.csv", bytes: 92000, description: "Annual COP placement counts." },
    ],
    license: "CC BY-NC 4.0.",
    source:
      "San Francisco Public Library History Center, San Francisco MOHCD.",
    preview: {
      columns: [
        { name: "year", type: "int" },
        { name: "placements", type: "int" },
        { name: "cumulative", type: "int" },
      ],
      sample_rows: [
        { year: 2008, placements: 42, cumulative: 42 },
        { year: 2024, placements: 118, cumulative: 2100 },
      ],
    },
  },
  "fair-park-and-the-neighborhoods-it-displaced": {
    contents:
      "Compiled parcel-level records of the 1935 through 1936 Centennial expansion and the 1966 through 1968 parking-lot expansion, the 2023 ACS South Dallas tract panel, and Fair Park First 2020 through 2024 implementation data.",
    files: [
      { name: "fair-park-1936-acquisitions.csv", bytes: 68000, description: "3,800 displaced residents on forty-two blocks." },
      { name: "fair-park-1966-1968-acquisitions.csv", bytes: 34000, description: "1,400 displaced residents on forty-two acres." },
      { name: "fair-park-acs-2023-panel.csv", bytes: 52000, description: "South Dallas tracts with ACS 2023 indicators." },
      { name: "fair-park-first-2020-2024.csv", bytes: 24000, description: "Annual Fair Park First implementation milestones." },
    ],
    license: "CC BY 4.0.",
    source:
      "Dallas Historical Society, Texas General Land Office, US Census ACS 2023, Fair Park First.",
    preview: {
      columns: [
        { name: "tract_geoid", type: "text" },
        { name: "median_household_income", type: "numeric" },
        { name: "homeownership_rate", type: "numeric" },
        { name: "adi_national_percentile", type: "numeric" },
      ],
      sample_rows: [
        { tract_geoid: "48113008700", median_household_income: 26400, homeownership_rate: 0.28, adi_national_percentile: 92 },
      ],
    },
  },
};

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

function totalArchiveSize(meta: DatasetMeta): string {
  const total = meta.files.reduce((sum, f) => sum + f.bytes, 0);
  return formatBytes(total);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ResearchDataPage() {
  const entries = await fetchPublishedEntries();
  const datasetCount = entries.filter((e) => DATASETS[e.slug]).length;
  const totalFiles = Object.values(DATASETS).reduce(
    (s, d) => s + d.files.length,
    0
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Banner */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex flex-col items-center justify-center pt-12 md:pt-16">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/80">
              Research
            </p>
            <h1 className="mt-3 font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              Data &amp; Replication
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="bg-cream pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl px-6">
            <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
              Every Rooted Forward paper publishes the data and code that
              produced its findings. Browse the column schemas and sample
              rows below, then sign in to download the full archive.
              Downloads are tracked so we can email you when an erratum
              ships or a dataset version changes.
            </p>
          </div>
        </section>

        {/* Stats strip */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-border md:grid-cols-4">
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  {datasetCount}
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Replication Archives
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  {totalFiles}
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Files Across Archives
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  CC BY 4.0
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Default License
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  Logged
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Every Download
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-sm border border-border bg-cream-dark/30 p-6 md:p-8">
              <h2 className="font-display text-2xl text-forest">
                How Downloads Work
              </h2>
              <ol className="mt-4 space-y-2 font-body text-base leading-relaxed text-ink/80">
                <li>
                  <span className="font-semibold text-forest">1.</span> Sign in
                  with a free Rooted Forward account. We use the email to send
                  errata and version notifications, nothing else.
                </li>
                <li>
                  <span className="font-semibold text-forest">2.</span> Click
                  <em> Download archive</em> on any dataset card below. The
                  ZIP saves directly to your machine.
                </li>
                <li>
                  <span className="font-semibold text-forest">3.</span> Each
                  download is recorded in our admin log with a timestamp.
                  You can see your own download history on your account
                  page; admins see the aggregate stats at{" "}
                  <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-[12px] text-forest">
                    /admin/research/data-usage
                  </code>
                  .
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Per-paper dataset grid */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 max-w-3xl">
              <h2 className="font-display text-3xl text-forest md:text-4xl">
                Datasets by Paper
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
                Each card lists the files in the archive, the column
                schema, two sample rows, the license, and the upstream
                source. Sign in once and the download button is unlocked
                for every dataset.
              </p>
            </div>

            <ul className="space-y-px bg-border">
              {entries.map((entry) => {
                const meta = DATASETS[entry.slug];
                if (!meta) {
                  return (
                    <li
                      key={entry.id}
                      id={entry.slug}
                      className="scroll-mt-24 bg-cream p-6 md:p-8"
                    >
                      <h3 className="font-display text-2xl text-forest">
                        {entry.title}
                      </h3>
                      <p className="mt-3 font-body text-[14.5px] leading-relaxed text-ink/75">
                        Dataset summary forthcoming. The archive is being
                        prepared.
                      </p>
                    </li>
                  );
                }
                return (
                  <li
                    key={entry.id}
                    id={entry.slug}
                    className="scroll-mt-24 bg-cream p-6 md:p-10"
                  >
                    <div className="flex flex-col gap-2">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rust">
                        {entry.format
                          ? entry.format.replace(/_/g, " ")
                          : "Paper"}
                      </p>
                      <h3 className="font-display text-2xl leading-tight text-forest md:text-[28px]">
                        <Link
                          href={`/research/${entry.slug}`}
                          className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-forest"
                        >
                          {entry.title}
                        </Link>
                      </h3>
                      <p className="font-mono text-[11.5px] text-warm-gray">
                        {entry.slug} · {totalArchiveSize(meta)} ·{" "}
                        {meta.files.length}{" "}
                        {meta.files.length === 1 ? "file" : "files"}
                      </p>
                    </div>

                    <p className="mt-5 max-w-[80ch] font-body text-[15.5px] leading-[1.7] text-ink/85">
                      {meta.contents}
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
                      {/* Left column: files + license + source */}
                      <div className="flex flex-col gap-5">
                        <div>
                          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                            Files
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {meta.files.map((f) => (
                              <li
                                key={f.name}
                                className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5"
                              >
                                <div className="min-w-0">
                                  <p className="font-mono text-[12.5px] text-ink/85 break-all">
                                    {f.name}
                                  </p>
                                  <p className="mt-0.5 font-body text-[12.5px] text-warm-gray">
                                    {f.description}
                                  </p>
                                </div>
                                <span className="shrink-0 font-mono text-[11.5px] text-warm-gray">
                                  {formatBytes(f.bytes)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                            License
                          </p>
                          <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-ink/75">
                            {meta.license}
                          </p>
                        </div>

                        <div>
                          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                            Source
                          </p>
                          <p className="mt-1.5 font-body text-[13.5px] leading-relaxed text-ink/75">
                            {meta.source}
                          </p>
                        </div>

                        {meta.notes && (
                          <p className="font-body text-[13px] italic leading-relaxed text-warm-gray">
                            {meta.notes}
                          </p>
                        )}
                      </div>

                      {/* Right column: schema + sample rows */}
                      <DatasetPreview preview={meta.preview} />
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                      <DatasetDownloadButton
                        slug={entry.slug}
                        paperTitle={entry.title}
                      />
                      <Link
                        href={`/research/${entry.slug}`}
                        className="font-body text-sm font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:text-ink"
                      >
                        Read Paper →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Distribution policy */}
        <section className="bg-cream pb-20 md:pb-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-display text-2xl text-forest md:text-3xl">
              Distribution Policy
            </h2>
            <div className="mt-6 space-y-5 font-body text-[15.5px] leading-[1.75] text-ink/80">
              <p>
                Every archive is distributed under a Creative Commons or
                MIT license, listed on each card. Derivative work should
                cite the originating paper and, where relevant, the
                upstream source the underlying records came from.
              </p>
              <p>
                FOIA-released records carry the redaction terms of the
                original release. Where the release agreement places
                limits on redistribution, those limits travel with the
                derivative dataset and are noted on the relevant card.
              </p>
              <p>
                Errata and dataset versions are tracked. If we discover an
                error after a download has gone out, we email everyone
                whose download is on record for the affected file. That
                is why downloads require sign-in.
              </p>
              <p>
                Archives that exceed our self-hosted size limit (currently
                200 MB) ship via signed URL valid for thirty days. The
                rest stream directly through the download API.
              </p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="bg-forest py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl text-cream md:text-5xl">
              Working on something we should know about?
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              We track downstream uses of these datasets and try to
              connect researchers working on related questions. If you
              are building on a Rooted Forward replication archive, send
              us a line.
            </p>
            <a
              href="mailto:research@rooted-forward.org?subject=Working%20with%20Rooted%20Forward%20data"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Get in touch
            </a>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
