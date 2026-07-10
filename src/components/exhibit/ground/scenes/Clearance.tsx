"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "Clearance", Act 4. A visitor-controlled before-and-      */
/*  after of the Hyde Park A and B renewal ground, told through the    */
/*  exhibit's real archival photographs (no invented footprints; the   */
/*  data holds no per-building geometry, see design.md answer 5).      */
/*  Below it, One Mark One Family, a canvas grid of exactly one ink    */
/*  square per displaced family. The square count derives from the     */
/*  fact registry, never from a literal in this file.                  */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import type { SceneProps } from "./registry";
import { getFact, hasFact } from "@/lib/exhibit/facts";
import { cn } from "@/lib/utils";
import { FactValue } from "../../shared/FactValue";

/* Both states stay mounted (opacity swap, not display) so the second
 * photograph is already decoded when the visitor first toggles. */
const STATES = [
  {
    key: "before",
    label: "Before the clearance",
    src: "/media/hyde-park/img/urban-renewal-1.jpg",
    alt: "Hyde Park from the air in 1928. Blocks of flats, hotels, and houses fill the street grid down to the lakefront.",
    caption: "Hyde Park from the air, decades before the plan. The blocks stood fully built.",
    credit: "Chicago Aerial Survey Co., 1928. Public domain.",
  },
  {
    key: "after",
    label: "After the clearance",
    src: "/media/hyde-park/img/urban-renewal-3.jpg",
    alt: "A long modernist apartment slab, University Apartments, standing in the median of 55th Street in Hyde Park.",
    caption:
      "What replaced the demolished blocks. University Apartments, raised in the early 1960s in the cleared center of 55th Street.",
    credit: "Photograph by Teemu008, 2010. CC BY-SA 4.0.",
  },
] as const;

/* ---- One Mark One Family ------------------------------------------- */

const FAMILIES_FACT_ID = "renewal.families_displaced";

/* grid geometry in CSS pixels; the pitch keeps single squares readable
 * at 390px while the column runs tall enough to be scrolled past */
const PITCH = 12;
const SQUARE = 8;

function FamilyGrid() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fact = hasFact(FAMILIES_FACT_ID) ? getFact(FAMILIES_FACT_ID) : null;
  const total = fact && typeof fact.value === "number" ? fact.value : 0;

  useEffect(() => {
    if (!total) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const width = wrap.clientWidth;
      if (!width) return;
      const cols = Math.max(16, Math.floor(width / PITCH));
      const rows = Math.ceil(total / cols);
      const height = rows * PITCH;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      /* squares in ink on the linen; no red anywhere in this graphic */
      ctx.fillStyle = getComputedStyle(canvas).color;
      ctx.globalAlpha = 0.8;
      const inset = (PITCH - SQUARE) / 2;
      let drawn = 0;
      for (let r = 0; r < rows && drawn < total; r += 1) {
        for (let c = 0; c < cols && drawn < total; c += 1) {
          ctx.fillRect(c * PITCH + inset, r * PITCH + inset, SQUARE, SQUARE);
          drawn += 1;
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [total]);

  if (!fact || !total) return null;

  return (
    <div className="mt-16">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        One mark, one family
      </p>
      <div className="mt-3 border border-exh-ink/25 p-3">
        {/* the estimate label lives inside the graphic margin on purpose */}
        <p className="exh-plat text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
          One square is one displaced family. The count is an estimate.
        </p>
        <div ref={wrapRef} className="mt-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${fact.display}, drawn one small square each. The count is an estimate.`}
            className="block text-exh-ink"
          />
        </div>
      </div>
      {/* text equivalent of the grid, with the sourced figure */}
      <p className="mt-4 max-w-[34rem] font-display text-base leading-relaxed text-exh-ink">
        <FactValue id={FAMILIES_FACT_ID} /> were moved off the renewal ground over the course of
        the program. Each square above marks one household once.
      </p>
    </div>
  );
}

/* ---- the scene ------------------------------------------------------ */

export default function Clearance(_props: SceneProps) {
  const [stateKey, setStateKey] = useState<(typeof STATES)[number]["key"]>("before");
  const active = STATES.find((s) => s.key === stateKey) ?? STATES[0];

  return (
    <section data-testid="scene-clearance" className="max-w-[38rem]">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        The same ground, two states
      </p>

      <div
        role="group"
        aria-label="Show the renewal ground before or after the clearance"
        className="mt-3 inline-flex border border-exh-ink/40"
      >
        {STATES.map((s) => {
          const on = s.key === stateKey;
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setStateKey(s.key)}
              className={cn(
                "exh-plat min-h-11 px-4 py-2 text-[11px] uppercase tracking-[0.16em]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink",
                on ? "bg-exh-ink text-exh-linen" : "text-exh-ink hover:bg-exh-linen-deep/60"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <figure className="mt-4">
        <div className="relative aspect-[4/3] border border-exh-ink/25 bg-exh-linen-deep/50">
          {STATES.map((s) => {
            const on = s.key === stateKey;
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={s.key}
                src={s.src}
                alt={s.alt}
                width={1200}
                height={900}
                decoding="async"
                aria-hidden={!on}
                className={cn(
                  "absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)] object-contain",
                  !on && "opacity-0"
                )}
              />
            );
          })}
        </div>
        <figcaption className="mt-2 min-h-16 text-xs leading-relaxed text-exh-ink-soft">
          <span className="font-display italic">{active.caption}</span>{" "}
          <span className="exh-plat uppercase tracking-[0.08em]">{active.credit}</span>
        </figcaption>
      </figure>

      <p className="mt-6 max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The plan the council approved marked <FactValue id="renewal.buildings_638" /> for
        demolition on this ground.
      </p>

      <FamilyGrid />
    </section>
  );
}
