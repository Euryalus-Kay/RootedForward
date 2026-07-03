/* ------------------------------------------------------------------ */
/*  Fact registry accessor. Components never hold numeric literals;    */
/*  every displayed figure resolves here, carrying its provenance      */
/*  tier and citation. scripts/exhibit-audit-facts.mjs audits both     */
/*  the registry and every reference to it.                            */
/* ------------------------------------------------------------------ */
import factsJson from "../../../data/exhibit/facts.json";
import type { Fact } from "./types";

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

/** One-line citation string for popovers and the transcript. */
export function citationLine(f: Fact): string {
  const bits = [f.source.author, f.source.title, f.source.year ? String(f.source.year) : null, f.source.locator]
    .filter(Boolean)
    .join(", ");
  return bits;
}
