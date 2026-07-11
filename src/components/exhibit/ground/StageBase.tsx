/* ------------------------------------------------------------------ */
/*  R10 Stage, the server-rendered pressed sheet. This SVG ships in    */
/*  the initial HTML so the 1940 map is on screen at first paint with  */
/*  zero client JavaScript, flat and filter-free (the press and the    */
/*  tilt are later events). The client StageController never re-       */
/*  renders this subtree; it steers it through data attributes on the  */
/*  wrapper plus a class toggle per area during the grade flood.       */
/*  geometry.json stays out of the client bundle by design.            */
/*                                                                     */
/*  Everything after <defs> lives inside <g data-camera>: the FLIP     */
/*  camera transforms that group, never the svg element, so the whole  */
/*  drawing stays inside the viewport through a flight (audit p1       */
/*  flip-camera-cut). Layer order, bottom to top: paper, lake, land,   */
/*  parks, section grid, neighborhood fabric, grade fills, linework,   */
/*  tap areas, marks, labels, boundary ghost, today ring, veil.        */
/*  Ground sources: City of Chicago community areas (land, fabric,     */
/*  and the shoreline the lake fill derives from) and Chicago Park     */
/*  District boundaries.                                               */
/* ------------------------------------------------------------------ */
import geometry from "@/lib/exhibit/ground/geometry.json";
import { PAPER_X, PAPER_Y, PAPER_W, PAPER_H } from "./veil";

const GRADES = ["A", "B", "C", "D", "U"] as const;

/* intaglio depths, the R7-approved quantized rank form: four ranked
   steps A..D, U stays flat (the surveyors never ranked those areas) */
const PRESS_DEPTH: Record<string, number> = { A: 0.6, B: 1.1, C: 1.7, D: 2.4 };

const PAPER_RECT = `M${PAPER_X} ${PAPER_Y}H${PAPER_X + PAPER_W}V${PAPER_Y + PAPER_H}H${PAPER_X}Z`;

/* a label may only render inside a frame if its anchor sits at least
   this far from every viewBox edge; anything closer clips mid-word */
const LABEL_EDGE_PAD = 40;

function insideFrame(viewBox: string, x: number, y: number): boolean {
  const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
  return (
    x >= vx + LABEL_EDGE_PAD &&
    x <= vx + vw - LABEL_EDGE_PAD &&
    y >= vy + LABEL_EDGE_PAD &&
    y <= vy + vh - LABEL_EDGE_PAD
  );
}

export default function StageBase() {
  const city = geometry.citywide;
  const hp = geometry.hydePark;
  return (
    <svg
      data-ground-svg
      viewBox={city.viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="The 1940 federal home-lending security map of Chicago, redrawn from the government's files onto its real ground, the lake, the parks, and the city's neighborhoods. Grades A through D shade each surveyed area; marks accumulate on it as the exhibit moves through the century."
      className="ground-svg"
    >
      <defs>
        {/* the intaglio press, one true inner shadow per graded rank
            (shape minus its own offset blur leaves the crescent along
            the lit edge, inked; the audit's press-inverted p1 caught
            the outer-shadow form that read as raised). Applied by CSS
            only when the wrapper carries data-press="on". */}
        {GRADES.filter((g) => PRESS_DEPTH[g]).map((g) => (
          <filter key={g} id={`ground-press-${g.toLowerCase()}`} x="-8%" y="-8%" width="116%" height="116%">
            <feOffset in="SourceAlpha" dx={PRESS_DEPTH[g] * 0.6} dy={PRESS_DEPTH[g]} result="off" />
            <feGaussianBlur in="off" stdDeviation={PRESS_DEPTH[g] * 0.55} result="blur" />
            <feComposite in="SourceAlpha" in2="blur" operator="out" result="crescent" />
            <feFlood floodColor="#262019" floodOpacity={0.16 + PRESS_DEPTH[g] * 0.09} result="ink" />
            <feComposite in="ink" in2="crescent" operator="in" result="press" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="press" />
            </feMerge>
          </filter>
        ))}
        {/* water-lining for the lake, the period engraving convention:
            horizontal hairlines, denser near nothing, pure pattern */}
        <pattern id="ground-waterlines" width="10" height="7" patternUnits="userSpaceOnUse">
          <line x1="0" y1="3.5" x2="10" y2="3.5" stroke="#262019" strokeOpacity="0.10" strokeWidth="0.7" />
        </pattern>
        {/* tap-to-raise: the one open sheet lifts off the plate while
            its record is read (applied per tapped area path only) */}
        <filter id="ground-lift" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="1.2" dy="1.8" stdDeviation="1.1" floodColor="#262019" floodOpacity="0.4" />
        </filter>
        {/* the survey grid never rules open water (audit: the 1830s
            plats did not grid the lake); everything except the lake */}
        <clipPath id="ground-dryland" clipPathUnits="userSpaceOnUse">
          <path d={PAPER_RECT + city.ground.lake} clipRule="evenodd" />
        </clipPath>
        <clipPath id="ground-dryland-hp" clipPathUnits="userSpaceOnUse">
          <path d={PAPER_RECT + hp.lake} clipRule="evenodd" />
        </clipPath>
      </defs>

      <g data-camera>
        {/* the paper itself, so value shifts (the bombing chapter's dim)
            darken the ground and not just the ink on it */}
        <rect data-paper x={PAPER_X} y={PAPER_Y} width={PAPER_W} height={PAPER_H} aria-hidden="true" />

        {/* citywide layers (also serve the Black Belt crop framing) */}
        <g data-city-layer>
          {/* the ground plane; every layer here is recorded geometry */}
          {/* NOTE: the linework, fabric, and water-lining layers repeat
              their source path data instead of <use>-referencing it;
              use-clones inherit the original's matched CSS (the fills),
              so deduping them restyles the page. Recorded as a declined
              audit item (ssr-double-payload). */}
          <g data-ground-plane aria-hidden="true">
            <path data-lake d={city.ground.lake} data-source="community-areas-hull" />
            <path data-lake-lines d={city.ground.lake} fill="url(#ground-waterlines)" />
            <path data-land d={city.ground.land} fillRule="evenodd" data-source="chicago-community-areas" />
            <path data-parks d={city.ground.parks} data-source="chicago-park-district" />
            <path data-grid d={city.ground.grid} clipPath="url(#ground-dryland)" data-source="plss-mile-arithmetic" />
            <path data-fabric d={city.ground.land} fillRule="evenodd" data-source="chicago-community-areas" />
          </g>
          <g data-grade-fills aria-hidden="true">
            {GRADES.map((g) => (
              <path key={g} data-gfill={g} d={city.gradeFills[g]} fillRule="evenodd" />
            ))}
          </g>
          <g data-linework aria-hidden="true">
            {GRADES.map((g) => (
              <path key={g} data-gline={g} d={city.gradeFills[g]} fillRule="evenodd" />
            ))}
          </g>
          <g data-areas aria-hidden="true">
            {city.areas.map((a) => (
              <path key={a.id} data-aid={a.id} data-g={a.g} className="ga" d={a.d} fillRule="evenodd" />
            ))}
          </g>
          <g data-marks aria-hidden="true">
            <rect
              data-square
              x={city.square.x}
              y={city.square.y}
              width={city.square.w}
              height={city.square.h}
            />
            {city.marks.map((m) => (
              <circle key={m.id} data-mark={m.id} cx={m.x} cy={m.y} r={3.2} />
            ))}
          </g>
          <g data-city-labels aria-hidden="true">
            {city.labels.map((l) => (
              <text
                key={l.t}
                x={l.x}
                y={l.y}
                data-role={l.role}
                data-name={l.t}
                /* labels whose anchor clips against the Black Belt crop
                   hide while that frame is up (CSS reads this flag) */
                data-bb={insideFrame(city.blackBeltViewBox, l.x, l.y) ? "in" : "out"}
              >
                {l.t}
              </text>
            ))}
          </g>
          {/* the township-era line's ghost (drawn from the modern
              community-area record; the colophon says so), for the
              finale sum state */}
          <path data-city-boundary d={city.boundary} aria-hidden="true" />
          {/* the one present-day mark; rust means now and this is its only
              appearance on the map itself (East Woodlawn beside the Obama
              Center, the ground moving again), at its true geography */}
          <g data-today aria-hidden="true">
            <circle data-today-halo cx={city.todayAnchor.x} cy={city.todayAnchor.y} r={34} />
            <circle data-today-mark cx={city.todayAnchor.x} cy={city.todayAnchor.y} r={31} />
            <text data-today-tag x={city.todayAnchor.x} y={city.todayAnchor.y + 62}>
              EAST WOODLAWN, 2026
            </text>
          </g>
        </g>

        {/* Hyde Park township framing, the second sheet on the desk */}
        <g data-hp-layer>
          <path data-hp-lake d={hp.lake} aria-hidden="true" />
          <path data-hp-lake-lines d={hp.lake} fill="url(#ground-waterlines)" aria-hidden="true" />
          <g data-hp-ground aria-hidden="true">
            <path data-parks d={hp.ground.parks} data-source="chicago-park-district" />
            <path data-grid d={hp.ground.grid} clipPath="url(#ground-dryland-hp)" data-source="plss-mile-arithmetic" />
          </g>
          <g data-hp-grade-fills aria-hidden="true">
            {GRADES.map((g) => (
              <path key={g} data-hpfill={g} d={hp.gradeFills[g]} fillRule="evenodd" />
            ))}
          </g>
          <path data-hp-boundary d={hp.boundary} aria-hidden="true" />
          <g data-hp-labels aria-hidden="true">
            {/* only labels that sit honestly inside the township frame
                render; off-frame anchors (Kenwood, Woodlawn south of the
                crop, the lake name) would clip mid-word at the edges */}
            {hp.labels
              .filter((l) => insideFrame(hp.viewBox, l.x, l.y))
              .map((l) => (
                <text key={l.t} x={l.x} y={l.y} data-role={l.role} data-name={l.t}>
                  {l.t}
                </text>
              ))}
          </g>
        </g>

        {/* the spotlight veil, above both sheets; the controller writes
            its hole (real geometry) per step */}
        <path data-veil d="" fillRule="evenodd" aria-hidden="true" />
      </g>
    </svg>
  );
}
