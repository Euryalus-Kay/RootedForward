"use client";
/* ------------------------------------------------------------------ */
/*  The Lens, the CH6 pause point. The citywide 1940 HOLC map in full  */
/*  color with a circular magnifier the visitor drags anywhere         */
/*  (pointer, or arrow keys at 10px and Shift+arrows at 40px). The     */
/*  area under the lens center resolves by point-in-polygon against    */
/*  the citywide rings (bounding boxes first) and the readout card     */
/*  shows its grade plus the VERBATIM surveyor excerpt from            */
/*  holc-descriptions.json, behind a period-language warning chip.     */
/*  A hold-to-look switch dims every area to near black; nothing       */
/*  remains lit, which is the point. Completes after the lens has      */
/*  resolved two areas and the switch has been used once.              */
/* ------------------------------------------------------------------ */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { ringsBBox, type BBox, type RingPoints } from "@/lib/exhibit/map/projection";
import { useHolcFrames, type HolcArea } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import HolcLayer from "@/components/exhibit/map/layers/HolcLayer";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";

/* ------- runtime-fetched surveyor descriptions, module cached ------- */
/* Mirrors the useExhibitMapData pattern; a missing file resolves to    */
/* null and the readout falls back to its no-sheet line.                */

const DESCRIPTIONS_URL = "/exhibit-data/holc-descriptions.json";

interface DescArea {
  areaId: number | string;
  grade: string;
  name?: string | null;
  excerpt: string;
  excerptField?: string;
  excerptLabel?: string;
}

interface DescDoc {
  attribution?: string;
  areas: DescArea[];
}

interface DescCache {
  promise: Promise<void>;
  data: DescDoc | null;
  error: string | null;
  done: boolean;
}

let descCache: DescCache | null = null;

function loadDescriptions(): DescCache {
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

function useHolcDescriptions(): { data: DescDoc | null; done: boolean } {
  const [state, setState] = useState<{ data: DescDoc | null; done: boolean }>(() => {
    if (typeof window !== "undefined" && descCache?.done) {
      return { data: descCache.data, done: true };
    }
    return { data: null, done: false };
  });
  useEffect(() => {
    let alive = true;
    const entry = loadDescriptions();
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

/* ---------------- geometry ---------------- */

/** even-odd point-in-rings test (outer rings plus holes) */
function pointInRings(x: number, y: number, rings: RingPoints[]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

interface IndexedArea {
  area: HolcArea;
  rings: RingPoints[];
  bb: BBox;
}

const LENS_PX = 150;
const STEP_PX = 10;
const STEP_SHIFT_PX = 40;
/** where the lens rests before the visitor touches it */
const START_POS = { x: 46, y: 40 };
/** excerpts this short are digitization junk ("N/A"), not surveyor prose */
const MIN_EXCERPT_CHARS = 12;

const GRADE_WORD: Record<string, string> = {
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
  D: "Grade D",
};

/** small legend swatch matching the stage's grade encoding */
function GradeSwatch({ grade }: { grade: string }) {
  const size = 18;
  let tint = "var(--color-exh-ink)";
  let tintOpacity = 0.1;
  let marks: ReactNode = null;
  if (grade === "A") {
    tint = "#7A8B6F";
    tintOpacity = 0.25;
    marks = (
      <>
        <circle cx={5} cy={5} r={1.8} fill="#7A8B6F" fillOpacity={0.6} />
        <circle cx={13} cy={13} r={1.8} fill="#7A8B6F" fillOpacity={0.6} />
      </>
    );
  } else if (grade === "B") {
    tint = "var(--color-exh-blue)";
    tintOpacity = 0.25;
    marks = (
      <g stroke="var(--color-exh-blue)" strokeOpacity={0.55} strokeWidth={1.4}>
        <line x1={-4} y1={10} x2={10} y2={-4} />
        <line x1={4} y1={20} x2={20} y2={4} />
      </g>
    );
  } else if (grade === "C") {
    tint = "var(--color-exh-gold)";
    tintOpacity = 0.25;
    marks = (
      <g stroke="var(--color-exh-gold)" strokeOpacity={0.55} strokeWidth={1.4}>
        <line x1={-4} y1={10} x2={10} y2={-4} />
        <line x1={4} y1={20} x2={20} y2={4} />
        <line x1={8} y1={-4} x2={22} y2={10} />
        <line x1={-4} y1={8} x2={10} y2={22} />
      </g>
    );
  } else if (grade === "D") {
    tint = "var(--color-exh-red)";
    tintOpacity = 0.3;
    marks = (
      <g stroke="var(--color-exh-red)" strokeOpacity={0.6} strokeWidth={1.8}>
        <line x1={-4} y1={4} x2={14} y2={22} />
        <line x1={0} y1={-2} x2={20} y2={18} />
        <line x1={6} y1={-4} x2={24} y2={14} />
      </g>
    );
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 rounded-[2px] border border-exh-ink/40"
    >
      <rect width={size} height={size} fill={tint} fillOpacity={tintOpacity} />
      {marks}
    </svg>
  );
}

export default function HolcLens() {
  const api = useInteractive();
  const holcState = useHolcFrames();
  const holc = holcState.data;
  const desc = useHolcDescriptions();

  /** lens center as a percentage of the stage box */
  const [pos, setPos] = useState(START_POS);
  const [holdOn, setHoldOn] = useState(false);
  const [toggledOnce, setToggledOnce] = useState(false);
  const [moved, setMoved] = useState(false);
  const [visited, setVisited] = useState<(number | string)[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  /* ---------------- area index and resolution ---------------- */

  const indexed = useMemo<IndexedArea[]>(() => {
    if (!holc?.areas?.length) return [];
    const out: IndexedArea[] = [];
    for (const area of holc.areas) {
      const rings = area.rings?.citywide;
      if (!rings?.length) continue;
      out.push({ area, rings, bb: ringsBBox(rings) });
    }
    return out;
  }, [holc]);

  const resolveAt = useCallback(
    (xPct: number, yPct: number): HolcArea | null => {
      const rx = (xPct / 100) * VIEW_W;
      const ry = (yPct / 100) * VIEW_H;
      for (const { area, rings, bb } of indexed) {
        if (rx < bb.minX || rx > bb.maxX || ry < bb.minY || ry > bb.maxY) continue;
        if (pointInRings(rx, ry, rings)) return area;
      }
      return null;
    },
    [indexed]
  );

  const hit = useMemo<HolcArea | null>(() => resolveAt(pos.x, pos.y), [resolveAt, pos]);

  /** visits are recorded from the movement handlers, never in an effect */
  const recordVisit = useCallback(
    (xPct: number, yPct: number) => {
      const area = resolveAt(xPct, yPct);
      if (area == null) return;
      setVisited((prev) => (prev.includes(area.id) ? prev : [...prev, area.id]));
    },
    [resolveAt]
  );

  /* the area under the lens's resting position counts as seen too; it is
     derived, so a late-loading data file never needs a state write */
  const startArea = useMemo(() => resolveAt(START_POS.x, START_POS.y), [resolveAt]);
  const visitedCount =
    startArea != null && !visited.includes(startArea.id) ? visited.length + 1 : visited.length;

  const descById = useMemo(() => {
    const m = new Map<string, DescArea>();
    for (const a of desc.data?.areas ?? []) m.set(String(a.areaId), a);
    return m;
  }, [desc.data]);

  const hitDesc = hit ? descById.get(String(hit.id)) : undefined;
  const excerptUsable = Boolean(
    hitDesc && hitDesc.excerpt.trim().length >= MIN_EXCERPT_CHARS && hitDesc.excerpt.trim() !== "N/A"
  );

  /* completion: two areas under the lens plus one use of the switch;
     if the map data never arrives, moving the lens at all stands in
     for area resolution so the tour cannot dead-end */
  const mapReady = indexed.length > 0;
  useEffect(() => {
    const lensCondition = mapReady ? visitedCount >= 2 : moved && holcState.loading === false;
    if (toggledOnce && lensCondition) complete();
  }, [toggledOnce, visitedCount, moved, mapReady, holcState.loading, complete]);

  /* ---------------- lens movement ---------------- */

  const moveToClient = useCallback(
    (clientX: number, clientY: number) => {
      const box = stageRef.current?.getBoundingClientRect();
      if (!box || box.width === 0 || box.height === 0) return;
      const x = Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100));
      const y = Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100));
      setPos({ x, y });
      setMoved(true);
      recordVisit(x, y);
    },
    [recordVisit]
  );

  const onStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // ignore the hold switch and other controls; the stage wrapper only
    // contains the map and the lens, both fair game
    draggingRef.current = true;
    api.onInteraction();
    moveToClient(e.clientX, e.clientY);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingRef.current) moveToClient(e.clientX, e.clientY);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [moveToClient]);

  const onLensKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? STEP_SHIFT_PX : STEP_PX;
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = -step;
    else if (e.key === "ArrowRight") dx = step;
    else if (e.key === "ArrowUp") dy = -step;
    else if (e.key === "ArrowDown") dy = step;
    else return;
    e.preventDefault();
    const box = stageRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    api.onInteraction();
    setMoved(true);
    const next = {
      x: Math.min(100, Math.max(0, pos.x + (dx / box.width) * 100)),
      y: Math.min(100, Math.max(0, pos.y + (dy / box.height) * 100)),
    };
    setPos(next);
    recordVisit(next.x, next.y);
  };

  /* ---------------- the hold-to-look switch ---------------- */

  const holdStart = () => {
    api.onInteraction();
    setHoldOn(true);
    setToggledOnce(true);
  };
  const holdEnd = () => setHoldOn(false);
  const onHoldKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      holdStart();
    }
  };
  const onHoldKeyUp = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      holdEnd();
    }
  };

  /* ---------------- readout content ---------------- */

  const grade = hit && GRADE_WORD[hit.grade] ? hit.grade : null;
  const areaName =
    (hitDesc?.name && hitDesc.name.trim() !== "N/A" && hitDesc.name.trim().length > 2
      ? hitDesc.name.trim()
      : null) ??
    (hit?.name ? String(hit.name) : null);

  return (
    <div className="w-full" data-testid="holc-lens" data-visited={visitedCount} data-toggled={toggledOnce ? "true" : "false"}>
      <p className="exh-plat mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Drag the lens. Read what the surveyors wrote.
      </p>

      <div className="flex flex-col gap-3">
        {/* ---------------- the map and the lens ---------------- */}
        <div className="min-w-0">
          <div
            ref={stageRef}
            onPointerDown={onStagePointerDown}
            className="relative cursor-crosshair"
            style={{ touchAction: "none" }}
          >
            <MapStage frame="citywide">
              <HolcLayer frame="citywide" dimUngraded />
              {/* the darkness: what remains when only lendable areas stay lit */}
              <rect
                x={0}
                y={0}
                width={VIEW_W}
                height={VIEW_H}
                pointerEvents="none"
                style={{
                  fill: "var(--color-exh-ink)",
                  opacity: holdOn ? 0.93 : 0,
                  transition: api.reducedMotion ? "none" : `opacity ${motionMs(320)}ms ease`,
                }}
              />
            </MapStage>
            <div
              role="button"
              tabIndex={0}
              data-testid="holc-lens-handle"
              aria-label="Survey lens. Drag it, or move it with the arrow keys; hold Shift for larger steps."
              onKeyDown={onLensKeyDown}
              className="absolute z-10 cursor-grab rounded-full border-2 border-exh-ink shadow-[0_2px_10px_rgba(28,26,23,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-blue active:cursor-grabbing"
              style={{
                width: LENS_PX,
                height: LENS_PX,
                left: `calc(${pos.x}% - ${LENS_PX / 2}px)`,
                top: `calc(${pos.y}% - ${LENS_PX / 2}px)`,
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%)",
                touchAction: "none",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-exh-ink"
              />
            </div>
          </div>
          <p className="mt-2 text-xs leading-snug text-exh-ink-soft">
            This is the same map you tapped at the start. Now you know who drew it.
          </p>
        </div>

        {/* ---------------- the readout card ---------------- */}
        <PaperCard
          data-testid="holc-lens-readout"
          data-area={hit ? String(hit.label ?? hit.id) : "none"}
          className="w-full p-4"
          aria-live="polite"
        >
          {!hit && (
            <p className="text-sm leading-snug text-exh-ink-soft">
              {mapReady
                ? "Move the lens over a graded area to read its file."
                : "Map data is being prepared. The lens will read the survey record once it loads."}
            </p>
          )}
          {hit && (
            <div>
              <div className="flex items-center gap-2">
                {grade && <GradeSwatch grade={grade} />}
                <span
                  className={`exh-plat text-sm font-bold uppercase tracking-[0.18em] ${
                    grade === "D" ? "text-exh-red" : "text-exh-ink"
                  }`}
                >
                  {grade ? GRADE_WORD[grade] : "Ungraded"}
                </span>
                <span className="exh-mono ml-auto text-xs text-exh-ink/70">
                  {String(hit.label ?? hit.id)}
                </span>
              </div>
              {areaName && (
                <p className="exh-serif mt-1.5 text-base leading-snug text-exh-ink">{areaName}</p>
              )}

              <div className="mt-3 border-t border-exh-ink/15 pt-3">
                {excerptUsable && hitDesc ? (
                  <div>
                    <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                      from the 1939 to 1940 survey record
                    </p>
                    <span className="exh-plat mt-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
                      period document; contains the era&rsquo;s racist language
                    </span>
                    {hitDesc.excerptLabel && (
                      <p className="exh-mono mt-2 text-[10px] text-exh-ink/60">{hitDesc.excerptLabel}</p>
                    )}
                    <blockquote className="exh-serif mt-1 text-sm leading-snug text-exh-ink italic">
                      &ldquo;{hitDesc.excerpt.trim()}&rdquo;
                    </blockquote>
                  </div>
                ) : (
                  <p className="text-sm leading-snug text-exh-ink-soft">
                    {desc.done
                      ? "No surveyor sheet survives in the digitized record for this area."
                      : "Reading the survey record."}
                  </p>
                )}
              </div>
            </div>
          )}
        </PaperCard>
      </div>

      {/* ---------------- the hold-to-look switch ---------------- */}
      <div className="mt-4">
        <button
          type="button"
          data-testid="holc-lens-toggle"
          aria-pressed={holdOn}
          onPointerDown={holdStart}
          onPointerUp={holdEnd}
          onPointerLeave={holdEnd}
          onPointerCancel={holdEnd}
          onKeyDown={onHoldKeyDown}
          onKeyUp={onHoldKeyUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-sm border px-4 py-2 text-left transition-colors ${
            holdOn ? "border-exh-ink bg-exh-ink/90" : "border-exh-ink/40 bg-exh-linen-deep/50"
          }`}
          style={{ touchAction: "none" }}
        >
          <span
            className={`exh-plat text-xs font-semibold uppercase tracking-[0.18em] ${
              holdOn ? "text-exh-linen" : "text-exh-ink"
            }`}
          >
            Show me where a Black family could get a federally backed loan
          </span>
          <span
            className={`exh-plat shrink-0 text-[10px] uppercase tracking-[0.15em] ${
              holdOn ? "text-exh-linen/80" : "text-exh-ink-soft"
            }`}
          >
            {holdOn ? "looking" : "press and hold"}
          </span>
        </button>

        {toggledOnce && (
          <div
            data-testid="holc-lens-caption"
            className={`mt-2 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4 ${
              api.reducedMotion ? "" : "exh-ledger-in"
            } ${holdOn ? "" : "opacity-90"}`}
          >
            <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">
              Nothing lights. Every Black neighborhood was graded hazardous or declining.
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <FactValue id="redlining.holc_survey_chicago" size="sm" />
              <FactValue id="redlining.black_loans_under_2pct" size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
