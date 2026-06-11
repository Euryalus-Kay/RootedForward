"use client";

/* ------------------------------------------------------------------ */
/*  ResearchFeed                                                       */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Client component for the /research catalog. Owns the active       */
/*  filter state, handles pagination, and renders the section          */
/*  heading, the sticky filter bar, the hairline entry grid, and       */
/*  the empty state. Section index 02 of the page.                     */
/*                                                                     */
/*  The whole feed is client-side so filters can update without a     */
/*  page reload. The URL is synced for shareability.                   */
/*                                                                     */
/*  Archive numbering: every entry gets a stable "No. NN" computed    */
/*  from its chronological position in the full list (oldest = 01),   */
/*  so the numbers do not shuffle when filters or sort change.         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FilterBar from "@/components/research/FilterBar";
import EntryCard from "@/components/research/EntryCard";
import type { ResearchEntry } from "@/lib/types/database";
import {
  ENTRIES_PER_PAGE,
  applyFilters,
  filtersToParams,
  paginateEntries,
  parseFiltersFromParams,
} from "@/lib/research-constants";

interface ResearchFeedProps {
  entries: ResearchEntry[];
}

export default function ResearchFeed({ entries }: ResearchFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* ---- Single source of truth: the URL ----
     FilterBar writes filter changes to the URL (which also drops any
     page param, resetting to page 1); pagination writes the page
     param here. Everything below derives, so back/forward and shared
     links work with no state syncing. */
  const filters = useMemo(
    () =>
      parseFiltersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const page = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  /* FilterBar pushes the new filters into the URL itself; deriving
     from the URL makes this prop a formality. */
  const handleFiltersChange = useCallback(() => {}, []);

  const goToPage = useCallback(
    (p: number) => {
      const params = filtersToParams(filters);
      if (p > 1) params.set("page", String(p));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [filters, pathname, router]
  );

  /* ---- Stable archive numbers, oldest entry = 1 ---- */
  const archiveNumbers = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) =>
        new Date(a.published_date).getTime() -
        new Date(b.published_date).getTime()
    );
    const map = new Map<string, number>();
    sorted.forEach((e, i) => map.set(e.id, i + 1));
    return map;
  }, [entries]);

  /* ---- Filtered + paginated view ---- */
  const filtered = useMemo(
    () => applyFilters(entries, filters),
    [entries, filters]
  );

  const pagination = useMemo(
    () => paginateEntries(filtered, page, ENTRIES_PER_PAGE),
    [filtered, page]
  );

  const handleFilterReset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return (
    <section aria-labelledby="research-feed-heading" className="bg-cream">
      {/* Section index row + heading */}
      <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-8 md:pb-12">
        <div className="flex items-center gap-4">
          <span className="index-numeral text-sm text-rust">02</span>
          <p className="eyebrow text-warm-gray">Catalog</p>
          <div className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <h2
          id="research-feed-heading"
          className="mt-6 font-display text-3xl text-forest md:text-4xl"
        >
          The full archive
        </h2>
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        resultCount={filtered.length}
      />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-10 lg:px-8 md:pb-28 md:pt-14">
        {filtered.length === 0 ? (
          <div className="max-w-xl">
            <p className="font-body text-[17px] leading-relaxed text-ink/75">
              No published research matches those filters.
            </p>
            <button
              type="button"
              onClick={handleFilterReset}
              className="mt-3 font-body text-[14px] text-forest underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Hairline catalog grid */}
            <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
              {pagination.items.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  number={archiveNumbers.get(entry.id)}
                />
              ))}
              {pagination.items.length % 2 === 1 && (
                <div
                  className="hidden bg-cream md:block"
                  aria-hidden="true"
                />
              )}
            </div>

            {(pagination.hasOlder || pagination.hasNewer) && (
              <nav
                className="mt-12 flex items-center justify-between border-t border-border pt-6"
                aria-label="Archive pagination"
              >
                {pagination.hasNewer ? (
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(1, page - 1))}
                    className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
                  >
                    <span aria-hidden="true">&larr;</span>
                    Newer
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray/50">
                    <span aria-hidden="true">&larr;</span>
                    Newer
                  </span>
                )}

                <p className="ledger text-warm-gray">
                  Page {pagination.page} / {pagination.totalPages}
                </p>

                {pagination.hasOlder ? (
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    className="group inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
                  >
                    Older
                    <span aria-hidden="true" className="arrow-nudge">
                      &rarr;
                    </span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray/50">
                    Older
                    <span aria-hidden="true">&rarr;</span>
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
