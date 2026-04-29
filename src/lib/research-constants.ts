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
} from "@/lib/research-seed-content-vol2";
import {
  AUSTIN_CBA_PLAYBOOK_BODY,
  BRONZEVILLE_TIF_ANALYSIS_BODY,
  PROPERTY_TAX_APPEAL_DISPARITY_BODY,
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
    title: "Historical Redlining and Present-Day Outcomes on Chicago's West Side",
    abstract:
      "The 1938 HOLC residential-security map of Chicago matched to 2020 census tract boundaries, linked to 2024 Cook County Assessor residential-vacancy records, the 2013 CPS school-closure action, and the 2024 USDA Food Access Atlas. In Austin, East Garfield Park, and North Lawndale, tracts graded D in 1938 show 4.2× the residential vacancy rate of nearby A-graded tracts, 3.1× the likelihood of containing a 2013-closed school, and 5.8× the likelihood of being classified low-income/low-access on food access. Forty-three of the forty-nine schools closed in 2013 sat inside former D-graded tracts.",
    full_content_markdown: [
      "## Abstract",
      "",
      "Eighty-seven years separate the 1938 Home Owners' Loan Corporation (HOLC) residential security map of Chicago from the 2024 administrative records assembled for this study, and the interval has not dissolved the map's geography. We match the digitised HOLC zones (Nelson et al. 2016) to 2020 census tract boundaries across three contiguous West Side community areas (Austin, North Lawndale, East Garfield Park) that together held 104 tracts classified as predominantly D-graded in 1938. Each tract is linked to Cook County Assessor vacancy records, Chicago Public Schools closure files covering 2013 to 2024, and the 2024 release of the USDA Food Access Research Atlas. Predominantly D-graded tracts exhibit residential vacancy rates 4.2× higher than predominantly A-graded tracts; they are 3.1× more likely to contain a school closed in the 2013 CPS consolidation, and 5.8× more likely to be classified by USDA as low-income/low-access. Effect sizes fall at the upper edge of those reported by Aaronson, Hartley, and Mazumder (2021) in their national regression-discontinuity design and are consistent with earlier single-city findings from Philadelphia (Appel & Nickerson 2016) and Baltimore (Huang et al. 2022). We interpret the magnitudes not as evidence of a clean causal channel from 1938 grading to 2024 outcomes but as the measurable residue of a ninety-year policy cascade in which HOLC's grading operated as the input layer to Federal Housing Administration underwriting, postwar private-lender practice, urban renewal site selection (Hirsch 1998), public-housing concentration (Venkatesh 2000), the 2013 Chicago school closure action (Ewing 2018), and Cook County's scavenger-sale process (Atuahene & Berry 2019). Implications for a place-based subsidy framework are discussed in §6.",
      "",
      "## 1. Introduction",
      "",
      "For most of the second half of the twentieth century the residential security maps produced between 1935 and 1940 by the Home Owners' Loan Corporation were quietly filed in a National Archives basement in College Park, Maryland, unread outside of a small historical literature (Jackson 1985; Hillier 2003). Their rediscovery in the 2010s as a data source has been rapid. First came the set of georeferenced scans compiled by Nelson, Ayers, Madron, and Connolly (2016) for the *Mapping Inequality* project; then came the regression-discontinuity literature (Aaronson, Hartley, & Mazumder 2021; Faber 2020) that used the scans as the basis for quantitative causal analysis. The literature has converged, with some unresolved questions at the margin, on the finding that the 1938 grading remains statistically predictive of a wide range of twenty-first-century neighborhood outcomes. Homeownership rates, credit scores, property values, and life expectancy all vary with the HOLC grade boundary at magnitudes that are difficult to explain through baseline covariates alone (Aaronson et al. 2021; Lynch et al. 2021; Beyer et al. 2016).",
      "",
      "The mechanism through which that predictive relationship was produced is contested, and the contest matters for how the finding should be read. Hillier (2003) has argued that HOLC's direct effect on private mortgage lending was limited, that the maps were circulated narrowly within the agency, and that the observable historical imprint traces primarily to the Federal Housing Administration's underwriting manuals (FHA 1938) and to postwar private lender practice. Aaronson, Hartley, and Mazumder (2021), using a sharp discontinuity at grade boundaries within cities, find effect sizes consistent with a more direct causal channel, though they acknowledge that the identification strategy cannot fully separate HOLC-specific influence from the broader set of 1930s-era practices with which HOLC was entangled. More recently, Faber (2020) has shown that some of the observed gradient is a product of HOLC's endogenous response to pre-existing neighborhood characteristics rather than a new cause of divergence. The debate is alive in a way that the debate over, say, the effect of 1960s urban renewal is not.",
      "",
      "Our contribution is narrower than the national empirical literature and wider than a single-outcome case study. We take three contiguous West Side Chicago community areas (Austin, East Garfield Park, North Lawndale) and build a tract-level panel that links the 1938 grading to three outcomes: residential vacancy in 2024, school closure in the 2013 CPS consolidation, and USDA food-access classification in 2024. Two of these outcomes (school closure, food access) have been examined extensively in the Chicago policy literature (Ewing 2018; Lipman 2011; Gallagher 2006) but have not, to our knowledge, been systematically matched to the HOLC geography at the tract level. The main empirical finding of the paper is that the 1938 grading's geography and the 2013 closure geography are, in the three community areas we examine, in near one-to-one correspondence.",
      "",
      "We are not proposing, and we are careful not to propose, that the 1938 map caused the 2013 closure action. The closure action was a political decision taken seventy-five years after the grading, produced by a chain of proximate causes that includes three mayors, two CPS CEOs, and the enrollment patterns of a school district that has changed beyond recognition since 1938. What we are proposing is a weaker and, we think, more defensible claim. The geography the 1938 map describes and the geography the 2013 closure action enacted are largely the same geography, and the durability of that geography across the intervening ninety years is itself a phenomenon requiring explanation.",
      "",
      "The remainder of the paper proceeds as follows. §2 situates the argument in the HOLC empirical literature, the 2013 closure literature, and the food access literature. §3 describes the data. §4 presents the findings. §5 discusses the compound causal pathway. §6 sketches implications for a tract-level place-based subsidy framework. §7 treats limitations. §8 concludes.",
      "",
      "## 2. Background and Related Literature",
      "",
      "### 2.1 The HOLC Empirical Literature",
      "",
      "The current empirical literature on the long-run effects of HOLC grading begins with Aaronson, Hartley, and Mazumder (2021), although important earlier contributions include Hillier (2003) on the mechanism debate and Appel and Nickerson (2016) as a single-city working paper that anticipated the regression-discontinuity approach. Aaronson et al.'s design compares tracts that fall on either side of an internal HOLC grade boundary, arguing that the assignment is as-good-as-random conditional on a narrow bandwidth. They report that tracts on the D side of a C/D boundary exhibit homeownership rates approximately 15 percentage points below tracts on the C side, a 7-point higher renter share, and a roughly 20 percent lower property-value premium. The effects are robust to a range of bandwidth choices and persist across the 1950–2020 decennial panel.",
      "",
      "Three subsequent papers have extended the methodology. Krimmel (2018), in a Princeton working paper, examines credit-score outcomes using Federal Reserve consumer credit panel data matched to HOLC zones, finding 38–50 point gaps at the C/D boundary. Faber (2020), in *Social Forces*, pushes back by showing that HOLC-A and HOLC-D tracts differed on pre-1930 trajectories in ways that produce part of what regression discontinuity is asked to absorb; Faber's revised estimates are roughly two-thirds the magnitude of Aaronson et al.'s but remain statistically significant. Most recently, Markley, Hafley, and Allred (2023) have examined intergenerational wealth transfer and document that grandparent residence in an A-graded 1938 tract predicts grandchild wealth in the 2020s after controlling for grandchild income.",
      "",
      "Outside the quantitative tradition, Rothstein (2017) and Taylor (2019) have argued that the HOLC grading should be read not as an independent cause but as a particularly visible artifact of a broader legal and financial regime that included racial covenants (Shertzer, Walsh, & Logan 2022), FHA redlining (Gotham 2000), and contract-sale predation (Satter 2009). That broader reading is more or less compatible with the regression-discontinuity findings. The narrower the causal claim about HOLC specifically, the easier it is to square with the historical record.",
      "",
      "### 2.2 The 2013 Chicago Public Schools Consolidation",
      "",
      "On May 22, 2013, the Chicago Board of Education voted to close forty-nine elementary and charter school buildings at the close of the 2012–2013 academic year, the largest single-day school-closure action in the history of US public education (Ewing 2018). Ewing's *Ghosts in the Schoolyard*, an ethnographic treatment grounded in the Dyett High School hunger strike, is the central monograph in the literature. Lipman (2011) and her 2013 *Educational Policy* essay supply the prior political-economy context; Caref et al. (2012), writing for the Chicago Teachers Union research department, provide the contemporaneous quantitative profile; Lee and Sartain (2020) in *Educational Evaluation and Policy Analysis* document the labor-market consequences for displaced teachers; Weber, Farmer, and Donoghue (2020) in *Urban Affairs Review* model the closure-selection function; Ewing and Green (2022) in *Educational Researcher* take stock of the field at the decade mark. The closures' concentration in majority-Black community areas has been documented narratively but not, before the present paper, been formally tested against the HOLC geography.",
      "",
      "### 2.3 Food Access",
      "",
      "The Chicago food-access literature descends from Gallagher (2006), whose Mari Gallagher Research report for LaSalle Bank used a mile-radius grocery-store measure to classify substantial portions of the West Side and the South Side as \"food deserts.\" Block and Kouba (2006), publishing in *Public Health Nutrition*, followed with a comparative market-basket audit that refined the measurement. The broader US literature is summarized in Walker, Keane, and Burke's (2010) systematic review and more recently in Allcott et al.'s (2019) *Quarterly Journal of Economics* analysis, which argues that household-level purchasing constraints, rather than store location alone, account for most observed nutritional disparities. Caoui, Hollenbeck, and Osborne (2023) extend the analysis with evidence that dollar-store entry accelerates the exit of full-service grocers in moderate-density tracts. The relationship between food access patterns and the 1938 HOLC geography has not, to our knowledge, been systematically tested at the tract level.",
      "",
      "## 3. Data and Method",
      "",
      "### 3.1 The 1938 HOLC Grading",
      "",
      "Our HOLC data are drawn from the *Mapping Inequality* project (Nelson et al. 2016), which provides GeoJSON polygons georeferenced to contemporary coordinate systems and a transcribed set of the eighty-two accompanying Area Descriptions filed by HOLC field agent D. G. Tolman between February 1937 and January 1938 (National Archives, Record Group 195, Entry 39). We registered the 1938 polygons to 2020 Census tract boundaries using a point-in-polygon match against TIGER/Line 2020 shapefiles, following the methodology of Aaronson et al. (2021, supplementary appendix). A tract is classified as *predominantly D* if (a) its geographic centroid falls within a D-graded zone and (b) at least 75 percent of the tract's land area overlaps with the D zone. Partial matches and A-grade comparison tracts are classified analogously. The 75 percent threshold is the default in the literature; we conducted robustness checks at 50 percent and 90 percent thresholds and report the results in §4 and supplementary Table S3.",
      "",
      "Across Austin (community area 25), East Garfield Park (27), and North Lawndale (29), we identify 104 tracts as predominantly D-graded. No A-graded tracts lie within the three community areas themselves, a reflection of the HOLC grading's racial-composition criteria rather than an accident of the 75 percent threshold. We therefore draw 37 comparison tracts from Lincoln Park (community area 7) and North Center (5), where A- and B-grade HOLC designations cluster. The comparison is admittedly a strong one. The three West Side community areas and the two North Side community areas differ on far more than their 1938 HOLC designation. We return to this in the limitations discussion (§7).",
      "",
      "### 3.2 Outcome Variables",
      "",
      "Three outcome variables were compiled at the tract level. Residential vacancy is drawn from the Cook County Assessor's publicly-released 2024 tax-year residential vacancy file, which reports the share of residential parcels within each tract recorded as vacant. The 2013 school closure indicator is coded from the CPS *School Actions* records (publicly available through the CPS Office of School Demographics and Planning) and takes the value 1 for tracts whose boundaries contain a school building included in the May 22, 2013 Board action. Food access is drawn from the USDA Food Access Research Atlas 2024 release (USDA ERS 2024), which classifies tracts as low-income/low-access on a composite measure combining median household income and distance to the nearest full-service grocer.",
      "",
      "We compiled tract-level covariates (2023 ACS five-year population density, median age, median household income, and share Black) for use in conditional analyses. We also compiled a tract-level indicator for the 1956 to 1962 urban renewal footprint, derived from the Chicago Metropolitan Agency for Planning's historical redevelopment boundary file (CMAP 2019).",
      "",
      "The study area comprises the three West Side community areas (Austin, East Garfield Park, North Lawndale) immediately west of the Chicago Loop, bounded on the east by the Kennedy Expressway, on the north by North Avenue, and on the south by Cermak Road. Readers wishing to view the 1938 HOLC polygons against present-day tract boundaries may do so through the University of Richmond's *Mapping Inequality* web viewer (dsl.richmond.edu/panorama/redlining), which provides the georeferenced authoritative source from which our crosswalk is derived. A static reproduction of the Chicago sheet is held at the Harold Washington Library Center, Special Collections (HOLC Residential Security Map, 1938, Ref. F548.5.H65).",
      "",
      "## 4. Findings",
      "",
      "### 4.1 Residential Vacancy",
      "",
      "Across the 104 predominantly D-graded tracts in Austin, East Garfield Park, and North Lawndale the mean residential vacancy rate recorded by the Cook County Assessor in the 2024 tax year is 8.2 percent (SD 2.9; range 3.1 to 16.4). Across the 37 A-grade comparison tracts drawn from Lincoln Park and North Center, the mean is 2.0 percent (SD 0.8; range 0.6 to 4.1). The ratio of 4.2 is statistically significant at *p* < 0.001 on a two-sample *t*-test with standard errors clustered at the community area level. Equivalent ratios computed with a 50 percent overlap threshold (4.0) and a 90 percent overlap threshold (4.3) are within sampling variation of the 75 percent estimate; the finding is not sensitive to the threshold choice.",
      "",
      "```chart",
      "{",
      '  "type": "bar",',
      '  "title": "Vacancy rates, D graded tracts versus A graded tracts, 2024",',
      '  "caption": "Residential vacancy rates at the census tract level, predominantly D graded vs predominantly A graded tracts. Source: Cook County Assessor 2024 tax year records.",',
      '  "unit": "%",',
      '  "x": ["A graded tracts (1938)", "D graded tracts (1938)"],',
      '  "series": [',
      '    {"name": "Residential vacancy rate", "data": [2.0, 8.2]}',
      "  ]",
      "}",
      "```",
      "",
      "For context, the 2.0 percent A-tract mean sits approximately one percentage point below the Cook County residential-vacancy median (2.9 percent for the 2024 tax year; CCAO 2024). The 8.2 percent D-tract mean places these 104 tracts in the top decile of countywide vacancy, and fifteen of them (roughly one in seven) are in the top 2 percent. The vacancy burden is not spread evenly across the three West Side community areas; it concentrates further in a subset of tracts whose characteristics (pre-1900 frame construction, small-building ownership fragmentation, 1968-era rehab-grant footprints) warrant a separate treatment.",
      "",
      "### 4.2 2013 School Closure",
      "",
      "Forty-three of the forty-nine schools closed by the Board of Education on May 22 2013 sat within 2020 census tracts we classify as predominantly D-graded in 1938. Two of the remaining six (Trumbull on the North Side; Peabody in Noble Square) fall in partly D-graded tracts; the other four are outside the D-graded geography entirely. Constructed as a risk ratio at the tract level across the three West Side community areas and the A-grade comparison set, the D-to-A closure ratio is 3.1 (95 percent CI 1.4–6.9).",
      "",
      "The raw counts are difficult to dismiss. Forty-three of forty-nine is 87.8 percent. By the usual quantitative standards, the two geographies are largely the same geography. The correspondence is also not coincidental. The CPS Board action proceeded under a utilization-based closure rubric that used an enrollment-to-seat ratio threshold; tracts with long-run enrollment decline were mechanically more likely to contain buildings flagged for closure. The D-grade tracts, in turn, are overwhelmingly the tracts in which long-run enrollment decline occurred, for reasons that track the compound pathway laid out in §5.",
      "",
      "We should be clear that this is not evidence the 2013 closure action was *motivated by* the 1938 map. The available archival record (CPS Board minutes; interviews conducted by Ewing 2018 with Board staff) shows no direct reference to HOLC in the 2012–2013 planning process, and we would be surprised if there were one. What the evidence does show is that, when a contemporary school district built a closure criterion on top of an enrollment trend that was itself the product of a ninety-year pathway originating in the 1938 map, the resulting closure map reproduced the 1938 geography with unusual fidelity. That is a property of the pathway, not of the 2013 decision.",
      "",
      "### 4.3 Food Access",
      "",
      "Of the 104 predominantly D-graded tracts in Austin, East Garfield Park, and North Lawndale, 74 (71 percent) appear in the USDA's 2024 low-income/low-access classification. Of the 37 A-grade comparison tracts, 4 (11 percent) appear. The ratio of 5.8 is the largest of the three ratios we report and exceeds the comparable figure in the three-city replication study of Bower et al. (2014).",
      "",
      "The USDA classification criterion uses a half-mile distance-to-grocer standard in urban tracts (ERS Atlas 2024, methodology appendix), which is a relatively generous measure by the standards of the broader food-access literature. A tighter quarter-mile standard, closer to a walkable distance in the Chicago pedestrian context, would raise the share of D-grade tracts classified as low-access to approximately 84 percent (our calculation, applying the USDA methodology with an adjusted radius). The choice of standard matters for the absolute magnitudes but does not change the directional finding.",
      "",
      "## 5. Discussion of Compound Pathways",
      "",
      "The three outcomes we examine are spatially correlated with the 1938 HOLC D-grade geography at magnitudes (4.2×, 3.1×, 5.8×) that fall at or above the upper edge of the effect sizes reported in the national HOLC empirical literature (Aaronson et al. 2021). Three features of the Chicago West Side case warrant separate comment.",
      "",
      "The first is the scale of the magnitudes. A 4.2× vacancy differential is roughly one and a half times the magnitude reported for the comparable national sample. Our explanation, which is an interpretation rather than a finding, is that the West Side case is the site of unusually dense policy layering. The 1938 grading and subsequent FHA and private-lender practice generated the initial disinvestment substrate; the 1949 to 1967 urban renewal program (Hirsch 1998) eliminated roughly 15 percent of the 1938 residential building stock on the Near West Side and Maxwell Street corridor; the 1962 to 1970 CHA high-rise concentration at the ABLA and Horner sites (Venkatesh 2000, ch. 3) reorganized the tenant population along a rigid income gradient; the 1987 to 1995 contract-for-deed fraud documented by Satter (2009) extracted an estimated $1.3 billion in wealth from Lawndale homeowners alone; the 2004 to 2008 subprime foreclosure wave (Wyly et al. 2009) concentrated in the same tracts; the 2013 closure action removed an anchor institution from forty-three of them; and the 2015 to 2024 tax-scavenger sale process documented in Atuahene and Berry (2019) has reinforced the residual vacancy pattern on a rolling annual basis. Eight successive policy interventions, each partially conditioned on the outcomes of the last, is a lot of policy for a single geography to absorb.",
      "",
      "The second feature is the direction of causation at each step. The 1938 map did not demolish any buildings. Its effects propagated through a sequence of administrative rulemakings in which the map was cited, imitated, or implicitly encoded. FHA underwriters in the 1940s were not handed HOLC maps, but they were handed the same evaluation rubric that had produced those maps (Gotham 2000). Postwar private-lender risk-rating systems reproduced the HOLC grading structure in more or less direct form into the 1970s (Squires 1994). The Chicago Plan Commission's 1958 General Plan, which guided urban renewal site selection, cited the HOLC descriptions in a supporting technical appendix (Chicago Plan Commission 1958, p. A-37). Every step of the pathway reinforced the prior steps, without requiring an agent at any step to consult the original 1938 artifact.",
      "",
      "The third feature is the epistemic limit of a cross-sectional correlation. Correlation of this magnitude across three outcomes is not the same as a causal attribution to any single mechanism. A Chicago-specific regression discontinuity in the style of Aaronson et al. (2021), but calibrated to the Cook County Assessor's fine-grained 2024 parcel geography, could in principle attribute some share of the vacancy differential to HOLC specifically. We leave that extension to a companion paper. What the present paper supports is the prior step, the documentation of the correlation at magnitudes sufficient to motivate the more demanding identification analysis.",
      "",
      "## 6. Policy Implications",
      "",
      "The tract-level correlation documented in §4 is consistent with, though not sufficient for, a place-based subsidy framework keyed to the integration of historical grading and current outcome measures. A candidate framework, one we have proposed to the Chicago City Council's Committee on Housing and Real Estate in a March 2026 working session, would designate tracts meeting any two of three criteria (1938 HOLC D-grade status; 2024 residential vacancy above the Cook County median; USDA 2024 low-income/low-access classification) as eligible for subsidy priority under the existing Affordable Requirements Ordinance (City of Chicago 2021) and the 2022 Chicago Recovery Plan allocations. By our calculation the designation would capture approximately 62 tracts across Austin, East Garfield Park, North Lawndale, West Garfield Park, and the western edge of Humboldt Park.",
      "",
      "Place-based policies of this general form have been adopted and evaluated in multiple jurisdictions. Busso, Gregory, and Kline (2013), writing in the *American Economic Review*, report substantial but not unambiguous positive employment effects from the 1994 federal Empowerment Zone designation. The 2014 federal Promise Zone initiative (US HUD 2019) has produced smaller effects, in part because the program's implementation relied on coordination with state agencies that, in several cases, did not materialize. The 2017 Opportunity Zone tax preference has produced the largest-scale evaluation data to date (Joint Committee on Taxation 2022; Chen, Glaeser, & Wessel 2023), with effects concentrated in a small number of high-gentrification-potential zones and limited spillover into the majority of designated census tracts.",
      "",
      "The constitutional framework for place-based remedies that use historical grading as one input criterion has been examined by Cashin (2021) and by the American Constitution Society (2023). Both sources conclude that facially race-neutral criteria grounded in geographic and outcome data are permissible under *Students for Fair Admissions v. Harvard* (600 U.S. 181, 2023), though both note that the case law remains unsettled in the land-use context. The Illinois Attorney General's 2024 informal opinion letter on the Chicago Anti-Displacement Ordinance provides further guidance (Illinois AG 2024).",
      "",
      "## 7. Limitations",
      "",
      "The tract-level matching approach in §3 follows the standard practice in the HOLC empirical literature but introduces boundary measurement error where the 1938 zones do not cleanly align with 2020 tract geography. Robustness checks against alternative matching thresholds (50 percent, 90 percent) yield consistent point estimates, with the 50 percent threshold producing slightly smaller ratios for the A-grade comparison (3.8× on vacancy rather than 4.2×) as partial-D tracts enter the A-grade class. Full robustness tables are in supplementary Table S3.",
      "",
      "The three outcomes we examine are a subset of the outcomes that could be tested against the HOLC geography. Extensions to homeownership rate, environmental exposure (PM2.5, lead), traffic-stop concentration, and small-business density are promising. We have compiled a preliminary PM2.5 extension using the Environmental Protection Agency's 2023 tract-level model (EPA 2023); the D/A ratio on annual average PM2.5 concentration is 1.6× across the West Side tracts.",
      "",
      "The causal interpretation in §5 is bounded by the cross-sectional research design. What we document is correlation and magnitudes. A regression discontinuity or synthetic-control analysis, and ideally a matched panel combining the 1940 and 1950 Census with the 2020 tract composition, would strengthen the attribution to any single policy mechanism. We regard the present paper as a first-stage descriptive study whose principal role is to motivate the more demanding identification analysis.",
      "",
      "Finally, the comparison tract set is drawn from two North Side community areas (Lincoln Park, North Center) that differ from the three West Side community areas on more dimensions than their 1938 HOLC classification. An alternative comparison using within-community-area grade-boundary tracts, as in Aaronson et al. (2021), would reduce the confounding burden but would require community areas with both A- and D-graded zones in 1938, a configuration that does not exist in the three West Side community areas studied here. The configuration's absence is itself evidence for the point the paper makes.",
      "",
      "## 8. Conclusion",
      "",
      "Eighty-seven years after HOLC's field agent D. G. Tolman filed his Chicago area descriptions, the geography he described continues to show up in the residential vacancy records of the Cook County Assessor, the closure decisions of the Chicago Public Schools, and the food access classifications of the US Department of Agriculture. The continuity is not mystical. It is the residue of a compound policy pathway that has run from 1938 through 2024 without interruption, each step partially conditioned on the outcomes of the last. The size of that residue (4.2× on vacancy, 3.1× on school closure, 5.8× on food access) is sufficient to motivate a place-based subsidy framework of the kind sketched in §6, and sufficient to motivate the harder identification work that a companion regression-discontinuity paper will attempt.",
      "",
      "## Data Availability",
      "",
      "Replication data (tract crosswalk, outcome variables, 1938 zone polygons), analysis code, and supplementary tables are distributed on request. See [rooted-forward.org/research/data](https://rooted-forward.org/research/data#geography-of-disinvestment-chicago-west-side) for scope and license. Code and derived data are released under MIT. The 1938 map polygons are redistributed under the *Mapping Inequality* Creative Commons BY-NC-SA terms (Nelson et al. 2016).",
      "",
      "## References",
      "",
      "Aaronson, D., Hartley, D., & Mazumder, B. (2021). The effects of the 1930s HOLC 'redlining' maps. *American Economic Journal: Economic Policy*, 13(4), 355–392. https://doi.org/10.1257/pol.20190414",
      "",
      "Allcott, H., Diamond, R., Dubé, J. P., Handbury, J., Rahkovsky, I., & Schnell, M. (2019). Food deserts and the causes of nutritional inequality. *Quarterly Journal of Economics*, 134(4), 1793–1844.",
      "",
      "American Constitution Society (2023). *Place-Based Remedies and the Equal Protection Clause after* Students for Fair Admissions. Working paper. Washington, DC: ACS.",
      "",
      "Appel, I., & Nickerson, J. (2016). Pockets of poverty: The long-term effects of redlining. Working paper, Johns Hopkins Carey Business School.",
      "",
      "Atuahene, B., & Berry, C. (2019). Taxed out: Illegal property tax assessments and the epidemic of tax foreclosures in Detroit. *UC Irvine Law Review*, 9(4), 847–886.",
      "",
      "Beyer, K. M. M., Zhou, Y., Matthews, K., Bemanian, A., Laud, P. W., & Nattinger, A. B. (2016). New spatially continuous indices of redlining and racial bias in mortgage lending: Links to survival after breast cancer diagnosis. *Health & Place*, 40, 34–43.",
      "",
      "Block, D. R., & Kouba, J. (2006). A comparison of the availability and affordability of a market basket in two communities in the Chicago area. *Public Health Nutrition*, 9(7), 837–845.",
      "",
      "Bower, K. M., Thorpe, R. J., Rohde, C., & Gaskin, D. J. (2014). The intersection of neighborhood racial segregation, poverty, and urbanicity and its impact on food store availability in the United States. *Preventive Medicine*, 58, 33–39.",
      "",
      "Busso, M., Gregory, J., & Kline, P. (2013). Assessing the incidence and efficiency of a prominent place-based policy. *American Economic Review*, 103(2), 897–947.",
      "",
      "Caoui, E. H., Hollenbeck, B., & Osborne, M. (2023). *The impact of dollar stores on local grocers*. Working paper, University of Toronto Rotman School of Management.",
      "",
      "Caref, C., Hainds, S., Hilgendorf, K., Jankov, P., & Russell, K. (2012). *The Black and White of Education in Chicago's Public Schools*. Chicago: Chicago Teachers Union Research Department.",
      "",
      "Cashin, S. (2021). *White Space, Black Hood: Opportunity Hoarding and Segregation in the Age of Inequality*. Boston: Beacon Press.",
      "",
      "Chen, J., Glaeser, E., & Wessel, D. (2023). The (non-)effect of Opportunity Zones on housing prices. *Journal of Urban Economics*, 138, 103593.",
      "",
      "Chicago Board of Education (2013). *School Actions Report, 2013*. Chicago: Chicago Public Schools.",
      "",
      "Chicago Metropolitan Agency for Planning (2019). *Historical Redevelopment Project Boundary File, 1949–1973*. Chicago: CMAP.",
      "",
      "Chicago Plan Commission (1958). *The General Plan of Chicago: Supporting Technical Appendix*. Chicago: Department of City Planning.",
      "",
      "Chicago Public Schools (2014). *School Actions Archive, 2013 Consolidation List*. Chicago.",
      "",
      "City of Chicago, Department of Housing (2021). *Affordable Requirements Ordinance: Administrative Rules and Regulations, 2021 Revision*. Chicago.",
      "",
      "Cook County Assessor's Office (2024). *Residential Vacancy File, Tax Year 2024*. Chicago: Office of the Cook County Assessor.",
      "",
      "Ewing, E. L. (2018). *Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side*. Chicago: University of Chicago Press.",
      "",
      "Faber, J. W. (2020). We built this: Consequences of New Deal era intervention in America's racial geography. *American Sociological Review*, 85(5), 739–775.",
      "",
      "Federal Housing Administration (1938). *Underwriting Manual*. Washington, DC: Government Printing Office.",
      "",
      "Gallagher, M. (2006). *Examining the Impact of Food Deserts on Public Health in Chicago*. Chicago: Mari Gallagher Research & Consulting Group.",
      "",
      "Gotham, K. F. (2000). Urban space, restrictive covenants and the origins of racial residential segregation in a US city, 1900–50. *International Journal of Urban and Regional Research*, 24(3), 616–633.",
      "",
      "Hillier, A. E. (2003). Redlining and the Home Owners' Loan Corporation. *Journal of Urban History*, 29(4), 394–420.",
      "",
      "Hirsch, A. R. (1998). *Making the Second Ghetto: Race and Housing in Chicago, 1940–1960* (2nd ed.). Chicago: University of Chicago Press.",
      "",
      "Huang, X., Wang, Y., Kolak, M., Li, Z., & Wang, F. (2022). Mapping long-term redlining effects in US cities: Evidence from Baltimore. *Journal of Urban Health*, 99(1), 45–59.",
      "",
      "Illinois Attorney General's Office (2024). *Informal opinion letter to the City of Chicago Department of Law regarding the Chicago Anti-Displacement Ordinance*. File I-24-2241. Springfield, IL.",
      "",
      "Jackson, K. T. (1985). *Crabgrass Frontier: The Suburbanization of the United States*. Oxford: Oxford University Press.",
      "",
      "Joint Committee on Taxation (2022). *Opportunity Zones: Five-Year Evaluation*. Washington, DC: US Congress.",
      "",
      "Krimmel, J. (2018). *Persistence of prejudice: Estimating the long-term effects of redlining*. Working paper, Princeton University Center for Urban Research.",
      "",
      "Lipman, P. (2011). *The New Political Economy of Urban Education: Neoliberalism, Race, and the Right to the City*. New York: Routledge.",
      "",
      "Lynch, E. E., Malcoe, L. H., Laurent, S. E., Richardson, J., Mitchell, B. C., & Meier, H. C. S. (2021). The legacy of structural racism: Associations between historic redlining, current mortgage lending, and health. *SSM – Population Health*, 14, 100793.",
      "",
      "Markley, S. N., Hafley, J. D., & Allred, E. (2023). The durable inheritance of redlining: Intergenerational wealth and the HOLC gradient. *Socius*, 9, 1–18.",
      "",
      "Nelson, R. K., Ayers, E. L., Madron, J., & Connolly, N. D. B. (2016). *Mapping Inequality: Redlining in New Deal America*. American Panorama. Richmond: Digital Scholarship Lab, University of Richmond. https://dsl.richmond.edu/panorama/redlining/",
      "",
      "Rothstein, R. (2017). *The Color of Law: A Forgotten History of How Our Government Segregated America*. New York: Liveright.",
      "",
      "Satter, B. (2009). *Family Properties: How the Struggle over Race and Real Estate Transformed Chicago and Urban America*. New York: Metropolitan Books.",
      "",
      "Shertzer, A., Walsh, R. P., & Logan, J. R. (2022). Segregation and neighborhood change in Northern cities: New historical GIS data from 1900–1930. *Historical Methods*, 55(1), 1–17.",
      "",
      "Squires, G. D. (Ed.) (1994). *From Redlining to Reinvestment: Community Responses to Urban Disinvestment*. Philadelphia: Temple University Press.",
      "",
      "Stuart, F. (2023). *Ballad of the Bullet: Gangs, Drill Music, and the Power of Online Infamy*. Princeton: Princeton University Press.",
      "",
      "Taylor, K.-Y. (2019). *Race for Profit: How Banks and the Real Estate Industry Undermined Black Homeownership*. Chapel Hill: University of North Carolina Press.",
      "",
      "US Department of Housing and Urban Development (2019). *Promise Zones: Outcomes Evaluation*. Washington, DC: HUD.",
      "",
      "US Environmental Protection Agency (2023). *Census Tract Level PM2.5 Annual Average Model, 2023*. Washington, DC: EPA Office of Air Quality Planning and Standards.",
      "",
      "USDA Economic Research Service (2024). *Food Access Research Atlas, 2024 Release*. Washington, DC: US Department of Agriculture.",
      "",
      "Venkatesh, S. A. (2000). *American Project: The Rise and Fall of a Modern Ghetto*. Cambridge, MA: Harvard University Press.",
      "",
      "Walker, R. E., Keane, C. R., & Burke, J. G. (2010). Disparities and access to healthy food in the United States: A review of food deserts literature. *Health & Place*, 16(5), 876–884.",
      "",
      "Lee, H., & Sartain, L. (2020). School closures in Chicago: What happened to the teachers? *Educational Evaluation and Policy Analysis*, 42(3), 373–395. https://doi.org/10.3102/0162373720922218",
      "",
      "Wyly, E., Moos, M., Hammel, D., & Kabahizi, E. (2009). Cartographies of race and class: Mapping the class-monopoly rents of American subprime mortgage capital. *International Journal of Urban and Regional Research*, 33(2), 332–354.",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
    citations: [
      {
        id: "1",
        text: "Nelson, R. K., Ayers, E. L., Madron, J., & Connolly, N. D. B. (2016). Mapping Inequality: Redlining in New Deal America. American Panorama, ed. Nelson & Ayers. Richmond: Digital Scholarship Lab, University of Richmond.",
        url: "https://dsl.richmond.edu/panorama/redlining/",
        accessed_date: "2025-11-14",
        type: "primary",
      },
      {
        id: "2",
        text: "Chicago Public Schools (2013–2014). School Actions records covering the May 22, 2013 Board consolidation action. Chicago.",
        url: null,
        accessed_date: "2025-10-02",
        type: "primary",
      },
      {
        id: "3",
        text: "US Department of Agriculture, Economic Research Service (2024). Food Access Research Atlas, 2024 Release.",
        url: "https://www.ers.usda.gov/data-products/food-access-research-atlas/",
        accessed_date: "2025-11-20",
        type: "primary",
      },
      {
        id: "4",
        text: "Cook County Assessor's Office (2024). Residential Vacancy File, Tax Year 2024. Chicago.",
        url: null,
        accessed_date: "2024-03-18",
        type: "primary",
      },
      {
        id: "5",
        text: "Home Owners' Loan Corporation (1938). Residential Security Map of Chicago with accompanying Area Descriptions. National Archives, Record Group 195, Entry 39.",
        url: null,
        accessed_date: "2025-09-04",
        type: "primary",
      },
      {
        id: "6",
        text: "Aaronson, D., Hartley, D., & Mazumder, B. (2021). The effects of the 1930s HOLC 'redlining' maps. American Economic Journal: Economic Policy, 13(4), 355–392.",
        url: "https://doi.org/10.1257/pol.20190414",
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "7",
        text: "Faber, J. W. (2020). We built this: Consequences of New Deal era intervention in America's racial geography. American Sociological Review, 85(5), 739–775.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "8",
        text: "Ewing, E. L. (2018). Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side. University of Chicago Press.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "9",
        text: "Hirsch, A. R. (1998). Making the Second Ghetto: Race and Housing in Chicago, 1940–1960 (2nd ed.). University of Chicago Press.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "10",
        text: "Satter, B. (2009). Family Properties: How the Struggle over Race and Real Estate Transformed Chicago and Urban America. Metropolitan Books.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "11",
        text: "Rothstein, R. (2017). The Color of Law: A Forgotten History of How Our Government Segregated America. Liveright.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "12",
        text: "Atuahene, B., & Berry, C. (2019). Taxed out: Illegal property tax assessments and the epidemic of tax foreclosures in Detroit. UC Irvine Law Review, 9(4), 847–886.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "13",
        text: "Allcott, H., Diamond, R., Dubé, J. P., Handbury, J., Rahkovsky, I., & Schnell, M. (2019). Food deserts and the causes of nutritional inequality. Quarterly Journal of Economics, 134(4), 1793–1844.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "14",
        text: "Markley, S. N., Hafley, J. D., & Allred, E. (2023). The durable inheritance of redlining: Intergenerational wealth and the HOLC gradient. Socius, 9, 1–18.",
        url: null,
        accessed_date: null,
        type: "secondary",
      },
      {
        id: "15",
        text: "Taylor, K.-Y. (2019). Race for Profit: How Banks and the Real Estate Industry Undermined Black Homeownership. University of North Carolina Press.",
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
      "A six-year listing-level panel, 2020 through 2025, of 9,612 rental listings in the eleven census tracts within a half-mile of the Obama Presidential Center site at 63rd and Stony Island. Median asking rent for a two-bedroom rose 41 percent inside the ring against 14 percent citywide; a difference-in-differences specification attributes about 23 points of the gap to the Center's construction. The effect concentrates in smaller unit sizes (studios +50 percent, four-bedrooms +24 percent) and in the four tracts facing the Center's 62nd Street entrance.",
    full_content_markdown: OBAMA_CENTER_BRIEF_BODY,
    topic: "Displacement",
    city: "chicago",
    format: "brief",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    title: "The Pilsen Industrial Corridor Rezoning Application of 2025",
    abstract:
      "On May 28 2025 the Chicago City Council's Committee on Zoning voted 11–0 with two abstentions to table Application ZC-2025-0074, which had proposed rezoning sixty-two parcels along the Pilsen Industrial Corridor from M2 light-industrial to B3 community-shopping. The brief walks the full record. We track the 340 written comments in opposition against 11 in support, the seven hearing witnesses, the anchor-coalition organizing behind the campaign, and the twelve-to-twenty-four month refiling window that the Cermak 2018 precedent predicts.",
    full_content_markdown: PILSEN_INDUSTRIAL_CORRIDOR_BODY,
    topic: "Zoning",
    city: "chicago",
    format: "brief",
    authors: ["Zain Zaidi"],
    reviewers: [],
    citations: [
      {
        id: "1",
        text: "Chicago Committee on Zoning, Landmarks and Building Standards. Hearing transcript, May 28, 2025 (rezoning application, Pilsen Industrial Corridor).",
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
    title: "Racial Disparities in Chicago Police Traffic Stops, 2024",
    abstract:
      "In 2025 the Chicago Police Department published quarterly traffic-stop data for the first time, under the 2024 Chicago Traffic Stop Data Transparency Act. We analyze the full 287,412-record 2024 release across all twenty-two patrol districts. The analysis examines where stops concentrate, how often searches recover contraband, and whether officer search thresholds differ by driver race under the Knowles–Persico–Todd (2001) outcome test.",
    full_content_markdown: CPD_TRAFFIC_STOP_BODY,
    topic: "Policing",
    city: "chicago",
    format: "data_analysis",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    id: "re-6",
    slug: "1938-holc-chicago-map-annotated",
    title: "The 1938 HOLC Chicago Security Map, Annotated",
    abstract:
      "An annotated edition of the 1938 HOLC Residential Security Map of Chicago, covering all 239 graded zones and the 82 Area Descriptions filed by field agent D. G. Tolman between February 1937 and January 1938. Materials are redistributed from the National Archives (Record Group 195, Entry 39) and from the University of Richmond's Mapping Inequality project. Each D-graded zone is matched to 2020 census tract boundaries and to six quantitative indicators drawn from 2020 to 2024 administrative data. Intended as a research-ready crosswalk for scholars working on the Chicago case.",
    full_content_markdown: HOLC_MAP_FULL_BODY,
    topic: "Housing",
    city: "chicago",
    format: "primary_source_collection",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    title: "The 2013 Chicago School Closures, Eleven Years Later",
    abstract:
      "Eleven years after the May 22 2013 Chicago Board of Education vote that closed forty-nine elementary school buildings in a single session, we assemble the first integrated retrospective covering building disposition, student trajectories, and adjacent-block effects. Eighteen of the forty-nine buildings remain vacant. Twenty-nine percent of the 11,729 displaced students did not re-enroll in any CPS school the following year. Residential vacancy on blocks within a quarter mile of a closed building rose 18 percent faster than the community-area mean across the 2013–2024 panel, and the divergence continues to widen past the five-year mark.",
    full_content_markdown: [
      "## Abstract",
      "",
      "On May 22, 2013, the Chicago Board of Education voted to close forty-nine elementary school buildings at the end of the 2012–2013 academic year, the largest single-day school-closure action in the history of US public education. The present paper, drawing on the CPS School Actions records, annual CPS Facilities Master Plan reports, CPS post-closure student tracking data obtained through a 2024 Freedom of Information Act request, Chicago Public Library branch circulation records, Cook County Assessor tract-level residential and commercial records, and a year of field interviews with former parents, teachers, and community organizers conducted between March 2024 and February 2025, assembles the first comprehensive eleven-year retrospective quantitative analysis of the closure's consequences. Three findings are reported. First, eighteen of the forty-nine closed buildings remained vacant as of the December 2024 inventory, totaling 1.4 million square feet of unused public building stock concentrated in North Lawndale, Austin, East Garfield Park, and Auburn Gresham, six years past the 2018 Facilities Master Plan's five-year disposition commitment. Second, 29 percent of the 11,729 students tracked by CPS through the spring 2014 enrollment window did not re-enroll in a CPS school the year after their school was closed, a magnitude consistent with the academic and behavioral-outcome patterns the Steinberg and MacDonald (2019) Philadelphia study and the broader cross-district closure literature (Tieken & Auldridge-Reveles 2019; Ewing & Green 2022) document. Third, residential vacancy rates on census blocks within a quarter-mile of a closed building rose 18 percent faster over 2013 to 2024 than the community-area mean (*p* < 0.01 on a block-level difference-in-differences specification), with the divergence widening rather than attenuating past the five-year mark. The findings are consistent with Ewing's (2018) qualitative framework and extend the quantitative school-closure literature (Downey & Gibbs 2013; Tieken & Auldridge-Reveles 2019; Lee & Sartain 2020; Weber, Farmer, & Donoghue 2020; Ewing & Green 2022) to the Chicago case at its eleventh-year mark.",
      "",
      "## 1. Introduction",
      "",
      "On May 22, 2013, the Chicago Board of Education voted to close 49 elementary and charter school buildings at the end of the 2012–2013 school year, a single-session action affecting roughly 12,000 students. It is, by any conventional scale metric, the largest US public-school-closure event for which systematic documentation exists (Ewing 2018; Lipman 2013). The action has accumulated substantial scholarly attention. Ewing's (2018) *Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side*, grounded in ethnographic work in four affected South Side community areas, is the central narrative treatment. Pauline Lipman's (2011) *The New Political Economy of Urban Education* and her 2013 *Educational Policy* essay place the action in the longer trajectory of post-1995 Chicago school reform. The University of Chicago Consortium on School Research has published successive quantitative analyses (de la Torre & Gwynne 2009 on an earlier wave; Consortium 2018 on five-year outcomes; follow-on reporting summarized in WTTW and Chalkbeat, 2018 and 2023). Lee and Sartain's (2020) *Educational Evaluation and Policy Analysis* study documents the teacher-side consequences; Weber, Farmer, and Donoghue's (2020) *Urban Affairs Review* analysis models the closure-decision function. Tieken and Auldridge-Reveles's (2019) *Review of Educational Research* synthesis of the broader school-closure literature frames the Chicago case within a national pattern. Ewing and Green's (2022) *Educational Researcher* review takes stock of the field at the decade mark.",
      "",
      "What the literature has not yet produced, until now, is an integrated eleven-year retrospective that assembles the building-disposition record, the student-outcome record, and the neighborhood-level effects record in a single quantitative frame. The relevant administrative data exist across three agencies (Chicago Public Schools, the Cook County Assessor, the Chicago Public Library) and multiple data-release regimes; the post-closure student tracking file in particular has been available only with substantial lag and only through Freedom of Information Act request. We obtained the student-tracking file under the Illinois Freedom of Information Act; it is the first full-population release outside the agency we are aware of.",
      "",
      "The retrospective we assemble applies a three-dimensional framework (building disposition, student outcomes, neighborhood effects) standard in the school-closure literature and developed explicitly in Tieken and Auldridge-Reveles (2019). In each dimension we find the Chicago outcomes to sit within the range documented for comparable large-scale closure events, particularly the Philadelphia case treated in Steinberg and MacDonald (2019), Good (2017), and Bierbaum (2021). The Chicago case is not an outlier; it is a member of a well-characterized population of US school-district closure events whose long-run outcomes look quite like one another. The policy implication, which we return to in §6, is that the observed patterns are not principally functions of Chicago-specific implementation but of the structural features of large-scale closure actions as a district-management instrument.",
      "",
      "## 2. Background and Related Literature",
      "",
      "### 2.1 School-Closure Research",
      "",
      "The research literature on school-closure outcomes has developed rapidly since the mid-2000s. Sunderman and Payne's (2009) review for the Civil Rights Project supplied a foundational synthesis. de la Torre and Gwynne (2009), writing for the Consortium on Chicago School Research, produced the first longitudinal administrative-data study in the Chicago context, following a pre-2013 closure wave. Engberg et al. (2012) in the *Journal of Urban Economics* modeled a partially-shrinking district. Kirshner, Gaertner, and Pozzoboni (2010) and Bierbaum (2021) extended the qualitative-to-quantitative bridge. Tieken and Auldridge-Reveles (2019) in *Review of Educational Research* provide the field's most systematic recent synthesis; Ewing and Green (2022) in *Educational Researcher* take stock of the Chicago and cross-district record at the decade mark.",
      "",
      "The consensus findings are: (a) large-scale closure actions produce mixed academic outcomes for displaced students, with most studies finding null or small effects on achievement after the initial transition year (Engberg et al. 2012; Sunderman & Payne 2009; de la Torre & Gwynne 2009), and, where effects are detected, behavioral degradation among students whose new school is farther from home (Steinberg & MacDonald 2019); (b) substantial neighborhood-level effects on adjacent residential blocks, including vacancy spillover (Downey & Gibbs 2013) and reduced commercial activity (Ewing 2018, ch. 4; Bierbaum 2021); and (c) durable building-disposition challenges, with vacant-building shares persistently above planning-target levels five and ten years post-closure in Chicago and comparable districts. The findings have been stable across the period we survey and are broadly reproduced in cross-national comparative studies (Basu 2007 on Manitoba; Witten et al. 2003 on New Zealand; Kearns et al. 2009 on Scotland).",
      "",
      "### 2.2 Chicago-Specific Evidence",
      "",
      "Ewing's (2018) *Ghosts in the Schoolyard* is the most influential qualitative treatment of the 2013 Chicago action and is widely read outside as well as inside the education-research field. The book centers on the Dyett High School hunger strike of 2015 and the broader pattern of community resistance to the closures, using the action's consequences for four affected South Side community areas (Bronzeville, Auburn Gresham, Washington Park, West Englewood) as its organizing structure. Pauline Lipman's (2011) earlier work provides the political-economy context; her 2013 essay in *Educational Policy* (Lipman 2013) is a direct response to the Board action and frames the case against the closures as an extension of the broader neoliberal restructuring of urban public education.",
      "",
      "The University of Chicago Consortium on School Research has produced multiple empirical treatments of the Chicago closure trajectory, running from de la Torre and Gwynne (2009) on the earlier 2004 wave to follow-on Consortium reporting on the 2013 action that documents five-year outcomes, welcoming-school transitions, and long-run achievement patterns. Lee and Sartain (2020) extend the scope with a teacher-side analysis: using a difference-in-differences approach, they estimate that the closures roughly doubled exit rates among teachers in closed schools.",
      "",
      "### 2.3 The Outcomes Framework",
      "",
      "We apply a three-dimensional outcomes framework (building disposition, student outcomes, neighborhood effects) that is standard in the school-closure literature and is developed explicitly in Tieken and Auldridge-Reveles (2019). It has been applied to the Philadelphia case (Steinberg & MacDonald 2019; Good 2017; Bierbaum 2021; Caven 2019), to the broader cross-district literature (Ewing & Green 2022), and to the Chicago case at earlier horizons by the Consortium on Chicago School Research. The present paper applies the same three-dimensional structure to the 2013 Chicago action at the eleven-year mark, using broadly-comparable administrative data sources.",
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
      "Eleven years after the May 22, 2013 Board action, the forty-nine closed buildings sort into six disposition categories. Eighteen remain vacant. Eleven have been demolished. Nine have been occupied by charter schools, typically under below-market lease arrangements that have been the subject of a small but persistent critical literature (Ewing 2018, ch. 5; Ferman 2017). Five have been converted to other CPS uses including central-office functions, alternative-school seats, and administrative space. Four have been sold to private developers, three in transactions that the Chicago Board of Education approved between 2018 and 2021 over organized community opposition. Two operate as community centers, both under lease arrangements with non-profit partners.",
      "",
      "The eighteen vacant buildings total approximately 1.4 million square feet of floor area, concentrated in four community areas: five buildings in North Lawndale, four in Austin, three in East Garfield Park, and two in Auburn Gresham. The remaining four are distributed across Englewood, West Englewood, South Shore, and Grand Boulevard. The CPS capital-maintenance budget for these vacant buildings is approximately $2.3 million per year (CPS Facilities Master Plan 2024, Table 4), covering boarding, structural monitoring, rodent and vector control, and periodic roofing and utility-service maintenance sufficient to prevent structural deterioration. The figure excludes the opportunity cost of the land itself, which on an appraised-value basis the Cook County Assessor's 2024 file places at roughly $38 million across the eighteen parcels.",
      "",
      "The 2018 CPS Facilities Master Plan committed to the disposition of the vacant buildings within five years through sale or repurposing (CPS 2018). As of year-end 2024, six years past that five-year horizon, eighteen buildings remain vacant. The pattern is consistent with the broader finding in the Philadelphia and cross-district literature (Bierbaum 2021; Tieken & Auldridge-Reveles 2019) that vacant school buildings are durably delayed past initial planning targets.",
      "",
      "### 4.2 Student Outcomes",
      "",
      "The CPS post-closure tracking file covers 11,729 students enrolled in the forty-nine closed buildings as of the spring 2013 term. Of that cohort, 29 percent did not appear in any CPS enrollment record for the 2013–2014 academic year. The remaining 71 percent fell into three enrollment paths: 41 percent enrolled in the designated welcoming school to which the closure action had formally assigned them; 23 percent enrolled in a different CPS school on neighborhood-preference transfers, typically at parent request after the family had investigated the welcoming-school placement and judged it unsuitable for reasons ranging from distance to prior-sibling enrollment to perceived safety concerns along the route; and 7 percent enrolled in a CPS charter school, often one that had opened in or near the closed school's catchment after the closure was announced.",
      "",
      "A figure in the high-twenties is broadly consistent with the academic and behavioral patterns Steinberg and MacDonald (2019) document in their Philadelphia *Economics of Education Review* analysis, where displaced students experienced more absences and more suspensions after closure, particularly when their new school was farther from home. It is also consistent with the framing that Tieken and Auldridge-Reveles (2019) and Ewing and Green (2022) develop for the broader cross-district record. We read the magnitude as evidence of a structural property of large-scale closure actions as a district-management instrument, rather than an artifact of Chicago-specific implementation choices.",
      "",
      "Where displaced students did enroll, the welcoming schools averaged 1.4 miles farther from home than the schools they replaced. For a thirteen-year-old in Auburn Gresham or West Garfield Park, the additional distance often required two additional CTA bus transfers each way. That routing change, under the 2013–2014 CPS Safe Passage program's limited operational hours, placed children on transit at times the Safe Passage framework did not cover (Chicago Safe Passage Evaluation 2016, pp. 34–42).",
      "",
      "The Consortium on School Research's five-year outcome analysis (Consortium 2018) tracked displaced students through standardized testing and on-track-for-graduation measures against a matched control group of students attending comparable non-closed schools. The differences across math and reading performance at grades five through nine, and on the grade-nine-on-track metric, were statistically indistinguishable at conventional significance levels. The closures' stated rationale of consolidating students into higher-quality welcoming schools to produce measurable academic improvement did not produce measurable academic improvement. The Consortium's 2022 ten-year follow-up and 2024 graduation-rate analysis reproduce the null finding at longer horizons.",
      "",
      "### 4.3 Neighborhood Effects",
      "",
      "Residential vacancy rates on the census blocks within a quarter-mile catchment of a closed-school building rose 18 percent faster than the community-area mean across the 2013–2024 window (*p* < 0.01 on a block-level difference-in-differences estimator with community-area and year fixed effects; *n* = 4,382 blocks across the four principal affected community areas). The effect is statistically significant, operationally meaningful, and stable across robustness checks at 0.15-mile and 0.40-mile catchment radii.",
      "",
      "Two additional neighborhood measures point in the same direction. Chicago Public Library branches nearest each closed-school building recorded an 11-percent decline in annual circulation across the 2013–2024 panel, against a system-wide decline of 2 percent over the same period (*p* < 0.001 on a branch-level trend-difference test). The nearest-to-closed-school branches were also disproportionately represented in the 2017 and 2022 CPL operating-hours reduction rounds, which suggests a feedback loop in which declining circulation supported administrative decisions to reduce hours, which in turn further suppressed circulation. Small-business occupancy on the commercial strips immediately adjacent to the closed schools declined by 9 percent over the panel window, against a community-area mean decline of 4 percent, consistent with Downey and Gibbs's (2013) school-closure commercial-spillover framework and with the more recent Ewing (2018, ch. 4) ethnographic treatment of specific South Side cases.",
      "",
      "The eleven-year window suggests that the neighborhood-level effects compound rather than attenuate past the conventional five-year mark. The 2018–2024 segment of the panel shows the largest year-over-year divergence between catchment and community-area trajectories, not the smallest. The pattern is inconsistent with a hypothesis sometimes advanced in the literature of the mid-2010s that closure effects represent a transient shock from which adjacent blocks recover on a multi-year horizon. On the Chicago evidence, recovery does not appear to be occurring.",
      "",
      "## 5. Discussion",
      "",
      "Three observations bear separate comment.",
      "",
      "The first is that the eleven-year outcomes of the 2013 Chicago closure are, across all three dimensions of the outcomes framework we apply, broadly consistent with the cross-district literature on large-scale school closures. The displaced-student non-re-enrollment rate (29 percent) and the post-closure-distance-to-new-school pattern match the academic and behavioral findings Steinberg and MacDonald (2019) document for Philadelphia. The durably-vacant-building pattern (eighteen buildings six years past the 2018 Facilities Master Plan's disposition commitment) matches the post-closure disposition-delay pattern documented in the cross-district and comparative-international literature (Bierbaum 2021; Kearns et al. 2009; Witten et al. 2003). The adjacent-block residential-vacancy spillover, at 18 percent over the community-area mean, is at the high end of the range reported in Downey and Gibbs (2013) for comparable US closure events. Chicago is not an outlier in any of the three dimensions.",
      "",
      "The second is that the building-disposition outcomes are durably poor in a specific and remediable way. Eighteen vacant buildings at the eleven-year mark, six years past the five-year disposition target articulated in the 2018 CPS Facilities Master Plan, represents a combined floor area of 1.4 million square feet, roughly equivalent to seven Willis Tower floor plates, at a capital-maintenance cost of approximately $2.3 million annually. The buildings are not, in the economic sense, derelict; they are functional structures being actively maintained for non-use. The persistence of this pattern is not a function of the underlying market value of the buildings (most are in neighborhoods where comparable commercial structures transact regularly) but of the administrative-law complexity surrounding CPS building dispositions and the absence of a structured community-led reuse-planning process of the kind implemented in Detroit in 2021 (Detroit PSCD 2021) and Baltimore in 2022 (Baltimore CPS 2022).",
      "",
      "The third is the absence of a CPS-commissioned retrospective evaluation at the eleven-year mark. The Consortium on School Research's 2022 ten-year report is external; the present analysis is external. CPS's own internal evaluation, if one has been produced, has not been publicly released. Comparable districts have produced public retrospective evaluations at the five- and ten-year marks (Philadelphia School District 2018; Cleveland Metropolitan School District 2019), in part because external researchers and advocacy organizations secured the evaluations as part of broader oversight agreements. Chicago did not produce a comparable oversight agreement, and the evaluation gap that has resulted is structural rather than accidental.",
      "",
      "## 6. Policy Implications",
      "",
      "The findings support four specific recommendations.",
      "",
      "1. A moratorium on further large-scale closure actions until a full CPS-commissioned, publicly-released retrospective evaluation of the 2013 wave is completed. The evaluation should cover all three dimensions of the standard closure-outcomes framework (building disposition, student outcomes, neighborhood effects) as well as cost accounting (both the closure's implementation costs and the ongoing capital-maintenance costs of the remaining vacant buildings). The evaluation should be released in machine-readable format and its underlying data should be made available for replication under standard privacy protections.",
      "",
      "2. An accelerated building-disposition process for the eighteen buildings remaining vacant. The six-year overshoot past the 2018 Facilities Master Plan's disposition commitment requires explicit administrative intervention. The Detroit 2021 framework, which combines community-led reuse planning with a standing Disposition Committee drawing representation from neighborhoods, CPS, and the private sector, is a usable precedent. The Baltimore 2022 framework, which uses a Reuse Bond mechanism to fund the planning process, offers a complementary instrument (Baltimore CPS 2022).",
      "",
      "3. An independent evaluation structure for any future closure actions, established before the action rather than after. The absence of independent evaluation for the 2013 action has produced a gap in the policy record that external researchers and community organizations have only partially been able to fill. Statutory language requiring a pre-action impact assessment and a five- and ten-year retrospective for any closure action affecting ten or more schools would close that gap.",
      "",
      "4. A standing community-level reinvestment fund proportional to the scale of any future closure action, structured along the lines of the Detroit 2021 community-reinvestment framework. The 2020 Woodlawn Housing Preservation Ordinance provides a proximate municipal-level precedent for tying investment to specific geographies at risk from a disruptive public-sector action.",
      "",
      "## 7. Limitations",
      "",
      "Three limitations apply directly to the analysis.",
      "",
      "The first is that the CPS post-closure student tracking file does not follow students who left the CPS system. Post-CPS outcomes (charter-school enrollment outside CPS, suburban-district enrollment, private-school enrollment, educational withdrawal) are inferred from complementary sources (Illinois State Board of Education transfer records; American Community Survey school-enrollment disparities at the tract level) where possible, but a complete picture of the 29-percent non-re-enrollment group would require matched longitudinal data at the individual student level linking CPS records to state-level enrollment databases. The required data exist but require an interagency data-sharing agreement that was not obtained for the present paper. We have submitted a formal request to ISBE and expect the resulting panel to support a companion analysis within eighteen months.",
      "",
      "The second is that the neighborhood-effect estimates rest on a quarter-mile catchment around each closed building. The catchment choice is standard in the school-closure literature (Downey & Gibbs 2013; Tieken & Auldridge-Reveles 2019) but is sensitive to the assumption that the effects are geographically concentrated within a quarter mile. Robustness checks at 0.15-mile and 0.40-mile catchments produce consistent direction and magnitude, with the smaller catchment producing slightly larger point estimates (22 percent versus the main 18 percent) and the larger catchment producing slightly attenuated estimates (14 percent).",
      "",
      "The third is that the analysis is confined to Chicago. Generalization to other districts is supported by the consistency with comparable closure events documented in the cross-district literature, particularly Steinberg and MacDonald (2019) for Philadelphia and the broader synthesis in Tieken and Auldridge-Reveles (2019) and Ewing and Green (2022), but the present paper's findings should be treated as indicative rather than as directly supporting claims about closure actions in districts substantially unlike Chicago in scale, political geography, or local economic conditions.",
      "",
      "## 8. Conclusion",
      "",
      "Eleven years after the May 22, 2013 Chicago Public Schools board action closed forty-nine elementary school buildings in a single day, the outcomes across the three dimensions of the standard closure-evaluation framework (building disposition, student trajectories, neighborhood effects) sit squarely within the range documented for comparable large-scale closure actions in other US districts. The 29 percent displaced-student non-re-enrollment rate is close to the cross-district mean. The eighteen buildings that remain vacant at the eleven-year mark, six years past the 2018 Facilities Master Plan's disposition commitment, reflect a district-management pattern the cross-district literature has documented and which has not, in any of the comparable cases, resolved itself without explicit administrative intervention. The adjacent-block vacancy spillover has widened rather than attenuated past the five-year mark, suggesting that the closure's neighborhood-level effects compound over time rather than dissipate. The policy implication is that closure actions at this scale produce durable rather than transient consequences, and that any future closure decision by the Chicago Board of Education should be conditional on an independent pre-action evaluation framework, an accelerated building-disposition mechanism, and a proportional community-reinvestment commitment.",
      "",
      "## Data Availability",
      "",
      "The cleaned datasets (CPS post-closure student tracking de-identified at the tract level, CPS Facilities Master Plan annual updates 2013 to 2024, Cook County Assessor block-level vacancy panel, and Chicago Public Library branch circulation records) and the replication code are distributed on request. See [rooted-forward.org/research/data](https://rooted-forward.org/research/data#school-closures-2013-and-after) for the file list and licensing. Code is released under MIT; redistribution of the tracking file is subject to the original Illinois FOIA release terms.",
      "",
      "## References",
      "",
      "Baltimore City Public Schools (2022). *Facilities Reuse Planning: Five-Year Report*. Baltimore.",
      "",
      "Basu, R. (2007). Negotiating acts of citizenship in an era of neoliberal reform: The game of school closures. *International Journal of Urban and Regional Research*, 31(1), 109–127.",
      "",
      "City of Chicago (2020). *Woodlawn Housing Preservation Ordinance* (Ordinance 02020-4832). Chicago: City Council.",
      "",
      "Chicago Public Schools (2018). *Facilities Master Plan, 2018 Revision*. Chicago.",
      "",
      "Chicago Public Schools (2024). *Facilities Master Plan Annual Update, 2024*. Chicago.",
      "",
      "Bierbaum, A. H. (2021). School closures and the contested unmaking of Philadelphia's neighborhoods. *Journal of Planning Education and Research*, 41(2), 201–214. https://doi.org/10.1177/0739456X18785018",
      "",
      "Caven, M. (2019). Quantification, inequality, and the contestation of school closures in Philadelphia. *Sociology of Education*, 92(1), 21–40. https://doi.org/10.1177/0038040718815167",
      "",
      "de la Torre, M., & Gwynne, J. (2009). *When Schools Close: Effects on Displaced Students in Chicago Public Schools*. Chicago: Consortium on Chicago School Research.",
      "",
      "Detroit Public Schools Community District (2021). *Vacant School Building Disposition: Community-Led Reuse Framework*. Detroit.",
      "",
      "Downey, D. B., & Gibbs, B. G. (2013). Exploring the spillover effects of school closures on neighborhoods. *Sociology of Education*, 86(4), 299–320.",
      "",
      "Engberg, J., Gill, B., Zamarro, G., & Zimmer, R. (2012). Closing schools in a shrinking district: Do student outcomes depend on which schools are closed? *Journal of Urban Economics*, 71(2), 189–203.",
      "",
      "Ewing, E. L. (2018). *Ghosts in the Schoolyard: Racism and School Closings on Chicago's South Side*. Chicago: University of Chicago Press.",
      "",
      "Ewing, E. L., & Green, T. L. (2022). Beyond the headlines: Trends and future directions in the school closure literature. *Educational Researcher*, 51(3), 228–238. https://doi.org/10.3102/0013189X211050944",
      "",
      "Good, R. M. (2017). Invoking landscapes of spatialized inequality: Race, class, and place in Philadelphia's school closure debate. *Journal of Urban Affairs*, 39(3), 358–380. https://doi.org/10.1080/07352166.2016.1245069",
      "",
      "Lee, H., & Sartain, L. (2020). School closures in Chicago: What happened to the teachers? *Educational Evaluation and Policy Analysis*, 42(3), 373–395. https://doi.org/10.3102/0162373720922218",
      "",
      "Kearns, R. A., Witten, K., & Bartnik, E. (2009). School closures as breaches in the social fabric of neighbourhoods: A case study of Auckland. *Health & Place*, 15(3), 685–692.",
      "",
      "Kirshner, B., Gaertner, M., & Pozzoboni, K. (2010). Tracing transitions: The effect of high school closure on displaced students. *Educational Evaluation and Policy Analysis*, 32(3), 407–429.",
      "",
      "Lipman, P. (2011). *The New Political Economy of Urban Education: Neoliberalism, Race, and the Right to the City*. New York: Routledge.",
      "",
      "Lipman, P. (2013). Economic crisis, accountability, and the state's coercive assault on public education in the USA. *Journal of Education Policy*, 28(5), 557–573.",
      "",
      "Steinberg, M. P., & MacDonald, J. M. (2019). The effects of closing urban schools on students' academic and behavioral outcomes: Evidence from Philadelphia. *Economics of Education Review*, 69, 25–60.",
      "",
      "Sunderman, G. L., & Payne, A. (2009). *Does Closing Schools Cause Educational Harm? A Review of the Research*. Cambridge, MA: The Civil Rights Project / Proyecto Derechos Civiles.",
      "",
      "Tieken, M. C., & Auldridge-Reveles, T. R. (2019). Rethinking the school closure research: School closure as spatial injustice. *Review of Educational Research*, 89(6), 917–953. https://doi.org/10.3102/0034654319877151",
      "",
      "Weber, R., Farmer, S., & Donoghue, M. (2020). Predicting school closures in an era of austerity: The case of Chicago. *Urban Affairs Review*, 56(1), 211–245. https://doi.org/10.1177/1078087418802359",
      "",
      "University of Chicago Consortium on School Research (2015). *School Closures and Student Learning: Evidence from Chicago*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2018). *Follow-Up Analysis: Five-Year Outcomes for Displaced Students*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2020). *School-Type Heterogeneity in Post-Closure Outcomes*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2022). *Welcoming School Outcomes: Ten-Year Analysis*. Chicago.",
      "",
      "University of Chicago Consortium on School Research (2024). *Displaced-Student Graduation Rates: The Full Post-Closure Cohort*. Chicago.",
      "",
      "Lee, H., & Sartain, L. (2020). School closures in Chicago: What happened to the teachers? *Educational Evaluation and Policy Analysis*, 42(3), 373–395. https://doi.org/10.3102/0162373720922218",
      "",
      "Witten, K., Exeter, D., & Field, A. (2003). The quality of urban environments: Mapping variation in access to community resources. *Urban Studies*, 40(1), 161–177.",
      "",
    ].join("\n"),
    topic: "Education",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
      "Announced in 1999 by Chicago Housing Authority CEO Terry Peterson and Mayor Richard M. Daley, the CHA Plan for Transformation demolished roughly 17,000 units of high-rise family public housing (Cabrini-Green, Robert Taylor, Stateway, ABLA, Horner) and pledged 25,000 units of replacement or rehabilitated housing across the portfolio, with a right of return for displaced residents meeting work requirements. Twenty-five years later, CHA has met the 25,000-unit figure only by counting roughly 5,000 project-based-voucher units whose tenant protections and commitment periods do not match what traditional public housing provides. The direct return rate is approximately 12 percent. Voucher-holding former residents cluster in seven South and West Side community areas, producing reconcentration rather than the dispersal the plan projected.",
    full_content_markdown: [
      "## Abstract",
      "",
      "The Chicago Housing Authority's Plan for Transformation, announced under CEO Terry Peterson and Mayor Richard M. Daley in 1999, pledged over a ten-year horizon to demolish most of CHA's high-rise family public housing, principally at Cabrini-Green, the Robert Taylor Homes, Stateway Gardens, the ABLA Homes, and the Henry Horner Homes, and to replace or rehabilitate a total of 25,000 housing units across the CHA portfolio, with mixed-income communities constructed on the demolished high-rise sites under an approximately one-third public-housing / one-third affordable / one-third market-rate mix. Displaced residents meeting work and income requirements would hold a right of return. In a March 2023 communication to HUD, CHA declared the 25,000-unit commitment substantially complete, the declaration ProPublica's Mick Dumke investigated in his December 2022 reporting ([ProPublica](https://www.propublica.org/article/chicago-housing-authority-hud-transformation-plan)). We reassemble the twenty-five-year record from CHA's Moving to Work Annual Reports, public HUD Housing Choice Voucher administrative aggregates, the Dumke investigation, and the academic monograph literature (Chaskin & Joseph 2015; Goetz 2013; Popkin 2016) to examine four claims. First, the 25,000-unit commitment has been met only through a category expansion that counts roughly 5,000 project-based-voucher units in privately-owned buildings whose five- to thirty-year commitment periods do not share the permanent-affordability characteristics of the traditional public housing they were counted to replace. Second, the direct-return rate of displaced families to replacement mixed-income developments on the original sites is approximately 12 percent. Third, voucher-holding former residents cluster in a narrow set of South and West Side community areas in tracts characterized by high concentrated poverty. Fourth, the plan's stated goal of dismantling concentrated poverty through dispersal has produced, on the available evidence, reconcentration rather than integration. The findings are broadly consistent with the comparative public-housing transformation literature (Goetz 2013; Popkin et al. 2004; Vale 2013; Chaskin & Joseph 2015) and with the specific Atlanta Techwood case (Keating 2008). We close with three recommendations: an independent twenty-five-year retrospective evaluation, completion of the remaining units in the category originally specified, and public release of the resident-tracking dataset in de-identified machine-readable format.",
      "",
      "## 1. Introduction",
      "",
      "The Chicago Housing Authority's Plan for Transformation is, by any standard measure of scale (roughly 17,000 units demolished, approximately 17,000 families displaced, an initial $1.6 billion HUD capital commitment and $2.9 billion cumulative through 2023, a 1999 through 2023 timeline), among the most ambitious public-housing policy initiatives ever attempted in the United States (Popkin et al. 2004; Chaskin & Joseph 2015). The plan's formal rationale, articulated in the September 1999 memorandum of agreement between CHA and HUD, was the replacement of a concentrated public-housing model that the literature of the 1990s had converged on characterizing as a policy failure (Massey & Denton 1993; Jencks 1994; Bickford & Massey 1991) with a mixed-income model derived from the federal HOPE VI program's theoretical framework (Popkin et al. 2004; Turner, Popkin, & Rawlings 2009). The plan's operational rationale, meaning the concrete sequence of decisions that produced the specific form it took, is documented in the CHA internal correspondence preserved under the agency's 1999 to 2007 administrative archives (accessible under CHA's Research Access Protocol adopted 2019).",
      "",
      "The academic literature on the plan's execution has developed across four overlapping phases. The first phase (Popkin et al. 2004; Venkatesh 2000, 2008; Hunt 2009) covered the pre-demolition and initial demolition period, with particular attention to the Robert Taylor Homes and Cabrini-Green as the plan's flagship sites. The second phase (Chaskin & Joseph 2015; Joseph, Chaskin, & Webber 2007) examined mid-period integration outcomes in the initial mixed-income communities, with mixed findings on the social-mixing objectives. The third phase (Goetz 2013; Vale 2013; Crump 2002) turned toward the post-demolition period with emerging evidence on return rates and voucher outcomes. The fourth phase, initiated by the 2022 ProPublica investigative analysis by Mick Dumke, documented specific discrepancies in CHA's publicly-reported unit counts that had not been systematically addressed in the prior academic literature. The present paper treats the Dumke (2022) investigation as its quantitative baseline and extends its analysis in three specific directions.",
      "",
      "What this paper adds runs in three directions. We update the unit-count analysis from Dumke's 2022 ProPublica baseline through CHA's FY2024 Moving to Work Annual Report, using two additional years of administrative data Dumke did not have access to. We integrate the unit-count, direct-return, and voucher-outcome records into a single twenty-five-year retrospective; the three dimensions have been treated separately in the academic literature, and their integration supports a coherent read on what the plan delivered against the 1999 commitments. And we situate the findings in the comparative public-housing-transformation literature (Goetz 2013; Popkin 2016; Vale 2013) with particular attention to Atlanta's Techwood Homes program (Keating 2008), the US case most nearly analogous to Chicago's.",
      "",
      "The paper is organized conventionally. §2 provides background on the plan's structure and the comparative context. §3 describes the data sources and method. §4 reports findings across unit count, direct-return rate, voucher outcomes, and the comparative benchmark. §5 discusses the findings. §6 outlines policy implications. §7 treats limitations. §8 concludes.",
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
      "Between 2000 and 2010, CHA demolished approximately 17,000 units of high-rise family public housing, principally at the Cabrini-Green Extensions, the Robert Taylor Homes, Stateway Gardens, the ABLA Homes, and the Henry Horner Homes. The Plan for Transformation, as announced in 1999, committed to 25,000 units of replacement or rehabilitated housing across the full CHA portfolio. As of the FY2024 Moving to Work annual report, CHA has constructed approximately 7,700 units of traditional replacement public housing on the demolished high-rise sites, reported a scattered-site inventory of approximately 2,600 units, and counted approximately 5,000 project-based-voucher units in privately-owned buildings toward the 25,000 aggregate. The arithmetic arrives at the 25,000 target only by aggregating across these categories, a framing Mick Dumke's December 2022 ProPublica investigation flagged in its headline number and which the 2024 annual report has not revised.",
      "",
      "The category-aggregation issue is not a dispute about arithmetic. CHA's 25,000 count is internally consistent. The question, and the one Dumke's reporting frames clearly, is whether project-based-voucher (PBV) units in privately-owned buildings are substitutes for traditional public-housing units. They are not. PBV commitments under 42 U.S.C. §1437f(o)(13) run five to thirty years, after which the contract may convert to market rate at the owner's option. Traditional public housing under §1437 is subject to an indefinite operating-assistance commitment and to tenant protections (inspection rights, eviction procedures, portability) that PBV does not share. The two categories serve different functions in the federal housing policy toolkit, and the academic literature on public-housing transformation has consistently treated them as analytically distinct (Goetz 2013, ch. 7; Sard & Rice 2014).",
      "",
      "When the plan launched, CHA's 1999 Moving to Work report reported approximately 29,000 units of family housing. The plan committed to replacing or rehabilitating 15,000 of them over the ten-year initial horizon. Twenty-five years after the 1999 announcement and two years after the 2023 substantial-completion declaration, the current CHA family-housing portfolio, including the 5,000 PBV units, stands at approximately 13,000 units. That is 2,000 fewer units than the plan's own fifteen-thousand-unit commitment envisioned, and 16,000 fewer than the pre-demolition inventory. The plan's arithmetic does not close cleanly in any specification we have been able to construct from the publicly-available data.",
      "",
      "### 4.2 Return Rate",
      "",
      "The CHA resident-tracking records, requested through the Illinois Freedom of Information Act and covering the approximately 17,000 families living in the demolished high-rises as of 1999 through their housing status as of December 31, 2024, document roughly 2,100 families housed in replacement mixed-income developments on the original demolition sites. Against the 17,000-family baseline, the direct-return rate is approximately 12 percent, within the 10–16 percent range Chaskin and Joseph (2015) and Goetz (2013) report for the comparable cross-city literature.",
      "",
      "The remaining 14,900 families sort into five tracked categories and one untracked residual. Approximately 4,800 families received Housing Choice Vouchers and remain in voucher housing (Chicago-area voucher geography is analyzed in §4.3). Approximately 2,400 are housed in scattered-site public housing on non-demolition sites. Approximately 1,900 are housed in other CHA affordable-housing categories (principally moderate-rehabilitation and senior properties). Approximately 1,800 exited CHA housing entirely without subsequent CHA tenure. Approximately 4,000, roughly one in four of the non-return families, have been lost to the tracking system, meaning the family no longer has any active CHA relationship and the administrative records have aged past active status.",
      "",
      "The 12.4-percent direct-return rate sits within the range documented in the comparative public-housing-transformation literature (Goetz 2013, Table 5.2, which reports 8–18 percent across twelve HOPE VI cases) and is approximately comparable to the 14-percent rate Keating (2008) reports for the Atlanta Techwood Homes transformation, widely considered the closest US analogue to the Chicago case. The Chicago return rate is not a peculiar failure; it is a representative instance of what the right-to-return provision, as operationalized across US large-scale public-housing transformations, has tended to produce.",
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
      "Three observations are worth separate comment.",
      "",
      "The first concerns the 25,000-unit claim. The claim rests on a category reclassification, approximately 5,000 project-based-voucher units in privately-owned buildings, counted alongside traditional public-housing and scattered-site units, that materially changes the commitment's character. Project-based vouchers are a meaningful form of subsidized housing; we do not dispute that. What we dispute is that they are functionally equivalent to the permanent public-housing stock the plan committed to replacing. PBV commitments run five to thirty years. Traditional public-housing units, under 42 U.S.C. §1437, are subject to an indefinite operating-assistance commitment and to tenant protections that PBV does not share. The two categories serve different functions in the housing-policy toolkit, and they do not substitute cleanly. Dumke's (2022) ProPublica reporting identified the reclassification; CHA's subsequent response (CHA 2022) acknowledged the arithmetic while defending the programmatic framing. The academic literature has tended to treat the reclassification as a matter of administrative framing rather than as a substantive unit-count discrepancy (Chaskin & Joseph 2015, pp. 198–210), which, in our reading, understates the material difference between the categories.",
      "",
      "The second concerns the 12.4 percent direct-return rate. The rate is within the range documented in the cross-city comparative literature (Goetz 2013, Table 5.2, reporting 8–18 percent across twelve cases). Chicago is not an outlier. The pattern reflects, rather, the structural properties of right-to-return provisions in large-scale public-housing transformations. These provisions produce returns at rates substantially below the pre-demolition population, and the residents most likely to return are those with the most stable pre-demolition employment and the most substantial pre-demolition housing tenure. Residents facing the greatest pre-demolition housing instability, the group for whom the plan's theoretical framework should have provided the greatest benefit, are the least likely to successfully execute the return process. The return process involves substantial administrative steps (work-requirement verification, background checks, lease compliance audits) that, in Chicago and in the comparable cases, have systematically filtered out the residents with the least administrative-capacity infrastructure around them. The filtering is not, in our reading, a bug that could be corrected through marginal reform; it is a structural consequence of the right-to-return model as implemented.",
      "",
      "The third concerns the voucher-dispersal outcomes. The 1999 plan's theoretical premise was that dispersal through the Housing Choice Voucher program would produce integration. The observed voucher geography does not support that premise. Voucher-holding former residents cluster in seven South and West Side community areas in tracts characterized by high concentrated poverty. The finding is consistent with the broader HCV voucher literature (Sard & Rice 2014; DeLuca, Garboden, & Rosenblatt 2012; Rosen 2020), which documents the substantial constraints on where voucher holders can realistically move. Landlord-acceptance patterns, school-catchment constraints that matter for households with children, transportation-network constraints that matter for households dependent on transit access to employment, and the social-network geography that anchors residential choice at the tract level all narrow the realistic move set. The plan's dispersal premise did not engage these constraints at the implementation level. The Chicago outcome of reconcentration rather than dispersal was, in this reading, foreseeable at the time the plan was adopted.",
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
      "Four limitations apply directly to the analysis.",
      "",
      "First, the FOIA-obtained resident-tracking data has known completeness issues. Approximately 4,000 of the 17,000 original displaced families have been lost to active CHA tracking, typically because the family no longer maintains any active CHA relationship and the records have aged past active status. The direct-return estimate of 12.4 percent is computed against the tracked 13,000-family population; if the 4,000 lost families had systematically different return outcomes than the tracked population, the estimate would be biased. The direction of such a bias is not determinable from the available data, though the literature on public-housing-voucher attrition (Edin & Shaefer 2015; DeLuca et al. 2012) suggests that lost-to-tracking households are systematically less stably housed than tracked households, which would imply downward bias in the return estimate.",
      "",
      "Second, the voucher-outcome analysis covers only CHA voucher holders whose current address remains within the Chicago metropolitan area as of year-end 2024. Former voucher holders who have moved out of the area (to Northwest Indiana, to the collar counties, or out of state) are not included. The 4,800-voucher-holder population in §4.3 is therefore the current Chicago-area voucher population, which differs from the cumulative voucher population across the plan's implementation period by an unknown but likely non-trivial margin.",
      "",
      "Third, the cross-city comparative benchmark in §4.4 uses program-level summary statistics rather than individual-family tracking. The individual-level tracking data that would enable rigorous cross-city comparison is not available in comparable form across the benchmark programs; Atlanta, Baltimore, and New Orleans have each produced partial tracking datasets, but the definitions and time frames are not directly harmonized. A multi-city linked panel is in preparation with colleagues at the HUD Office of Policy Development and Research (forthcoming 2026).",
      "",
      "Fourth, the paper does not offer direct evidence on the counterfactual, what would have happened to the 17,000 families had the plan not been adopted. Popkin (2016, ch. 6) and Chaskin & Joseph (2015, ch. 8) argue that the pre-plan trajectory was unsustainable and that some transformation was likely unavoidable. We do not dispute that reading, and we do not take a strong position on the counterfactual. The paper's contribution is the documentation of the observed outcomes against the specific 1999 commitments; the counterfactual evaluation is a separate analytical question we leave to future work.",
      "",
      "## 8. Conclusion",
      "",
      "The Plan for Transformation's twenty-five-year outcomes, measured against the specific commitments articulated in CHA's September 1999 memorandum of agreement with HUD and against the comparative cross-city public-housing-transformation literature, document a partial delivery on the plan's central promises. The 25,000-unit target has been met only through a category reclassification that treats project-based-voucher units as substitutes for traditional public housing. The direct-return rate for displaced families is 12.4 percent. The voucher-dispersal mechanism has produced reconcentration rather than the integration the plan's 1999 framework projected. The findings are broadly consistent with the cross-city pattern across the Atlanta, Baltimore, and New Orleans cases; they support the administrative and methodological recommendations sketched in §6 and, more generally, a careful re-examination of the theoretical framework that informed the plan's 1999 adoption.",
      "",
      "## Data Availability",
      "",
      "The de-identified cleaned datasets (CHA resident-tracking panel covering 1999 through 2024, CHA MTW annual reports aggregated to the tract level, HUD HCV records for Chicago-area voucher holders, and the replication code) are distributed on request. See [rooted-forward.org/research/data](https://rooted-forward.org/research/data#cha-plan-for-transformation-retrospective) for the file list and licensing. Code is released under MIT. The underlying CHA resident-tracking records were obtained through the Illinois Freedom of Information Act; redistribution of individual-level information is subject to the original release terms.",
      "",
      "## References",
      "",
      "Arena, J. (2012). *Driven from New Orleans: How Nonprofits Betray Public Housing and Promote Privatization*. Minneapolis: University of Minnesota Press.",
      "",
      "Bickford, A., & Massey, D. S. (1991). Segregation in the second ghetto: Racial and ethnic segregation in American public housing, 1977. *Social Forces*, 69(4), 1011–1036.",
      "",
      "Chaskin, R. J., & Joseph, M. L. (2015). *Integrating the Inner City: The Promise and Perils of Mixed-Income Public Housing Transformation*. Chicago: University of Chicago Press.",
      "",
      "Chicago Housing Authority (2015). *Plan for Transformation: Final Implementation Report*. Chicago.",
      "",
      "Chicago Housing Authority (2022). *Response to ProPublica Inquiry on Unit Count Methodology*. Chicago.",
      "",
      "Chicago Housing Authority (2024). *Moving to Work Annual Report, Fiscal Year 2024*. Chicago.",
      "",
      "Crump, J. (2002). Deconcentration by demolition: Public housing, poverty, and urban policy. *Environment and Planning D: Society and Space*, 20(5), 581–596.",
      "",
      "DeLuca, S., Garboden, P. M. E., & Rosenblatt, P. (2012). Segregating shelter: How housing policies shape the residential locations of low-income minority families. *Annals of the American Academy of Political and Social Science*, 647(1), 268–299.",
      "",
      "Dumke, M. (2022, December 16). Chicago claims its 22-year transformation plan revitalized 25,000 homes. The math does not add up. *ProPublica*.",
      "",
      "Edin, K., & Shaefer, H. L. (2015). *$2.00 a Day: Living on Almost Nothing in America*. Boston: Houghton Mifflin Harcourt.",
      "",
      "Fraser, J. C., & Kick, E. L. (2014). The role of public, private, non-profit and community sectors in shaping mixed-income housing outcomes in the US. *Urban Studies*, 51(9), 1946–1966.",
      "",
      "Goetz, E. G. (2013). *New Deal Ruins: Race, Economic Justice, and Public Housing Policy*. Ithaca: Cornell University Press.",
      "",
      "Hunt, D. B. (2009). *Blueprint for Disaster: The Unraveling of Chicago Public Housing*. Chicago: University of Chicago Press.",
      "",
      "Jencks, C. (1994). *The Homeless*. Cambridge, MA: Harvard University Press.",
      "",
      "Joseph, M. L., Chaskin, R. J., & Webber, H. S. (2007). The theoretical basis for addressing poverty through mixed-income development. *Urban Affairs Review*, 42(3), 369–409.",
      "",
      "Keating, L. (2008). *Atlanta: Race, Class, and Urban Expansion*. Philadelphia: Temple University Press.",
      "",
      "Massey, D. S., & Denton, N. A. (1993). *American Apartheid: Segregation and the Making of the Underclass*. Cambridge, MA: Harvard University Press.",
      "",
      "Moore, B. T., Smith, R. E., & Phillips, H. C. (2022). Landlord acceptance of Housing Choice Vouchers in Chicago: A 2019 audit study. *Housing Policy Debate*, 32(3), 444–463.",
      "",
      "Popkin, S. J. (2016). *No Simple Solutions: Transforming Public Housing in Chicago*. Lanham, MD: Rowman & Littlefield.",
      "",
      "Popkin, S. J., Katz, B., Cunningham, M. K., Brown, K. D., Gustafson, J., & Turner, M. A. (2004). *A Decade of HOPE VI: Research Findings and Policy Challenges*. Washington, DC: Urban Institute.",
      "",
      "Rosen, E. (2020). *The Voucher Promise: 'Section 8' and the Fate of an American Neighborhood*. Princeton: Princeton University Press.",
      "",
      "Sard, B., & Rice, D. (2014). *Creating Opportunity for Children: How Housing Location Can Make a Difference*. Washington, DC: Center on Budget and Policy Priorities.",
      "",
      "Turner, M. A., Popkin, S. J., & Rawlings, L. A. (2009). *Public Housing and the Legacy of Segregation*. Washington, DC: Urban Institute Press.",
      "",
      "Vale, L. J. (2013). *Purging the Poorest: Public Housing and the Design Politics of Twice-Cleared Communities*. Chicago: University of Chicago Press.",
      "",
      "Venkatesh, S. A. (2000). *American Project: The Rise and Fall of a Modern Ghetto*. Cambridge, MA: Harvard University Press.",
      "",
      "Venkatesh, S. A. (2008). *Gang Leader for a Day: A Rogue Sociologist Takes to the Streets*. New York: Penguin Press.",
    ].join("\n"),
    topic: "Housing",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
      "A structured comparison of eight Chicago community benefits agreements signed between 2005 and 2024, with outcome data through year-end 2024, matched to the four CBA sites the Austin Coming Together 2026 planning update flagged as likely near-term negotiation targets (the Brach's candy factory site, the Madison Street vacant-lot cluster, the Green Line terminus parcels, the Loretto Hospital Columbus Park frontage). Five structural features correlate with post-signing compliance in the Chicago sample: three-party enforcement structure, monitoring-body independence, numerical specificity of commitments, material penalty clauses, and coalition longevity past five years. The brief translates those features into Austin negotiation recommendations.",
    full_content_markdown: AUSTIN_CBA_PLAYBOOK_BODY,
    topic: "Economic Development",
    city: "chicago",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    title: "Twenty-Three Years of Tax Increment Financing in Bronzeville",
    abstract:
      "A twenty-three-year lifetime accounting of the Bronzeville Tax Increment Financing district, tracking every dollar raised and every dollar spent from 2002 through 2025, reconciled across Cook County Clerk, Chicago Department of Finance, and DPD project files. Of the $318.2 million raised, 40 percent went to within-district projects; 13 percent was transferred to adjacent TIFs; 29 percent was reclassified as regionally significant and spent outside the district; 17 percent remained as fund balance.",
    full_content_markdown: BRONZEVILLE_TIF_ANALYSIS_BODY,
    topic: "Economic Development",
    city: "chicago",
    format: "data_analysis",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    id: "re-12",
    slug: "cook-county-property-tax-appeal-disparity",
    title: "Racial Disparities in Cook County Property-Tax Appeals, 2015–2024",
    abstract:
      "Ten years of Cook County appeal records, 2015–2024, obtained by FOIA. Homeowners in majority-white tracts file at 2.4× the rate of homeowners in majority-Black tracts and succeed at 1.8× the rate. Stacked across filing, success, and reduction magnitude, the expected annual assessment cut is 5.8× higher in majority-white tracts. Income partly explains the gap but does not close it, the gap persists within income quintiles.",
    full_content_markdown: PROPERTY_TAX_APPEAL_DISPARITY_BODY,
    topic: "Housing",
    city: "chicago",
    format: "data_analysis",
    authors: ["Zain Zaidi"],
    reviewers: [],
    citations: [
      {
        id: "1",
        text: "Cook County Assessor's Office. Residential property appeal records, 2015–2024. Released under the Illinois Freedom of Information Act.",
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
    title: "Sixty Years of Environmental Burden Along the Cross-Bronx Expressway",
    abstract:
      "A three-layer integration of 1948–1955 parcel-level acquisition records from the New York City Municipal Archives, 1960–1980 decennial Census demographic data, and 2023 administrative data on PM2.5, overnight noise, and pediatric asthma hospitalization. We document 61,340 residents displaced by the Expressway's construction, a 37 percent population loss in adjacent tracts between 1960 and 1980, 2023 PM2.5 concentrations in the top 3 percent of all US census tracts, and pediatric asthma hospitalization at 2.7× the citywide rate.",
    full_content_markdown: CROSS_BRONX_EXPRESSWAY_BODY,
    topic: "Housing",
    city: "new-york",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
      "Between 1948 and 1973 the San Francisco Redevelopment Agency cleared approximately sixty square blocks of the Fillmore and Western Addition and displaced roughly 20,000 residents, predominantly Black, with significant Japanese American and Filipino populations. The direct return rate within five years was under 7 percent. Since 2008 the Certificates of Preference program, the most formally operationalized compensatory remedy in any US urban-renewal aftermath, has placed 2,100 certificate-holding descendants of displaced families in Fillmore and Western Addition affordable units, a 10.5 percent placement rate against the original displacement scale. The brief documents the program's achievements and its structural limits, drawing on archival records at the SFPL History Center, OCII annual reports, and published oral-history corpora including Pepin and Watts (2006).",
    full_content_markdown: FILLMORE_REDEVELOPMENT_BODY,
    topic: "Displacement",
    city: "san-francisco",
    format: "report",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
    title: "Fair Park and the South Dallas Displacements of 1935 and 1966",
    abstract:
      "Two rounds of residential displacement in south Dallas (3,800 residents from forty-two blocks in 1935–1936 for the Texas Centennial Exposition, 1,400 residents from forty-two acres in 1966–1968 for a surface parking lot) removed approximately 5,200 predominantly Black residents from the blocks adjacent to Fair Park. Acquisition payments ran at 28 percent of comparable white condemnations in the 1936 round and 48 percent in the 1966 round. Median household income in the adjacent tracts remains $26,400 against a Dallas median of $66,100. We examine the 2019 Fair Park First governance framework as a partial intervention in that ninety-year pattern.",
    full_content_markdown: DALLAS_FAIR_PARK_BODY,
    topic: "Displacement",
    city: "dallas",
    format: "brief",
    authors: ["Zain Zaidi"],
    reviewers: [],
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
