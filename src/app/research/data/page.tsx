/* ------------------------------------------------------------------ */
/*  /research/data                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  A public index of the replication datasets referenced in the      */
/*  Data Availability sections of each research entry. Datasets are   */
/*  distributed by email request under per-paper license terms; the   */
/*  page routes those requests to research@rooted-forward.org and      */
/*  makes the scope of each dataset explicit.                         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Research Data | Rooted Forward",
  description:
    "Replication datasets, code, and supplementary tables for each Rooted Forward research paper. Distributed by email request under per-paper license terms.",
};

export const revalidate = 3600;

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
/*  Per-paper dataset descriptions                                     */
/*                                                                     */
/*  Keyed by slug. Each entry states, in one line, what the dataset   */
/*  contains and under what license it is distributed. If a slug is   */
/*  missing from this map, the page falls back to a generic request   */
/*  line citing the paper's abstract.                                  */
/* ------------------------------------------------------------------ */

interface DatasetMeta {
  contents: string;
  files: string[];
  license: string;
  notes?: string;
}

const DATASETS: Record<string, DatasetMeta> = {
  "geography-of-disinvestment-chicago-west-side": {
    contents:
      "HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, North Lawndale; six quantitative outcome indicators; Cook County Assessor 2024 residential-vacancy records at the tract level.",
    files: [
      "holc-west-side-tract-crosswalk.geojson",
      "holc-west-side-outcomes.csv",
      "holc-west-side-analysis.R",
    ],
    license:
      "MIT license for code and derived data. 1938 zone polygons redistributed under Mapping Inequality CC BY-NC-SA 4.0 (Nelson et al. 2016).",
  },
  "obama-center-impact-zone-rent-pressure": {
    contents:
      "Cleaned 9,612-listing panel from Zillow, Craigslist, and the Chicago Rental Registry, January 2020 through December 2025; eleven-tract half-mile-ring crosswalk; replication code for the difference-in-differences specification and synthetic-control robustness check.",
    files: [
      "opc-rent-panel-2020-2025.csv",
      "opc-impact-zone-tracts.geojson",
      "opc-did-analysis.R",
      "opc-synthetic-control.R",
    ],
    license: "CC BY 4.0 for data; MIT for code.",
    notes:
      "Zillow ZORI values redistributed under Zillow Research's public terms; Craigslist listings de-identified beyond header fields.",
  },
  "pilsen-industrial-corridor-rezoning-review": {
    contents:
      "Coded 351-comment public record for Application ZC-2025-0074; hearing transcript excerpts; coalition steering-committee log of canvassing and phone-banking activity.",
    files: [
      "pilsen-zc-2025-0074-comments.csv",
      "pilsen-coding-schema.md",
      "pilsen-hearing-timeline.csv",
    ],
    license: "CC BY 4.0. Comment records are public under Illinois Freedom of Information Act.",
  },
  "cpd-traffic-stop-data-2024": {
    contents:
      "Cleaned 2024 stop-level panel (287,412 records); district-level demographic crosswalk; hourly volume aggregates; wild-cluster-bootstrap implementation; outcome-test and veil-of-darkness replication code.",
    files: [
      "cpd-stops-2024.csv",
      "cpd-district-crosswalk.csv",
      "cpd-outcome-test.R",
      "cpd-vod-check.R",
    ],
    license: "CC BY 4.0 for data; MIT for code.",
    notes:
      "Records redistributed consistent with the City of Chicago's public-records terms for the 2024 Traffic Stop Data Transparency Act release.",
  },
  "hyde-park-urban-renewal-oral-histories": {
    contents:
      "Full audio recordings and verbatim transcripts of the six published interviews are deposited with the Chicago History Museum Research Center (accession 2025-ORAL-HP-001 through 006). Edited transcripts appear in the published paper.",
    files: [],
    license: "CC BY-NC 4.0 for the edited transcripts. Full audio and verbatim transcripts under standard oral-history archival-access agreement.",
    notes:
      "Scholarly access requests: contact the Chicago History Museum Research Center. Community-use requests: contact research@rooted-forward.org.",
  },
  "1938-holc-chicago-map-annotated": {
    contents:
      "Annotated edition of the 1938 HOLC Chicago Residential Security Map: all 239 graded zones, 82 Area Descriptions, GeoJSON polygons, 2020-tract crosswalk, six quantitative indicator files.",
    files: [
      "holc-chicago-1938-zones.geojson",
      "holc-chicago-1938-area-descriptions.csv",
      "holc-chicago-2020-tract-crosswalk.csv",
      "holc-chicago-indicators.parquet",
      "holc-chicago-map-tiles.zip",
    ],
    license:
      "CC BY-NC-SA 4.0, consistent with Mapping Inequality source licensing (Nelson et al. 2016). Replication code under MIT.",
  },
  "school-closures-2013-and-after": {
    contents:
      "CPS post-closure student-tracking panel, de-identified at the tract level (from FOIA 2024-04311); CPS Facilities Master Plan annual updates 2013–2024; Cook County Assessor block-level vacancy panel; Chicago Public Library branch circulation records 2013–2024.",
    files: [
      "cps-2013-closures-tracking.csv",
      "cps-facilities-master-plan-2013-2024.csv",
      "cps-block-vacancy-panel.csv",
      "cpl-circulation-2013-2024.csv",
    ],
    license: "MIT license for code and derived tables. CPS tracking file subject to FOIA 2024-04311 redaction terms.",
  },
  "cha-plan-for-transformation-retrospective": {
    contents:
      "De-identified cleaned datasets for the 17,000-family CHA resident-tracking panel (1999–2024); CHA MTW annual reports aggregated to tract; HUD HCV records for Chicago-area voucher holders; replication code for the unit-count reconciliation.",
    files: [
      "cha-resident-tracking-1999-2024.csv",
      "cha-mtw-tract-aggregates.csv",
      "hud-hcv-chicago-area.csv",
      "cha-unit-count-reconciliation.R",
    ],
    license: "MIT for code. CHA tracking data subject to FOIA 2019-00924, 2022-00718, 2025-01108 terms.",
  },
  "austin-cba-playbook": {
    contents:
      "Coded eight-case Chicago CBA outcome table; five-feature structural-coding schema; Spearman-correlation implementation; Austin site evaluation framework.",
    files: [
      "chicago-cba-eight-case-coding.csv",
      "cba-structural-features.md",
      "austin-site-evaluation.md",
    ],
    license: "CC BY 4.0.",
  },
  "bronzeville-tif-expenditure-analysis": {
    contents:
      "Reconciled twenty-three-year Bronzeville TIF revenue and expenditure accounting (2002–2025), drawing on Cook County Clerk TIF reports, Chicago Department of Finance Annual Financial Analysis, and DPD project-level expenditure files.",
    files: [
      "bronzeville-tif-revenue-2002-2025.csv",
      "bronzeville-tif-expenditures-2002-2025.csv",
      "bronzeville-tif-project-list.csv",
      "bronzeville-tif-comparison-districts.csv",
    ],
    license: "MIT for code; CC BY 4.0 for derived data. Source records are public under IL TIF Act disclosure requirements.",
  },
  "west-side-grocery-access-oral-histories": {
    contents:
      "Edited transcripts of the ten published oral histories; interview consent documentation; coding schema; Cook County Assessor commercial-occupancy records for the four West Side community areas, 2005–2024.",
    files: [
      "west-side-grocery-transcripts-published.md",
      "west-side-closure-timeline.csv",
      "cook-commercial-occupancy-west-side-2005-2024.csv",
    ],
    license: "CC BY-NC 4.0 for transcripts. CC BY 4.0 for timeline and occupancy data.",
  },
  "cook-county-property-tax-appeal-disparity": {
    contents:
      "Ten-year Cook County appeal record (2015–2024), cleaned and matched to 2020 census tracts; tract-level demographic and income panel from 2023 ACS 5-year estimates; specialized-firm concentration analysis.",
    files: [
      "cook-appeals-2015-2024.csv",
      "cook-appeals-tract-panel.csv",
      "cook-appeals-firm-concentration.csv",
      "cook-appeals-analysis.R",
    ],
    license: "MIT for code; CC BY 4.0 for data. Original records from CCAO FOIA 2024-09217 and BoR FOIA 2024-09218.",
  },
  "cross-bronx-expressway-sixty-years-later": {
    contents:
      "Digitized parcel-level acquisition records from the Triborough Bridge and Tunnel Authority's 1948–1955 Cross-Bronx construction; NHGIS-harmonized 1960–1980 decennial census panel; 2023 PM2.5, noise, and pediatric-asthma-hospitalization data at the tract level.",
    files: [
      "cross-bronx-acquisitions-1948-1955.csv",
      "cross-bronx-census-1960-1980.csv",
      "cross-bronx-environmental-2023.csv",
      "cross-bronx-asthma-2023.csv",
      "cross-bronx-quarter-mile-buffer.geojson",
    ],
    license: "MIT for code; CC BY 4.0 for derived data. Source acquisition files are public at the NYC Municipal Archives (RG 219).",
  },
  "fillmore-forty-years-after-redevelopment": {
    contents:
      "Coded archival-record abstracts from the SFPL History Center's SFRA Records (1948–2012); OCII Certificates of Preference annual reports aggregated to single dataset; edited transcripts of ten oral histories conducted in 2024–2025.",
    files: [
      "sfra-archival-abstracts.csv",
      "ocii-cop-2008-2024.csv",
      "fillmore-oral-transcripts-published.md",
    ],
    license: "CC BY-NC 4.0.",
  },
  "fair-park-and-the-neighborhoods-it-displaced": {
    contents:
      "Compiled parcel-level records of the 1935–1936 Centennial expansion and the 1966–1968 parking-lot expansion; 2023 ACS tract panel for the South Dallas community area; Fair Park First 2020–2024 implementation data.",
    files: [
      "fair-park-1936-acquisitions.csv",
      "fair-park-1966-1968-acquisitions.csv",
      "fair-park-acs-2023-panel.csv",
      "fair-park-first-2020-2024.csv",
    ],
    license: "CC BY 4.0.",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ResearchDataPage() {
  const entries = await fetchPublishedEntries();

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <section className="border-b border-border bg-cream pb-10 pt-28 md:pt-32">
          <div className="mx-auto max-w-5xl px-6">
            <nav
              aria-label="Breadcrumb"
              className="font-body text-[12px] text-warm-gray"
            >
              <Link
                href="/research"
                className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-warm-gray"
              >
                Research
              </Link>
              <span className="mx-2">/</span>
              <span className="text-ink/60">Data</span>
            </nav>
            <h1 className="mt-6 max-w-[60ch] font-display text-[36px] leading-[1.1] text-forest md:text-[48px]">
              Research Data
            </h1>
            <p className="mt-6 max-w-[65ch] font-body text-[16px] leading-[1.7] text-ink/80">
              Every Rooted Forward paper published on this site is accompanied
              by a replication dataset, analysis code, and supplementary
              tables. We distribute these by email request rather than by
              direct download so that we can record who uses the data and send
              follow-up corrections if we find errors post-release.
            </p>
            <p className="mt-4 max-w-[65ch] font-body text-[16px] leading-[1.7] text-ink/80">
              Requests go to{" "}
              <a
                href="mailto:research@rooted-forward.org?subject=Research%20data%20request"
                className="font-medium text-forest underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest"
              >
                research@rooted-forward.org
              </a>
              . Please include the paper slug, your affiliation if you have
              one, and a one-sentence description of your planned use. We reply
              within five business days.
            </p>
          </div>
        </section>

        {/* Per-paper dataset list */}
        <section className="bg-cream pb-24 pt-12">
          <div className="mx-auto max-w-5xl px-6">
            <ul className="space-y-10">
              {entries.map((entry) => {
                const meta = DATASETS[entry.slug];
                return (
                  <li
                    key={entry.id}
                    id={entry.slug}
                    className="scroll-mt-24 border-t border-border pt-8"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                      <Link
                        href={`/research/${entry.slug}`}
                        className="font-display text-[22px] leading-snug text-forest underline decoration-transparent underline-offset-4 transition-colors hover:decoration-forest md:text-[24px]"
                      >
                        {entry.title}
                      </Link>
                      <span className="font-body text-[12px] text-warm-gray">
                        {entry.slug}
                      </span>
                    </div>

                    {meta ? (
                      <>
                        <p className="mt-4 font-body text-[15px] leading-[1.7] text-ink/80">
                          <strong className="font-medium text-ink">
                            Contents.
                          </strong>{" "}
                          {meta.contents}
                        </p>
                        {meta.files.length > 0 && (
                          <div className="mt-3">
                            <p className="font-body text-[13px] text-warm-gray">
                              Files on request:
                            </p>
                            <ul className="mt-1 space-y-0.5">
                              {meta.files.map((f) => (
                                <li
                                  key={f}
                                  className="font-mono text-[12.5px] text-ink/75"
                                >
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="mt-3 font-body text-[13.5px] text-warm-gray">
                          <strong className="font-medium text-ink/80">
                            License.
                          </strong>{" "}
                          {meta.license}
                        </p>
                        {meta.notes && (
                          <p className="mt-2 font-body text-[13px] italic text-warm-gray">
                            {meta.notes}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-4 font-body text-[15px] leading-[1.7] text-ink/80">
                        Dataset summary forthcoming. Email{" "}
                        <a
                          href={`mailto:research@rooted-forward.org?subject=Data%20request%3A%20${entry.slug}`}
                          className="text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest"
                        >
                          research@rooted-forward.org
                        </a>{" "}
                        for the current state of the replication archive.
                      </p>
                    )}

                    <div className="mt-4 flex gap-4">
                      <a
                        href={`mailto:research@rooted-forward.org?subject=Data%20request%3A%20${entry.slug}`}
                        className="font-body text-[13.5px] text-forest underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest"
                      >
                        Request this dataset →
                      </a>
                      <Link
                        href={`/research/${entry.slug}`}
                        className="font-body text-[13.5px] text-warm-gray underline decoration-warm-gray/40 underline-offset-2 transition-colors hover:decoration-warm-gray"
                      >
                        Read the paper
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
