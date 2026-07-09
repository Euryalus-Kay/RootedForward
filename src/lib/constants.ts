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

/* Chicago only. The New York, Dallas, and San Francisco placeholder
   stops were removed in July 2026 when the tours section was centered
   on Hyde Park; they live in git history if chapters in those cities
   become real. */
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
      "Pilsen, a historically Mexican-American neighborhood, holds one of the densest concentrations of murals in Chicago. Along 16th Street and across the neighborhood, local artists have painted building-sized works about the community's history of immigration and labor, and more recently about the displacement pressure residents face as rents climb. The walls double as a public record of who built the neighborhood and who is fighting to stay in it.",
    video_url: null,
    images: [],
    sources: [
      "Pilsen Alliance",
      "National Museum of Mexican Art",
    ],
  },
  {
    city: "chicago",
    slug: "hyde-park-urban-renewal",
    title: "Hyde Park Urban Renewal and Displacement",
    lat: 41.7943,
    lng: -87.5907,
    description:
      "In the 1950s and 1960s, the University of Chicago led one of the nation's most aggressive urban renewal campaigns, demolishing hundreds of buildings and displacing thousands of Black residents from Hyde Park and neighboring Kenwood. Framed as 'slum clearance,' the program remade the neighborhood's demographics and hardened the boundaries between the university community and the Black neighborhoods around it.",
    video_url: null,
    images: [],
    sources: [
      "Arnold Hirsch, Making the Second Ghetto, 1983",
      "University of Chicago Library Special Collections",
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
