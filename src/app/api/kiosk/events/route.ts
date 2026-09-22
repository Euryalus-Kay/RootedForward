import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  /api/kiosk/events                                                  */
/*                                                                     */
/*  Where the museum kiosk posts what happened on it. The screen        */
/*  queues events in its own browser storage and sends them in          */
/*  batches, so this has to be safe to call repeatedly and cheap to     */
/*  fail.                                                               */
/*                                                                     */
/*  Two shapes arrive in the same batch. Everything with a timestamp    */
/*  goes to kiosk_events, which is the recording a day is replayed      */
/*  from. A "session" is the rollup the figures are counted from, and   */
/*  it upserts on its session id so a resent batch cannot count the     */
/*  same visitor twice.                                                 */
/*                                                                     */
/*  Nothing stored here identifies a person. No IP address, no user     */
/*  agent, no cookie. deviceId is a random label the screen invents     */
/*  for itself, a session id is random and never reused, and a tap      */
/*  coordinate is a place on a museum wall.                             */
/*                                                                     */
/*  The endpoint is open, because the kiosk is a static file and any    */
/*  secret baked into it would be public anyway. What protects the      */
/*  numbers is strict validation, a batch cap, a per-device rate        */
/*  limit, and every row carrying the device that sent it, so junk is   */
/*  visible and can be deleted.                                         */
/*                                                                     */
/*  Until migration 011 is applied the tables do not exist. That is     */
/*  answered as migrationPending rather than a 500, and the kiosk       */
/*  holds its queue rather than discarding it, so nothing collected     */
/*  before the SQL is run is lost.                                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

const MAX_EVENTS = 100;
const MAX_DURATION_MS = 7_200_000; // two hours, matches the table's CHECK
const MAX_DETAILS = 60;
const DEVICE_RE = /^[A-Za-z0-9_-]{3,64}$/;
const SESSION_RE = /^[A-Za-z0-9]{6,40}$/;
const SURFACES = new Set(["wall", "phone"]);
const EVENT_TYPES = new Set([
  "session_start",
  "session_end",
  "screen",
  "tap",
  "detail_open",
  "detail_close",
  "idle_reset",
  "heartbeat",
  "boot",
  "update",
  "error",
]);
const END_REASONS = new Set(["idle", "start_over", "reload", "hidden"]);

/* A screen sending honestly posts about once a minute. Sixty batches in a
   minute is not a kiosk. In-memory, so it is per serverless instance and
   best effort rather than a guarantee, which is the same bargain the rest
   of the site's rate limiting makes. */
const seen = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_BATCHES_PER_WINDOW = 60;

function isRateLimited(device: string): boolean {
  const now = Date.now();
  const hits = (seen.get(device) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(device, hits);
  if (seen.size > 500) {
    for (const [key, times] of seen.entries()) {
      if (!times.some((t) => now - t < WINDOW_MS)) seen.delete(key);
    }
  }
  return hits.length > MAX_BATCHES_PER_WINDOW;
}

/** migration 011 not applied yet */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("kiosk_") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

/** An ISO timestamp that is actually plausible for a screen on a wall. */
function cleanTime(value: unknown, now: number): string | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  // A year behind covers a kiosk that was offline for a long stretch and is
  // finally flushing. Five minutes ahead covers ordinary clock drift.
  if (ms < now - 365 * 24 * 60 * 60 * 1000) return null;
  if (ms > now + 5 * 60 * 1000) return null;
  return new Date(ms).toISOString();
}

function cleanInt(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 0 || n > max) return null;
  return n;
}

function cleanUnit(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return Math.round(value * 1000) / 1000;
}

function cleanBuild(value: unknown): string | null {
  return typeof value === "string" && /^[a-f0-9]{6,16}$/.test(value) ? value : null;
}

function cleanText(value: unknown, cap: number): string | null {
  return typeof value === "string" && value.length > 0 ? value.slice(0, cap) : null;
}

function cleanMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  // Capped hard. This is the one free-form field and it is not worth
  // letting a bad build write essays into the table.
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 8);
  return Object.fromEntries(
    entries.map(([k, v]) => [
      k.slice(0, 32),
      typeof v === "string"
        ? v.slice(0, 120)
        : typeof v === "number" || typeof v === "boolean"
          ? v
          : null,
    ])
  );
}

type EventRow = {
  device_id: string;
  session_id: string | null;
  build: string | null;
  surface: string;
  at: string;
  seq: number;
  type: string;
  label: string | null;
  x: number | null;
  y: number | null;
  meta: Record<string, unknown>;
};

type SessionRow = {
  session_id: string | null;
  device_id: string;
  build: string | null;
  surface: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  detail_opens: number;
  taps: number;
  details: string[];
  end_reason: string;
};

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const payload = body as { deviceId?: unknown; surface?: unknown; events?: unknown };

  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId.trim() : "";
  if (!DEVICE_RE.test(deviceId)) {
    return NextResponse.json({ ok: false, error: "bad device" }, { status: 400 });
  }

  const surface =
    typeof payload.surface === "string" && SURFACES.has(payload.surface)
      ? payload.surface
      : "wall";

  if (!Array.isArray(payload.events) || payload.events.length === 0) {
    return NextResponse.json({ ok: true, accepted: 0 }, { status: 200 });
  }
  if (payload.events.length > MAX_EVENTS) {
    return NextResponse.json({ ok: false, error: "batch too large" }, { status: 413 });
  }
  if (isRateLimited(deviceId)) {
    // 429 on purpose. The kiosk keeps the batch and tries again later, so
    // throttling a noisy sender costs nothing that was worth keeping.
    return NextResponse.json({ ok: false, error: "slow down" }, { status: 429 });
  }

  const now = Date.now();
  const events: EventRow[] = [];
  const sessions: SessionRow[] = [];
  let rejected = 0;

  for (const raw of payload.events) {
    if (!raw || typeof raw !== "object") {
      rejected++;
      continue;
    }
    const ev = raw as Record<string, unknown>;
    const type = typeof ev.type === "string" ? ev.type : "";
    const build = cleanBuild(ev.build);
    const sessionId =
      typeof ev.sessionId === "string" && SESSION_RE.test(ev.sessionId)
        ? ev.sessionId
        : null;

    if (type === "session") {
      const startedAt = cleanTime(ev.startedAt, now);
      const endedAt = cleanTime(ev.endedAt, now);
      const durationMs = cleanInt(ev.durationMs, MAX_DURATION_MS);
      if (!startedAt || !endedAt || durationMs === null || durationMs < 1000) {
        rejected++;
        continue;
      }
      const details = Array.isArray(ev.details)
        ? ev.details
            .filter((d): d is string => typeof d === "string")
            .slice(0, MAX_DETAILS)
            .map((d) => d.slice(0, 80))
        : [];
      sessions.push({
        session_id: sessionId,
        device_id: deviceId,
        build,
        surface,
        started_at: startedAt,
        ended_at: endedAt,
        duration_ms: durationMs,
        // Trust the labels actually sent rather than a count that could
        // disagree with them.
        detail_opens: details.length,
        taps: cleanInt(ev.taps, 10_000) ?? 0,
        details,
        end_reason:
          typeof ev.endReason === "string" && END_REASONS.has(ev.endReason)
            ? ev.endReason
            : "idle",
      });
      continue;
    }

    if (EVENT_TYPES.has(type)) {
      const at = cleanTime(ev.at, now);
      if (!at) {
        rejected++;
        continue;
      }
      events.push({
        device_id: deviceId,
        session_id: sessionId,
        build,
        surface,
        at,
        seq: cleanInt(ev.seq, 1_000_000) ?? 0,
        type,
        label: cleanText(ev.label, 80),
        x: cleanUnit(ev.x),
        y: cleanUnit(ev.y),
        meta: cleanMeta(ev.meta),
      });
      continue;
    }

    rejected++;
  }

  if (!events.length && !sessions.length) {
    return NextResponse.json({ ok: true, accepted: 0, rejected }, { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let migrationPending = false;

  if (sessions.length) {
    // Upsert on the session id so a batch that gets sent twice, which can
    // happen when a response is lost rather than refused, cannot count the
    // same visitor's turn twice.
    const { error } = await supabase
      .from("kiosk_sessions")
      .upsert(sessions, { onConflict: "session_id", ignoreDuplicates: true });
    if (error) {
      if (isMissingTable(error)) migrationPending = true;
      else {
        console.error("[kiosk/events] session upsert failed", error.message);
        return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
      }
    }
  }

  if (events.length && !migrationPending) {
    const { error } = await supabase.from("kiosk_events").insert(events);
    if (error) {
      if (isMissingTable(error)) migrationPending = true;
      else {
        console.error("[kiosk/events] event insert failed", error.message);
        return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
      }
    }
  }

  if (migrationPending) {
    return NextResponse.json(
      { ok: true, accepted: 0, migrationPending: true },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ok: true, accepted: events.length + sessions.length, rejected },
    { status: 200 }
  );
}
