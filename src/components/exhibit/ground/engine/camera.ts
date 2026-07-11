/* ------------------------------------------------------------------ */
/*  R10 camera, the FLIP hybrid, round-2 form. The tween rides an      */
/*  INNER group (data-camera), never the svg element: the target       */
/*  viewBox is set immediately, the group takes the inverse transform  */
/*  in user units, and the transform transitions to identity on the    */
/*  compositor. Because the whole drawing stays inside the svg         */
/*  viewport, a zoom-in keeps the surrounding city on screen through   */
/*  the flight (the audit's flip-camera-cut p1) and a zoom-out never   */
/*  paints over the desk. transitionend AND transitioncancel plus a    */
/*  watchdog clean up; retargeting mid-flight composes against the     */
/*  computed matrix so the picture never jumps. Under reduced motion   */
/*  every move is an instant cut to the same resolved frame.           */
/* ------------------------------------------------------------------ */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseViewBox(vb: string): Box {
  const [x, y, w, h] = vb.split(" ").map(Number);
  return { x, y, w, h };
}

export function boxToViewBox(b: Box): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(b.x)} ${r(b.y)} ${r(b.w)} ${r(b.h)}`;
}

/**
 * Expand a target box to the given aspect ratio (w/h) with padding,
 * keeping the target centered. pad is a fraction of the larger side.
 */
export function fitBox(target: Box, aspect: number, pad = 0.35): Box {
  const padPx = Math.max(target.w, target.h) * pad;
  let w = target.w + padPx * 2;
  let h = target.h + padPx * 2;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  return {
    x: target.x + target.w / 2 - w / 2,
    y: target.y + target.h / 2 - h / 2,
    w,
    h,
  };
}

/* uniform-scale affine {s, dx, dy}: v -> s*v + d */
interface Affine {
  s: number;
  dx: number;
  dy: number;
}
const IDENTITY: Affine = { s: 1, dx: 0, dy: 0 };

function compose(a: Affine, b: Affine): Affine {
  return { s: a.s * b.s, dx: a.s * b.dx + a.dx, dy: a.s * b.dy + a.dy };
}
function invert(m: Affine): Affine {
  return { s: 1 / m.s, dx: -m.dx / m.s, dy: -m.dy / m.s };
}
/** content -> pane map for a viewBox under xMidYMid meet */
function meetMap(b: Box, paneW: number, paneH: number): Affine {
  const k = Math.min(paneW / b.w, paneH / b.h);
  const ox = (paneW - b.w * k) / 2;
  const oy = (paneH - b.h * k) / 2;
  return { s: k, dx: ox - b.x * k, dy: oy - b.y * k };
}
function readComputed(el: Element): Affine {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return IDENTITY;
  const m = t.match(/matrix\(([^)]+)\)/);
  if (!m) return IDENTITY;
  const [a, , , , e, f] = m[1].split(",").map(Number);
  return { s: a, dx: e, dy: f };
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export interface Camera {
  /** move to a viewBox; instant cuts (reduced motion, frame cuts) */
  go(to: Box, opts?: { duration?: number; instant?: boolean }): void;
  /** true while a tween is in flight */
  inFlight(): boolean;
  destroy(): void;
}

export function createCamera(
  svg: SVGSVGElement,
  group: SVGGElement,
  onFlight?: (flying: boolean) => void
): Camera {
  let flying = false;
  let watchdog = 0;
  let settleHandler: ((e: TransitionEvent) => void) | null = null;

  const paneSize = (): [number, number] => {
    const w = svg.clientWidth || parseFloat(getComputedStyle(svg).width) || 1;
    const h = svg.clientHeight || parseFloat(getComputedStyle(svg).height) || 1;
    return [w, h];
  };

  const cleanup = () => {
    if (settleHandler) {
      group.removeEventListener("transitionend", settleHandler);
      group.removeEventListener("transitioncancel", settleHandler);
      settleHandler = null;
    }
    if (watchdog) {
      window.clearTimeout(watchdog);
      watchdog = 0;
    }
    group.style.transition = "";
    group.style.transform = "";
    if (flying) {
      flying = false;
      onFlight?.(false);
    }
  };

  return {
    go(to, opts = {}) {
      const { duration = 900, instant = false } = opts;
      const prevBox = parseViewBox(svg.getAttribute("viewBox") ?? "0 0 1 1");
      const same =
        Math.abs(prevBox.x - to.x) < 0.5 &&
        Math.abs(prevBox.y - to.y) < 0.5 &&
        Math.abs(prevBox.w - to.w) < 0.5 &&
        Math.abs(prevBox.h - to.h) < 0.5;
      if (instant || same) {
        cleanup();
        svg.setAttribute("viewBox", boxToViewBox(to));
        return;
      }
      const [paneW, paneH] = paneSize();
      /* current appearance = meet(B_prev) o G_read on the group; after
         the viewBox swap it must not change, so
         G_new = meet(B_new)^-1 o meet(B_prev) o G_read, an affine in
         user units (CSS transforms on SVG elements act in user space) */
      const gRead = readComputed(group);
      const mPrev = meetMap(prevBox, paneW, paneH);
      const mNew = meetMap(to, paneW, paneH);
      const gNew = compose(compose(invert(mNew), mPrev), gRead);

      cleanup();
      flying = true;
      onFlight?.(true);

      svg.setAttribute("viewBox", boxToViewBox(to));
      /* explicit reference box: the affine is computed in user units
         about the user-space origin, and WebKit's transform-box
         default has interop wobble (audit round 2) */
      group.style.setProperty("transform-box", "view-box");
      group.style.transformOrigin = "0 0";
      group.style.transition = "none";
      group.style.transform = `translate(${gNew.dx}px, ${gNew.dy}px) scale(${gNew.s})`;
      /* commit the jump frame before enabling the transition */
      void svg.getBoundingClientRect();
      group.style.transition = `transform ${duration}ms ${EASE}`;
      group.style.transform = "translate(0px, 0px) scale(1)";

      settleHandler = (e: TransitionEvent) => {
        if (e.target === group && e.propertyName === "transform") cleanup();
      };
      group.addEventListener("transitionend", settleHandler);
      group.addEventListener("transitioncancel", settleHandler);
      watchdog = window.setTimeout(cleanup, duration + 120);
    },
    inFlight: () => flying,
    destroy: cleanup,
  };
}
