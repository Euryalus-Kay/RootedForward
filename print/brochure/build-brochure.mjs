/* ------------------------------------------------------------------ */
/*  Rooted Forward tri-fold brochure, US Letter, letter fold.          */
/*                                                                     */
/*  The piece that sits on the table at the Obama Presidential Center  */
/*  and at neighborhood markets next to the banner. It is about the    */
/*  whole organization, not one tour. Who we are on the front, how it  */
/*  started and who runs it on the first panel a reader opens, the     */
/*  six things we do on the inside, and how to reach us on the back.   */
/*                                                                     */
/*  The first proof gave two inside panels to a map of Walk Hyde Park  */
/*  with a numbered key. The owner asked for a more general piece      */
/*  (October 2026), since the work is spreading to Rogers Park and to  */
/*  other cities, so Hyde Park is now one small picture beside the     */
/*  paragraph about tours. He also asked for the podcast to come off.  */
/*  The earlier layout is at commit fd7a1e3.                           */
/*                                                                     */
/*  A flat sheet is 11 x 8.5 inches, printed both sides and folded     */
/*  twice. The panel that tucks inside is 1/16 inch narrower than the  */
/*  other two so it lies flat, which puts the folds here:              */
/*                                                                     */
/*    OUTSIDE   | flap 3.625 | back 3.6875 | cover 3.6875 |            */
/*    INSIDE    | A 3.6875   | B 3.6875    | C 3.625      |            */
/*                                                                     */
/*  Nothing crosses a fold, and every block of type and every picture  */
/*  keeps 0.35 inch from each fold and each trimmed edge, so a shop    */
/*  that folds in equal thirds instead (3.667) still clears it.        */
/*                                                                     */
/*  Most of the copy is the site's own, lifted from                    */
/*  src/app/about/page.tsx and src/lib/look-closer.ts, and the build   */
/*  stops if any of those sentences has since changed there. The few   */
/*  lines that are the owner's and not yet on the site are marked.     */
/*                                                                     */
/*  Every picture is real. The portraits are the roster from           */
/*  src/lib/team-constants.ts, the plaza is a CC0 photograph the tour  */
/*  already uses, and the museum photograph is ours. No stock.         */
/*                                                                     */
/*  The QR code encodes rooted-forward.org/go/brochure, our own        */
/*  redirect, so a printed brochure can be re-pointed for as long as   */
/*  the domain is ours (src/lib/qr-links.ts).                          */
/*                                                                     */
/*    npm install --no-save qrcode jsqr                                */
/*    node print/brochure/gen-maps.mjs                                 */
/*    node print/brochure/build-brochure.mjs                           */
/*                                                                     */
/*  Needs poppler and librsvg on PATH (pdftocairo, pdfunite, pdftoppm, */
/*  pdffonts, rsvg-convert).                                           */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import sharp from "sharp";
import jsQR from "jsqr";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const ASSETS = join(HERE, "assets");
const OUT = join(SITE, "print");
const PROOF = join(HERE, "proof");
mkdirSync(PROOF, { recursive: true });

/* ---------- geometry, in inches ---------- */
const W = 11;
const H = 8.5;
const BLEED = 0.125;
const TUCK = 3.625; // the panel that folds in
const FULL = 3.6875; // the other two
const OUT_F1 = TUCK; // outside folds, measured from the left trim edge
const OUT_F2 = TUCK + FULL;
const IN_F1 = FULL; // inside folds
const IN_F2 = FULL * 2;
const M = 0.35; // type stays this far from every fold and trim edge
const TOP = 0.5;
const BOTTOM = 0.42;

/* The inside is three columns, one to a panel. A picture, its credit,
   then two of the six things we do. */
const COLS = [
  { left: M, width: FULL - M * 2 },
  { left: IN_F1 + M, width: FULL - M * 2 },
  { left: IN_F2 + M, width: W - IN_F2 - M * 2 },
];
const PIC_TOP = 1.14;
const PIC_H = 2.65;
const CAP_TOP = PIC_TOP + PIC_H + 0.06;
const ROWS_TOP = 4.2;

/* ---------- palette (site tokens) ---------- */
const CREAM = "#F5F0E8";
const FOREST = "#1B3A2D";
const INK = "#1A1A1A";
const RUST = "#C45D3E";
const BORDER = "#DDD6C8";

/* Opacity is mixed down to a solid here, so "ink at 78 percent" is one
   flat color in the file and there is no transparency for a press to
   flatten. */
function mix(a, b, t) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [A, B] = [h(a), h(b)];
  return "#" + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
}
const BODY = mix(INK, CREAM, 0.8);
const CREDIT = mix(INK, CREAM, 0.64);
const ON_FOREST = mix(CREAM, FOREST, 0.82);
const ON_FOREST_SOFT = mix(CREAM, FOREST, 0.62);

/* ---------- fonts ---------- */
/* The site's own files, kept in print/fonts. See build-banner.mjs. */
const b64 = (p) => readFileSync(join(SITE, p)).toString("base64");
const SERIF = b64("print/fonts/source-serif-4-latin-var.woff2");
const SANS = b64("print/fonts/dm-sans-latin-var.woff2");

/* ------------------------------------------------------------------ */
/*  Copy. `said` checks that a sentence is still on the site.          */
/* ------------------------------------------------------------------ */

const sources = {
  about: readFileSync(join(SITE, "src/app/about/page.tsx"), "utf8"),
  museum: readFileSync(join(SITE, "src/lib/look-closer.ts"), "utf8"),
  tour: readFileSync(join(SITE, "src/lib/tours/hyde-park-walk.ts"), "utf8"),
  appStore: readFileSync(join(SITE, "src/lib/app-store.ts"), "utf8"),
  team: readFileSync(join(SITE, "src/lib/team-constants.ts"), "utf8"),
};
/* JSX wraps lines and writes apostrophes as entities, so both sides
   are flattened before comparing. */
const flat = (s) =>
  s.replace(/&rsquo;|\\u2019|’/g, "'").replace(/\\u201[cd]|[“”]/g, '"').replace(/\s+/g, " ");
const flatSources = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, flat(v)]));
function said(where, text) {
  if (!flatSources[where].includes(flat(text))) {
    throw new Error(`The site no longer says this (${where}):\n  ${text}\nUpdate the brochure to match before printing.`);
  }
  return text.replace(/'/g, "’");
}

const MISSION_WHO = said("about", "A student-run nonprofit started in Chicago.");
/* Owner's change for this piece (October 2026). The site's sentence
   opens "educates people about", and he found that it talks down to
   the reader, so here it is "raises awareness of". "Awareness" then
   comes out of the list at the end, where it would be said twice. The
   site still carries the older wording, so this line is not checked
   against it. */
said("about", "racial inequality in cities across the United States, and works to address it through");
const MISSION_WHAT = "Rooted Forward raises awareness of racial inequality in cities across the United States, and works to address it through education and political advocacy.";

const STORY = [
  said("about", "Rooted Forward was started by Zain Zaidi, a student who lives on the Near South Side and goes to school in Hyde Park. Going between the two every day, he kept running into the bubble around the University of Chicago, and how completely the city changed from one block to the next."),
  said("about", "He went looking for why, and found redlining, restrictive covenants, and the urban renewal campaigns that cleared and rearranged these blocks on purpose."),
  said("about", "He ran a survey at the Obama Presidential Center and talked with more than 140 people about what they had lived through and what they had been taught. The gap was far wider than he expected, including among lifelong Chicagoans and especially among young people."),
  said("about", "So he built this. Students in three cities do the archival work and run the outreach now, and what comes out of it gets published free."),
];

/* Owner's wording (October 2026). No status beside each city, and no
   "research in progress". We are active in all three. The survey count
   stays in the story above and is not pulled out into a box.
   Non-breaking spaces keep "New York" and "Washington, DC" whole when
   the line turns. */
const ACTIVE = "We are active in Chicago, New York, and Washington, DC.";
const TEAM_CAPTION = "The students who run Rooted Forward.";

/* Heroicons outline, the set the home page draws from. The first
   three are the home page's own. The cap, the building and the pin
   are the same family, for the things the home page does not list. */
const ICONS = {
  map: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z",
  clipboard: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z",
  scale: "M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z",
  school: "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5",
  museum: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z",
  pin: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
};

/* What the brochure promises about the tour has to be true. */
if (!/APP_STORE_URL: string \| null =\s*"https:\/\/apps\.apple\.com/.test(sources.appStore)) {
  throw new Error("The app is no longer marked live in src/lib/app-store.ts. The brochure says the tour is out.");
}
said("tour", 'title: "Walk Hyde Park"');
said("museum", "a 1931 illustrated map of Chicago");
said("museum", "Chicago Maritime Museum");
said("museum", "Now on view");

/* Six things, two to a panel, read across. The ones with a `said`
   are the About page's own sentences. The podcast is on the site but
   not here, at the owner's request (October 2026).

   Three facts are the owner's and are not on the site yet (October
   2026): that Rogers Park is next, that we present to schools, and
   that we have presented at Hyde Park Academy. He also said it was
   fine to write as though the expansion were already done. These say
   what is true today instead, since the app shows one tour to anybody
   who checks. */
const WORK = [
  [
    ["map", said("about", "Self-guided walking tours"), `${said("about", "Students research one neighborhood at a time and build a tour out of what they find. It lives on the Rooted Forward app, free to walk or to read at home.")} Walk Hyde Park is out now.`],
    ["school", "School presentations", "We present what we find to schools. We have presented at Hyde Park Academy."],
  ],
  [
    ["clipboard", said("about", "Community outreach"), said("about", "We set up where people already are, like the Obama Presidential Center and neighborhood markets, and we survey and interview residents about their own block.")],
    ["scale", said("about", "Policy advocacy"), said("about", "We run petitions on Chicago bills that are already introduced and stuck in a committee, then hand the signatures to that committee.")],
  ],
  [
    ["museum", "A museum exhibit", "With the Chicago Maritime Museum, we made an exhibit on the history behind a 1931 illustrated map of Chicago. It is on view at the museum in Bridgeport."],
    ["pin", "New neighborhoods and cities", "Rogers Park is next. Our students in New York and Washington, DC are building tours of their own cities."],
  ],
];

/* Under each picture, what is pictured and whose it is. */
said("tour", "June 19, 2026. Photograph by AlphaBeta135, via Wikimedia Commons. CC0.");
const CAPTIONS = [
  "The route of Walk Hyde Park, the first tour in the app.",
  "The plaza of the Obama Presidential Center on opening day, June 19, 2026. Photograph by AlphaBeta135, via Wikimedia Commons. CC0.",
  said("museum", "The map and its touch screen on the museum's wall in Bridgeport, September 2026. Photograph by Rooted Forward."),
];

const HELP_HEAD = said("about", "We could use your help");
/* The ask, in the owner's terms (October 2026). Partners who can put
   this in front of more people, an offer to supply them with our
   materials, and people for the archival research. The last sentence
   is the About page's. */
const HELP_BODY = [
  "We want to partner with people and organizations who can help us bring this message to more people. If you or your organization would like our materials, we are happy to supply them.",
  `We are also looking for people to help with archival research. ${said("about", "You do not need experience to start.")}`,
];

/* ---------- QR ---------- */
const QR_URL = "https://rooted-forward.org/go/brochure";
const qrSvg = await QRCode.toString(QR_URL, {
  type: "svg",
  errorCorrectionLevel: "Q",
  margin: 0,
  color: { dark: FOREST, light: "#0000" },
});
const qrViewBox = qrSvg.match(/viewBox="([^"]+)"/)[1];
const qrInner = qrSvg
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>/, "")
  .replace(/<rect[^>]*fill="#0000"[^>]*\/>/, "");
const qrModules = Number(qrViewBox.split(" ")[2]);
const QR_IN = 1.3;

/* ---------- the mark ---------- */
/* public/logo.svg exactly as drawn. On the forest panel it gets the
   thin cream ring the banner gives it, since the disc is forest too. */
const logo = readFileSync(join(SITE, "public/logo.svg"), "utf8");
const MARK = logo.replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="mark">');
const MARK_RINGED = MARK.replace("</svg>", `<circle cx="200" cy="200" r="188" fill="none" stroke="${CREAM}" stroke-width="9"/></svg>`);

/* ---------- pictures ---------- */
/* The cover map carries a fade, which is transparency, so it is
   rendered to pixels here with the cream already under it. 600 to the
   inch, which is past what the press resolves. */
const coverMeta = { widthIn: 3.8125, heightIn: 4.7 };
const coverPng = join(ASSETS, "cover-map.png");
execFileSync("rsvg-convert", ["-w", String(Math.round(coverMeta.widthIn * 600)), "-b", CREAM, "-o", coverPng, join(ASSETS, "cover-map.svg")]);
const COVER_MAP = (await sharp(coverPng).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toBuffer()).toString("base64");

/* The route, drawn to sit in the first column's picture box. */
const routeMeta = JSON.parse(readFileSync(join(ASSETS, "route-map.json"), "utf8"));
if (Math.abs(routeMeta.widthIn - COLS[0].width) > 0.002 || Math.abs(routeMeta.heightIn - PIC_H) > 0.002) {
  throw new Error("route-map.svg was drawn for a different picture box. Rerun gen-maps.mjs.");
}
const ROUTE_MAP = readFileSync(join(ASSETS, "route-map.svg"), "utf8").replace(/ width="[\d.]+" height="[\d.]+"/, "");

/* Two photographs, each cropped to its column's box at 400 to the
   inch. `top` is where the crop starts in the original. */
async function photo(file, top, col) {
  const meta = await sharp(join(SITE, file)).metadata();
  const height = Math.round((meta.width * PIC_H) / col.width);
  if (top + height > meta.height) throw new Error(`${file} is not tall enough for a crop starting at ${top}`);
  const buf = await sharp(join(SITE, file))
    .extract({ left: 0, top, width: meta.width, height })
    .resize(Math.round(col.width * 400), Math.round(PIC_H * 400))
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}
/* The plaza and the lower half of the tower, where the people are. */
const PLAZA = await photo("public/media/hyde-park-walk/opc-opening-2026.jpg", 640, COLS[1]);
/* The two people, the touch screen and the map behind them. */
const EXHIBIT = await photo("public/media/look-closer/exhibit-wall.jpg", 160, COLS[2]);

/* The roster, in the order the team page shows it. Real people only,
   which is that file's own rule. Faces without names here, since the
   names and schools are on the site and a printed sheet cannot be
   corrected when the roster changes. */
const members = [...sources.team.matchAll(/\n    slug: "([a-z-]+)",[\s\S]*?\n    photo: "(\/media\/team\/[a-z-]+\.jpg)",/g)].map((m) => {
  const order = m[0].match(/\n    order: (\d+),/);
  return { slug: m[1], photo: m[2], order: order ? +order[1] : 99 };
}).sort((a, b) => a.order - b.order);
if (members.length !== 6) throw new Error(`the brochure lays out six portraits, the roster has ${members.length} with a photo`);
const FACE_IN = 0.7;
const FACES = [];
for (const m of members) {
  const buf = await sharp(join(SITE, "public", m.photo)).resize(Math.round(FACE_IN * 600), Math.round(FACE_IN * 600)).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
  FACES.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
}

/* ------------------------------------------------------------------ */
/*  The sheets                                                         */
/* ------------------------------------------------------------------ */

const inch = (n) => `${+n.toFixed(4)}in`;
const box = (left, width, top = TOP, bottom = BOTTOM) =>
  `left:${inch(left)};width:${inch(width)};top:${inch(top)};height:${inch(H - top - bottom)}`;

const icon = (name) =>
  `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="${RUST}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]}"/></svg></span>`;

const PICS = [
  `<div class="pic map">${ROUTE_MAP}</div>`,
  `<div class="pic"><img alt="" src="${PLAZA}"></div>`,
  `<div class="pic"><img alt="" src="${EXHIBIT}"></div>`,
];
const column = (col, i) => `
    <div class="frame" style="left:${inch(col.left)};width:${inch(col.width)};top:${inch(PIC_TOP)};height:${inch(PIC_H)}">${PICS[i]}</div>
    <p class="credit" style="left:${inch(col.left)};width:${inch(col.width)};top:${inch(CAP_TOP)}">${CAPTIONS[i]}</p>
    <section class="panel rows" data-fit style="${box(col.left, col.width, ROWS_TOP)}">
      ${WORK[i].map(([ic, title, line]) => `<div class="row">${icon(ic)}<div><h3>${title}</h3><p>${line}</p></div></div>`).join("\n      ")}
    </section>`;

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Rooted Forward brochure</title>
<style>
  @font-face { font-family: "RF Serif"; src: url(data:font/woff2;base64,${SERIF}) format("woff2"); font-weight: 200 900; }
  @font-face { font-family: "RF Sans"; src: url(data:font/woff2;base64,${SANS}) format("woff2"); font-weight: 100 1000; }

  @page { size: ${W + BLEED * 2}in ${H + BLEED * 2}in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${CREAM}; }
  body {
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    color: ${INK};
    font-kerning: normal;
    -webkit-font-smoothing: antialiased;
  }

  /* One sheet per page, drawn with its bleed. The trim box inside it is
     the 11 x 8.5 the reader holds, and everything is placed in that. */
  .sheet {
    position: relative;
    width: ${W + BLEED * 2}in;
    height: ${H + BLEED * 2}in;
    overflow: hidden;
    background: ${CREAM};
    break-after: page;
  }
  .sheet:last-of-type { break-after: auto; }
  .trim { position: absolute; left: ${BLEED}in; top: ${BLEED}in; width: ${W}in; height: ${H}in; }
  .trim > * { position: absolute; }
  .panel { display: flex; flex-direction: column; }
  .panel > * { flex: none; }
  .grow { flex: 1 1 auto !important; min-height: 0; }

  /* ---- type ---- */
  h1, h2, h3 { font-family: "RF Serif", Georgia, serif; font-weight: 400; }
  h2 { font-size: 22pt; line-height: 1.08; letter-spacing: -0.014em; color: ${FOREST}; text-wrap: balance; }
  h3 { font-size: 13.5pt; line-height: 1.16; letter-spacing: -0.006em; color: ${INK}; }
  p { font-size: 8.8pt; line-height: 1.5; color: ${BODY}; text-wrap: pretty; }
  .credit { font-size: 6.1pt; line-height: 1.42; color: ${CREDIT}; letter-spacing: 0.005em; }

  /* ================= outside ================= */

  /* ---- flap ---- */
  .story { margin-top: 0.2in; display: flex; flex-direction: column; gap: 0.105in; }
  .active {
    border-top: 0.6pt solid ${BORDER};
    padding-top: 0.17in;
    font-family: "RF Serif", Georgia, serif; font-size: 16pt; line-height: 1.16; letter-spacing: -0.012em;
    color: ${FOREST};
    text-wrap: balance;
  }
  .team {
    margin-top: 0.21in;
    display: grid; grid-template-columns: repeat(3, ${FACE_IN}in); justify-content: space-between; row-gap: 0.17in;
  }
  .team img { display: block; width: ${FACE_IN}in; height: ${FACE_IN}in; border-radius: 50%; outline: 0.6pt solid ${BORDER}; }
  .flap .credit { margin-top: 0.11in; }

  /* ---- back ---- */
  .forest { background: ${FOREST}; }
  .back h2 { color: ${CREAM}; }
  .back p { color: ${ON_FOREST}; }
  .back .lead { margin-top: 0.17in; }
  .back .more { margin-top: 0.105in; }
  .tile {
    width: ${QR_IN + 0.26}in; height: ${QR_IN + 0.26}in;
    background: ${CREAM};
    border-radius: 0.03in;
    padding: 0.13in;
  }
  .tile svg { width: 100%; height: 100%; display: block; }
  .tile path, .tile rect { shape-rendering: crispEdges; }
  .url {
    margin-top: 0.2in;
    font-family: "RF Serif", Georgia, serif; font-size: 18pt; line-height: 1; letter-spacing: -0.012em;
    color: ${CREAM};
  }
  .mail { margin-top: 0.09in; font-size: 8.8pt; color: ${ON_FOREST}; }
  .lockup { display: flex; align-items: center; gap: 0.1in; }
  .lockup .mark { width: 0.34in; height: 0.34in; display: block; }
  .lockup span {
    font-family: "RF Serif", Georgia, serif; font-weight: 600; font-size: 14pt; letter-spacing: -0.02em;
    color: ${CREAM};
  }
  .back .credit { margin-top: 0.15in; color: ${ON_FOREST_SOFT}; }

  /* ---- cover ---- */
  .covermap { display: block; }
  .cover .mark { width: 0.56in; height: 0.56in; display: block; }
  .cover h1 {
    margin-top: 0.27in;
    font-weight: 600; font-size: 50pt; line-height: 0.93; letter-spacing: -0.024em;
    color: ${FOREST};
  }
  .mission {
    margin-top: 0.25in;
    font-family: "RF Serif", Georgia, serif; font-size: 12.6pt; line-height: 1.27; letter-spacing: -0.008em;
    color: ${INK};
    text-wrap: pretty;
  }
  .mission .who { color: ${RUST}; }
  .covercap {
    background: ${CREAM};
    border-radius: 0.025in;
    padding: 0.075in 0.1in 0.08in;
  }
  .covercap .credit { color: ${mix(INK, CREAM, 0.72)}; }

  /* ================= inside ================= */

  .lead-title { font-size: 26pt; }
  .frame { border: 0.6pt solid ${BORDER}; border-radius: 0.03in; overflow: hidden; background: ${CREAM}; }
  .pic, .pic img, .pic svg { display: block; width: 100%; height: 100%; }

  .rows { border-bottom: 0.6pt solid ${BORDER}; }
  .row {
    flex: 1 1 0 !important;
    display: grid; grid-template-columns: 0.44in 1fr; column-gap: 0.17in;
    align-content: start;
    padding-top: 0.3in;
    border-top: 0.6pt solid ${BORDER};
  }
  .ico {
    width: 0.44in; height: 0.44in; border-radius: 50%;
    border: 0.75pt solid ${mix(RUST, CREAM, 0.5)};
    display: flex; align-items: center; justify-content: center;
    margin-top: 0.015in;
  }
  .ico svg { width: 0.25in; height: 0.25in; display: block; }
  .row p { margin-top: 0.055in; }

  /* ---- proof only ---- */
  .guides { display: none; }
  body.proof .guides { display: block; pointer-events: none; }
  body.proof .guides i { position: absolute; top: -${BLEED}in; height: ${H + BLEED * 2}in; border-left: 0.6pt dashed #0A84C8; }
  body.proof .guides b { position: absolute; inset: 0; border: 0.6pt solid #E0338F; }
</style>

<body>

<!-- ============================ OUTSIDE ============================ -->
<div class="sheet" id="outside">
  <div class="trim">
    <div class="forest" style="left:${inch(OUT_F1)};width:${inch(FULL)};top:-${BLEED}in;height:${inch(H + BLEED * 2)}"></div>
    <img class="covermap" alt="" src="data:image/png;base64,${COVER_MAP}"
      style="left:${inch(OUT_F2)};width:${inch(coverMeta.widthIn)};top:${inch(H + BLEED - coverMeta.heightIn)};height:${inch(coverMeta.heightIn)}">

    <!-- flap, the first thing seen when the cover opens -->
    <section class="panel flap" data-fit style="${box(M, TUCK - M * 2)}">
      <h2>How it started</h2>
      <div class="story">${STORY.map((p) => `<p>${p}</p>`).join("")}</div>
      <div class="grow"></div>
      <p class="active">${ACTIVE}</p>
      <div class="team">${FACES.map((src) => `<img alt="" src="${src}">`).join("")}</div>
      <p class="credit">${TEAM_CAPTION}</p>
    </section>

    <!-- back -->
    <section class="panel back" data-fit style="${box(OUT_F1 + M, FULL - M * 2)}">
      <h2>${HELP_HEAD}</h2>
      ${HELP_BODY.map((para, i) => `<p class="${i ? "more" : "lead"}">${para}</p>`).join("\n      ")}
      <div class="grow"></div>
      <div class="tile" id="qr"><svg viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">${qrInner}</svg></div>
      <div class="url">rooted-forward.org</div>
      <div class="mail">contact@rooted-forward.org</div>
      <div class="grow"></div>
      <div class="lockup">${MARK_RINGED}<span>Rooted Forward</span></div>
      <p class="credit">Cover map drawn from Home Owners’ Loan Corporation records, 1940, by way of Mapping Inequality, University of Richmond. Streets and shoreline on both maps from U.S. Census TIGER/Line.</p>
    </section>

    <!-- cover -->
    <section class="panel cover" data-fit style="${box(OUT_F2 + M, FULL - M * 2, TOP, 4.05)}">
      ${MARK}
      <h1>Rooted<br>Forward</h1>
      <p class="mission"><span class="who">${MISSION_WHO}</span> ${MISSION_WHAT}</p>
    </section>
    <div class="covercap" style="left:${inch(OUT_F2 + M)};width:2.2in;bottom:0.32in">
      <p class="credit">The Home Owners’ Loan Corporation’s grades for Chicago, 1940. The neighborhoods shaded red were the ones banks were told to stay out of.</p>
    </div>

    <div class="guides"><b></b><i style="left:${inch(OUT_F1)}"></i><i style="left:${inch(OUT_F2)}"></i></div>
  </div>
</div>

<!-- ============================ INSIDE ============================= -->
<div class="sheet" id="inside">
  <div class="trim">
    <h2 class="lead-title" style="left:${inch(M)};top:${inch(TOP)}">Ways we help</h2>
${COLS.map(column).join("\n")}

    <div class="guides"><b></b><i style="left:${inch(IN_F1)}"></i><i style="left:${inch(IN_F2)}"></i></div>
  </div>
</div>

</body>
</html>`;

/* House rules, checked on the words a reader sees rather than trusted. */
const visible = html.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
if (/[—–]/.test(visible)) throw new Error("There is a dash in the copy. The site uses none.");
const colon = visible.match(/[A-Za-z][^.?!]{0,40}:(?!\/\/)[^.?!]{0,40}/);
if (colon) throw new Error(`There is a colon in the copy: "${colon[0].trim()}"`);

const htmlPath = join(HERE, "brochure.html");
writeFileSync(htmlPath, html);

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */

const browser = await puppeteer.launch({ headless: true, args: ["--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: Math.round((W + BLEED * 2) * 96), height: Math.round((H + BLEED * 2) * 96), deviceScaleFactor: 1 });
await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");

/* ---------- does it all fit ---------- */
/* Every panel is a fixed box. Anything taller than its box would be
   pushed off the bottom without a word, so each one is measured. */
const fit = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("[data-fit]")) {
    const box = el.getBoundingClientRect();
    let bottom = 0, right = 0;
    for (const child of el.querySelectorAll("*")) {
      const r = child.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      bottom = Math.max(bottom, r.bottom);
      right = Math.max(right, r.right);
    }
    /* a row that holds more than its share squeezes the one below */
    const rows = [...el.querySelectorAll(":scope > .row")].map((row) => {
      const inner = row.lastElementChild.getBoundingClientRect();
      return +((row.getBoundingClientRect().height - inner.height) / 96).toFixed(2);
    });
    const grow = [...el.querySelectorAll(":scope > .grow")].map((g) => g.getBoundingClientRect().height / 96);
    out.push({
      panel: el.className.replace("panel ", ""),
      over: +((bottom - box.bottom) / 96).toFixed(3),
      wide: +((right - box.right) / 96).toFixed(3),
      slack: [...grow.map((g) => +g.toFixed(2)), ...rows],
    });
  }
  /* a credit that runs past its two lines would sit on the rows */
  const sheet = document.querySelector("#inside .trim").getBoundingClientRect();
  const caps = [...document.querySelectorAll("#inside .trim > .credit")].map((c) => +((c.getBoundingClientRect().bottom - sheet.top) / 96).toFixed(3));
  return { out, caps };
});
let bad = false;
for (const f of fit.out) {
  const ok = f.over <= 0.001 && f.wide <= 0.001 && f.slack.every((s) => s >= 0.12);
  if (!ok) bad = true;
  console.log(`${ok ? "fits  " : "SPILLS"}  ${f.panel.padEnd(8)} over ${f.over}in, wide ${f.wide}in, slack ${JSON.stringify(f.slack)}`);
}
const capLimit = ROWS_TOP - 0.1;
if (fit.caps.some((b) => b > capLimit)) { bad = true; console.log("a picture credit runs into the rows:", fit.caps, "limit", capLimit); }
/* DRAFT=1 writes the proofs anyway, to see what is spilling. */
if (bad && !process.env.DRAFT) { await browser.close(); throw new Error("The copy does not fit its panels. Nothing was written."); }

/* ---------- the print files ---------- */
const BLEED_PDF = join(OUT, "rooted-forward-brochure-trifold-bleed.pdf");
const TRIM_PDF = join(OUT, "rooted-forward-brochure-trifold.pdf");
await page.pdf({ path: BLEED_PDF, printBackground: true, preferCSSPageSize: true });

/* The same two sheets cut to the trim, for a shop that wants no bleed
   and for printing a proof on a desk printer. */
await page.addStyleTag({
  content: `@page { size: ${W}in ${H}in; margin: 0; }
    .sheet { width: ${W}in; height: ${H}in; }
    .trim { left: 0; top: 0; }`,
});
await page.pdf({ path: TRIM_PDF, printBackground: true, preferCSSPageSize: true });

/* ---------- pictures of both sides ---------- */
const DPI = 200;
await page.setViewport({ width: W * 96, height: H * 96, deviceScaleFactor: DPI / 96 });
for (const proof of [false, true]) {
  await page.evaluate((p) => document.body.classList.toggle("proof", p), proof);
  for (const id of ["outside", "inside"]) {
    const el = await page.$(`#${id}`);
    await el.screenshot({ path: join(PROOF, `${id}${proof ? "-with-folds" : ""}.png`), type: "png" });
  }
}
await page.evaluate(() => document.body.classList.remove("proof"));

/* ---------- prove the code scans ---------- */
const qrBox = await page.evaluate(() => {
  const q = document.querySelector("#qr").getBoundingClientRect();
  const s = document.querySelector("#outside").getBoundingClientRect();
  return { x: q.x - s.x, y: q.y - s.y, w: q.width, h: q.height };
});
await browser.close();

async function readQr(pngPath, crop) {
  let img = sharp(pngPath);
  if (crop) img = img.extract(crop);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}
const s = DPI / 96;
const seen = await readQr(join(PROOF, "outside.png"), {
  left: Math.round(qrBox.x * s), top: Math.round(qrBox.y * s),
  width: Math.round(qrBox.w * s), height: Math.round(qrBox.h * s),
});
if (seen !== QR_URL) throw new Error(`The rendered QR reads ${seen ?? "nothing"}, expected ${QR_URL}. Do not print this.`);

/* ---------- outline the type ---------- */
/* Chrome writes variable fonts as Type3, which a print shop's
   preflight reads as un-embedded and rejects. Round-tripping each
   page through Cairo turns every glyph into a plain path. The file
   stays vector and carries no fonts at all. See build-banner.mjs. */
function outline(pdfPath) {
  const pages = Number(execFileSync("pdfinfo", [pdfPath]).toString().match(/Pages:\s+(\d+)/)[1]);
  if (pages !== 2) throw new Error(`${pdfPath} has ${pages} pages, expected 2 (outside, inside)`);
  const parts = [];
  for (let n = 1; n <= pages; n++) {
    const svg = pdfPath.replace(/\.pdf$/, `.p${n}.svg`);
    const part = pdfPath.replace(/\.pdf$/, `.p${n}.pdf`);
    execFileSync("pdftocairo", ["-svg", "-f", String(n), "-l", String(n), pdfPath, svg]);
    execFileSync("rsvg-convert", ["-f", "pdf", "-o", part, svg]);
    unlinkSync(svg);
    parts.push(part);
  }
  execFileSync("pdfunite", [...parts, pdfPath]);
  parts.forEach((p) => unlinkSync(p));
  const fonts = execFileSync("pdffonts", [pdfPath]).toString().trim().split("\n").slice(2);
  if (fonts.length) throw new Error(`${pdfPath} still carries fonts after outlining:\n${fonts.join("\n")}`);
  return execFileSync("pdfinfo", [pdfPath]).toString().match(/Page size:\s+([\d.]+) x ([\d.]+)/).slice(1).map((v) => +(v / 72).toFixed(3));
}
const bleedSize = outline(BLEED_PDF);
const trimSize = outline(TRIM_PDF);

/* ---------- read the code back off the real print file ---------- */
const probe = join(PROOF, ".qr-probe");
execFileSync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "1", "-singlefile", TRIM_PDF, probe]);
const fromPdf = await readQr(`${probe}.png`);
unlinkSync(`${probe}.png`);
if (fromPdf !== QR_URL) throw new Error(`The outlined PDF's QR reads ${fromPdf ?? "nothing"}. Do not print this.`);

console.log("QR              ", QR_URL, `(${qrModules} modules, ${(QR_IN / qrModules * 25.4).toFixed(2)}mm each, scans from the print file)`);
console.log("type            ", "outlined, no fonts in either file");
console.log("wrote           ", `print/rooted-forward-brochure-trifold-bleed.pdf  ${bleedSize.join(" x ")} in`);
console.log("                ", `print/rooted-forward-brochure-trifold.pdf        ${trimSize.join(" x ")} in`);
console.log("                ", "print/brochure/proof/{outside,inside}.png and the same with fold lines");
