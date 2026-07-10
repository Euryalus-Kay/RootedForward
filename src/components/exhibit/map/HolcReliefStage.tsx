"use client";
/* ------------------------------------------------------------------ */
/*  The relief view of the 1940 map. Every area the surveyors drew,    */
/*  raised or sunk by the grade they gave it; heights are ranks, the   */
/*  legend under the station says so. Rendering is plain SVG, so       */
/*  every graded top face stays a real keyboard-operable button        */
/*  behind one roving tab stop, exactly like the flat layer. The       */
/*  turn handle is a native range input with seven stops, so it        */
/*  never fights the page scroll. The darkness overlay renders         */
/*  inside the scene so the loans question works in this view too.    */
/* ------------------------------------------------------------------ */
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  buildRelief,
  projectPoint,
  TURN_DEFAULT_INDEX,
  TURN_STOPS,
} from "@/lib/exhibit/map/relief";
import { useHolcFrames, type HolcArea } from "@/lib/exhibit/map/useExhibitMapData";

/* Hyde Park's anchor and an offshore lake anchor, in citywide frame
   pixels (web mercator, matching scripts/hp-map-real.py constants) */
function mercatorPx(
  lat: number,
  lng: number,
  frame: { zoom: number; centerLat: number; centerLng: number; width: number; height: number }
): [number, number] {
  const scale = 256 * 2 ** frame.zoom;
  const xy = (la: number, ln: number): [number, number] => {
    const x = ((ln + 180) / 360) * scale;
    const s = Math.sin((la * Math.PI) / 180);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
    return [x, y];
  };
  const [px, py] = xy(lat, lng);
  const [cx, cy] = xy(frame.centerLat, frame.centerLng);
  return [frame.width / 2 + (px - cx), frame.height / 2 + (py - cy)];
}

export interface HolcReliefStageProps {
  interactive?: boolean;
  onAreaTap?: (area: HolcArea) => void;
  selectedId?: HolcArea["id"] | null;
  /** the loans-question darkness, owned by the station's toggle */
  overlayOn?: boolean;
  reducedMotion?: boolean;
  /** notifies the station that the visitor touched the handle */
  onInteraction?: () => void;
}

export default function HolcReliefStage({
  interactive = false,
  onAreaTap,
  selectedId = null,
  overlayOn = false,
  reducedMotion = false,
  onInteraction,
}: HolcReliefStageProps) {
  const { data } = useHolcFrames();
  const [turnIdx, setTurnIdx] = useState(TURN_DEFAULT_INDEX);

  const [rovingId, setRovingId] = useState<HolcArea["id"] | null>(null);
  const pathRefs = useRef(new Map<HolcArea["id"], SVGPathElement>());

  const areas = useMemo(() => data?.areas ?? [], [data]);
  const scene = useMemo(
    () => (areas.length ? buildRelief(areas, TURN_STOPS[turnIdx]) : null),
    [areas, turnIdx]
  );
  const vb = scene?.viewBox ?? null;

  /* labels anchored to geography so they turn with the city */
  const anchors = useMemo(() => {
    const frame = data?.frames?.citywide;
    if (!frame || !areas.length) return null;
    const hpPx = mercatorPx(41.7908, -87.5815, frame);
    const lakePx = mercatorPx(41.97, -87.52, frame);
    return {
      hp: projectPoint(areas, TURN_STOPS[turnIdx], hpPx[0], hpPx[1], 23),
      lake: projectPoint(areas, TURN_STOPS[turnIdx], lakePx[0], lakePx[1], 0),
      lakeAngle: 60 + TURN_STOPS[turnIdx],
    };
  }, [data, areas, turnIdx]);

  const tappables = useMemo(
    () => (interactive && onAreaTap && scene ? scene.prisms.filter((p) => p.graded) : []),
    [scene, interactive, onAreaTap]
  );
  const activeRovingId =
    rovingId != null && tappables.some((t) => t.area.id === rovingId)
      ? rovingId
      : (tappables[0]?.area.id ?? null);

  const moveRoving = (fromId: HolcArea["id"], step: number | "home" | "end") => {
    if (!tappables.length) return;
    const idx = tappables.findIndex((t) => t.area.id === fromId);
    const next =
      step === "home"
        ? 0
        : step === "end"
          ? tappables.length - 1
          : Math.min(tappables.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + step));
    const target = tappables[next];
    if (!target) return;
    setRovingId(target.area.id);
    pathRefs.current.get(target.area.id)?.focus();
  };

  if (!scene || !vb) {
    return (
      <div
        data-testid="holc-relief-pending"
        className="flex aspect-square w-full items-center justify-center border border-exh-ink/25 bg-exh-linen-deep/40"
      >
        <p className="exh-plat text-[11px] uppercase tracking-[0.2em] text-exh-ink-soft">
          The relief is being prepared
        </p>
      </div>
    );
  }

  return (
    <div data-testid="holc-relief">
      <div className="relative aspect-square w-full border border-exh-ink/25 bg-exh-linen-deep/40">
        <svg
          viewBox={`${vb.x.toFixed(0)} ${vb.y.toFixed(0)} ${vb.w.toFixed(0)} ${vb.h.toFixed(0)}`}
          role="group"
          aria-label="The 1940 map in relief. Every area raised or sunk by its grade; heights are the surveyors' ranks, not measurements. One tab stop; the arrow keys move between graded areas and Enter opens an area's sheet."
          className="absolute inset-0 h-full w-full p-1.5 sm:p-2"
        >
          {scene.prisms.map((p) => {
            const tappable = Boolean(interactive && onAreaTap && p.graded);
            const isSelected = selectedId != null && p.area.id === selectedId;
            const handleKey = (e: KeyboardEvent<SVGPathElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAreaTap?.(p.area);
                return;
              }
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                moveRoving(p.area.id, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                moveRoving(p.area.id, -1);
              } else if (e.key === "Home") {
                e.preventDefault();
                moveRoving(p.area.id, "home");
              } else if (e.key === "End") {
                e.preventDefault();
                moveRoving(p.area.id, "end");
              }
            };
            return (
              <g key={String(p.area.id)} data-relief-area={String(p.area.id)}>
                {p.sideD && <path d={p.sideD} fill={p.side} stroke={p.side} strokeWidth={0.4} />}
                <path
                  d={p.topD}
                  fillRule="evenodd"
                  fill={p.top}
                  stroke={isSelected ? "#C9A227" : p.edge}
                  strokeWidth={isSelected ? 2.4 : 0.7}
                  strokeLinejoin="round"
                  className={tappable ? "cursor-pointer" : undefined}
                  {...(tappable
                    ? {
                        role: "button",
                        tabIndex: p.area.id === activeRovingId ? 0 : -1,
                        "aria-label": `Area ${p.area.label}, grade ${p.area.grade}`,
                        onClick: () => onAreaTap?.(p.area),
                        onKeyDown: handleKey,
                        onFocus: () => setRovingId(p.area.id),
                        ref: (el: SVGPathElement | null) => {
                          if (el) pathRefs.current.set(p.area.id, el);
                          else pathRefs.current.delete(p.area.id);
                        },
                      }
                    : {})}
                />
              </g>
            );
          })}

          {anchors && (
            <g pointerEvents="none">
              <text
                x={anchors.lake[0]}
                y={anchors.lake[1]}
                textAnchor="middle"
                fontSize={15}
                letterSpacing={4}
                fill="#4A453D"
                opacity={0.7}
                className="exh-plat"
                transform={`rotate(${anchors.lakeAngle} ${anchors.lake[0]} ${anchors.lake[1]})`}
              >
                LAKE MICHIGAN
              </text>
              <circle cx={anchors.hp[0]} cy={anchors.hp[1]} r={3.2} fill="#1C1A17" />
              <text
                x={anchors.hp[0] - 12}
                y={anchors.hp[1] + 26}
                textAnchor="end"
                fontSize={15}
                letterSpacing={2.5}
                fill="#1C1A17"
                stroke="#EDE6D6"
                strokeWidth={3.5}
                strokeOpacity={0.85}
                paintOrder="stroke"
                strokeLinejoin="round"
                className="exh-plat"
              >
                HYDE PARK
              </text>
            </g>
          )}

          {/* the darkness: the loans question, same as the flat view */}
          <rect
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
            pointerEvents="none"
            style={{
              fill: "var(--color-exh-ink)",
              opacity: overlayOn ? 0.93 : 0,
              transition: reducedMotion ? "none" : "opacity 320ms ease",
            }}
          />
        </svg>
      </div>

      {/* the turn handle; a native slider, so scroll is never contested */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <label
          htmlFor="holc-relief-turn"
          className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft"
        >
          Turn the city
        </label>
        <input
          id="holc-relief-turn"
          data-testid="holc-relief-turn"
          type="range"
          min={0}
          max={TURN_STOPS.length - 1}
          step={1}
          value={turnIdx}
          onChange={(e) => {
            setTurnIdx(Number(e.target.value));
            onInteraction?.();
          }}
          aria-valuetext={`turned ${TURN_STOPS[turnIdx] - TURN_STOPS[TURN_DEFAULT_INDEX]} degrees from rest`}
          className="h-11 w-44 max-w-full cursor-pointer accent-[var(--color-exh-ink)]"
        />
      </div>

      {/* the height legend and its honesty line */}
      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2" aria-hidden="true">
        {(
          [
            ["A", 28, "#9AA78E", "Best"],
            ["B", 21, "#7B92A8", "Still desirable"],
            ["C", 14, "#D4B45A", "Declining"],
            ["D", 8, "#BF5B50", "Hazardous"],
          ] as const
        ).map(([g, h, c, word]) => (
          <span key={g} className="flex items-end gap-1.5">
            <span
              className="inline-block w-4 border border-exh-ink/45"
              style={{ height: `${h}px`, backgroundColor: c }}
            />
            <span className="exh-plat text-[11px] tracking-[0.06em] text-exh-ink-soft">
              {g} &middot; {word}
            </span>
          </span>
        ))}
      </div>
      <p data-testid="holc-relief-ranknote" className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-exh-ink-soft">
        Height shows only the grade the surveyors assigned, not a measurement. Areas the survey
        left ungraded lie flat.
      </p>
    </div>
  );
}
