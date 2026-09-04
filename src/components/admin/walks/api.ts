"use client";

/* ------------------------------------------------------------------ */
/*  The admin client for the walk store.                               */
/*                                                                     */
/*  A walking tour used to exist only as compiled TypeScript in        */
/*  src/lib/tours/registry.ts, so fixing one sentence meant a commit,  */
/*  a deploy, and for the phone an App Store release. Tours live in    */
/*  the walk_tours table now. The site and /api/walk read the table    */
/*  first and fall back to the compiled constants, the same "row       */
/*  first, constant as fallback" pattern the rest of the site uses.    */
/*                                                                     */
/*  The index route answers with one light line per walk, on purpose,  */
/*  since a bundle carries its geometry and Hyde Park's alone is about */
/*  a hundred kilobytes of road centerlines. So the table on screen is */
/*  built from summaries and the bundle is fetched when the owner      */
/*  actually opens one.                                                */
/* ------------------------------------------------------------------ */

import type { WalkTourBundle } from "@/lib/tours/registry";
import type { WalkStop } from "@/lib/tours/walk-types";

const BASE = "/api/admin/walks";

/** Where the walk the public site is serving right now comes from. A
 *  walk still living in registry.ts has no row, is live by fallback,
 *  and becomes editable the first time it is saved here. */
export type WalkSource = "database" | "code";

/** One line of the table. No bundle, by design. */
export interface WalkSummary {
  slug: string;
  title: string;
  live: boolean;
  sortOrder: number;
  /** null on a walk that has never been saved to the table */
  updatedAt: string | null;
  stopCount: number;
  isDefault: boolean;
  source: WalkSource;
}

/** One walk, whole, as the editor holds it. */
export interface AdminWalkRecord {
  slug: string;
  live: boolean;
  sortOrder: number;
  updatedAt: string | null;
  source: WalkSource;
  bundle: WalkTourBundle;
}

/** Thrown by every call below. `problems` carries the field by field
 *  list the bundle check returns, which is the difference between
 *  "that did not save" and knowing which stop is missing its audio. */
export class WalkApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problems: string[];
  readonly migrationPending: boolean;

  constructor(init: {
    message: string;
    status: number;
    code?: string;
    problems?: string[];
    migrationPending?: boolean;
  }) {
    super(init.message);
    this.name = "WalkApiError";
    this.status = init.status;
    this.code = init.code ?? "";
    this.problems = init.problems ?? [];
    this.migrationPending = init.migrationPending ?? false;
  }
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, { cache: "no-store", ...init });
  } catch {
    throw new WalkApiError({ message: "The site could not be reached", status: 0 });
  }
  const body = await readBody(res);
  if (res.ok) return body;

  // The routes answer with a machine code in `error` and the sentence
  // a person should read in `message`, so the sentence wins.
  const code = isObject(body) ? str(body.error) : "";
  const message = isObject(body)
    ? str(body.message) || str(body.error) || `The request failed (${res.status})`
    : `The request failed (${res.status})`;
  const problems =
    isObject(body) && Array.isArray(body.problems)
      ? body.problems.filter((p): p is string => typeof p === "string")
      : [];

  throw new WalkApiError({
    message,
    status: res.status,
    code,
    problems,
    migrationPending:
      (isObject(body) && body.migrationPending === true) ||
      code === "migration-pending",
  });
}

/* ---- reading ----------------------------------------------------- */

interface RowShape {
  slug?: unknown;
  live?: unknown;
  sort_order?: unknown;
  updated_at?: unknown;
  bundle?: unknown;
  title?: unknown;
  stopCount?: unknown;
  isDefault?: unknown;
  hasRow?: unknown;
}

export interface WalkIndex {
  walks: WalkSummary[];
  /** the slug a shipped iPhone asks for by name when it asks for none */
  defaultSlug: string;
  /** the walks the build still carries, row or no row. These are the
   *  only ones that can be restored from the code after a bad edit. */
  compiledSlugs: string[];
}

/** Rows first, then the walks that still exist only in the build. A
 *  compiled walk with a row is already in the list above, so it is
 *  skipped rather than shown twice. */
export async function listWalks(): Promise<WalkIndex> {
  const body = await request(BASE);
  const rows = isObject(body) && Array.isArray(body.data) ? body.data : [];
  const compiled = isObject(body) && Array.isArray(body.compiled) ? body.compiled : [];
  const defaultSlug = isObject(body) ? str(body.defaultSlug) : "";

  const saved: WalkSummary[] = rows.filter(isObject).map((row: RowShape) => ({
    slug: str(row.slug),
    title: str(row.title),
    live: Boolean(row.live),
    sortOrder: num(row.sort_order, 0),
    updatedAt: str(row.updated_at) || null,
    stopCount: num(row.stopCount, 0),
    isDefault: Boolean(row.isDefault),
    source: "database",
  }));

  const inCode: WalkSummary[] = compiled
    .filter(isObject)
    .filter((row: RowShape) => row.hasRow !== true)
    .map((row: RowShape) => ({
      slug: str(row.slug),
      title: str(row.title),
      // A compiled walk with no row is what the site is serving, so it
      // is live whether or not anything has been saved here.
      live: true,
      sortOrder: 0,
      updatedAt: null,
      stopCount: num(row.stopCount, 0),
      isDefault: str(row.slug) === defaultSlug,
      source: "code",
    }));

  return {
    walks: [...saved, ...inCode]
      .filter((w) => w.slug)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug)),
    defaultSlug,
    compiledSlugs: compiled
      .filter(isObject)
      .map((row: RowShape) => str(row.slug))
      .filter(Boolean),
  };
}

/** The bundle is what the phone ends up decoding, so anything missing
 *  is filled from the blank bundle rather than dropped. A half written
 *  row then opens in the editor instead of throwing on the way in. */
function normalizeBundle(slug: string, raw: unknown): WalkTourBundle {
  const blank = emptyBundle(slug);
  if (!isObject(raw)) return blank;
  return {
    ...blank,
    ...(raw as Partial<WalkTourBundle>),
    slug: str(raw.slug, slug),
    tour: { ...blank.tour, ...(isObject(raw.tour) ? raw.tour : {}) },
    intro: { ...blank.intro, ...(isObject(raw.intro) ? raw.intro : {}) },
    geometry: isObject(raw.geometry) ? raw.geometry : blank.geometry,
    map: isObject(raw.map) ? raw.map : blank.map,
    page: { ...blank.page, ...(isObject(raw.page) ? raw.page : {}) },
  } as WalkTourBundle;
}

export async function loadWalk(slug: string): Promise<AdminWalkRecord> {
  const body = await request(`${BASE}/${encodeURIComponent(slug)}`);
  const row: RowShape = isObject(body) && isObject(body.data) ? body.data : {};
  const source: WalkSource =
    isObject(body) && str(body.source) === "code" ? "code" : "database";
  return {
    slug: str(row.slug, slug),
    live: Boolean(row.live),
    sortOrder: num(row.sort_order, 0),
    updatedAt: str(row.updated_at) || null,
    source,
    bundle: normalizeBundle(str(row.slug, slug), row.bundle),
  };
}

/* ---- writing ----------------------------------------------------- */

/** The write routes answer with the row's own columns and no bundle,
 *  since they were just handed it. The draft on screen is therefore
 *  still the truth about the content, and only the metadata is taken
 *  from the answer. */
function mergeSaved(record: AdminWalkRecord, body: unknown): AdminWalkRecord {
  const row: RowShape = isObject(body) && isObject(body.data) ? body.data : {};
  return {
    ...record,
    slug: str(row.slug, record.slug),
    live: typeof row.live === "boolean" ? row.live : record.live,
    sortOrder: num(row.sort_order, record.sortOrder),
    updatedAt: str(row.updated_at) || new Date().toISOString(),
    source: "database",
  };
}

async function createWalk(record: AdminWalkRecord): Promise<AdminWalkRecord> {
  const body = await request(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: record.slug,
      live: record.live,
      sort_order: record.sortOrder,
      bundle: record.bundle,
    }),
  });
  return mergeSaved(record, body);
}

async function replaceWalk(record: AdminWalkRecord): Promise<AdminWalkRecord> {
  const body = await request(`${BASE}/${encodeURIComponent(record.slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      live: record.live,
      sort_order: record.sortOrder,
      bundle: record.bundle,
    }),
  });
  return mergeSaved(record, body);
}

/** A walk that has only ever existed in registry.ts has no row to
 *  replace, so its first save has to be an insert. Both callers go
 *  through here rather than each deciding for itself. */
export async function persistWalk(
  record: AdminWalkRecord,
  isNew: boolean
): Promise<AdminWalkRecord> {
  return isNew || record.source === "code"
    ? createWalk(record)
    : replaceWalk(record);
}

/** Live and running order only, for the table. Flipping live from the
 *  list must not resend a bundle the list never had. */
export async function patchWalk(
  slug: string,
  patch: { live?: boolean; sortOrder?: number }
): Promise<{ live: boolean; sortOrder: number; updatedAt: string | null }> {
  const payload: Json = {};
  if (patch.live !== undefined) payload.live = patch.live;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const body = await request(`${BASE}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const row: RowShape = isObject(body) && isObject(body.data) ? body.data : {};
  return {
    live: Boolean(row.live),
    sortOrder: num(row.sort_order, 0),
    updatedAt: str(row.updated_at) || null,
  };
}

/** Puts the compiled version back over the row, which is the way out
 *  of an edit that went wrong on a walk the build still carries. */
export async function restoreFromCode(slug: string): Promise<void> {
  await request(`${BASE}/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "code" }),
  });
}

export async function deleteWalk(slug: string): Promise<void> {
  await request(`${BASE}/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

/** Uploads into the walk-media bucket and hands back the site-relative
 *  path the payload should carry. Site-relative matters. The phone
 *  joins every media path onto mediaBase, so a storage URL would break
 *  offline caching. */
export async function uploadWalkMedia(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const body = await request(`${BASE}/media`, { method: "POST", body: form });
  const path = isObject(body) ? str(body.path) : "";
  if (!path) {
    throw new WalkApiError({
      message: "The upload finished without a path",
      status: 200,
    });
  }
  return path;
}

/* ---- blanks ------------------------------------------------------ */

/** A new walk starts genuinely empty. Nothing here is sample copy and
 *  nothing pretends to be real, because whatever is in a bundle goes
 *  out over the same API the phone reads. */
export function emptyBundle(slug: string): WalkTourBundle {
  return {
    slug,
    path: slug ? `/tours/${slug}-walk` : "",
    mediaDir: slug ? `/media/${slug}-walk` : "",
    tour: {
      title: "",
      dek: "",
      walkMinutes: 0,
      listenMinutes: 0,
      distanceMiles: 0,
      startLabel: "",
      stops: [],
      route: [],
      practical: [],
    },
    intro: { title: "", paragraphs: [], byline: "" },
    geometry: {
      source: "",
      frame: { latMin: 0, latMax: 0, lngMin: 0, lngMax: 0 },
      viewBox: { w: 1000, h: 1000 },
      water: [],
      roads: { arterials: [], locals: [], alleys: [] },
      rails: [],
    },
    map: {
      baseMapSrc: "",
      areaName: "",
      placeLabels: [],
      streetLabels: [],
      parkAreas: [],
      campusAreas: [],
      stopLabelSide: {},
    },
    page: {
      metaTitle: "",
      metaDescription: "",
      terrain: "",
      wash: { src: "", alt: "" },
    },
  };
}

export function emptyStop(number: number): WalkStop {
  return {
    id: "",
    number,
    title: "",
    dek: "",
    lat: 0,
    lng: 0,
    audioSrc: "",
    audioSeconds: 0,
    transcript: [],
    images: [],
    mapLabel: "",
  };
}
