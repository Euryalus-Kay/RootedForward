/* ------------------------------------------------------------------ */
/*  /research/data — index                                             */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The replication archive catalog. One ledger row per published     */
/*  paper: title, one-line summary, and a monospace file listing      */
/*  with sizes and formats, linking to /research/data/[slug] where    */
/*  the live spreadsheet viewer, license, source list, and download   */
/*  flows live.                                                        */
/*                                                                     */
/*  All metadata is canonical in src/lib/research-datasets.ts.        */
/*  See docs/RESEARCH-CONTRIBUTING.md for the add-a-paper workflow.   */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import {
  RESEARCH_DATASETS,
  formatBytes,
  totalArchiveSize,
} from "@/lib/research-datasets";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  formatLabel,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Research Data | Rooted Forward",
  description:
    "Replication datasets, analysis code, and supplementary tables for every Rooted Forward research paper. Each entry links to its real public upstream source.",
};

export const revalidate = 600;

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

/** Unique uppercase file extensions among available files, e.g. "CSV · PY". */
function fileFormats(slugMeta: (typeof RESEARCH_DATASETS)[string]): string {
  const exts = new Set(
    slugMeta.files
      .filter((f) => f.available)
      .map((f) => f.name.split(".").pop()?.toUpperCase() ?? "FILE")
  );
  return [...exts].join(" · ");
}

export default async function ResearchDataPage() {
  const entries = await fetchPublishedEntries();

  // Only papers that actually ship a replication archive appear in
  // the catalog, so every row links to a live detail page.
  const catalog = entries.filter((e) => RESEARCH_DATASETS[e.slug]);
  const datasetCount = catalog.length;
  const totalFiles = Object.values(RESEARCH_DATASETS).reduce(
    (sum, d) => sum + d.files.filter((f) => f.available).length,
    0
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        <PageBanner
          eyebrow="Research / Data"
          title="Data & Replication"
          dek="Every paper rests on real, public, primary data. The cleaned files behind each analysis are hosted here, free to read as live tables, alongside the script that produced the figures."
          meta={[
            `${datasetCount} datasets`,
            `${totalFiles} hosted files`,
            "Public sources only",
          ]}
        />

        {/* ==========================================================
            01 — The catalog
            ========================================================== */}
        <section className="relative bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionHeading
              index="01"
              eyebrow="The catalog"
              title="All datasets"
              lede="Open any entry to read the data as a live, sortable table and to see the files, column schema, license, and public source URLs. Signed-in readers can download any file."
            />

            <ul className="mt-12 flex flex-col gap-px border-y border-border bg-border">
              {catalog.map((entry, i) => {
                const meta = RESEARCH_DATASETS[entry.slug];
                const available = meta.files.filter((f) => f.available);
                return (
                  <li key={entry.id} className="bg-cream">
                    <Reveal y={16} delay={Math.min(i, 4) * 0.05}>
                      <Link
                        href={`/research/data/${entry.slug}`}
                        className="group grid grid-cols-1 gap-x-10 gap-y-6 px-1 py-8 transition-colors hover:bg-white/40 md:px-4 lg:grid-cols-12"
                      >
                        {/* Left: paper identity */}
                        <div className="lg:col-span-7">
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <span className="ledger text-rust">
                              {formatLabel(entry.format)}
                            </span>
                            <span className="ledger text-warm-gray">
                              {totalArchiveSize(meta)} on disk
                            </span>
                          </div>
                          <h3 className="mt-3 font-display text-2xl leading-tight text-forest transition-colors group-hover:text-rust md:text-[26px]">
                            {entry.title}
                          </h3>
                          <p className="mt-3 line-clamp-3 max-w-[58ch] font-body text-[14.5px] leading-relaxed text-ink/70">
                            {meta.summary}
                          </p>
                        </div>

                        {/* Right: mono file ledger */}
                        <div className="flex flex-col lg:col-span-5">
                          <p className="ledger text-warm-gray">
                            {available.length}{" "}
                            {available.length === 1 ? "file" : "files"}
                            {available.length > 0 && (
                              <span className="ml-3 text-warm-gray/70">
                                {fileFormats(meta)}
                              </span>
                            )}
                          </p>
                          <ul className="mt-3 flex flex-col divide-y divide-border/60 border-t border-border/60">
                            {available.map((file) => (
                              <li
                                key={file.name}
                                className="flex items-baseline justify-between gap-4 py-1.5"
                              >
                                <span className="truncate font-mono text-[11.5px] text-ink/70">
                                  {file.name}
                                </span>
                                <span className="shrink-0 font-mono text-[11px] text-warm-gray tabular-nums">
                                  {formatBytes(file.bytes)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <span className="mt-4 inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors group-hover:text-rust-dark">
                            View dataset
                            <span aria-hidden="true" className="arrow-nudge">
                              &rarr;
                            </span>
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ==========================================================
            Closer — downstream use
            ========================================================== */}
        <section className="grain relative overflow-hidden bg-forest py-20 md:py-28">
          <div
            className="grid-lines-light absolute inset-0"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
            <Reveal mask>
              <h2 className="font-display text-3xl text-cream md:text-5xl">
                Working on something we should know about?
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
                We track downstream uses of these datasets and try to
                connect researchers working on related questions. If you
                are building on a Rooted Forward replication archive, send
                us a line.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <Magnetic className="mt-10">
                <a
                  href="mailto:research@rooted-forward.org?subject=Working%20with%20Rooted%20Forward%20data"
                  className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Get in touch
                </a>
              </Magnetic>
            </Reveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
