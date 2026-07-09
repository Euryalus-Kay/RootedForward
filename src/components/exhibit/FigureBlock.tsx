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

  let date = decodeEntities((credit.date ?? "").trim());
  date = date.replace(/date QS:.*$/i, "").trim();
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
