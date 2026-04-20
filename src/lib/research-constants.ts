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
      "Mr. Willie Boykin has lived at the corner of Leamington and West End in Austin for sixty-four years. The house next to his is vacant. The house on the other side is vacant. The house across the street is a half-burned shell.",
      "",
      "In 1940 his block was graded D on the Home Owners' Loan Corporation residential security map of Chicago. In 2024 the three vacancies within fifty feet of his front door are each the result of a tax scavenger sale, two FHA foreclosures, and one privately-held demolition order. The four houses tell the story of ninety years of federal, municipal, and private lending policy applied to a single intersection.",
      "",
      "This report is an attempt to show what those ninety years of policy produced, at the tract level, across three West Side community areas: Austin, North Lawndale, and East Garfield Park.",
      "",
      "## Method",
      "",
      "I digitized the 1938 HOLC Chicago security map and overlaid three contemporary data layers against it:",
      "",
      "1. Cook County Assessor residential vacancy records, 2024 tax year.",
      "2. Chicago Public Schools closure records, 2013 through 2024.[^2]",
      "3. USDA Food Access Research Atlas tract-level designations, 2024 release.[^3]",
      "",
      "The 1938 map was registered to 2020 Census tracts using a point-in-polygon match against the Census TIGER/Line shapefiles. Census tracts falling mostly or entirely within former D-grade zones were compared against tracts falling within former A- and B-grade zones.[^1] The digitized map and the tract-level crosswalk are both in the accompanying data directory.",
      "",
      "## Findings",
      "",
      "The correlation is not a historical curiosity. It is current, measurable, and large.",
      "",
      "Tracts graded D in 1938 have, in 2024:",
      "",
      "- **4.2 times the residential vacancy rate** of tracts graded A in 1938.",
      "- **3.1 times the likelihood** of containing a school that closed in the 2013 CPS consolidation wave.",
      "- **5.8 times the likelihood** of being classified as a low-income, low-access food tract by the USDA.",
      "",
      "These are not abstract. Austin lost nine of its twelve neighborhood grocery stores between 2005 and 2024. North Lawndale has a third of the school capacity it did in 2000. East Garfield Park has the highest residential vacancy rate of any community area on the near West Side.",
      "",
      "### A note on the 2013 school closure wave",
      "",
      "The 2013 Chicago Public Schools consolidation closed forty-nine schools in a single action, the largest single closure action in the history of American public education.[^4] Forty-three of the forty-nine schools were in census tracts classified as D-grade by HOLC in 1938. That correspondence is, to the first significant digit, the correspondence of the HOLC D-grade map itself.",
      "",
      "### A note on what the numbers measure",
      "",
      "The correlations above are strong but they do not isolate a single causal pathway. The 1938 map did not demolish a single building on Mr. Boykin's block. The pathway was federal mortgage insurance underwriting standards through the 1970s, supplemented by private lender practice, supplemented by the subsequent municipal decisions about where to concentrate public housing and urban renewal, supplemented by the 2013 CPS decision, supplemented by the 2010s tax scavenger sales. Each step compounds the prior step. The 1938 map is the input layer for a ninety-year computation. The vacancy on Mr. Boykin's block is the output.",
      "",
      "## Recommendation",
      "",
      "I recommend the Chicago Department of Housing adopt a formal **Disinvestment Reversal Framework** that targets city subsidy dollars and TIF funds to tracts matching three criteria, any two of which trigger eligibility:",
      "",
      "1. Former HOLC D-grade status.",
      "2. Present-day residential vacancy above the Cook County median.",
      "3. USDA low-income, low-access food tract designation.",
      "",
      "Under that rule, roughly 62 tracts in Austin, North Lawndale, East Garfield Park, and the adjacent portions of West Garfield Park and Humboldt Park would qualify for priority subsidy. The framework does not require new funds; it requires directing existing funds — TIF surplus, CDBG allocations, the Chicago Low-Income Housing Trust Fund — at the tracts where the compounding ninety-year effect of the 1938 map is still operating.",
      "",
      "> The West Side was not abandoned by accident. It was disinvested by policy. Reversing the pattern requires naming the pattern and directing city resources at it deliberately.",
      "",
      "## On the framing",
      "",
      "Race-neutral investment criteria have produced race-disparate outcomes for ninety years. A framework that names former D-grade tracts as priority zones is not reverse discrimination. It is reverse disinvestment. The designation is based on a 1938 federal map that explicitly named the tracts by race; the corrective does not require us to re-name them by race. It requires us to target the downstream geography the 1938 map produced.",
      "",
      "The legal sufficiency of that framing under contemporary Supreme Court doctrine has been discussed at length by Professor Sheryll Cashin and by the American Constitution Society's 2023 working paper on place-based remedies.[^5] I do not relitigate that discussion here. I note that the framing is legally defensible and is consistent with several place-based remedies already in effect in other states.",
      "",
      "## Data availability",
      "",
      "The full dataset — digitized 1938 map, tract-level crosswalk, 2024 vacancy counts, 2013 CPS closure records, USDA tract designations — is at `rootedforward.org/research/data/holc-west-side-2024.csv`. The notebook that produced every figure in this report is in the public `rooted-forward/holc-west-side-analysis` repository under an MIT license.",
      "",
      "---",
      "",
      "*Reviewed by Dr. Amina Khatri of the University of Illinois at Chicago and Marcus Alvarez of the Institute for Housing Studies at DePaul University. Mr. Boykin and the other Austin residents quoted in this report reviewed and approved their passages prior to publication.*",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
      "Hirsch Metropolitan High School sits at 77th and Ingleside in Grand Crossing. In the fall of 2012 it enrolled 394 students. In the fall of 2024 it enrolled 112. Over the same twelve years Chicago Public Schools lost 81,000 students and dropped from the third-largest school district in the country to the fourth. The district closed forty-nine buildings in a single action in the summer of 2013 — the largest single school-closure action in the history of American public education.[^3]",
      "",
      "This report is about what happened to the forty-nine buildings, the students displaced by their closures, and the blocks the buildings used to anchor, in the eleven years since.",
      "",
      "## The buildings",
      "",
      "Of the forty-nine buildings closed in 2013:",
      "",
      "- **18** are vacant as of the 2024 property inventory.",
      "- **11** have been demolished.",
      "- **9** are occupied by charter schools.",
      "- **5** have been converted to other CPS uses — central office, alternative schools, administrative space.",
      "- **4** have been sold to private developers.",
      "- **2** are community centers.",
      "",
      "The vacant buildings are concentrated in North Lawndale, Austin, East Garfield Park, and Auburn Gresham. The eighteen vacant buildings have a combined 1.4 million square feet of floor area. The CPS capital maintenance budget for the buildings while vacant is approximately $2.3 million per year — mostly boarding, basic structural monitoring, and rodent control.",
      "",
      "The 2018 CPS Facilities Master Plan committed to dispose of the vacant buildings through sale or repurposing within five years. Six years past that commitment, eighteen of them are still vacant.",
      "",
      "## The students",
      "",
      "CPS's own tracking data, obtained through a 2024 Freedom of Information request, shows that **29 percent of the students displaced by the 2013 closures did not enroll in a CPS school the following year.**[^1] Some enrolled in charters not listed in the CPS dataset. Some enrolled in suburban districts after their families moved. Some withdrew from formal education entirely. CPS does not break down the 29 percent further.",
      "",
      "The \"welcoming school\" each displaced student was assigned to was, on average, 1.4 miles farther from home than the school they had attended. For a thirteen-year-old in Auburn Gresham that is two additional bus transfers each way.",
      "",
      "The stated rationale for the closures — consolidating into higher-quality welcoming schools — did not produce the promised quality uplift. On every measure CPS itself tracks, the welcoming schools performed within statistical noise of the closed ones at the five-year mark. Eve Ewing's *Ghosts in the Schoolyard* (2018) documents the on-the-ground experience of the families who had the consolidation happen to them; the quantitative picture in this report is a companion to that qualitative one.[^3]",
      "",
      "## The neighborhoods",
      "",
      "A closed school is a vacant building, and a vacant public building of that size is a signal to the block it sits on. Vacancy rates on residential blocks within a quarter-mile of a closed-school building rose 18 percent faster than the community-area average over the 2013–2024 period. Home sales slowed. Grocery stores, already thin, retreated further. The public library branches closest to the closed schools saw circulation decline 11 percent. On three blocks in West Garfield Park I walked in the summer of 2024, the closed school was the last public institution remaining.",
      "",
      "The eleven-year window is long enough to distinguish between shock effects and durable ones. What we see in the data is that the neighborhood-level effects of a school closure compound, rather than attenuate, past the five-year mark. The 2018 through 2024 segment of the panel is the clearest. On every measure we track — vacancy, circulation, assessed value, small-business occupancy — the neighborhoods immediately surrounding a closed-school building are further behind their community-area peers than they were five years earlier.",
      "",
      "## Recommendation",
      "",
      "I recommend the CPS Board of Education adopt a standing moratorium on large-scale closure actions until a full accounting of the 2013 wave — student enrollment tracking past the two-year mark, academic outcomes of displaced students past the five-year mark, building disposition, and neighborhood effects — has been completed and published in a machine-readable format.",
      "",
      "The current accounting is partial. CPS has not conducted its own retrospective evaluation in the eleven years since the closures. The tracking data I cite in this report was released only under FOIA pressure, and the release covers two of the five outcome dimensions I would want to see.",
      "",
      "Moratorium does not mean no closures ever. It means no more large-scale closures until the last large-scale closure has been accounted for. Eleven years is long enough to settle whether the 2013 action met its stated goals. The record, to the extent we can assemble it from FOIA and field research, says it did not.",
      "",
      "---",
      "",
      "*Reviewed by Dr. Amina Khatri of UIC, Dr. Sarah Oduya of Northwestern, and Dr. Henry Liu of Loyola. Field research conducted in Auburn Gresham, West Garfield Park, North Lawndale, and Englewood between October of 2023 and August of 2024.*",
    ].join("\n"),
    topic: "Education",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
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
      "It was called the Plan for Transformation. It was, at the time of its 1999 announcement, the most ambitious public housing makeover in the history of the United States.[^1] Under the plan, the Chicago Housing Authority would demolish most of the city's high-rise public housing — Cabrini-Green, the Robert Taylor Homes, Stateway Gardens, the ABLA Homes — and replace them with 25,000 units in mixed-income communities on the same footprint. Residents who complied with work and income requirements would have a right to return.",
      "",
      "By 2015 the high-rises were gone. In 2023, CHA used five sentences in an appendix to its Moving to Work Annual Report to declare the plan's central promise — the revitalization of 25,000 units of housing — complete.",
      "",
      "Twenty-five years after the announcement, it is possible to check that claim against the record. The record does not support the claim.",
      "",
      "## What the count actually is",
      "",
      "Of the 25,000 demolished public housing units, approximately **7,700 units of replacement public housing** have been built as of 2025.[^2] The original plan called for 25,000 mixed-income units inclusive of public housing replacements. The actual total across all categories is approximately 12,400.",
      "",
      "To arrive at the 25,000 claim, CHA includes in its count more than 5,000 privately owned units that it subsidizes through project-based vouchers. Unlike traditional public housing, project-based vouchers do not make a unit permanently affordable; they keep the unit affordable for a set period, usually five to thirty years, at which point the owner can convert to market rate. ProPublica's 2022 review of the same numbers found that the project-based voucher units alone account for more than a fifth of the 25,000 the Plan claims to have delivered.[^3]",
      "",
      "At the time the plan was launched, CHA had about 29,000 units of family housing. The plan pledged to replace or rehabilitate 15,000 of them. Including the project-based voucher count, the current CHA family-housing portfolio stands at approximately 13,000 units — two thousand fewer than the plan envisioned, and sixteen thousand fewer than existed when the plan began.",
      "",
      "## Who came back",
      "",
      "CHA's own records show that of the roughly 17,000 families living in the demolished high-rises in 1999, approximately **2,100 families** now live in a replacement mixed-income development.[^4] The remaining families moved into scattered-site public housing, received a Housing Choice Voucher, or lost their housing assistance entirely.",
      "",
      "The direct-return rate — from demolition to the replacement community on the same site — is roughly **twelve percent**.",
      "",
      "Mrs. Dorothy Jackson, who lived in the Robert Taylor Homes from 1972 until the 2007 demolition of her building, told me in a January 2025 interview: *\"They gave me a voucher. They gave me the address of a building in Roseland. I had been in Robert Taylor thirty-five years. I was sixty-three. I didn't know anybody in Roseland. I still don't know anybody in Roseland.\"* She has been in Roseland eighteen years as of our interview.",
      "",
      "## Where the voucher holders live",
      "",
      "Voucher-holding former CHA residents cluster in a narrow set of South Side and West Side community areas, many of which are themselves facing disinvestment. Twenty-three percent of Housing Choice Voucher households live in census tracts where 40 percent or more of residents are below the federal poverty line.",
      "",
      "The geographic dispersal the plan promised — the mechanism by which the plan would, in its own 1999 language, \"dismantle concentrated poverty\" — did not, at the scale CHA projected, produce neighborhood integration. It reconcentrated voucher recipients into a smaller number of poor neighborhoods than had contained the demolished high-rises.",
      "",
      "## On accountability",
      "",
      "CHA does not dispute most of the numbers above. When ProPublica put the count discrepancy to the agency in 2022, CHA confirmed the arithmetic and defended the framing — the position being that project-based voucher units are a form of \"affordable housing\" that counts toward the plan's deliverables, even if they are not the permanent public housing the original plan described.[^3]",
      "",
      "The framing is defensible as a matter of HUD reporting practice. It is not defensible as a match to the plain language of the 1999 plan. The plan said 25,000 units. It meant, at the time of its adoption, 25,000 units of publicly-controlled, permanently-affordable housing on the same sites that were being demolished. The current count delivers something else.",
      "",
      "## Recommendation",
      "",
      "I do not recommend a new large-scale transformation program. The record does not support the claim that the existing one delivered on its promises, and the cost of another round of demolition-and-rebuild would fall, again, on the families who carried the cost of the first round.",
      "",
      "I recommend CHA and HUD:",
      "",
      "1. **Complete the remaining units the plan pledged.** Approximately 17,300 units of the original target have not been delivered. The plan is not complete. Declaring it complete in an appendix does not make it complete.",
      "2. **Commission a fully independent twenty-five-year evaluation,** to be published in 2029, covering unit delivery, return rates, voucher recipient outcomes, and neighborhood effects. The evaluation should not be conducted by CHA, by its consultants, or by HUD's internal review function.",
      "3. **Publish the full demolition-to-current-residence dataset** — every 1999 resident's current housing status, anonymized — as a machine-readable release. The dataset exists; it is the data CHA uses internally to generate the count. Its non-release is a political choice, not a technical one.",
      "",
      "Mrs. Jackson, in our interview: *\"We're not stopping. You can't just take things from us and then say that's the end of it. That's not the end of it.\"*",
      "",
      "---",
      "",
      "*Interviews conducted with former CHA residents between September of 2024 and February of 2025. Full transcripts in the accompanying appendix. Reviewed by Marcus Alvarez of the Institute for Housing Studies at DePaul, Dr. Sarah Oduya of Northwestern, and Jerome Pritchett of Pritchett + Olagun Studio.*",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
    authors: ["Zain Zaidi"],
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
