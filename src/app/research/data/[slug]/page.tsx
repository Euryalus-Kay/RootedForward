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
import PageBanner from "@/components/layout/PageBanner";
import DatasetSpreadsheet from "@/components/research/DatasetSpreadsheet";
import { Reveal } from "@/components/motion/Reveal";
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
import { ExternalLink, Download, FileArchive } from "lucide-react";

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
        <PageBanner
          compact
          eyebrow="Research / Data Archive"
          title={paperTitle}
          meta={[
            `${availableFiles.length} ${
              availableFiles.length === 1 ? "file" : "files"
            }`,
            `${totalArchiveSize(meta)} on disk`,
          ]}
        />

        {/* Breadcrumb bar — archive context plus link to the paper */}
        <section className="border-b border-border bg-cream">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 lg:px-8">
            <nav aria-label="Breadcrumb" className="ledger min-w-0 text-warm-gray">
              <Link href="/research/data" className="link-draw text-rust">
                Research data
              </Link>
              <span className="mx-2 text-warm-gray/60">/</span>
              <span className="break-all">{slug}</span>
            </nav>
            {entry && (
              <Link
                href={`/research/${slug}`}
                className="group inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                Read the paper
                <span aria-hidden="true" className="arrow-nudge">
                  &rarr;
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Summary */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Reveal y={14}>
              <div className="max-w-3xl">
                <p className="font-body text-lg leading-relaxed text-ink/85">
                  {meta.summary}
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-ink/70">
                  {meta.contents}
                </p>
                {meta.notes && (
                  <p className="mt-3 font-body text-[14px] italic leading-relaxed text-warm-gray">
                    {meta.notes}
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Available files — live spreadsheets */}
        {hasLiveData && (
          <section className="bg-cream pt-14 md:pt-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-6 border-t border-border pt-10">
                <div className="max-w-3xl">
                  <p className="eyebrow text-warm-gray">Hosted files</p>
                  <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
                    Live Data
                  </h2>
                  <p className="mt-4 font-body text-[14.5px] leading-relaxed text-ink/70">
                    These files are hosted directly on Rooted Forward
                    and load below as live spreadsheets. Sort by
                    clicking a column header, filter rows with the
                    search box, change page size, or use{" "}
                    <em>Export current view</em> in any spreadsheet
                    toolbar to save your filtered view in CSV, TSV, or
                    JSON.
                  </p>
                </div>
                {availableFiles.length > 1 && (
                  <a
                    href={`/api/research/data/zip?slug=${encodeURIComponent(slug)}`}
                    title={`Download all ${availableFiles.length} files plus a README as a single ZIP`}
                    className="inline-flex items-center gap-2 rounded-sm bg-rust px-5 py-3 font-body text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                  >
                    <FileArchive className="h-4 w-4" />
                    Download all as ZIP
                  </a>
                )}
              </div>

              <ul className="mt-10 space-y-10">
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
                      className="border border-border bg-white/40 p-5 md:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="break-all font-mono text-[13px] text-forest">
                              {file.name}
                            </span>
                            <span className="ledger text-warm-gray">
                              {ext} · {formatBytes(file.bytes)}
                            </span>
                          </p>
                          <p className="mt-2 max-w-[68ch] font-body text-[13.5px] leading-relaxed text-ink/75">
                            {file.description}
                          </p>
                          {file.provenance && (
                            <p className="mt-1.5 max-w-[68ch] font-body text-[12px] text-warm-gray">
                              Source: {file.provenance}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                        <p className="mt-4 border border-border/60 bg-cream-dark/30 p-4 font-body text-[13px] text-warm-gray">
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
        <section className="bg-cream pt-14 md:pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2">
              <div className="bg-cream py-8 md:pr-10">
                <p className="eyebrow text-warm-gray">License</p>
                <p className="mt-3 max-w-[58ch] font-body text-[14.5px] leading-relaxed text-ink/85">
                  {meta.license}
                </p>
              </div>
              <div className="bg-cream py-8 md:pl-10">
                <p className="eyebrow text-warm-gray">Public sources</p>
                <ul className="mt-3 space-y-2">
                  {meta.upstream_sources.map((s) => (
                    <li
                      key={s.url}
                      className="font-body text-[13.5px] leading-relaxed text-ink/75"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest underline decoration-forest/40 underline-offset-4 hover:decoration-forest"
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
          </div>
        </section>

        {/* Schema preview when present */}
        {meta.preview.columns.length > 0 && (
          <section className="bg-cream pt-14 md:pt-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <p className="eyebrow text-warm-gray">Reference</p>
              <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
                Documented Schema
              </h2>
              <p className="mt-4 max-w-3xl font-body text-[14.5px] leading-relaxed text-ink/70">
                What the cleaned archive will contain when complete.
                Column names and types may evolve until the archive
                ships.
              </p>
              <div className="mt-6 overflow-x-auto border border-border bg-white/40 p-5">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="border-b border-border pb-2 pr-4 text-left">
                        <span className="ledger text-warm-gray">Column</span>
                      </th>
                      <th className="border-b border-border pb-2 pr-4 text-left">
                        <span className="ledger text-warm-gray">Type</span>
                      </th>
                      <th className="border-b border-border pb-2 text-left">
                        <span className="ledger text-warm-gray">
                          Description
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.preview.columns.map((c) => (
                      <tr key={c.name}>
                        <td className="border-b border-border/60 py-2 pr-4 align-top font-mono text-[12px] text-ink/85">
                          {c.name}
                        </td>
                        <td className="border-b border-border/60 py-2 pr-4 align-top font-mono text-[11.5px] uppercase text-warm-gray">
                          {c.type}
                        </td>
                        <td className="border-b border-border/60 py-2 align-top font-body text-[12.5px] text-ink/75">
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
        <section className="bg-cream pb-24 pt-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Link
              href="/research/data"
              className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
            >
              <span
                aria-hidden="true"
                className="inline-block transition-transform group-hover:-translate-x-1"
              >
                &larr;
              </span>
              Back to all datasets
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
