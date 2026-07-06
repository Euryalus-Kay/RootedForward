"use client";
/* ------------------------------------------------------------------ */
/*  The Continue affordance under the live pause point. Ink-bordered   */
/*  plat-label button with a countdown ring; after twenty idle         */
/*  seconds the tour continues by itself, museum-guide style. The      */
/*  ring and digit update through refs so the countdown never          */
/*  re-renders React. Announces the auto-continue at T minus five      */
/*  seconds through the HUD live region. When the button itself sits   */
/*  outside the viewport (tall stations), a compact linen chip rides   */
/*  the HudFrame portal near the top controls, "Continuing in Ns,      */
/*  tap to stay"; tapping it resets the idle window and brings the     */
/*  button back into view.                                             */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useExhibitDispatch } from "@/lib/exhibit/ExhibitProvider";
import { useIdleContinue } from "../audio/useIdleContinue";
import { subscribeInteraction } from "./InteractiveSlot";

const IDLE_SECONDS = 20;
const RING_RADIUS = 15;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ANNOUNCE_TEXT = "Continuing in five seconds";
const CHIP_HOST_ID = "exh-hud-continue-chip";

function motionOff(): boolean {
  return (
    document.querySelector('[data-testid="exhibit-root"]')?.getAttribute("data-motion") === "off"
  );
}

export default function ContinueButton() {
  const dispatch = useExhibitDispatch();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const digitRef = useRef<HTMLSpanElement | null>(null);
  const chipDigitRef = useRef<HTMLSpanElement | null>(null);
  const announcedRef = useRef(false);

  /* the off-screen chip shows only while the button is out of view */
  const [buttonInView, setButtonInView] = useState(true);
  const [chipHost, setChipHost] = useState<HTMLElement | null>(null);

  const idle = useIdleContinue(true, IDLE_SECONDS, () => dispatch({ type: "CONTINUE" }));

  /* interactives report meaningful actions; each one restarts the window */
  useEffect(() => subscribeInteraction(() => idle.reset()), [idle]);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    /* the observer's initial callback also resolves the portal host, so
       everything here stays asynchronous and render-safe */
    const io = new IntersectionObserver(([e]) => {
      setButtonInView(e.isIntersecting);
      setChipHost(document.getElementById(CHIP_HOST_ID));
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const unsubscribe = idle.subscribe((remaining) => {
      // under the no-motion rule (ch4, prefers-reduced-motion) the ring steps
      // once per whole second instead of animating continuously
      const effective = motionOff() ? Math.ceil(remaining) : remaining;
      const fraction = Math.max(0, Math.min(1, effective / IDLE_SECONDS));
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - fraction));
      }
      const whole = String(Math.max(0, Math.ceil(remaining)));
      if (digitRef.current && digitRef.current.textContent !== whole) {
        digitRef.current.textContent = whole;
      }
      if (chipDigitRef.current && chipDigitRef.current.textContent !== whole) {
        chipDigitRef.current.textContent = whole;
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

  const stayHere = () => {
    idle.reset();
    buttonRef.current?.scrollIntoView({
      behavior: motionOff() ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <div className="mt-6 flex justify-center">
      <button
        ref={buttonRef}
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

      {!buttonInView &&
        chipHost &&
        createPortal(
          <button
            type="button"
            data-testid="continue-countdown-chip"
            onClick={stayHere}
            aria-label="The tour continues soon. Tap to stay."
            className="flex min-h-12 items-center rounded-sm border border-exh-ink/15 bg-exh-linen px-3 text-exh-ink shadow-[0_1px_3px_rgba(28,26,23,0.12)]"
          >
            <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em]">
              Continuing in{" "}
              <span ref={chipDigitRef} className="exh-mono text-xs tracking-normal">
                {IDLE_SECONDS}
              </span>
              s, tap to stay
            </span>
          </button>,
          chipHost
        )}
    </div>
  );
}
