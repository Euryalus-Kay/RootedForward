"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "FairFigure". One credited photograph of the 1893 fair,   */
/*  full column, nothing overlaid. The figure def carries over         */
/*  verbatim from the old page's chapter layout                        */
/*  (src/lib/exhibit/content/index.ts, ch2); the credit line resolves  */
/*  from /media/hyde-park/credits.json inside FigureBlock. The aspect  */
/*  wrapper pins the true 1805x1241 ratio so nothing shifts on load.   */
/* ------------------------------------------------------------------ */
import type { SceneProps } from "./registry";
import FigureBlock from "../../FigureBlock";

const FAIR = {
  src: "/media/hyde-park/img/worlds-fair-1.jpg",
  alt: "White plaster palaces of the Court of Honor around the Grand Basin at the World's Columbian Exposition.",
  creditKey: "worlds-fair-1",
  caption: "The Court of Honor in Jackson Park, 1893.",
};

export default function FairFigure(_props: SceneProps) {
  return (
    <div data-testid="scene-fairFigure">
      <div className="[&_img]:aspect-[1805/1241] [&_img]:object-contain">
        <FigureBlock src={FAIR.src} alt={FAIR.alt} caption={FAIR.caption} creditKey={FAIR.creditKey} />
      </div>
    </div>
  );
}
