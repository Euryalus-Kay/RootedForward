"use client";

/* ------------------------------------------------------------------ */
/*  FilterBar                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Sticky filter row for /research. Sits under the featured entry   */
/*  and controls the list below.                                       */
/*                                                                     */
/*  - Minimal dropdowns, not pill buttons. Subtle, small.             */
/*  - Updates the URL (shallow, no page reload) so filtered views    */
/*    are shareable.                                                   */
/*  - Syncs with external state via onFiltersChange for the page     */
/*    list to re-filter.                                               */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  DEFAULT_FILTERS,
  RESEARCH_CITIES,
  RESEARCH_FORMATS,
  RESEARCH_TOPICS,
  SORT_OPTIONS,
  filtersToParams,
  parseFiltersFromParams,
  type ResearchFilters,
  type ResearchSort,
} from "@/lib/research-constants";
import type { ResearchFormat } from "@/lib/types/database";

interface FilterBarProps {
  filters: ResearchFilters;
  onFiltersChange: (next: ResearchFilters) => void;
  resultCount: number;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  resultCount,
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* Sync with URL on mount / back-forward nav */
  useEffect(() => {
    const parsed = parseFiltersFromParams(
      new URLSearchParams(searchParams.toString())
    );
    // Only push to parent if it differs from current state.
    if (
      parsed.topic !== filters.topic ||
      parsed.city !== filters.city ||
      parsed.format !== filters.format ||
      parsed.sort !== filters.sort
    ) {
      onFiltersChange(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const updateFilter = useCallback(
    <K extends keyof ResearchFilters>(key: K, value: ResearchFilters[K]) => {
      const next: ResearchFilters = { ...filters, [key]: value };
      onFiltersChange(next);

      const params = filtersToParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, onFiltersChange, pathname, router]
  );

  const resetFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
    router.replace(pathname, { scroll: false });
  }, [onFiltersChange, pathname, router]);

  const hasActiveFilters = useMemo(
    () =>
      filters.topic !== DEFAULT_FILTERS.topic ||
      filters.city !== DEFAULT_FILTERS.city ||
      filters.format !== DEFAULT_FILTERS.format ||
      filters.sort !== DEFAULT_FILTERS.sort,
    [filters]
  );

  return (
    <div className="sticky top-16 z-20 -mx-6 border-b border-border bg-cream/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="hidden font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-gray sm:block">
            Filter
          </p>

          {/* Topic */}
          <FilterSelect
            label="Topic"
            value={filters.topic}
            onChange={(v) => updateFilter("topic", v)}
            options={[
              { value: "all", label: "All topics" },
              ...RESEARCH_TOPICS.map((t) => ({
                value: t.value,
                label: t.label,
              })),
            ]}
          />

          {/* City */}
          <FilterSelect
            label="City"
            value={filters.city}
            onChange={(v) => updateFilter("city", v)}
            options={[
              { value: "all", label: "All cities" },
              ...RESEARCH_CITIES.map((c) => ({
                value: c.value,
                label: c.label,
              })),
            ]}
          />

          {/* Format */}
          <FilterSelect
            label="Format"
            value={String(filters.format)}
            onChange={(v) =>
              updateFilter("format", v as ResearchFormat | "all")
            }
            options={[
              { value: "all", label: "All formats" },
              ...RESEARCH_FORMATS.map((f) => ({
                value: f.value,
                label: f.label,
              })),
            ]}
          />

          {/* Sort */}
          <FilterSelect
            label="Sort"
            value={filters.sort}
            onChange={(v) => updateFilter("sort", v as ResearchSort)}
            options={SORT_OPTIONS.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-body text-[12px] text-warm-gray underline decoration-warm-gray/40 underline-offset-2 transition-colors hover:text-forest hover:decoration-forest"
            >
              Clear
            </button>
          )}
        </div>

        <p className="font-body text-[12px] text-warm-gray">
          {resultCount} {resultCount === 1 ? "entry" : "entries"}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponent — a single labelled select                            */
/* ------------------------------------------------------------------ */

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex items-center gap-2 font-body text-[13px] text-ink/75">
      <span className="text-warm-gray">{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="cursor-pointer appearance-none rounded-sm border border-border bg-cream py-1 pl-2.5 pr-7 font-body text-[13px] text-ink transition-colors hover:border-warm-gray focus:border-forest focus:outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-warm-gray"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </span>
    </label>
  );
}
