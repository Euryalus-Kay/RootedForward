"use client";
/* ------------------------------------------------------------------ */
/*  Hold the Line, the CH10 pause point. The Contract Buyers League    */
/*  escrow strike as one held button. Holding it (pointer, Space or   */
/*  Enter held down, or the H key as a switch-access toggle) ticks    */
/*  months upward at about six per second and fills an escrow ledger  */
/*  with check glyphs; the only lines that surface are the three      */
/*  documented ones, each with its source on screen. Releasing early  */
/*  is never a failure state, holds are repeatable and cumulative,    */
/*  and at twelve months the resolution card lands with the           */
/*  eviction-and-return beat, the renegotiation arithmetic, and Ruth  */
/*  Wells. Under reduced motion months advance in plain steps and     */
/*  the ledger fills without animation.                                */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState } from "react";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import VoiceCard from "../../shared/VoiceCard";

const MONTHS_PER_SECOND = 6;
const MONTH_CAP = 14;
const RESOLVE_AT = 12;
/* the three documented lines surface at these month marks */
const LINE_1_AT = 2;
const LINE_2_AT = 5;
const LINE_3_AT = 9;

const PULSE_CSS = `
.htl-pulse { animation: htlPulse 1.6s ease-in-out infinite; }
@keyframes htlPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(28, 26, 23, 0.25); } 50% { box-shadow: 0 0 0 10px rgba(28, 26, 23, 0); } }
.exhibit-root[data-motion="off"] .htl-pulse { animation: none; }
.htl-check-in { animation: htlCheckIn 200ms ease-out both; }
@keyframes htlCheckIn { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
.exhibit-root[data-motion="off"] .htl-check-in { animation: none; }
`;

/** one escrowed payment, a small check glyph */
function CheckGlyph({ filled, animate }: { filled: boolean; animate: boolean }) {
  return (
    <span
      className={`flex h-7 w-9 items-center justify-center rounded-[2px] border ${
        filled ? `border-exh-ink/60 bg-exh-linen ${animate ? "htl-check-in" : ""}` : "border-dashed border-exh-ink/25"
      }`}
    >
      {filled && (
        <svg viewBox="0 0 24 16" width={22} height={15} aria-hidden="true">
          <rect
            x={0.75}
            y={0.75}
            width={22.5}
            height={14.5}
            rx={1}
            fill="none"
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <line x1={3} y1={5} x2={13} y2={5} style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.55} strokeWidth={1.2} />
          <line x1={3} y1={8.5} x2={10} y2={8.5} style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.55} strokeWidth={1.2} />
          <path d="M14 10.5 q3 -2.5 6 -1" fill="none" style={{ stroke: "var(--color-exh-ink)" }} strokeOpacity={0.7} strokeWidth={1.2} />
        </svg>
      )}
    </span>
  );
}

export default function HoldTheLine() {
  const api = useInteractive();

  const [months, setMonths] = useState(0);
  const [holding, setHolding] = useState(false);
  const [everHeld, setEverHeld] = useState(false);
  const [resolved, setResolved] = useState(false);

  const monthsRef = useRef(0);
  const pointerRef = useRef(false);
  const keyRef = useRef(false);
  const latchRef = useRef(false); /* the H-key switch-access toggle */
  const doneRef = useRef(false);
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const syncHolding = useCallback(() => {
    setHolding(pointerRef.current || keyRef.current || latchRef.current);
  }, []);

  const beginHold = useCallback(() => {
    apiRef.current.onInteraction();
    setEverHeld(true);
    syncHolding();
  }, [syncHolding]);

  /* months accumulate while held, cumulative across holds, capped */
  useEffect(() => {
    if (!holding) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const next = Math.min(MONTH_CAP, monthsRef.current + dt * MONTHS_PER_SECOND);
      monthsRef.current = next;
      const whole = Math.floor(next);
      setMonths((m) => (m === whole ? m : whole));
      if (next >= RESOLVE_AT) {
        setResolved(true);
        if (!doneRef.current) {
          doneRef.current = true;
          apiRef.current.onComplete();
        }
      }
      if (next < MONTH_CAP) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [holding]);

  /* H toggles holding for switch-access users, while this station is live */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "h" && e.key !== "H") return;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!apiRef.current.active) return;
      latchRef.current = !latchRef.current;
      if (latchRef.current) beginHold();
      else syncHolding();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginHold, syncHolding]);

  /* ---------------- button handlers ---------------- */

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic events in the verify harness have no active pointer */
    }
    pointerRef.current = true;
    beginHold();
  };
  const onPointerEnd = () => {
    if (!pointerRef.current) return;
    pointerRef.current = false;
    syncHolding();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (e.repeat || keyRef.current) return;
    keyRef.current = true;
    beginHold();
  };
  const onKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (!keyRef.current) return;
    keyRef.current = false;
    syncHolding();
  };
  const onBlur = () => {
    /* a lost focus ends a key hold; the H latch stays, by design */
    if (!keyRef.current) return;
    keyRef.current = false;
    syncHolding();
  };

  const releasedEarly = everHeld && !holding && months > 0 && !resolved;
  const checksIn = Math.min(months, MONTH_CAP);

  return (
    <div className="w-full" data-testid="hold-the-line" data-months={months}>
      <style>{PULSE_CSS}</style>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Keep the button held. The strike holds as long as you do.
        </p>
        <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-none tracking-[0.15em] text-exh-ink-soft">
          one held second stands for six months
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* ---------------- the held button ---------------- */}
        <div className="flex shrink-0 flex-col items-center gap-2 self-center sm:self-start">
          <button
            type="button"
            data-testid="htl-button"
            data-holding={holding ? "true" : "false"}
            aria-label="Hold your payment. Keep this button pressed with your pointer, or hold Space or Enter. Press the H key to switch holding on or off without pressing and holding."
            onPointerDown={onPointerDown}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onLostPointerCapture={onPointerEnd}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={onBlur}
            style={{ touchAction: "none" }}
            className={`flex h-32 w-32 cursor-pointer select-none items-center justify-center rounded-full border-2 text-center transition-colors ${
              holding
                ? `border-exh-ink bg-exh-ink text-exh-linen ${api.reducedMotion ? "" : "htl-pulse"}`
                : "border-exh-ink/70 bg-exh-linen-deep text-exh-ink hover:border-exh-ink"
            }`}
          >
            <span className="exh-plat px-3 text-[11px] font-bold uppercase leading-snug tracking-[0.2em]">
              Hold your payment
            </span>
          </button>
          <p className="exh-plat max-w-36 text-center text-[9px] uppercase leading-relaxed tracking-[0.14em] text-exh-ink-soft">
            press and hold, or press H to hold
          </p>
        </div>

        {/* ---------------- the escrow ledger ---------------- */}
        <PaperCard className="min-w-0 flex-1 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              Months in escrow
            </p>
            <p className="exh-mono text-2xl font-medium text-exh-ink" aria-hidden="true">
              {months}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`${months} monthly payments held in escrow`}>
            {Array.from({ length: MONTH_CAP }, (_, i) => (
              <CheckGlyph key={i} filled={i < checksIn} animate={!api.reducedMotion} />
            ))}
          </div>

          {/* the documented lines, one at a time */}
          <div className="mt-3 flex flex-col gap-2" aria-live="polite">
            {months >= LINE_1_AT && (
              <div className={api.reducedMotion ? "" : "exh-ledger-in"}>
                <span className="exh-plat mr-1.5 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
                  in summary
                </span>
                <span className="text-sm leading-snug text-exh-ink">
                  Families placed each month&rsquo;s payment in escrow rather than pay the contract
                  <SourceSup factId="cbl.founded_1968" />
                </span>
              </div>
            )}
            {months >= LINE_2_AT && (
              <p className={`text-sm leading-snug text-exh-ink ${api.reducedMotion ? "" : "exh-ledger-in"}`}>
                More than five hundred families held together{" "}
                <FactValue id="cbl.strike_500" size="sm" />
              </p>
            )}
            {months >= LINE_3_AT && (
              <p className={`text-sm leading-snug text-exh-ink ${api.reducedMotion ? "" : "exh-ledger-in"}`}>
                About seventy families permanently lost their homes to the strike{" "}
                <FactValue id="cbl.evicted_70" size="sm" />
              </p>
            )}
          </div>
        </PaperCard>
      </div>

      {/* released early, never a failure state */}
      {releasedEarly && (
        <p className="mt-3 text-sm leading-snug text-exh-ink-soft" aria-live="polite" data-testid="htl-early">
          Real families held for over a year. Hold again if you like.
        </p>
      )}

      {/* ---------------- the resolution ---------------- */}
      {resolved && (
        <div
          data-testid="htl-resolution"
          className={`mt-4 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4 ${
            api.reducedMotion ? "" : "exh-ledger-in"
          }`}
        >
          <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">
            When deputies carried furniture out, neighbors carried it back in.
          </p>
          <div className="mt-2 flex flex-col gap-1">
            <FactValue id="cbl.renegotiated_155_by_1971" size="sm" />
            <FactValue id="cbl.savings" size="sm" />
          </div>
          <p className="exh-serif mt-3 text-base leading-snug text-exh-ink">
            On the ledger, the only entry that runs backward.
          </p>
          <div className="mt-4 flex justify-center">
            <VoiceCard personId="ruth-wells" size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
