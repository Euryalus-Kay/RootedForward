/* ------------------------------------------------------------------ */
/*  /research/data — index                                             */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Clean catalog of replication datasets. One row per published      */
/*  paper: title, one-line summary, and a "View dataset" link to     */
/*  /research/data/[slug] where the full preview, files, license,    */
/*  source list, and download / upstream-link button live.            */
/*                                                                     */
/*  All metadata is canonical in src/lib/research-datasets.ts.        */
/*  See docs/RESEARCH-CONTRIBUTING.md for the add-a-paper workflow.   */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import { RESEARCH_DATASETS } from "@/lib/research-datasets";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";
import { ArrowRight } from "lucide-react";

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

export default async function ResearchDataPage() {
  const entries = await fetchPublishedEntries();
  const datasetCount = entries.filter((e) => RESEARCH_DATASETS[e.slug]).length;
  const totalFiles = Object.values(RESEARCH_DATASETS).reduce(
    (sum, d) => sum + d.files.filter((f) => f.available).length,
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
              Every Rooted Forward paper points at real, public, primary
              data. The cards below link to each paper&rsquo;s upstream
              public source so you can pull the raw record yourself.
              When we finish a cleaned replication archive, it appears on
              the same card as a signed-in download.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-border md:grid-cols-3">
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  {datasetCount}
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Papers with Data
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  {totalFiles}
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Hosted Files
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-4xl text-forest md:text-5xl">
                  Public
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-widest text-warm-gray">
                  Sources Only
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Index grid */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-10 max-w-3xl">
              <h2 className="font-display text-3xl text-forest md:text-4xl">
                All Datasets
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
                Click a card to see the column schema, files, license,
                and the public source URLs. Once an admin uploads a
                cleaned archive, signed-in users see a one-click
                download on the detail page.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
              {entries.map((entry) => {
                const meta = RESEARCH_DATASETS[entry.slug];
                const fileCount = meta?.files.filter((f) => f.available).length ?? 0;
                return (
                  <li key={entry.id} className="bg-cream">
                    <Link
                      href={`/research/data/${entry.slug}`}
                      className="group flex h-full flex-col p-7 transition-colors hover:bg-cream-dark md:p-8"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rust">
                          {entry.format
                            ? entry.format.replace(/_/g, " ")
                            : "Paper"}
                        </p>
                        <span className="font-mono text-[11px] text-warm-gray">
                          {fileCount} {fileCount === 1 ? "file" : "files"}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-2xl leading-tight text-forest md:text-[26px]">
                        {entry.title}
                      </h3>
                      <p className="mt-3 max-w-[48ch] flex-1 font-body text-[15px] leading-relaxed text-ink/75">
                        {meta?.summary ?? "Dataset summary forthcoming."}
                      </p>
                      <span className="mt-6 inline-flex items-center gap-1.5 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors group-hover:text-rust-dark">
                        View dataset <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
