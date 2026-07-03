"use client";
/* ------------------------------------------------------------------ */
/*  Content advisory before chapter four. A dimmed screen and a        */
/*  plain, still card. No motion, no imagery, two choices. Focus is    */
/*  trapped on the card while it is open.                              */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";

export default function AdvisoryGate() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const open = state.playState === "advisory";

  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const buttons = Array.from(card.querySelectorAll<HTMLButtonElement>("button"));
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const current = document.activeElement as HTMLButtonElement | null;
      e.preventDefault();
      if (!current || !buttons.includes(current)) {
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey) {
        (current === first ? last : first).focus();
      } else {
        (current === last ? first : last).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  if (!open) return null;

  return (
    <div
      data-testid="advisory-gate"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-exh-ink/70 px-6"
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exh-advisory-title"
        aria-describedby="exh-advisory-body"
        className="w-full max-w-lg border border-exh-ink bg-exh-linen p-8 outline-none"
      >
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Content advisory
        </p>
        <h2 id="exh-advisory-title" className="mt-3 font-display text-3xl text-exh-ink">
          Before this chapter
        </h2>
        <p id="exh-advisory-body" className="mt-4 font-body text-base leading-relaxed text-exh-ink">
          This chapter documents racial terrorism, including bombings and the killing of a
          teenager. No graphic imagery is shown.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => dispatch({ type: "ACCEPT_ADVISORY" })}
            className="exh-plat min-h-12 flex-1 border border-exh-ink bg-exh-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-exh-linen transition-colors duration-200 hover:bg-exh-linen hover:text-exh-ink"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SKIP_ADVISORY_CHAPTER" })}
            className="exh-plat min-h-12 flex-1 border border-exh-ink bg-exh-linen px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen"
          >
            Skip to the next era
          </button>
        </div>
      </div>
    </div>
  );
}
