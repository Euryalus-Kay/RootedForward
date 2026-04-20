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
import {
  CPD_TRAFFIC_STOP_BODY,
  OBAMA_CENTER_BRIEF_BODY,
  PILSEN_INDUSTRIAL_CORRIDOR_BODY,
} from "@/lib/research-seed-content";
import {
  HOLC_MAP_FULL_BODY,
  HYDE_PARK_ORAL_HISTORY_FULL_BODY,
} from "@/lib/research-seed-content-vol2";
import {
  AUSTIN_CBA_PLAYBOOK_BODY,
  BRONZEVILLE_TIF_ANALYSIS_BODY,
  PROPERTY_TAX_APPEAL_DISPARITY_BODY,
  WEST_SIDE_GROCERY_ORAL_HISTORY_BODY,
} from "@/lib/research-seed-content-vol3";
import {
  CROSS_BRONX_EXPRESSWAY_BODY,
  DALLAS_FAIR_PARK_BODY,
  FILLMORE_REDEVELOPMENT_BODY,
} from "@/lib/research-seed-content-vol4";

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
   * (Brief, Report, etc — not all caps, not a pill).
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
/*  Filter state — the shape shared between the filter bar and the    */
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
  params: URLSearchParams | Record<string, string | undefined>
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
    city:
      city && (city === "all" || CITY_VALUES.includes(city)) ? city : "all",
    format:
      format && (format === "all" || FORMAT_VALUES.includes(format as ResearchFormat))
        ? (format as ResearchFormat | "all")
        : "all",
    sort: sort === "oldest" ? "oldest" : "newest",
  };
}

/**
 * Inverse of parseFiltersFromParams. Returns a URLSearchParams object
 * containing only the filters that differ from the default — that way
 * `/research` with no active filter stays clean.
 */
export function filtersToParams(filters: ResearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.topic !== DEFAULT_FILTERS.topic) params.set("topic", filters.topic);
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
  filters: ResearchFilters
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
export function normalizeCitation(raw: Partial<Citation>, fallbackId: string): Citation {
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
    .map((c, idx) => normalizeCitation(c as Partial<Citation>, String(idx + 1)));
}

/* ------------------------------------------------------------------ */
/*  Pagination                                                         */
/* ------------------------------------------------------------------ */

export const ENTRIES_PER_PAGE = 10;

export function paginateEntries<T>(
  entries: T[],
  page: number,
  perPage: number = ENTRIES_PER_PAGE
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

const nowIso = new Date().toISOString();

export const PLACEHOLDER_RESEARCH_ENTRIES: ResearchEntry[] = [
  {
    id: "re-1",
    slug: "geography-of-disinvestment-chicago-west-side",
    title: "The Geography of Disinvestment on Chicago's West Side",
    abstract:
      "An analysis of Home Owners' Loan Corporation grading maps and their correlation with present-day vacancy rates, school closures, and grocery store access in Austin, North Lawndale, and East Garfield Park.",
    full_content_markdown: [
      "## Introduction",
      "",
      "This report examines the continuing influence of 1930s federal housing policy on three West Side Chicago community areas: Austin, North Lawndale, and East Garfield Park. We matched Home Owners' Loan Corporation (HOLC) grading maps to contemporary parcel-level data on vacancy, school enrollment, and grocery access. The pattern that emerges is not nostalgic. It is current, measurable, and policy-relevant.",
      "",
      "## Methodology",
      "",
      "We digitized the 1940 HOLC Chicago security map[^1] and overlaid three present-day data layers: (1) Cook County Assessor vacancy counts from 2024, (2) Chicago Public Schools closure records from 2013 through 2024[^2], and (3) USDA Food Access Research Atlas tract-level designations. Census tracts that fell mostly or entirely within former \"D\" (red) grade zones in 1940 were compared to tracts in former \"A\" and \"B\" zones.",
      "",
      "## Findings",
      "",
      "The correlation is not a historical curiosity. Tracts graded D by HOLC in 1940 have, in 2024, **4.2x** the vacancy rate of tracts graded A, **3.1x** the likelihood of containing a school that closed in the 2013 wave, and **5.8x** the likelihood of being classified as a low-income, low-access food tract by the USDA.[^3]",
      "",
      "These are not abstract statistics. Austin lost nine of its twelve neighborhood grocery stores between 2005 and 2024. North Lawndale has a third of the school capacity it did in 2000. East Garfield Park has the highest residential vacancy rate of any community area on the near West Side.",
      "",
      "### A note on the 2013 school closure wave",
      "",
      "The 2013 Chicago Public Schools consolidation closed 49 schools in a single action, the largest such closure in the history of American public education.[^4] Forty-three of the 49 schools were in census tracts classified as D-grade by HOLC in 1940.",
      "",
      "## Recommendations",
      "",
      "We recommend the Chicago Department of Housing adopt a formal Disinvestment Reversal Framework that targets city subsidy dollars and TIF funds to tracts matching three criteria: (a) former HOLC D-grade status, (b) present-day vacancy above the Cook County median, and (c) designation as a low-access food tract.",
      "",
      "> The West Side was not abandoned by accident. It was disinvested by policy.",
      "",
      "## Conclusion",
      "",
      "Reversing the pattern requires naming it and directing city resources at it deliberately. Race-neutral investment criteria have produced race-disparate outcomes for ninety years. A framework that names former D-grade tracts as priority zones is not reverse discrimination. It is reverse disinvestment.",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Sarah Chen", "Marcus Williams"],
    reviewers: ["Dr. Amina Khatri", "Marcus Alvarez"],
    citations: [
      {
        id: "1",
        text: 'Nelson, Robert K., et al. "Mapping Inequality: Redlining in New Deal America." American Panorama, ed. Robert K. Nelson and Edward L. Ayers.',
        url: "https://dsl.richmond.edu/panorama/redlining/",
        accessed_date: "2025-11-14",
        type: "primary",
      },
      {
        id: "2",
        text: 'Chicago Public Schools. "School Actions Archive: 2013 Consolidation List." CPS Board of Education.',
        url: null,
        accessed_date: "2025-10-02",
        type: "primary",
      },
      {
        id: "3",
        text: 'United States Department of Agriculture, Economic Research Service. "Food Access Research Atlas." 2024 update.',
        url: "https://www.ers.usda.gov/data-products/food-access-research-atlas/",
        accessed_date: "2025-11-20",
        type: "primary",
      },
      {
        id: "4",
        text: "Ewing, Eve L. Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side. University of Chicago Press, 2018.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "5",
        text: "Hirsch, Arnold R. Making the Second Ghetto: Race and Housing in Chicago, 1940-1960. University of Chicago Press, 1998.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "6",
        text: "Satter, Beryl. Family Properties: How the Struggle over Race and Real Estate Transformed Chicago and Urban America. Metropolitan Books, 2009.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-12-14",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["austin-holc-grading", "north-lawndale-vacant-lots"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-2",
    slug: "obama-center-impact-zone-rent-pressure",
    title: "Rent Pressure in the Obama Presidential Center Impact Zone",
    abstract:
      "A year-over-year analysis of asking rents on Zillow, Craigslist, and city rental listing data in the half-mile ring around the Obama Presidential Center site, 2020 through 2025.",
    full_content_markdown: OBAMA_CENTER_BRIEF_BODY,
    topic: "Displacement",
    city: "chicago",
    format: "brief",
    authors: ["Sarah Chen"],
    reviewers: ["Marcus Alvarez", "Dr. Rachel Greenstein"],
    citations: [
      {
        id: "1",
        text: 'University of Chicago. "Obama Presidential Center Economic Impact Study." 2021.',
        url: null,
        accessed_date: "2025-09-10",
        type: "primary",
      },
      {
        id: "2",
        text: 'Zillow Group. "Zillow Research Data Portal — Rental Listing Archive."',
        url: "https://www.zillow.com/research/data/",
        accessed_date: "2025-12-01",
        type: "primary",
      },
      {
        id: "3",
        text: 'Institute for Housing Studies at DePaul University. "Housing Market Indicators: South Side Chicago, 2020–2024."',
        url: "https://www.housingstudies.org",
        accessed_date: "2025-10-15",
        type: "primary",
      },
      {
        id: "4",
        text: 'Been, Vicki, Ingrid Gould Ellen, and Katherine O\'Regan. "Gentrification and the Housing Crisis." NYU Furman Center, 2019.',
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-02-18",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["hyde-park-urban-renewal"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-3",
    slug: "pilsen-industrial-corridor-rezoning-review",
    title: "Pilsen Industrial Corridor: A Rezoning Retrospective",
    abstract:
      "A review of what happened after City Council tabled the 2025 application to rezone sixty-two parcels along the Pilsen Industrial Corridor from M2 manufacturing to B3 commercial. Documents the public comment pressure, the alderperson vote whip count, and the current status of the corridor.",
    full_content_markdown: PILSEN_INDUSTRIAL_CORRIDOR_BODY,
    topic: "Zoning",
    city: "chicago",
    format: "brief",
    authors: ["Marcus Williams"],
    reviewers: ["Jerome Pritchett", "Ibrahim Diallo"],
    citations: [
      {
        id: "1",
        text: "Chicago Committee on Zoning, Landmarks and Building Standards. \"Hearing Transcript, Application ZC-2025-0074.\"",
        url: null,
        accessed_date: "2025-06-22",
        type: "primary",
      },
      {
        id: "2",
        text: "Chicago Department of Planning and Development. \"Pilsen Industrial Corridor Existing Conditions Report.\" 2024.",
        url: null,
        accessed_date: "2025-03-12",
        type: "primary",
      },
      {
        id: "3",
        text: "Center for Neighborhood Technology. \"Chicago Industrial Corridor Analysis.\"",
        url: "https://www.cnt.org",
        accessed_date: "2025-04-08",
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-01-08",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["pilsen-anti-displacement-murals"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-4",
    slug: "cpd-traffic-stop-data-2024",
    title: "CPD Traffic Stop Data, 2024: A First Look at Publicly Released Records",
    abstract:
      "Chicago Police Department published quarterly traffic stop data for the first time in 2025. This analysis of the 2024 records documents the geographic concentration of stops, the racial composition of stopped drivers, and the contraband recovery rate across all twenty-two police districts.",
    full_content_markdown: CPD_TRAFFIC_STOP_BODY,
    topic: "Policing",
    city: "chicago",
    format: "data_analysis",
    authors: ["Marcus Williams", "Priya Desai"],
    reviewers: ["Ibrahim Diallo", "Dr. Rachel Greenstein"],
    citations: [
      {
        id: "1",
        text: 'Chicago Police Department. "2024 Traffic Stop Data Release — Quarterly Reports Q1–Q4." City of Chicago, 2025.',
        url: null,
        accessed_date: "2025-11-03",
        type: "primary",
      },
      {
        id: "2",
        text: "United States Census Bureau. \"2023 American Community Survey 5-Year Estimates, Chicago police district equivalents.\"",
        url: null,
        accessed_date: "2025-11-04",
        type: "primary",
      },
      {
        id: "3",
        text: "Pierson, Emma, et al. \"A large-scale analysis of racial disparities in police stops across the United States.\" Nature Human Behaviour, 2020.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-11-20",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: [],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-5",
    slug: "hyde-park-urban-renewal-oral-histories",
    title: "Hyde Park Urban Renewal: Six Oral Histories",
    abstract:
      "Six edited oral histories from residents who lived in Hyde Park before, during, and after the 1950s and 1960s urban renewal program. Transcribed and annotated with context on the program that displaced more than 40,000 Black residents from the near South Side.",
    full_content_markdown: HYDE_PARK_ORAL_HISTORY_FULL_BODY,
    topic: "Displacement",
    city: "chicago",
    format: "oral_history",
    authors: ["Dr. Sarah Oduya", "Leila Park"],
    reviewers: ["Dr. Sarah Oduya"],
    citations: [
      {
        id: "1",
        text: "Hirsch, Arnold R. Making the Second Ghetto: Race and Housing in Chicago, 1940-1960. University of Chicago Press, 1998.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "2",
        text: "Rotella, Carlo. World's Greatest City: Chicago and the Making of American Culture. University of Chicago Press, 2019.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "3",
        text: "Hyde Park Herald archive, 1958–1968. University of Chicago Library Special Collections.",
        url: null,
        accessed_date: "2024-11-02",
        type: "primary",
      },
      {
        id: "4",
        text: "City of Chicago Department of Urban Renewal. \"Hyde Park–Kenwood Renewal Plan.\" 1958.",
        url: null,
        accessed_date: "2025-02-18",
        type: "primary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-10-08",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["hyde-park-urban-renewal"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-6",
    slug: "1938-holc-chicago-map-annotated",
    title: "The 1938 HOLC Chicago Security Map, Annotated",
    abstract:
      "A primary source collection. The full 1938 Home Owners' Loan Corporation security map for Chicago, reproduced alongside the accompanying neighborhood-by-neighborhood Area Descriptions from the National Archives, with editorial annotations tying each description to present-day community area boundaries.",
    full_content_markdown: HOLC_MAP_FULL_BODY,
    topic: "Housing",
    city: "chicago",
    format: "primary_source_collection",
    authors: ["Rooted Forward Research Team"],
    reviewers: ["Dr. Sarah Oduya", "Dr. Amina Khatri"],
    citations: [
      {
        id: "1",
        text: 'Nelson, Robert K., et al. "Mapping Inequality: Redlining in New Deal America." American Panorama, ed. Robert K. Nelson and Edward L. Ayers.',
        url: "https://dsl.richmond.edu/panorama/redlining/",
        accessed_date: "2025-09-01",
        type: "primary",
      },
      {
        id: "2",
        text: "Home Owners' Loan Corporation. \"Area Descriptions: Chicago, Illinois.\" National Archives, Record Group 195, 1938.",
        url: null,
        accessed_date: "2025-09-04",
        type: "primary",
      },
      {
        id: "3",
        text: "Federal Housing Administration. \"Underwriting Manual.\" Washington: Government Printing Office, 1938.",
        url: null,
        accessed_date: "2025-09-04",
        type: "primary",
      },
      {
        id: "4",
        text: "Rothstein, Richard. The Color of Law: A Forgotten History of How Our Government Segregated America. Liveright, 2017.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-09-22",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["austin-holc-grading"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-7",
    slug: "school-closures-2013-and-after",
    title: "What Closed, What Stayed: The 2013 School Closures and the Eleven Years After",
    abstract:
      "Eleven years after the 2013 Chicago Public Schools consolidation closed 49 schools, this report tracks what happened to the buildings, the displaced students, and the neighborhoods. Uses CPS records, Chicago Public Library data, and a survey of former parents and teachers.",
    full_content_markdown: [
      "## Summary",
      "",
      "The 2013 consolidation was the largest single school-closure action in the history of American public education. Forty-nine schools closed. Forty-three were in communities classified as D-grade by HOLC in 1940. Eleven years on, the buildings, the students, and the neighborhoods have followed a pattern that is now documentable.",
      "",
      "## What happened to the buildings",
      "",
      "Of the 49 buildings:",
      "",
      "- 18 are vacant.",
      "- 11 were demolished.",
      "- 9 are occupied by charter schools.",
      "- 5 were converted to other CPS uses (central office, alternative schools).",
      "- 4 were sold to private developers.",
      "- 2 are community centers.",
      "",
      "The vacant buildings are concentrated in North Lawndale, Austin, East Garfield Park, and Auburn Gresham.",
      "",
      "## What happened to the students",
      "",
      "CPS's own tracking data, obtained through a 2024 FOIA request, shows that 29% of the students displaced by the 2013 closures did not enroll in a CPS school the following year.[^1] The \"welcoming school\" they were assigned to was, on average, 1.4 miles farther from home than the school they had attended. The cited rationale for the closures — consolidating into higher-quality welcoming schools — did not produce the promised quality uplift: by any measure CPS itself tracks, the welcoming schools performed within noise of the closed ones at the five-year mark.",
      "",
      "## What happened to the neighborhoods",
      "",
      "A closed school is a vacant building and a signal. Vacancy rates on blocks within one-quarter mile of a closed-school building rose 18% faster than the community-area average over the 2013–2024 period. Home sales slowed. Grocery stores, already thin, retreated further. The school was, in many of these neighborhoods, the last public institution.",
      "",
      "## Recommendations",
      "",
      "We recommend the CPS Board of Education adopt a standing moratorium on large-scale closure actions until a full accounting of the 2013 wave — tracking student enrollment, academic outcomes, building disposition, and neighborhood effects — has been completed and published. The current accounting is partial and has not been done by CPS itself in the eleven years since.",
    ].join("\n"),
    topic: "Education",
    city: "chicago",
    format: "report",
    authors: ["Priya Desai", "Sarah Chen"],
    reviewers: ["Dr. Amina Khatri", "Dr. Sarah Oduya"],
    citations: [
      {
        id: "1",
        text: 'Chicago Public Schools. "Post-Closure Student Tracking: Five-Year Review." Response to FOIA request #2024-04311.',
        url: null,
        accessed_date: "2024-12-15",
        type: "primary",
      },
      {
        id: "2",
        text: 'Chicago Public Library. "Branch and Community Indicators Dataset, 2013–2024."',
        url: "https://data.cityofchicago.org",
        accessed_date: "2025-02-04",
        type: "primary",
      },
      {
        id: "3",
        text: "Ewing, Eve L. Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side. University of Chicago Press, 2018.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "4",
        text: "Lipman, Pauline. The New Political Economy of Urban Education: Neoliberalism, Race, and the Right to the City. Routledge, 2011.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-08-30",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: [],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-8",
    slug: "cha-plan-for-transformation-retrospective",
    title: "The Chicago Housing Authority's Plan for Transformation, Twenty Years Later",
    abstract:
      "A twenty-year retrospective on the Plan for Transformation, the CHA program that demolished high-rise public housing and promised to replace it with mixed-income communities. Tracks what was built, who returned, and where the former residents live now.",
    full_content_markdown: [
      "## The Plan",
      "",
      "The Chicago Housing Authority announced the Plan for Transformation in 1999. The plan promised to demolish the high-rise public housing projects — Cabrini-Green, the Robert Taylor Homes, Stateway Gardens, and others — and rebuild them as mixed-income developments. Residents who complied with work and income requirements would have a right to return.[^1]",
      "",
      "By 2015, the high-rises were gone. By 2025, the plan is twenty years old.",
      "",
      "## What was built",
      "",
      "Of the 25,000 public housing units demolished under the Plan for Transformation, approximately 7,700 units of replacement public housing have been built as of 2025.[^2] The original target was 25,000 mixed-income units inclusive of public housing replacements. The actual total across all categories is approximately 12,400.",
      "",
      "## Who returned",
      "",
      "CHA's own records show that of the roughly 17,000 families who were living in the demolished high-rises in 1999, approximately 2,100 families now live in a replacement mixed-income development.[^3] The remaining families either moved into scattered-site public housing, received a Housing Choice Voucher, or lost their housing assistance entirely.",
      "",
      "The return rate — from demolition to the replacement community on the same site — is approximately 12 percent.",
      "",
      "## Where the former residents live now",
      "",
      "Voucher-holding former CHA residents cluster in a handful of South Side and West Side community areas, many of which are themselves facing disinvestment. Twenty-three percent of Housing Choice Voucher households live in census tracts where 40 percent or more of residents are below the federal poverty line.\n\nThe geographic dispersal promised by the voucher program did not, at the scale CHA projected, produce neighborhood integration.",
      "",
      "## Recommendations",
      "",
      "We do not recommend a new large-scale transformation program. We recommend CHA (a) complete the remaining 17,300 unbuilt units of the original plan on an accelerated schedule, and (b) commission a fully independent twenty-five-year evaluation to be published in 2029.",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Marcus Williams", "Leila Park"],
    reviewers: ["Marcus Alvarez", "Dr. Sarah Oduya", "Jerome Pritchett"],
    citations: [
      {
        id: "1",
        text: 'Chicago Housing Authority. "Plan for Transformation, FY2000–FY2009.". Chicago, 1999.',
        url: null,
        accessed_date: "2025-06-01",
        type: "primary",
      },
      {
        id: "2",
        text: 'Chicago Housing Authority. "Plan for Transformation Progress Report, FY2024." Chicago, 2024.',
        url: null,
        accessed_date: "2025-05-28",
        type: "primary",
      },
      {
        id: "3",
        text: "Chicago Housing Authority. \"Resident Relocation Database.\" Response to FOIA request #2025-01108.",
        url: null,
        accessed_date: "2025-04-14",
        type: "primary",
      },
      {
        id: "4",
        text: "Venkatesh, Sudhir. American Project: The Rise and Fall of a Modern Ghetto. Harvard University Press, 2000.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "5",
        text: "Popkin, Susan J. No Simple Solutions: Transforming Public Housing in Chicago. Rowman & Littlefield, 2016.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-07-15",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: [],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-9",
    slug: "austin-cba-playbook",
    title: "A Community Benefits Agreement Playbook for Austin",
    abstract:
      "A practical guide for Austin community organizations preparing to negotiate community benefits agreements with developers. Covers coalition building, negotiation strategy, enforcement mechanisms, and post-signing monitoring.",
    full_content_markdown: AUSTIN_CBA_PLAYBOOK_BODY,
    topic: "Economic Development",
    city: "chicago",
    format: "report",
    authors: ["Rooted Forward Research Team", "Leila Park"],
    reviewers: ["Jerome Pritchett", "Ibrahim Diallo", "Marcus Alvarez"],
    citations: [
      {
        id: "1",
        text: "Gross, Julian, Greg LeRoy, and Madeline Janis-Aparicio. \"Community Benefits Agreements: Making Development Projects Accountable.\" Good Jobs First and the California Partnership for Working Families, 2005.",
        url: null,
        accessed_date: "2025-11-02",
        type: "secondary",
      },
      {
        id: "2",
        text: "Partnership for Working Families. \"Community Benefits Agreements: The Power, Practice, and Promise of a Responsible Development Tool.\" 2016.",
        url: null,
        accessed_date: "2025-11-10",
        type: "secondary",
      },
      {
        id: "3",
        text: "Chicago Department of Housing. \"Affordable Requirements Ordinance: Administrative Rules and Regulations.\" City of Chicago, 2024.",
        url: null,
        accessed_date: "2025-10-15",
        type: "primary",
      },
      {
        id: "4",
        text: "Austin Coming Together. \"Austin Quality-of-Life Plan 2018-2028.\" Austin, Chicago.",
        url: null,
        accessed_date: "2025-09-18",
        type: "primary",
      },
      {
        id: "5",
        text: "Saegert, Susan, and Gary Winkel. \"Paths to Community Empowerment: Organizing at Home.\" American Journal of Community Psychology, 1996.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-03-05",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["austin-holc-grading"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-10",
    slug: "bronzeville-tif-expenditure-analysis",
    title: "Twenty-Three Years of Bronzeville TIF: A Lifetime Expenditure Analysis",
    abstract:
      "A data analysis of every dollar raised and spent by the Bronzeville Tax Increment Financing district from its 2002 designation through the 2025 reporting year. Finds that 40 percent of the district's $318 million in revenue has been spent inside Bronzeville, with the balance transferred to adjacent districts or reclassified as regionally significant.",
    full_content_markdown: BRONZEVILLE_TIF_ANALYSIS_BODY,
    topic: "Economic Development",
    city: "chicago",
    format: "data_analysis",
    authors: ["Priya Desai", "Marcus Williams", "Sarah Chen"],
    reviewers: ["Dr. Amina Khatri", "Marcus Alvarez", "Ibrahim Diallo"],
    citations: [
      {
        id: "1",
        text: "Cook County Clerk. \"TIF Reports, 2002-2024.\" Annual publication.",
        url: "https://www.cookcountyclerkil.gov/service/tif-reports",
        accessed_date: "2025-12-10",
        type: "primary",
      },
      {
        id: "2",
        text: "Chicago Department of Finance. \"Annual Financial Analysis.\" City of Chicago.",
        url: null,
        accessed_date: "2025-12-11",
        type: "primary",
      },
      {
        id: "3",
        text: "Chicago TIF Task Force. \"Final Report and Recommendations.\" City of Chicago, 2018.",
        url: null,
        accessed_date: "2025-11-14",
        type: "primary",
      },
      {
        id: "4",
        text: "Weber, Rachel. \"Equity and Entrepreneurialism: The Impact of Tax Increment Financing on School Finance.\" Urban Affairs Review, 2003.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "5",
        text: "Civic Lab Chicago. \"The TIF Illumination Project.\"",
        url: "https://www.civiclabchicago.org",
        accessed_date: "2025-10-28",
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-02-28",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: [],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-11",
    slug: "west-side-grocery-access-oral-histories",
    title: "West Side Grocery Access: Ten Oral Histories, 2024-2025",
    abstract:
      "Edited oral histories from ten Austin, North Lawndale, East Garfield Park, and West Garfield Park residents documenting the lived experience of the West Side's grocery gap. Companion to our geographic and economic analysis of West Side food access.",
    full_content_markdown: WEST_SIDE_GROCERY_ORAL_HISTORY_BODY,
    topic: "Economic Development",
    city: "chicago",
    format: "oral_history",
    authors: ["Dr. Sarah Oduya", "Leila Park", "Priya Desai"],
    reviewers: ["Dr. Sarah Oduya", "Marcus Alvarez"],
    citations: [
      {
        id: "1",
        text: "Rooted Forward Research Team. \"West Side Grocery Access: A Geographic and Economic Analysis.\" Rooted Forward, 2025.",
        url: null,
        accessed_date: null,
        type: "primary",
      },
      {
        id: "2",
        text: "United States Department of Agriculture, Economic Research Service. \"Food Access Research Atlas.\"",
        url: "https://www.ers.usda.gov/data-products/food-access-research-atlas/",
        accessed_date: "2025-08-14",
        type: "primary",
      },
      {
        id: "3",
        text: "Beaulac, Julie, Elizabeth Kristjansson, and Steven Cummins. \"A Systematic Review of Food Deserts, 1966-2007.\" Preventing Chronic Disease, 2009.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "4",
        text: "Rose, Donald, and Rickelle Richards. \"Food Store Access and Household Fruit and Vegetable Use Among Participants in the US Food Stamp Program.\" Public Health Nutrition, 2004.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-04-14",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["north-lawndale-vacant-lots"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-12",
    slug: "cook-county-property-tax-appeal-disparity",
    title: "The Cook County Property Tax Appeal Gap: A Decade of Data",
    abstract:
      "An analysis of ten years of Cook County property tax appeal data finds that homeowners in majority-white census tracts file appeals at 2.4x the rate of majority-Black tracts and succeed at 1.8x the rate. The combined effect is a measurable racial disparity in effective property tax burden.",
    full_content_markdown: PROPERTY_TAX_APPEAL_DISPARITY_BODY,
    topic: "Housing",
    city: "chicago",
    format: "data_analysis",
    authors: ["Marcus Williams", "Priya Desai"],
    reviewers: ["Dr. Amina Khatri", "Marcus Alvarez", "Ibrahim Diallo"],
    citations: [
      {
        id: "1",
        text: "Cook County Assessor. \"Residential Property Appeal Records, 2015-2024.\" Response to FOIA request #2024-09217.",
        url: null,
        accessed_date: "2025-09-22",
        type: "primary",
      },
      {
        id: "2",
        text: "Cook County Board of Review. \"Appeal Decision Records, 2015-2024.\"",
        url: null,
        accessed_date: "2025-09-22",
        type: "primary",
      },
      {
        id: "3",
        text: "United States Census Bureau. \"American Community Survey 2023 Five-Year Estimates: Census Tracts in Cook County, Illinois.\"",
        url: null,
        accessed_date: "2025-10-02",
        type: "primary",
      },
      {
        id: "4",
        text: "Cook County Assessor. \"Residential Assessment Equity Audit.\" 2019.",
        url: null,
        accessed_date: "2025-09-01",
        type: "primary",
      },
      {
        id: "5",
        text: "Ross, Stephen L., and John Yinger. \"The Color of Credit: Mortgage Discrimination, Research Methodology, and Fair-Lending Enforcement.\" MIT Press, 2002.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "6",
        text: "Avenancio-Leon, Carlos Fernando, and Troup Howard. \"The Assessment Gap: Racial Inequalities in Property Taxation.\" Quarterly Journal of Economics, 2022.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-04-02",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: [],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-13",
    slug: "cross-bronx-expressway-sixty-years-later",
    title: "The Cross-Bronx Expressway: Sixty Years of Downstream Effects",
    abstract:
      "A fresh analysis of the Cross-Bronx Expressway using 1945 condemnation records, 1960-1980 census data, and 2023 air quality, noise, and asthma hospitalization records. Documents the continuous causal chain from the 1948 planning decision to the present-day health and environmental burden on adjacent Bronx neighborhoods.",
    full_content_markdown: CROSS_BRONX_EXPRESSWAY_BODY,
    topic: "Housing",
    city: "new-york",
    format: "report",
    authors: ["Dr. Amina Khatri", "Marcus Williams"],
    reviewers: ["Dr. Rachel Greenstein", "Dr. Sarah Oduya"],
    citations: [
      {
        id: "1",
        text: "Caro, Robert A. The Power Broker: Robert Moses and the Fall of New York. Alfred A. Knopf, 1974.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "2",
        text: "New York State Department of Health. \"Environmental Public Health Tracking System: Air Quality Module.\"",
        url: "https://www.health.ny.gov/environmental/public_health_tracking/",
        accessed_date: "2025-12-04",
        type: "primary",
      },
      {
        id: "3",
        text: "World Health Organization. \"Environmental Noise Guidelines for the European Region.\" 2018.",
        url: null,
        accessed_date: "2025-11-21",
        type: "primary",
      },
      {
        id: "4",
        text: "New York City Municipal Archives. \"Triborough Bridge and Tunnel Authority: Cross-Bronx Expressway Condemnation Files, 1948-1955.\"",
        url: null,
        accessed_date: "2025-10-08",
        type: "primary",
      },
      {
        id: "5",
        text: "Gonzalez, Evelyn. The Bronx. Columbia University Press, 2006.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "6",
        text: "Sze, Julie. Noxious New York: The Racial Politics of Urban Health and Environmental Justice. MIT Press, 2007.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-01-28",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["cross-bronx-expressway"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-14",
    slug: "fillmore-forty-years-after-redevelopment",
    title: "The Fillmore, Forty Years After Redevelopment",
    abstract:
      "A retrospective on the San Francisco Redevelopment Agency's Fillmore and Western Addition urban renewal program (1948-1973), tracing the forty years that followed the demolition and examining the partial remedies, including the Certificates of Preference program, that have been implemented since.",
    full_content_markdown: FILLMORE_REDEVELOPMENT_BODY,
    topic: "Displacement",
    city: "san-francisco",
    format: "report",
    authors: ["Dr. Sarah Oduya", "Rooted Forward Research Team"],
    reviewers: ["Dr. Amina Khatri", "Marcus Alvarez", "Jerome Pritchett"],
    citations: [
      {
        id: "1",
        text: "San Francisco Redevelopment Agency. \"Western Addition Redevelopment Plan, Project A-1.\" City of San Francisco, 1949.",
        url: null,
        accessed_date: "2025-07-18",
        type: "primary",
      },
      {
        id: "2",
        text: "San Francisco Mayor's Office of Housing and Community Development. \"Certificate of Preference Program: Annual Reports, 2008-2024.\"",
        url: null,
        accessed_date: "2025-09-30",
        type: "primary",
      },
      {
        id: "3",
        text: "Pepin, Elizabeth, and Lewis Watts. Harlem of the West: The San Francisco Fillmore Jazz Era. Chronicle Books, 2006.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "4",
        text: "Fulton, William. The Reluctant Metropolis: The Politics of Urban Growth in Los Angeles. Solano Press, 1997.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "5",
        text: "San Francisco Public Library. \"San Francisco Redevelopment Agency Records, 1948-2012.\" History Center collection.",
        url: null,
        accessed_date: "2025-08-12",
        type: "primary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2025-12-22",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["fillmore-urban-renewal"],
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "re-15",
    slug: "fair-park-and-the-neighborhoods-it-displaced",
    title: "Fair Park and the Neighborhoods It Displaced: A Ninety-Year History",
    abstract:
      "A brief on the seven-decade history of Fair Park's acquisitions in south Dallas, the neighborhoods cleared for the 1936 Texas Centennial Exposition and the 1958-1966 expansions, and the contemporary Fair Park First redevelopment framework.",
    full_content_markdown: DALLAS_FAIR_PARK_BODY,
    topic: "Displacement",
    city: "dallas",
    format: "brief",
    authors: ["Priya Desai", "Leila Park"],
    reviewers: ["Dr. Sarah Oduya", "Jerome Pritchett"],
    citations: [
      {
        id: "1",
        text: "Phillips, Michael. White Metropolis: Race, Ethnicity, and Religion in Dallas, 1841-2001. University of Texas Press, 2006.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "2",
        text: "Neighborhood Atlas. \"Area Deprivation Index, 2023 Release.\" University of Wisconsin School of Medicine and Public Health.",
        url: "https://www.neighborhoodatlas.medicine.wisc.edu/",
        accessed_date: "2025-10-02",
        type: "primary",
      },
      {
        id: "3",
        text: "Dallas Morning News Archives, 1936-1966. Dallas Public Library.",
        url: null,
        accessed_date: "2025-08-20",
        type: "primary",
      },
      {
        id: "4",
        text: "Fair Park First. \"Fair Park Master Plan 2020-2030.\" Dallas, 2020.",
        url: null,
        accessed_date: "2025-09-14",
        type: "primary",
      },
      {
        id: "5",
        text: "Bezdek, Barbara L. \"Citizen Engagement in the Shrinking City: Toward Development Justice in an Era of Growing Inequality.\" St. Louis University Public Law Review, 2014.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
    ],
    pdf_url: null,
    cover_image_url: null,
    published_date: "2026-03-12",
    status: "published",
    related_campaign_ids: [],
    related_tour_slugs: ["freedmans-cemetery"],
    created_at: nowIso,
    updated_at: nowIso,
  },
];

/* ------------------------------------------------------------------ */
/*  Placeholder industry directors                                     */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_INDUSTRY_DIRECTORS: IndustryDirector[] = [
  {
    id: "id-1",
    slug: "dr-amina-khatri",
    full_name: "Dr. Amina Khatri",
    title: "Associate Professor of Urban Planning",
    affiliation: "University of Illinois Chicago",
    bio: "Amina reviews our quantitative methodology — the way we handle census tract comparisons, parcel-level property value analyses, and the aggregation of ward-level CPD data. She has been a primary methodology reviewer on every data analysis we have published since 2024. Her own work on spatial inequality in Midwest cities directly informed our approach to the Obama Center impact zone report.",
    photo_url: null,
    website_url: "https://www.aminakhatri.com",
    institutional_url: "https://cuppa.uic.edu/faculty/amina-khatri",
    linkedin_url: "https://www.linkedin.com/in/amina-khatri",
    focus_areas: ["Spatial inequality", "Housing policy", "Quantitative methods"],
    display_order: 10,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-2",
    slug: "marcus-alvarez",
    full_name: "Marcus Alvarez",
    title: "Senior Housing Policy Analyst",
    affiliation: "Institute for Housing Studies at DePaul University",
    bio: "Marcus connects our research to the housing policy conversation happening at the city level. He reads our briefs before they are published, flags claims that will not survive a hearing, and pushes us to cite the original source rather than a summary. His monthly housing data releases are a standing input to our Chicago displacement tracker.",
    photo_url: null,
    website_url: null,
    institutional_url: "https://www.housingstudies.org/about/staff/marcus-alvarez",
    linkedin_url: "https://www.linkedin.com/in/marcus-alvarez-ihs",
    focus_areas: [
      "Housing policy",
      "Displacement",
      "Community benefits agreements",
    ],
    display_order: 20,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-3",
    slug: "dr-sarah-oduya",
    full_name: "Dr. Sarah Oduya",
    title: "Professor of African American Studies",
    affiliation: "Northwestern University",
    bio: "Sarah helps us place contemporary data in its proper historical frame. When we publish a piece on school closures, she is the one who points out which policies from the 1960s and 1970s produced the present pattern. She has reviewed every oral history project we have published and writes the foreword to our upcoming collection on displacement in East Garfield Park.",
    photo_url: null,
    website_url: "https://www.sarahoduya.com",
    institutional_url:
      "https://afam.northwestern.edu/people/faculty/core/sarah-oduya.html",
    linkedin_url: null,
    focus_areas: ["Urban history", "Oral history", "Black Chicago"],
    display_order: 30,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-4",
    slug: "jerome-pritchett",
    full_name: "Jerome Pritchett",
    title: "Principal Architect and Planning Director",
    affiliation: "Pritchett + Olagun Studio",
    bio: "Jerome brings a practitioner's eye to our work. He reviews proposals before they reach decision-makers and tells us when a policy recommendation is technically unworkable. His critique of our first draft of the Pilsen Industrial Corridor report led us to revise three of our recommendations and produced the strongest version of that document.",
    photo_url: null,
    website_url: "https://www.pritchettolagun.com",
    institutional_url: null,
    linkedin_url: "https://www.linkedin.com/in/jerome-pritchett",
    focus_areas: ["Urban design", "Zoning", "Community planning"],
    display_order: 40,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-5",
    slug: "dr-rachel-greenstein",
    full_name: "Dr. Rachel Greenstein",
    title: "Research Director",
    affiliation: "Metropolitan Planning Council",
    bio: "Rachel oversees MPC's regional research portfolio and has served as an external reviewer on our last three data-heavy reports. She challenges us on methodology and brings a regional perspective that keeps our Chicago analyses honest about suburban and collar-county dynamics.",
    photo_url: null,
    website_url: null,
    institutional_url:
      "https://www.metroplanning.org/about/staff/rachel-greenstein",
    linkedin_url: "https://www.linkedin.com/in/rachel-greenstein-mpc",
    focus_areas: ["Regional planning", "Transit equity", "Fair housing"],
    display_order: 50,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-6",
    slug: "ibrahim-diallo",
    full_name: "Ibrahim Diallo",
    title: "Attorney and Adjunct Faculty",
    affiliation: "Chicago-Kent College of Law",
    bio: "Ibrahim reviews the legal framework of every policy proposal before it goes to an alderperson's office. He pressure-tests whether a recommendation is within municipal authority and flags preemption issues before they become embarrassments. His Illinois Municipal Code clinic has saved us from three incorrect citations in the past eighteen months.",
    photo_url: null,
    website_url: null,
    institutional_url: "https://www.kentlaw.iit.edu/faculty/ibrahim-diallo",
    linkedin_url: "https://www.linkedin.com/in/ibrahim-diallo-esq",
    focus_areas: ["Municipal law", "Land use law", "Zoning reform"],
    display_order: 60,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-7",
    slug: "dr-tomas-ortega",
    full_name: "Dr. Tomás Ortega",
    title: "Associate Professor of Public Health",
    affiliation: "Rush University Medical Center",
    bio: "Tomás leads our epidemiological review when a research project touches health outcomes — asthma hospitalizations near traffic corridors, lead exposure in pre-1978 housing, food access in disinvested neighborhoods. He is one of three reviewers who reads every Rooted Forward report that involves a claim about population health, and his pressure on our methodology is what keeps our health claims defensible under scrutiny.",
    photo_url: null,
    website_url: null,
    institutional_url: "https://www.rush.edu/faculty/tomas-ortega",
    linkedin_url: "https://www.linkedin.com/in/tomas-ortega-rush",
    focus_areas: [
      "Environmental epidemiology",
      "Urban health disparities",
      "Community-engaged research",
    ],
    display_order: 70,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-8",
    slug: "janelle-washington",
    full_name: "Janelle Washington",
    title: "Deputy Commissioner, Department of Community Development",
    affiliation: "City of Chicago (in her personal capacity)",
    bio: "Janelle serves in her personal capacity — she has recused herself from any Rooted Forward-city interactions involving her agency. She reviews our municipal implementation recommendations for realism. When we recommend that a city department do something, Janelle tells us whether the recommendation is technically feasible, legally permissible, and within the realistic scope of the department's capacity. She has turned three of our recommendations into stronger, more actionable versions over the past two years.",
    photo_url: null,
    website_url: null,
    institutional_url: null,
    linkedin_url: "https://www.linkedin.com/in/janelle-washington-dcd",
    focus_areas: [
      "Municipal implementation",
      "Community development finance",
      "Administrative law",
    ],
    display_order: 80,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-9",
    slug: "dr-henry-liu",
    full_name: "Dr. Henry Liu",
    title: "Professor of Sociology",
    affiliation: "Loyola University Chicago",
    bio: "Henry is our qualitative methodology reviewer. When we conduct oral histories, he reads the transcript protocol, the interview guides, and the final edits to check for narrator consent, redacted material, and the handling of second-person identification. His careful read of the Hyde Park Urban Renewal oral history collection caught two cases where a narrator's privacy would have been inadvertently compromised, and we restructured the final published text accordingly.",
    photo_url: null,
    website_url: "https://www.henryliusociology.com",
    institutional_url: "https://www.luc.edu/sociology/faculty/henry-liu.shtml",
    linkedin_url: null,
    focus_areas: [
      "Qualitative research methods",
      "Urban sociology",
      "Asian American studies",
    ],
    display_order: 90,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-10",
    slug: "reverend-antoine-jeffries",
    full_name: "Reverend Antoine Jeffries",
    title: "Senior Pastor",
    affiliation: "Third Unitarian Church of Chicago",
    bio: "Antoine is our community partnership director. He is not a researcher; he is an organizer of forty-one years' experience, and he is the first person we consult before publishing any research on the Austin community area. He tells us whether our findings track what residents are experiencing, which recommendations will be welcomed and which will read as condescension, and which community partners we should be consulting that we have not thought of. His relationship with the Austin Coming Together quality-of-life planning process is the backbone of our Austin work.",
    photo_url: null,
    website_url: null,
    institutional_url: "https://www.thirdunitarian.org/minister",
    linkedin_url: null,
    focus_areas: [
      "Community organizing",
      "Austin community area",
      "Congregation-based coalitions",
    ],
    display_order: 100,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-11",
    slug: "fiona-murphy",
    full_name: "Fiona Murphy",
    title: "Investigative Reporter",
    affiliation: "The Chicago Reader (in her personal capacity)",
    bio: "Fiona covers housing, policing, and city hall for the Chicago Reader. She reviews our data-heavy reports for the question she asks of every source: *what will readers find surprising, confusing, or suspect, and is our text ready for them?* She is not a formal academic reviewer. She is the reader who will see this report in its final form with no prior context, and her test of whether it communicates clearly is a test we have come to rely on.",
    photo_url: null,
    website_url: null,
    institutional_url: null,
    linkedin_url: "https://www.linkedin.com/in/fiona-murphy-reader",
    focus_areas: [
      "Investigative journalism",
      "Housing and homelessness",
      "Public records",
    ],
    display_order: 110,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
  {
    id: "id-12",
    slug: "dr-nandini-rao",
    full_name: "Dr. Nandini Rao",
    title: "Research Scientist",
    affiliation: "Argonne National Laboratory",
    bio: "Nandini leads Argonne's urban data science group and is on our technical advisory list for any project that requires non-trivial data engineering. She was the reviewer who suggested we switch the CPD traffic stop analysis from tract-level to beat-level geography, which produced a materially stronger paper. She reads our methodology sections line-by-line and tells us which steps will produce silent errors in replication.",
    photo_url: null,
    website_url: null,
    institutional_url: "https://www.anl.gov/profile/nandini-rao",
    linkedin_url: "https://www.linkedin.com/in/nandini-rao-argonne",
    focus_areas: [
      "Urban data science",
      "Computational methodology",
      "Open-source data pipelines",
    ],
    display_order: 120,
    is_active: true,
    created_at: nowIso,
    updated_at: nowIso,
  },
];

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
  limit: number = 3
): ResearchEntry[] {
  return allEntries
    .filter(
      (e) =>
        e.id !== entry.id &&
        e.status === "published" &&
        (e.topic === entry.topic || e.city === entry.city)
    )
    .sort((a, b) => {
      const topicScoreA = a.topic === entry.topic ? 2 : 0;
      const topicScoreB = b.topic === entry.topic ? 2 : 0;
      const cityScoreA = a.city === entry.city ? 1 : 0;
      const cityScoreB = b.city === entry.city ? 1 : 0;
      const scoreDiff =
        topicScoreB + cityScoreB - (topicScoreA + cityScoreA);
      if (scoreDiff !== 0) return scoreDiff;
      return (
        new Date(b.published_date).getTime() -
        new Date(a.published_date).getTime()
      );
    })
    .slice(0, limit);
}
