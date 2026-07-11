/* ------------------------------------------------------------------ */
/*  R10 camera, the FLIP hybrid the council verdict specifies. The     */
/*  target viewBox is set immediately (the sheet re-rasterizes at      */
/*  destination resolution), an inverse CSS transform makes it look    */
/*  like the old frame, and the transform transitions to identity on   */
/*  the compositor, so the 694 area paths never repaint per frame.     */
/*  transitionend AND transitioncancel plus a watchdog clean up;       */
/*  retargeting mid-flight composes against the computed matrix, so    */
/*  the picture never jumps. Under reduced motion every move is an     */
/*  instant cut to the same resolved frame.                            */
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
/** content -> screen map for a viewBox under xMidYMid meet in a pane */
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
      svg.removeEventListener("transitionend", settleHandler);
      svg.removeEventListener("transitioncancel", settleHandler);
      settleHandler = null;
    }
    if (watchdog) {
      window.clearTimeout(watchdog);
      watchdog = 0;
    }
    svg.style.transition = "";
    svg.style.transform = "";
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
      /* current appearance = F_prev o M(prevBox); after the swap the
         appearance must not change, so F_new = F_prev o M_prev o M_new^-1 */
      const fPrev = readComputed(svg);
      const mPrev = meetMap(prevBox, paneW, paneH);
      const mNew = meetMap(to, paneW, paneH);
      const fNew = compose(compose(fPrev, mPrev), invert(mNew));

      cleanup();
      flying = true;
      onFlight?.(true);

      svg.setAttribute("viewBox", boxToViewBox(to));
      svg.style.transformOrigin = "0 0";
      svg.style.transition = "none";
      svg.style.transform = `translate(${fNew.dx}px, ${fNew.dy}px) scale(${fNew.s})`;
      /* commit the jump frame before enabling the transition */
      void svg.getBoundingClientRect();
      svg.style.transition = `transform ${duration}ms ${EASE}`;
      svg.style.transform = "translate(0px, 0px) scale(1)";

      settleHandler = (e: TransitionEvent) => {
        if (e.target === svg && e.propertyName === "transform") cleanup();
      };
      svg.addEventListener("transitionend", settleHandler);
      svg.addEventListener("transitioncancel", settleHandler);
      watchdog = window.setTimeout(cleanup, duration + 120);
    },
    inFlight: () => flying,
    destroy: cleanup,
  };
}
