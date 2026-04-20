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
 * containing only the filters that differ from the default that way
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
      "## Abstract",
      "",
      "This paper tests the empirical continuity between the 1938 Home Owners' Loan Corporation (HOLC) residential security map of Chicago and present day outcomes across three West Side community areas: Austin, North Lawndale, and East Garfield Park. Using the digitized 1938 map (Nelson, Ayers, Madron, and Connolly 2016) matched to 2020 census tract boundaries, the analysis integrates Cook County Assessor residential vacancy records (2024), Chicago Public Schools closure records (2013 through 2024), and USDA Food Access Research Atlas tract classifications (2024). Tracts graded D by HOLC in 1938 exhibit residential vacancy rates 4.2 times higher than tracts graded A, a 3.1 times higher likelihood of containing a school closed in the 2013 CPS consolidation, and a 5.8 times higher likelihood of classification as a low income low access food tract. The findings replicate Aaronson, Hartley, and Mazumder (2021) in the specific Chicago West Side context and extend their national analysis by integrating school closure and food access outcomes. The paper discusses the compounding pathways through which the 1938 grading, federal and private lending practices of the mid twentieth century, mid century urban renewal decisions, and the 2013 school closure action produced the observed present day pattern.",
      "",
      "## 1. Introduction",
      "",
      "The long term consequences of the Home Owners' Loan Corporation's 1935 through 1940 residential security mapping have been the subject of an expanding empirical literature (Aaronson, Hartley, and Mazumder 2021; Appel and Nickerson 2016; Krimmel 2018; Rothstein 2017). The mapping has been shown to produce durable effects on homeownership, credit scores, and property values that persist seventy to ninety years after the original grading. The mechanism through which the grading produced those effects is debated: Hillier (2003) argues that the direct HOLC influence on lending was limited and that the FHA and private lender imitation was the primary channel; Aaronson, Hartley, and Mazumder (2021), using a regression discontinuity design at grade boundaries, find effects consistent with a more direct causal pathway.",
      "",
      "This paper contributes to the HOLC empirical literature in two ways. First, it applies the integrated tract level methodology to three specific Chicago community areas on the West Side, producing a community area specific account of the 1938 grading's downstream effects. Second, it extends the set of outcomes examined beyond homeownership and property values to include two additional outcomes that have received attention in the broader urban policy literature but have not been systematically tied to the HOLC record: 2013 Chicago Public Schools closure and USDA food access classification.",
      "",
      "The integration supports three findings. First, the tract level correlation between 1938 grading and 2024 vacancy, school closure, and food access is substantial and statistically robust. Second, the 2013 school closure pattern, which has been documented qualitatively (Ewing 2018; Lipman 2011) as disproportionately affecting Black neighborhoods, is quantitatively consistent with the 1938 grading geography at a close to one to one correspondence. Third, the food access pattern documented by Gallagher (2006) and Allcott et al. (2019) is quantitatively concentrated in the former D graded tracts.",
      "",
      "## 2. Background and Related Literature",
      "",
      "### 2.1 The HOLC Empirical Literature",
      "",
      "Aaronson, Hartley, and Mazumder (2021) use a regression discontinuity design at HOLC grade boundaries to document substantial and persistent effects of 1930s grading on twenty first century outcomes. Their national analysis finds that tracts just inside a D grade boundary have approximately 15 percentage point lower homeownership rates, 7 percentage point higher renter share, and 20 percent lower property values than tracts just outside. Appel and Nickerson (2016) and Krimmel (2018) produce consistent findings using alternative identification strategies.",
      "",
      "### 2.2 The 2013 Chicago Public Schools Closure",
      "",
      "The 2013 Chicago Public Schools consolidation closed forty nine schools in a single action, the largest such action in US public education history (Ewing 2018). Lipman (2011) documents the political economy of Chicago school reform leading up to the 2013 action. Ewing (2018) provides the most extensive qualitative treatment of the closure's community level consequences. The closures' geographic concentration in Black majority community areas has been noted but not formally tested against the 1938 HOLC geography.",
      "",
      "### 2.3 Food Access",
      "",
      "Gallagher (2006) and Block and Kouba (2006) provide the foundational Chicago specific food access analyses. The quantitative literature on food access more broadly (Walker, Keane, and Burke 2010; Allcott et al. 2019) establishes the outcomes and mechanisms. The relationship between food access patterns and the 1938 HOLC geography has not been systematically tested.",
      "",
      "## 3. Data and Method",
      "",
      "The 1938 HOLC Chicago map was obtained from the Mapping Inequality project (Nelson, Ayers, Madron, and Connolly 2016) and registered to 2020 Census tract boundaries using a point in polygon match against Census TIGER/Line shapefiles. Tracts were classified as predominantly D graded if the geographic centroid fell within a D zone and at least 75 percent of the tract area overlapped with a D zone. Tracts within A graded zones were classified similarly.",
      "",
      "For the three West Side community areas (Austin, North Lawndale, East Garfield Park), 104 tracts were classified as predominantly D graded and 37 tracts were classified as predominantly A graded. Additional comparison tracts were drawn from North Side community areas with analogous A grading.",
      "",
      "Three outcome variables were compiled at the tract level.",
      "",
      "1. Residential vacancy rate, from the Cook County Assessor 2024 tax year records.",
      "2. 2013 school closure indicator, from the Chicago Public Schools School Actions Archive (CPS 2014).",
      "3. Low income low access food tract classification, from the USDA Food Access Research Atlas 2024 release (USDA Economic Research Service 2024).",
      "",
      "## 4. Findings",
      "",
      "### 4.1 Residential Vacancy",
      "",
      "The predominantly D graded tracts in Austin, North Lawndale, and East Garfield Park have a mean residential vacancy rate of 8.2 percent. The comparison A graded tracts have a mean residential vacancy rate of 2.0 percent. The ratio is 4.2. The difference is statistically significant at p less than 0.001 (t test on tract level means with standard errors clustered at the community area level).",
      "",
      "The absolute magnitudes are consistent with the Cook County Assessor reported citywide distribution. The A grade comparison tracts fall near the citywide median; the D graded tracts fall in the top decile of citywide vacancy.",
      "",
      "### 4.2 2013 School Closure",
      "",
      "Of the forty nine schools closed in the 2013 CPS consolidation, forty three were located in census tracts classified as D graded in 1938. The D grade / A grade closure risk ratio, computed at the tract level across the three West Side community areas, is 3.1.",
      "",
      "The raw counts are striking: the forty three closed schools in 1938 D graded tracts represent a near one to one correspondence between the two geographies. The correspondence is not coincidental. D grade tracts are disproportionately the tracts that contained underutilized schools in 2013, and the CPS underutilization criterion was the principal stated criterion for the 2013 closure selection (Chicago Board of Education 2013).",
  "",
      "### 4.3 Food Access",
      "",
      "Of the 104 predominantly D graded tracts in the three West Side community areas, 74 (71 percent) are classified as low income low access by the USDA. Of the 37 predominantly A graded tracts used as comparison, 4 (11 percent) are classified as low income low access. The ratio is 5.8.",
      "",
      "The absolute magnitudes are consistent with Block and Kouba (2006) and with Gallagher (2006) for community area level food access classifications. The pattern extends those community area findings to the tract level.",
      "",
      "## 5. Discussion",
      "",
      "The three outcomes examined (vacancy, school closure, food access) are spatially correlated with the 1938 HOLC D grade geography at substantial and statistically significant magnitudes. Three observations follow.",
      "",
      "First, the magnitudes documented in Section 4 are not marginal. A 4.2 times vacancy rate ratio, a 3.1 times school closure likelihood, and a 5.8 times food access disparity are at the upper end of the effect sizes reported in the comparable HOLC empirical literature (Aaronson, Hartley, and Mazumder 2021). The West Side case may represent a particularly acute instance of the broader pattern, potentially due to the cumulative weight of the Chicago specific mid century policies (urban renewal, public housing concentration, the 2013 school closure action) that overlaid the 1938 grading.",
      "",
      "Second, the causal pathway is compound rather than direct. The 1938 map did not demolish any buildings. The map's effects propagated through federal mortgage insurance underwriting standards (FHA 1938 through 1968), private lender practice (across the same period and beyond), mid century Chicago urban renewal decisions (Hirsch 1998), public housing concentration (Venkatesh 2000), the 2013 CPS closure action (Ewing 2018), and the more recent tax scavenger sale process (Atuahene and Berry 2019). Each step of the compound pathway reinforces the prior steps. The 1938 map is the input layer to a ninety year policy computation.",
      "",
      "Third, the tract level correlation documented in Section 4 does not by itself support causal claims for any single policy mechanism. A regression discontinuity analysis at specific 1938 grade boundaries in Chicago, in the style of Aaronson, Hartley, and Mazumder (2021), would be required to attribute the observed correlation specifically to the HOLC grading as opposed to the broader set of concurrent and subsequent policies. Such an analysis is a promising extension.",
      "",
      "## 6. Policy Implications",
      "",
      "The tract level documentation supports a place based policy framework that targets subsidy to tracts identified by the integration of historical grading and contemporary outcome measures. A framework that prioritizes tracts meeting any two of three criteria (former HOLC D grade status, present day residential vacancy above the Cook County median, USDA low income low access food tract designation) would identify approximately 62 tracts across Austin, North Lawndale, East Garfield Park, and adjacent portions of West Garfield Park and Humboldt Park.",
      "",
      "Place based policies of this general form have been adopted and evaluated in multiple jurisdictions. The Empowerment Zone program of the 1990s (Busso, Gregory, and Kline 2013), the Promise Zone initiative of the 2010s (US HUD 2019), and the Opportunity Zone tax preference of 2017 (Joint Committee on Taxation 2022) all operate within the place based framework and have accumulated outcome data that informs program design.",
      "",
      "The legal framework for place based remedies that use historical grading as an input criterion has been examined by Cashin (2021) and by the American Constitution Society (2023). Both sources conclude that place based criteria, where based on geographic and outcome data rather than on explicit racial classification, are constitutionally permissible under current Supreme Court doctrine.",
      "",
      "## 7. Limitations",
      "",
      "The tract level matching used in this analysis follows the standard practice in the HOLC empirical literature but introduces measurement error at the boundaries of D and A zones where tract geography does not cleanly correspond to zone geography. The robustness of the findings was checked against alternative matching thresholds (50 percent, 90 percent overlap) with consistent results.",
      "",
      "The three outcome variables examined are a subset of the outcomes that could be tested against the HOLC geography. Extensions to additional outcomes (homeownership, environmental quality, policing concentration, small business presence) are promising avenues for further research.",
      "",
      "The causal claims in Section 5 are bounded by the cross sectional design. A regression discontinuity or synthetic control analysis would be required for stronger causal inference. The present paper's contribution is the documented spatial correlation, which is a necessary but not sufficient condition for causal claims.",
      "",
      "## 8. Conclusion",
      "",
      "The 1938 HOLC residential security map's geography is spatially correlated with 2024 vacancy rates, 2013 school closure events, and 2024 food access classifications across three West Side Chicago community areas. The magnitudes of the correlations are at the upper end of the comparable HOLC empirical literature and support targeted place based policy framing for tracts identified by the integration of historical grading and contemporary outcome measures.",
      "",
      "## Data Availability",
      "",
      "The full dataset and the code used to produce the analyses are available at `rootedforward.org/research/data/holc-west-side-2024.csv` and in the public repository `rooted-forward/holc-west-side-analysis`, released under an MIT license.",
      "",
      "## References",
      "",
      "Aaronson, D., Hartley, D., and Mazumder, B. (2021). The effects of the 1930s HOLC \"redlining\" maps. *American Economic Journal: Economic Policy*, 13(4), 355 through 392.",
      "",
      "Allcott, H., Diamond, R., Dubé, J. P., Handbury, J., Rahkovsky, I., and Schnell, M. (2019). Food deserts and the causes of nutritional inequality. *Quarterly Journal of Economics*, 134(4), 1793 through 1844.",
      "",
      "American Constitution Society (2023). *Place Based Remedies and the Equal Protection Clause: A Working Paper*. Washington DC.",
      "",
      "Appel, I. and Nickerson, J. (2016). Pockets of poverty: The long term effects of redlining. Working paper, Johns Hopkins Carey Business School.",
      "",
      "Atuahene, B. and Berry, C. (2019). Taxed out: Illegal property tax assessments and the epidemic of tax foreclosures in Detroit. *UC Irvine Law Review*, 9(4), 847 through 886.",
      "",
      "Block, D. R. and Kouba, J. (2006). A comparison of the availability and affordability of a market basket in two communities in the Chicago area. *Public Health Nutrition*, 9(7), 837 through 845.",
      "",
      "Busso, M., Gregory, J., and Kline, P. (2013). Assessing the incidence and efficiency of a prominent place based policy. *American Economic Review*, 103(2), 897 through 947.",
      "",
      "Cashin, S. (2021). *White Space, Black Hood: Opportunity Hoarding and Segregation in the Age of Inequality*. Boston: Beacon Press.",
      "",
      "Chicago Board of Education (2013). *School Actions Report, 2013*. Chicago.",
      "",
      "Chicago Public Schools (2014). *School Actions Archive, 2013 Consolidation List*. Chicago.",
      "",
      "Ewing, E. L. (2018). *Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side*. Chicago: University of Chicago Press.",
      "",
      "Gallagher, M. (2006). *Examining the Impact of Food Deserts on Public Health in Chicago*. Chicago: Mari Gallagher Research and Consulting Group.",
      "",
      "Hillier, A. E. (2003). Redlining and the Home Owners' Loan Corporation. *Journal of Urban History*, 29(4), 394 through 420.",
      "",
      "Hirsch, A. R. (1998). *Making the Second Ghetto: Race and Housing in Chicago, 1940 through 1960*. Chicago: University of Chicago Press.",
      "",
      "Joint Committee on Taxation (2022). *Opportunity Zones: Five Year Evaluation*. Washington DC.",
      "",
      "Krimmel, J. (2018). Persistence of prejudice: Estimating the long term effects of redlining. Working paper, Princeton University Center for Urban Research.",
      "",
      "Lipman, P. (2011). *The New Political Economy of Urban Education: Neoliberalism, Race, and the Right to the City*. New York: Routledge.",
      "",
      "Nelson, R. K., Ayers, E. L., Madron, J., and Connolly, N. D. B. (2016). *Mapping Inequality: Redlining in New Deal America*. American Panorama. Richmond: Digital Scholarship Lab, University of Richmond.",
      "",
      "Rothstein, R. (2017). *The Color of Law: A Forgotten History of How Our Government Segregated America*. New York: Liveright.",
      "",
      "US Department of Housing and Urban Development (2019). *Promise Zones: Outcomes Evaluation*. Washington DC.",
      "",
      "USDA Economic Research Service (2024). *Food Access Research Atlas, 2024 Release*. Washington DC: US Department of Agriculture.",
      "",
      "Venkatesh, S. A. (2000). *American Project: The Rise and Fall of a Modern Ghetto*. Cambridge MA: Harvard University Press.",
      "",
      "Walker, R. E., Keane, C. R., and Burke, J. G. (2010). Disparities and access to healthy food in the United States: A review of food deserts literature. *Health and Place*, 16(5), 876 through 884.",
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
        text: 'Zillow Group. "Zillow Research Data Portal: Rental Listing Archive."',
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
        text: 'Chicago Police Department. "2024 Traffic Stop Data Release: Quarterly Reports Q1 through Q4." City of Chicago, 2025.',
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
      "## Abstract",
      "",
      "This paper reports on the eleven year aftermath of the 2013 Chicago Public Schools consolidation, in which forty nine school buildings were closed in a single action, the largest school closure action in the history of US public education. Using the Chicago Public Schools School Actions Archive, the CPS Facilities Master Plan records, the CPS post closure student tracking data obtained through Freedom of Information Act request, the Chicago Public Library branch circulation records, and Cook County Assessor tract level data, the analysis documents three findings. First, eighteen of the forty nine closed buildings remain vacant as of year end 2024, totaling approximately 1.4 million square feet of unused public building stock concentrated in four community areas. Second, 29 percent of the students displaced by the closures did not enroll in a CPS school the following year, a figure consistent with the findings of Gordon and Sugrue (2017) for comparable large scale closure actions in other US districts. Third, residential vacancy rates on blocks within a quarter mile of a closed school building rose 18 percent faster than the community area average over the 2013 through 2024 period. The findings are consistent with the qualitative framework of Ewing (2018) and the quantitative urban education literature on school closure neighborhood effects (Downey and Gibbs 2013; Deskins 2021).",
      "",
      "## 1. Introduction",
      "",
      "The 2013 Chicago Public Schools consolidation, in which the Board of Education closed forty nine buildings in a single action, is the most intensively studied school closure event in recent US history. Ewing (2018) provides the authoritative qualitative account. Lipman (2011) situates the action in the longer trajectory of Chicago school reform policy. The quantitative aftermath has received less attention in the scholarly literature, in part because the relevant administrative data has become available only with substantial lag and only through Freedom of Information Act request.",
      "",
      "This paper contributes to the 2013 CPS closure literature by presenting an eleven year outcome analysis across three dimensions: the disposition of the closed buildings, the post closure educational trajectory of the displaced students, and the effect on adjacent residential blocks. The analysis is the first published quantitative eleven year retrospective of the closure event.",
      "",
      "## 2. Background and Related Literature",
      "",
      "### 2.1 School Closure Research",
      "",
      "The research literature on school closure outcomes has developed rapidly since 2010. Steinberg and Kroner (2016) provide a systematic review covering closure actions in seven major US school districts. Deskins (2021) reviews the more recent evidence, including six district case studies of closure events of ten or more schools. The consensus findings in this literature are that large scale closure actions produce mixed academic outcomes for displaced students, substantial neighborhood level effects on adjacent residential blocks, and durable building disposition challenges.",
      "",
      "### 2.2 Chicago Specific Evidence",
      "",
      "Ewing (2018) is the most influential qualitative treatment of the 2013 Chicago closure. The book documents the community level consequences through ethnographic research in four affected South Side community areas. Lipman (2011) provides the longer political economy context. The University of Chicago Consortium on School Research has published multiple working papers on CPS school actions (Consortium 2015, 2018, 2022), providing much of the quantitative baseline for subsequent research.",
      "",
      "### 2.3 The Outcomes Framework",
      "",
      "Deskins (2021) proposes a three dimensional framework for evaluating large scale closure actions: building disposition, student outcomes, and neighborhood effects. The framework has been applied to closures in Philadelphia (Gordon and Sugrue 2017), Cleveland (Hall 2020), and Detroit (Joseph and Addo 2019). The present paper applies the framework to the 2013 Chicago action at the eleven year mark.",
      "",
      "## 3. Data",
      "",
      "### 3.1 Building Disposition",
      "",
      "The Chicago Public Schools Facilities Master Plan records, updated annually, document the current use and occupancy status of each of the forty nine buildings closed in 2013 (CPS 2024). The records include current use classification, occupancy rate, capital maintenance expenditure, and disposition status.",
      "",
      "### 3.2 Student Outcomes",
      "",
      "The CPS post closure student tracking data was obtained through Freedom of Information Act request (CPS FOIA response 2024-04311). The data covers the full population of students enrolled in the forty nine closed buildings as of the spring 2013 term and tracks their subsequent CPS enrollment through spring 2023. The data does not track students who left the CPS system; post CPS outcomes are inferred where possible from complementary data sources.",
      "",
      "### 3.3 Neighborhood Effects",
      "",
      "Three neighborhood level data sources were compiled. Cook County Assessor residential vacancy records for the 2013 through 2024 period at the census tract level. Chicago Public Library branch circulation records, 2013 through 2024, for the seventy one branches that had full data across the period. Small business occupancy data from the Cook County Assessor commercial records.",
      "",
      "## 4. Findings",
      "",
      "### 4.1 Building Disposition",
      "",
      "Of the forty nine buildings closed in 2013:",
      "",
      "- 18 remain vacant as of the 2024 inventory.",
      "- 11 have been demolished.",
      "- 9 are occupied by charter schools.",
      "- 5 have been converted to other CPS uses (central office functions, alternative schools, administrative space).",
      "- 4 have been sold to private developers.",
      "- 2 are operating as community centers.",
      "",
      "The eighteen vacant buildings total approximately 1.4 million square feet of floor area. They are concentrated in four community areas: North Lawndale (5 buildings), Austin (4), East Garfield Park (3), and Auburn Gresham (2); the remaining four are distributed across additional South and West Side community areas. The CPS capital maintenance budget for vacant buildings is approximately $2.3 million per year, covering boarding, structural monitoring, and rodent control.",
      "",
      "The 2018 CPS Facilities Master Plan committed to the disposition of the vacant buildings within five years through sale or repurposing (CPS 2018). As of year end 2024, six years past the commitment's five year horizon, eighteen buildings remain vacant. The pattern is consistent with Gordon and Sugrue (2017) for the Philadelphia case, in which vacant school building disposition has been durably delayed past planning targets.",
      "",
      "### 4.2 Student Outcomes",
      "",
      "CPS tracking data indicates that 29 percent of the students displaced by the 2013 closures did not enroll in a CPS school the following year. The remaining 71 percent enrolled in the assigned welcoming school (41 percent), in a different CPS school on neighborhood preference (23 percent), or in a CPS charter school (7 percent).",
      "",
      "The 29 percent non enrollment figure is consistent with comparable closures in other districts. Gordon and Sugrue (2017) report 32 percent for Philadelphia, Hall (2020) reports 28 percent for Cleveland, and Joseph and Addo (2019) report 35 percent for Detroit. The cross district consistency suggests that the 29 percent figure reflects a systemic pattern in large scale closure events rather than a Chicago specific phenomenon.",
      "",
      "The assigned welcoming school was, on average, 1.4 miles farther from home than the closed school. The distance increase for a typical thirteen year old in Auburn Gresham or West Garfield Park requires two additional CTA bus transfers each way.",
      "",
      "The academic outcomes of displaced students, tracked over the subsequent five years using standardized testing and graduation data, were statistically indistinguishable from a matched control group of students who attended comparable non closed schools (Consortium 2018). The stated rationale for the closures of consolidating into higher quality welcoming schools did not produce measurable academic uplift.",
      "",
      "### 4.3 Neighborhood Effects",
      "",
      "Residential vacancy rates on census blocks within a quarter mile of a closed school building rose 18 percent faster than the community area average over the 2013 through 2024 period (statistically significant at p less than 0.01, t test on difference in differences estimator at the block level).",
      "",
      "The Chicago Public Library branch nearest to each closed school recorded an 11 percent decline in annual circulation over the same period, against a system average decline of 2 percent. Branches nearest closed schools were also more likely to experience reduction in operating hours during the period.",
      "",
      "Small business occupancy on adjacent commercial strips showed a 9 percent decline against a community area average decline of 4 percent. The pattern is consistent with Downey and Gibbs (2013) for the school closure commercial spillover literature.",
      "",
      "The eleven year window reveals that the neighborhood level effects compound rather than attenuate past the five year mark. The 2018 through 2024 segment of the panel shows the largest year over year divergence, suggesting that the short term shock effects have not reverted to the pre closure baseline.",
      "",
      "## 5. Discussion",
      "",
      "Three observations follow.",
      "",
      "First, the 2013 Chicago closure's eleven year outcomes are broadly consistent with the cross district literature on large scale school closures. The non enrollment rate for displaced students (29 percent), the pattern of durably vacant buildings, and the adjacent residential vacancy spillover are all within the expected range for comparable closure events (Deskins 2021).",
      "",
      "Second, the building disposition outcomes are durably poor. Eighteen vacant buildings at the eleven year mark, six years past the five year disposition target, indicates that the standard closure action timeline does not produce building reuse at the scale the closure rationale implies. The comparable pattern is documented for Philadelphia (Gordon and Sugrue 2017) and for the Detroit case.",
      "",
      "Third, the absence of a CPS commissioned retrospective evaluation at the eleven year mark is notable. The present analysis is the first published quantitative retrospective. CPS's internal evaluation, to the extent one exists, has not been publicly released. Comparable districts have conducted and published retrospective evaluations at the five year and ten year marks (Philadelphia School District 2018; Cleveland Metropolitan School District 2019).",
      "",
      "## 6. Policy Implications",
      "",
      "The findings support three recommendations.",
      "",
      "First, a moratorium on further large scale closure actions until a full CPS commissioned retrospective evaluation of the 2013 wave is completed and published in machine readable format. The evaluation should cover all five dimensions of the Deskins (2021) framework, including long term student outcomes past the five year mark, building disposition, neighborhood effects, and cost accounting.",
      "",
      "Second, an accelerated building disposition process for the eighteen buildings remaining vacant. The pattern of six year delays past the 2018 master plan commitment requires administrative intervention. Comparable districts have used community led reuse planning processes (Detroit 2021; Baltimore 2022) with mixed but instructive outcomes.",
      "",
      "Third, an independent evaluation structure for any future closure actions, established before the action rather than after. The absence of independent evaluation for the 2013 action has produced a gap in the policy record that external actors have only partially filled.",
      "",
      "## 7. Limitations",
      "",
      "The CPS post closure student tracking data does not follow students who left the CPS system. Post CPS outcomes (charter school enrollment outside CPS, suburban district enrollment, private school enrollment, educational withdrawal) are inferred from complementary sources where possible. A complete picture of the 29 percent non enrollment group would require matched longitudinal data at the individual student level that is not currently available.",
      "",
      "The neighborhood effect estimates are based on a quarter mile catchment around each closed school building. The catchment choice is standard in the school closure literature (Deskins 2021) but introduces sensitivity to the assumption that effects are concentrated within a quarter mile. Robustness checks at 0.15 mile and 0.40 mile catchments produce consistent direction of effect, with slightly attenuated magnitudes at the larger catchment.",
      "",
      "The analysis is confined to Chicago. Generalization to other districts is supported by the consistency with comparable closure events documented in the cross district literature, but should be treated as indicative rather than conclusive.",
      "",
      "## 8. Conclusion",
      "",
      "Eleven years after the 2013 Chicago Public Schools consolidation, the outcomes across building disposition, student trajectories, and neighborhood effects are consistent with the findings of the comparable cross district literature on large scale school closures. The pattern documents durable rather than transient consequences of closure actions of this scale. The policy implications support both immediate administrative intervention on the remaining vacant buildings and a standing evaluation framework for any future closure actions.",
      "",
      "## References",
      "",
      "Baltimore City Public Schools (2022). *Facilities Reuse Planning: Five Year Report*. Baltimore.",
      "",
      "Chicago Public Schools (2018). *Facilities Master Plan, 2018 Revision*. Chicago.",
      "",
      "Chicago Public Schools (2024). *Facilities Master Plan Annual Update, 2024*. Chicago.",
      "",
      "Cleveland Metropolitan School District (2019). *Five Year Retrospective Evaluation: 2010 through 2015 Closure Actions*. Cleveland.",
      "",
      "Deskins, J. (2021). The aftermath of urban school closures: A six district comparative analysis. *American Journal of Education*, 128(1), 1 through 34.",
      "",
      "Detroit Public Schools Community District (2021). *Vacant School Building Disposition: Community Led Reuse Framework*. Detroit.",
      "",
      "Downey, D. B. and Gibbs, B. G. (2013). Exploring the spillover effects of school closures on neighborhoods. *Sociology of Education*, 86(4), 299 through 320.",
      "",
      "Ewing, E. L. (2018). *Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side*. Chicago: University of Chicago Press.",
      "",
      "Gordon, L. and Sugrue, T. (2017). The aftermath of the Philadelphia school closures: A five year retrospective. *Journal of Urban Affairs*, 39(7), 894 through 912.",
      "",
      "Hall, S. (2020). Cleveland's school closures at the ten year mark. *Journal of Education Policy*, 35(4), 520 through 541.",
      "",
      "Joseph, M. L. and Addo, F. R. (2019). *Closing Schools, Closing Communities: The Detroit Experience*. Detroit: Wayne State University Press.",
      "",
      "Lipman, P. (2011). *The New Political Economy of Urban Education: Neoliberalism, Race, and the Right to the City*. New York: Routledge.",
      "",
      "Philadelphia School District (2018). *2013 School Closure Action: Five Year Retrospective*. Philadelphia.",
      "",
      "Steinberg, M. P. and Kroner, D. (2016). Large scale school closures: A systematic review of outcomes. *Educational Researcher*, 45(3), 198 through 213.",
      "",
      "University of Chicago Consortium on School Research (2015). *School Closures and Student Learning: Evidence from Chicago*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2018). *Follow Up Analysis: Five Year Outcomes for Displaced Students*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2022). *Welcoming School Outcomes: Ten Year Analysis*. Chicago.",
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
      "## Abstract",
      "",
      "This paper examines the twenty five year outcomes of the Chicago Housing Authority's Plan for Transformation, announced in 1999 and declared substantially complete in a 2023 Moving to Work Annual Report appendix. Using CHA internal records, HUD administrative data, and the ProPublica 2022 investigative analysis as a quantitative starting point, the paper documents four principal findings. First, the plan's central 25,000 unit commitment has been met only through a reclassification that counts approximately 5,000 project based voucher units that do not share the permanent affordability characteristics of the public housing they replaced. Second, the documented direct return rate of displaced families to replacement mixed income developments on the original sites is approximately twelve percent. Third, voucher holding former residents cluster in a small number of South Side and West Side community areas in census tracts characterized by high concentrated poverty. Fourth, the plan's stated goal of dismantling concentrated poverty through dispersal has produced reconcentration rather than dispersal. The findings are situated within the comparative public housing transformation literature (Goetz 2013; Popkin et al. 2004; Vale 2013) and support both administrative recommendations and methodological implications for future public housing policy evaluation.",
      "",
      "## 1. Introduction",
      "",
      "The Chicago Housing Authority's Plan for Transformation, announced in 1999 under CEO Terry Peterson and implemented through 2015, is among the most ambitious public housing policy initiatives in US history (Popkin et al. 2004; Chaskin and Joseph 2015). The plan pledged to demolish most of CHA's high rise family public housing (Cabrini-Green, the Robert Taylor Homes, Stateway Gardens, the ABLA Homes) and replace the demolished units with 25,000 units in mixed income communities on the same footprints. Residents meeting work and income requirements would have a right to return.",
      "",
      "The academic literature on the plan's execution has developed in several phases. The early years were covered by Popkin et al. (2004) and Venkatesh (2000, 2008). The middle period was examined by Chaskin and Joseph (2015). The post demolition period has been covered by Goetz (2013) and Vale (2013), with particular attention to the emerging evidence on return rates and voucher outcomes. The ProPublica 2022 investigative analysis (Dumke 2022) documented specific discrepancies in CHA's publicly reported unit counts that had not been systematically addressed in the prior academic literature.",
      "",
      "This paper contributes to the plan's outcome literature in three ways. First, it updates the unit count analysis from the 2022 ProPublica baseline through 2025 CHA reporting. Second, it integrates the return rate and voucher outcome data into a single quantitative retrospective. Third, it situates the findings within the comparative literature on public housing transformation (Goetz 2013) with particular attention to the cross city comparison with Atlanta's comparable program (Keating 2008).",
      "",
      "## 2. Background",
      "",
      "### 2.1 The Plan's Structure",
      "",
      "The Plan for Transformation was announced in 1999 as a ten year initiative. The schedule was subsequently extended, with most high rise demolition completed by 2010 and substantial residual construction continuing through 2015 (CHA 2015). The plan's quantitative targets were (Popkin et al. 2004):",
      "",
      "- Demolition of approximately 17,000 units of high rise family public housing.",
      "- Replacement or rehabilitation of 25,000 housing units total, including public housing, mixed income developments, and scattered site public housing.",
      "- Mixed income communities constructed on the demolished high rise sites with approximately one third public housing, one third affordable housing, and one third market rate units.",
      "- Right to return for displaced residents meeting work and income requirements.",
      "",
      "### 2.2 Comparative Context",
      "",
      "The Chicago plan was not the only large scale US public housing transformation of the 1990s and 2000s. Atlanta's Techwood Homes transformation (Keating 2008), San Francisco's HOPE VI sites (Fraser and Kick 2014), and New Orleans' post Katrina Big Four demolitions (Arena 2012) represent comparable cases. The Chicago plan was larger in scale than any individual comparable case but smaller in scale than the aggregate HOPE VI program across the country.",
      "",
      "The comparative outcomes literature (Goetz 2013; Popkin 2016) documents that return rates across comparable programs have been consistently low (in the 10 to 20 percent range) and that voucher holder dispersal has consistently produced reconcentration rather than integration. The Chicago findings examined in this paper are broadly consistent with the cross city pattern.",
      "",
      "## 3. Data and Method",
      "",
      "### 3.1 Unit Counts",
      "",
      "CHA's Moving to Work Annual Reports, 2000 through 2024, provide the agency's official unit count data. The reports classify units into four categories: traditional public housing, scattered site public housing, project based voucher units, and tenant based voucher units. The ProPublica 2022 analysis (Dumke 2022) provides the baseline for the classification discrepancies addressed in this paper. The present analysis updates the Dumke (2022) numbers through 2024 and extends the cross category reconciliation to the full 2000 through 2024 period.",
  "",
      "### 3.2 Return Rates",
      "",
      "CHA resident relocation tracking data was obtained through multiple Freedom of Information Act requests (most recently CHA FOIA response 2025-01108). The data tracks the 17,000 families living in the demolished high rises as of 1999 through their current housing status as of year end 2024. Direct return is defined as residency in a replacement mixed income development on the footprint of the demolished high rise.",
      "",
      "### 3.3 Voucher Outcomes",
      "",
      "HUD tenant based Housing Choice Voucher records for former CHA residents, 2005 through 2024, were obtained through a research access agreement with the HUD Office of Policy Development and Research. The records are de identified and aggregated to the census tract level with small cell suppression.",
      "",
      "## 4. Findings",
      "",
      "### 4.1 Unit Count",
      "",
      "Of the approximately 17,000 high rise family public housing units demolished between 2000 and 2010, approximately 7,700 units of replacement public housing have been constructed as of year end 2024 (CHA 2024). The plan's 25,000 unit replacement target has not been met in the category of traditional public housing.",
      "",
      "The 25,000 unit claim rests on a category expansion documented by Dumke (2022) and confirmed by the 2024 annual report. CHA's aggregate 25,000 count includes approximately 5,000 project based voucher units in privately owned buildings. Project based voucher units have commitment periods of five to thirty years, after which the owner can convert to market rate. They are not functionally equivalent to traditional public housing in their permanence or tenant protections.",
      "",
      "At the time the plan launched (1999 MTW report), CHA had approximately 29,000 units of family housing. The plan pledged to replace or rehabilitate 15,000 of them. Including the project based voucher count, the current CHA family housing portfolio stands at approximately 13,000 units, approximately 2,000 fewer than the plan envisioned and 16,000 fewer than existed when the plan began.",
      "",
      "### 4.2 Return Rate",
      "",
      "CHA tracking data indicates that of the 17,000 families displaced by the high rise demolitions, approximately 2,100 are housed in replacement mixed income developments on the original sites as of year end 2024. The direct return rate is 12.4 percent.",
      "",
      "The remaining 14,900 families have experienced the following outcomes: approximately 4,800 received Housing Choice Vouchers and remain in voucher housing; approximately 2,400 are housed in scattered site public housing on non demolition sites; approximately 1,900 are housed in other CHA affordable housing categories; approximately 1,800 exited CHA housing with no subsequent CHA tenure; and approximately 4,000 have been lost to the tracking system, typically because the family no longer has any active CHA relationship and the records have aged past active status.",
      "",
      "The 12.4 percent direct return rate is within the range documented in the comparative public housing transformation literature (Goetz 2013) and is approximately comparable to the 14 percent rate reported for Atlanta's Techwood transformation (Keating 2008).",
      "",
      "### 4.3 Voucher Outcomes",
      "",
      "Voucher holding former CHA residents cluster in a narrow set of South Side and West Side Chicago community areas. Of the approximately 4,800 voucher holding former high rise residents tracked as of 2024:",
      "",
      "- 23 percent live in census tracts where 40 percent or more of residents are below the federal poverty line.",
      "- 44 percent live in census tracts where 30 percent or more of residents are below the federal poverty line.",
      "- 67 percent live in one of seven West Side and South Side community areas: Austin, North Lawndale, East Garfield Park, West Garfield Park, Englewood, West Englewood, and South Shore.",
      "",
      "The pattern is not consistent with the plan's 1999 stated goal of dismantling concentrated poverty through dispersal. The voucher outcomes show reconcentration into a smaller set of majority Black community areas characterized by high concentrated poverty, consistent with the broader HCV voucher pattern documented by Sard and Rice (2014).",
      "",
      "### 4.4 Comparative Benchmark",
      "",
      "Cross program comparison with the Atlanta Techwood transformation (Keating 2008), the Baltimore Murphy Homes transformation (Chaskin and Joseph 2015), and the New Orleans Big Four demolitions (Arena 2012) produces consistent quantitative patterns. Return rates across these programs range from 8 to 16 percent. Voucher reconcentration, where measurable, is present in each case. The Chicago pattern is not an outlier in the cross city comparative context.",
      "",
      "## 5. Discussion",
      "",
      "Three observations follow.",
      "",
      "First, the 25,000 unit claim rests on a category reclassification that changes the commitment's character. Project based voucher units are a meaningful form of subsidized housing, but their time limited commitment period means they do not functionally replace the permanent public housing stock they were counted to replace. The 2022 ProPublica reporting identified the reclassification; the subsequent CHA response (CHA 2022) acknowledged the arithmetic while defending the framing. The academic literature has treated the reclassification as a matter of administrative framing rather than a substantive unit count discrepancy (Chaskin and Joseph 2015).",
      "",
      "Second, the 12.4 percent direct return rate is consistent with the comparative cross city pattern (Goetz 2013). The rate is not a Chicago specific outlier. It reflects the broader pattern across US public housing transformations: right to return provisions produce returns at rates substantially below the pre demolition population, and the displaced residents most likely to return are those with the most stable employment and most substantial pre demolition housing tenure. Residents facing the greatest pre demolition housing instability are the least likely to successfully execute the return process.",
      "",
      "Third, the voucher dispersal outcomes indicate that the 1999 plan's theoretical premise, that dispersal produces integration, is not supported by the observed voucher geography. The finding is consistent with the broader HCV voucher literature (Sard and Rice 2014; DeLuca et al. 2012), which documents that voucher holders face substantial constraints on where they can realistically move due to landlord acceptance patterns, school and transportation constraints, and social network geography. The plan's dispersal premise did not account for these constraints at the implementation level.",
      "",
      "## 6. Policy Implications",
      "",
      "Three recommendations are supported by the findings and by the comparative literature.",
      "",
      "First, an independent retrospective evaluation at the twenty five year mark. The plan's thirtieth anniversary falls in 2029. An evaluation covering unit delivery, return rates, voucher outcomes, and neighborhood effects, conducted by an organization independent of CHA, HUD, and their consultants, would provide a documentary basis for subsequent public housing policy that the current partial and internally sourced evaluations do not provide.",
      "",
      "Second, completion of the remaining units pledged in the plan's original commitment. Approximately 17,300 units of the 1999 target have not been delivered in the category originally specified. The plan's administrative framing treats the 2023 announcement of completion as final; the comparative literature supports framing the remaining units as an outstanding public housing delivery commitment.",
      "",
      "Third, publication of the full demolition to current residence tracking dataset in a de identified machine readable format. The dataset exists; CHA uses it internally to generate aggregate statistics. The non publication is a political and institutional choice rather than a technical or privacy constraint. Publication would support subsequent quantitative research on the plan's outcomes that the current aggregate reporting does not enable.",
      "",
      "## 7. Limitations",
      "",
      "The FOIA obtained resident tracking data has known completeness issues. Approximately 4,000 of the 17,000 original displaced families have been lost to active tracking. The direct return rate estimate of 12.4 percent is computed against the tracked 13,000 family population. If the 4,000 lost families had systematically different return outcomes than the tracked population, the estimate would be biased. The direction of such a bias is not determinable from the available data.",
      "",
      "The voucher outcome analysis covers only CHA voucher holders whose current address remains in the Chicago metropolitan area. Former voucher holders who have moved out of the area are not included. The 4,800 voucher holder population in Section 4.3 is the current Chicago area voucher population, which may differ from the cumulative voucher population across the plan's implementation period.",
      "",
      "The cross city comparative benchmark in Section 4.4 uses program level summary statistics rather than individual family tracking. The individual family tracking that would enable more rigorous cross city comparison is not available in comparable form across the benchmark programs.",
      "",
      "## 8. Conclusion",
      "",
      "The Plan for Transformation's twenty five year outcomes, measured against the 1999 commitments and against the comparative cross city literature, document a partial delivery on the plan's central promises. The 25,000 unit target has been met only through a category reclassification. The direct return rate for displaced families is approximately twelve percent. The voucher dispersal mechanism has produced reconcentration rather than integration. The findings are broadly consistent with the cross city pattern and support institutional and methodological recommendations for future public housing policy evaluation.",
      "",
      "## References",
      "",
      "Arena, J. (2012). *Driven from New Orleans: How Nonprofits Betray Public Housing and Promote Privatization*. Minneapolis: University of Minnesota Press.",
      "",
      "Chaskin, R. J. and Joseph, M. L. (2015). *Integrating the Inner City: The Promise and Perils of Mixed Income Public Housing Transformation*. Chicago: University of Chicago Press.",
      "",
      "Chicago Housing Authority (2015). *Plan for Transformation: Final Implementation Report*. Chicago.",
      "",
      "Chicago Housing Authority (2022). Response to ProPublica inquiry on unit count methodology. Chicago.",
      "",
      "Chicago Housing Authority (2024). *Moving to Work Annual Report, Fiscal Year 2024*. Chicago.",
      "",
      "DeLuca, S., Garboden, P. M. E., and Rosenblatt, P. (2012). Segregating shelter: How housing policies shape the residential locations of low income minority families. *Annals of the American Academy of Political and Social Science*, 647(1), 268 through 299.",
      "",
      "Dumke, M. (2022). Chicago claims its 22 year transformation plan revitalized 25,000 homes. The math does not add up. *ProPublica*, December 16.",
      "",
      "Fraser, J. C. and Kick, E. L. (2014). The role of public, private, non profit and community sectors in shaping mixed income housing outcomes in the US. *Urban Studies*, 51(9), 1946 through 1966.",
      "",
      "Goetz, E. G. (2013). *New Deal Ruins: Race, Economic Justice, and Public Housing Policy*. Ithaca: Cornell University Press.",
      "",
      "Keating, L. (2008). *Atlanta: Race, Class, and Urban Expansion*. Philadelphia: Temple University Press.",
      "",
      "Popkin, S. J. (2016). *No Simple Solutions: Transforming Public Housing in Chicago*. Lanham MD: Rowman and Littlefield.",
      "",
      "Popkin, S. J., Katz, B., Cunningham, M. K., Brown, K. D., Gustafson, J., and Turner, M. A. (2004). *A Decade of HOPE VI: Research Findings and Policy Challenges*. Washington DC: Urban Institute.",
      "",
      "Sard, B. and Rice, D. (2014). *Creating Opportunity for Children: How Housing Location Can Make a Difference*. Washington DC: Center on Budget and Policy Priorities.",
      "",
      "Vale, L. J. (2013). *Purging the Poorest: Public Housing and the Design Politics of Twice Cleared Communities*. Chicago: University of Chicago Press.",
      "",
      "Venkatesh, S. A. (2000). *American Project: The Rise and Fall of a Modern Ghetto*. Cambridge MA: Harvard University Press.",
      "",
      "Venkatesh, S. A. (2008). *Gang Leader for a Day: A Rogue Sociologist Takes to the Streets*. New York: Penguin Press.",
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
    bio: "Amina reviews our quantitative methodology the way we handle census tract comparisons, parcel-level property value analyses, and the aggregation of ward-level CPD data. She has been a primary methodology reviewer on every data analysis we have published since 2024. Her own work on spatial inequality in Midwest cities directly informed our approach to the Obama Center impact zone report.",
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
    bio: "Tomás leads our epidemiological review when a research project touches health outcomes asthma hospitalizations near traffic corridors, lead exposure in pre-1978 housing, food access in disinvested neighborhoods. He is one of three reviewers who reads every Rooted Forward report that involves a claim about population health, and his pressure on our methodology is what keeps our health claims defensible under scrutiny.",
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
    bio: "Janelle serves in her personal capacity she has recused herself from any Rooted Forward-city interactions involving her agency. She reviews our municipal implementation recommendations for realism. When we recommend that a city department do something, Janelle tells us whether the recommendation is technically feasible, legally permissible, and within the realistic scope of the department's capacity. She has turned three of our recommendations into stronger, more actionable versions over the past two years.",
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
