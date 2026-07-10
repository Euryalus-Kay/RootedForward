/* ------------------------------------------------------------------ */
/*  R9 Stage, the server-rendered map. This SVG ships in the initial   */
/*  HTML so the 1940 map is on screen at first paint with zero client  */
/*  JavaScript. The client StageController never re-renders this       */
/*  subtree; it steers it through data attributes on the wrapper (CSS  */
/*  does the rest) plus a class toggle per area during the grade       */
/*  flood. geometry.json stays out of the client bundle by design.     */
/* ------------------------------------------------------------------ */
import geometry from "@/lib/exhibit/ground/geometry.json";

const GRADES = ["A", "B", "C", "D", "U"] as const;
/* generous paper bounds so every viewBox (citywide crop, Black Belt
   crop, Hyde Park frame) sits on paper */
const VIEW_PAPER_W = 3760;
const VIEW_PAPER_H = 2640;

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
      aria-label="The 1940 federal home-lending security map of Chicago, redrawn from the government's files. Grades A through D shade each surveyed area; marks accumulate on it as the exhibit moves through the century."
      className="ground-svg"
    >
      {/* the paper itself, so value shifts (the bombing chapter's dim)
          darken the ground and not just the ink on it */}
      <rect data-paper x={-600} y={-600} width={VIEW_PAPER_W} height={VIEW_PAPER_H} aria-hidden="true" />
      {/* citywide layers (also serve the Black Belt crop framing) */}
      <g data-city-layer>
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
        {/* the one present-day mark; rust means now and this is its only
            appearance on the map itself (East Woodlawn beside the Obama
            Center, the ground moving again) */}
        <g data-today aria-hidden="true">
          {(() => {
            const woodlawn = city.labels.find((l) => l.t === "WOODLAWN");
            return woodlawn ? (
              <circle data-today-mark cx={woodlawn.x} cy={woodlawn.y + 26} r={15} />
            ) : null;
          })()}
        </g>
      </g>

      {/* Hyde Park township framing */}
      <g data-hp-layer>
        <path data-hp-lake d={hp.lake} aria-hidden="true" />
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
    </svg>
  );
}
