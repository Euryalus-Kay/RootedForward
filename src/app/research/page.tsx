/* ------------------------------------------------------------------ */
/*  /research                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The main Rooted Forward research archive.                          */
/*                                                                     */
/*  Page sections, in order:                                           */
/*   1. PageBanner          — v2 banner with live archive counts.      */
/*   2. Featured entry      — most recent published entry, editorial.  */
/*   3. Filter bar + grid   — client side feed with sticky filter.     */
/*   4. Correspondence      — collaboration prompt above the footer.   */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import { Suspense } from "react";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import FeaturedEntry from "@/components/research/FeaturedEntry";
import GradeBands from "@/components/research/GradeBands";
import ResearchFeed from "@/components/research/ResearchFeed";
import ResearchFooter from "@/components/research/ResearchFooter";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
import { RESEARCH_DATASETS } from "@/lib/research-datasets";
import type { ResearchEntry } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Research | Rooted Forward",
  description:
    "Published research by Rooted Forward covering housing, displacement, zoning, education, policing, and economic development in American cities.",
};

// Rebuild the page every hour so new admin-published entries appear
// without a redeploy.
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

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function count(n: number, singular: string): string {
  return `${n} ${singular}${n === 1 ? "" : "s"}`;
}

export default async function ResearchPage() {
  const entries = await fetchPublishedEntries();

  // Most recent published entry is featured. Everything else goes in
  // the filterable feed.
  const [featured, ...rest] = entries;

  // Banner meta is computed from real data, never hand-typed.
  const paperCount = entries.length;
  const datasetCount = Object.keys(RESEARCH_DATASETS).length;
  const topicCount = new Set(entries.map((e) => e.topic)).size;

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* ==========================================================
            SECTION 1: BANNER
            ========================================================== */}
        <PageBanner
          eyebrow="Research / Archive"
          title="Research"
          dek="Published work on housing, displacement, zoning, education, policing, and economic development in American cities."
          meta={[
            count(paperCount, "paper"),
            count(datasetCount, "dataset"),
            count(topicCount, "topic"),
          ]}
        />

        {/* ==========================================================
            SECTION 2: FEATURED ENTRY
            ========================================================== */}
        {featured && <FeaturedEntry entry={featured} />}

        {/* ==========================================================
            SECTION 2.5: THE HOLC LEGEND — scroll-drawn grade bands
            ========================================================== */}
        <GradeBands />

        {/* ==========================================================
            SECTION 3: FILTER BAR + ENTRY GRID
            ========================================================== */}
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
              <p className="font-body text-[15px] text-warm-gray">
                Loading archive…
              </p>
            </div>
          }
        >
          <ResearchFeed entries={rest.length > 0 ? rest : entries} />
        </Suspense>

        {/* ==========================================================
            SECTION 4: CORRESPONDENCE BLOCK
            ========================================================== */}
        <ResearchFooter />
      </div>
    </PageTransition>
  );
}
