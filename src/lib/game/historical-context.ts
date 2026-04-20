/**
 * Historical-context snippets. One per era. Shown in the HUD so a player
 * with zero background can locate themselves in real history.
 */

export interface ContextWindow {
  fromYear: number;
  toYear: number;
  headline: string;
  body: string;
  realChicago: string;
}

export const CONTEXT_WINDOWS: ContextWindow[] = [
  {
    fromYear: 1940,
    toYear: 1948,
    headline: "The New Deal is rewriting American housing.",
    body:
      "Federal agencies (HOLC, FHA) grade neighborhoods. Racial covenants are legal until 1948. The first wave of the Great Migration is pushing Black families out of the South toward Chicago jobs.",
    realChicago:
      "HOLC colored most of Black Chicago red in 1940. The FHA would not insure mortgages in those areas.",
  },
  {
    fromYear: 1949,
    toYear: 1960,
    headline: "Federal urban-renewal money arrives. So do the expressways.",
    body:
      "Title I of the 1949 Housing Act funds demolition of 'blighted' neighborhoods, mostly Black ones. The 1956 Highway Act drives interstates through city centers. The CHA starts siting public-housing towers, but only in wards that will accept them.",
    realChicago:
      "The Dan Ryan Expressway was widened in 1962 to keep Black residents east of the line. Mayor Daley made sure.",
  },
  {
    fromYear: 1961,
    toYear: 1969,
    headline: "The Civil Rights era hits Chicago hard.",
    body:
      "Dr. King's Chicago Freedom Movement of 1966 draws violent counter-protests in Marquette Park. The Contract Buyers League forms in 1968. The Fair Housing Act passes the same year. Enforcement is famously weak.",
    realChicago:
      "King said the hostility he faced in Chicago was worse than anything he had seen in the South.",
  },
  {
    fromYear: 1970,
    toYear: 1985,
    headline: "White flight, deindustrialization, Gautreaux.",
    body:
      "Hills v. Gautreaux (1976) orders the CHA to scatter public housing across the metro. White flight peaks. Factories leave. The first wave of disinvestment hits South and West Side blocks that the Fair Housing Act was supposed to protect.",
    realChicago:
      "Between 1970 and 1990, Chicago lost about 25 percent of its manufacturing jobs.",
  },
  {
    fromYear: 1986,
    toYear: 1999,
    headline: "The modern affordable-housing toolkit is being built.",
    body:
      "LIHTC is created in 1986. TIF becomes a tool of urban policy. Section 8 vouchers expand. The CHA towers are failing. The Plan for Transformation is announced in 1999.",
    realChicago:
      "Chicago's first TIF district was formed in 1984. By 2023 the program captured $1.36 billion citywide.",
  },
  {
    fromYear: 2000,
    toYear: 2015,
    headline: "Tower demolition. The foreclosure crisis. Gentrification arrives.",
    body:
      "The Plan for Transformation demolishes most CHA high-rises. The 2008 foreclosure crisis strips South and West Side Black families of hundreds of millions in equity. Gentrification hits Pilsen and Logan Square.",
    realChicago:
      "Logan Square lost about 20,000 Latino residents between 2000 and 2020. Pilsen lost about 14,000.",
  },
  {
    fromYear: 2016,
    toYear: 2025,
    headline: "The ARO is modernized. The Red Line gets funded.",
    body:
      "Chicago's Affordable Requirements Ordinance is rewritten in 2015 and again in 2021. The Red Line Extension gets a full federal funding grant agreement in December 2024. ADUs are legalized in pilot zones.",
    realChicago:
      "The 2021 ARO made Chicago's inclusionary-zoning rules substantially stronger, with 20 percent affordable required in displacement-risk zones.",
  },
  {
    fromYear: 2026,
    toYear: 2040,
    headline: "The Red Line construction years. Climate catches up.",
    body:
      "Red Line Extension construction begins in 2026. New stations open 2030. Land values jump 40 percent within a half-mile of each station. Combined sewer overflows worsen with climate-intensified storms.",
    realChicago:
      "CTA projections show $1.7B in real-estate activity from the four new stations alone.",
  },
];

export function contextForYear(year: number): ContextWindow {
  for (const w of CONTEXT_WINDOWS) if (year >= w.fromYear && year <= w.toYear) return w;
  return CONTEXT_WINDOWS[CONTEXT_WINDOWS.length - 1];
}
