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
import RelatedContent from "@/components/research/RelatedContent";
import type { ResearchEntry } from "@/lib/types/database";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  cityLabel,
  findRelatedEntries,
  formatLabel,
  normalizeCitations,
} from "@/lib/research-constants";

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

  return (
    <PageTransition>
      {/* ============================================================
          HEADER
          ============================================================ */}
      <section className="bg-cream pb-10 pt-28 md:pt-32">
        <div className="mx-auto max-w-6xl px-6">
          {/* Breadcrumb */}
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
            <span className="text-ink/60">{entry.title}</span>
          </nav>

          {/* Title */}
          <h1 className="mt-6 max-w-[60ch] font-display text-[38px] leading-[1.1] text-forest md:text-[56px]">
            {entry.title}
          </h1>

          {/* Metadata line — format, topic, city */}
          <p className="mt-5 font-body text-[14px] text-warm-gray">
            {formatLabel(entry.format)}
            <span className="mx-1.5">·</span>
            {entry.topic}
            <span className="mx-1.5">·</span>
            {cityLabel(entry.city)}
          </p>

          {/* Publication date */}
          <p className="mt-1 font-body text-[14px] text-warm-gray">
            Published {formatPublicationDate(entry.published_date)}
          </p>

          {/* Credits */}
          <div className="mt-6 flex flex-col gap-1 font-body text-[14.5px] text-ink/75">
            <p>Published by {formatList(entry.authors)}</p>
            {hasReviewers && (
              <p className="text-warm-gray">
                Reviewed by {formatList(entry.reviewers)}
              </p>
            )}
          </div>

          {/* PDF download */}
          {entry.pdf_url && (
            <p className="mt-6">
              <a
                href={entry.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-body text-[14px] text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Download PDF
              </a>
            </p>
          )}

          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* ============================================================
          BODY
          ============================================================ */}
      <section className="bg-cream pb-20">
        <div className="mx-auto max-w-6xl px-6">
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
        <div className="mx-auto max-w-6xl px-6">
          <Link
            href="/research"
            className="font-body text-[14px] text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
          >
            &larr; All published research
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
