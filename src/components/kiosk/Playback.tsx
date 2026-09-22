"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Playback                                                           */
/*                                                                     */
/*  Plays one day of the kiosk's event stream back as if it had been   */
/*  recorded. It is a reconstruction, not a video. The screen box       */
/*  shows which screen was up and which detail was open, and every     */
/*  tap lands as a dot at the place on the screen it actually hit.      */
/*                                                                     */
/*  Virtual time advances at the chosen speed. With "skip quiet" on,    */
/*  which is the default, it jumps over any stretch longer than twenty  */
/*  seconds with nothing in it, since a museum day is mostly nobody     */
/*  there and nobody wants to watch that in real time.                  */
/* ------------------------------------------------------------------ */

export type PlaybackEvent = {
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

export type PlaybackSession = {
  session_id: string | null;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  detail_opens: number;
  taps: number;
  end_reason: string;
};

type Snap = {
  screen: string;
  detail: string | null;
  sessionId: string | null;
  sessionStart: number | null;
};

const ZONE = "America/Chicago";
const QUIET_GAP_MS = 20_000;
const RIPPLE_MS = 1400;
const SPEEDS = [1, 4, 16, 60];

function clock(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ms));
}

function short(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}m ${s % 60}s` : `${m}m`;
}

function describe(e: PlaybackEvent): string {
  switch (e.type) {
    case "session_start":
      return "Someone walked up";
    case "session_end":
      return e.label === "idle"
        ? "Walked away, screen reset itself"
        : e.label === "start_over"
          ? "Pressed start over"
          : `Session ended (${e.label ?? "unknown"})`;
    case "screen":
      return `Screen: ${e.label ?? "?"}`;
    case "tap":
      return "Tap";
    case "detail_open":
      return `Opened ${e.label ?? "a detail"}`;
    case "detail_close":
      return "Closed the detail";
    case "idle_reset":
      return "Idle reset fired";
    case "heartbeat":
      return "Heartbeat";
    case "boot":
      return "Page started";
    case "update":
      return `Took an update to ${(e.meta?.to as string) ?? "?"}`;
    case "error":
      return `Error: ${e.label ?? ""}`;
    default:
      return e.type;
  }
}

export default function Playback({
  dayStart,
  dayEnd,
  events,
  sessions,
}: {
  dayStart: string;
  dayEnd: string;
  events: PlaybackEvent[];
  sessions: PlaybackSession[];
}) {
  /* ---- prepared once per day ---- */
  const prepared = useMemo(() => {
    const times = events.map((e) => Date.parse(e.at));
    const snaps: Snap[] = [];
    let cur: Snap = { screen: "Attract screen", detail: null, sessionId: null, sessionStart: null };
    for (const e of events) {
      cur = { ...cur };
      switch (e.type) {
        case "session_start":
          cur.sessionId = e.session_id;
          cur.sessionStart = Date.parse(e.at);
          break;
        case "session_end":
          cur.sessionId = null;
          cur.sessionStart = null;
          cur.detail = null;
          break;
        case "screen":
          cur.screen = e.label ?? cur.screen;
          if (cur.screen !== "Detail panel") cur.detail = null;
          break;
        case "detail_open":
          cur.detail = e.label;
          break;
        case "detail_close":
          cur.detail = null;
          break;
        case "boot":
          cur = { screen: "Attract screen", detail: null, sessionId: null, sessionStart: null };
          break;
      }
      snaps.push(cur);
    }

    // The axis runs from the first thing that happened to the last, with a
    // little air either side, so a day with one visitor at 3pm does not
    // spread that visitor across a bar that is otherwise empty.
    const interesting = events.filter((e) => e.type !== "heartbeat");
    const first = interesting.length ? Date.parse(interesting[0].at) : Date.parse(dayStart);
    const last = interesting.length
      ? Date.parse(interesting[interesting.length - 1].at)
      : Date.parse(dayEnd);
    const pad = 2 * 60 * 1000;
    const axisStart = Math.max(Date.parse(dayStart), first - pad);
    const axisEnd = Math.min(Date.parse(dayEnd), Math.max(last + pad, axisStart + 60_000));

    return { times, snaps, axisStart, axisEnd, hasContent: interesting.length > 0 };
  }, [events, dayStart, dayEnd]);

  const { times, snaps, axisStart, axisEnd, hasContent } = prepared;

  /* ---- playhead ----
     A new day resets this by the page giving the component a new key, which
     remounts it with fresh state, rather than by an effect that sets state
     when a prop changes. */
  const [t, setT] = useState(axisStart);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [skipQuiet, setSkipQuiet] = useState(true);
  const [showBeats, setShowBeats] = useState(false);
  const tRef = useRef(t);
  // Kept in step from an effect rather than during render, which React's
  // hooks lint forbids. The play loop keeps its own running value and only
  // needs this as the starting point when it begins.
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Index of the last event at or before the playhead.
  const idx = useMemo(() => {
    let lo = 0;
    let hi = times.length - 1;
    let ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= t) {
        ans = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return ans;
  }, [times, t]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let lastFrame = performance.now();
    // A local running value, so a frame that lands before React commits
    // the last setT does not compute from a stale playhead.
    let cur = tRef.current;
    const step = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      let next = cur + dt * speed;

      if (skipQuiet) {
        // Find the next event after the playhead. If it is a long way off,
        // land just before it instead of watching an empty screen.
        let i = 0;
        let lo = 0;
        let hi = times.length - 1;
        let found = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (times[mid] > cur) {
            found = mid;
            hi = mid - 1;
          } else lo = mid + 1;
        }
        i = found;
        if (i >= 0) {
          // Skip over heartbeats when deciding what counts as "something".
          while (i < times.length && events[i].type === "heartbeat") i++;
          if (i < times.length && times[i] - cur > QUIET_GAP_MS) {
            next = Math.max(next, times[i] - 1500);
          }
        }
      }

      if (next >= axisEnd) {
        cur = axisEnd;
        tRef.current = cur;
        setT(axisEnd);
        setPlaying(false);
        return;
      }
      cur = next;
      tRef.current = cur;
      setT(cur);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, skipQuiet, times, events, axisEnd]);

  const snap: Snap =
    idx >= 0 ? snaps[idx] : { screen: "Attract screen", detail: null, sessionId: null, sessionStart: null };

  // Taps that landed in the last moment of virtual time, for the ripples.
  const ripples = useMemo(() => {
    const out: { x: number; y: number; age: number; key: number }[] = [];
    for (let i = idx; i >= 0 && i > idx - 60; i--) {
      const e = events[i];
      const age = t - times[i];
      if (age > RIPPLE_MS) break;
      if (e.type === "tap" && e.x !== null && e.y !== null) {
        out.push({ x: e.x, y: e.y, age, key: e.id });
      }
    }
    return out;
  }, [idx, t, events, times]);

  const visibleLog = useMemo(() => {
    const from = Math.max(0, idx - 14);
    const to = Math.min(events.length, idx + 8);
    return events
      .map((e, i) => ({ e, i }))
      .slice(from, to)
      .filter(({ e }) => showBeats || e.type !== "heartbeat");
  }, [events, idx, showBeats]);

  const span = Math.max(1, axisEnd - axisStart);
  const pctOf = (ms: number) => Math.max(0, Math.min(100, ((ms - axisStart) / span) * 100));

  const jumpToSession = (s: PlaybackSession) => {
    setT(Math.max(axisStart, Date.parse(s.started_at) - 1000));
    setPlaying(true);
  };

  if (!hasContent) {
    return (
      <div className="mt-8 rounded-sm border border-border bg-cream p-8 text-center">
        <p className="font-body text-base text-ink/70">Nothing happened on the screen this day.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* ---- the screen ---- */}
      <div
        className="relative w-full overflow-hidden rounded-sm border border-border bg-cream-dark"
        style={{ aspectRatio: "16 / 9" }}
      >
        {/* the reconstructed state */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
          <div className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/45">
            {snap.sessionId ? "Someone at the screen" : "Nobody at the screen"}
          </div>
          <div className="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl">
            {snap.screen}
          </div>
          {snap.detail ? (
            <div className="mt-3 max-w-[28ch] font-body text-lg text-ink/80">{snap.detail}</div>
          ) : null}
          {snap.sessionStart ? (
            <div className="mt-6 font-body text-sm tabular-nums text-ink/55">
              in for {short(t - snap.sessionStart)}
            </div>
          ) : null}
        </div>

        {/* taps */}
        {ripples.map((r) => {
          const p = r.age / RIPPLE_MS;
          return (
            <div
              key={r.key}
              className="pointer-events-none absolute rounded-full border-2 border-rust"
              style={{
                left: `${r.x * 100}%`,
                top: `${r.y * 100}%`,
                width: `${18 + p * 70}px`,
                height: `${18 + p * 70}px`,
                transform: "translate(-50%, -50%)",
                opacity: 1 - p,
                background: `rgba(196, 93, 62, ${0.45 * (1 - p)})`,
              }}
            />
          );
        })}

        {/* clock */}
        <div className="absolute right-3 top-3 rounded-sm bg-cream/90 px-2.5 py-1 font-body text-sm tabular-nums text-ink">
          {clock(t)}
        </div>
      </div>

      {/* ---- timeline ---- */}
      <div className="mt-4">
        <div className="relative h-8 w-full overflow-hidden rounded-sm border border-border bg-cream">
          {sessions.map((s, i) => {
            const a = pctOf(Date.parse(s.started_at));
            const b = pctOf(Date.parse(s.ended_at));
            return (
              <button
                key={s.session_id ?? i}
                type="button"
                onClick={() => jumpToSession(s)}
                title={`${clock(Date.parse(s.started_at))}, ${short(s.duration_ms)}, ${s.detail_opens} details`}
                className="absolute top-1 h-6 rounded-sm bg-forest/80 transition-colors hover:bg-forest"
                style={{ left: `${a}%`, width: `${Math.max(0.35, b - a)}%` }}
              />
            );
          })}
          <div
            className="pointer-events-none absolute top-0 h-full w-[2px] bg-rust"
            style={{ left: `${pctOf(t)}%` }}
          />
        </div>
        <input
          type="range"
          min={axisStart}
          max={axisEnd}
          step={250}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          className="mt-2 w-full accent-rust"
          aria-label="Scrub through the day"
        />
        <div className="mt-1 flex justify-between font-body text-xs tabular-nums text-ink/50">
          <span>{clock(axisStart)}</span>
          <span>{clock(axisEnd)}</span>
        </div>
      </div>

      {/* ---- controls ---- */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (t >= axisEnd) setT(axisStart);
            setPlaying((p) => !p);
          }}
          className="rounded-sm bg-rust px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          {playing ? "Pause" : t >= axisEnd ? "Replay" : "Play"}
        </button>
        <div className="flex overflow-hidden rounded-sm border border-border">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-3 py-2 font-body text-sm tabular-nums ${
                speed === s ? "bg-forest text-cream" : "bg-cream text-ink/70 hover:bg-cream-dark"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-body text-sm text-ink/70">
          <input
            type="checkbox"
            checked={skipQuiet}
            onChange={(e) => setSkipQuiet(e.target.checked)}
            className="accent-forest"
          />
          Skip quiet stretches
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-ink/70">
          <input
            type="checkbox"
            checked={showBeats}
            onChange={(e) => setShowBeats(e.target.checked)}
            className="accent-forest"
          />
          Show heartbeats
        </label>
        <span className="ml-auto font-body text-sm text-ink/55">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"},{" "}
          {events.filter((e) => e.type !== "heartbeat").length} events
        </span>
      </div>

      {/* ---- the log ---- */}
      <div className="mt-6 rounded-sm border border-border bg-cream">
        <ul className="divide-y divide-border">
          {visibleLog.map(({ e, i }) => {
            const isNow = i === idx;
            const past = i < idx;
            return (
              <li
                key={e.id}
                className={`flex items-baseline gap-4 px-4 py-2 font-body text-sm ${
                  isNow ? "bg-cream-dark" : ""
                } ${past ? "text-ink/45" : isNow ? "text-ink" : "text-ink/70"}`}
              >
                <span className="w-24 shrink-0 tabular-nums">{clock(times[i])}</span>
                <span className={isNow ? "font-semibold text-forest" : ""}>{describe(e)}</span>
                {e.type === "tap" && e.x !== null && e.y !== null ? (
                  <span className="ml-auto tabular-nums text-ink/40">
                    {Math.round(e.x * 100)}%, {Math.round(e.y * 100)}%
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
