/* ------------------------------------------------------------------ */
/*  /research/data                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Public catalog of replication datasets for every published paper. */
/*  Visual treatment matches /education (full-width hero with the     */
/*  redlining banner, centered display title, intro paragraph, then   */
/*  a structured grid of dataset cards). Each card lists contents,   */
/*  files, license, source provenance, a one-click email request, and */
/*  a back link to the paper.                                          */
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
    "Replication datasets, analysis code, and supplementary tables for every Rooted Forward research paper. Distributed by email request under per-paper license terms.",
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
/* ------------------------------------------------------------------ */

interface DatasetMeta {
  contents: string;
  files: string[];
  license: string;
  source: string;
  notes?: string;
  size?: string;
}

const DATASETS: Record<string, DatasetMeta> = {
  "geography-of-disinvestment-chicago-west-side": {
    contents:
      "HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, and North Lawndale, paired with six quantitative outcome indicators and the Cook County Assessor's 2024 residential-vacancy panel at the tract level.",
    files: [
      "holc-west-side-tract-crosswalk.geojson",
      "holc-west-side-outcomes.csv",
      "holc-west-side-analysis.R",
    ],
    license:
      "Code under MIT. Derived data under CC BY 4.0. 1938 zone polygons redistributed under the Mapping Inequality CC BY-NC-SA 4.0 (Nelson et al. 2016).",
    source:
      "Mapping Inequality (Nelson et al. 2016), Cook County Assessor 2024 administrative file, US Census ACS 2023 5-year estimates.",
    size: "~12 MB compressed",
  },
  "obama-center-impact-zone-rent-pressure": {
    contents:
      "Cleaned 9,612-listing panel from Zillow ZORI, Craigslist scrapes, and the Chicago Rental Registry covering January 2020 through December 2025. Includes the eleven-tract half-mile-ring crosswalk and replication code for the difference-in-differences specification and the synthetic-control robustness check.",
    files: [
      "opc-rent-panel-2020-2025.csv",
      "opc-impact-zone-tracts.geojson",
      "opc-did-analysis.R",
      "opc-synthetic-control.R",
    ],
    license: "Data under CC BY 4.0. Code under MIT.",
    source:
      "Zillow Research, Craigslist scrapes, Chicago Rental Registry. Listings de-identified beyond header fields.",
    size: "~28 MB compressed",
    notes:
      "Zillow ZORI values redistributed under Zillow Research's public terms.",
  },
  "pilsen-industrial-corridor-rezoning-review": {
    contents:
      "Coded 351-comment public record for Application ZC-2025-0074, hearing transcript excerpts, and the coalition steering-committee log of canvassing and phone-banking activity.",
    files: [
      "pilsen-zc-2025-0074-comments.csv",
      "pilsen-coding-schema.md",
      "pilsen-hearing-timeline.csv",
    ],
    license: "CC BY 4.0.",
    source:
      "City of Chicago Office of the Clerk legislative-information system. Comment records are public under the Illinois Freedom of Information Act.",
    size: "~3 MB",
  },
  "cpd-traffic-stop-data-2024": {
    contents:
      "Cleaned 2024 stop-level panel of 287,412 records, district-level demographic crosswalk, hourly volume aggregates, wild-cluster-bootstrap implementation, and outcome-test and veil-of-darkness replication code.",
    files: [
      "cpd-stops-2024.csv",
      "cpd-district-crosswalk.csv",
      "cpd-outcome-test.R",
      "cpd-vod-check.R",
    ],
    license: "Data under CC BY 4.0. Code under MIT.",
    source:
      "Chicago Police Department, 2024 Traffic Stop Data Transparency Act release, 2025 quarterly tranches.",
    size: "~64 MB compressed",
    notes:
      "Records redistributed consistent with the City of Chicago's public-records terms. Officer badge numbers were withheld at source.",
  },
  "1938-holc-chicago-map-annotated": {
    contents:
      "Annotated edition of the 1938 HOLC Chicago Residential Security Map with all 239 graded zones, 82 Area Descriptions, GeoJSON polygons, a 2020-tract crosswalk, and six quantitative indicator files.",
    files: [
      "holc-chicago-1938-zones.geojson",
      "holc-chicago-1938-area-descriptions.csv",
      "holc-chicago-2020-tract-crosswalk.csv",
      "holc-chicago-indicators.parquet",
      "holc-chicago-map-tiles.zip",
    ],
    license:
      "CC BY-NC-SA 4.0 to match Mapping Inequality source licensing (Nelson et al. 2016). Replication code under MIT.",
    source:
      "Mapping Inequality (Nelson et al. 2016), National Archives Record Group 195 (HOLC), US Census 2020 TIGER/Line shapefiles.",
    size: "~120 MB compressed",
  },
  "school-closures-2013-and-after": {
    contents:
      "CPS post-closure student-tracking panel de-identified at the tract level, the CPS Facilities Master Plan annual updates 2013 through 2024, the Cook County Assessor block-level vacancy panel, and Chicago Public Library branch circulation records 2013 through 2024.",
    files: [
      "cps-2013-closures-tracking.csv",
      "cps-facilities-master-plan-2013-2024.csv",
      "cps-block-vacancy-panel.csv",
      "cpl-circulation-2013-2024.csv",
    ],
    license:
      "Code and derived tables under MIT. The CPS tracking file is subject to FOIA 2024-04311 redaction terms.",
    source:
      "Chicago Public Schools (FOIA 2024-04311), CPS Facilities Master Plan, Cook County Assessor, Chicago Public Library.",
    size: "~22 MB compressed",
  },
  "cha-plan-for-transformation-retrospective": {
    contents:
      "De-identified cleaned datasets covering the 17,000-family CHA resident-tracking panel (1999 through 2024), CHA MTW annual reports aggregated to tract, HUD HCV records for Chicago-area voucher holders, and replication code for the unit-count reconciliation.",
    files: [
      "cha-resident-tracking-1999-2024.csv",
      "cha-mtw-tract-aggregates.csv",
      "hud-hcv-chicago-area.csv",
      "cha-unit-count-reconciliation.R",
    ],
    license:
      "Code under MIT. CHA tracking data subject to FOIA 2019-00924, 2022-00718, and 2025-01108 terms.",
    source:
      "Chicago Housing Authority resident-tracking records (Illinois FOIA), CHA Moving to Work Annual Reports 2000 through 2024, HUD HCV administrative file.",
    size: "~38 MB compressed",
  },
  "austin-cba-playbook": {
    contents:
      "Coded eight-case Chicago CBA outcome table, the five-feature structural-coding schema, the Spearman-correlation implementation, and the Austin site evaluation framework.",
    files: [
      "chicago-cba-eight-case-coding.csv",
      "cba-structural-features.md",
      "austin-site-evaluation.md",
    ],
    license: "CC BY 4.0.",
    source:
      "Chicago Lawyers' Committee for Civil Rights Under Law CBA Repository, Coalition for a Community Benefits Agreement document archive at UIC Great Cities Institute, Chicago City Council legislative record.",
    size: "~1 MB",
  },
  "bronzeville-tif-expenditure-analysis": {
    contents:
      "Reconciled twenty-three-year Bronzeville TIF revenue and expenditure accounting (2002 through 2025), drawn from Cook County Clerk TIF reports, Chicago Department of Finance Annual Financial Analysis, and DPD project-level expenditure files.",
    files: [
      "bronzeville-tif-revenue-2002-2025.csv",
      "bronzeville-tif-expenditures-2002-2025.csv",
      "bronzeville-tif-project-list.csv",
      "bronzeville-tif-comparison-districts.csv",
    ],
    license:
      "Code under MIT. Derived data under CC BY 4.0. Source records are public under IL TIF Act disclosure requirements.",
    source:
      "Cook County Clerk TIF Annual Reports 2002 through 2025, Chicago Department of Finance Annual Financial Analysis, Chicago DPD project files.",
    size: "~6 MB",
  },
  "cook-county-property-tax-appeal-disparity": {
    contents:
      "Ten-year Cook County appeal record (2015 through 2024), cleaned and matched to 2020 census tracts; the tract-level demographic and income panel from the 2023 ACS five-year estimates; and the specialized-firm concentration analysis.",
    files: [
      "cook-appeals-2015-2024.csv",
      "cook-appeals-tract-panel.csv",
      "cook-appeals-firm-concentration.csv",
      "cook-appeals-analysis.R",
    ],
    license: "Code under MIT. Derived data under CC BY 4.0.",
    source:
      "Cook County Assessor administrative records and Cook County Board of Review appeal records, released under the Illinois Freedom of Information Act.",
    size: "~95 MB compressed",
  },
  "cross-bronx-expressway-sixty-years-later": {
    contents:
      "Digitized parcel-level acquisition records from the Triborough Bridge and Tunnel Authority's 1948 through 1955 Cross-Bronx construction, an NHGIS-harmonized 1960 through 1980 decennial census panel, and 2023 PM2.5, noise, and pediatric-asthma-hospitalization data at the tract level.",
    files: [
      "cross-bronx-acquisitions-1948-1955.csv",
      "cross-bronx-census-1960-1980.csv",
      "cross-bronx-environmental-2023.csv",
      "cross-bronx-asthma-2023.csv",
      "cross-bronx-quarter-mile-buffer.geojson",
    ],
    license:
      "Code under MIT. Derived data under CC BY 4.0. Source acquisition files are public at the NYC Municipal Archives (RG 219).",
    source:
      "NYC Municipal Archives Record Group 219 (Triborough Bridge and Tunnel Authority), IPUMS NHGIS (Manson et al. 2024), NY State DOH Environmental Public Health Tracking System.",
    size: "~42 MB compressed",
  },
  "fillmore-forty-years-after-redevelopment": {
    contents:
      "Coded archival-record abstracts from the SFPL History Center's SFRA Records (1948 through 2012), OCII Certificates of Preference annual reports aggregated into a single dataset, and pointers to the published Pepin and Watts (2006) oral-history corpus referenced in the brief.",
    files: [
      "sfra-archival-abstracts.csv",
      "ocii-cop-2008-2024.csv",
    ],
    license: "CC BY-NC 4.0.",
    source:
      "San Francisco Public Library History Center (SFRA Records 1948 through 2012), San Francisco Mayor's Office of Housing and Community Development (Certificate of Preference Annual Reports 2008 through 2024).",
    size: "~4 MB",
  },
  "fair-park-and-the-neighborhoods-it-displaced": {
    contents:
      "Compiled parcel-level records of the 1935 through 1936 Centennial expansion and the 1966 through 1968 parking-lot expansion, the 2023 ACS tract panel for the South Dallas community area, and Fair Park First 2020 through 2024 implementation data.",
    files: [
      "fair-park-1936-acquisitions.csv",
      "fair-park-1966-1968-acquisitions.csv",
      "fair-park-acs-2023-panel.csv",
      "fair-park-first-2020-2024.csv",
    ],
    license: "CC BY 4.0.",
    source:
      "Dallas Historical Society (1930s condemnation records), Texas General Land Office (1966 through 1968 acquisition files), US Census ACS 2023, Fair Park First annual reports.",
    size: "~2 MB",
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ResearchDataPage() {
  const entries = await fetchPublishedEntries();
  const datasetCount = entries.filter((e) => DATASETS[e.slug]).length;

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
              produced its findings. We distribute replication archives by
              email request rather than direct download so that we can
              record who is using each dataset and notify users about
              corrections, dataset versions, or known issues. Requests
              normally clear within five business days.
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
                  R / Stata
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Analysis Code
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
                  5 days
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Typical Turnaround
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick request */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-sm border border-border bg-cream-dark/30 p-6 md:p-8">
              <h2 className="font-display text-2xl text-forest">
                Request a Dataset
              </h2>
              <p className="mt-3 max-w-[60ch] font-body text-base leading-relaxed text-ink/75">
                Email{" "}
                <a
                  href="mailto:research@rooted-forward.org?subject=Research%20data%20request&body=Please%20include%3A%0A1.%20Paper%20slug%20%28e.g.%20cook-county-property-tax-appeal-disparity%29%0A2.%20Your%20affiliation%20if%20any%0A3.%20A%20one-sentence%20description%20of%20your%20planned%20use%0A%0A"
                  className="font-medium text-forest underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  research@rooted-forward.org
                </a>{" "}
                with the paper slug, your affiliation if you have one, and
                a one-sentence description of your planned use. The first
                reply confirms the request and lists what is shipping; the
                follow-up email contains the archive download link, valid
                for thirty days.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="mailto:research@rooted-forward.org?subject=Research%20data%20request&body=Please%20include%3A%0A1.%20Paper%20slug%0A2.%20Your%20affiliation%20if%20any%0A3.%20A%20one-sentence%20description%20of%20your%20planned%20use%0A%0A"
                  className="inline-flex items-center rounded-sm bg-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-dark"
                >
                  Open Email Draft
                </a>
                <span className="font-body text-sm text-warm-gray">
                  PGP key on request
                </span>
              </div>
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
                One archive per published paper, with cleaned input files,
                analysis code, and supplementary tables. Click a card to
                jump to the contents, files, license, and a pre-filled
                request link.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
              {entries.map((entry) => {
                const meta = DATASETS[entry.slug];
                const subject = encodeURIComponent(
                  `Data request: ${entry.slug}`
                );
                const body = encodeURIComponent(
                  `Paper: ${entry.title}\nSlug: ${entry.slug}\nAffiliation:\nPlanned use:\n`
                );
                return (
                  <li
                    key={entry.id}
                    id={entry.slug}
                    className="scroll-mt-24 bg-cream p-6 md:p-8"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rust">
                        {entry.format
                          ? entry.format.replace(/_/g, " ")
                          : "Paper"}
                      </p>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-forest md:text-[28px]">
                        <Link
                          href={`/research/${entry.slug}`}
                          className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-forest"
                        >
                          {entry.title}
                        </Link>
                      </h3>
                      <p className="mt-1 font-mono text-[11.5px] text-warm-gray">
                        {entry.slug}
                      </p>
                    </div>

                    {meta ? (
                      <div className="mt-5 flex flex-col gap-4">
                        <div>
                          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                            Contents
                          </p>
                          <p className="mt-1.5 font-body text-[14.5px] leading-[1.65] text-ink/85">
                            {meta.contents}
                          </p>
                        </div>

                        {meta.files.length > 0 && (
                          <div>
                            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                              Files{meta.size ? ` · ${meta.size}` : ""}
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                              {meta.files.map((f) => (
                                <li
                                  key={f}
                                  className="font-mono text-[12.5px] text-ink/80"
                                >
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                        </div>

                        {meta.notes && (
                          <p className="font-body text-[13px] italic leading-relaxed text-warm-gray">
                            {meta.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-5 font-body text-[14.5px] leading-relaxed text-ink/75">
                        Dataset summary forthcoming. Email{" "}
                        <a
                          href={`mailto:research@rooted-forward.org?subject=${subject}&body=${body}`}
                          className="text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest"
                        >
                          research@rooted-forward.org
                        </a>{" "}
                        for the current state of the replication archive.
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4">
                      <a
                        href={`mailto:research@rooted-forward.org?subject=${subject}&body=${body}`}
                        className="font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                      >
                        Request →
                      </a>
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
                Every dataset is distributed under a Creative Commons or MIT
                license, listed on each card. We ask that derivative work
                cite the originating paper and, where relevant, the upstream
                source the underlying records came from (Cook County
                Assessor, NYC Municipal Archives, Mapping Inequality, and so
                on).
              </p>
              <p>
                FOIA-released records carry the redaction terms of the
                original release. Where the release agreement places limits
                on redistribution, those limits travel with the
                derivative dataset and are noted on the relevant card.
              </p>
              <p>
                Errata and dataset versions are tracked. If we discover an
                error after a download has gone out, we email everyone who
                has previously requested the affected file. Researchers who
                want to be on the errata list without requesting a fresh
                copy can email and ask to be added.
              </p>
              <p>
                Larger downloads (above roughly 100 MB compressed) ship via
                a signed S3 URL valid for thirty days. Smaller archives
                ship as direct attachments.
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
              connect researchers working on related questions. If you are
              building on a Rooted Forward replication archive, send us a
              line.
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
