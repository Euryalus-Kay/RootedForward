/* ------------------------------------------------------------------ */
/*  /research                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The main Rooted Forward research archive.                          */
/*                                                                     */
/*  Page sections, in order:                                           */
/*   1. Banner             — hero image with Research title.           */
/*   2. Featured entry     — most recent published entry.              */
/*   3. Filter bar + list  — client side feed with sticky filter.      */
/*   4. Quiet footer       — single email prompt.                      */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import { Suspense } from "react";
import PageTransition from "@/components/layout/PageTransition";
import FeaturedEntry from "@/components/research/FeaturedEntry";
import ResearchFeed from "@/components/research/ResearchFeed";
import ResearchFooter from "@/components/research/ResearchFooter";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";
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

export default async function ResearchPage() {
  const entries = await fetchPublishedEntries();

  // Most recent published entry is featured. Everything else goes in
  // the filterable feed.
  const [featured, ...rest] = entries;

  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* ==========================================================
            SECTION 1: BANNER
            Hero image with a forest tint overlay, matching the
            education, policy, and get-involved banner treatment.
            ========================================================== */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
            <h1 className="font-display text-4xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] md:text-5xl lg:text-6xl">
              Research
            </h1>
          </div>
        </section>

        {/* ==========================================================
            SECTION 2: FEATURED ENTRY
            ========================================================== */}
        {featured && <FeaturedEntry entry={featured} />}

        {/* ==========================================================
            SECTION 3: FILTER BAR + ENTRY LIST
            ========================================================== */}
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

        {/* ==========================================================
            SECTION 4: QUIET FOOTER EMAIL BLOCK
            ========================================================== */}
        <ResearchFooter />
      </div>
    </PageTransition>
  );
}
