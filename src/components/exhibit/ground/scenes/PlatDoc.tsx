"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "PlatDoc". The 1851 Rees survey of Cook County, the       */
/*  exhibit's first liftable document. The figure def (src, alt,       */
/*  caption, creditKey) carries over verbatim from the old page's      */
/*  chapter layout (src/lib/exhibit/content/index.ts, ch1); the        */
/*  credit line resolves from /media/hyde-park/credits.json inside     */
/*  FigureBlock. Lifting is a discrete state, no motion. The aspect    */
/*  wrapper pins the true 1920x2040 ratio so nothing shifts on load.   */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import type { SceneProps } from "./registry";
import FigureBlock from "../../FigureBlock";

const PLAT = {
  src: "/media/hyde-park/img/land-cook-county-1853-plat.jpg",
  alt: "Hand-colored 1851 survey map of Cook and DuPage counties, gridded into townships, with the young city of Chicago on the lakeshore.",
  creditKey: "land-cook-county-1853-plat",
  caption:
    "An 1851 map of Cook County by the land agent James H. Rees. The grid that turned treaty land into salable lots had reached this shore.",
  width: 1920,
  height: 2040,
};

export default function PlatDoc(_props: SceneProps) {
  const [lifted, setLifted] = useState(false);

  return (
    <section data-testid="scene-platDoc" aria-label="The county plat document">
      <div className="[&_img]:aspect-[1920/2040] [&_img]:object-contain">
        <FigureBlock src={PLAT.src} alt={PLAT.alt} caption={PLAT.caption} creditKey={PLAT.creditKey} />
      </div>
      <div className="mt-3">
        <button
          type="button"
          data-testid="plat-lift-button"
          aria-expanded={lifted}
          onClick={() => setLifted((v) => !v)}
          className="exh-plat cursor-pointer border border-exh-ink/25 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-exh-ink hover:bg-exh-linen-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
        >
          {lifted ? "Set the document down" : "Lift the document"}
        </button>
      </div>
      {lifted ? (
        <div className="mt-3 border border-exh-ink/25 bg-exh-linen-deep/50 p-2" data-testid="plat-lifted">
          <div
            tabIndex={0}
            role="group"
            aria-label="The plat enlarged. Scroll inside the frame to pan the survey grid."
            className="max-h-[70svh] overflow-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
          >
            {/* Archival scan served from /public; plain img is intentional here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PLAT.src}
              alt=""
              aria-hidden="true"
              width={PLAT.width}
              height={PLAT.height}
              loading="lazy"
              className="h-auto w-[200%] max-w-none"
            />
          </div>
          <p className="exh-plat mt-2 text-[11px] uppercase tracking-[0.14em] text-exh-ink-soft">
            Scroll inside the frame to pan.
          </p>
        </div>
      ) : null}
    </section>
  );
}
