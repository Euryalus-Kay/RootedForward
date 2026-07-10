"use client";
/* ------------------------------------------------------------------ */
/*  The HOLC map station, used in ch0 and again in ch6 (framing        */
/*  prop). The real citywide 1940 map; select any graded area and      */
/*  its real surveyor sheet opens (verbatim excerpt from               */
/*  holc-descriptions.json behind the period-language chip), with a    */
/*  way through to the full sheet in the Surveyor's Files reading      */
/*  room. The loans overlay is a plain labeled toggle so a reader      */
/*  can hold the darkened map and study it. No stamp game, no tap      */
/*  counter, no completion.                                            */
/* ------------------------------------------------------------------ */
import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { ringsBBox } from "@/lib/exhibit/map/projection";
import { useHolcFrames, type HolcArea } from "@/lib/exhibit/map/useExhibitMapData";
import {
  excerptUsable as excerptOk,
  sheetName,
  useHolcDescriptions,
  type DescArea,
} from "@/lib/exhibit/holc-descriptions";
import { sheetHash } from "@/lib/exhibit/files-room";
import { FILES_ROOM_ID } from "@/lib/exhibit/machines";
import { useExhibitDispatch } from "@/lib/exhibit/ExhibitProvider";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import HolcLayer from "@/components/exhibit/map/layers/HolcLayer";
import HolcReliefStage from "@/components/exhibit/map/HolcReliefStage";
import { useInteractive } from "../interactives/InteractiveContext";
import PaperCard from "../shared/PaperCard";
import FactValue from "../shared/FactValue";

/* ---------------- grade rendering ---------------- */

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

/* ---------------- framing copy ---------------- */

export type HolcMapFraming = "ch0" | "ch6";

const FRAMING_COPY: Record<
  HolcMapFraming,
  { lead: string; overlayCaption: string }
> = {
  ch0: {
    lead: "Select any graded area. The sheet the surveyors filed for it opens below.",
    overlayCaption:
      "Nothing lights. The Black Belt came back graded hazardous, and no ordinary loan reached a red area.",
  },
  ch6: {
    lead: "The same map, read again now that you know who drew it. Select any area to open its sheet.",
    overlayCaption:
      "Nothing lights. The Black Belt came back graded hazardous, and no ordinary loan reached a red area.",
  },
};

/* ---------------- tap disambiguation ----------------
   On the citywide frame many graded areas render only a few pixels
   wide, so a fingertip covers several at once. When a tap lands on or
   near more than one area, the choices are listed beneath the map so
   the selection is the visitor's, not the hit-test's. */

/** tap radius in css pixels; wide when the pointer or the stage is coarse */
const TAP_RADIUS_COARSE_PX = 24;
const TAP_RADIUS_FINE_PX = 8;
/** a stage this narrow makes precise taps unrealistic whatever the pointer */
const NARROW_STAGE_PX = 640;
const MAX_NEARBY = 6;

interface AreaBox {
  area: HolcArea;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface HolcMapStationProps {
  framing?: HolcMapFraming;
}

export default function HolcMapStation({ framing = "ch0" }: HolcMapStationProps) {
  const api = useInteractive();
  const dispatch = useExhibitDispatch();
  const holcState = useHolcFrames();
  const holc = holcState.data;
  const desc = useHolcDescriptions();
  const copy = FRAMING_COPY[framing];

  const [selected, setSelected] = useState<HolcArea | null>(null);
  const [nearby, setNearby] = useState<HolcArea[] | null>(null);
  /* ch0 opens in relief; ch6, the rereading, opens on the study map */
  const [view, setView] = useState<"relief" | "flat">(framing === "ch0" ? "relief" : "flat");
  const [overlayOn, setOverlayOn] = useState(false);
  const [toggledOnce, setToggledOnce] = useState(false);
  const [locateState, setLocateState] = useState<"idle" | "working" | "hit" | "miss" | "denied">("idle");
  const [locateGrade, setLocateGrade] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const mapReady = (holc?.areas?.length ?? 0) > 0;

  const descById = useMemo(() => {
    const m = new Map<string, DescArea>();
    for (const a of desc.data?.areas ?? []) m.set(String(a.areaId), a);
    return m;
  }, [desc.data]);

  const selDesc = selected ? descById.get(String(selected.id)) : undefined;
  const excerptUsable = excerptOk(selDesc);

  const onAreaTap = (area: HolcArea) => {
    api.onInteraction();
    setSelected(area);
  };

  /* graded-area bounding boxes in citywide frame units, for the tap test */
  const gradedBoxes = useMemo<AreaBox[]>(() => {
    const out: AreaBox[] = [];
    for (const area of holc?.areas ?? []) {
      if (!GRADE_WORD[area.grade]) continue;
      const rings = area.rings?.citywide;
      if (!rings?.length) continue;
      const bb = ringsBBox(rings);
      if (!Number.isFinite(bb.minX) || !Number.isFinite(bb.maxX)) continue;
      out.push({ area, minX: bb.minX, minY: bb.minY, maxX: bb.maxX, maxY: bb.maxY });
    }
    return out;
  }, [holc]);

  /* every stage click passes through here after HolcLayer's own hit test */
  const onStageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!gradedBoxes.length) return;
    const svg = stageRef.current?.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (
      !rect.width ||
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      return;
    }
    const target = e.target as Element | null;
    const directHit = Boolean(target?.closest?.('path[role="button"]'));
    const coarse =
      (typeof window !== "undefined" &&
        window.matchMedia?.("(pointer: coarse)").matches) ||
      rect.width < NARROW_STAGE_PX;
    const scale = VIEW_W / rect.width;
    const radius = (coarse ? TAP_RADIUS_COARSE_PX : TAP_RADIUS_FINE_PX) * scale;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const near = gradedBoxes
      .map((b) => {
        const dx = Math.max(b.minX - x, 0, x - b.maxX);
        const dy = Math.max(b.minY - y, 0, y - b.maxY);
        return { b, d: Math.hypot(dx, dy) };
      })
      .filter((c) => c.d <= radius)
      .sort((p, q) => p.d - q.d)
      .slice(0, MAX_NEARBY)
      .map((c) => c.b.area);
    if (near.length >= 2) {
      /* several areas fit under the tap; list them so the choice is real */
      api.onInteraction();
      setNearby(near);
    } else {
      setNearby(null);
      /* a near miss on a lone area still opens it */
      if (!directHit && near.length === 1) onAreaTap(near[0]);
    }
  };

  const pickNearby = (area: HolcArea) => {
    setNearby(null);
    onAreaTap(area);
  };

  /* short display line for a listed area, designation plus name */
  const nearbyLabel = (area: HolcArea): string => {
    const d = descById.get(String(area.id));
    const name = (d ? sheetName(d) : null) ?? (area.name ? String(area.name) : null);
    const raw = String(area.label ?? area.id).trim();
    const designation = /^[A-D]-?\d+$/i.test(raw) ? raw : `digitized record ${raw}`;
    return name ? `${designation} · ${name}` : designation;
  };

  /* ---------------- the loans overlay toggle ---------------- */

  const toggleOverlay = () => {
    api.onInteraction();
    setOverlayOn((v) => !v);
    setToggledOnce(true);
  };

  /* the full sheet lives in the Surveyor's Files; set the sheet
     permalink first so the room opens on this area */
  const openInFiles = () => {
    if (!selDesc) return;
    api.onInteraction();
    window.history.pushState(null, "", sheetHash(selDesc.areaId));
    dispatch({ type: "OPEN_ROOM", roomId: FILES_ROOM_ID });
  };

  /* the small-screen path to a specific sheet, no map precision needed */
  const openFilesRoom = () => {
    api.onInteraction();
    dispatch({ type: "OPEN_ROOM", roomId: FILES_ROOM_ID });
  };

  /* Find the ground under the visitor. Everything runs client side:
     the browser's own permission dialog gates the position, the 1940
     boundaries are the geojson the map already ships, and nothing is
     sent anywhere. */
  const locate = () => {
    api.onInteraction();
    if (!("geolocation" in navigator)) {
      setLocateState("denied");
      return;
    }
    setLocateState("working");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/exhibit-data/holc-chicago.geojson");
          const gj = (await res.json()) as {
            features: Array<{
              properties: { area_id: number | string; grade?: string };
              geometry: { type: string; coordinates: number[][][] | number[][][][] };
            }>;
          };
          const x = pos.coords.longitude;
          const y = pos.coords.latitude;
          const inRing = (ring: number[][]) => {
            let inside = false;
            for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
              const [xi, yi] = ring[i];
              const [xj, yj] = ring[j];
              if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
            }
            return inside;
          };
          const inFeature = (f: (typeof gj.features)[number]) => {
            const g = f.geometry;
            if (g.type === "Polygon") {
              const rings = g.coordinates as number[][][];
              return inRing(rings[0]) && rings.slice(1).every((r) => !inRing(r));
            }
            if (g.type === "MultiPolygon") {
              return (g.coordinates as number[][][][]).some(
                (rings) => inRing(rings[0]) && rings.slice(1).every((r) => !inRing(r))
              );
            }
            return false;
          };
          const hit = gj.features.find(inFeature);
          if (hit) {
            const area = holc?.areas?.find((a) => String(a.id) === String(hit.properties.area_id));
            setLocateGrade(String(hit.properties.grade ?? "").trim() || null);
            setLocateState("hit");
            if (area) {
              setSelected(area);
              setNearby(null);
            }
          } else {
            setLocateState("miss");
          }
        } catch {
          setLocateState("miss");
        }
      },
      () => setLocateState("denied"),
      { timeout: 8000, maximumAge: 300000 }
    );
  };

  const grade = selected && GRADE_WORD[selected.grade] ? selected.grade : null;
  const areaName =
    (selDesc ? sheetName(selDesc) : null) ?? (selected?.name ? String(selected.name) : null);

  return (
    <div
      className="w-full"
      data-testid="holc-map-station"
      data-framing={framing}
      data-selected={selected ? String(selected.label ?? selected.id) : "none"}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          {copy.lead}
        </p>
        {/* the two views of the same map; the flat study map is one tap away */}
        <div className="flex" role="group" aria-label="Map view">
          {(
            [
              ["relief", "In relief"],
              ["flat", "Flat map"],
            ] as const
          ).map(([id, word]) => (
            <button
              key={id}
              type="button"
              data-testid={`holc-map-view-${id}`}
              aria-pressed={view === id}
              onClick={() => {
                if (view !== id) {
                  api.onInteraction();
                  setView(id);
                  setNearby(null);
                }
              }}
              className={`exh-plat min-h-10 cursor-pointer border px-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors first:rounded-l-sm first:border-r-0 last:rounded-r-sm ${
                view === id
                  ? "border-exh-ink bg-exh-ink text-exh-linen"
                  : "border-exh-ink/40 bg-exh-linen text-exh-ink hover:border-exh-ink"
              }`}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {view === "relief" ? (
        <HolcReliefStage
          interactive
          onAreaTap={onAreaTap}
          selectedId={selected?.id ?? null}
          overlayOn={overlayOn}
          reducedMotion={api.reducedMotion}
          onInteraction={api.onInteraction}
        />
      ) : (
        <div ref={stageRef} onClick={onStageClick}>
          <MapStage frame="citywide" showPlaceholder={!mapReady}>
            {mapReady && (
              <HolcLayer frame="citywide" interactive dimUngraded onAreaTap={onAreaTap} />
            )}
            {/* the darkness: what remains when only lendable areas stay lit */}
            <rect
              x={0}
              y={0}
              width={VIEW_W}
              height={VIEW_H}
              pointerEvents="none"
              style={{
                fill: "var(--color-exh-ink)",
                opacity: overlayOn ? 0.93 : 0,
                transition: api.reducedMotion ? "none" : `opacity ${motionMs(320)}ms ease`,
              }}
            />
          </MapStage>
        </div>
      )}

      {/* ---------------- areas under an ambiguous tap ---------------- */}
      {nearby && nearby.length >= 2 && (
        <div
          data-testid="holc-map-nearby"
          className="mt-2 border border-exh-ink/25 bg-exh-linen-deep/30"
        >
          <p className="exh-plat border-b border-exh-ink/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft md:text-[11px] md:text-[10px]">
            Areas near your selection
          </p>
          <ul className="divide-y divide-exh-ink/10">
            {nearby.map((area) => (
              <li key={String(area.id)}>
                <button
                  type="button"
                  data-testid={`holc-map-nearby-${String(area.label ?? area.id)}`}
                  aria-pressed={selected?.id === area.id}
                  onClick={() => pickNearby(area)}
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-exh-linen-deep/70 ${
                    selected?.id === area.id ? "bg-exh-linen-deep" : ""
                  }`}
                >
                  {GRADE_WORD[area.grade] && <GradeSwatch grade={area.grade} />}
                  <span className="exh-plat min-w-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-exh-ink">
                    {GRADE_WORD[area.grade] ?? "Ungraded"}
                  </span>
                  <span className="exh-mono min-w-0 flex-1 truncate text-xs text-exh-ink/70">
                    {nearbyLabel(area)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* on a phone the graded areas render only a few pixels wide; the
          reading room lists every sheet and needs no map precision */}
      <p className="mt-2 text-xs leading-snug text-exh-ink-soft md:hidden">
        {"The graded areas are small at this size. For a specific sheet, the "}
        <button
          type="button"
          data-testid="holc-map-files-hint"
          onClick={openFilesRoom}
          className="cursor-pointer text-exh-ink underline decoration-exh-ink/40 underline-offset-2 hover:decoration-exh-ink"
        >
          Surveyor&rsquo;s Files reading room
        </button>
        {" is the surer path."}
      </p>

      {/* ---------------- the surveyor sheet ---------------- */}
      <PaperCard
        data-testid="holc-map-readout"
        className="mt-3 w-full p-4"
        aria-live="polite"
      >
        {!selected && (
          <p className="text-sm leading-snug text-exh-ink-soft">
            {mapReady
              ? "No area is open. Select a graded area to read its file."
              : "Map data is being prepared. The sheets open once it loads."}
          </p>
        )}
        {selected && (
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
                {/* a bare number here is our digitization key, not a HOLC
                    designation; say so instead of printing a naked id */}
                {/^[A-D]-?\d+$/i.test(String(selected.label ?? selected.id).trim())
                  ? String(selected.label ?? selected.id).trim()
                  : `digitized record ${String(selected.label ?? selected.id).trim()}`}
              </span>
            </div>
            {areaName && (
              <p className="exh-serif mt-1.5 text-base leading-snug text-exh-ink">{areaName}</p>
            )}

            <div className="mt-3 border-t border-exh-ink/15 pt-3">
              {excerptUsable && selDesc ? (
                <div>
                  <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft md:text-[11px] md:text-[10px]">
                    from the sheet HOLC&rsquo;s surveyors filed, 1939 to 1940
                  </p>
                  <span className="exh-plat mt-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[11px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft md:text-[11px] md:text-[9px]">
                    period document; contains the era&rsquo;s racist language
                  </span>
                  {selDesc.excerptLabel && (
                    <p className="exh-mono mt-2 text-[11px] text-exh-ink/70 md:text-[11px] md:text-[10px]">{selDesc.excerptLabel}</p>
                  )}
                  <blockquote className="exh-serif mt-1 text-sm leading-snug text-exh-ink italic">
                    &ldquo;{selDesc.excerpt.trim()}&rdquo;
                  </blockquote>
                </div>
              ) : (
                <p className="text-sm leading-snug text-exh-ink-soft">
                  {desc.done
                    ? "No surveyor sheet survives in the digitized record for this area."
                    : "Reading the survey record."}
                </p>
              )}
              {selDesc && (
                <button
                  type="button"
                  data-testid="holc-map-open-files"
                  onClick={openInFiles}
                  className="exh-plat mt-3 min-h-10 cursor-pointer border border-exh-ink/40 bg-exh-linen px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-exh-ink transition-colors hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
                >
                  Read the full sheet in the Surveyor&rsquo;s Files
                </button>
              )}
            </div>
          </div>
        )}
      </PaperCard>

      {/* ---------------- the loans overlay toggle ---------------- */}
      <div className="mt-4">
        <button
          type="button"
          data-testid="holc-map-hold"
          aria-pressed={overlayOn}
          onClick={toggleOverlay}
          className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-sm border px-4 py-2 text-left transition-colors ${
            overlayOn ? "border-exh-ink bg-exh-ink/90" : "border-exh-ink/40 bg-exh-linen-deep/50"
          }`}
        >
          <span
            className={`text-sm font-semibold ${
              overlayOn ? "text-exh-linen" : "text-exh-ink"
            }`}
          >
            Where could a Black family get a federally backed loan?
          </span>
          <span
            className={`exh-plat shrink-0 text-[11px] uppercase tracking-[0.15em] md:text-[11px] md:text-[10px] ${
              overlayOn ? "text-exh-linen/80" : "text-exh-ink-soft"
            }`}
          >
            {overlayOn ? "showing. Select again to restore the map" : "select to see"}
          </span>
        </button>

        {toggledOnce && (
          <div
            data-testid="holc-map-hold-caption"
            className={`mt-2 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4 ${
              api.reducedMotion ? "" : "exh-ledger-in"
            } ${overlayOn ? "" : "opacity-90"}`}
          >
            <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">
              {copy.overlayCaption}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <FactValue id="redlining.holc_survey_chicago" size="sm" />
              <FactValue id="redlining.black_loans_under_2pct" size="sm" />
            </div>
          </div>
        )}

      {/* ---------------- the ground under you ---------------- */}
      <div id="find-your-ground" className="mt-3 flex scroll-mt-24 flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="holc-map-locate"
          onClick={locate}
          disabled={locateState === "working"}
          className="min-h-12 cursor-pointer rounded-sm border border-exh-ink/40 bg-exh-linen-deep/50 px-4 text-sm font-semibold text-exh-ink transition-colors hover:border-exh-ink disabled:cursor-wait disabled:text-exh-ink-soft"
        >
          {locateState === "working" ? "Reading the 1940 boundaries" : "Find the ground under you"}
        </button>
        <p data-testid="holc-map-locate-result" className="min-w-0 flex-1 text-sm leading-snug text-exh-ink-soft">
          {locateState === "idle" &&
            "Uses your device location once, on your permission. Nothing leaves this page."}
          {locateState === "hit" &&
            (locateGrade
              ? `You are standing on ground the surveyors graded ${locateGrade} in 1940. Its sheet is open above.`
              : "You are standing inside the surveyed area. Its sheet is open above.")}
          {locateState === "miss" &&
            "You are outside the ground the 1939 to 1940 Chicago survey covered."}
          {locateState === "denied" &&
            "Location was not shared. Click any area on the map instead."}
        </p>
      </div>
      </div>
    </div>
  );
}
