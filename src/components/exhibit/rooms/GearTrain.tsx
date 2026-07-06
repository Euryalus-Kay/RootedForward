"use client";
/* ------------------------------------------------------------------ */
/*  THE GEAR TRAIN, the counter-machine room's interlock. Five meshed  */
/*  gear circles in one SVG, one per machine, laid out on the mesh     */
/*  graph in data/exhibit/gear_train.json (a four-gear ring with the   */
/*  bulldozer hung off the contract). One shared angle drives all      */
/*  five; drag any gear with the pointer or focus one and use the      */
/*  arrow keys, in either direction. Each mesh-point caption from the  */
/*  json fades in as the train's travel passes its link; the lesson    */
/*  line closes the station once all five are read. The station is     */
/*  LOCKED until all five machine rooms have been visited; unlocking   */
/*  marks "gear-train-unlocked" once per session.                      */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import gearJson from "../../../../data/exhibit/gear_train.json";
import type { MachineId } from "@/lib/exhibit/types";
import { allMachines, machineOf } from "@/lib/exhibit/machines";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { announce } from "@/lib/exhibit/focus";
import PaperCard from "../shared/PaperCard";

const UNLOCK_KEY = "gear-train-unlocked";

interface GearLink {
  from: MachineId;
  to: MachineId;
  label: string;
}

const GEAR_DOC = gearJson as unknown as { links: GearLink[]; lesson: string };
const LINKS = GEAR_DOC.links;

/* geometry, in viewBox units; linked centers sit exactly 2r apart */
const VIEW_W = 540;
const VIEW_H = 300;
const R = 59;

interface GearDef {
  id: MachineId;
  cx: number;
  cy: number;
  /** mesh parity; adjacent gears counter-rotate */
  parity: 1 | -1;
}

const GEARS: GearDef[] = [
  { id: "code", cx: 260, cy: 88, parity: 1 },
  { id: "deed", cx: 378, cy: 88, parity: -1 },
  { id: "map", cx: 378, cy: 206, parity: 1 },
  { id: "contract", cx: 260, cy: 206, parity: -1 },
  { id: "bulldozer", cx: 142, cy: 206, parity: 1 },
];

const gearOf = (id: MachineId) => GEARS.find((g) => g.id === id);

/** degrees of shared travel that reveal each successive mesh caption */
const STEP_DEG = 40;

/** shortest signed angular difference in degrees */
function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export default function GearTrain() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();

  const machineIds = allMachines().map((m) => m.machineId);
  const visitedCount = machineIds.filter((id) => state.visitedRooms.includes(id)).length;
  const unlocked = visitedCount === machineIds.length;

  /* the unlock is a once-per-session moment */
  const fired = state.firedOnce.includes(UNLOCK_KEY);
  useEffect(() => {
    if (unlocked && !fired) dispatch({ type: "MARK_FIRED", key: UNLOCK_KEY });
  }, [unlocked, fired, dispatch]);

  const [angle, setAngle] = useState(0);
  const [traveled, setTraveled] = useState(0);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ gear: GearDef; lastPointerAngle: number } | null>(null);
  const revealedRef = useRef(0);

  const revealed = Math.min(LINKS.length, Math.floor(traveled / STEP_DEG));
  const complete = revealed >= LINKS.length;

  /* announce each caption the moment its mesh point lights */
  useEffect(() => {
    if (revealed > revealedRef.current) {
      const line = LINKS[revealed - 1];
      if (line) announce(line.label);
      if (revealed >= LINKS.length) announce(GEAR_DOC.lesson);
    }
    revealedRef.current = revealed;
  }, [revealed]);

  if (!unlocked) {
    return (
      <PaperCard
        tone="deep"
        data-testid="gear-train"
        data-locked="true"
        className="p-5 text-center sm:p-6"
      >
        <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          Locked
        </p>
        <p className="mt-2 font-display text-lg leading-relaxed text-exh-ink">
          Visit all five machine rooms to unlock the gear train.
        </p>
        <p className="exh-plat mt-3 text-[11px] uppercase tracking-[0.2em] text-exh-ink-soft">
          Machine rooms visited, <span className="exh-mono">{visitedCount}</span> of{" "}
          <span className="exh-mono">5</span>
        </p>
      </PaperCard>
    );
  }

  /** pointer position in viewBox units */
  const toView = (e: PointerEvent): { x: number; y: number } | null => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    };
  };

  const pointerAngleAbout = (e: PointerEvent, gear: GearDef): number | null => {
    const p = toView(e);
    if (!p) return null;
    return (Math.atan2(p.y - gear.cy, p.x - gear.cx) * 180) / Math.PI;
  };

  const turnBy = (deltaDeg: number) => {
    if (deltaDeg === 0) return;
    setAngle((a) => a + deltaDeg);
    setTraveled((t) => t + Math.abs(deltaDeg));
  };

  const onPointerDown = (gear: GearDef) => (e: PointerEvent<HTMLButtonElement>) => {
    const a = pointerAngleAbout(e, gear);
    if (a == null) return;
    dragRef.current = { gear, lastPointerAngle: a };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const a = pointerAngleAbout(e, drag.gear);
    if (a == null) return;
    const d = angleDelta(a, drag.lastPointerAngle);
    drag.lastPointerAngle = a;
    /* the gear under the hand follows the hand; parity squares away */
    turnBy(d * drag.gear.parity);
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let d = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") d = 18;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -18;
    if (!d) return;
    e.preventDefault();
    turnBy(d);
  };

  /* mesh points at each linked pair's midpoint */
  const meshPoints = LINKS.map((link) => {
    const a = gearOf(link.from);
    const b = gearOf(link.to);
    return a && b ? { x: (a.cx + b.cx) / 2, y: (a.cy + b.cy) / 2 } : { x: 0, y: 0 };
  });

  return (
    <div
      data-testid="gear-train"
      data-locked="false"
      data-revealed={revealed}
      data-complete={String(complete)}
    >
      <div ref={fieldRef} className="relative mx-auto w-full max-w-[560px]">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-auto w-full select-none" aria-hidden="true">
          {GEARS.map((g) => {
            const m = machineOf(g.id);
            return (
              <g key={g.id}>
                {/* the rotating iron: toothed rim plus one index dot */}
                <g transform={`rotate(${(g.parity * angle).toFixed(2)} ${g.cx} ${g.cy})`}>
                  <circle
                    cx={g.cx}
                    cy={g.cy}
                    r={R - 5}
                    fill="none"
                    style={{ stroke: "var(--color-exh-ink)" }}
                    strokeOpacity={0.6}
                    strokeWidth={9}
                    strokeDasharray="8 7.45"
                  />
                  <circle
                    cx={g.cx}
                    cy={g.cy - (R - 20)}
                    r={3.5}
                    style={{ fill: "var(--color-exh-ink)" }}
                    fillOpacity={0.75}
                  />
                </g>
                {/* the still face: plate and nameplate */}
                <circle
                  cx={g.cx}
                  cy={g.cy}
                  r={R - 12}
                  style={{ fill: "var(--color-exh-linen-deep)", stroke: "var(--color-exh-ink)" }}
                  strokeOpacity={0.45}
                  strokeWidth={1.25}
                />
                <text
                  x={g.cx}
                  y={g.cy + 4}
                  textAnchor="middle"
                  className="exh-plat"
                  style={{ fill: "var(--color-exh-ink)" }}
                  fillOpacity={0.9}
                  fontSize={11}
                  letterSpacing={1}
                >
                  {m?.name ?? g.id}
                </text>
              </g>
            );
          })}

          {/* mesh points, numbered in json order, lit as read */}
          {meshPoints.map((p, i) => {
            const lit = revealed > i;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9}
                  style={{
                    fill: lit ? "var(--color-exh-gold)" : "var(--color-exh-linen-deep)",
                    stroke: "var(--color-exh-ink)",
                  }}
                  strokeOpacity={lit ? 0.8 : 0.35}
                  strokeWidth={1.25}
                />
                <text
                  x={p.x}
                  y={p.y + 3.5}
                  textAnchor="middle"
                  className="exh-mono"
                  style={{ fill: "var(--color-exh-ink)" }}
                  fillOpacity={lit ? 0.95 : 0.5}
                  fontSize={10}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* one 48px handle over each gear; drag or arrow keys */}
        {GEARS.map((g) => {
          const m = machineOf(g.id);
          return (
            <button
              key={g.id}
              type="button"
              data-testid={`gear-train-handle-${g.id}`}
              aria-label={`Turn the gear train from ${m ? m.name : g.id}. All five gears turn together.`}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={LINKS.length}
              aria-valuenow={revealed}
              aria-valuetext={
                complete
                  ? "All five mesh points read"
                  : `${revealed} of ${LINKS.length} mesh points read`
              }
              onPointerDown={onPointerDown(g)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
              className="absolute aspect-square min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-transparent focus-visible:border-exh-blue active:cursor-grabbing"
              style={{
                left: `${(g.cx / VIEW_W) * 100}%`,
                top: `${(g.cy / VIEW_H) * 100}%`,
                width: `${((2 * R) / VIEW_W) * 100}%`,
              }}
            />
          );
        })}
      </div>

      <p className="exh-plat mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-exh-ink-soft">
        {complete
          ? "Read. The train turns as one piece."
          : "Drag any gear, or focus one and turn it with the arrow keys"}
      </p>

      {/* mesh captions, inked in reading order as the train travels */}
      <ol className="mx-auto mt-5 flex max-w-xl flex-col gap-2">
        {LINKS.slice(0, revealed).map((link, i) => (
          <li key={i} className="exh-ledger-in flex items-baseline gap-3">
            <span className="exh-mono shrink-0 text-xs text-exh-ink-soft">{i + 1}</span>
            <span className="text-sm leading-relaxed text-exh-ink">{link.label}</span>
          </li>
        ))}
      </ol>
      {!complete ? (
        <p className="exh-plat mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-exh-ink-soft">
          Mesh points read, <span className="exh-mono">{revealed}</span> of{" "}
          <span className="exh-mono">{LINKS.length}</span>
        </p>
      ) : (
        <p
          data-testid="gear-train-lesson"
          className="mx-auto mt-5 max-w-xl border-t border-exh-ink/15 pt-4 text-center font-display text-lg italic leading-relaxed text-exh-ink"
        >
          {GEAR_DOC.lesson}
        </p>
      )}
    </div>
  );
}
