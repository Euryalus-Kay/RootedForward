/* ------------------------------------------------------------------ */
/*  /research/data/[slug] — detail                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Full dataset detail page. Renders:                                 */
/*    - Title and summary                                              */
/*    - Status badge (Live or In preparation)                          */
/*    - Files list with byte sizes                                     */
/*    - Real public upstream source URLs (always shown)                */
/*    - Column schema and one sample row (if any)                      */
/*    - License + provenance                                           */
/*    - Download button when archive_status === "live", otherwise a   */
/*      list of upstream sources styled as primary call-to-action     */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTransition from "@/components/layout/PageTransition";
import DatasetDownloadButton from "@/components/research/DatasetDownloadButton";
import DatasetPreview from "@/components/research/DatasetPreview";
import {
  RESEARCH_DATASETS,
  formatBytes,
  totalArchiveSize,
} from "@/lib/research-datasets";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";
import { ExternalLink, FileCode2, Scale, Database } from "lucide-react";

export const revalidate = 600;

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(RESEARCH_DATASETS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const meta = RESEARCH_DATASETS[slug];
  if (!meta) return { title: "Dataset not found | Rooted Forward" };
  return {
    title: `${meta.summary} | Rooted Forward`,
    description: meta.contents,
  };
}

async function fetchEntry(slug: string): Promise<ResearchEntry | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("research_entries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!error && data) {
        return {
          ...data,
          authors: data.authors ?? [],
          reviewers: data.reviewers ?? [],
          citations: normalizeCitations(data.citations),
          related_campaign_ids: data.related_campaign_ids ?? [],
          related_tour_slugs: data.related_tour_slugs ?? [],
        } as ResearchEntry;
      }
    }
  } catch {
    /* fall through to placeholder */
  }
  return PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug) ?? null;
}

export default async function DatasetDetailPage({ params }: Params) {
  const { slug } = await params;
  const meta = RESEARCH_DATASETS[slug];
  if (!meta) notFound();

  const entry = await fetchEntry(slug);
  const paperTitle = entry?.title ?? slug;
  const isLive = meta.archive_status === "live";

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Banner */}
        <section className="relative pt-16 pb-12 md:pb-14">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-start px-6 pt-12 md:pt-16">
            <nav
              aria-label="Breadcrumb"
              className="font-body text-[12px] text-cream/80"
            >
              <Link
                href="/research/data"
                className="underline decoration-cream/40 underline-offset-2 transition-colors hover:decoration-cream"
              >
                Research data
              </Link>
              <span className="mx-2">/</span>
              <span className="text-cream/60">{slug}</span>
            </nav>
            <h1 className="mt-4 max-w-[36ch] font-display text-3xl text-white md:text-5xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              {paperTitle}
            </h1>
          </div>
        </section>

        {/* Status row */}
        <section className="bg-cream pt-10">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-6">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest ${
                isLive
                  ? "bg-forest/10 text-forest"
                  : "bg-warm-gray/15 text-warm-gray"
              }`}
            >
              {isLive ? "Live archive" : "In preparation"}
            </span>
            <span className="font-body text-[13px] text-warm-gray">
              {meta.files.length}{" "}
              {meta.files.length === 1 ? "file" : "files"} · estimated{" "}
              {totalArchiveSize(meta)}
            </span>
            {entry && (
              <Link
                href={`/research/${slug}`}
                className="ml-auto font-body text-[13px] font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
              >
                Read paper →
              </Link>
            )}
          </div>
        </section>

        {/* Summary */}
        <section className="bg-cream pt-6">
          <div className="mx-auto max-w-3xl px-6">
            <p className="max-w-[64ch] font-body text-lg leading-relaxed text-ink/85">
              {meta.summary}
            </p>
            <p className="mt-4 max-w-[64ch] font-body text-base leading-relaxed text-ink/75">
              {meta.contents}
            </p>
            {meta.notes && (
              <p className="mt-3 max-w-[64ch] font-body text-[14px] italic leading-relaxed text-warm-gray">
                {meta.notes}
              </p>
            )}
          </div>
        </section>

        {/* Primary action */}
        <section className="bg-cream pt-8">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-sm border border-border bg-cream-dark/30 p-6 md:p-7">
              {isLive ? (
                <>
                  <h2 className="font-display text-xl text-forest md:text-2xl">
                    Download the cleaned archive
                  </h2>
                  <p className="mt-2 max-w-[60ch] font-body text-[14.5px] leading-relaxed text-ink/75">
                    Sign in once with a Rooted Forward account. We email
                    you only if we discover an error in a file you
                    downloaded.
                  </p>
                  <div className="mt-5">
                    <DatasetDownloadButton
                      slug={slug}
                      paperTitle={paperTitle}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl text-forest md:text-2xl">
                    Get the raw data from the public source
                  </h2>
                  <p className="mt-2 max-w-[64ch] font-body text-[14.5px] leading-relaxed text-ink/75">
                    The cleaned Rooted Forward replication archive for
                    this paper is in preparation. Until it is released,
                    every record below traces to a public upstream
                    source. These are the same files we draw on, hosted
                    by their primary publishers.
                  </p>
                  <ul className="mt-5 space-y-3">
                    {meta.upstream_sources.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-sm border border-border bg-cream p-4 transition-colors hover:border-forest"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-body text-[15px] font-semibold text-forest group-hover:text-forest-dark">
                                {s.label}
                              </p>
                              {s.note && (
                                <p className="mt-1 font-body text-[13px] leading-relaxed text-ink/70">
                                  {s.note}
                                </p>
                              )}
                              <p className="mt-1.5 break-all font-mono text-[11.5px] text-warm-gray">
                                {s.url}
                              </p>
                            </div>
                            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-warm-gray transition-colors group-hover:text-forest" />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Files + License grid */}
        <section className="bg-cream pt-12">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                <FileCode2 className="h-3.5 w-3.5" />
                Files in the archive
              </p>
              <ul className="mt-3 space-y-2.5">
                {meta.files.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2"
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

            <div className="space-y-6">
              <div>
                <p className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                  <Scale className="h-3.5 w-3.5" />
                  License
                </p>
                <p className="mt-2 font-body text-[14.5px] leading-relaxed text-ink/85">
                  {meta.license}
                </p>
              </div>
              <div>
                <p className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                  <Database className="h-3.5 w-3.5" />
                  Provenance
                </p>
                <ul className="mt-2 space-y-1.5">
                  {meta.upstream_sources.map((s) => (
                    <li
                      key={s.url}
                      className="font-body text-[13.5px] leading-relaxed text-ink/75"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Schema preview */}
        <section className="bg-cream py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-2xl text-forest md:text-3xl">
              Column Schema
            </h2>
            <p className="mt-3 max-w-[64ch] font-body text-[14.5px] leading-relaxed text-ink/75">
              The columns and types you can expect once the archive is
              live. {meta.preview.sample_rows.length === 0
                ? "Sample rows are intentionally omitted; we publish only verified records, not synthetic placeholders."
                : "The single sample row below is from the underlying public record."}
            </p>
            <div className="mt-6">
              <DatasetPreview preview={meta.preview} />
            </div>
          </div>
        </section>

        {/* Back link */}
        <section className="bg-cream pb-20">
          <div className="mx-auto max-w-4xl px-6">
            <Link
              href="/research/data"
              className="font-body text-sm font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
            >
              ← Back to all datasets
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
