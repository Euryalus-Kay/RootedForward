/* ------------------------------------------------------------------ */
/*  Wall-text registry accessor, the content spine of the rebuilt      */
/*  exhibit. data/exhibit/walltext.json carries the opening plain-     */
/*  words section, the how-to-read line, and one entry per chapter     */
/*  (context intro, wall-text sections, station intro panels).         */
/*  Chapters land in the file as they are written; every consumer      */
/*  must render gracefully when a chapter is not there yet.            */
/* ------------------------------------------------------------------ */
import walltextJson from "../../../data/exhibit/walltext.json";
import type {
  ChapterId,
  StationIntroDef,
  WallChapterData,
  WallOpeningData,
} from "./types";

const doc = walltextJson as unknown as {
  version: number;
  opening: WallOpeningData;
  chapters: WallChapterData[];
};

export const WALL_OPENING: WallOpeningData = doc.opening;

const byId = new Map<string, WallChapterData>(doc.chapters.map((c) => [c.id, c]));

export function wallChapter(id: ChapterId): WallChapterData | undefined {
  return byId.get(id);
}

export function hasWallChapter(id: ChapterId): boolean {
  return byId.has(id);
}

export function stationIntroOf(
  chapterId: ChapterId,
  stationId: string
): StationIntroDef | undefined {
  return byId.get(chapterId)?.stationIntros?.[stationId];
}

export function allWallChapters(): WallChapterData[] {
  return doc.chapters;
}
