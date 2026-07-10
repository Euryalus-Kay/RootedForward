/* ------------------------------------------------------------------ */
/*  Fact registry accessor. Components never hold numeric literals;    */
/*  every displayed figure resolves here, carrying its provenance      */
/*  tier and citation. scripts/exhibit-audit-facts.mjs audits both     */
/*  the registry and every reference to it.                            */
/* ------------------------------------------------------------------ */
import factsJson from "../../../data/exhibit/facts.json";
import type { Fact, FactSource } from "./types";

const doc = factsJson as unknown as { facts: Fact[] };

const REGISTRY = new Map<string, Fact>(doc.facts.map((f) => [f.id, f]));

export function getFact(id: string): Fact {
  const f = REGISTRY.get(id);
  if (!f) {
    // Loud in dev, safe in prod: an unresolved id is an audit failure long
    // before it ships, but never crash the exhibit over a display string.
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Unknown fact id "${id}". Register it in data/exhibit/facts.json.`);
    }
    return {
      id,
      value: "",
      display: "",
      tier: "reported",
      source: { title: "unregistered" },
    };
  }
  return f;
}

export function hasFact(id: string): boolean {
  return REGISTRY.has(id);
}

export function allFacts(): Fact[] {
  return doc.facts;
}

/** Year label for a citation. A living web resource carries yearIsAccess
 *  in the registry, so its year reads "accessed 2026" rather than posing
 *  as a publication year. */
export function sourceYearLabel(s: FactSource): string | null {
  if (!s.year) return null;
  return s.yearIsAccess ? `accessed ${s.year}` : String(s.year);
}

/** One-line citation string for popovers and the transcript. */
export function citationLine(f: Fact): string {
  const bits = [f.source.author, f.source.title, sourceYearLabel(f.source), f.source.locator]
    .filter(Boolean)
    .join(", ");
  return bits;
}

/* ---------------- bibliography ---------------- */

export interface BibliographyEntry {
  title: string;
  author?: string;
  year?: number;
  /** preformatted parenthetical, "1893" or "accessed 2026" */
  yearLabel?: string;
  url?: string;
}

const LEADING_ARTICLE = /^(?:the|a|an)\s+/i;

function stripLeadingArticle(s: string): string {
  return s.replace(LEADING_ARTICLE, "").trim();
}

/* Words and characters that mark an author string as an institution,
 * publication, or record series rather than a personal name. */
const INSTITUTION_MARK = new RegExp(
  "[()&/\\d]|\\b(?:of|on|for|with|in|by|at|and|the|" +
    "Administration|Agency|Assembly|Association|Atlantic|Authority|Band|Bank|Board|Bureau|" +
    "Census|Center|Centre|Chicago|City|Collection|Commission|Committee|Congress|Corporation|" +
    "Council|Court|Defender|Department|Encyclopaedia|Encyclopedia|Foundation|Government|" +
    "Herald|Initiative|Institute|Journal|Library|Magazine|National|News|Office|Press|" +
    "Project|Records|Reporter|Service|Society|States|Times|Tribune|University|Wikipedia)\\b"
);

const NAME_WORD = /^[A-Z][A-Za-z'’.-]*$/;

/** Alphabetization key for one bibliography entry. A personal author
 *  sorts by surname, namely the last word of the name segment before
 *  any comma (the first name of an "A and B" pair). Institutions sort
 *  by their full name, and a record with no author sorts by title under
 *  the same rule. Leading articles are ignored; keys are lowercase. */
export function bibliographySortKey(e: { title: string; author?: string }): string {
  const raw = stripLeadingArticle(((e.author ?? "").trim() || e.title).trim());
  const segment = (raw.split(/[;,]/)[0] ?? raw).trim();
  const name = (segment.split(/\s+and\s+/i)[0] ?? segment).trim();
  const words = name.split(/\s+/);
  const personal =
    words.length > 0 &&
    words.length <= 4 &&
    !INSTITUTION_MARK.test(name) &&
    words.every((w) => NAME_WORD.test(w));
  if (personal) {
    const surname = words[words.length - 1].replace(/\.$/, "");
    return `${surname}, ${name}`.toLowerCase();
  }
  return stripLeadingArticle(segment).toLowerCase();
}

export function compareBibliographyEntries(
  a: { title: string; author?: string; year?: number },
  b: { title: string; author?: string; year?: number }
): number {
  const ka = bibliographySortKey(a);
  const kb = bibliographySortKey(b);
  if (ka !== kb) return ka.localeCompare(kb, "en");
  const ta = stripLeadingArticle(a.title).toLowerCase();
  const tb = stripLeadingArticle(b.title).toLowerCase();
  if (ta !== tb) return ta.localeCompare(tb, "en");
  return (a.year ?? 0) - (b.year ?? 0);
}

/** The About panel's source list: every unique citation in the registry,
 *  de-duplicated by title, author, and year, with a preformatted year
 *  label, sorted by author surname or institution name with leading
 *  articles ignored. */
export function buildBibliography(): BibliographyEntry[] {
  const seen = new Map<string, BibliographyEntry>();
  for (const f of allFacts()) {
    for (const s of [f.source, ...(f.secondarySources ?? [])]) {
      // plain-string secondary sources are registry shorthand, not citations
      if (!s || typeof s !== "object" || !s.title) continue;
      const k = [s.title, s.author ?? "", s.year ?? ""].join("|");
      const prev = seen.get(k);
      if (!prev) {
        seen.set(k, {
          title: s.title,
          author: s.author,
          year: s.year,
          yearLabel: sourceYearLabel(s) ?? undefined,
          url: s.url || undefined,
        });
      } else if (!prev.url && s.url) {
        prev.url = s.url;
      }
    }
  }
  return [...seen.values()].sort(compareBibliographyEntries);
}
