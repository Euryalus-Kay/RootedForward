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
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
      "The murals along 16th Street in Pilsen are more than public art—they're declarations of resistance. As gentrification pressures mount in this historically Mexican-American neighborhood, local artists have painted building-sized responses documenting the community's history and its refusal to be erased. Each mural tells a story: of immigration, of labor, of belonging to a place that developers now see primarily as an investment opportunity.",
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
      "In the 1950s and 1960s, the University of Chicago led one of the nation's most aggressive urban renewal campaigns, demolishing hundreds of buildings and displacing thousands of Black residents from Hyde Park and neighboring Kenwood. Framed as 'slum clearance,' the program remade the neighborhood's demographics and built physical barriers—including the Midway Plaisance—between the university community and surrounding Black neighborhoods.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
      "Robert Moses' Cross Bronx Expressway, completed in 1963, carved a seven-mile trench through densely populated neighborhoods, displacing over 60,000 residents—predominantly Black and Puerto Rican families. The highway didn't just demolish buildings; it severed communities, creating a physical wall that accelerated white flight and disinvestment in the South Bronx. Decades later, asthma rates along the expressway corridor remain among the highest in the nation.",
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
      "Along 125th Street and the surrounding blocks, real estate speculators in the mid-20th century practiced 'blockbusting'—deliberately stoking racial fears among white homeowners to buy properties cheaply, then selling them at inflated prices to Black families desperate for housing. This predatory cycle extracted wealth from both communities while reshaping Harlem's demographics and economics for generations.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
    title: "Central Expressway: The Wall Through Dallas",
    lat: 32.8023,
    lng: -96.7847,
    description:
      "When Central Expressway (US 75) was built through Dallas, it wasn't just a highway—it was a racial barrier by design. The route deliberately reinforced the segregation line between white North Dallas and Black South Dallas, destroying homes and businesses in the State-Thomas neighborhood, once a thriving Black community. Today, the wealth gap between neighborhoods on either side of the expressway remains one of the starkest in any American city.",
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
      "Freedman's Cemetery served as the primary burial ground for formerly enslaved people in Dallas from 1869 to 1907. Over 1,500 individuals were buried here. The site was paved over for Central Expressway construction in the 1940s, quite literally burying Black history under asphalt. Rediscovered during highway expansion in 1990, the cemetery is now a memorial—but the erasure it represents continues in how Dallas develops over historically Black land.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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
    title: "The Fillmore: Urban Renewal as Negro Removal",
    lat: 37.7842,
    lng: -122.4324,
    description:
      "The Fillmore District was once called the 'Harlem of the West'—a vibrant Black cultural center with jazz clubs, businesses, and churches. In the 1960s and 70s, San Francisco's Redevelopment Agency razed 883 buildings and displaced over 10,000 Black residents under the banner of 'urban renewal.' The community called it what it was: Negro removal. Today, less than 5% of the Fillmore's residents are Black, down from over 40% before redevelopment.",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
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

export const PLACEHOLDER_PODCASTS = [
  {
    title: "The Lines They Drew: How Redlining Shaped Chicago",
    description:
      "In our pilot episode, we walk the literal boundary lines that HOLC maps drew around Bronzeville in the 1930s. We talk to residents who grew up on either side of Cottage Grove Avenue and hear how a line on a map became a wall in real life. Featuring historian Dr. LaShonda Hicks and lifelong Bronzeville resident Marcus Williams.",
    episode_number: 1,
    publish_date: "2025-09-15",
    guests: ["Dr. LaShonda Hicks", "Marcus Williams"],
    embed_url: "https://open.spotify.com/embed/episode/33iDOkYfD3XutfCLHTV1DC?utm_source=generator",
  },
  {
    title: "Concrete Walls: The Expressways That Divided Us",
    description:
      "From the Cross Bronx Expressway to Central Expressway in Dallas, we examine how highways were weaponized against Black communities. Urban planner Dr. Kenji Watanabe explains the deliberate routing decisions, and residents share what it's like to live in the shadow of infrastructure that was built to exclude you.",
    episode_number: 2,
    publish_date: "2025-10-01",
    guests: ["Dr. Kenji Watanabe"],
    embed_url: "https://open.spotify.com/embed/episode/placeholder2",
  },
  {
    title: "Renewal or Removal? The Fillmore's Lost Generation",
    description:
      "San Francisco's Fillmore District was once the cultural heart of Black life on the West Coast. Urban renewal demolished it. We speak with former residents, visit the jazz clubs that survived, and ask: when a city destroys a neighborhood and calls it progress, who gets to write the history?",
    episode_number: 3,
    publish_date: "2025-10-15",
    guests: ["Dorothy Pitts", "James Baldwin Jr."],
    embed_url: "https://open.spotify.com/embed/episode/placeholder3",
  },
  {
    title: "Who Owns the Block? Gentrification in Pilsen",
    description:
      "Pilsen's murals tell the story of a community fighting to stay. We walk 16th Street with local artists, talk to families facing eviction, and investigate how tax incentives meant to help neighborhoods end up pushing residents out. What does it mean to be priced out of your own history?",
    episode_number: 4,
    publish_date: "2025-11-01",
    guests: ["Maria Elena Gutierrez", "Carlos Ramirez-Rosa"],
    embed_url: "https://open.spotify.com/embed/episode/placeholder4",
  },
];
