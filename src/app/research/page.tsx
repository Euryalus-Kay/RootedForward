/* ------------------------------------------------------------------ */
/*  /research                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The main Rooted Forward research archive. Reads like a university */
/*  press archive or think tank publications library — no explanatory */
/*  paragraphs, no colored pills, no decorative flourishes. The work */
/*  is what the page shows.                                            */
/*                                                                     */
/*  Page sections, in order:                                           */
/*   1. Header            — eyebrow + serif display title + rule.     */
/*   2. Featured entry    — most recent published entry, big treatment.*/
/*   3. Filter bar + list — client component, sticky filter, vertical */
/*                          feed of every other entry.                 */
/*   4. Industry Directors — separated by generous whitespace.         */
/*   5. Quiet footer      — single email prompt.                       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import { Suspense } from "react";
import PageTransition from "@/components/layout/PageTransition";
import FeaturedEntry from "@/components/research/FeaturedEntry";
import ResearchFeed from "@/components/research/ResearchFeed";
import IndustryDirectorsSection from "@/components/research/IndustryDirectorsSection";
import ResearchFooter from "@/components/research/ResearchFooter";
import {
  PLACEHOLDER_INDUSTRY_DIRECTORS,
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import type {
  IndustryDirector,
  ResearchEntry,
} from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Research | Rooted Forward",
  description:
    "Published research by Rooted Forward — briefs, reports, primary source collections, data analyses, and oral histories on housing, displacement, zoning, education, policing, and economic development in American cities.",
};

// Rebuild the page every hour so new admin-published entries appear
// without a redeploy. Individual entries can be re-rendered on demand
// via revalidateTag if we add that later.
export const revalidate = 3600;

/* ------------------------------------------------------------------ */
/*  Data fetchers                                                      */
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

    if (error || !data || data.length === 0) {
      return PLACEHOLDER_RESEARCH_ENTRIES;
    }

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

async function fetchActiveDirectors(): Promise<IndustryDirector[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) return PLACEHOLDER_INDUSTRY_DIRECTORS;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("industry_directors")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return PLACEHOLDER_INDUSTRY_DIRECTORS;
    }

    return data.map((row) => ({
      ...row,
      focus_areas: row.focus_areas ?? [],
    })) as IndustryDirector[];
  } catch {
    return PLACEHOLDER_INDUSTRY_DIRECTORS;
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ResearchPage() {
  const [entries, directors] = await Promise.all([
    fetchPublishedEntries(),
    fetchActiveDirectors(),
  ]);

  // Most recent published entry is featured. Everything else goes in
  // the filterable feed.
  const [featured, ...rest] = entries;

  return (
    <PageTransition>
      {/* ============================================================
          SECTION 1: PAGE HEADER
          — eyebrow + serif display + thin rule, no paragraph.
          ============================================================ */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-warm-gray">
            Research
          </p>
          <h1 className="mt-4 font-display text-[44px] leading-[1.05] text-forest md:text-[72px]">
            Published Work
          </h1>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2: FEATURED ENTRY
          ============================================================ */}
      {featured && <FeaturedEntry entry={featured} />}

      {/* ============================================================
          SECTION 3: FILTER BAR + ENTRY LIST
          — client-side feed. Suspense so the search-params reader
          has a boundary for streaming.
          ============================================================ */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-body text-[15px] text-warm-gray">
              Loading archive…
            </p>
          </div>
        }
      >
        <ResearchFeed entries={rest.length > 0 ? rest : entries} />
      </Suspense>

      {/* ============================================================
          SECTION 4: INDUSTRY DIRECTORS
          ============================================================ */}
      <IndustryDirectorsSection directors={directors} />

      {/* ============================================================
          SECTION 5: FOOTER EMAIL BLOCK
          ============================================================ */}
      <ResearchFooter />
    </PageTransition>
  );
}
