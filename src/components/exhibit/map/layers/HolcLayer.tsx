"use client";
/* ------------------------------------------------------------------ */
/*  HolcLayer, the HOLC security-grade polygon layer. Renders every    */
/*  area visible in the given frame with the triple grade encoding     */
/*  (tint + pattern from MapStage's defs + centroid letter label).     */
/*  Interactive areas are keyboard-operable svg buttons behind ONE     */
/*  roving tab stop: Tab reaches a single area, the arrow keys move    */
/*  between areas, Enter or Space taps (A4 accessibility; the          */
/*  citywide frame used to put ~676 paths in the tab order). Areas     */
/*  that fall entirely outside the frame's canvas are culled and       */
/*  path strings are memoized, so the hydePark frame stays at a        */
/*  couple dozen nodes instead of seven hundred.                       */
/* ------------------------------------------------------------------ */
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ringsBBox, ringsToPath } from "@/lib/exhibit/map/projection";
import {
  useHolcFrames,
  type FrameId,
  type HolcArea,
  type HolcGrade,
} from "@/lib/exhibit/map/useExhibitMapData";
import { VIEW_H, VIEW_W } from "../MapStage";

const GRADE_FILL: Record<HolcGrade, string> = {
  A: "url(#exh-holc-a)",
  B: "url(#exh-holc-b)",
  C: "url(#exh-holc-c)",
  D: "url(#exh-holc-d)",
};

/** cull margin around the canvas, in viewBox units */
const PAD = 120;
/** minimum bbox dimension before the centroid letter label is drawn */
const LABEL_MIN = 60;

function isGrade(g: string): g is HolcGrade {
  return g === "A" || g === "B" || g === "C" || g === "D";
}

export interface HolcLayerProps {
  frame: FrameId;
  interactive?: boolean;
  onAreaTap?: (area: HolcArea) => void;
  emphasizeGrade?: HolcGrade | null;
  dimUngraded?: boolean;
}

interface RenderedArea {
  area: HolcArea;
  d: string;
  grade: HolcGrade | null;
  label: { x: number; y: number } | null;
}

export default function HolcLayer({
  frame,
  interactive = false,
  onAreaTap,
  emphasizeGrade = null,
  dimUngraded = false,
}: HolcLayerProps) {
  const { data } = useHolcFrames();

  /* roving tab stop: exactly one tappable path keeps tabIndex 0 */
  const [rovingId, setRovingId] = useState<HolcArea["id"] | null>(null);
  const pathRefs = useRef(new Map<HolcArea["id"], SVGPathElement>());

  const rendered = useMemo<RenderedArea[]>(() => {
    if (!data?.areas?.length) return [];
    const out: RenderedArea[] = [];
    for (const area of data.areas) {
      const rings = area.rings?.[frame];
      if (!rings?.length) continue;
      const bb = ringsBBox(rings);
      if (bb.maxX < -PAD || bb.minX > VIEW_W + PAD || bb.maxY < -PAD || bb.minY > VIEW_H + PAD) {
        continue; // entirely outside this frame's canvas
      }
      const grade = isGrade(area.grade) ? area.grade : null;
      const big = bb.maxX - bb.minX > LABEL_MIN && bb.maxY - bb.minY > LABEL_MIN;
      const c = area.centroid?.[frame];
      out.push({
        area,
        d: ringsToPath(rings),
        grade,
        label: grade && big && c ? { x: c[0], y: c[1] } : null,
      });
    }
    return out;
  }, [data, frame]);

  const tappables = useMemo<RenderedArea[]>(
    () => (interactive && onAreaTap ? rendered.filter((r) => r.grade) : []),
    [rendered, interactive, onAreaTap]
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

  if (!rendered.length) return null;

  return (
    <g
      {...(tappables.length
        ? {
            role: "group",
            "aria-label":
              "Graded map areas. One tab stop; the arrow keys move between areas and Enter selects.",
          }
        : {})}
    >
      {rendered.map(({ area, d, grade, label }) => {
        const emphasized = emphasizeGrade == null || grade === emphasizeGrade;
        const opacity = grade == null ? (dimUngraded ? 0.3 : 1) : emphasized ? 1 : 0.25;
        const tappable = Boolean(interactive && onAreaTap && grade);
        const handleKey = (e: KeyboardEvent<SVGPathElement>) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAreaTap?.(area);
            return;
          }
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            moveRoving(area.id, 1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            moveRoving(area.id, -1);
          } else if (e.key === "Home") {
            e.preventDefault();
            moveRoving(area.id, "home");
          } else if (e.key === "End") {
            e.preventDefault();
            moveRoving(area.id, "end");
          }
        };
        return (
          <g
            key={String(area.id)}
            className="transition-opacity duration-200 motion-reduce:transition-none"
            style={{ opacity }}
          >
            <path
              d={d}
              fillRule="evenodd"
              fill={grade ? GRADE_FILL[grade] : "none"}
              style={grade ? undefined : { fill: "var(--color-exh-ink)", fillOpacity: 0.07 }}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className={
                tappable
                  ? "cursor-pointer stroke-exh-ink/35 hover:stroke-exh-ink/80 focus-visible:stroke-exh-ink/80"
                  : "stroke-exh-ink/35"
              }
              {...(tappable
                ? {
                    role: "button",
                    tabIndex: area.id === activeRovingId ? 0 : -1,
                    "aria-label": `Area ${area.label}, grade ${grade}`,
                    onClick: () => onAreaTap?.(area),
                    onKeyDown: handleKey,
                    onFocus: () => setRovingId(area.id),
                    ref: (el: SVGPathElement | null) => {
                      if (el) pathRefs.current.set(area.id, el);
                      else pathRefs.current.delete(area.id);
                    },
                  }
                : {})}
            />
            {label && (
              <text
                x={label.x}
                y={label.y}
                className="exh-mono"
                fontSize={22}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="central"
                pointerEvents="none"
                style={{ fill: "var(--color-exh-ink)", fillOpacity: 0.7 }}
              >
                {grade}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
