"use client";
/* ------------------------------------------------------------------ */
/*  R10 Stage controller, the Pressed Sheet's hand. Owns the desk/     */
/*  sheet wrapper around the server-rendered map, translates the       */
/*  active step's StageState into data attributes (CSS steers every    */
/*  layer), runs the FLIP camera for within-frame moves, cuts frames   */
/*  as second sheets laid on the desk, writes the veil's hole, sets    */
/*  the sheet's lean, stamps the press, keeps the marks readable at    */
/*  every zoom, and feeds the title block. It never React-renders the  */
/*  SVG subtree.                                                       */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, type ReactNode } from "react";
import { useGround } from "./engine/GroundProvider";
import { createCamera, fitBox, parseViewBox, type Box, type Camera } from "./engine/camera";
import { VEIL_RECT } from "./veil";
import SourceSup from "../shared/SourceSup";

export interface StageClientProps {
  /** default citywide viewBox (cropped to the polygon mass) */
  viewBox: string;
  /** crop viewBox for the bombing chapter framing */
  blackBeltViewBox: string;
  /** the Hyde Park township framing's viewBox */
  hpViewBox: string;
  /** area-id batches inked per flood step, in sheet filing order */
  floodBatches: number[][];
  /** filing-month label per batch for the title block counter */
  floodBatchLabels: string[];
  /** label anchor points (stage-note positioning), viewBox units */
  anchors: Record<string, { x: number; y: number }>;
  /** anchor positions as percentages of the citywide home crop */
  anchorsPct: Record<string, { left: number; top: number }>;
  /** named camera targets, real bounding boxes in citywide units */
  focus: Record<string, Box>;
  /** named veil holes, real-geometry path strings */
  veilHoles: Record<string, string>;
  /** the magnifying lens beats: circle + which frame owns each */
  loupes: Record<string, { frame: string; cx: number; cy: number; r: number }>;
}

/** which strata an era shows; the grid is the 1830s survey's own
 *  instrument, the fabric is a modern index that would fake period
 *  detail before 1900 */
function strataFor(era: string): { grid: boolean; fabric: boolean; parks: boolean } {
  const y = parseInt(era, 10);
  if (Number.isNaN(y)) return { grid: false, fabric: true, parks: true };
  return {
    grid: y >= 1832 && y <= 1889,
    fabric: y >= 1900,
    parks: y >= 1893,
  };
}

/* the hydePark sheet is labeled by the place, not "township"; the
   drawn boundary is the modern community-area record (the colophon
   says so) and the historic township was far larger (audit) */
const FRAME_LABEL: Record<string, string> = {
  citywide: "CHICAGO, THE SURVEYED CITY",
  blackBelt: "THE BLACK BELT",
  hydePark: "HYDE PARK",
};

export default function StageController({
  stageBase,
  clientProps,
}: {
  stageBase: ReactNode;
  clientProps: StageClientProps;
}) {
  const { stage, areaTapRef, reducedMotion, towersSlot, locatedArea } = useGround();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const appliedFlood = useRef(0);
  const lastFrame = useRef<string>("citywide");

  /* the frame's home crop */
  const homeBox = (frame: string): Box =>
    parseViewBox(
      frame === "blackBelt"
        ? clientProps.blackBeltViewBox
        : frame === "hydePark"
          ? clientProps.hpViewBox
          : clientProps.viewBox
    );

  /* resolve the step's camera box: a named focus fit to the pane, or
     the frame's home crop */
  const resolveBox = (svg: SVGSVGElement): Box => {
    const cam = stage.cam ?? "wide";
    if (cam !== "wide" && stage.frame === "citywide" && clientProps.focus[cam]) {
      const aspect = (svg.clientWidth || 1) / (svg.clientHeight || 1);
      return fitBox(clientProps.focus[cam], aspect, 0.4);
    }
    return homeBox(stage.frame);
  };

  /* one camera per mounted svg */
  useEffect(() => {
    const root = wrapRef.current;
    const svg = root?.querySelector<SVGSVGElement>("[data-ground-svg]");
    const group = svg?.querySelector<SVGGElement>("[data-camera]");
    if (!root || !svg || !group) return;
    const cam = createCamera(svg, group, (flying) => {
      root.setAttribute("data-tween", flying ? "on" : "off");
    });
    cameraRef.current = cam;
    return () => {
      cam.destroy();
      cameraRef.current = null;
    };
  }, []);

  /* frame cuts (second sheet) and within-frame camera moves */
  useEffect(() => {
    const root = wrapRef.current;
    const svg = root?.querySelector<SVGSVGElement>("[data-ground-svg]");
    const cam = cameraRef.current;
    if (!root || !svg || !cam) return;

    /* everything derived from the camera and the pane in one place,
       so a resize can re-derive it against the same resolved state */
    const applyDerived = (to: Box) => {
      /* marks stay readable at every camera: their natural size is
         3.2 viewBox units, clamped to a 4.5..9 screen-px radius;
         labels counter-scale so type keeps its apparent size when
         the camera is close (--gtext-k multiplies CSS font sizes) */
      const kx = Math.min(
        (svg.clientWidth || 1) / to.w,
        (svg.clientHeight || 1) / to.h
      );
      const rScreen = Math.min(Math.max(3.2 * kx, 4.5), 9);
      root.style.setProperty("--gmark-r", `${Math.round((rScreen / kx) * 10) / 10}px`);
      /* local streets only subtend a pixel at deep cameras; the flag
         gates their ink so the detail region never reads as a patch
         at the wide view */
      root.setAttribute("data-camdeep", kx > 2 ? "on" : "off");
      /* counter-scale from the MEET scales, not raw widths; the home
         crop is height-constrained in the pane, so a width ratio
         oversized close-crop type by up to 44 percent (audit) */
      const home = homeBox(stage.frame);
      const kHome = Math.min(
        (svg.clientWidth || 1) / home.w,
        (svg.clientHeight || 1) / home.h
      );
      const gtextK = Math.round((kHome / kx) * 1000) / 1000;
      root.style.setProperty("--gtext-k", `${gtextK}`);
      /* a label whose text would cross the crop edge hides for this
         camera (clipped type reads as an unfinished map); width is
         estimated from the plat face's ~0.66em advance */
      const pad = 8;
      for (const label of Array.from(
        root.querySelectorAll<SVGTextElement>("[data-city-labels] text")
      )) {
        const name = label.getAttribute("data-name") ?? "";
        const base = label.dataset.role === "hero" ? 34 : label.dataset.role === "water" ? 26 : 30;
        const estW = name.length * base * 0.66 * gtextK;
        const lx = Number(label.getAttribute("x"));
        const ly = Number(label.getAttribute("y"));
        const out =
          lx < to.x + pad ||
          lx + estW > to.x + to.w - pad ||
          ly < to.y + base * gtextK + pad ||
          ly > to.y + to.h - pad;
        label.setAttribute("data-camclip", out ? "out" : "in");
      }
      /* the drawn content's box inside the svg element (meet
         centering), so HTML pinned to true geography lands on the
         drawing, not the pane; --gsv-* are svg-relative */
      const contentW = to.w * kx;
      const contentH = to.h * kx;
      root.style.setProperty("--gsv-left", `${Math.round(((svg.clientWidth || 1) - contentW) / 2)}px`);
      root.style.setProperty("--gsv-top", `${Math.round(((svg.clientHeight || 1) - contentH) / 2)}px`);
      root.style.setProperty("--gsv-w", `${Math.round(contentW)}px`);
      root.style.setProperty("--gsv-h", `${Math.round(contentH)}px`);
    };

    const to = resolveBox(svg);
    let cutTimer = 0;
    if (stage.frame !== lastFrame.current) {
      /* a different document laid on the desk; always a cut, staged
         by CSS as a brief paper settle (none under reduced motion).
         The attribute clears after the settle so its transition
         suppression never leaks into a later tilt. */
      lastFrame.current = stage.frame;
      cam.go(to, { instant: true });
      root.removeAttribute("data-sheetcut");
      void root.offsetWidth;
      root.setAttribute("data-sheetcut", "on");
      cutTimer = window.setTimeout(() => root.removeAttribute("data-sheetcut"), 340);
    } else {
      cam.go(to, { instant: reducedMotion });
    }
    applyDerived(to);

    /* a resized pane changes the meet-fit; re-derive against the
       recomputed camera box (instant, it is the same resolved state).
       ResizeObserver reports once on observe; that first report is
       the size we just derived from, so it must not cut a tween. */
    let firstReport = true;
    const ro = new ResizeObserver(() => {
      if (firstReport) {
        firstReport = false;
        return;
      }
      const next = resolveBox(svg);
      cam.go(next, { instant: true });
      applyDerived(next);
    });
    ro.observe(svg);
    return () => {
      ro.disconnect();
      if (cutTimer) {
        window.clearTimeout(cutTimer);
        /* never strand the settle-suppression attribute if the effect
           re-runs inside the cut window */
        root.removeAttribute("data-sheetcut");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.frame, stage.cam, stage.marksMode, reducedMotion]);

  /* the veil's hole is real geometry; "located" concatenates the
     visitor's own found area from the live DOM */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const veil = root.querySelector<SVGPathElement>("[data-veil]");
    if (!veil) return;
    const lite = root.querySelector<SVGPathElement>("[data-veil-lite]");
    const target = stage.veil ?? "none";
    if (target === "none") {
      /* fade first, clear the geometry after the 450ms opacity ride
         (clearing d immediately made the veil-off a hard pop) */
      const t = window.setTimeout(() => {
        veil.setAttribute("d", "");
        lite?.setAttribute("d", "");
      }, 500);
      return () => window.clearTimeout(t);
    }
    let hole = "";
    if (target === "located") {
      const area =
        locatedArea != null
          ? root.querySelector<SVGPathElement>(`[data-aid="${locatedArea}"]`)
          : null;
      hole = area?.getAttribute("d") ?? "";
    } else {
      /* each sheet's holes live in its own coordinates */
      const key = stage.frame === "hydePark" ? `${target}Hp` : target;
      hole = clientProps.veilHoles[key] ?? clientProps.veilHoles[target] ?? "";
      if (stage.frame === "hydePark" && !clientProps.veilHoles[key]) hole = "";
    }
    veil.setAttribute("d", hole ? VEIL_RECT + hole : "");
    /* the same geometry, painted as light */
    lite?.setAttribute("d", hole || "");
  }, [stage.veil, stage.frame, clientProps.veilHoles, locatedArea]);

  /* the magnifying lens: a clipped live clone of the sheet at 2.6x
     over a named point, shown at rest on its beats (R11) */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const clipC = root.querySelector<SVGCircleElement>("[data-loupe-clipc]");
    const ring = root.querySelector<SVGCircleElement>("[data-loupe-ring]");
    const halo = root.querySelector<SVGCircleElement>("[data-loupe-halo]");
    const paper = root.querySelector<SVGRectElement>("[data-loupe-paper]");
    if (!clipC || !ring || !halo || !paper) return;
    const key = stage.loupe ?? null;
    const lp = key ? clientProps.loupes[key] : null;
    if (!lp || lp.frame !== stage.frame) {
      root.setAttribute("data-loupeon", "off");
      return;
    }
    const Z = 2.6;
    for (const c of [clipC, ring, halo]) {
      c.setAttribute("cx", String(lp.cx));
      c.setAttribute("cy", String(lp.cy));
    }
    clipC.setAttribute("r", String(lp.r));
    ring.setAttribute("r", String(lp.r));
    halo.setAttribute("r", String(lp.r + 3));
    paper.setAttribute("x", String(lp.cx - lp.r - 2));
    paper.setAttribute("y", String(lp.cy - lp.r - 2));
    paper.setAttribute("width", String((lp.r + 2) * 2));
    paper.setAttribute("height", String((lp.r + 2) * 2));
    /* magnify the scene about the lens center: T = (1-Z)*c, scale Z */
    const scene = root.querySelector<SVGGElement>(`[data-loupe-scene="${key}"]`);
    scene?.setAttribute(
      "transform",
      `translate(${(lp.cx * (1 - Z)).toFixed(1)} ${(lp.cy * (1 - Z)).toFixed(1)}) scale(${Z})`
    );
    root.setAttribute("data-loupekey", key ?? "");
    root.setAttribute("data-loupeon", "on");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.loupe, stage.frame, clientProps.loupes]);

  /* the grade flood inks batches of areas in sheet filing order */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const target = stage.grades === "flood" ? (stage.floodStep ?? 0) + 1 : stage.grades === "full" ? clientProps.floodBatches.length : 0;
    const applied = appliedFlood.current;
    if (target === applied) return;
    const lo = Math.min(target, applied);
    const hi = Math.max(target, applied);
    const addMode = target > applied;
    for (let b = lo; b < hi; b++) {
      for (const id of clientProps.floodBatches[b] ?? []) {
        root.querySelector(`[data-aid="${id}"]`)?.classList.toggle("inked", addMode);
      }
    }
    appliedFlood.current = target;
  }, [stage.grades, stage.floodStep, clientProps.floodBatches]);

  /* one delegated tap handler for the whole map */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const onClick = (e: Event) => {
      const hit = (e.target as Element).closest("[data-aid]");
      if (hit && areaTapRef.current) {
        const id = Number(hit.getAttribute("data-aid"));
        if (!Number.isNaN(id)) areaTapRef.current(id);
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [areaTapRef]);

  const note = stage.note ?? null;
  /* the fairgrounds note names Jackson Park, so it anchors there, not
     on the HYDE PARK label (the shell computes a clamped in-frame
     anchor from the geometry's own JACKSON PARK entry) */
  const anchorKey =
    note && /jackson park/i.test(note.text) && clientProps.anchors.jacksonPark
      ? "jacksonPark"
      : (note?.anchor ?? "none");
  const anchor = note ? clientProps.anchors[anchorKey] : null;
  /* anchor position as a percentage of the frame's home crop (notes
     appear on wide states; a camera-fit crop repositions via CSS) */
  const vb = homeBox(stage.frame);
  const notePos =
    note && anchor
      ? {
          left: `${(((anchor.x - vb.x) / vb.w) * 100).toFixed(1)}%`,
          top: `${(((anchor.y - vb.y) / vb.h) * 100).toFixed(1)}%`,
        }
      : null;

  const strata = strataFor(stage.era);
  /* the badge's era window; after the survey the marks are residue and
     the docket carries their count */
  const eraNum = parseInt(stage.era, 10);
  const badgeEra = !Number.isNaN(eraNum) && eraNum > 1900 && eraNum < 1939;
  /* the filing counter, only meaningful during the flood */
  const floodIdx = stage.grades === "flood" ? (stage.floodStep ?? 0) : -1;
  const filedThrough =
    floodIdx >= 0
      ? clientProps.floodBatches.slice(0, floodIdx + 1).reduce((s, b) => s + b.length, 0)
      : 0;
  const filedLabel = floodIdx >= 0 ? clientProps.floodBatchLabels[Math.min(floodIdx, clientProps.floodBatchLabels.length - 1)] : "";

  return (
    <div
      ref={wrapRef}
      className="ground-stage"
      data-testid="ground-stage"
      data-frame={stage.frame}
      data-grades={stage.grades}
      data-linework={stage.linework ? "on" : "off"}
      data-boundary={stage.boundary ? "on" : "off"}
      data-labels={stage.labels ? "on" : "off"}
      data-marks={stage.marks ? "on" : "off"}
      data-dim={stage.dim ? "on" : "off"}
      data-warm={stage.warm ? "on" : "off"}
      data-today={stage.today ? "on" : "off"}
      data-note-anchor={note ? anchorKey : "none"}
      data-tilt={String(stage.tilt ?? 0)}
      data-press={stage.press ? "on" : "off"}
      data-veil={stage.veil && stage.veil !== "none" ? "on" : "off"}
      data-marksmode={stage.marksMode ?? "badge"}
      data-g-grid={strata.grid ? "on" : "off"}
      data-g-fabric={strata.fabric ? "on" : "off"}
      data-g-parks={strata.parks ? "on" : "off"}
    >
      <div className="ground-sheet" data-testid="ground-sheet">
        {stageBase}
        {/* act6 scenes portal their dollar towers here so they live on
            the sheet's 3D plane and counter-rotate off it */}
        <div
          className="ground-towers"
          data-testid="ground-towers"
          ref={(el) => {
            towersSlot.current = el;
          }}
        />
        {/* the marks' counted badge; it reads while the bombing scar
            is the map's live story (1908 to the survey), then rests */}
        {stage.marks &&
        stage.frame === "citywide" &&
        (stage.marksMode ?? "badge") === "badge" &&
        !stage.dim &&
        badgeEra &&
        clientProps.anchorsPct.marks ? (
          <p
            className="ground-marks-badge exh-plat"
            data-testid="ground-marks-badge"
            style={{
              left: `calc(var(--gsv-left, 0px) + var(--gsv-w, 100%) * ${clientProps.anchorsPct.marks.left / 100})`,
              top: `calc(var(--gsv-top, 0px) + var(--gsv-h, 100%) * ${clientProps.anchorsPct.marks.top / 100})`,
            }}
          >
            32 bombed sites, 1917 to 1921
            <SourceSup factId="bombings.pins_located" />
          </p>
        ) : null}
      </div>
      {stage.era ? (
        <p className="ground-era exh-plat" data-testid="ground-era" aria-hidden="true">
          {stage.era}
        </p>
      ) : null}
      {note && notePos ? (
        <p className="ground-note exh-plat" style={notePos} data-testid="ground-note">
          {note.text}
        </p>
      ) : null}
      {/* the plat title block, screen-space sheet furniture */}
      <div className="ground-titleblock exh-plat" data-testid="ground-titleblock" aria-hidden="true">
        <span className="gtb-frame">{FRAME_LABEL[stage.frame] ?? ""}</span>
        {floodIdx >= 0 ? (
          <span className="gtb-filing exh-mono" data-testid="ground-filing">
            areas graded through {filedLabel}.{" "}
            <span className="whitespace-nowrap">{filedThrough} of 703</span>
          </span>
        ) : null}
        {/* the rank disclosure prints only while depth is drawn (press
            on AND grades shown); "equal" was false to the drawn ladder */}
        {stage.press && stage.grades === "full" ? (
          <span className="gtb-disclosure">
            Depth shows grade rank in four steps, not a measured quantity. Ungraded areas carry
            none.
          </span>
        ) : null}
      </div>
      {/* non-visual parity: the resolved state in words */}
      {stage.sr ? (
        <p className="sr-only" data-testid="ground-sr">
          {stage.sr}
        </p>
      ) : null}
    </div>
  );
}
