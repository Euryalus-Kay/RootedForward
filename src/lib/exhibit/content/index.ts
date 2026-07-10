/* ------------------------------------------------------------------ */
/*  Chapter registry for the reader-paced exhibit. CHAPTER_META keeps  */
/*  the rail geometry and end-of-chapter record effects; wall text     */
/*  (titles, eras, sections, station intros) ships from                */
/*  data/exhibit/walltext.json through src/lib/exhibit/walltext.ts     */
/*  and always wins over the fallback title here. CHAPTER_LAYOUTS      */
/*  interleaves figures, stations, doors, and quotes with the wall-    */
/*  text sections; EXHIBIT_FLOW is the top-to-bottom render order      */
/*  (the five-instruments overture sits between ch2 and ch3).          */
/* ------------------------------------------------------------------ */
import {
  CHAPTER_ORDER,
  type ChapterId,
  type ChapterMeta,
  type FlowBlock,
} from "../types";
import { wallChapter } from "../walltext";

/* ---- chapter meta: eras, spine anchors, end-of-chapter records ---- */

export const CHAPTER_META: ChapterMeta[] = [
  { id: "ch0", index: 0, title: "The Map", era: "1940", spineYear: 1940, effects: {} },
  { id: "ch0_5", index: 1, title: "Five Instruments", era: "Overture", spineYear: 1832, effects: {} },
  {
    id: "ch1",
    index: 2,
    title: "The First Taking",
    era: "1832 to 1889",
    spineYear: 1833,
    effects: { ledgerEntryIds: ["land-taken"] },
  },
  {
    id: "ch2",
    index: 3,
    title: "The Fair Builds a Neighborhood",
    era: "1893",
    spineYear: 1893,
    effects: { ledgerEntryIds: ["fair-stock"] },
  },
  {
    id: "ch3",
    index: 4,
    title: "The Purge",
    era: "1900 to 1917",
    spineYear: 1908,
    effects: { ledgerEntryIds: ["club-organizes"], machineChanges: { code: "armed" } },
  },
  {
    id: "ch4",
    index: 5,
    title: "Terror and Red Summer",
    era: "1917 to 1921",
    spineYear: 1919,
    sensitivity: "no-motion",
    advisoryBefore: true,
    effects: { ledgerEntryIds: ["red-summer"] },
  },
  {
    id: "ch5",
    index: 6,
    title: "Racism Goes Professional",
    era: "1921 to 1948",
    spineYear: 1924,
    effects: { ledgerEntryIds: ["covenant-armor"], machineChanges: { code: "on", deed: "on" } },
  },
  {
    id: "ch6",
    index: 7,
    title: "Washington Adopts the Plan",
    era: "1929 to 1940",
    spineYear: 1934,
    effects: { ledgerEntryIds: ["redlined"], machineChanges: { map: "on" } },
  },
  {
    id: "ch7",
    index: 8,
    title: "The Walls Crack",
    era: "1937 to 1948",
    spineYear: 1948,
    effects: { ledgerEntryIds: ["covenants-fall"], machineChanges: { deed: "off_residue", contract: "armed" } },
  },
  {
    id: "ch8",
    index: 9,
    title: "The University Rebuilds the Neighborhood",
    era: "1949 to 1962",
    spineYear: 1955,
    effects: {
      ledgerEntryIds: ["renewal-removals"],
      machineChanges: { bulldozer: "on", code: "off_residue" },
    },
  },
  {
    id: "ch9",
    index: 10,
    title: "The Color Tax",
    era: "1950s to 1968",
    spineYear: 1958,
    effects: { ledgerEntryIds: ["color-tax"], machineChanges: { contract: "on" } },
  },
  {
    id: "ch10",
    index: 11,
    title: "The Contract Buyers League",
    era: "1968 to 1971",
    spineYear: 1970,
    effects: {
      ledgerEntryIds: ["cbl-credit"],
      machineChanges: { contract: "off_residue", map: "off_residue" },
    },
  },
  {
    id: "ch11",
    index: 12,
    title: "The Ledger, and the Ground Today",
    era: "1970 to now",
    spineYear: 2026,
    effects: { ledgerEntryIds: ["closing-totals"], machineChanges: { bulldozer: "renamed" } },
  },
];

export const metaOf = (id: ChapterId): ChapterMeta =>
  CHAPTER_META[CHAPTER_ORDER.indexOf(id)];

/** Display title and era prefer the walltext chapter when it exists. */
export function displayTitleOf(id: ChapterId): string {
  return wallChapter(id)?.title ?? metaOf(id).title;
}

export function displayEraOf(id: ChapterId): string {
  return wallChapter(id)?.era ?? metaOf(id).era;
}

/* ---- render order, top of the page to the bottom ------------------ */
/* The overture (five instruments) sits after ch2, where the machines  */
/* concept is introduced before the chapters that switch them on.      */

export const EXHIBIT_FLOW: ChapterId[] = [
  "ch0",
  "ch1",
  "ch2",
  "ch0_5",
  "ch3",
  "ch4",
  "ch5",
  "ch6",
  "ch7",
  "ch8",
  "ch9",
  "ch10",
  "ch11",
];

/* ---- per-chapter layout: extras interleaved with wall sections ---- */

export interface ChapterLayout {
  /** blocks inserted after the Nth wall-text section (1-based). If the
   *  chapter has fewer sections than N, the blocks land at the tail. */
  afterSection?: Record<number, FlowBlock[]>;
  /** blocks appended after the last section */
  tail?: FlowBlock[];
}

export const CHAPTER_LAYOUTS: Partial<Record<ChapterId, ChapterLayout>> = {
  ch0: {
    afterSection: {
      1: [{ kind: "station", station: "holc-map", props: { framing: "ch0" } }],
    },
  },
  ch1: {
    afterSection: {
      1: [
        {
          kind: "figure",
          src: "/media/hyde-park/img/land-cook-county-1853-plat.jpg",
          alt: "Hand-colored 1851 survey map of Cook and DuPage counties, gridded into townships, with the young city of Chicago on the lakeshore.",
          creditKey: "land-cook-county-1853-plat",
          caption:
            "An 1851 map of Cook County by the land agent James H. Rees. The grid that turned treaty land into salable lots had reached this shore.",
        },
      ],
      2: [{ kind: "station", station: "layer-slider" }],
    },
  },
  ch2: {
    afterSection: {
      1: [
        {
          kind: "figure",
          src: "/media/hyde-park/img/worlds-fair-1.jpg",
          alt: "White plaster palaces of the Court of Honor around the Grand Basin at the World's Columbian Exposition.",
          creditKey: "worlds-fair-1",
          caption: "The Court of Honor in Jackson Park, 1893.",
        },
      ],
    },
    tail: [
      {
        kind: "figure",
        src: "/media/hyde-park/exhibit/fig/midway-1893-crowd.jpg",
        alt: "Crowds on the Midway Plaisance beneath the first Ferris Wheel in 1893.",
        creditKey: "midway-1893-crowd",
        caption: "The Midway Plaisance under the Ferris Wheel, 1893.",
      },
    ],
  },
  ch3: {
    afterSection: {
      2: [
        {
          kind: "figure",
          src: "/media/hyde-park/exhibit/fig/fannie-barrier-williams.jpg",
          alt: "Studio portrait of Fannie Barrier Williams from around 1880.",
          creditKey: "fannie-barrier-williams",
          caption: "Fannie Barrier Williams, the Hyde Park neighbor who refused to leave.",
        },
      ],
    },
  },
  ch4: {
    afterSection: {
      1: [{ kind: "station", station: "bombing-map" }],
      2: [
        {
          kind: "figure",
          src: "/media/hyde-park/exhibit/fig/jesse-binga.jpg",
          alt: "Jesse Binga, photographed in 1923.",
          creditKey: "jesse-binga",
          caption: "Jesse Binga, photographed in 1923.",
        },
      ],
    },
  },
  ch5: {
    afterSection: {
      2: [
        {
          kind: "figure",
          src: "/media/hyde-park/exhibit/fig/racial-hierarchy-doc.jpg",
          alt: "A period land merchants' advertisement offering lots with racial restrictions attached.",
          creditKey: "racial-hierarchy-doc",
          caption: "The sales pitch in print. Restrictions were a selling point.",
        },
      ],
    },
    tail: [
      { kind: "door", roomId: "deed", label: "The Deed" },
      { kind: "door", roomId: "code", label: "The Code" },
    ],
  },
  ch6: {
    afterSection: {
      2: [
        {
          kind: "figure",
          src: "/media/hyde-park/exhibit/fig/homer-hoyt.jpg",
          alt: "The Home Owners' Loan Corporation Residential Security Map of Chicago, around 1940.",
          creditKey: "homer-hoyt",
          caption: "The Residential Security Map of Chicago, as issued.",
        },
      ],
      3: [{ kind: "station", station: "holc-map", props: { framing: "ch6" } }],
    },
    tail: [
      { kind: "door", roomId: "files", label: "The Surveyor's Files" },
      { kind: "door", roomId: "map", label: "The Map" },
    ],
  },
  ch7: {
    afterSection: {
      1: [
        {
          kind: "figure",
          src: "/media/hyde-park/exhibit/fig/dd-redlining-11.jpg",
          alt: "Portrait of Carl Augustus Hansberry.",
          creditKey: "dd-redlining-11",
          caption: "Carl Hansberry, who bought the house and carried the covenant to the Supreme Court.",
        },
      ],
      2: [
        {
          kind: "figure",
          src: "/media/hyde-park/img/dd-color-line-10.jpg",
          alt: "Interior of the Supreme Court Building during a session.",
          creditKey: "dd-color-line-10",
          caption: "The Supreme Court chamber, photographed in 1937, where covenant enforcement ended in 1948.",
        },
        { kind: "cases" },
      ],
    },
    tail: [
      {
        kind: "figure",
        src: "/media/hyde-park/exhibit/fig/color-line-7.jpg",
        alt: "Washday of a family on relief in Chicago, photographed by Russell Lee.",
        creditKey: "color-line-7",
        caption: "Inside the Black Belt's crowded flats.",
      },
    ],
  },
  ch8: {
    afterSection: {
      3: [
        {
          kind: "figure",
          src: "/media/hyde-park/img/urban-renewal-3.jpg",
          alt: "The twin modernist slabs of University Apartments standing in the median of 55th Street in Hyde Park.",
          creditKey: "urban-renewal-3",
          caption:
            "What replaced the demolished blocks. University Apartments, raised in the early 1960s in the cleared center of 55th Street.",
        },
      ],
      4: [
        {
          kind: "figure",
          src: "/media/hyde-park/img/dd-urban-renewal-2.jpg",
          alt: "Shoppers and traffic under the elevated tracks on 63rd Street in Woodlawn in 1973.",
          creditKey: "dd-urban-renewal-2",
          caption:
            "63rd Street in Woodlawn, one neighborhood south, in July 1973. The National Archives caption reads, “Once one of Chicago’s busy thoroughfares, 63rd Street has changed with the character of the city.”",
        },
      ],
    },
    tail: [{ kind: "door", roomId: "bulldozer", label: "The Bulldozer" }],
  },
  ch9: {
    afterSection: {
      1: [{ kind: "quote", voiceId: "dempsey-travis" }],
      3: [{ kind: "station", station: "two-buyers" }],
    },
    tail: [{ kind: "door", roomId: "contract", label: "The Contract" }],
  },
  ch10: {
    afterSection: {
      2: [
        { kind: "quote", voiceId: "martin-luther-king" },
        {
          kind: "figure",
          src: "/media/hyde-park/img/dd-urban-renewal-3.jpg",
          alt: "A man at his newsstand at 22nd and South State Streets in 1973, round public housing towers rising behind him.",
          creditKey: "dd-urban-renewal-3",
          caption:
            "A newsstand at 22nd and South State Streets, July 1973. John H. White photographed Black Chicago for the federal DOCUMERICA project in the years the League's trials ended.",
        },
      ],
    },
    tail: [{ kind: "door", roomId: "counter", label: "The Counter-Machine" }],
  },
  ch11: {
    afterSection: {
      1: [{ kind: "ledger-table" }, { kind: "station", station: "gap-at-scale" }],
    },
    tail: [{ kind: "station", station: "answer-wall" }],
  },
};
