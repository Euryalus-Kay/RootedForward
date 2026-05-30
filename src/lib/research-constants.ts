/* ------------------------------------------------------------------ */
/*  Research section constants + placeholder/fallback data             */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The /research page is driven by the `research_entries` and         */
/*  `industry_directors` tables in Supabase, but falls back to the     */
/*  placeholder data here when the database is not configured or       */
/*  returns an empty set. This keeps the site renderable in local      */
/*  development without an env file.                                   */
/*                                                                     */
/*  Everything here is also what drives the admin form dropdowns       */
/*  (topics, cities, formats), so keep them in sync if you add a       */
/*  new format or city.                                                */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type {
  ResearchEntry,
  IndustryDirector,
  ResearchFormat,
  Citation,
} from "@/lib/types/database";
import { RESEARCH_PAPERS } from "@/lib/research/papers";

/* ------------------------------------------------------------------ */
/*  Taxonomy                                                           */
/* ------------------------------------------------------------------ */

export interface TopicOption {
  value: string;
  label: string;
  description: string;
}

export interface CityOption {
  value: string;
  label: string;
}

export interface FormatOption {
  value: ResearchFormat;
  label: string;
  /**
   * How the format appears in the small muted metadata line at the
   * bottom of an entry card. Matches what academic databases use
   * (Brief, Report, etc not all caps, not a pill).
   */
  short_label: string;
  description: string;
}

export const RESEARCH_TOPICS: TopicOption[] = [
  {
    value: "Housing",
    label: "Housing",
    description:
      "Redlining legacy, affordable housing covenants, property value analysis, rental market dynamics, subsidy effectiveness.",
  },
  {
    value: "Education",
    label: "Education",
    description:
      "School closures, neighborhood school access, enrollment patterns, public school investment.",
  },
  {
    value: "Zoning",
    label: "Zoning",
    description:
      "Zoning reform, industrial corridor protections, transit-oriented development, density bonuses.",
  },
  {
    value: "Displacement",
    label: "Displacement",
    description:
      "Rent pressure tracking, tenant protections, community benefits agreements, anti-displacement funds.",
  },
  {
    value: "Policing",
    label: "Policing",
    description:
      "Traffic stop data, use of force patterns, budget analysis, accountability infrastructure.",
  },
  {
    value: "Economic Development",
    label: "Economic Development",
    description:
      "Tax increment financing, local hiring, small business preservation, commercial corridor health.",
  },
];

export const TOPIC_VALUES = RESEARCH_TOPICS.map((t) => t.value);

export const RESEARCH_CITIES: CityOption[] = [
  { value: "chicago", label: "Chicago" },
  { value: "new-york", label: "New York" },
  { value: "dallas", label: "Dallas" },
  { value: "san-francisco", label: "San Francisco" },
];

export const CITY_VALUES = RESEARCH_CITIES.map((c) => c.value);

export const RESEARCH_FORMATS: FormatOption[] = [
  {
    value: "brief",
    label: "Brief",
    short_label: "Brief",
    description:
      "A short, tightly argued document (typically 3–8 pages) focused on a single policy question or finding.",
  },
  {
    value: "report",
    label: "Report",
    short_label: "Report",
    description:
      "A full-length report (15–40 pages) with methodology, findings, recommendations, and a citation apparatus.",
  },
  {
    value: "primary_source_collection",
    label: "Primary Source Collection",
    short_label: "Primary Sources",
    description:
      "Curated, annotated collection of archival documents, transcripts, maps, or oral histories with an editorial introduction.",
  },
  {
    value: "data_analysis",
    label: "Data Analysis",
    short_label: "Data Analysis",
    description:
      "A quantitative piece with methodology, dataset description, and numerical findings. Usually published alongside a dataset.",
  },
  {
    value: "oral_history",
    label: "Oral History",
    short_label: "Oral History",
    description:
      "Transcribed and edited first-person testimony, usually accompanying a report or a thematic collection.",
  },
];

export const FORMAT_VALUES = RESEARCH_FORMATS.map((f) => f.value);

/** Quick lookup helper: format value → short label */
export function formatLabel(value: ResearchFormat): string {
  return RESEARCH_FORMATS.find((f) => f.value === value)?.short_label ?? value;
}

/** Quick lookup helper: city slug → display label */
export function cityLabel(value: string): string {
  return RESEARCH_CITIES.find((c) => c.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/*  Sort options                                                       */
/* ------------------------------------------------------------------ */

export type ResearchSort = "newest" | "oldest";

export const SORT_OPTIONS: { value: ResearchSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

/* ------------------------------------------------------------------ */
/*  Filter state the shape shared between the filter bar and the    */
/*  URL query string, so you can deep-link a filtered view.            */
/* ------------------------------------------------------------------ */

export interface ResearchFilters {
  topic: string | "all";
  city: string | "all";
  format: ResearchFormat | "all";
  sort: ResearchSort;
}

export const DEFAULT_FILTERS: ResearchFilters = {
  topic: "all",
  city: "all",
  format: "all",
  sort: "newest",
};

/**
 * Parse URL search params into a ResearchFilters object. Anything
 * that does not match a known option falls back to the default.
 */
export function parseFiltersFromParams(
  params: URLSearchParams | Record<string, string | undefined>,
): ResearchFilters {
  const getValue = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    return params[key];
  };

  const topic = getValue("topic");
  const city = getValue("city");
  const format = getValue("format");
  const sort = getValue("sort");

  return {
    topic:
      topic && (topic === "all" || TOPIC_VALUES.includes(topic))
        ? topic
        : "all",
    city: city && (city === "all" || CITY_VALUES.includes(city)) ? city : "all",
    format:
      format &&
      (format === "all" || FORMAT_VALUES.includes(format as ResearchFormat))
        ? (format as ResearchFormat | "all")
        : "all",
    sort: sort === "oldest" ? "oldest" : "newest",
  };
}

/**
 * Inverse of parseFiltersFromParams. Returns a URLSearchParams object
 * containing only the filters that differ from the default that way
 * `/research` with no active filter stays clean.
 */
export function filtersToParams(filters: ResearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.topic !== DEFAULT_FILTERS.topic)
    params.set("topic", filters.topic);
  if (filters.city !== DEFAULT_FILTERS.city) params.set("city", filters.city);
  if (filters.format !== DEFAULT_FILTERS.format)
    params.set("format", String(filters.format));
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  return params;
}

/**
 * Apply filters to a list of entries. Used on the /research page to
 * show the filtered list without a page reload. Also used on the
 * server for initial render.
 */
export function applyFilters(
  entries: ResearchEntry[],
  filters: ResearchFilters,
): ResearchEntry[] {
  return entries
    .filter((entry) => {
      if (filters.topic !== "all" && entry.topic !== filters.topic)
        return false;
      if (filters.city !== "all" && entry.city !== filters.city) return false;
      if (filters.format !== "all" && entry.format !== filters.format)
        return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.published_date).getTime();
      const bTime = new Date(b.published_date).getTime();
      return filters.sort === "newest" ? bTime - aTime : aTime - bTime;
    });
}

/* ------------------------------------------------------------------ */
/*  Citation helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Normalize any citation input into a well-formed Citation object.
 * Admin forms can produce partial objects (missing fields) and this
 * keeps rendering defensive.
 */
export function normalizeCitation(
  raw: Partial<Citation>,
  fallbackId: string,
): Citation {
  return {
    id: raw.id ?? fallbackId,
    text: raw.text ?? "",
    url: raw.url && raw.url.trim() ? raw.url : null,
    accessed_date:
      raw.accessed_date && raw.accessed_date.trim() ? raw.accessed_date : null,
    type: raw.type === "secondary" ? "secondary" : "primary",
  };
}

/** Normalize an entire citation list, assigning stable ids. */
export function normalizeCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c, idx) =>
      normalizeCitation(c as Partial<Citation>, String(idx + 1)),
    );
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

export const ENTRIES_PER_PAGE = 10;

export function paginateEntries<T>(
  entries: T[],
  page: number,
  perPage: number = ENTRIES_PER_PAGE,
): {
  page: number;
  totalPages: number;
  items: T[];
  hasOlder: boolean;
  hasNewer: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const start = (clampedPage - 1) * perPage;
  const items = entries.slice(start, start + perPage);
  return {
    page: clampedPage,
    totalPages,
    items,
    hasOlder: clampedPage < totalPages,
    hasNewer: clampedPage > 1,
  };
}

/* ------------------------------------------------------------------ */
/*  Placeholder research entries                                       */
/*                                                                     */
/*  These render in local dev and on any deploy without Supabase       */
/*  credentials. They are also the content used to seed the database  */
/*  in migration 004.                                                  */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_RESEARCH_ENTRIES: ResearchEntry[] = RESEARCH_PAPERS;

/* ------------------------------------------------------------------ */
/*  Placeholder industry directors                                     */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_INDUSTRY_DIRECTORS: IndustryDirector[] = [];

/* ------------------------------------------------------------------ */
/*  Related-entry helper                                               */
/* ------------------------------------------------------------------ */

/**
 * Given the currently displayed entry, pick up to `limit` other
 * published entries that share topic or city tags. Prioritizes
 * topic match over city match, then falls back to most recent.
 */
export function findRelatedEntries(
  entry: ResearchEntry,
  allEntries: ResearchEntry[],
  limit: number = 3,
): ResearchEntry[] {
  return allEntries
    .filter(
      (e) =>
        e.id !== entry.id &&
        e.status === "published" &&
        (e.topic === entry.topic || e.city === entry.city),
    )
    .sort((a, b) => {
      const topicScoreA = a.topic === entry.topic ? 2 : 0;
      const topicScoreB = b.topic === entry.topic ? 2 : 0;
      const cityScoreA = a.city === entry.city ? 1 : 0;
      const cityScoreB = b.city === entry.city ? 1 : 0;
      const scoreDiff = topicScoreB + cityScoreB - (topicScoreA + cityScoreA);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        new Date(b.published_date).getTime() -
        new Date(a.published_date).getTime()
      );
    })
    .slice(0, limit);
}
