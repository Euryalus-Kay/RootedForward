#!/usr/bin/env node
/**
 * exhibit-prep-bombings.mjs
 *
 * Museum-exhibit data prep: the 1917-1921 anti-Black housing bombings documented by
 * the Chicago Commission on Race Relations, "The Negro in Chicago" (1922), public domain.
 *
 * What it does:
 *   1. Fetches (once) and caches the Project Gutenberg plain text (#57343) at
 *      data/exhibit-src/ccrr-negro-in-chicago.txt
 *   2. Verifies EVERY incident below against that text. Each incident carries a
 *      verbatim excerpt (whitespace-normalized); the script requires the excerpt to be
 *      found in the text and records the cached-file line offsets. Any excerpt that
 *      fails to match aborts the run. Nothing unverified ships.
 *   3. Writes working notes (verbatim passages + line offsets) to
 *      data/exhibit-src/bombings-extract.md
 *   4. Geocodes address-bearing incidents with a deterministic street-grid method
 *      (no live geocoding services), validates each point by point-in-polygon against
 *      data/geo/ca.geojson community areas, and writes public/exhibit-data/bombings.json
 *   5. If public/exhibit-data/holc-frames.json exists and exposes a "citywide" frame,
 *      each geocoded point also gets pixel coordinates in that frame. If the file is
 *      absent the frame coords stay null; re-running later fills them (idempotent).
 *
 * Geocoding method (documented, deterministic):
 *   Chicago's street grid: State St = 0 E/W, Madison St = 0 N/S, 800 address units per
 *   mile south of 31st St (the segment covering every geocodable incident here,
 *   3100 S - 6300 S). Rather than hard-coding city anchors from memory, the script
 *   calibrates from the real community-area boundaries in data/geo/ca.geojson:
 *     - Grand Boulevard's north edge is Pershing/39th (3900 S) and its south edge is
 *       51st (5100 S); the median latitudes of those straight east-west edges give the
 *       lat(units) line and the measured degrees-per-mile.
 *     - Cottage Grove Ave (800 E) is the measured shared edge Grand Blvd/Kenwood
 *       (39th-51st) and the Hyde Park west edge (south of 51st).
 *     - Longitude spacing per mile = measured lat degrees-per-mile / cos(41.795 deg).
 *   Named N-S streets get nominal grid units from the standard Chicago street guide
 *   (Wabash 45 E, Indiana 200 E, Calumet 344 E, South Park/Grand Blvd 400 E,
 *   Cottage Grove 800 E, Maryland 832 E, Ellis 1000 E). Two irregular streets use the
 *   longitude anchors supplied with the exhibit spec: Vincennes Ave (diagonal;
 *   -87.6135 near 45th) and Berkeley Ave (short street; -87.5980 near 43rd-44th).
 *   Every point is stamped with method + precisionMeters, cross-checked against the
 *   extant Binga house (5922 S King Dr, formerly South Park Ave), and point-in-polygon
 *   tested against the expected community area. Points failing validation get geo: null.
 *
 * Real-data rule: no invented rows, no invented coordinates. Counts, dates, names,
 * addresses and damage figures all come from the 1922 text; internal inconsistencies
 * in the text (they exist) are carried as notes, not silently resolved.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC_DIR = path.join(ROOT, "data", "exhibit-src");
const OUT_DIR = path.join(ROOT, "public", "exhibit-data");
const TEXT_PATH = path.join(SRC_DIR, "ccrr-negro-in-chicago.txt");
const EXTRACT_PATH = path.join(SRC_DIR, "bombings-extract.md");
const CA_PATH = path.join(ROOT, "data", "geo", "ca.geojson");
const FRAMES_PATH = path.join(OUT_DIR, "holc-frames.json");
const OUT_PATH = path.join(OUT_DIR, "bombings.json");

const TEXT_URLS = [
  "https://www.gutenberg.org/cache/epub/57343/pg57343.txt",
  "https://www.gutenberg.org/files/57343/57343-0.txt",
];

// ---------------------------------------------------------------------------
// 1. Source text (fetch once, cache)
// ---------------------------------------------------------------------------

async function ensureText() {
  fs.mkdirSync(SRC_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(TEXT_PATH) && fs.statSync(TEXT_PATH).size > 500_000) {
    console.log(`[text] using cached ${path.relative(ROOT, TEXT_PATH)}`);
    return;
  }
  for (const url of TEXT_URLS) {
    try {
      console.log(`[text] fetching ${url}`);
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      if (!/The Negro in Chicago/i.test(body.slice(0, 2000))) {
        throw new Error("fetched file does not look like ebook #57343");
      }
      fs.writeFileSync(TEXT_PATH, body);
      console.log(`[text] cached ${(body.length / 1e6).toFixed(2)} MB`);
      return;
    } catch (err) {
      console.warn(`[text] ${url} failed. ${err.message}`);
    }
  }
  throw new Error("could not fetch the Gutenberg text from any mirror");
}

// Find a whitespace-normalized verbatim excerpt in the raw text.
// Returns { lineStart, lineEnd, raw } or null.
function locate(raw, excerpt) {
  const pattern = excerpt
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  const re = new RegExp(pattern);
  const m = re.exec(raw);
  if (!m) return null;
  const before = raw.slice(0, m.index);
  const lineStart = before.split("\n").length;
  const lineEnd = lineStart + m[0].split("\n").length - 1;
  return { lineStart, lineEnd, raw: m[0] };
}

// ---------------------------------------------------------------------------
// 2. The verified record. Every `excerpt` is verbatim from the 1922 text
//    (whitespace-normalized); the script aborts if any excerpt is not found.
// ---------------------------------------------------------------------------

const CH4 = "Gutenberg #57343, ch. IV \"The Negro Population of Chicago\", sec. III \"Bombings\"";
const CH4T = CH4 + ", subsec. 1 \"Typical Bombings\"";
const CH4R = CH4 + ", subsec. 3 \"Reaction of Negroes\"";
const CHX = "Gutenberg #57343, ch. X \"Public Opinion in Race Relations (continued)\", \"Bombing publicity\"";

const AGG = {
  main: "From July 1, 1917, to March 1, 1921, the Negro housing problem was marked by fifty-eight bomb explosions. Two persons, both Negroes, were killed, a number of white and colored persons were injured, and the damage to property amounted to more than $100,000.",
  square: "Of these fifty-eight bombs, thirty-two were exploded within the square bounded by Forty-first and Sixtieth streets, Cottage Grove Avenue and State Street.",
  enforcement: "With an average of one race bombing every twenty days for three years and eight months, the police and the state's attorney's office succeeded in apprehending but two persons suspected of participation in these acts of lawlessness.",
  noTrial: "At the writing of this report, one year after the arrest, there has been no trial.",
  twoArrestsOnly: "Yet in fifty-eight bombings of Negro homes only two suspects were ever arrested.",
};

const PROGRESSION = [
  { asOf: "1919-02", window: "1918-02 to 1919-02", count: 11, excerpt: "During the time from February, 1918, to February, 1919, prior to the Chicago riot, there were eleven bombings in the city.", locator: CHX },
  { asOf: "1919-07-27", window: "1917-07-01 to riot start", count: 24, excerpt: "From July 1, 1917, to July 27, 1919, the day the riot began, twenty-four such bombs had been thrown.", locator: "Gutenberg #57343, ch. I \"The Chicago Riot\", background section" },
  { asOf: "1919-07-27", window: "six weeks preceding the riot", count: 7, excerpt: "During the six weeks immediately preceding the Chicago race riot, there were seven racial bombings.", locator: CHX },
  { asOf: "1920-02", window: "homes of Negroes bombed to date", count: 21, excerpt: "apprehend those persons who have bombed the homes of twenty-one Negroes.", locator: CH4R + " (Protective Circle constitution; homes of Negroes only)" },
  { asOf: "1920-06-18", window: "1917-07-01 to 1920-06-18", count: 45, excerpt: "Of the forty-five racial bombings which took place in Chicago between July 1, 1917, and June 18, 1920, fourteen were not mentioned in any of the six large dailies of the city.", locator: CHX },
  { asOf: "1920-07-01", window: "1920-03-01 to 1920-07-01", count: 7, excerpt: "Seven bombings took place from March 1 to July 1.", locator: CHX },
  { asOf: "1920-12-31", window: "1917 to 1920", count: 52, excerpt: "depreciation in and near Negro areas; 52 house bombings, 1917-1920.", locator: "Gutenberg #57343, front matter, \"The Problem\" summary of materials" },
  { asOf: "1921-02-14", window: "of recent record", count: 56, excerpt: "An editorial in the _Tribune_, February 14, 1921, condemning bombing made no reference to the fifty-six race bombings of recent record, but did refer to other bombing aimed at white citizens.", locator: CHX },
  { asOf: "1921-03-01", window: "full survey period", count: 58, excerpt: AGG.main, locator: CH4 },
];

const CONTEXT_QUOTES = [
  { key: "four-fifths", excerpt: "In the Hyde Park district, between Thirty-ninth and Forty-seventh streets and State Street and Cottage Grove Avenue, four-fifths of the bombings occurred.", locator: CH4 },
  { key: "forty-families", excerpt: "Only two of the forty Negro families bombed have moved; the others have made repairs, secured private watchmen or themselves kept vigil for night bombers, and still occupy the properties.", locator: CH4R },
  { key: "binga-six", excerpt: "Jesse Binga has been bombed six times but states he will not move.", locator: CH4R },
  { key: "clarke-four", excerpt: "Mrs. Clarke was bombed four times; she still lives in the property and declares that she will not be driven out.", locator: CH4R },
  { key: "binga-five-press", excerpt: "Jesse Binga, a Negro banker, was bombed five times.", locator: CHX },
  { key: "advance-warning", excerpt: "News of threatened bombings in many cases was circulated well in advance of the actual occurrence. Negroes were warned of the exact date on which explosions would occur.", locator: CH4 },
];

// Street table. `east` = nominal Chicago grid units east of State St from the standard
// street guide; `anchorLng` marks streets pinned by a supplied longitude anchor
// (irregular or diagonal streets) instead of the calibrated grid formula.
const STREETS = {
  "STATE": { east: 0 },
  "WABASH": { east: 45 },
  "MICHIGAN": { east: 100 },
  "INDIANA": { east: 200 },
  "PRAIRIE": { east: 300 },
  "CALUMET": { east: 344 },
  "SOUTH PARK": { east: 400, note: "South Park Ave = Grand Boulevard = today's King Dr" },
  "GRAND BOULEVARD": { east: 400 },
  "VINCENNES": { anchorLng: -87.6135, east: 500, note: "diagonal street; anchor longitude near 45th St" },
  "COTTAGE GROVE": { east: 800 },
  "MARYLAND": { east: 832 },
  "ELLIS": { east: 1000 },
  "BERKELEY": { anchorLng: -87.598, east: 1150, note: "short street between Ellis and Lake Park; anchor longitude near 43rd-44th" },
};

/**
 * Incident schema:
 *   loc: null | { street, house } (N-S street address)
 *        | { ew: <units east of State>, south: <units south of Madison> } (E-W street address)
 *   precision: "address" | "block" | "none"
 *   sourceType: commission-narrative | aggregate-cluster | press-quoted | illustration-caption
 */
const INCIDENTS = [
  {
    id: "b-motley-1917-07-01", date: "1917-07-01", dateApproximate: false,
    address: "5230 Maryland Ave", loc: { street: "MARYLAND", house: 5230 },
    target: "S. P. Motley home (Black family, owners since 1913)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["HYDE PARK"],
    damageUsd: 1000, locator: CH4T,
    excerpt: "On July 1, 1917, without warning or threat, a bomb was exploded in the vestibule of the house, and the front of the building was blown away. The damage amounted to $1,000.",
    note: "Address from the same passage. \"In 1913 S. P. Motley, Negro, and his wife purchased a building at 5230 Maryland Avenue\". This is the earliest bombing in the 58-bombing survey period.",
  },
  {
    id: "b-motley-adjacent-1919-06-04", date: "1919-06-04", dateApproximate: false,
    address: "house adjacent to 5230 Maryland Ave", loc: { street: "MARYLAND", house: 5230 },
    target: "house adjacent to the Motley home (rumored Motley purchase)", targetType: "Black homeowner",
    precision: "block", sourceType: "commission-narrative", expectCA: ["HYDE PARK"],
    locator: CH4T,
    excerpt: "At 4:00 A.M. June 4, 1919, a dynamite bomb was exploded under the front of the house adjacent and tore up its stone front.",
    note: "Plotted at 5230 Maryland with block precision; the text says only \"the house adjacent\".",
  },
  {
    id: "b-agent-white-1919-01", date: "1919-01", dateApproximate: true,
    address: null, loc: null,
    target: "white real estate agent (unnamed)", targetType: "realtor/agent",
    precision: "none", sourceType: "commission-narrative", expectCA: null,
    locator: CH4,
    excerpt: "In January, 1919, a white and a Negro real estate agent were bombed; in March, Jesse Binga's real estate office at 4724 State Street and an apartment at 4041 Calumet Avenue were bombed.",
    note: "No location given in the text.",
  },
  {
    id: "b-agent-negro-1919-01", date: "1919-01", dateApproximate: true,
    address: null, loc: null,
    target: "Black real estate agent (unnamed)", targetType: "realtor/agent",
    precision: "none", sourceType: "commission-narrative", expectCA: null,
    locator: CH4,
    excerpt: "In January, 1919, a white and a Negro real estate agent were bombed; in March, Jesse Binga's real estate office at 4724 State Street and an apartment at 4041 Calumet Avenue were bombed.",
    note: "No location given in the text.",
  },
  {
    id: "b-binga-office-1919-03", date: "1919-03", dateApproximate: true,
    address: "4724 State St", loc: { street: "STATE", house: 4724 },
    target: "Jesse Binga real estate office (first Binga bombing)", targetType: "Black-owned business",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4,
    excerpt: "In January, 1919, a white and a Negro real estate agent were bombed; in March, Jesse Binga's real estate office at 4724 State Street and an apartment at 4041 Calumet Avenue were bombed.",
    note: "Corroborated by quoted press items of March 19-20, 1919 (Tribune \"BINGA PROPERTY WAS WRECKED\"). The commission adds that \"The first bombing of Binga does not appear to have been the result of resentment of neighbors in the vicinity of his home, for it was his office on State Street that was bombed.\"",
  },
  {
    id: "b-calumet-4041-1919-03", date: "1919-03", dateApproximate: true,
    address: "4041 Calumet Ave", loc: { street: "CALUMET", house: 4041 },
    target: "apartment building", targetType: "Black tenants/residence",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4,
    excerpt: "In January, 1919, a white and a Negro real estate agent were bombed; in March, Jesse Binga's real estate office at 4724 State Street and an apartment at 4041 Calumet Avenue were bombed.",
    note: "Occupant not named in the text.",
  },
  {
    id: "b-ellis-4212-1919-04", date: "1919-04-07", dateApproximate: true,
    address: "4212 Ellis Ave", loc: { street: "ELLIS", house: 4212 },
    target: "flat building occupied by Black families", targetType: "Black tenants/residence",
    precision: "address", sourceType: "press-quoted", expectCA: ["OAKLAND"],
    locator: CHX + " (Herald-Examiner, April 7, 1919)",
    excerpt: "A RACE WAR IS GENERALLY BELIEVED TO HAVE BEEN BEHIND A BOMB EXPLOSION EARLY THIS MORNING AT 4212 ELLIS AVE.",
    note: "Same-day headlines quoted from the Journal (\"RACE HATRED BOMB HURLS SIX FAMILIES FROM BED\"), Post and Tribune describe the same April 7, 1919 explosion in a flat building. Consistent with the housing chapter's \"In April there were two more bombings, one of a realty office.\"",
  },
  {
    id: "b-wimes-lassiter-1919-04", date: "1919-04", dateApproximate: true,
    address: "4722 Indiana Ave", loc: { street: "INDIANA", house: 4722 },
    target: "Wimes & Lassiter, Black real estate dealers (office)", targetType: "Black-owned business",
    precision: "address", sourceType: "press-quoted", expectCA: ["GRAND BOULEVARD"],
    locator: CHX + " (Herald-Examiner, April 20, 1919)",
    excerpt: "a narrative of a racial bombing at 4722 Indiana Avenue where Wimes & Lassiter, Negro real-estate dealers, had an office.",
    note: "The realty-office bombing of April 1919 referenced in the housing chapter (\"In April there were two more bombings, one of a realty office\").",
  },
  {
    id: "b-harrison-1919-05-17", date: "1919-05-17", dateApproximate: false,
    address: "4708 Grand Blvd", loc: { street: "GRAND BOULEVARD", house: 4708 },
    target: "Mrs. Gertrude Harrison home (Black woman living alone with her children)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "The following night, May 17, her house was bombed while the patrolman was \"punching his box\" two blocks away and the special watchman was at the rear.",
    note: "Year 1919 from the same passage (\"In March, 1919, she moved in\"; warning received May 16). Corroborated by the quoted Tribune headline of May 18, 1919, \"NEGRO FAMILY ON GRAND BOULEVARD OBJECT OF BOMB\".",
  },
  {
    id: "b-harrison-1919-05-18", date: "1919-05-18", dateApproximate: false,
    address: "4708 Grand Blvd", loc: { street: "GRAND BOULEVARD", house: 4708 },
    target: "Mrs. Gertrude Harrison home (second attack, bomb thrown onto roof)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "The following night a bomb was thrown on the roof of the house from the window of a vacant flat in the adjoining apartment house.",
    note: "\"The following night\" after May 17, 1919, while a police detail guarded front and rear.",
  },
  {
    id: "b-binga-office-1919-11-12", date: "1919-11-12", dateApproximate: false,
    address: "4724 State St", loc: { street: "STATE", house: 4724 },
    target: "Jesse Binga real estate office (left in ruins)", targetType: "Black-owned business",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "On November 12, 1919, an automobile rolled by his realty office and a bomb was tossed from it. It left the office in ruins.",
    note: "Office address from the same passage. \"his real estate office at 4724 State Street\".",
  },
  {
    id: "b-binga-home-1919-12-03", date: "1919-12-03", dateApproximate: true,
    address: "5922 South Park Ave", loc: { street: "SOUTH PARK", house: 5922 },
    target: "Jesse Binga residence (bomb under front steps, failed to explode)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["WASHINGTON PARK"],
    locator: CH4T,
    excerpt: "Twenty-one days later an automobile drew up in front of Binga's home at 5922 South Park Avenue, and its occupants put a bomb under the front steps. It failed to explode.",
    note: "Date computed from the text's \"twenty-one days later\" after November 12, 1919.",
  },
  {
    id: "b-coleman-1919-12-26", date: "1919-12-26", dateApproximate: false,
    address: null, loc: null,
    target: "J. H. Coleman home (white real estate man who had sold a house to a Black buyer)", targetType: "realtor/agent",
    precision: "none", sourceType: "commission-narrative", expectCA: null,
    locator: CH4,
    excerpt: "On December 26 the home of J. H. Coleman, a white real estate man who had sold a house to a Negro, was bombed. The transaction was not public, and occupancy was not to take place for five months.",
    note: "No address given in the text. Year 1919 from the surrounding passage.",
  },
  {
    id: "b-binga-home-1919-12-27", date: "1919-12-27", dateApproximate: false,
    address: "5922 South Park Ave", loc: { street: "SOUTH PARK", house: 5922 },
    target: "Jesse Binga residence (porch torn up)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["WASHINGTON PARK"],
    locator: CH4,
    excerpt: "On December 27 the home of Jesse Binga, a Negro real estate man, was bombed.",
    note: "The narrative account (\"Twenty-five days later the bombers reappeared and left a third bomb. It tore up the porch of Binga's home.\") implies about December 28; the text's explicit date of December 27 is used. The quoted Herald-Examiner headline of December 28, 1919, \"RACE WAR BOMB INJURES WOMAN\", may report this explosion.",
  },
  {
    id: "b-austin-1920-01-06", date: "1920-01-06", dateApproximate: false,
    address: "North Side (no street address given)", loc: null,
    target: "W. B. Austin home (white banker and real estate man who financed and sold to Black buyers)", targetType: "banker",
    precision: "none", sourceType: "commission-narrative", expectCA: null,
    locator: CH4,
    excerpt: "One week later, on January 6, came the bombing of W. B. Austin, on the North Side.",
    note: "The deterministic South Side street-grid method cannot place a North Side incident without a street address; geo left null. Austin had been denounced by name in the Property Owners' Journal of December 13, 1919.",
  },
  {
    id: "b-clarke-1920-01-05", date: "1920-01-05", dateApproximate: false,
    address: "4404-4406 Grand Blvd", loc: { street: "GRAND BOULEVARD", house: 4404 },
    target: "Mrs. Mary Byron Clarke home (Black real estate dealer)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    damageUsd: 3360, locator: CH4T,
    excerpt: "On January 5, 1920, the house was bombed. The explosion caused $3,360 worth of damage.",
    note: "Mrs. Clarke's own statement in the same passage puts the first damage at about $500 and the second at $3,360; the narrative assigns $3,360 to this first explosion. Both readings kept. The Post of January 6, 1920 reported \"A bomb early today damaged the residence at 4404 Grand Boulevard which was said to have been a Negro 'sniping-post' during the race riot last summer\"; the commission rebuts the sniping-post claim directly.",
  },
  {
    id: "b-woodfolk-1920-02-01", date: "1920-02-01", dateApproximate: false,
    address: "4722 Calumet Ave", loc: { street: "CALUMET", house: 4722 },
    target: "R. W. Woodfolk flat building (Black banker, Merchants and Peoples' Bank)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    damageUsd: 1000, locator: CH4T,
    excerpt: "On the evening of February 1, 1920, a person with keys to the building locked the tenants in their apartments, sprung the locks of the doors leading to the street, and planted a bomb in the hallway.",
    note: "Address from the same passage. \"purchased a flat at 4722 Calumet Avenue\". Corroborated by the quoted Daily News item of February 2, 1920.",
  },
  {
    id: "b-appomattox-1920-02", date: "1920-02", dateApproximate: true,
    address: null, loc: null,
    target: "building recently sold to the Appomattox Club (Black organization)", targetType: "Black organization/club",
    precision: "none", sourceType: "press-quoted", expectCA: null,
    locator: CHX + " (Daily News, February 10, 1920)",
    excerpt: "BUILDING RECENTLY SOLD TO APPOMATTOX CLUB, A NEGRO ORGANIZATION",
    note: "Headline quoted by the commission among press reports of race bombings. No address given in the text.",
  },
  {
    id: "b-clarke-1920-02-12", date: "1920-02-12", dateApproximate: false,
    address: "4404-4406 Grand Blvd", loc: { street: "GRAND BOULEVARD", house: 4404 },
    target: "Mrs. Mary Byron Clarke home (dynamite bomb through plate-glass door)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "The building was again bombed February 12, 1920, this time with a dynamite bomb thrown through the plate-glass door in the hallway from a passing automobile.",
    note: "The quoted Daily News item of February 13, 1920, \"TWO BOMBS TOSSED\", is consistent with this attack.",
  },
  {
    id: "b-binga-home-1920-02-28", date: "1920-02-28", dateApproximate: false,
    address: "5922 South Park Ave", loc: { street: "SOUTH PARK", house: 5922 },
    target: "Jesse Binga residence (bomb tossed into yard during police guard change, fuse went out)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["WASHINGTON PARK"],
    locator: CH4T,
    excerpt: "In this unguarded interval an automobile swung around the corner, and as it passed the Binga home a man leaned out and tossed a bomb into the yard. The bomb lit in a puddle of water and the fuse went out.",
    note: "\"On the night of February 28\" in the same passage; year 1920 from the narrative sequence.",
  },
  {
    id: "b-hyers-1920-03-05", date: "1920-03-05", dateApproximate: true,
    address: null, loc: null,
    target: "George A. Hyers property", targetType: "unknown",
    precision: "none", sourceType: "commission-narrative", expectCA: null,
    motiveDisputed: true, locator: CH4 + ", subsec. 2 \"Reaction of Whites in Hyde Park\"",
    excerpt: "this paper took pains to explain that the bombing of George A. Hyers' property on March 5 was an outgrowth of labor troubles and not of a property owners' organization recently formed in this community.",
    note: "The Kenwood and Hyde Park Property Owners' Association paper attributed this bombing to labor troubles; the quoted Journal headline of March 6, 1920, \"ATTRIBUTE BOMB TO SOUTH SIDE RACE WAR\", suggests contemporaries read it as racial. Motive disputed within the text; no address given. Year from surrounding 1920 context.",
  },
  {
    id: "b-fox-1920-03-10", date: "1920-03-10", dateApproximate: false,
    address: "442 E 45th St", loc: { ew: 442, south: 4500 },
    target: "Moses Fox home (white real estate man who sold his house to Black buyers)", targetType: "realtor/agent",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    damageUsd: 1000, locator: CH4T,
    excerpt: "At 7:30 that evening an automobile was seen to drive slowly past his home three times, stopping each time just east of the building. On the last trip a man alighted, and deposited a long-fuse bomb in the vestibule.",
    note: "Date and address from the same passage. \"Moses Fox, white, connected with a 'Loop' real estate firm, lived at 442 East Forty-fifth Street\"; the call warning him came March 10, 1920, and the bomb was placed at 7:30 that evening. The quoted Herald-Examiner headline of March 11, 1920, \"SOUTH SIDE HOUSE SOLD TO NEGROES BOMBED\", matches.",
  },
  {
    id: "b-jackson-48thpl-1920-04-03", date: "1920-04-03", dateApproximate: true,
    address: "423 E 48th Pl", loc: { ew: 423, south: 4850 },
    target: "four-story flat building owned by Robert B. Jackson (Black owner-occupant)", targetType: "Black homeowner",
    precision: "address", sourceType: "press-quoted", expectCA: ["GRAND BOULEVARD"],
    locator: CHX + " (Herald-Examiner, April 4, 1920)",
    excerpt: "A black powder bomb was exploded last night in front of the vestibule of a four-story flat building 423 E. 48th Place, occupied by Negroes. The building is owned by Robert B. Jackson, who lives on the second floor.",
    note: "Quoted in full by the commission as a typical press report. \"Last night\" relative to the April 4, 1920 article. 48th Place taken as 4850 S in grid units (midway between 48th and 49th).",
  },
  {
    id: "b-clarke-1920-04-13", date: "1920-04-13", dateApproximate: false,
    address: "4404-4406 Grand Blvd", loc: { street: "GRAND BOULEVARD", house: 4404 },
    target: "Mrs. Mary Byron Clarke home (third bombing, despite two special policemen)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "Tuesday evening, April 13, 1920, a third bomb was exploded in spite of the presence of the two special policemen.",
    note: "A later passage states Mrs. Clarke was bombed four times in all; the fourth attack is not individually described in the text.",
  },
  {
    id: "b-hubbard-1920-04-25", date: "1920-04-25", dateApproximate: false,
    address: "4331 Vincennes Ave", loc: { street: "VINCENNES", house: 4331 },
    target: "Crede Hubbard three-flat building (Black owner; pressured by the Hyde Park-Kenwood Association)", targetType: "Black homeowner",
    precision: "address", sourceType: "commission-narrative", expectCA: ["GRAND BOULEVARD"],
    locator: CH4T,
    excerpt: "Following is part of Hubbard's statement to the police immediately after the bombing of his home at 4331 Vincennes Avenue on the night of April 25, 1920",
    note: "A letter quoted inside Hubbard's statement gives the address as 4332 Vincennes; the commission's own heading address of 4331 is used. His family was home; two boys slept ten feet from the blast.",
  },
  {
    id: "b-club-1920-05", date: "1920-05", dateApproximate: true,
    address: null, loc: null,
    target: "clubhouse of a Black club of 600 members (porch wrecked)", targetType: "Black organization/club",
    precision: "none", sourceType: "press-quoted", expectCA: null,
    motiveDisputed: true, locator: CHX + " (Tribune and Herald-Examiner, May 25, 1920)",
    excerpt: "NEW RACE WAR WRECKS PORCH OF NEGROES' CLUB. THE CLUB IS COMPOSED OF 600 COLORED PERSONS",
    note: "The Herald-Examiner headline of the same day read \"NEGRO CLUB IS BOMBED. SOME BLAME POLITICS\". No address given in the text.",
  },
  {
    id: "b-binga-home-1920-06-18", date: "1920-06-18", dateApproximate: false,
    address: "5922 South Park Ave", loc: { street: "SOUTH PARK", house: 5922 },
    target: "Jesse Binga residence (front of house nearly demolished)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["WASHINGTON PARK"],
    damageUsd: 4000, locator: CH4T,
    excerpt: "A police guard was still watching the house on the night of June 18, 1920 when the bombing car appeared again.",
    note: "\"The explosion that followed almost demolished the front of the house and smashed windows throughout the block. This last explosion damaged the home to the extent of $4,000.\" Binga then offered a $1,000 reward. The press chapter calls this the fifth bombing directed against Mr. Binga; three papers quoted him as saying \"This is the limit; I am going\", words he denied. His actual statement: \"I will not run. The race is at stake and not myself.\"",
  },
  {
    id: "b-binga-home-1920-11-23", date: "1920-11-23", dateApproximate: false,
    address: "5922 South Park Ave", loc: { street: "SOUTH PARK", house: 5922 },
    target: "Jesse Binga residence (sixth attack on Binga counted by the commission)", targetType: "banker",
    precision: "address", sourceType: "commission-narrative", expectCA: ["WASHINGTON PARK"],
    locator: CH4T,
    excerpt: "On November 23 Binga was bombed again. This time the bomb damaged his neighbors more seriously than it did Binga's property.",
    note: "Year 1920 from the narrative sequence (paragraph follows the June 18, 1920 attack).",
  },
  {
    id: "b-indiana-3365-child-killed", date: "1919-05-01", dateApproximate: false,
    address: "3365 Indiana Ave (press chapter: 3401 Indiana Ave)", loc: { street: "INDIANA", house: 3365 },
    target: "building occupied by Black residents; a six-year-old child killed", targetType: "Black tenants/residence",
    precision: "block", sourceType: "illustration-caption", expectCA: ["DOUGLAS"],
    deaths: 1, locator: CH4 + ", illustration caption \"Damage Done by a Bomb\"",
    excerpt: "This bomb was thrown into a building at 3365 Indiana Avenue, occupied by Negroes. A six-year-old Negro child was killed.",
    excerpt2: "except in the case of a bombing at 3401 Indiana Avenue, where a child was killed May 1, 1919. The _Chicago Tribune_ spoke of this death as an incident of that bombing.",
    note: "The commission's illustration caption places the fatal bombing at 3365 Indiana Ave; its press chapter dates it May 1, 1919 and gives 3401 Indiana Ave, one block north. Treated as one event, plotted at the caption address with block precision because of the address conflict. One of the two deaths in the aggregate; the second death is not individually identified anywhere in the text.",
  },
  {
    id: "b-apartment-1921-02", date: "1921-02", dateApproximate: true,
    address: null, loc: null,
    target: "three-story apartment building (dynamite race bomb, menace to life)", targetType: "unknown",
    precision: "none", sourceType: "press-quoted", expectCA: null,
    locator: CHX + " (Tribune, February 11, 1921)",
    excerpt: "At the bottom of the adjoining column were four inches devoted to a dynamite race bomb which damaged a three-story apartment and involved menace to life.",
    note: "The commission contrasts the four inches given this bombing with seventeen front-page inches for theater \"odor bombs\" the same day. No address given. The latest individually documented bombing in the survey period, which closes March 1, 1921.",
  },
];

// Pre-1919 located clusters, from one aggregate passage (all before 1919; the survey
// period opens July 1, 1917).
const CLUSTER_EXCERPT_BERKELEY = "Four of these were directed at properties merely held by Negro real estate men as agents, two of them in Berkeley Avenue just north of Forty-third Street, and near the lake.";
const CLUSTER_EXCERPT_REST = "Five were in the 4500 block on Vincennes Avenue, two at 4200 Wabash Avenue, and one at 4732 Indiana Avenue.";
const CLUSTER_DATE_NOTE = "No individual date given; the passage covers bombings before 1919, and the survey period opens July 1, 1917.";

function clusterRows() {
  const rows = [];
  for (let i = 1; i <= 2; i++) {
    rows.push({
      id: `b-berkeley-43rd-pre1919-${i}`, date: null, dateApproximate: true,
      address: "Berkeley Ave just north of 43rd St", loc: { street: "BERKELEY", house: 4270 },
      target: "property held by Black real estate agents", targetType: "realtor/agent",
      precision: "block", sourceType: "aggregate-cluster", expectCA: ["OAKLAND", "KENWOOD"],
      locator: CH4, excerpt: CLUSTER_EXCERPT_BERKELEY,
      note: `Bombing ${i} of 2 at this location. ${CLUSTER_DATE_NOTE} Plotted mid-block at about 4270 S using the exhibit spec's Berkeley Ave longitude anchor.`,
    });
  }
  // One of the five 4500-block Vincennes bombings is individually identified by a press
  // report the commission quotes in full (Herald-Examiner, May 25, 1918).
  rows.push({
    id: "b-vincennes-4529-1918-05-25", date: "1918-05-25", dateApproximate: true,
    address: "4529 Vincennes Ave", loc: { street: "VINCENNES", house: 4529 },
    target: "building occupied by Black families (front porch wrecked)", targetType: "Black tenants/residence",
    precision: "address", sourceType: "press-quoted", expectCA: ["GRAND BOULEVARD"],
    locator: CHX + " (Herald-Examiner, May 25, 1918)",
    excerpt: "A bomb exploded in the front of 4529 Vincennes Avenue early this morning, wrecked the front porch of the structure and broke windows for a block around. The building is occupied by Negro families. White residents objected to the Negroes.",
    note: "\"Early this morning\" relative to the May 25, 1918 paper. Counted as one of the five pre-1919 bombings in the 4500 block of Vincennes Ave reported in ch. IV; the remaining four are carried as block-precision rows.",
  });
  for (let i = 1; i <= 4; i++) {
    rows.push({
      id: `b-vincennes-4500blk-pre1919-${i}`, date: null, dateApproximate: true,
      address: "4500 block Vincennes Ave", loc: { street: "VINCENNES", house: 4550 },
      target: "buildings in the 4500 block of Vincennes Ave", targetType: "Black tenants/residence",
      precision: "block", sourceType: "aggregate-cluster", expectCA: ["GRAND BOULEVARD"],
      locator: CH4, excerpt: CLUSTER_EXCERPT_REST,
      note: `Bombing ${i} of the remaining 4 of 5 in this block (the fifth is individually identified at 4529 Vincennes, May 1918). ${CLUSTER_DATE_NOTE} The text adds: "The four explosions in the 4500 block on Vincennes Avenue appear to have been deliberately aimed at the tenants. This block is at the center of the neighborhood most actively opposed to the coming in of Negroes." (The passage says five in one sentence and four in the next; both kept.)`,
    });
  }
  for (let i = 1; i <= 2; i++) {
    rows.push({
      id: `b-wabash-4200-pre1919-${i}`, date: null, dateApproximate: true,
      address: "4200 Wabash Ave", loc: { street: "WABASH", house: 4200 },
      target: "property at 4200 Wabash Ave", targetType: "unknown",
      precision: "address", sourceType: "aggregate-cluster", expectCA: ["GRAND BOULEVARD"],
      locator: CH4, excerpt: CLUSTER_EXCERPT_REST,
      note: `Bombing ${i} of 2 at this address. ${CLUSTER_DATE_NOTE}`,
    });
  }
  rows.push({
    id: "b-indiana-4732-pre1919", date: null, dateApproximate: true,
    address: "4732 Indiana Ave", loc: { street: "INDIANA", house: 4732 },
    target: "property at 4732 Indiana Ave", targetType: "unknown",
    precision: "address", sourceType: "aggregate-cluster", expectCA: ["GRAND BOULEVARD"],
    locator: CH4, excerpt: CLUSTER_EXCERPT_REST,
    note: `${CLUSTER_DATE_NOTE} Distinct from the April 1919 bombing of the Wimes & Lassiter office at 4722 Indiana Ave; the two addresses are one lot apart in the text and both are kept as written.`,
  });
  return rows;
}

// Chronological-ish ordering for output: dated rows by date, undated cluster rows first
// (they are the earliest, pre-1919), caption row last among undated.
function orderIncidents(rows) {
  const undatedFirst = rows.filter((r) => !r.date && r.sourceType === "aggregate-cluster");
  const dated = rows.filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const undatedLast = rows.filter((r) => !r.date && r.sourceType !== "aggregate-cluster");
  return [...undatedFirst, ...dated, ...undatedLast];
}

// ---------------------------------------------------------------------------
// 3. Geometry helpers (deterministic; calibrated from data/geo/ca.geojson)
// ---------------------------------------------------------------------------

function featureRings(geom) {
  if (!geom) return [];
  if (geom.type === "Polygon") return geom.coordinates;
  if (geom.type === "MultiPolygon") return geom.coordinates.flat();
  return [];
}

function pointInRings(lng, lat, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function metersBetween(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const mLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const x = dLng * Math.cos(mLat), y = dLat;
  return Math.sqrt(x * x + y * y) * R;
}

function buildGrid(caGeo) {
  const feat = (name) => caGeo.features.find((f) => f.properties.community === name);
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const edges = (name) => {
    const pts = featureRings(feat(name).geometry).flat();
    const lats = pts.map((p) => p[1]), lngs = pts.map((p) => p[0]);
    const maxLat = Math.max(...lats), minLat = Math.min(...lats);
    const minLng = Math.min(...lngs);
    return {
      north: median(lats.filter((v) => v > maxLat - 0.0004)),
      south: median(lats.filter((v) => v < minLat + 0.0004)),
      west: median(lngs.filter((v) => v < minLng + 0.0006)),
      east: median(lngs.filter((v) => v > Math.max(...lngs) - 0.0006)),
    };
  };

  const gb = edges("GRAND BOULEVARD"); // N edge = 39th (3900 S), S edge = 51st (5100 S), E edge = Cottage Grove
  const kw = edges("KENWOOD");         // W edge = Cottage Grove (39th-51st side)
  const hp = edges("HYDE PARK");       // W edge = Cottage Grove south of 51st
  const oak = edges("OAKLAND");        // N edge = 35th (3500 S) cross-check

  const latPerUnit = (gb.north - gb.south) / (5100 - 3900);
  const latAt = (units) => gb.north - (units - 3900) * latPerUnit;
  const degPerMileLat = latPerUnit * 800;
  const degPerMileLng = degPerMileLat / Math.cos((41.795 * Math.PI) / 180);
  const cgNorth = (gb.east + kw.west) / 2; // Cottage Grove, 39th-51st stretch
  const cgSouth = hp.west;                 // Cottage Grove, south of 51st
  const lngAt = (eastUnits, southUnits) => {
    const anchor = southUnits > 5100 ? cgSouth : cgNorth;
    return anchor + ((eastUnits - 800) / 800) * degPerMileLng;
  };

  console.log("[grid] calibration from data/geo/ca.geojson");
  console.log(`[grid]   39th St lat ${gb.north.toFixed(5)}  51st St lat ${gb.south.toFixed(5)}  => ${degPerMileLat.toFixed(6)} deg lat/mile (theory 0.014483)`);
  console.log(`[grid]   Cottage Grove lng ${cgNorth.toFixed(5)} (39th-51st), ${cgSouth.toFixed(5)} (south of 51st)`);
  console.log(`[grid]   deg lng/mile ${degPerMileLng.toFixed(6)}`);
  console.log(`[grid]   cross-check 43rd (Kenwood N): grid ${latAt(4300).toFixed(5)} vs measured ${kw.north.toFixed(5)} (${Math.round(Math.abs(latAt(4300) - kw.north) * 111130)} m)`);
  console.log(`[grid]   cross-check 60th (Hyde Park S): grid ${latAt(6000).toFixed(5)} vs measured ${hp.south.toFixed(5)} (${Math.round(Math.abs(latAt(6000) - hp.south) * 111130)} m)`);
  console.log(`[grid]   cross-check 35th (Oakland N): grid ${latAt(3500).toFixed(5)} vs measured ${oak.north.toFixed(5)} (${Math.round(Math.abs(latAt(3500) - oak.north) * 111130)} m)`);

  return { latAt, lngAt, degPerMileLng };
}

function geocode(incident, grid) {
  const { loc } = incident;
  if (!loc) return null;
  let lat, lng, method;
  if (loc.ew != null) {
    lat = grid.latAt(loc.south);
    lng = grid.lngAt(loc.ew, loc.south);
    method = "street-grid";
  } else {
    const st = STREETS[loc.street];
    if (!st) throw new Error(`unknown street ${loc.street} on ${incident.id}`);
    lat = grid.latAt(loc.house);
    if (st.anchorLng != null) {
      lng = st.anchorLng;
      method = "street-grid+anchor";
    } else {
      lng = grid.lngAt(st.east, loc.house);
      method = "street-grid";
    }
  }
  return {
    lat: +lat.toFixed(5),
    lng: +lng.toFixed(5),
    frame: null,
    method,
    precisionMeters: incident.precision === "address" ? 120 : 250,
  };
}

// ---------------------------------------------------------------------------
// 4. Optional citywide-frame projection (idempotent; another script owns the file)
// ---------------------------------------------------------------------------

function loadCitywideFrame() {
  if (!fs.existsSync(FRAMES_PATH)) return { frame: null, note: "public/exhibit-data/holc-frames.json not present at run time; frame coords left null. Re-run this script after it exists to fill them." };
  try {
    const j = JSON.parse(fs.readFileSync(FRAMES_PATH, "utf8"));
    const candidates = [];
    const push = (obj, name) => { if (obj && typeof obj === "object") candidates.push({ obj, name }); };
    push(j.citywide, "citywide");
    if (j.frames && !Array.isArray(j.frames)) push(j.frames.citywide, "frames.citywide");
    const arrays = [Array.isArray(j) ? j : null, Array.isArray(j.frames) ? j.frames : null].filter(Boolean);
    for (const arr of arrays) {
      const hit = arr.find((f) => /citywide/i.test(f.id || f.name || f.key || ""));
      if (hit) push(hit, "frames[citywide]");
    }
    for (const { obj } of candidates) {
      const zoom = obj.zoom ?? obj.z;
      const lat = obj.centerLat ?? obj.center?.lat ?? (Array.isArray(obj.center) ? obj.center[0] : undefined);
      const lng = obj.centerLng ?? obj.center?.lng ?? (Array.isArray(obj.center) ? obj.center[1] : undefined);
      const width = obj.width ?? (Array.isArray(obj.size) ? obj.size[0] : undefined);
      const height = obj.height ?? (Array.isArray(obj.size) ? obj.size[1] : undefined);
      if ([zoom, lat, lng, width, height].every((v) => typeof v === "number" && isFinite(v))) {
        return { frame: { zoom, centerLat: lat, centerLng: lng, width, height }, note: null };
      }
    }
    return { frame: null, note: "holc-frames.json exists but no parseable citywide frame (need zoom + center + size); frame coords left null." };
  } catch (err) {
    return { frame: null, note: `holc-frames.json unreadable (${err.message}); frame coords left null.` };
  }
}

function projectToFrame(lat, lng, frame) {
  const n = 256 * 2 ** frame.zoom;
  const wx = (l) => ((l + 180) / 360) * n;
  const wy = (la) => {
    const r = (la * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  };
  const ox = wx(frame.centerLng) - frame.width / 2;
  const oy = wy(frame.centerLat) - frame.height / 2;
  return { x: +(wx(lng) - ox).toFixed(1), y: +(wy(lat) - oy).toFixed(1) };
}

// ---------------------------------------------------------------------------
// 5. Working-notes extract (verbatim passages, located at run time)
// ---------------------------------------------------------------------------

const PASSAGES = [
  { title: "Aggregate paragraphs (ch. IV, sec. III \"Bombings\")", start: "III. BOMBINGS", end: "1. TYPICAL BOMBINGS" },
  { title: "Typical bombings narratives (Motley, Fox, Binga, Woodfolk, Clarke, Hubbard, Harrison) and the 3365 Indiana Ave caption", start: "1. TYPICAL BOMBINGS", end: "2. REACTION OF WHITES IN HYDE PARK" },
  { title: "Reaction of whites (Hyers denial; Property Owners' Association resolution)", start: "2. REACTION OF WHITES IN HYDE PARK", end: "3. REACTION OF NEGROES" },
  { title: "Reaction of Negroes (Clarke four times, Binga six times, forty families, twenty-one homes, four-fifths passage)", start: "3. REACTION OF NEGROES", end: "4. OTHER MEANS EMPLOYED TO KEEP OUT NEGROES" },
  { title: "Chapter I background (twenty-four bombs before the riot)", start: "movement, as described in another section of this report", end: "A third phase of the situation" },
  { title: "Press analysis, ch. X \"Bombing publicity\" (forty-five bombings, headlines, 4212 Ellis, 4722 Indiana, 423 E 48th Place, 4529 Vincennes, the fatal 3401 Indiana bombing, the 1921 apartment bombing)", start: "_Bombing publicity._", end: "_The Abyssinian affair._" },
];

function buildExtract(raw) {
  const lines = raw.split("\n");
  const findLine = (needle, from = 0) => {
    for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return i;
    return -1;
  };
  let md = `# CCRR "The Negro in Chicago" (1922). Bombings working extract\n\n`;
  md += `Source cache: data/exhibit-src/ccrr-negro-in-chicago.txt (Project Gutenberg #57343, public domain).\n`;
  md += `Generated by scripts/exhibit-prep-bombings.mjs. Line numbers refer to the cached file.\n\n`;
  md += `All passages below are verbatim slices of the cached text.\n\n`;
  for (const p of PASSAGES) {
    const s = findLine(p.start);
    const e = s >= 0 ? findLine(p.end, s + 1) : -1;
    if (s < 0 || e < 0) {
      md += `## ${p.title}\n\n(NOT FOUND. start="${p.start}" end="${p.end}")\n\n`;
      continue;
    }
    md += `## ${p.title}\n\nLines ${s + 1}-${e} of the cached file.\n\n`;
    md += "```text\n" + lines.slice(s, e).join("\n").replace(/```/g, "`​``") + "\n```\n\n";
  }
  return md;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  await ensureText();
  const raw = fs.readFileSync(TEXT_PATH, "utf8").replace(/\r\n/g, "\n");

  // -- verify every excerpt against the text ------------------------------------
  const allRows = orderIncidents([...INCIDENTS, ...clusterRows()]);
  const failures = [];
  for (const row of allRows) {
    const hit = locate(raw, row.excerpt);
    if (!hit) failures.push(row.id);
    else row._lines = hit;
    if (row.excerpt.length > 320) failures.push(`${row.id} (excerpt ${row.excerpt.length} chars > 320)`);
    if (row.excerpt2 && !locate(raw, row.excerpt2)) failures.push(`${row.id} (excerpt2)`);
  }
  for (const [k, v] of Object.entries(AGG)) {
    if (!locate(raw, v)) failures.push(`aggregate:${k}`);
  }
  for (const p of PROGRESSION) if (!locate(raw, p.excerpt)) failures.push(`progression:${p.asOf}`);
  for (const q of CONTEXT_QUOTES) if (!locate(raw, q.excerpt)) failures.push(`context:${q.key}`);
  if (failures.length) {
    console.error("[verify] EXCERPTS NOT FOUND IN TEXT:\n  " + failures.join("\n  "));
    process.exit(1);
  }
  console.log(`[verify] all ${allRows.length} incident excerpts + ${Object.keys(AGG).length} aggregate + ${PROGRESSION.length} progression + ${CONTEXT_QUOTES.length} context quotes found verbatim in the cached text`);

  // -- extract working notes ------------------------------------------------------
  fs.writeFileSync(EXTRACT_PATH, buildExtract(raw));
  console.log(`[extract] wrote ${path.relative(ROOT, EXTRACT_PATH)} (${(fs.statSync(EXTRACT_PATH).size / 1024).toFixed(1)} KB)`);

  // -- geocode + validate ----------------------------------------------------------
  const caGeo = JSON.parse(fs.readFileSync(CA_PATH, "utf8"));
  const grid = buildGrid(caGeo);
  const caFeatures = caGeo.features.map((f) => ({
    name: f.properties.community,
    rings: featureRings(f.geometry),
  }));
  const communityOf = (lng, lat) => {
    const hit = caFeatures.find((f) => pointInRings(lng, lat, f.rings));
    return hit ? hit.name : null;
  };

  // Reference check: the Binga house still stands at 5922 S King Dr (former South Park
  // Ave). NRHP/Chicago-landmark coordinate 41 47' 14" N, 87 36' 57" W = 41.78722,
  // -87.61583. (The exhibit spec's rough anchor lat 41.7846 corresponds to about
  // 6040 S on the measured grid, some 250 m south of the extant house; the spec's
  // longitude -87.6158 matches. Both distances are reported.)
  const BINGA_TRUE = { lat: 41.78722, lng: -87.61583 };
  const BINGA_SPEC = { lat: 41.7846, lng: -87.6158 };

  const table = [];
  let pass = 0, fail = 0, nulls = 0;
  for (const row of allRows) {
    const geo = geocode(row, grid);
    if (!geo) {
      row.geo = null;
      nulls++;
      table.push({ id: row.id, address: row.address || "(none)", result: "geo:null (no address in text)", ca: "-" });
      continue;
    }
    const ca = communityOf(geo.lng, geo.lat);
    const ok = row.expectCA && ca && row.expectCA.includes(ca);
    if (ok) {
      row.geo = geo;
      pass++;
      table.push({ id: row.id, address: row.address, result: `PASS (${geo.lat}, ${geo.lng})`, ca: `${ca} (expected ${row.expectCA.join("|")})` });
    } else {
      row.geo = null;
      fail++;
      table.push({ id: row.id, address: row.address, result: `FAIL -> geo:null (${geo.lat}, ${geo.lng})`, ca: `${ca || "outside all CAs"} (expected ${row.expectCA ? row.expectCA.join("|") : "?"})` });
    }
  }

  const bingaRow = allRows.find((r) => r.id === "b-binga-home-1920-06-18");
  if (bingaRow && bingaRow.geo) {
    const dTrue = metersBetween(bingaRow.geo, BINGA_TRUE);
    const dSpec = metersBetween(bingaRow.geo, BINGA_SPEC);
    console.log(`[binga] computed (${bingaRow.geo.lat}, ${bingaRow.geo.lng})`);
    console.log(`[binga]   vs extant landmark 41.78722,-87.61583: ${dTrue.toFixed(0)} m (must be <150 m) ${dTrue < 150 ? "OK" : "FAIL"}`);
    console.log(`[binga]   vs exhibit-spec anchor 41.7846,-87.6158: ${dSpec.toFixed(0)} m (spec lat sits ~250 m south of the extant house; lng matches)`);
    if (dTrue >= 150) {
      console.error("[binga] validation failed; nulling all street-grid points would be required. Aborting instead so the calibration can be inspected.");
      process.exit(1);
    }
  }

  console.log("\n[geocode] validation table");
  const wId = Math.max(...table.map((t) => t.id.length));
  const wAddr = Math.max(...table.map((t) => t.address.length));
  for (const t of table) {
    console.log(`  ${t.id.padEnd(wId)}  ${t.address.padEnd(wAddr)}  ${t.result}  ${t.ca}`);
  }
  console.log(`[geocode] ${pass} geocoded+validated, ${fail} failed validation (geo nulled), ${nulls} without addresses (geo null)`);

  // -- optional citywide frame ------------------------------------------------------
  const { frame: cityFrame, note: frameNote } = loadCitywideFrame();
  if (cityFrame) {
    let n = 0;
    for (const row of allRows) {
      if (row.geo) { row.geo.frame = projectToFrame(row.geo.lat, row.geo.lng, cityFrame); n++; }
    }
    console.log(`[frame] projected ${n} points into citywide frame (zoom ${cityFrame.zoom}, ${cityFrame.width}x${cityFrame.height})`);
  } else {
    console.log(`[frame] ${frameNote}`);
  }

  // -- assemble output ---------------------------------------------------------------
  const locateLines = (excerpt) => {
    const hit = locate(raw, excerpt);
    return hit ? `cached-file lines ${hit.lineStart}-${hit.lineEnd}` : "";
  };

  const out = {
    source: {
      title: "The Negro in Chicago",
      author: "Chicago Commission on Race Relations",
      year: 1922,
      url: "https://archive.org/details/negroinchicagost00chic",
      gutenberg: "https://www.gutenberg.org/ebooks/57343",
      publicDomain: true,
      cachedText: "data/exhibit-src/ccrr-negro-in-chicago.txt",
      excerptNote: "All excerpts are verbatim from the Gutenberg plain text with line-wrap whitespace collapsed. The generator re-verifies every excerpt against the cached text on each run.",
    },
    aggregates: {
      total: 58,
      periodStart: "1917-07-01",
      periodEnd: "1921-03-01",
      insideSquare: 32,
      square: { north: "41st St", south: "60th St", east: "Cottage Grove Ave", west: "State St" },
      deaths: 2,
      damageUsd1921: 100000,
      arrests: 2,
      convictions: 0,
      excerpt: AGG.main,
      squareExcerpt: AGG.square,
      enforcementExcerpt: AGG.enforcement,
      convictionsExcerpts: [AGG.noTrial, AGG.twoArrestsOnly],
      damageNote: "The text says damage amounted to more than $100,000; the figure is a floor, in 1921 dollars.",
      deathsNote: "Both persons killed were Black. One death is individually documented: a six-year-old child, per the illustration caption at 3365 Indiana Ave; the press chapter dates the fatal bombing May 1, 1919 and gives the address as 3401 Indiana Ave. Caption and press passage are treated as one event. The second death is not individually identified in the text.",
      progression: PROGRESSION.map((p) => ({ ...p, lines: locateLines(p.excerpt) })),
      contextQuotes: CONTEXT_QUOTES.map((q) => ({ ...q, lines: locateLines(q.excerpt) })),
    },
    methods: {
      geocoding: "Deterministic street-grid method, no live geocoding services. Latitude from the south address number (800 units per mile south of 31st St), calibrated against the measured 39th St and 51st St edges of the Grand Boulevard community area in data/geo/ca.geojson. Longitude from a hand-built table of nominal grid units east of State St for the named north-south streets, anchored on the measured Cottage Grove Ave (800 E) community-area edge, at the measured degrees-per-mile scaled by cos(latitude). Vincennes Ave (diagonal) and Berkeley Ave (short irregular street) use fixed longitude anchors from the exhibit spec instead. Every point is stamped with its method and precisionMeters (address 120 m, block 250 m), validated by point-in-polygon against the community areas, and cross-checked against the extant Binga house at 5922 S King Dr. Points failing validation carry geo null.",
      incidentSelection: "One row per bombing that the 1922 text documents individually (commission narrative, quoted dated press item with a specific target, located pre-1919 cluster counts, or the captioned fatal bombing). Aggregate mentions without location or identifiable target (for example \"eight bombings in eight weeks\" or undated two-blast headlines) are not turned into rows, to avoid double counting; they are kept in aggregates and the extract notes. The 58-bombing total therefore exceeds the incident rows below by design.",
      targetTypeValues: ["Black homeowner", "Black tenants/residence", "Black-owned business", "Black organization/club", "realtor/agent", "banker", "unknown"],
      dateFormat: "date is YYYY-MM-DD or YYYY-MM where the text supports it, null where the text gives none. dateApproximate true marks month-precision dates, dates computed from day-offset phrases, or press \"last night\" datelines.",
    },
    citywideFrame: cityFrame || null,
    citywideFrameNote: frameNote,
    incidents: allRows.map((r) => ({
      id: r.id,
      date: r.date,
      dateApproximate: r.dateApproximate,
      address: r.address,
      target: r.target,
      targetType: r.targetType,
      precision: r.precision,
      sourceType: r.sourceType,
      ...(r.deaths ? { deaths: r.deaths } : {}),
      ...(r.damageUsd ? { damageUsd: r.damageUsd } : {}),
      ...(r.motiveDisputed ? { motiveDisputed: true } : {}),
      excerpt: r.excerpt,
      ...(r.excerpt2 ? { excerpt2: r.excerpt2 } : {}),
      locator: `${r.locator} (cached-file lines ${r._lines.lineStart}-${r._lines.lineEnd})`,
      note: r.note,
      geo: r.geo,
    })),
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  const kb = (fs.statSync(OUT_PATH).size / 1024).toFixed(1);
  console.log(`\n[out] wrote ${path.relative(ROOT, OUT_PATH)} (${kb} KB)`);

  const byPrecision = {};
  const bySource = {};
  for (const r of out.incidents) {
    byPrecision[r.precision] = (byPrecision[r.precision] || 0) + 1;
    bySource[r.sourceType] = (bySource[r.sourceType] || 0) + 1;
  }
  console.log(`[out] incidents: ${out.incidents.length}  by precision: ${JSON.stringify(byPrecision)}  by source: ${JSON.stringify(bySource)}`);
  console.log(`[out] geocoded: ${out.incidents.filter((r) => r.geo).length}  geo null: ${out.incidents.filter((r) => !r.geo).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
