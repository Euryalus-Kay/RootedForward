"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, MapPin, Building2, Headphones, Clock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: string;
  type: "stop" | "city" | "podcast";
  title: string;
  description: string;
  href: string;
  badge?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RECENT_SEARCHES_KEY = "rf_recent_searches";
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = query.trim();
    if (!trimmed) return;
    const existing = getRecentSearches().filter((s) => s !== trimmed);
    const updated = [trimmed, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    /* localStorage may be unavailable */
  }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-warm-gray">{icon}</span>
      <span className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  /* ---- Load recent searches when modal opens ---- */
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setQuery("");
      setResults([]);
      setActiveIndex(-1);
      // Focus input after animation
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ---- Lock body scroll ---- */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ---- Debounced search ---- */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        if (!supabase) { setLoading(false); return; }
        const searchTerm = `%${query.trim()}%`;

        // Run three queries in parallel
        const [stopsRes, citiesRes, podcastsRes] = await Promise.all([
          supabase
            .from("tour_stops")
            .select("id, title, description, city, slug")
            .eq("published", true)
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from("cities")
            .select("id, name, description, slug")
            .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from("podcasts")
            .select("id, title, description, guests, episode_number")
            .eq("published", true)
            .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
            .limit(5),
        ]);

        if (controller.signal.aborted) return;

        const mapped: SearchResult[] = [];

        // Stops
        (stopsRes.data ?? []).forEach((stop) => {
          mapped.push({
            id: `stop-${stop.id}`,
            type: "stop",
            title: stop.title,
            description: truncate(stop.description, 100),
            href: `/tours/${stop.city}/${stop.slug}`,
            badge: stop.city,
          });
        });

        // Cities
        (citiesRes.data ?? []).forEach((city) => {
          mapped.push({
            id: `city-${city.id}`,
            type: "city",
            title: city.name,
            description: truncate(city.description, 100),
            href: `/tours/${city.slug}`,
          });
        });

        // Podcasts — also check guests array client-side
        const podcastData = podcastsRes.data ?? [];
        podcastData.forEach((pod) => {
          const guestMatch =
            pod.guests?.some((g: string) =>
              g.toLowerCase().includes(query.trim().toLowerCase())
            ) ?? false;

          // Always include if returned from the .or query, plus check guests
          if (guestMatch || true) {
            mapped.push({
              id: `podcast-${pod.id}`,
              type: "podcast",
              title: pod.title,
              description: truncate(pod.description, 100),
              href: "/podcasts",
              badge: `Ep. ${pod.episode_number}`,
            });
          }
        });

        setResults(mapped);
        setActiveIndex(mapped.length > 0 ? 0 : -1);
      } catch {
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  /* ---- Group results by type ---- */
  const grouped = useMemo(() => {
    const stops = results.filter((r) => r.type === "stop");
    const cities = results.filter((r) => r.type === "city");
    const podcasts = results.filter((r) => r.type === "podcast");
    return { stops, cities, podcasts };
  }, [results]);

  /* ---- Flat list for keyboard navigation ---- */
  const flatResults = useMemo(
    () => [...grouped.stops, ...grouped.cities, ...grouped.podcasts],
    [grouped]
  );

  /* ---- Navigate to result ---- */
  const navigateTo = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query.trim());
      onClose();
      router.push(result.href);
    },
    [query, onClose, router]
  );

  /* ---- Navigate to recent search ---- */
  const handleRecentClick = useCallback(
    (term: string) => {
      setQuery(term);
    },
    []
  );

  /* ---- Keyboard handling ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < flatResults.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : flatResults.length - 1
        );
        return;
      }

      if (e.key === "Enter" && activeIndex >= 0 && activeIndex < flatResults.length) {
        e.preventDefault();
        navigateTo(flatResults[activeIndex]);
      }
    },
    [onClose, flatResults, activeIndex, navigateTo]
  );

  /* ---- Scroll active item into view ---- */
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-result-item]");
    const target = items[activeIndex];
    if (target) {
      target.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  /* ---- Icon by type ---- */
  function typeIcon(type: SearchResult["type"]) {
    switch (type) {
      case "stop":
        return <MapPin className="h-4 w-4" />;
      case "city":
        return <Building2 className="h-4 w-4" />;
      case "podcast":
        return <Headphones className="h-4 w-4" />;
    }
  }

  /* ---- Render a result item ---- */
  let flatIndex = -1;
  function renderItem(result: SearchResult) {
    flatIndex++;
    const idx = flatIndex;
    const isActive = idx === activeIndex;

    return (
      <button
        key={result.id}
        data-result-item
        onClick={() => navigateTo(result)}
        onMouseEnter={() => setActiveIndex(idx)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
          isActive ? "bg-forest/10" : "hover:bg-cream-dark"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            result.type === "stop"
              ? "bg-forest/10 text-forest"
              : result.type === "city"
                ? "bg-rust/10 text-rust"
                : "bg-ink/10 text-ink"
          )}
        >
          {typeIcon(result.type)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-body text-sm font-semibold text-ink">
              {result.title}
            </span>
            {result.badge && (
              <span className="shrink-0 rounded-full bg-forest/10 px-2 py-0.5 font-body text-[10px] font-medium text-forest capitalize">
                {result.badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate font-body text-xs text-warm-gray">
            {result.description}
          </p>
        </div>

        <ArrowRight
          className={cn(
            "h-4 w-4 shrink-0 text-warm-gray-light transition-opacity",
            isActive ? "opacity-100" : "opacity-0"
          )}
        />
      </button>
    );
  }

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && !loading && results.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-cream shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-warm-gray" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stops, cities, podcasts..."
                autoComplete="off"
                className="flex-1 bg-transparent font-body text-sm text-ink placeholder:text-warm-gray-light focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="flex shrink-0 items-center rounded-md border border-border bg-cream-dark px-2 py-0.5 font-body text-[10px] font-medium text-warm-gray"
              >
                ESC
              </button>
            </div>

            {/* Results area */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
              {/* Loading indicator */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest border-t-transparent" />
                </div>
              )}

              {/* No results */}
              {noResults && (
                <div className="py-10 text-center">
                  <Search className="mx-auto h-8 w-8 text-warm-gray-light" />
                  <p className="mt-3 font-body text-sm text-warm-gray">
                    No results found for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mt-1 font-body text-xs text-warm-gray-light">
                    Try a different search term
                  </p>
                </div>
              )}

              {/* Results grouped */}
              {!loading && results.length > 0 && (
                <>
                  {grouped.stops.length > 0 && (
                    <div>
                      <SectionHeader
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        label="Tour Stops"
                      />
                      {grouped.stops.map((r) => renderItem(r))}
                    </div>
                  )}

                  {grouped.cities.length > 0 && (
                    <div className="mt-1">
                      <SectionHeader
                        icon={<Building2 className="h-3.5 w-3.5" />}
                        label="Cities"
                      />
                      {grouped.cities.map((r) => renderItem(r))}
                    </div>
                  )}

                  {grouped.podcasts.length > 0 && (
                    <div className="mt-1">
                      <SectionHeader
                        icon={<Headphones className="h-3.5 w-3.5" />}
                        label="Podcasts"
                      />
                      {grouped.podcasts.map((r) => renderItem(r))}
                    </div>
                  )}
                </>
              )}

              {/* Recent searches (when no query) */}
              {!hasQuery && recentSearches.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Recent Searches"
                  />
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors hover:bg-cream-dark"
                    >
                      <Clock className="h-4 w-4 shrink-0 text-warm-gray-light" />
                      <span className="truncate font-body text-sm text-ink-light">
                        {term}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty default state */}
              {!hasQuery && recentSearches.length === 0 && (
                <div className="py-10 text-center">
                  <Search className="mx-auto h-8 w-8 text-warm-gray-light" />
                  <p className="mt-3 font-body text-sm text-warm-gray">
                    Search across tour stops, cities, and podcasts
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <span className="rounded-md border border-border bg-cream-dark px-2 py-0.5 font-body text-[10px] font-medium text-warm-gray">
                      &uarr;&darr;
                    </span>
                    <span className="font-body text-xs text-warm-gray-light">
                      to navigate
                    </span>
                    <span className="rounded-md border border-border bg-cream-dark px-2 py-0.5 font-body text-[10px] font-medium text-warm-gray">
                      Enter
                    </span>
                    <span className="font-body text-xs text-warm-gray-light">
                      to open
                    </span>
                    <span className="rounded-md border border-border bg-cream-dark px-2 py-0.5 font-body text-[10px] font-medium text-warm-gray">
                      Esc
                    </span>
                    <span className="font-body text-xs text-warm-gray-light">
                      to close
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
