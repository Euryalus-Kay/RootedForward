/* ------------------------------------------------------------------ */
/*  /research/data/[slug] — detail                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Full dataset detail page. Renders:                                 */
/*    - Title, status, summary                                         */
/*    - List of files in the eventual archive                          */
/*    - For each `available: true` CSV, the in-site spreadsheet       */
/*      viewer (DatasetSpreadsheet) so readers can inspect the real   */
/*      data live, sort, filter, and export                           */
/*    - Download buttons (audit-logged, sign-in required for non-     */
/*      preview reads) for each available file                        */
/*    - Real public upstream sources (always visible)                  */
/*    - License + provenance                                           */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageTransition from "@/components/layout/PageTransition";
import DatasetSpreadsheet from "@/components/research/DatasetSpreadsheet";
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
import { ExternalLink, Scale, Database, Download } from "lucide-react";

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

  const availableFiles = meta.files.filter((f) => f.available);
  const hasLiveData = availableFiles.length > 0;

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
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-start px-6 pt-12 md:pt-16">
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
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6">
            <span className="font-body text-[13px] text-warm-gray">
              {availableFiles.length}{" "}
              {availableFiles.length === 1 ? "file" : "files"} ·{" "}
              {totalArchiveSize(meta)} on disk
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

        {/* Available files — live spreadsheets */}
        {hasLiveData && (
          <section className="bg-cream pt-12">
            <div className="mx-auto max-w-6xl px-6">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Live Data
              </h2>
              <p className="mt-3 max-w-[64ch] font-body text-[14.5px] leading-relaxed text-ink/75">
                These files are hosted directly on Rooted Forward and
                load below as live spreadsheets. Sort by clicking a
                column header, filter rows with the search box, change
                page size, or click <em>Export CSV</em> to save your
                filtered view. Click <em>Download original</em> to grab
                the unfiltered file.
              </p>

              <ul className="mt-8 space-y-10">
                {availableFiles.map((file) => {
                  const isCsv = file.name.toLowerCase().endsWith(".csv");
                  const downloadUrl = `/api/research/data/file?slug=${encodeURIComponent(
                    slug
                  )}&file=${encodeURIComponent(file.name)}`;
                  const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
                  const upstreamUrl = meta.upstream_sources[0]?.url;
                  const upstreamLabel =
                    meta.upstream_sources[0]?.label ?? "Source";
                  return (
                    <li
                      key={file.name}
                      className="rounded-sm border border-border bg-cream p-5 md:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[13px] text-forest break-all">
                            {file.name}
                          </p>
                          <p className="mt-1 font-body text-[13.5px] leading-relaxed text-ink/75">
                            {file.description}
                          </p>
                          {file.provenance && (
                            <p className="mt-1.5 font-body text-[12px] text-warm-gray">
                              Source: {file.provenance}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11.5px] text-warm-gray">
                            {formatBytes(file.bytes)}
                          </span>
                          <a
                            href={downloadUrl}
                            title={`Save ${file.name} (${formatBytes(file.bytes)}) to your computer`}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-forest px-3 py-1.5 font-body text-[12.5px] font-semibold text-cream transition-colors hover:bg-forest-dark"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download {ext}
                          </a>
                          {upstreamUrl && (
                            <a
                              href={upstreamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Visit the public source: ${upstreamLabel}`}
                              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-cream px-3 py-1.5 font-body text-[12.5px] font-semibold text-ink transition-colors hover:bg-cream-dark"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View at source
                            </a>
                          )}
                        </div>
                      </div>

                      {isCsv ? (
                        <div className="mt-5">
                          <DatasetSpreadsheet
                            slug={slug}
                            fileName={file.name}
                          />
                        </div>
                      ) : (
                        <p className="mt-4 rounded-sm bg-cream-dark/30 p-4 font-body text-[13px] text-warm-gray">
                          This file is not a tabular CSV. Use the
                          download button above to save it locally.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* License + provenance */}
        <section className="bg-cream pt-14">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 md:grid-cols-2">
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
                Public sources
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
                    {s.note && (
                      <span className="text-warm-gray"> · {s.note}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Schema preview when present */}
        {meta.preview.columns.length > 0 && (
          <section className="bg-cream pt-14">
            <div className="mx-auto max-w-5xl px-6">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Documented Schema
              </h2>
              <p className="mt-3 max-w-[64ch] font-body text-[14.5px] leading-relaxed text-ink/75">
                What the cleaned archive will contain when complete.
                Column names and types may evolve until the archive
                ships.
              </p>
              <div className="mt-4 overflow-x-auto rounded-sm border border-border bg-cream-dark/30 p-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-border pb-1.5 pr-4 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                        Column
                      </th>
                      <th className="border-b border-border pb-1.5 pr-4 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                        Type
                      </th>
                      <th className="border-b border-border pb-1.5 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.preview.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="border-b border-border/60 py-1.5 pr-4 align-top font-mono text-[12px] text-ink/85">
                          {c.name}
                        </td>
                        <td className="border-b border-border/60 py-1.5 pr-4 align-top font-mono text-[11.5px] uppercase text-warm-gray">
                          {c.type}
                        </td>
                        <td className="border-b border-border/60 py-1.5 align-top font-body text-[12.5px] text-ink/75">
                          {c.description ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Back link */}
        <section className="bg-cream pb-20 pt-12">
          <div className="mx-auto max-w-5xl px-6">
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
