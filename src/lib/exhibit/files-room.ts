/* ------------------------------------------------------------------ */
/*  The Surveyor's Files reading room: nameplate copy and the sheet    */
/*  permalink grammar (#room-files:<areaId>). Kept apart from the      */
/*  room component so the door card and the overlay chrome can use     */
/*  them without pulling the room body into the eager bundle.          */
/* ------------------------------------------------------------------ */

export const FILES_ROOM_PLATE = {
  title: "The Surveyor's Files",
  plainName: "The Area Description Sheets, 1939 to 1940",
  definition:
    "Every digitized description sheet the federal surveyors filed for Chicago's graded areas. Read them in their own words, and link to any sheet.",
};

export const FILES_HASH = "#room-files";

/** parse a #room-files:<areaId> deep link into the areaId, else null */
export function sheetIdFromHash(hash: string | null | undefined): string | null {
  if (!hash || !hash.startsWith(FILES_HASH + ":")) return null;
  const id = hash.slice(FILES_HASH.length + 1).trim();
  return id.length > 0 ? id : null;
}

/** the permalink hash for a sheet */
export function sheetHash(areaId: string | number): string {
  return `${FILES_HASH}:${String(areaId)}`;
}
