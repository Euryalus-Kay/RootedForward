"use client";
/* ------------------------------------------------------------------ */
/*  The Instrument Register, the exhibit's thesis graphic. Five bars   */
/*  on one 1900 to 2026 axis with true dates from machines.json.       */
/*                                                                     */
/*  Docked mode (R11 remake) is a real chart, not a strip: a title     */
/*  line (FIVE INSTRUMENTS, ONE RELAY) with the live year figure       */
/*  prominent at the right, a left name rail carrying the five short   */
/*  instrument names in plat caps (RULE, DEED, MAP, RENEWAL,           */
/*  CONTRACT), five full-span ink lanes, a labeled axis with decade    */
/*  hairlines beneath them, and THE UNION BAND at the foot (the        */
/*  computed boolean union of the five true intervals, split at the    */
/*  last closure year into a solid bar carrying the no-year-off label  */
/*  and a hatched open continuation for whatever still runs). An ink   */
/*  caret spans lanes and band with a year chip at its top; caret,     */
/*  chip and figure turn rust only at 2026, because rust means         */
/*  present day. The whole dock is a link to the register wall.        */
/*  Below 480px the lanes and rail yield, the union band carries the   */
/*  read at full size, and a chevron marks the dock as a tap.          */
/*                                                                     */
/*  Wall mode keeps the studied five-row layout and adds the baton-    */
/*  pass verticals (each closure drops a hairline to a bar actually    */
/*  running that year, guarded in code against false handoffs), the    */
/*  union band printing itself on first arrival, and an sr-only        */
/*  sentence stating the union claim in words. Court defeats end bars  */
/*  with dated annotations; the axis runs to 2026 because the ground   */
/*  is still moving.                                                   */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
/** one-letter marks taught on the wall's row labels */
const INITIAL_OF: Record<string, string> = {
  code: "R", // the realtors' rule
  deed: "C", // restrictive covenants
  map: "M", // the map (redlining)
  bulldozer: "U", // urban renewal
  contract: "S", // contract selling
};
/** short plat-caps names on the dock's left rail, one per lane */
const SHORT_NAME: Record<string, string> = {
  code: "RULE",
  deed: "DEED",
  map: "MAP",
  bulldozer: "RENEWAL",
  contract: "CONTRACT",
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

/*  The drawn union splits at the last closure year (the largest
    offYear among the ended instruments, computed from machines.json,
    never hardcoded). Solid ink carries the no-year-off claim only up
    to that year; whatever runs past it is drawn as an open, hatched
    continuation, so the drawn mass ends exactly where the label says
    it does (R10 audit, wall-bar-overrun). The continuation exists only
    while some machine's offYear is null or reaches the axis end. */
interface UnionDrawing {
  solid: Array<[number, number]>;
  open: Array<[number, number]>;
  splitYear: number;
  running: MachineDef[];
}
function splitUnion(machines: MachineDef[]): UnionDrawing {
  const union = unionSpans(machines);
  const ended = machines.filter((m) => m.offYear != null && m.offYear < AXIS_END);
  const running = machines.filter((m) => m.offYear == null || m.offYear >= AXIS_END);
  const splitYear = ended.length
    ? Math.max(...ended.map((m) => m.offYear as number))
    : AXIS_END;
  const solid: Array<[number, number]> = [];
  const open: Array<[number, number]> = [];
  for (const [on, off] of union) {
    if (running.length > 0 && off > splitYear) {
      if (on < splitYear) solid.push([on, splitYear]);
      open.push([Math.max(on, splitYear), off]);
    } else {
      solid.push([on, off]);
    }
  }
  return { solid, open, splitYear, running };
}

function solidLabelText(solid: Array<[number, number]>): string {
  const first = solid[0];
  const last = solid[solid.length - 1];
  return first && last ? `NO YEAR OFF, ${first[0]} TO ${last[1]}` : "";
}

/* plat-caps count words for the open continuation's label */
const COUNT_WORDS = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];
function countWord(n: number): string {
  return COUNT_WORDS[n - 1] ?? String(n);
}

/*  Instruments whose residue is the instrument itself returning to the
    market, drawn on the wall as an open segment from residueSince to
    the axis end. The year is structured data (residueSince on the
    contract entry in machines.json, which also carries the sourcing
    evidence ref, contracts.post_2008_return). This set only names
    which residue means a return, because the deed's dead language and
    the map's grade lines linger without the instrument running. */
const RETURN_OF = new Set(["contract"]);

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
  const { solid, open, splitYear, running } = splitUnion(machines);
  const cursorAt = pct(Math.max(AXIS_START, Math.min(AXIS_END, cursorYear)));
  const atNow = cursorYear >= AXIS_END;
  /* years before the rail's start get no caret; the year chip stands
     alone, flush left, instead of clamping three different years onto
     the 1900 tick (R10 audit, mobile-caret-clamp) */
  const preRail = cursorYear < AXIS_START;
  const runNames = running.map((m) => m.plainName.toLowerCase()).join(" and ");
  const runningSentence = running.length
    ? ` ${running.length === 1 ? "One instrument" : "Instruments"}, ${runNames}, ${
        running.length === 1 ? "has" : "have"
      } never switched off and still ${running.length === 1 ? "runs" : "run"} today.`
    : "";

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

  /* the band caret cuts a linen notch while it rides the solid ink */
  const onSolid =
    solid.length > 0 && cursorYear >= solid[0][0] && cursorYear <= splitYear && !atNow;
  const segMid = ([on, off]: [number, number]) => (pct(on) + pct(off)) / 2;

  return (
    <a
      href="#a2-register"
      className="ground-register-docked"
      data-testid="ground-register"
      data-now={atNow ? "on" : "off"}
      data-prerail={preRail ? "on" : "off"}
      aria-label={`Instrument register, five instruments on one timeline, ${AXIS_START} to ${AXIS_END}. From ${
        solid[0]?.[0] ?? AXIS_START
      } to ${splitYear} no year passed with every instrument off.${runningSentence} The story is at ${cursorYear}. Jump to the full register.`}
    >
      <span className="grx-track" aria-hidden="true">
        <span className="grx-title exh-plat">Five instruments, one relay</span>
        <span className="grx-fig exh-mono">{cursorYear}</span>
        <span className="grx-rail exh-plat">
          {machines.map((m, i) => (
            <span
              key={m.machineId}
              className="grx-name"
              title={m.plainName}
              style={{ top: `calc(var(--grx-lane0) + ${i} * var(--grx-pitch))` }}
            >
              {SHORT_NAME[m.machineId] ?? m.plainName}
            </span>
          ))}
        </span>
        <span className="grx-chart">
          {machines.map((m, i) => (
            <span
              key={m.machineId}
              className="grx-bar"
              title={`${m.plainName}, ${m.onYear} to ${m.offYear ?? "now"}`}
              data-live={cursorYear >= m.onYear && cursorYear <= (m.offYear ?? AXIS_END) ? "on" : "off"}
              style={{
                top: `calc(var(--grx-lane0) + ${i} * var(--grx-pitch))`,
                left: `${pct(m.onYear)}%`,
                width: `${pct(m.offYear ?? AXIS_END) - pct(m.onYear)}%`,
              }}
            />
          ))}
          <span className="grx-baseline" />
          {minorDecades.map((y) => (
            <span key={y} className="grx-tickline" style={{ left: `${pct(y)}%` }} />
          ))}
          {labeledYears.map((y) => (
            <span key={`l${y}`} className="grx-tickline" data-major="on" style={{ left: `${pct(y)}%` }} />
          ))}
          {labeledYears.map((y) => (
            <span key={y} className="grx-tick exh-plat" data-year={y} style={{ left: `${pct(y)}%` }}>
              {y}
            </span>
          ))}
          <span className="grx-band">
            {solid.map(([on, off]) => (
              <span
                key={`s${on}`}
                className="grx-ubseg"
                style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
              />
            ))}
            {open.map(([on, off]) => (
              <span
                key={`o${on}`}
                className="grx-ubseg"
                data-open="on"
                style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
              />
            ))}
            {/* each label sits inside its own drawn mass: linen type on
                the solid ink, an ink plate over the open hatch, so the
                dark mass still ends exactly where the claim ends */}
            {solid.length ? (
              <span
                className="grx-ublabel exh-plat"
                style={{ left: `${segMid(solid[solid.length - 1])}%` }}
              >
                {solidLabelText(solid)}
              </span>
            ) : null}
            {open.length ? (
              <span
                className="grx-ublabel exh-plat"
                data-open="on"
                style={{ left: `${segMid(open[open.length - 1])}%` }}
              >
                {countWord(running.length)} STILL RUNNING
              </span>
            ) : null}
          </span>
          <span className="grx-caret" style={{ left: `${cursorAt}%` }} />
          <span
            className="grx-caret"
            data-seg="band"
            data-onsolid={onSolid ? "on" : "off"}
            style={{ left: `${cursorAt}%` }}
          />
          <span
            className="grx-chip exh-mono"
            style={{ left: `clamp(18px, ${cursorAt}%, calc(100% - 18px))` }}
          >
            {cursorYear}
          </span>
          {/* phone-only affordance so the dock reads as a tap, not a
              static graphic (R10 audit, dock-tap-hint); sits in the
              right margin where the year chip can never reach */}
          <span className="grx-taphint" aria-hidden="true">
            {"›"}
          </span>
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
  const { solid, open, splitYear, running } = splitUnion(machines);
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
        /* nudged a few pixels into the bar's own ink so the vertical
           drops in clear space, not through the end-anchored court
           annotations (R10 audit, wall-annotation-collisions) */
        const x = a.right - rect.left - 4;
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
                {/* the return of the trade, drawn: an open segment from
                    residueSince to the axis end, same hatch language as
                    the union continuation, so "returned after 2008" no
                    longer floats with nothing drawn (R10 audit,
                    s-row-2008-undrawn); the year and its sourcing live
                    in machines.json */}
                {RETURN_OF.has(m.machineId) && m.residueSince != null ? (
                  <span
                    className="gr-wall-return"
                    data-testid="gr-wall-return"
                    aria-hidden="true"
                    style={{
                      left: `${pct(m.residueSince)}%`,
                      width: `${pct(AXIS_END) - pct(m.residueSince)}%`,
                    }}
                  />
                ) : null}
                <span className="gr-wall-years exh-mono" style={{ left: `${pct(m.onYear)}%` }}>
                  {m.onYear} to {m.offYear ?? "now"}
                </span>
                {END_NOTES[m.machineId] ? (
                  <span
                    className="gr-wall-endnote exh-mono"
                    data-side={END_NOTES[m.machineId].at >= 1985 ? "right" : "left"}
                    style={
                      {
                        "--gr-note-x": `${pct(END_NOTES[m.machineId].at)}%`,
                        /* the phone layout right-aligns each phrase under
                           the end of the ink it annotates (the return
                           segment's end when one is drawn) */
                        "--gr-note-right": `${
                          100 -
                          pct(
                            RETURN_OF.has(m.machineId) && m.residueSince != null
                              ? AXIS_END
                              : (m.offYear ?? AXIS_END)
                          )
                        }%`,
                      } as CSSProperties
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
        {solid.map(([on, off]) => (
          <span
            key={`s${on}`}
            className="gr-wall-ubseg"
            style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
          />
        ))}
        {open.map(([on, off]) => (
          <span
            key={`o${on}`}
            className="gr-wall-ubseg"
            data-open="on"
            style={{ left: `${pct(on)}%`, width: `${pct(off) - pct(on)}%` }}
          />
        ))}
        <span
          className="gr-wall-ublabel exh-plat"
          data-open="off"
          style={
            {
              "--gr-lx": `calc(${pct(solid[0]?.[0] ?? AXIS_START)}% + 10px)`,
              "--gr-sx": `${pct(solid[0]?.[0] ?? AXIS_START)}%`,
            } as CSSProperties
          }
        >
          {solidLabelText(solid)}
        </span>
        {open.length ? (
          <span
            className="gr-wall-ublabel exh-plat"
            data-open="on"
            style={{ "--gr-lx": `calc(${pct(splitYear)}% + 10px)` } as CSSProperties}
          >
            {countWord(running.length)} INSTRUMENT{running.length === 1 ? "" : "S"} STILL RUNNING
          </span>
        ) : null}
      </div>
      <p className="sr-only">
        Taken together the five spans cover {unionWords} with no year uncovered. The solid band
        marks {solid[0]?.[0] ?? AXIS_START} to {splitYear}, when no year passed with every
        instrument off.
        {running.length > 0
          ? ` An open band continues from ${splitYear} to now, because ${running
              .map((m) => m.plainName.toLowerCase())
              .join(" and ")} never switched off.`
          : ""}
      </p>
      <p className="gr-wall-note">
        From {solid[0]?.[0] ?? AXIS_START} to {splitYear} there was{" "}
        <strong>no year the machinery was off</strong>. When a court closed one instrument, another
        was already running.
      </p>
    </figure>
  );
}

export default function InstrumentRegister({ mode }: { mode: "docked" | "wall" }) {
  return mode === "docked" ? <DockedStrip /> : <RegisterWall />;
}
