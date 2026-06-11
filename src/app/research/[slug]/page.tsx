/* ------------------------------------------------------------------ */
/*  /research/[slug]                                                   */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Detail page for a single Rooted Forward research entry. Renders  */
/*  like a published paper: title, author credits, long-form        */
/*  markdown body, sticky TOC on the right margin (desktop), and     */
/*  full citation apparatus at the bottom.                             */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ResearchArticleBody from "@/components/research/ResearchArticleBody";
import ReadingProgress from "@/components/research/ReadingProgress";
import RelatedContent from "@/components/research/RelatedContent";
import DownloadPDFButton from "@/components/research/DownloadPDFButton";
import { Reveal } from "@/components/motion/Reveal";
import type { ResearchEntry } from "@/lib/types/database";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  cityLabel,
  findRelatedEntries,
  formatLabel,
  normalizeCitations,
} from "@/lib/research-constants";
import { RESEARCH_DATASETS } from "@/lib/research-datasets";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Data fetchers                                                      */
/* ------------------------------------------------------------------ */

async function fetchEntry(slug: string): Promise<ResearchEntry | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) throw new Error("skip");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_entries")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) throw new Error("not-found-db");

    return {
      ...data,
      authors: data.authors ?? [],
      reviewers: data.reviewers ?? [],
      citations: normalizeCitations(data.citations),
      related_campaign_ids: data.related_campaign_ids ?? [],
      related_tour_slugs: data.related_tour_slugs ?? [],
    } as ResearchEntry;
  } catch {
    return (
      PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug) ?? null
    );
  }
}

async function fetchAllPublished(): Promise<ResearchEntry[]> {
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

    if (error || !data || data.length === 0)
      return PLACEHOLDER_RESEARCH_ENTRIES;

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

async function fetchCampaignRefs(campaignIds: string[]): Promise<
  { id: string; slug: string; title: string; category: string }[]
> {
  if (campaignIds.length === 0) return [];
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, slug, title, category")
      .in("id", campaignIds);

    if (error || !data) return [];
    return data as {
      id: string;
      slug: string;
      title: string;
      category: string;
    }[];
  } catch {
    return [];
  }
}

async function fetchTourRefs(
  tourSlugs: string[]
): Promise<{ slug: string; city: string; title: string }[]> {
  if (tourSlugs.length === 0) return [];
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) return [];

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tour_stops")
      .select("slug, city, title")
      .in("slug", tourSlugs);

    if (error || !data) return [];
    return data as { slug: string; city: string; title: string }[];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await fetchEntry(slug);
  if (!entry) {
    return {
      title: "Research | Rooted Forward",
    };
  }
  return {
    title: `${entry.title} | Research | Rooted Forward`,
    description: entry.abstract,
    openGraph: {
      title: entry.title,
      description: entry.abstract,
      type: "article",
      publishedTime: entry.published_date,
      authors: entry.authors,
    },
  };
}

export async function generateStaticParams() {
  const entries = await fetchAllPublished();
  return entries.map((e) => ({ slug: e.slug }));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPublicationDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ResearchEntryPage({ params }: PageProps) {
  const { slug } = await params;

  const entry = await fetchEntry(slug);
  if (!entry) notFound();

  const [allPublished, campaignRefs, tourRefs] = await Promise.all([
    fetchAllPublished(),
    fetchCampaignRefs(entry.related_campaign_ids),
    fetchTourRefs(entry.related_tour_slugs),
  ]);

  const relatedEntries = findRelatedEntries(entry, allPublished, 3);

  const hasReviewers = entry.reviewers && entry.reviewers.length > 0;
  const hasDataset = Boolean(RESEARCH_DATASETS[entry.slug]);

  return (
    <PageTransition>
      <ReadingProgress />
      {/* ============================================================
          HEADER — compact archival masthead on cream
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-border bg-cream pb-10 pt-28 md:pb-12 md:pt-36">
        <div className="grid-lines absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          {/* Breadcrumb */}
          <Reveal y={10}>
            <nav aria-label="Breadcrumb" className="ledger text-warm-gray">
              <Link
                href="/research"
                className="link-draw text-rust"
              >
                Research
              </Link>
              <span className="mx-2 text-warm-gray/60">/</span>
              <span>{formatLabel(entry.format)}</span>
            </nav>
          </Reveal>

          {/* Title */}
          <Reveal mask>
            <h1 className="mt-6 max-w-[26ch] font-display text-[38px] leading-[1.06] text-forest md:text-[54px]">
              {entry.title}
            </h1>
          </Reveal>

          {/* Ledger band — authors, review, date, filing */}
          <Reveal delay={0.12} y={14}>
            <dl
              className={`mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border py-6 ${
                hasReviewers ? "md:grid-cols-4" : "md:grid-cols-3"
              }`}
            >
              <div>
                <dt className="ledger text-warm-gray">Published by</dt>
                <dd className="mt-2 font-body text-[14px] leading-relaxed text-ink/85">
                  {formatList(entry.authors)}
                </dd>
              </div>
              {hasReviewers && (
                <div>
                  <dt className="ledger text-warm-gray">Reviewed by</dt>
                  <dd className="mt-2 font-body text-[14px] leading-relaxed text-ink/85">
                    {formatList(entry.reviewers)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="ledger text-warm-gray">Published</dt>
                <dd className="mt-2 font-body text-[14px] leading-relaxed text-ink/85">
                  {formatPublicationDate(entry.published_date)}
                </dd>
              </div>
              <div>
                <dt className="ledger text-warm-gray">Filed under</dt>
                <dd className="mt-2 font-body text-[14px] leading-relaxed text-ink/85">
                  {entry.topic}
                  <span className="mx-1.5 text-warm-gray">·</span>
                  {cityLabel(entry.city)}
                </dd>
              </div>
            </dl>
          </Reveal>

          {/* Actions — hidden in print */}
          <Reveal delay={0.2} y={10}>
            <div
              data-print-hide="true"
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <DownloadPDFButton />
              {entry.pdf_url && (
                <a
                  href={entry.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-[13px] text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
                >
                  Official typeset PDF
                </a>
              )}
              {hasDataset && (
                <Link
                  href={`/research/data/${entry.slug}`}
                  className="group inline-flex items-center gap-1.5 font-body text-[13px] font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  Replication data
                  <span aria-hidden="true" className="arrow-nudge">
                    &rarr;
                  </span>
                </Link>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          BODY
          ============================================================ */}
      <section className="bg-cream pb-20 pt-12 md:pt-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <ResearchArticleBody
            markdown={entry.full_content_markdown}
            citations={entry.citations}
          />

          {/* ==========================================================
              RELATED CONTENT
              Sits in the content column, below the citations.
              ========================================================== */}
          <div className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="max-w-[65ch]">
              <RelatedContent
                relatedEntries={relatedEntries}
                relatedCampaigns={campaignRefs}
                relatedTours={tourRefs}
              />
            </div>
            <div aria-hidden="true" className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* ============================================================
          BACK TO ARCHIVE
          ============================================================ */}
      <section className="border-t border-border bg-cream pb-24 pt-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <Link
            href="/research"
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:-translate-x-1"
            >
              &larr;
            </span>
            All published research
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
