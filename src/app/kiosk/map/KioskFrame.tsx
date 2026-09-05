"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  KioskFrame                                                         */
/*                                                                     */
/*  Holds the bundled map kiosk in a frame that covers the whole       */
/*  viewport, site header and footer included.                         */
/*                                                                     */
/*  On fullscreen: a browser will not grant it without a user gesture, */
/*  so there is no way to open already-fullscreen from a cold load.    */
/*  The next best thing is what this does. The frame fills the         */
/*  viewport regardless, and the first tap anywhere asks for real      */
/*  fullscreen, so a kiosk is one touch from the finished state. The   */
/*  overlay says so rather than leaving a mystery.                     */
/*                                                                     */
/*  The 20 second reset lives inside the bundle itself, which already  */
/*  shipped an idle timer and an attract screen. Its default was 120   */
/*  and public/kiosk/map-kiosk.html carries 20. This component only    */
/*  adds a belt to that. If the frame somehow stops resetting, a       */
/*  reload puts it back on the attract screen.                         */
/* ------------------------------------------------------------------ */

const KIOSK_SRC = "/kiosk/map-kiosk.html";
/* Matches idleSeconds in the bundle. The watchdog runs longer on
   purpose, so it only fires when the bundle's own timer has failed. */
const IDLE_SECONDS = 20;
const WATCHDOG_SECONDS = IDLE_SECONDS * 3;

export default function KioskFrame() {
  const [entered, setEntered] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const watchdog = useRef<number | null>(null);

  /* Reload the frame if nothing has happened for far longer than the
     bundle's own reset. Cheap insurance for an unattended screen. */
  const armWatchdog = useCallback(() => {
    if (watchdog.current) window.clearTimeout(watchdog.current);
    watchdog.current = window.setTimeout(() => {
      const f = frameRef.current;
      if (f) f.src = `${KIOSK_SRC}?t=${Date.now()}`;
    }, WATCHDOG_SECONDS * 1000);
  }, []);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      // Rejected when the gesture is not trusted; the kiosk still runs.
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const begin = useCallback(() => {
    setEntered(true);
    enterFullscreen();
    armWatchdog();
  }, [enterFullscreen, armWatchdog]);

  /* The bundle is same-origin, so its activity can be watched from
     here and used to keep the watchdog quiet. */
  useEffect(() => {
    if (!entered) return;
    const f = frameRef.current;
    if (!f) return;

    const attach = () => {
      try {
        const doc = f.contentDocument;
        if (!doc) return;
        doc.addEventListener("pointerdown", armWatchdog, true);
        doc.addEventListener("keydown", armWatchdog, true);
      } catch {
        /* cross-origin, which should not happen from /public */
      }
    };
    f.addEventListener("load", attach);
    attach();
    window.addEventListener("pointerdown", armWatchdog, true);

    return () => {
      f.removeEventListener("load", attach);
      window.removeEventListener("pointerdown", armWatchdog, true);
      if (watchdog.current) window.clearTimeout(watchdog.current);
    };
  }, [entered, armWatchdog]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#F3EEE3]">
      <iframe
        ref={frameRef}
        src={KIOSK_SRC}
        title="Rooted Forward map kiosk"
        allow="fullscreen"
        className="h-full w-full border-0"
      />

      {!entered && (
        <button
          type="button"
          onClick={begin}
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F3EEE3]/95 backdrop-blur-sm"
        >
          <span className="font-display text-4xl text-forest md:text-5xl">
            Rooted Forward map kiosk
          </span>
          <span className="font-body text-lg text-ink/70">
            Tap anywhere to open it full screen
          </span>
          <span className="mt-2 font-body text-sm text-ink/50">
            Resets on its own after {IDLE_SECONDS} seconds of no touches
          </span>
        </button>
      )}
    </div>
  );
}
