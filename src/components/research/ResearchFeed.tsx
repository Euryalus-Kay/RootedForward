"use client";

/* ------------------------------------------------------------------ */
/*  ResearchFeed                                                       */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Client component for the /research entry list. Owns the active    */
/*  filter state, handles pagination, and renders the filter bar,    */
/*  the list itself, and the empty state.                              */
/*                                                                     */
/*  The whole feed is client-side so filters can update without a   */
/*  page reload. The URL is synced for shareability.                   */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FilterBar from "@/components/research/FilterBar";
import EntryCard from "@/components/research/EntryCard";
import type { ResearchEntry } from "@/lib/types/database";
import {
  DEFAULT_FILTERS,
  ENTRIES_PER_PAGE,
  applyFilters,
  paginateEntries,
  parseFiltersFromParams,
  type ResearchFilters,
} from "@/lib/research-constants";

interface ResearchFeedProps {
  entries: ResearchEntry[];
}

export default function ResearchFeed({ entries }: ResearchFeedProps) {
  const searchParams = useSearchParams();

  /* ---- Filter state, initialised from URL ---- */
  const [filters, setFilters] = useState<ResearchFilters>(() =>
    parseFiltersFromParams(new URLSearchParams(searchParams.toString()))
  );

  /* ---- Pagination (1-indexed) ---- */
  const [page, setPage] = useState<number>(() => {
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  });

  /* Reset to page 1 when filters change (user gesture) */
  const handleFiltersChange = useCallback(
    (next: ResearchFilters) => {
      setFilters((prev) => {
        const filterDidChange =
          prev.topic !== next.topic ||
          prev.city !== next.city ||
          prev.format !== next.format ||
          prev.sort !== next.sort;
        if (filterDidChange) setPage(1);
        return next;
      });
    },
    []
  );

  /* Keep state synced with back/forward URL changes */
  useEffect(() => {
    const parsed = parseFiltersFromParams(
      new URLSearchParams(searchParams.toString())
    );
    setFilters(parsed);
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 1;
    setPage(Number.isFinite(n) && n > 0 ? n : 1);
  }, [searchParams]);

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
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  return (
    <section aria-labelledby="research-feed-heading" className="bg-cream">
      <h2 id="research-feed-heading" className="sr-only">
        Research archive
      </h2>

      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        resultCount={filtered.length}
      />

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-16">
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
            <div className="flex flex-col gap-14 md:gap-16">
              {pagination.items.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>

            {(pagination.hasOlder || pagination.hasNewer) && (
              <nav
                className="mt-16 flex items-center justify-between border-t border-border pt-6 font-body text-[14px]"
                aria-label="Archive pagination"
              >
                {pagination.hasNewer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                  >
                    &larr; Newer
                  </button>
                ) : (
                  <span className="text-warm-gray">&larr; Newer</span>
                )}

                <p className="text-warm-gray">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                {pagination.hasOlder ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => p + 1);
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                  >
                    Older &rarr;
                  </button>
                ) : (
                  <span className="text-warm-gray">Older &rarr;</span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
