"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, ArrowUpDown, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourStop } from "@/lib/types/database";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SortOption = "default" | "a-z" | "z-a" | "newest";

interface StopFiltersProps {
  stops: TourStop[];
  onFilteredChange: (stops: TourStop[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "a-z", label: "A-Z" },
  { value: "z-a", label: "Z-A" },
  { value: "newest", label: "Newest First" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StopFilters({ stops, onFilteredChange }: StopFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [hasVideoOnly, setHasVideoOnly] = useState(false);

  /* ---- Derived: filter + sort ---- */
  const filteredStops = useMemo(() => {
    let result = [...stops];

    // Text search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (stop) =>
          stop.title.toLowerCase().includes(q) ||
          stop.description.toLowerCase().includes(q)
      );
    }

    // Video filter
    if (hasVideoOnly) {
      result = result.filter(
        (stop) => stop.video_url !== null && stop.video_url !== ""
      );
    }

    // Sort
    switch (sortOption) {
      case "a-z":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "default":
      default:
        // Keep the original order from the database
        break;
    }

    return result;
  }, [stops, searchQuery, sortOption, hasVideoOnly]);

  /* ---- Notify parent when filtered result changes ---- */
  useEffect(() => {
    onFilteredChange(filteredStops);
  }, [filteredStops, onFilteredChange]);

  /* ---- Clear all filters ---- */
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSortOption("default");
    setHasVideoOnly(false);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== "" || sortOption !== "default" || hasVideoOnly;

  const videoCount = stops.filter(
    (s) => s.video_url !== null && s.video_url !== ""
  ).length;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter stops by title or description..."
            className={cn(
              "w-full rounded-lg border border-border bg-white/60 py-2.5 pl-9 pr-9 font-body text-sm text-ink",
              "placeholder:text-warm-gray-light transition-colors",
              "focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray transition-colors hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-gray" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className={cn(
              "appearance-none rounded-lg border border-border bg-white/60 py-2.5 pl-9 pr-8 font-body text-sm text-ink",
              "transition-colors cursor-pointer",
              "focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20",
              sortOption !== "default" && "border-forest bg-forest/5"
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Has Video toggle */}
        {videoCount > 0 && (
          <button
            onClick={() => setHasVideoOnly((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 font-body text-sm font-medium transition-colors",
              hasVideoOnly
                ? "border-forest bg-forest text-cream"
                : "border-border bg-white/60 text-ink hover:bg-cream-dark"
            )}
          >
            <Video className="h-4 w-4" />
            Has Video
          </button>
        )}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 font-body text-sm font-medium text-rust transition-colors hover:bg-rust/10"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="font-body text-sm text-warm-gray">
        Showing{" "}
        <span className="font-semibold text-ink">
          {filteredStops.length}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-ink">{stops.length}</span>{" "}
        stop{stops.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
