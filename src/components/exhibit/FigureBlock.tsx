"use client";
/* ------------------------------------------------------------------ */
/*  One archival figure on the linen with its Commons credit line.     */
/*  Credits are fetched once from the public folder, never bundled.    */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";

interface CreditRecord {
  artist?: string;
  license?: string;
  date?: string;
  credit?: string;
}

let creditsCache: Record<string, CreditRecord> | null = null;
let creditsPromise: Promise<Record<string, CreditRecord>> | null = null;

function loadCredits(): Promise<Record<string, CreditRecord>> {
  if (creditsCache) return Promise.resolve(creditsCache);
  creditsPromise ??= fetch("/media/hyde-park/credits.json")
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CreditRecord>>) : {}))
    .then((json) => {
      creditsCache = json;
      return json;
    })
    .catch(() => ({}) as Record<string, CreditRecord>);
  return creditsPromise;
}

/* Scraped Commons strings sometimes arrive with HTML entities baked in
 * (&amp;, &quot;, numeric refs). Decode the common ones as a backstop so
 * the label never prints markup; the data-side cleanup is separate. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

/* The credits registry is scraped from Wikimedia Commons and carries its
 * artifacts (doubled author strings, ISO timestamps, Wikidata QS suffixes).
 * Museum labels get a cleaned line; the raw record stays in credits.json. */
function composeCreditLine(credit: CreditRecord): string | null {
  let artist = decodeEntities((credit.artist ?? "").trim());
  const half = Math.floor(artist.length / 2);
  if (half > 3 && artist.slice(0, half) === artist.slice(half)) artist = artist.slice(0, half);
  artist = artist.replace(/\s+/g, " ").trim();
  // Commons' "Unknown author" reads as a name; use the house wording
  if (/^unknown author$/i.test(artist)) artist = "Photographer unknown";
  // life-date ranges after a name, "(1844-1927)", are catalog data, not label copy
  artist = artist.replace(/\s*\(\d{4}\s*[-\u2013\u2014]\s*\d{4}\)/g, "").replace(/\s+/g, " ").trim();
  // Commons usernames often carry a trailing home-town clause ("Teemu008
  // from Palatine, Illinois"); the label wants the name alone
  artist = artist.replace(
    /\s+from\s+[A-Z][A-Za-z.'-]*(?:[ -][A-Za-z.'-]+){0,3}(?:,\s*[A-Z][A-Za-z.'-]*(?:[ -][A-Za-z.'-]+){0,3}){0,3}$/,
    ""
  );
  // an inverted personal name ("Rees, James H.") reads name-first on a
  // label; only touch one-comma, digit-free personal names, applied per
  // semicolon-separated credit segment so multi-artist strings ("Rees,
  // James H.; Ferd. Mayer & Co.") un-invert the personal parts only
  const unInvert = (seg: string): string => {
    if (/\d/.test(seg) || (seg.match(/,/g) ?? []).length !== 1) return seg;
    const [last, first] = seg.split(",").map((s) => s.trim());
    const nameWord = /^[A-Z][A-Za-z'’.-]*$/;
    const roleWord = /^(?:publisher|photographer|printer|engraver|lithographer|artist|editor|firm|company|co\.?|inc\.?)$/i;
    const personal = [last, first].every(
      (side) =>
        side.length > 0 &&
        side.length < 30 &&
        side.split(/\s+/).every((w) => nameWord.test(w) && !roleWord.test(w))
    );
    return personal ? `${first} ${last}` : seg;
  };
  artist = artist
    .split(";")
    .map((seg) => unInvert(seg.trim()))
    .join("; ");

  let date = decodeEntities((credit.date ?? "").trim());
  date = date.replace(/date QS:.*$/i, "").trim();
  // "C.1940" and "c.1940" mean circa; print the conventional "c. 1940"
  date = date.replace(/^[Cc]\.\s*(\d{4})/, "c. $1");
  // any ISO-like prefix (1923-11-05 or 1923-11) prints the year only
  const iso = date.match(/^(\d{4})(?:-\d{2}){1,2}\b/);
  if (iso) {
    date = iso[1];
  } else {
    const yr = date.match(/^(\d{4})(?:\D|$)/);
    if (yr && date.length > 12) date = yr[1];
  }

  const license = decodeEntities((credit.license ?? "").trim());
  const line = [artist, date, license].filter(Boolean).join(", ");
  return line || null;
}

export interface FigureBlockProps {
  src: string;
  alt: string;
  caption?: string;
  creditKey?: string;
}

export default function FigureBlock({ src, alt, caption, creditKey }: FigureBlockProps) {
  const [credit, setCredit] = useState<CreditRecord | null>(null);

  useEffect(() => {
    if (!creditKey) return;
    let live = true;
    loadCredits().then((all) => {
      if (live) setCredit(all[creditKey] ?? null);
    });
    return () => {
      live = false;
    };
  }, [creditKey]);

  const creditLine = credit ? composeCreditLine(credit) : null;

  return (
    <figure>
      <div className="border border-exh-ink/25 bg-exh-linen-deep/50 p-2">
        {/* Archival stills served from /public; plain img is intentional here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={1200} height={800} loading="lazy" className="h-auto w-full" />
      </div>
      {(caption || creditLine) && (
        <figcaption className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
          {caption ? <span className="font-display italic">{caption}</span> : null}
          {caption && creditLine ? <span aria-hidden="true"> </span> : null}
          {creditLine ? (
            <span className="exh-plat uppercase tracking-[0.08em]">{creditLine}</span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}
