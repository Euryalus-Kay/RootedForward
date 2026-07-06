"use client";
/* ------------------------------------------------------------------ */
/*  The Continue affordance under the live pause point. Ink-bordered   */
/*  plat-label button with a countdown ring; after twenty idle         */
/*  seconds the tour continues by itself, museum-guide style. The      */
/*  ring and digit update through refs so the countdown never          */
/*  re-renders React. Announces the auto-continue at T minus five      */
/*  seconds through the HUD live region.                               */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { useExhibitDispatch } from "@/lib/exhibit/ExhibitProvider";
import { useIdleContinue } from "../audio/useIdleContinue";
import { subscribeInteraction } from "./InteractiveSlot";

const IDLE_SECONDS = 20;
const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ANNOUNCE_TEXT = "Continuing in five seconds";

export default function ContinueButton() {
  const dispatch = useExhibitDispatch();
  const ringRef = useRef<SVGCircleElement | null>(null);
  const digitRef = useRef<HTMLSpanElement | null>(null);
  const announcedRef = useRef(false);

  const idle = useIdleContinue(true, IDLE_SECONDS, () => dispatch({ type: "CONTINUE" }));

  /* interactives report meaningful actions; each one restarts the window */
  useEffect(() => subscribeInteraction(() => idle.reset()), [idle]);

  useEffect(() => {
    const unsubscribe = idle.subscribe((remaining) => {
      // under the no-motion rule (ch4, prefers-reduced-motion) the ring steps
      // once per whole second instead of animating continuously
      const motionOff =
        document.querySelector('[data-testid="exhibit-root"]')?.getAttribute("data-motion") === "off";
      const effective = motionOff ? Math.ceil(remaining) : remaining;
      const fraction = Math.max(0, Math.min(1, effective / IDLE_SECONDS));
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - fraction));
      }
      if (digitRef.current) {
        const whole = String(Math.max(0, Math.ceil(remaining)));
        if (digitRef.current.textContent !== whole) digitRef.current.textContent = whole;
      }
      if (remaining > 5) {
        announcedRef.current = false;
      } else if (remaining > 0 && !announcedRef.current) {
        announcedRef.current = true;
        const live = document.getElementById("exh-live");
        if (live) live.textContent = ANNOUNCE_TEXT;
      }
    });
    return () => {
      unsubscribe();
      const live = document.getElementById("exh-live");
      if (live && live.textContent === ANNOUNCE_TEXT) live.textContent = "";
    };
  }, [idle]);

  return (
    <div className="mt-6 flex justify-center">
      <button
        type="button"
        data-testid="continue-button"
        onClick={() => dispatch({ type: "CONTINUE" })}
        aria-label="Continue the tour. If you wait, the tour continues automatically."
        className="group inline-flex min-h-12 items-center gap-3 border border-exh-ink bg-exh-linen px-6 py-3 text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen"
      >
        <span className="exh-plat text-sm font-semibold uppercase tracking-[0.2em]">
          Continue the tour
        </span>
        <span className="relative inline-flex h-9 w-9 items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            <circle
              ref={ringRef}
              cx="18"
              cy="18"
              r={RING_RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset="0"
            />
          </svg>
          <span ref={digitRef} className="exh-mono text-xs">
            {IDLE_SECONDS}
          </span>
        </span>
      </button>
    </div>
  );
}
