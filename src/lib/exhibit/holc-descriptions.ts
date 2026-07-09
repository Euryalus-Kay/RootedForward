"use client";
/* ------------------------------------------------------------------ */
/*  Shared loader for the digitized HOLC area description sheets       */
/*  (public/exhibit-data/holc-descriptions.json, prepared by           */
/*  scripts/exhibit-prep-holc.mjs from Mapping Inequality's            */
/*  transcriptions). The map station and the Surveyor's Files          */
/*  reading room both read through this module-level cache so the      */
/*  530KB file is fetched once per page life.                          */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";

const DESCRIPTIONS_URL = "/exhibit-data/holc-descriptions.json";

/** the verbatim form entries kept per sheet; keys mirror the source
 *  transcription, including its "mortagage_funds" spelling */
export interface SheetFields {
  security_grade?: string;
  area_number?: string;
  location?: string;
  date?: string;
  occupation_or_type?: string;
  foreign_born_percent?: string;
  foreign_born_nationality?: string;
  negro_percent?: string;
  infiltration_of?: string;
  "population.increasing"?: string;
  "population.static"?: string;
  "population.decreasing"?: string;
  mortagage_funds?: string;
}

export interface DescArea {
  areaId: number | string;
  grade: string;
  name?: string | null;
  excerpt: string;
  excerptField?: string;
  excerptLabel?: string;
  security_grade_fields?: SheetFields;
  corruptedFields?: string[];
}

export interface DescDoc {
  attribution?: string;
  note?: string;
  areas: DescArea[];
}

interface DescCache {
  promise: Promise<void>;
  data: DescDoc | null;
  error: string | null;
  done: boolean;
}

let descCache: DescCache | null = null;

export function loadHolcDescriptions(): DescCache {
  if (descCache) return descCache;
  const entry: DescCache = { promise: Promise.resolve(), data: null, error: null, done: false };
  entry.promise = fetch(DESCRIPTIONS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${DESCRIPTIONS_URL}`);
      return res.json();
    })
    .then((json) => {
      entry.data = json as DescDoc;
    })
    .catch((err: unknown) => {
      entry.error = err instanceof Error ? err.message : String(err);
    })
    .finally(() => {
      entry.done = true;
    });
  descCache = entry;
  return entry;
}

export function useHolcDescriptions(): { data: DescDoc | null; done: boolean } {
  const [state, setState] = useState<{ data: DescDoc | null; done: boolean }>(() => {
    if (typeof window !== "undefined" && descCache?.done) {
      return { data: descCache.data, done: true };
    }
    return { data: null, done: false };
  });
  useEffect(() => {
    let alive = true;
    const entry = loadHolcDescriptions();
    const publish = () => {
      if (alive) setState({ data: entry.data, done: true });
    };
    if (entry.done) publish();
    else entry.promise.then(publish);
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** excerpts this short are digitization junk ("N/A"), not surveyor prose */
export const MIN_EXCERPT_CHARS = 12;

export function excerptUsable(a: DescArea | undefined | null): boolean {
  if (!a) return false;
  const t = a.excerpt?.trim() ?? "";
  return t.length >= MIN_EXCERPT_CHARS && t !== "N/A";
}

/** the sheet's printed designation when the transcription kept one
 *  (e.g. "D-74"), else null; unreliable as a key, display only */
export function sheetDesignation(a: DescArea): string | null {
  const raw = a.security_grade_fields?.area_number?.trim();
  if (!raw) return null;
  const m = raw.replace(/\s+/g, "").match(/^([ABCD])-?(\d+)$/i);
  if (!m) return null;
  return `${m[1].toUpperCase()}-${Number(m[2])}`;
}

/** display name, filtering the transcription's placeholder junk */
export function sheetName(a: DescArea): string | null {
  const n = a.name?.trim();
  if (!n || n === "N/A" || n.length <= 2) return null;
  return n;
}
