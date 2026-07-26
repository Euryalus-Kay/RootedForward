// ------------------------------------------------------------------
// Types for the self-paced audio walking tour (/tours).
// The tour data itself lives in jackson-park-walk.ts; the map
// geometry (TIGER-derived) in walk-geometry.json.
// ------------------------------------------------------------------

export interface WalkImage {
  /** path under /public, e.g. /media/jackson-park-walk/republic-1893.jpg */
  src: string;
  alt: string;
  /** printed credit line, e.g. "Library of Congress. No known restrictions." */
  credit: string;
  /** small tag printed under the plate when shown as a pair, e.g. "1893" or "Today" */
  label?: string;
  /** index of the transcript paragraph this photograph follows, so a
   *  stop can set a picture beside the sentence that explains it
   *  instead of stacking every plate above the story. Images without
   *  it stay at the top of the stop, which is the older behavior. */
  after?: number;
}

export interface WalkDirections {
  /** plain spoken-style walking directions to the next stop */
  text: string;
  distanceMeters: number;
  minutes: number;
}

/** a red sidebar plate explaining one specific mechanism (covenants,
 *  redlining, contract selling...); labeled plainly by its subject */
export interface WalkInterrupt {
  title: string;
  /** body paragraphs; `**bold**` renders bold */
  body: string[];
  /** index of the transcript paragraph this plate follows, so a stop
   *  carrying several plates can space them through the story rather
   *  than stacking them at the end. Omitted plates render after the
   *  whole transcript, which is the older behavior. */
  after?: number;
}

export interface WalkStop {
  id: string;
  /** 1-based stop number shown on the map and cards */
  number: number;
  title: string;
  /** one line under the title, e.g. "Where the fair's golden lady still stands" */
  dek: string;
  lat: number;
  lng: number;
  /** mp3 under /public, pregenerated */
  audioSrc: string;
  /** seconds, measured from the generated file */
  audioSeconds: number;
  /** the narration, paragraph per entry; doubles as the transcript.
   *  `**text**` renders bold on the page and is stripped for TTS. */
  transcript: string[];
  /** the concrete thing worth seeing at this exact spot; kept in the
   *  data but not currently rendered */
  lookFor?: string;
  /** zero, one, or two images per stop */
  images: WalkImage[];
  /** what the site looks like today; paired with images[0] on the page
   *  and used as the stop's thumbnail in the plate index */
  nowImage?: WalkImage;
  /** the numbered instruments-of-exclusion sidebars for this stop */
  interrupts?: WalkInterrupt[];
  /** directions to the following stop; absent on the last stop */
  toNext?: WalkDirections;
  /** short label for the map, e.g. "Statue of the Republic" */
  mapLabel: string;
  /** works consulted for this stop, printed in the Sources section */
  sources?: { label: string; url: string }[];
  /** true for detour stops that sit off the main route (the walk is
   *  complete without them); rendered with a dashed spur on the map
   *  and labeled as a detour instead of a numbered leg */
  optional?: boolean;
}

export interface WalkTour {
  title: string;
  dek: string;
  /** total walking time between stops, minutes */
  walkMinutes: number;
  /** total listening time, minutes */
  listenMinutes: number;
  distanceMiles: number;
  startLabel: string;
  stops: WalkStop[];
  /** lat/lng waypoints of the full walking route, in walk order */
  route: [number, number][];
  /** dashed spurs to the optional detour stops, drawn apart from the
   *  main route line */
  detourRoutes?: [number, number][][];
  /** "Good to know" cards under the tour */
  practical: { title: string; text: string }[];
  /** Shown once in the app when a walker opens their first optional
   *  stop. Shorter and blunter than the practical card, because it
   *  has to land on someone already standing on a sidewalk. */
  detourNotice?: string;
}
