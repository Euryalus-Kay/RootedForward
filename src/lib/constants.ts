export const CITIES = [
  {
    name: "Chicago",
    slug: "chicago",
    tagline: "From Bronzeville to Pilsen, traces of segregation written into the grid",
    lat: 41.8781,
    lng: -87.6298,
    zoom: 11,
  },
  {
    name: "New York",
    slug: "new-york",
    tagline: "Redlines, renewal, and resistance across five boroughs",
    lat: 40.7128,
    lng: -74.006,
    zoom: 11,
  },
  {
    name: "Dallas",
    slug: "dallas",
    tagline: "Highway walls and invisible borders in the heart of Texas",
    lat: 32.7767,
    lng: -96.797,
    zoom: 11,
  },
  {
    name: "San Francisco",
    slug: "san-francisco",
    tagline: "Displacement, demolition, and the fight for the Fillmore",
    lat: 37.7749,
    lng: -122.4194,
    zoom: 12,
  },
] as const;

export const PLACEHOLDER_STOPS = [
  // Chicago
  {
    city: "chicago",
    slug: "redlining-boundary-bronzeville",
    title: "The Redlining Boundary at Bronzeville",
    lat: 41.8236,
    lng: -87.6186,
    description:
      "In the 1930s, the Home Owners' Loan Corporation drew red lines around Bronzeville, labeling it 'hazardous' for investment. This single bureaucratic act locked generations of Black families out of homeownership and wealth-building. The boundary ran along Cottage Grove Avenue, a line still visible today in the contrast between maintained infrastructure to the east and decades of disinvestment to the west.",
    video_url: null,
    images: [],
    sources: [
      "Mapping Inequality Project, University of Richmond",
      "The Color of Law by Richard Rothstein, 2017",
      "Chicago History Museum Archives",
    ],
  },
  {
    city: "chicago",
    slug: "pilsen-anti-displacement-murals",
    title: "Pilsen's Anti-Displacement Murals",
    lat: 41.8565,
    lng: -87.6553,
    description:
      "The murals along 16th Street in Pilsen are more than public art. They are declarations of resistance. As gentrification pressures mount in this historically Mexican-American neighborhood, local artists have painted building-sized responses documenting the community's history and its refusal to be erased. Each mural tells a story of immigration, of labor, of belonging to a place that developers now see primarily as an investment opportunity.",
    video_url: null,
    images: [],
    sources: [
      "Pilsen Alliance Community Archive",
      "National Museum of Mexican Art exhibition records",
    ],
  },
  {
    city: "chicago",
    slug: "hyde-park-urban-renewal",
    title: "Hyde Park Urban Renewal and Displacement",
    lat: 41.7943,
    lng: -87.5907,
    description:
      "In the 1950s and 1960s, the University of Chicago led one of the nation's most aggressive urban renewal campaigns, demolishing hundreds of buildings and displacing thousands of Black residents from Hyde Park and neighboring Kenwood. Framed as 'slum clearance,' the program remade the neighborhood's demographics and built physical barriers, including the Midway Plaisance, between the university community and surrounding Black neighborhoods.",
    video_url: null,
    images: [],
    sources: [
      "Arnold Hirsch, Making the Second Ghetto, 1983",
      "University of Chicago Library Special Collections",
    ],
  },
  // New York
  {
    city: "new-york",
    slug: "cross-bronx-expressway",
    title: "The Cross Bronx Expressway",
    lat: 40.8448,
    lng: -73.8648,
    description:
      "Robert Moses' Cross Bronx Expressway, completed in 1963, carved a seven-mile trench through densely populated neighborhoods, displacing over 60,000 residents, predominantly Black and Puerto Rican families. The highway didn't just demolish buildings; it severed communities, creating a physical wall that accelerated white flight and disinvestment in the South Bronx. Decades later, asthma rates along the expressway corridor remain among the highest in the nation.",
    video_url: null,
    images: [],
    sources: [
      "Robert Caro, The Power Broker, 1974",
      "South Bronx Community Health Assessment, 2019",
    ],
  },
  {
    city: "new-york",
    slug: "harlem-blockbusting-corridor",
    title: "Harlem's Blockbusting Corridor",
    lat: 40.8116,
    lng: -73.9465,
    description:
      "Along 125th Street and the surrounding blocks, real estate speculators in the mid-20th century practiced 'blockbusting,' deliberately stoking racial fears among white homeowners to buy properties cheaply, then selling them at inflated prices to Black families desperate for housing. This predatory cycle extracted wealth from both communities while reshaping Harlem's demographics and economics for generations.",
    video_url: null,
    images: [],
    sources: [
      "Satter, Family Properties, 2009",
      "Harlem Historical Society Archives",
    ],
  },
  // Dallas
  {
    city: "dallas",
    slug: "central-expressway-wall",
    title: "The Wall Through Dallas",
    lat: 32.8023,
    lng: -96.7847,
    description:
      "When Central Expressway (US 75) was built through Dallas, it was not just a highway. It was a racial barrier by design. The route deliberately reinforced the segregation line between white North Dallas and Black South Dallas, destroying homes and businesses in the State-Thomas neighborhood, once a thriving Black community. Today, the wealth gap between neighborhoods on either side of the expressway remains one of the starkest in any American city.",
    video_url: null,
    images: [],
    sources: [
      "Dallas Morning News historical investigation, 2021",
      "Texas State Historical Association",
    ],
  },
  {
    city: "dallas",
    slug: "freedmans-cemetery",
    title: "Freedman's Cemetery",
    lat: 32.7942,
    lng: -96.7951,
    description:
      "Freedman's Cemetery served as the primary burial ground for formerly enslaved people in Dallas from 1869 to 1907. Over 1,500 individuals were buried here. The site was paved over for Central Expressway construction in the 1940s, quite literally burying Black history under asphalt. Rediscovered during highway expansion in 1990, the cemetery is now a memorial, but the erasure it represents continues in how Dallas develops over historically Black land.",
    video_url: null,
    images: [],
    sources: [
      "Freedman's Cemetery Memorial Archives",
      "Dallas African American Museum",
    ],
  },
  // San Francisco
  {
    city: "san-francisco",
    slug: "fillmore-urban-renewal",
    title: "Urban Renewal as Removal in the Fillmore",
    lat: 37.7842,
    lng: -122.4324,
    description:
      "The Fillmore District was once called the 'Harlem of the West,' a vibrant Black cultural center with jazz clubs, businesses, and churches. In the 1960s and 70s, San Francisco's Redevelopment Agency razed 883 buildings and displaced over 10,000 Black residents under the banner of 'urban renewal.' The community called it what it was, removal. Today, less than 5% of the Fillmore's residents are Black, down from over 40% before redevelopment.",
    video_url: null,
    images: [],
    sources: [
      "San Francisco Redevelopment Agency records",
      "Western Addition Community Organization Archive",
    ],
  },
  {
    city: "san-francisco",
    slug: "bayview-hunters-point-shipyard",
    title: "Bayview-Hunters Point and the Shipyard",
    lat: 37.7296,
    lng: -122.3826,
    description:
      "Bayview-Hunters Point became a predominantly Black neighborhood during WWII when workers migrated to staff the naval shipyard. After the war, the Navy left behind toxic contamination while the city left behind disinvestment. For decades, residents have faced elevated cancer rates linked to radiological contamination from the shipyard. Current redevelopment plans promise cleanup and new housing, but community members fear displacement will finish what environmental racism started.",
    video_url: null,
    images: [],
    sources: [
      "Bayview Hunters Point Community Advocates",
      "EPA Superfund Site Records, Hunters Point Naval Shipyard",
    ],
  },
];

/* Local-development placeholders only. Production reads podcasts from
   Supabase. These entries deliberately name no guests and embed no
   audio, because no real episode exists behind them. Do not add names,
   quotes, or embed URLs here that cannot be verified. */
export const PLACEHOLDER_PODCASTS = [
  {
    title: "The Lines They Drew",
    description:
      "Where the HOLC maps drew their boundaries around Bronzeville in the 1930s, and how a line on a federal map shaped lending, ownership, and investment along Cottage Grove Avenue for decades afterward.",
    episode_number: 1,
    publish_date: "2025-09-15",
    guests: [],
    embed_url: "",
  },
  {
    title: "Concrete Walls",
    description:
      "How mid-century expressway routing decisions, from the Cross Bronx Expressway to Central Expressway in Dallas, cut through Black neighborhoods and left barriers that still divide those cities.",
    episode_number: 2,
    publish_date: "2025-10-01",
    guests: [],
    embed_url: "",
  },
  {
    title: "Renewal or Removal",
    description:
      "San Francisco's Fillmore District was a center of Black cultural life on the West Coast until redevelopment demolished hundreds of buildings. An episode on what urban renewal actually did, and who wrote its history.",
    episode_number: 3,
    publish_date: "2025-10-15",
    guests: [],
    embed_url: "",
  },
  {
    title: "Who Owns the Block",
    description:
      "Pilsen's murals document a neighborhood fighting displacement. An episode on gentrification pressure in a historically Mexican-American community, and the tools residents use to push back.",
    episode_number: 4,
    publish_date: "2025-11-01",
    guests: [],
    embed_url: "",
  },
];
