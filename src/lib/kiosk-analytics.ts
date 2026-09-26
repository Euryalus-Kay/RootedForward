import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  kiosk-analytics.ts                                                 */
/*                                                                     */
/*  Server-only reads over the kiosk usage tables. Import from server   */
/*  components and route handlers only. The tables have RLS on with no  */
/*  policies, so nothing here works from a browser by design.           */
/*                                                                     */
/*  Aggregation happens here in TypeScript rather than in SQL views.    */
/*  A single screen produces small numbers, every query below is        */
/*  windowed, and a bug in this file is a deploy away from fixed while  */
/*  a bug in a database function would need the owner to paste SQL      */
/*  again. That trade is worth more than the efficiency.                */
/*                                                                     */
/*  Everything degrades quietly. If Supabase is unreachable or          */
/*  migration 011 has not been applied, the page says so instead of     */
/*  failing.                                                            */
/* ------------------------------------------------------------------ */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

/** The kiosk heartbeats on this interval, so it is also the resolution of
 *  every uptime figure here. Keep in step with HEARTBEAT_MINUTES in
 *  scripts/build-kiosk.mjs. */
export const HEARTBEAT_MS = 5 * 60 * 1000;

/** A screen is called offline once it has missed a couple of heartbeats.
 *  One missed beat is a hiccup, not an outage. */
const OFFLINE_AFTER_MS = HEARTBEAT_MS * 2.5;

const ZONE = "America/Chicago";
const DAY_MS = 24 * 60 * 60 * 1000;

export type SessionRow = {
  started_at: string;
  ended_at: string;
  duration_ms: number;
  detail_opens: number;
  details: string[] | null;
  end_reason: string;
  build: string | null;
  device_id: string;
};

export type KioskStats = {
  available: boolean;
  migrationPending: boolean;
  error: string | null;

  status: {
    online: boolean;
    lastSeen: string | null;
    lastSeenAgoMs: number | null;
    build: string | null;
    devices: string[];
    pageUptimeMs: number | null;
  };

  uptime: {
    day: number | null;
    week: number | null;
    month: number | null;
    /** Stretches of at least two missed heartbeats in the last seven days. */
    outages: { from: string; to: string; ms: number }[];
    trackingSince: string | null;
  };

  sessions: {
    total: number;
    today: number;
    week: number;
    month: number;
    perDay: { day: string; count: number }[];
    byHour: { hour: number; count: number }[];
    endReasons: { reason: string; count: number }[];
  };

  duration: {
    meanMs: number | null;
    medianMs: number | null;
    p90Ms: number | null;
    longestMs: number | null;
    buckets: { label: string; count: number }[];
  };

  depth: {
    meanDetails: number | null;
    openedSomething: number | null;
    details: { label: string; count: number }[];
  };

  reliability: {
    boots: number;
    updates: number;
    errors: number;
    recentUpdates: { at: string; from: string | null; to: string | null }[];
  };
};

function emptyStats(over: Partial<KioskStats>): KioskStats {
  return {
    available: false,
    migrationPending: false,
    error: null,
    status: {
      online: false,
      lastSeen: null,
      lastSeenAgoMs: null,
      build: null,
      devices: [],
      pageUptimeMs: null,
    },
    uptime: { day: null, week: null, month: null, outages: [], trackingSince: null },
    sessions: {
      total: 0,
      today: 0,
      week: 0,
      month: 0,
      perDay: [],
      byHour: [],
      endReasons: [],
    },
    duration: { meanMs: null, medianMs: null, p90Ms: null, longestMs: null, buckets: [] },
    depth: { meanDetails: null, openedSomething: null, details: [] },
    reliability: { boots: 0, updates: 0, errors: 0, recentUpdates: [] },
    ...over,
  };
}

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

/** Calendar day in the museum's own timezone, not the server's. A kiosk in
 *  Chicago rolling over at 6pm because Vercel runs in UTC would make every
 *  daily figure a lie. */
function chicagoDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function chicagoHour(iso: string): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hour: "numeric",
    hour12: false,
  }).format(new Date(iso));
  return Number(h) % 24;
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}

type PageResult = { data: unknown; error: { code?: string; message?: string } | null };

/** PostgREST answers at most 1000 rows to any single request, whatever
 *  .limit() asks for, and says nothing about it. Found the hard way: a
 *  query for 20,000 events came back with exactly 1,000. This pages by
 *  range until a short page arrives or the cap is reached. Every caller
 *  orders on a unique column last, so pages cannot overlap or skip. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  cap: number
): Promise<{ data: T[]; error: PageResult["error"] }> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; from < cap; from += PAGE) {
    const to = Math.min(from + PAGE, cap) - 1;
    const { data, error } = await page(from, to);
    if (error) return { data: out, error };
    const rows = (Array.isArray(data) ? data : []) as T[];
    out.push(...rows);
    if (rows.length < to - from + 1) break;
  }
  return { data: out, error: null };
}

async function countIn(
  supabase: SupabaseClient,
  table: string,
  column: string,
  fromIso?: string,
  extra?: { column: string; value: string }
): Promise<number | null> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (fromIso) q = q.gte(column, fromIso);
  if (extra) q = q.eq(extra.column, extra.value);
  const { count, error } = await q;
  // A head request on a missing table answers 404 with no body, so
  // supabase-js hands back count null with error null. Treating that as
  // zero would report a perfectly healthy kiosk that does not exist.
  if (error || count === null) return null;
  return count;
}

export async function getKioskStats(): Promise<KioskStats> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return emptyStats({ error: "Supabase is not configured for this environment." });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS).toISOString();
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const monthAgo = new Date(now - 30 * DAY_MS).toISOString();

  /* ---- sessions in the last 30 days, the rows every figure rests on ---- */
  const { data: sessionRows, error: sessionErr } = await fetchAll<SessionRow>(
    (from, to) =>
      supabase
        .from("kiosk_sessions")
        .select("started_at, ended_at, duration_ms, detail_opens, taps, details, end_reason, build, device_id")
        .gte("started_at", monthAgo)
        .order("started_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    10000
  );

  if (sessionErr) {
    if (isMissingTable(sessionErr)) return emptyStats({ migrationPending: true });
    return emptyStats({ error: sessionErr.message });
  }

  const sessions = (sessionRows ?? []) as SessionRow[];

  /* ---- pings ---- */
  const { data: lastPingRows } = await supabase
    .from("kiosk_events")
    .select("at, build, device_id, meta")
    .order("at", { ascending: false })
    .limit(1);

  const { data: beatRows } = await fetchAll<{ at: string }>(
    (from, to) =>
      supabase
        .from("kiosk_events")
        .select("at")
        .eq("type", "heartbeat")
        .gte("at", weekAgo)
        .order("at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    12000
  );

  const { data: firstPingRows } = await supabase
    .from("kiosk_events")
    .select("at")
    .order("at", { ascending: true })
    .limit(1);

  const { data: updateRows } = await supabase
    .from("kiosk_events")
    .select("at, meta")
    .eq("type", "update")
    .order("at", { ascending: false })
    .limit(10);

  const [totalSessions, beatsDay, beatsWeek, beatsMonth, boots, updates, errors] =
    await Promise.all([
      countIn(supabase, "kiosk_sessions", "started_at"),
      countIn(supabase, "kiosk_events", "at", dayAgo, { column: "type", value: "heartbeat" }),
      countIn(supabase, "kiosk_events", "at", weekAgo, { column: "type", value: "heartbeat" }),
      countIn(supabase, "kiosk_events", "at", monthAgo, { column: "type", value: "heartbeat" }),
      countIn(supabase, "kiosk_events", "at", monthAgo, { column: "type", value: "boot" }),
      countIn(supabase, "kiosk_events", "at", monthAgo, { column: "type", value: "update" }),
      countIn(supabase, "kiosk_events", "at", monthAgo, { column: "type", value: "error" }),
    ]);

  /* ---- status ---- */
  const lastPing = lastPingRows?.[0] ?? null;
  const lastSeen = lastPing?.at ?? null;
  const lastSeenAgoMs = lastSeen ? now - Date.parse(lastSeen) : null;
  const firstPingAt = firstPingRows?.[0]?.at ?? null;

  const devices = Array.from(
    new Set([
      ...sessions.map((s) => s.device_id),
      ...(lastPing?.device_id ? [lastPing.device_id] : []),
    ])
  ).filter(Boolean);

  /* ---- uptime ----
     Measured against how long the kiosk has actually been reporting, not
     against the whole window, or a screen installed yesterday would show a
     terrible month. */
  function uptimeOver(windowMs: number, beats: number | null): number | null {
    // A screen that has never reported has no uptime figure, not a figure
    // of zero. Zero reads as an outage. This is a screen that is not
    // installed yet, or a table created before its first heartbeat.
    if (beats === null || !firstPingAt) return null;
    const start = Math.max(now - windowMs, Date.parse(firstPingAt));
    const span = now - start;
    if (span < HEARTBEAT_MS) return null;
    const expected = span / HEARTBEAT_MS;
    return Math.max(0, Math.min(100, (beats / expected) * 100));
  }

  const beatTimes = (beatRows ?? [])
    .map((r) => Date.parse(r.at as string))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  const outages: { from: string; to: string; ms: number }[] = [];
  for (let i = 1; i < beatTimes.length; i++) {
    const gap = beatTimes[i] - beatTimes[i - 1];
    if (gap > HEARTBEAT_MS * 2.5) {
      outages.push({
        from: new Date(beatTimes[i - 1]).toISOString(),
        to: new Date(beatTimes[i]).toISOString(),
        ms: gap,
      });
    }
  }
  outages.sort((a, b) => b.ms - a.ms);

  /* ---- session shape ---- */
  const durations = sessions.map((s) => s.duration_ms).sort((a, b) => a - b);
  const todayKey = chicagoDay(new Date(now).toISOString());

  const perDayMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    perDayMap.set(chicagoDay(new Date(now - i * DAY_MS).toISOString()), 0);
  }
  const byHourMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) byHourMap.set(h, 0);
  const endReasonMap = new Map<string, number>();
  const detailMap = new Map<string, number>();

  let todayCount = 0;
  let weekCount = 0;
  let openedSomething = 0;
  let detailTotal = 0;

  for (const s of sessions) {
    const day = chicagoDay(s.started_at);
    if (perDayMap.has(day)) perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
    if (day === todayKey) todayCount++;
    if (Date.parse(s.started_at) >= now - 7 * DAY_MS) weekCount++;

    const hour = chicagoHour(s.started_at);
    byHourMap.set(hour, (byHourMap.get(hour) ?? 0) + 1);

    endReasonMap.set(s.end_reason, (endReasonMap.get(s.end_reason) ?? 0) + 1);

    const list = Array.isArray(s.details) ? s.details : [];
    detailTotal += list.length;
    if (list.length > 0) openedSomething++;
    for (const label of list) {
      detailMap.set(label, (detailMap.get(label) ?? 0) + 1);
    }
  }

  const bucketDefs: { label: string; max: number }[] = [
    { label: "Under 30s", max: 30_000 },
    { label: "30s to 1m", max: 60_000 },
    { label: "1 to 2m", max: 120_000 },
    { label: "2 to 5m", max: 300_000 },
    { label: "5 to 10m", max: 600_000 },
    { label: "Over 10m", max: Infinity },
  ];
  const buckets = bucketDefs.map((b) => ({ label: b.label, count: 0 }));
  for (const d of durations) {
    for (let i = 0; i < bucketDefs.length; i++) {
      if (d < bucketDefs[i].max) {
        buckets[i].count++;
        break;
      }
    }
  }

  return {
    available: true,
    migrationPending: false,
    error: null,
    status: {
      online: lastSeenAgoMs !== null && lastSeenAgoMs < OFFLINE_AFTER_MS,
      lastSeen,
      lastSeenAgoMs,
      build: (lastPing?.build as string | null) ?? sessions[0]?.build ?? null,
      devices,
      pageUptimeMs:
        typeof (lastPing?.meta as Record<string, unknown>)?.pageUptimeMs === "number"
          ? ((lastPing!.meta as Record<string, unknown>).pageUptimeMs as number)
          : null,
    },
    uptime: {
      day: uptimeOver(DAY_MS, beatsDay),
      week: uptimeOver(7 * DAY_MS, beatsWeek),
      month: uptimeOver(30 * DAY_MS, beatsMonth),
      outages: outages.slice(0, 6),
      trackingSince: firstPingAt,
    },
    sessions: {
      total: totalSessions ?? sessions.length,
      today: todayCount,
      week: weekCount,
      month: sessions.length,
      perDay: Array.from(perDayMap.entries()).map(([day, count]) => ({ day, count })),
      byHour: Array.from(byHourMap.entries()).map(([hour, count]) => ({ hour, count })),
      endReasons: Array.from(endReasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    },
    duration: {
      meanMs: durations.length
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null,
      medianMs: quantile(durations, 0.5),
      p90Ms: quantile(durations, 0.9),
      longestMs: durations.length ? durations[durations.length - 1] : null,
      buckets,
    },
    depth: {
      meanDetails: sessions.length ? detailTotal / sessions.length : null,
      openedSomething: sessions.length ? (openedSomething / sessions.length) * 100 : null,
      details: Array.from(detailMap.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
    reliability: {
      boots: boots ?? 0,
      updates: updates ?? 0,
      errors: errors ?? 0,
      recentUpdates: (updateRows ?? []).map((r) => {
        const meta = (r.meta ?? {}) as Record<string, unknown>;
        return {
          at: r.at as string,
          from: typeof meta.from === "string" ? meta.from : null,
          to: typeof meta.to === "string" ? meta.to : null,
        };
      }),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Replay                                                             */
/*                                                                     */
/*  A day's worth of the event stream, bounded by Chicago midnight     */
/*  rather than UTC midnight, so "Tuesday" means the museum's Tuesday.  */
/* ------------------------------------------------------------------ */

export type KioskEvent = {
  id: number;
  session_id: string | null;
  at: string;
  seq: number;
  type: string;
  label: string | null;
  x: number | null;
  y: number | null;
  meta: Record<string, unknown> | null;
};

export type KioskDay = {
  day: string;
  available: boolean;
  migrationPending: boolean;
  error: string | null;
  start: string;
  end: string;
  events: KioskEvent[];
  sessions: { session_id: string | null; started_at: string; ended_at: string; duration_ms: number; detail_opens: number; taps: number; end_reason: string }[];
  truncated: boolean;
};

/** Chicago's offset from UTC at a given instant, in ms. Negative. */
function zoneOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return asIfUtc - utcMs;
}

/** The UTC instants that bound one Chicago calendar day. Two passes so the
 *  two days a year that daylight saving moves the clock come out right. */
export function chicagoDayBounds(day: string): { start: number; end: number } {
  const guess = Date.parse(`${day}T00:00:00Z`);
  let start = guess - zoneOffsetMs(guess);
  start = guess - zoneOffsetMs(start);
  const nextGuess = guess + DAY_MS;
  let end = nextGuess - zoneOffsetMs(nextGuess);
  end = nextGuess - zoneOffsetMs(end);
  return { start, end };
}

export function todayInChicago(): string {
  return chicagoDay(new Date().toISOString());
}

export function isValidDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00Z`));
}

export function shiftDay(day: string, delta: number): string {
  const { start } = chicagoDayBounds(day);
  // Noon avoids landing on the wrong side of a DST boundary.
  return chicagoDay(new Date(start + delta * DAY_MS + 12 * 60 * 60 * 1000).toISOString());
}

/** When the server built the page that called this, for StaleGuard. It
 *  lives here rather than in the page because React's purity lint forbids
 *  Date.now() inside a component body, and for a page that renders once per
 *  request the time of that request is a fact about the response. */
export function renderedNow(): number {
  return Date.now();
}

const REPLAY_EVENT_CAP = 20000;

export async function getKioskDay(day: string): Promise<KioskDay> {
  const { start, end } = chicagoDayBounds(day);
  const startIso = new Date(start).toISOString();
  const endIso = new Date(end).toISOString();
  const base: KioskDay = {
    day,
    available: false,
    migrationPending: false,
    error: null,
    start: startIso,
    end: endIso,
    events: [],
    sessions: [],
    truncated: false,
  };

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { ...base, error: "Supabase is not configured for this environment." };
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: events, error } = await fetchAll<KioskEvent>(
    (from, to) =>
      supabase
        .from("kiosk_events")
        .select("id, session_id, at, seq, type, label, x, y, meta")
        .gte("at", startIso)
        .lt("at", endIso)
        .order("at", { ascending: true })
        .order("seq", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    REPLAY_EVENT_CAP
  );

  if (error) {
    if (isMissingTable(error)) return { ...base, migrationPending: true };
    return { ...base, error: error.message };
  }

  const { data: sessions } = await fetchAll<KioskDay["sessions"][number]>(
    (from, to) =>
      supabase
        .from("kiosk_sessions")
        .select("session_id, started_at, ended_at, duration_ms, detail_opens, taps, end_reason")
        .gte("started_at", startIso)
        .lt("started_at", endIso)
        .order("started_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    2000
  );

  return {
    ...base,
    available: true,
    events,
    sessions,
    truncated: events.length >= REPLAY_EVENT_CAP,
  };
}

/** Which recent days have anything to replay, for the day picker. */
export async function getKioskDays(limitDays = 60): Promise<{ day: string; sessions: number }[]> {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const since = new Date(Date.now() - limitDays * DAY_MS).toISOString();
  const { data } = await fetchAll<{ started_at: string }>(
    (from, to) =>
      supabase
        .from("kiosk_sessions")
        .select("started_at")
        .gte("started_at", since)
        .order("started_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    20000
  );
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const d = chicagoDay(row.started_at as string);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([day, sessions]) => ({ day, sessions }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}
