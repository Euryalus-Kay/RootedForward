/* ------------------------------------------------------------------ */
/*  Chapter registry. CHAPTER_META is eager (feeds HUD, spine, jump    */
/*  chips). Stage definitions are auto-derived from narration.json     */
/*  (every VO block becomes a prose card; every pausePointAfter        */
/*  becomes an interactive slot) plus per-chapter stage overrides for  */
/*  figures, stats, and doors. Interactives that are not yet built     */
/*  render as labeled in-production cards, never silent gaps.          */
/* ------------------------------------------------------------------ */
import narrationJson from "../../../../data/exhibit/narration.json";
import {
  CHAPTER_ORDER,
  type ChapterDef,
  type ChapterId,
  type ChapterMeta,
  type NarrationBlockData,
  type NarrationChapterData,
  type StageBlock,
} from "../types";

export const NARRATION = narrationJson as unknown as {
  title: string;
  kicker: string;
  chapters: NarrationChapterData[];
};

const narrationByChapter = new Map<string, NarrationChapterData>(
  NARRATION.chapters.map((c) => [c.id, c])
);

export function narrationChapter(id: ChapterId): NarrationChapterData | undefined {
  return narrationByChapter.get(id);
}

export function narrationBlock(blockId: string): NarrationBlockData | undefined {
  const chId = blockId.split("-")[0];
  return narrationByChapter.get(chId)?.blocks.find((b) => b.id === blockId);
}

export const BLOCK_COUNTS: Record<string, number> = Object.fromEntries(
  NARRATION.chapters.map((c) => [c.id, c.blocks.length])
);

/* ---- chapter meta: eras, spine anchors, end-of-chapter effects ---- */

export const CHAPTER_META: ChapterMeta[] = [
  { id: "ch0", index: 0, title: "Declined", era: "1940", spineYear: 1940, effects: {} },
  { id: "ch0_5", index: 1, title: "The Five Machines", era: "Overture", spineYear: 1832, effects: {} },
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
    era: "1917 to 1919",
    spineYear: 1919,
    sensitivity: "no-motion",
    advisoryBefore: true,
    effects: { ledgerEntryIds: ["red-summer"] },
  },
  {
    id: "ch5",
    index: 6,
    title: "Racism Goes Professional",
    era: "1921 to 1928",
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
    era: "1968 to 1970",
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

/* ---- stage overrides: figures, stats, quotes inserted around the ---- */
/* ---- auto-derived narration + interactive slots, keyed by blockId ---- */

interface StageOverrides {
  /** blocks inserted after the given narration blockId (before its interactive slot) */
  after?: Record<string, StageBlock[]>;
  /** blocks appended at chapter end */
  tail?: StageBlock[];
}

const OVERRIDES: Partial<Record<ChapterId, StageOverrides>> = {
  ch1: {
    after: {
      "ch1-b2": [{ kind: "interactive", interactive: "layer-slider" }],
    },
  },
};

export function buildChapterDef(id: ChapterId): ChapterDef {
  const meta = metaOf(id);
  const narr = narrationChapter(id);
  const ov = OVERRIDES[id] ?? {};
  const stage: StageBlock[] = [];
  for (const block of narr?.blocks ?? []) {
    stage.push({ kind: "narration", blockId: block.id });
    for (const extra of ov.after?.[block.id] ?? []) stage.push(extra);
    if (block.pausePointAfter) {
      stage.push({ kind: "interactive", interactive: block.pausePointAfter });
    }
  }
  for (const extra of ov.tail ?? []) stage.push(extra);
  return { meta, stage };
}

export const CHAPTER_DEFS: ChapterDef[] = CHAPTER_ORDER.map((id) => buildChapterDef(id));
