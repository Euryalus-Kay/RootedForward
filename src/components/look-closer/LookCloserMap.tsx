"use client";

// ------------------------------------------------------------------
// Look Closer on a phone. The museum wall shows this map on a 1920 by
// 1080 touch panel with the kiosk bundle behind it; that bundle only
// scales its stage down, and at phone size its type is unreadable, so
// the phone gets its own room built from the same data. The map fills
// the screen, two fingers zoom it, and the twelve rings open the
// kiosk's own text beside it. In portrait on a phone the room shows
// one thing only, a request to turn the phone, because the map is
// wider than it is tall and this is the one place the site insists
// on landscape.
//
// The app opens the same page in a landscape-locked web view with
// ?app=1, which hides the way back to the site.
// ------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  EXHIBIT,
  MAP_CREDIT,
  MAP_DETAILS,
  MAP_IMAGES,
  MAP_SPACE,
  MUSEUM,
  type MapDetail,
  type TextRun,
} from "@/lib/look-closer";
import styles from "./LookCloserMap.module.css";

interface View {
  k: number;
  x: number;
  y: number;
}

/** how far the map may be enlarged past fitting the screen. The full
 *  image is 6400 wide; past about this the phone would be stretching
 *  it, and the kiosk's own limit is close to it. */
const MAX_ZOOM = 4.5;

/** past this the 2400px image is being stretched, so the 6400 loads */
const FULL_AT = 1.2;

const COARSE = "(pointer: coarse)";
const subscribeCoarse = (cb: () => void) => {
  const m = window.matchMedia(COARSE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
/** a touch screen, read the React way so the server and the first
 *  client render agree and the real answer arrives right after */
function useCoarsePointer() {
  return useSyncExternalStore(subscribeCoarse, () => window.matchMedia(COARSE).matches, () => false);
}

function Runs({ runs }: { runs: TextRun[] }) {
  return (
    <>
      {runs.map((run, i) => (run.b ? <b key={i}>{run.t}</b> : <span key={i}>{run.t}</span>))}
    </>
  );
}

export default function LookCloserMap({ inApp }: { inApp: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // k of 0 means no one has touched the map yet, and the first view is
  // chosen from the screen: the whole sheet on a desktop, and on a phone
  // the sheet filling the width, because the whole map at phone size is
  // a postage stamp and the jokes on it are the point.
  const [view, setView] = useState<View>({ k: 0, x: 0, y: 0 });
  const coarse = useCoarsePointer();
  const [animated, setAnimated] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [about, setAbout] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [wantFull, setWantFull] = useState(false);
  const [hint, setHint] = useState(true);

  // The sheet is the map fitted into the stage with a small margin;
  // everything else is a transform on top of that.
  const sheet = useMemo(() => {
    if (!size.w || !size.h) return { w: 0, h: 0, x: 0, y: 0 };
    const pad = 12;
    const s = Math.min((size.w - pad * 2) / MAP_SPACE.w, (size.h - pad * 2) / MAP_SPACE.h);
    const w = MAP_SPACE.w * s;
    const h = MAP_SPACE.h * s;
    return { w, h, x: (size.w - w) / 2, y: (size.h - h) / 2 };
  }, [size]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The site scrolls; this room does not. Hold the page still while
  // the room is up so a drag on the map never scrolls the footer
  // underneath it, and give the page back on the way out.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Safari zooms the page on a pinch and on a double tap unless it is
  // told otherwise at the document, which touch-action cannot do.
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const stage = stageRef.current;
    const touch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    stage?.addEventListener("touchmove", touch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      stage?.removeEventListener("touchmove", touch);
    };
  }, []);

  /** keep the sheet on screen: centered while it fits, and never
   *  dragged so far that an edge crosses the middle of the stage */
  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k));
      const w = sheet.w * k;
      const h = sheet.h * k;
      let x = v.x;
      let y = v.y;
      if (w <= size.w) x = (size.w - w) / 2;
      else x = Math.min(size.w / 2, Math.max(size.w / 2 - w, x));
      if (h <= size.h) y = (size.h - h) / 2;
      else y = Math.min(size.h / 2, Math.max(size.h / 2 - h, y));
      return { k, x, y };
    },
    [sheet, size]
  );

  // What is drawn is always the clamped view, so the first render and
  // every resize land the sheet where it belongs without a state
  // update. Until the first touch the view is derived from the screen.
  const shown = useMemo(() => {
    if (view.k > 0 || !sheet.w) return clamp(view);
    const k = coarse ? Math.min(2.2, Math.max(1, size.w / sheet.w)) : 1;
    return clamp({ k, x: (size.w - sheet.w * k) / 2, y: (size.h - sheet.h * k) / 2 });
  }, [view, clamp, coarse, sheet, size]);

  /** zoom about a stage point, keeping that point still under the finger */
  const zoomAt = useCallback(
    (factor: number, px: number, py: number, animate = false) => {
      setAnimated(animate);
      const v = shown;
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k * factor));
      const f = k / v.k;
      setView(clamp({ k, x: px - (px - v.x) * f, y: py - (py - v.y) * f }));
      if (k >= FULL_AT) setWantFull(true);
    },
    [clamp, shown]
  );

  // ---- pointers: one drags, two pinch ----
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mid: { x: number; y: number }; view: View; moved: boolean } | null>(null);
  const lastTap = useRef(0);

  const stagePoint = (e: { clientX: number; clientY: number }) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, stagePoint(e));
    const pts = [...pointers.current.values()];
    const mid = pts.length > 1
      ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      : pts[0];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { dist, mid, view: shown, moved: false };
    setAnimated(false);
    setHint(false);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, stagePoint(e));
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length > 1) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const f = g.dist > 0 ? dist / g.dist : 1;
      const k = Math.min(MAX_ZOOM, Math.max(1, g.view.k * f));
      const ff = k / g.view.k;
      setView(clamp({
        k,
        x: mid.x - (g.mid.x - g.view.x) * ff,
        y: mid.y - (g.mid.y - g.view.y) * ff,
      }));
      if (k >= FULL_AT) setWantFull(true);
      g.moved = true;
    } else {
      const p = pts[0];
      const dx = p.x - g.mid.x;
      const dy = p.y - g.mid.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) g.moved = true;
      setView(clamp({ k: g.view.k, x: g.view.x + dx, y: g.view.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const had = pointers.current.has(e.pointerId);
    pointers.current.delete(e.pointerId);
    if (!had) return;
    const g = gesture.current;
    if (pointers.current.size === 0) {
      // a clean tap: a second one within 300ms zooms in on the spot
      if (g && !g.moved) {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          const p = stagePoint(e);
          zoomAt(shown.k < 2.5 ? 2.2 : 1 / shown.k, p.x, p.y, true);
          lastTap.current = 0;
        } else {
          lastTap.current = now;
        }
      }
      gesture.current = null;
    } else {
      // one finger lifted from a pinch: carry on as a drag from here
      const p = [...pointers.current.values()][0];
      gesture.current = { dist: 0, mid: p, view: shown, moved: true };
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const p = stagePoint(e);
    const factor = Math.exp(-e.deltaY * 0.0022);
    zoomAt(factor, p.x, p.y, false);
  };

  // ---- opening a detail ----
  const open = useCallback(
    (i: number) => {
      const d = MAP_DETAILS[i];
      setActive(i);
      setAbout(false);
      setHint(false);
      setWantFull(true);
      // Fit the ring into the part of the stage the panel leaves free,
      // a little smaller than that so the map around it still reads.
      const panelW = Math.min(size.w * 0.46, 400);
      const freeW = size.w - panelW;
      const s = sheet.w / MAP_SPACE.w; // base sheet, before zoom
      const dw = (d.box?.w ?? d.r * 2) * s;
      const dh = (d.box?.h ?? d.r * 2) * s;
      const k = Math.min(MAX_ZOOM, Math.max(1.2, Math.min((freeW * 0.62) / dw, (size.h * 0.62) / dh)));
      const cx = d.cx * s;
      const cy = d.cy * s;
      setAnimated(true);
      setView(clamp({ k, x: freeW / 2 - cx * k, y: size.h / 2 - cy * k }));
    },
    [sheet, size, clamp]
  );

  const reset = () => {
    setActive(null);
    setAbout(false);
    setAnimated(true);
    setView({ k: 1, x: 0, y: 0 });
  };

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(false), 6000);
    return () => window.clearTimeout(t);
  }, [hint]);

  /** map space to the sheet's laid-out pixels at the current zoom */
  const s = (sheet.w * shown.k) / MAP_SPACE.w;
  const current: MapDetail | null = active === null ? null : MAP_DETAILS[active];
  const panelOpen = current !== null || about;

  return (
    <div className={styles.room} data-in-app={inApp ? "1" : undefined}>
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        role="application"
        aria-label="An Illustrated Map of Chicago, 1931. Drag to move, pinch to zoom, and open the numbered details."
      >
        <div
          className={styles.sheet}
          style={{
            width: sheet.w * shown.k,
            height: sheet.h * shown.k,
            transform: `translate(${shown.x}px, ${shown.y}px)`,
            transition: animated
              ? "transform 0.45s cubic-bezier(0.2, 0.7, 0.2, 1), width 0.45s cubic-bezier(0.2, 0.7, 0.2, 1), height 0.45s cubic-bezier(0.2, 0.7, 0.2, 1)"
              : "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MAP_IMAGES.base} alt="" draggable={false} />
          {wantFull && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={MAP_IMAGES.full}
              alt=""
              draggable={false}
              className={`${styles.full} ${fullLoaded ? styles.fullOn : ""}`}
              onLoad={() => setFullLoaded(true)}
            />
          )}
          {MAP_DETAILS.map((d, i) => {
            const w = (d.box?.w ?? d.r * 2) * s;
            const h = (d.box?.h ?? d.r * 2) * s;
            const on = active === i;
            return (
              <div key={d.id}>
                <button
                  type="button"
                  className={`${styles.ring} ${d.box ? styles.ringBox : ""} ${on ? styles.ringOn : ""}`}
                  style={{ left: d.cx * s, top: d.cy * s, width: w, height: h }}
                  onClick={() => open(i)}
                  aria-label={`Detail ${d.number}, ${d.title}`}
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className={`${styles.badge} ${on ? styles.badgeOn : ""}`}
                  style={{
                    left: d.cx * s - w / 2 + (d.nudge?.x ?? 0) * s,
                    top: d.cy * s - h / 2 + (d.nudge?.y ?? 0) * s,
                  }}
                  onClick={() => open(i)}
                  aria-label={`Detail ${d.number}, ${d.title}`}
                >
                  {d.number}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.top}>
        <button
          type="button"
          className={styles.mark}
          onClick={() => {
            setActive(null);
            setAbout((a) => !a);
            setHint(false);
          }}
          aria-expanded={about}
          aria-label="About this map and the Chicago Maritime Museum"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MUSEUM.logo} alt="" className={styles.cmm} />
          <span className={styles.word}>
            Look Closer <em>&middot; {MUSEUM.name}</em>
          </span>
        </button>
      </div>

      <div className={styles.zoom}>
        <button type="button" className={styles.round} onClick={() => zoomAt(1.6, size.w / 2, size.h / 2, true)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className={styles.round} onClick={() => zoomAt(1 / 1.6, size.w / 2, size.h / 2, true)} aria-label="Zoom out">
          &minus;
        </button>
        <button type="button" className={`${styles.round} ${styles.roundSmall}`} onClick={reset} aria-label="Show the whole map">
          ALL
        </button>
      </div>

      {hint && !panelOpen && <div className={styles.hint}>{EXHIBIT.tap}</div>}

      {current && (
        <aside className={styles.panel} aria-label={`Detail ${current.number}, ${current.title}`}>
          <div className={styles.panelBar}>
            <span>
              {current.number} of {MAP_DETAILS.length}
            </span>
            <button type="button" className={styles.close} onClick={() => setActive(null)} aria-label="Close">
              &times;
            </button>
          </div>
          <div className={styles.panelBody}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.thumb} alt="" className={styles.thumb} />
            <div className={styles.numTitle}>
              <span className={styles.num}>{current.number}</span>
              <h2 className={styles.title}>{current.title}</h2>
            </div>
            {current.paragraphs.map((runs, i) => (
              <p key={i} className={styles.para}>
                <Runs runs={runs} />
              </p>
            ))}
          </div>
          <div className={styles.panelFoot}>
            <button
              type="button"
              className={styles.step}
              onClick={() => open((active! + MAP_DETAILS.length - 1) % MAP_DETAILS.length)}
            >
              Previous
            </button>
            <button
              type="button"
              className={`${styles.step} ${styles.stepMain}`}
              onClick={() => open((active! + 1) % MAP_DETAILS.length)}
            >
              Next detail
            </button>
          </div>
        </aside>
      )}

      {about && (
        <aside className={styles.panel} aria-label="About this map">
          <div className={styles.panelBar}>
            <span>About this map</span>
            <button type="button" className={styles.close} onClick={() => setAbout(false)} aria-label="Close">
              &times;
            </button>
          </div>
          <div className={styles.panelBody}>
            <h2 className={styles.aboutHead}>{EXHIBIT.title}</h2>
            <p className={styles.aboutSub}>
              {MAP_CREDIT.title}. {MAP_CREDIT.makers}.
            </p>
            <div className={styles.aboutRule} />
            {EXHIBIT.paragraphs.map((p, i) => (
              <p key={i} className={styles.para}>
                {p}
              </p>
            ))}
            <p className={styles.para}>{EXHIBIT.tap}</p>
            <h3 className={styles.h3}>How to read this map</h3>
            {EXHIBIT.howToRead.map((p, i) => (
              <p key={i} className={styles.para}>
                {p}
              </p>
            ))}
            <div className={styles.visit}>
              <div className={styles.visitRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MUSEUM.logo} alt="" />
                <div>
                  <p className={styles.visitName}>On the wall at the {MUSEUM.name}</p>
                </div>
              </div>
              <p className={styles.visitLine}>
                {EXHIBIT.partnership}. The map is on view at {MUSEUM.address}, on the {MUSEUM.building.charAt(0).toLowerCase() + MUSEUM.building.slice(1)}. {MUSEUM.hours}
              </p>
              <div className={styles.links}>
                <a href={MUSEUM.visitUrl} target="_blank" rel="noopener noreferrer">
                  Plan a visit
                </a>
                <a href={MUSEUM.url} target="_blank" rel="noopener noreferrer">
                  The museum
                </a>
                {!inApp && (
                  <Link href="/" className={styles.rf}>
                    Rooted Forward
                  </Link>
                )}
              </div>
            </div>
            <p className={styles.small}>
              {MAP_CREDIT.title}. {MAP_CREDIT.makers}. {MAP_CREDIT.publisher}. {MAP_CREDIT.holder}.
            </p>
          </div>
        </aside>
      )}

      <div className={styles.rotate} aria-hidden={false}>
        <div className={styles.rotateMarks}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Rooted Forward" />
          <span className={styles.plus}>&amp;</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MUSEUM.logo} alt={MUSEUM.name} />
        </div>
        <h1 className={styles.rotateTitle}>{EXHIBIT.title}</h1>
        <p className={styles.rotateSub}>
          {MAP_CREDIT.title}, on view at the {MUSEUM.name}
        </p>
        <div className={styles.phone} aria-hidden="true" />
        <p className={styles.rotateAsk}>Turn your phone sideways to open the map.</p>
        <p className={styles.rotateNote}>
          The map is wider than it is tall, and every joke on it is small. It only opens the long way round.
        </p>
        {!inApp && (
          <p className={styles.rotateFoot}>
            <Link href="/">Back to Rooted Forward</Link>
          </p>
        )}
      </div>
    </div>
  );
}

