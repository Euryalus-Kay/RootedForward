"use client";
/* ------------------------------------------------------------------ */
/*  The Kitchenette Splitter, the second CH7 pause point. One grand    */
/*  fair-era six-flat drawn in section; the visitor drags divider      */
/*  walls from a tray into a flat (or tabs to a flat and presses       */
/*  Enter) and each split doubles that flat's family count. The        */
/*  families counter climbs, the illustrative rent counter climbs      */
/*  faster, and the amenities gray out one by one as density passes    */
/*  thresholds. Four walls in the tray, then it empties; the split     */
/*  counts are ILLUSTRATIVE of a documented practice and the panel     */
/*  says so. Completes after two splits.                               */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";

const MAX_WALLS = 4;
const PER_UNIT_CAP = 4;
/** each split doubles the families in that flat */
const FAMILY_FACTOR = 2;
/** and multiplies that flat's rent take faster; illustrative by design */
const RENT_FACTOR = 2.5;

const UNIT_IDS = ["flat1", "flat2", "flat3", "flat4", "flat5", "flat6"] as const;
type UnitId = (typeof UNIT_IDS)[number];

/* section geometry, top floor first */
const FLOORS: { y0: number; y1: number; flats: [UnitId, UnitId] }[] = [
  { y0: 96, y1: 254, flats: ["flat5", "flat6"] },
  { y0: 254, y1: 412, flats: ["flat3", "flat4"] },
  { y0: 412, y1: 570, flats: ["flat1", "flat2"] },
];
const LEFT_UNIT_X: [number, number] = [78, 432];
const RIGHT_UNIT_X: [number, number] = [488, 842];
const SHAFT_X: [number, number] = [432, 488];

const WALL_CSS = `
.exh-kit-in { animation: exhKitIn 180ms ease-out both; }
@keyframes exhKitIn { from { opacity: 0; } to { opacity: 1; } }
.exhibit-root[data-motion="off"] .exh-kit-in { animation: none; }
`;

const FLAT_LABEL: Record<UnitId, string> = {
  flat1: "Flat 1",
  flat2: "Flat 2",
  flat3: "Flat 3",
  flat4: "Flat 4",
  flat5: "Flat 5",
  flat6: "Flat 6",
};

function totalOf(splits: Partial<Record<UnitId, number>>): number {
  return UNIT_IDS.reduce((n, u) => n + (splits[u] ?? 0), 0);
}

function familiesOf(splits: Partial<Record<UnitId, number>>): number {
  return UNIT_IDS.reduce((n, u) => n + Math.pow(FAMILY_FACTOR, splits[u] ?? 0), 0);
}

function rentMultipleOf(splits: Partial<Record<UnitId, number>>): number {
  return UNIT_IDS.reduce((n, u) => n + Math.pow(RENT_FACTOR, splits[u] ?? 0), 0) / UNIT_IDS.length;
}

/* cells per split count: alternate vertical then horizontal halving */
function gridOf(s: number): { cols: number; rows: number } {
  return { cols: Math.pow(2, Math.ceil(s / 2)), rows: Math.pow(2, Math.floor(s / 2)) };
}

interface AmenityProps {
  label: string;
  lost: boolean;
  children: ReactNode;
}

function Amenity({ label, lost, children }: AmenityProps) {
  return (
    <div
      className={`flex items-center gap-1.5 transition-opacity ${lost ? "opacity-35" : ""}`}
      aria-label={lost ? `${label}, gone as the flats fill` : label}
    >
      <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" className="shrink-0 text-exh-ink">
        {children}
      </svg>
      <span
        className={`exh-plat text-[10px] uppercase tracking-[0.15em] text-exh-ink ${lost ? "line-through" : ""}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function Kitchenette() {
  const api = useInteractive();
  const [splits, setSplits] = useState<Partial<Record<UnitId, number>>>({});
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const splitsRef = useRef<Partial<Record<UnitId, number>>>({});
  const unitRefs = useRef(new Map<UnitId, SVGRectElement>());

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  const split = useCallback(
    (unitId: UnitId) => {
      const prev = splitsRef.current;
      const used = totalOf(prev);
      const cur = prev[unitId] ?? 0;
      if (used >= MAX_WALLS || cur >= PER_UNIT_CAP) return;
      const next = { ...prev, [unitId]: cur + 1 };
      splitsRef.current = next;
      setSplits(next);
      api.onInteraction();
      if (totalOf(next) >= 2) complete();
    },
    [api, complete]
  );

  /* ---------------- wall drag from the tray ---------------- */

  const dropAt = useCallback(
    (clientX: number, clientY: number) => {
      for (const [id, el] of unitRefs.current) {
        const r = el.getBoundingClientRect();
        if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
          split(id);
          return;
        }
      }
    },
    [split]
  );

  const dragActive = drag !== null;
  useEffect(() => {
    if (!dragActive) return;
    const onMove = (e: PointerEvent) => setDrag({ x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      dropAt(e.clientX, e.clientY);
      setDrag(null);
    };
    const onCancel = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [dragActive, dropAt]);

  const splitsUsed = totalOf(splits);
  const wallsLeft = MAX_WALLS - splitsUsed;
  const families = familiesOf(splits);
  const rentX = rentMultipleOf(splits);
  const trayEmpty = wallsLeft <= 0;

  const lostPlumbing = splitsUsed >= 2;
  const lostHeat = splitsUsed >= 3;
  const lostFireEscape = splitsUsed >= 4;

  const wallIn = api.reducedMotion ? "" : "exh-kit-in";

  /* ---------------- one flat in the section ---------------- */

  const renderUnit = (unitId: UnitId, xs: [number, number], y0: number, y1: number) => {
    const s = splits[unitId] ?? 0;
    const fam = Math.pow(FAMILY_FACTOR, s);
    const { cols, rows } = gridOf(s);
    const [x0, x1] = xs;
    const ix0 = x0 + 8;
    const ix1 = x1 - 8;
    const iy0 = y0 + 8;
    const iy1 = y1 - 8;
    const cw = (ix1 - ix0) / cols;
    const ch = (iy1 - iy0) / rows;
    const canSplit = !trayEmpty && s < PER_UNIT_CAP;
    const label = `${FLAT_LABEL[unitId]}, holds ${fam} ${fam === 1 ? "family" : "families"}. ${
      canSplit ? "Press Enter to drive a wall through it." : "The wall tray is empty."
    }`;

    return (
      <g key={unitId}>
        {/* divider walls, newest fade in */}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line
            key={`v${s}-${i}`}
            className={wallIn}
            x1={ix0 + cw * (i + 1)}
            y1={iy0}
            x2={ix0 + cw * (i + 1)}
            y2={iy1}
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.8}
            strokeWidth={3}
          />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line
            key={`h${s}-${i}`}
            className={wallIn}
            x1={ix0}
            y1={iy0 + ch * (i + 1)}
            x2={ix1}
            y2={iy0 + ch * (i + 1)}
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.8}
            strokeWidth={3}
          />
        ))}
        {/* one family dot per cell */}
        {Array.from({ length: cols * rows }, (_, i) => {
          const cx = ix0 + cw * (i % cols) + cw / 2;
          const cy = iy0 + ch * Math.floor(i / cols) + ch / 2 + 6;
          return (
            <circle
              key={`d${s}-${i}`}
              className={wallIn}
              cx={cx}
              cy={cy}
              r={5.5}
              style={{ fill: "var(--color-exh-ink)" }}
              fillOpacity={0.7}
            />
          );
        })}
        <text
          x={x0 + 12}
          y={y0 + 24}
          className="exh-plat"
          fontSize={15}
          letterSpacing={2}
          style={{ fill: "var(--color-exh-ink-soft)" }}
          pointerEvents="none"
        >
          {FLAT_LABEL[unitId].toUpperCase()}
        </text>
        <text
          x={x1 - 12}
          y={y0 + 24}
          className="exh-mono"
          fontSize={15}
          textAnchor="end"
          style={{ fill: "var(--color-exh-ink)" }}
          pointerEvents="none"
        >
          {fam}
        </text>
        {/* the tappable flat itself, on top */}
        <rect
          ref={(el) => {
            if (el) unitRefs.current.set(unitId, el);
            else unitRefs.current.delete(unitId);
          }}
          data-testid={`kitchenette-unit-${unitId}`}
          x={x0}
          y={y0}
          width={x1 - x0}
          height={y1 - y0}
          fill="transparent"
          pointerEvents="all"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-disabled={canSplit ? undefined : true}
          onClick={() => split(unitId)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              split(unitId);
            }
          }}
          className={`stroke-exh-ink/60 focus-visible:stroke-exh-blue ${
            canSplit ? "cursor-pointer hover:fill-exh-ink/5" : "cursor-default"
          }`}
        />
      </g>
    );
  };

  return (
    <div className="w-full" data-testid="kitchenette" data-units={families} data-splits={splitsUsed}>
      <style>{WALL_CSS}</style>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Drag a wall into a flat, or tab to a flat and press Enter.
        </p>
        <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-none tracking-[0.15em] text-exh-ink-soft">
          illustration of the kitchenette conversion, as documented
        </span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        {/* ---------------- the section drawing ---------------- */}
        <div className="exh-paper min-w-0 flex-1 rounded-sm border border-exh-ink/25">
          <svg viewBox="0 0 920 640" className="block h-auto w-full select-none">
            {/* parapet and cornice */}
            <line x1={62} y1={70} x2={858} y2={70} style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={3} />
            <rect x={70} y={78} width={780} height={18} fill="none" style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={1.5} />
            {Array.from({ length: 29 }, (_, i) => (
              <rect
                key={i}
                x={82 + i * 27}
                y={84}
                width={9}
                height={7}
                style={{ fill: "var(--color-exh-ink)" }}
                fillOpacity={0.35}
              />
            ))}

            {/* outer walls, double rule */}
            <rect x={70} y={96} width={780} height={476} fill="none" style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={3} />
            <rect x={74} y={100} width={772} height={468} fill="none" style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.35} strokeWidth={1} />

            {/* floor slabs */}
            <line x1={70} y1={254} x2={850} y2={254} style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={3} />
            <line x1={70} y1={412} x2={850} y2={412} style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={3} />

            {/* stair hall */}
            <rect
              x={SHAFT_X[0]}
              y={96}
              width={SHAFT_X[1] - SHAFT_X[0]}
              height={476}
              style={{ fill: "var(--color-exh-ink)" }}
              fillOpacity={0.06}
            />
            <line x1={SHAFT_X[0]} y1={96} x2={SHAFT_X[0]} y2={572} style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.55} strokeWidth={1.5} />
            <line x1={SHAFT_X[1]} y1={96} x2={SHAFT_X[1]} y2={572} style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.55} strokeWidth={1.5} />
            {FLOORS.map((f, i) => (
              <path
                key={i}
                d={`M${SHAFT_X[0] + 10} ${f.y1 - 18} l9 -14 l9 14 l9 -14 l9 14 l9 -14`}
                fill="none"
                style={{ stroke: "var(--color-exh-ink)" }}
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
            ))}
            <text
              x={460}
              y={334}
              transform="rotate(-90 460 334)"
              className="exh-plat"
              fontSize={13}
              letterSpacing={4}
              textAnchor="middle"
              style={{ fill: "var(--color-exh-ink-soft)" }}
            >
              STAIR HALL
            </text>

            {/* ground */}
            <line x1={54} y1={572} x2={866} y2={572} style={{ stroke: "var(--color-exh-ink)" }} strokeWidth={4} />
            {Array.from({ length: 24 }, (_, i) => (
              <line
                key={i}
                x1={60 + i * 34}
                y1={572}
                x2={48 + i * 34}
                y2={584}
                style={{ stroke: "var(--color-exh-ink)" }}
                strokeOpacity={0.4}
                strokeWidth={1.5}
              />
            ))}
            <text
              x={70}
              y={618}
              className="exh-plat"
              fontSize={15}
              letterSpacing={3}
              style={{ fill: "var(--color-exh-ink-soft)" }}
            >
              A FAIR ERA SIX FLAT, DRAWN IN SECTION
            </text>

            {/* the six flats */}
            {FLOORS.map((f) => (
              <g key={f.y0}>
                {renderUnit(f.flats[0], LEFT_UNIT_X, f.y0, f.y1)}
                {renderUnit(f.flats[1], RIGHT_UNIT_X, f.y0, f.y1)}
              </g>
            ))}
          </svg>
        </div>

        {/* ---------------- tray, counters, amenities ---------------- */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-64">
          <PaperCard data-testid="kitchenette-tray" data-walls={wallsLeft} className="p-3">
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              Wall tray
            </p>
            {trayEmpty ? (
              <p className="mt-2 text-xs leading-snug text-exh-ink-soft">
                The tray is empty. The building holds what it holds.
              </p>
            ) : (
              <div className="mt-1 flex items-end gap-1">
                {Array.from({ length: wallsLeft }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    data-testid="kitchenette-wall"
                    aria-label="Divider wall. Drag it onto a flat."
                    onPointerDown={(e) => {
                      e.preventDefault();
                      api.onInteraction();
                      setDrag({ x: e.clientX, y: e.clientY });
                    }}
                    className="flex min-h-12 min-w-12 cursor-grab items-center justify-center"
                    style={{ touchAction: "none" }}
                  >
                    <span aria-hidden="true" className="block h-10 w-2.5 rounded-[2px] bg-exh-ink" />
                  </button>
                ))}
              </div>
            )}
          </PaperCard>

          <PaperCard className="p-3" aria-live="polite">
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              Families housed
            </p>
            <p data-testid="kitchenette-families" className="exh-mono mt-0.5 text-2xl font-medium text-exh-ink">
              {families}
            </p>
            <p className="exh-plat mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              Monthly rent collected, illustrative
            </p>
            <p data-testid="kitchenette-rent" className="exh-mono mt-0.5 text-2xl font-medium text-exh-ink">
              {rentX.toFixed(1)}x
              <span className="exh-plat ml-1.5 align-middle text-[10px] tracking-[0.12em] text-exh-ink-soft uppercase">
                the original take
              </span>
            </p>
          </PaperCard>

          <PaperCard className="p-3">
            <p className="exh-plat mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              What the building keeps
            </p>
            <div className="flex flex-col gap-1.5">
              <Amenity label="plumbing" lost={lostPlumbing}>
                <path
                  d="M10 3 C10 3 4.5 10 4.5 13.2 A5.5 5.5 0 0 0 15.5 13.2 C15.5 10 10 3 10 3 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                />
              </Amenity>
              <Amenity label="heat" lost={lostHeat}>
                {[5, 10, 15].map((x) => (
                  <path
                    key={x}
                    d={`M${x} 17 q2.4 -3 0 -6 q-2.4 -3 0 -6`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  />
                ))}
              </Amenity>
              <Amenity label="fire escape" lost={lostFireEscape}>
                <g stroke="currentColor" strokeWidth={1.6} fill="none">
                  <line x1={6.5} y1={3} x2={6.5} y2={17} />
                  <line x1={13.5} y1={3} x2={13.5} y2={17} />
                  <line x1={6.5} y1={6.5} x2={13.5} y2={6.5} />
                  <line x1={6.5} y1={10.5} x2={13.5} y2={10.5} />
                  <line x1={6.5} y1={14.5} x2={13.5} y2={14.5} />
                </g>
              </Amenity>
            </div>
          </PaperCard>
        </div>
      </div>

      {/* ---------------- provenance and the close ---------------- */}
      <div className="mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4">
        <div className="flex flex-col gap-1">
          <FactValue id="colorline.kitchenettes" size="sm" />
          <FactValue id="colorline.kitchenette_rent_45pct" size="sm" />
        </div>
        {splitsUsed >= 2 && (
          <p
            data-testid="kitchenette-endline"
            className={`exh-serif mt-3 text-base leading-snug text-exh-ink sm:text-lg ${
              api.reducedMotion ? "" : "exh-ledger-in"
            }`}
          >
            The buildings from the fair. The profits went out. The people stayed in.
          </p>
        )}
      </div>

      {/* drag ghost */}
      {drag && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50"
          style={{ left: drag.x - 6, top: drag.y - 26 }}
        >
          <span className="block h-12 w-3 rounded-[2px] bg-exh-ink shadow-[0_2px_8px_rgba(28,26,23,0.4)]" />
        </div>
      )}
    </div>
  );
}
