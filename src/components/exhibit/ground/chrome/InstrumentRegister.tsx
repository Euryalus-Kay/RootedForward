"use client";
/* ------------------------------------------------------------------ */
/*  The Instrument Register, the exhibit's thesis graphic. Five bars   */
/*  on one 1900 to 2026 axis with true dates from machines.json.       */
/*                                                                     */
/*  Docked mode (R10 rebuild) is a legible strip riding under the      */
/*  Stage: a year rail with decade hairlines and labeled ticks, five   */
/*  full-span ink lanes with boxed initials, THE UNION BAND (the       */
/*  computed boolean union of the five true intervals, one darker bar  */
/*  carrying the no-year-off label), and an ink caret riding the       */
/*  story's year that turns rust only at 2026, because rust means      */
/*  present day. The whole strip is a link to the register wall.       */
/*  Below 480px the lanes hide and the union band carries the read.    */
/*                                                                     */
/*  Wall mode keeps the studied five-row layout and adds the baton-    */
/*  pass verticals (each closure drops a hairline to a bar actually    */
/*  running that year, guarded in code against false handoffs), the    */
/*  union band printing itself on first arrival, and an sr-only        */
/*  sentence stating the union claim in words. Court defeats end bars  */
/*  with dated annotations; the axis runs to 2026 because the ground   */
/*  is still moving.                                                   */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import { allMachines } from "@/lib/exhibit/machines";
import type { MachineDef } from "@/lib/exhibit/types";
import { machineTitle } from "../legacy";
import { useGround } from "../engine/GroundProvider";
import { SourceSupGroup } from "../../shared/SourceSup";

const AXIS_START = 1900;
const AXIS_END = 2026;
const SPAN = AXIS_END - AXIS_START;

/** which chapter anchor each instrument's story lives at */
const CHAPTER_OF: Record<string, string> = {
  code: "ch5",
  deed: "ch5",
  map: "ch6",
  bulldozer: "ch8",
  contract: "ch9",
};
/** the order the bars stack, first written to last */
const ORDER = ["code", "deed", "map", "bulldozer", "contract"];
/** one-letter marks at each bar's left edge in the docked strip */
const INITIAL_OF: Record<string, string> = {
  code: "R", // the realtors' rule
  deed: "C", // restrictive covenants
  map: "M", // the map (redlining)
  bulldozer: "U", // urban renewal
  contract: "S", // contract selling
};
/** dated end annotations where a court or a repeal stopped an instrument */
const END_NOTES: Record<string, { text: string; at: number }> = {
  deed: { text: "unenforceable 1948", at: 1948 },
  code: { text: "written out 1950", at: 1950 },
  map: { text: "outlawed 1968", at: 1968 },
  contract: { text: "returned after 2008", at: 2008 },
};

/*  The four baton passes, closure handed to an instrument still
    running. Only the pairing is written here; the drop year comes
    from the dying machine's true offYear, and the guard below refuses
    any baton whose receiving bar was not actually running that year,
    so a data change can never draw a false handoff. */
const BATON_PASSES: Array<{ from: string; to: string }> = [
  { from: "deed", to: "map" }, // covenants hand to redlining
  { from: "code", to: "map" }, // the realtors' rule hands to redlining
  { from: "map", to: "bulldozer" }, // redlining hands to urban renewal
  { from: "contract", to: "bulldozer" }, // contract selling hands to urban renewal
];

/*  Labeled tick years on the docked rail (R10 spec). 1900, 2000 and
    2026 are axis furniture; the middle three are machine dates and
    only print while the data still carries them. */
const LABEL_TICK_YEARS = [1900, 1921, 1948, 1970, 2000, 2026];
const AXIS_FURNITURE_YEARS = new Set([1900, 2000, 2026]);

function pct(year: number): number {
  return ((year - AXIS_START) / SPAN) * 100;
}

/** boolean union of the five true [onYear, offYear ?? 2026] intervals;
    spans that touch or overlap by year merge, gaps stay gaps */
function unionSpans(machines: MachineDef[]): Array<[number, number]> {
  const spans = machines
    .map((m) => [m.onYear, m.offYear ?? AXIS_END] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [on, off] of spans) {
    const last = merged[merged.length - 1];
    if (last && on <= last[1] + 1) {
      last[1] = Math.max(last[1], off);
    } else {
      merged.push([on, off]);
    }
  }
  return merged;
}

/* module-memoized so the array identity is stable across renders
   (the wall's measurement effect depends on it) */
let ORDERED_CACHE: MachineDef[] | null = null;
function orderedMachines(): MachineDef[] {
  if (!ORDERED_CACHE) {
    const rank = (id: string) => {
      const i = ORDER.indexOf(id);
      return i === -1 ? ORDER.length : i;
    };
    ORDERED_CACHE = [...allMachines()].sort((a, b) => rank(a.machineId) - rank(b.machineId));
  }
  return ORDERED_CACHE;
}

export function useOrderedMachines() {
  return orderedMachines();
}

/* ---- the docked strip ---------------------------------------------- */

function DockedStrip() {
  const { cursorYear } = useGround();
  const machines = useOrderedMachines();
  const union = unionSpans(machines);
  const cursorAt = pct(Math.max(AXIS_START, Math.min(AXIS_END, cursorYear)));
  const atNow = cursorYear >= AXIS_END;

  /* only label a machine date while the data still carries it */
  const machineYears = new Set(machines.flatMap((m) => [m.onYear, m.offYear ?? AXIS_END]));
  const labeledYears = LABEL_TICK_YEARS.filter(
    (y) => AXIS_FURNITURE_YEARS.has(y) || machineYears.has(y)
  );
  /* decade hairlines, skipping any decade a labeled tick already marks */
  const minorDecades: number[] = [];
  for (let y = AXIS_START; y <= AXIS_END; y += 10) {
    if (labeledYears.every((ly) => Math.abs(ly - y) > 3)) minorDecades.push(y);
  }

  /* initials sit just left of their bar's start; when two nearby
     lanes start the same year (urban renewal and contract selling,
     both 1952) the later letter steps one slot further left */
  const initialShift = machines.map((m, i) => {
    let s = 0;
    for (let j = 0; j < i; j++) {
      if (Math.abs(machines[j].onYear - m.onYear) < 5 && Math.abs(j - i) <= 1) s += 1;
    }
    return s;
  });

  return (
    <a
      href="#a2-register"
      className="ground-register-docked"
      data-testid="ground-register"
      data-now={atNow ? "on" : "off"}
      aria-label={`Instrument register, five instruments on one timeline, ${AXIS_START} to ${AXIS_END}. From 1921 to 1970 no year passed with every instrument off. The story is at ${cursorYear}. Jump to the full register.`}
    >
      <span className="gr-track" aria-hidden="true">
        {machines.map((m, i) => (
          <span
            key={m.machineId}
            className="gr-lane"
            style={{ top: `calc(var(--grd-lane0) + ${i} * var(--grd-lane-pitch))` }}
          >
            <span
              className="gr-init exh-plat"
              style={{
                left: `${pct(m.onYear)}%`,
                transform: `translateX(calc(-100% - ${5 + initialShift[i] * 13}px))`,
              }}
              title={m.plainName}
            >
              {INITIAL_OF[m.machineId] ?? m.plainName.slice(0, 1)}
            </span>
            <span
              className="gr-bar"
              title={`${m.plainName}, ${m.onYear} to ${m.offYear ?? "now"}`}
              data-live={cursorYear >= m.onYear && cursorYear <= (m.offYear ?? AXIS_END) ? "on" : "off"}
              style={{
                left: `${pct(m.onYear)}%`,
                width: `${pct(m.offYear ?? AXIS_END) - pct(m.onYear)}%`,
              }}
            />
          </span>
        ))}
        <span className="gr-uband">
          {union.map(([on, off]) => (
            <span
              key={on}
              className="gr-ubseg"
              style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
            />
          ))}
          {/* the plate rides inside the band at its right end, clear of
              the 1952 initials and of the caret through the story years */}
          <span
            className="gr-ublabel exh-plat"
            style={{ right: `calc(${100 - pct(union[union.length - 1]?.[1] ?? AXIS_END)}% + 8px)` }}
          >
            NO YEAR OFF, 1921 TO 1970
          </span>
        </span>
        <span className="gr-baseline" />
        {minorDecades.map((y) => (
          <span key={y} className="gr-tickline" style={{ left: `${pct(y)}%` }} />
        ))}
        {labeledYears.map((y) => (
          <span key={`l${y}`} className="gr-tickline" data-major="on" style={{ left: `${pct(y)}%` }} />
        ))}
        {labeledYears.map((y) => (
          <span key={y} className="gr-tick exh-plat" data-year={y} style={{ left: `${pct(y)}%` }}>
            {y}
          </span>
        ))}
        <span className="gr-cursor" style={{ left: `${cursorAt}%` }} />
        <span
          className="gr-yearfig exh-mono"
          style={{ left: `clamp(16px, ${cursorAt}%, calc(100% - 16px))` }}
        >
          {cursorYear}
        </span>
      </span>
    </a>
  );
}

/* ---- the register wall ---------------------------------------------- */

interface BatonLine {
  x: number;
  top: number;
  height: number;
  dir: "down" | "up";
}

function RegisterWall() {
  const machines = useOrderedMachines();
  const union = unionSpans(machines);
  const relayRef = useRef<HTMLDivElement | null>(null);
  const bandRef = useRef<HTMLDivElement | null>(null);
  const [batons, setBatons] = useState<BatonLine[]>([]);
  const [printed, setPrinted] = useState(false);

  /* measure the baton drops against the rendered bars; the year guard
     refuses any handoff to a bar not running at the closure date */
  useEffect(() => {
    const host = relayRef.current;
    if (!host) return;
    const measure = () => {
      const rect = host.getBoundingClientRect();
      const next: BatonLine[] = [];
      for (const pass of BATON_PASSES) {
        const from = machines.find((m) => m.machineId === pass.from);
        const to = machines.find((m) => m.machineId === pass.to);
        if (!from || !to || from.offYear == null) continue;
        const year = from.offYear;
        if (year < to.onYear || year > (to.offYear ?? AXIS_END)) continue;
        const fromEl = host.querySelector<HTMLElement>(`.gr-wall-bar[data-instrument="${pass.from}"]`);
        const toEl = host.querySelector<HTMLElement>(`.gr-wall-bar[data-instrument="${pass.to}"]`);
        if (!fromEl || !toEl) continue;
        const a = fromEl.getBoundingClientRect();
        const b = toEl.getBoundingClientRect();
        const x = a.right - rect.left;
        if (b.top >= a.bottom) {
          next.push({ x, top: a.bottom - rect.top, height: b.top - a.bottom, dir: "down" });
        } else if (a.top >= b.bottom) {
          next.push({ x, top: b.bottom - rect.top, height: a.top - b.bottom, dir: "up" });
        }
      }
      setBatons((prev) => {
        const same =
          prev.length === next.length &&
          prev.every(
            (p, i) =>
              p.x === next[i].x &&
              p.top === next[i].top &&
              p.height === next[i].height &&
              p.dir === next[i].dir
          );
        return same ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, [machines]);

  /* the union band prints itself once, on first arrival in view */
  useEffect(() => {
    if (printed) return;
    const el = bandRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPrinted(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [printed]);

  const allFactRefs = [...new Set(machines.flatMap((m) => m.evidenceFactRefs))];
  const unionWords = union
    .map(([on, off]) => `${on} to ${off === AXIS_END ? "now" : off}`)
    .join(", then ");

  return (
    <figure className="ground-register-wall" data-testid="ground-register-wall">
      <figcaption className="gr-wall-title exh-plat">
        Five instruments, one relay
        <SourceSupGroup factIds={allFactRefs} />
      </figcaption>
      <div className="gr-wall-axis exh-mono" aria-hidden="true">
        {[1900, 1920, 1940, 1960, 1980, 2000, 2026].map((y) => (
          <span key={y} style={{ left: `${pct(y)}%` }}>
            {y}
          </span>
        ))}
      </div>
      <div className="gr-wall-relay" ref={relayRef}>
        <ul className="gr-wall-rows">
          {machines.map((m) => (
            <li key={m.machineId} className="gr-wall-row">
              <a href={`#${CHAPTER_OF[m.machineId] ?? "ch0"}`} className="gr-wall-label">
                {/* the letter the docked strip rides under the map; taught
                    here, at the one moment the visitor studies the wall */}
                <span className="gr-wall-initial exh-plat" aria-hidden="true">
                  {INITIAL_OF[m.machineId] ?? ""}
                </span>
                <span className="gr-wall-name">{m.plainName}</span>
                <span className="gr-wall-alias exh-mono">{machineTitle(m).toLowerCase()}</span>
              </a>
              <div className="gr-wall-track">
                <span
                  className="gr-wall-bar"
                  data-instrument={m.machineId}
                  style={{
                    left: `${pct(m.onYear)}%`,
                    width: `${pct(m.offYear ?? AXIS_END) - pct(m.onYear)}%`,
                  }}
                />
                <span className="gr-wall-years exh-mono" style={{ left: `${pct(m.onYear)}%` }}>
                  {m.onYear} to {m.offYear ?? "now"}
                </span>
                {END_NOTES[m.machineId] ? (
                  <span
                    className="gr-wall-endnote exh-mono"
                    style={
                      END_NOTES[m.machineId].at >= 1985
                        ? { right: `${100 - pct(END_NOTES[m.machineId].at)}%` }
                        : { left: `${pct(END_NOTES[m.machineId].at)}%` }
                    }
                  >
                    {END_NOTES[m.machineId].text}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {batons.map((b, i) => (
          <span
            key={i}
            className="gr-wall-baton"
            data-dir={b.dir}
            aria-hidden="true"
            style={{ left: `${b.x}px`, top: `${b.top}px`, height: `${b.height}px` }}
          />
        ))}
      </div>
      <div
        className="gr-wall-union"
        data-testid="gr-wall-union"
        data-printed={printed ? "on" : "off"}
        ref={bandRef}
        aria-hidden="true"
      >
        {union.map(([on, off]) => (
          <span
            key={on}
            className="gr-wall-ubseg"
            style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
          />
        ))}
        <span
          className="gr-wall-ublabel exh-plat"
          style={{ left: `calc(${pct(union[0]?.[0] ?? AXIS_START)}% + 10px)` }}
        >
          NO YEAR OFF, 1921 TO 1970
        </span>
      </div>
      <p className="sr-only">
        Taken together the five spans cover {unionWords} with no year uncovered. From 1921 to 1970
        no year passed with every instrument off.
      </p>
      <p className="gr-wall-note">
        From 1921 to 1970 there was <strong>no year the machinery was off</strong>. When a court
        closed one instrument, another was already running.
      </p>
    </figure>
  );
}

export default function InstrumentRegister({ mode }: { mode: "docked" | "wall" }) {
  return mode === "docked" ? <DockedStrip /> : <RegisterWall />;
}
