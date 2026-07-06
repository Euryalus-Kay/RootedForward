"use client";
/* ------------------------------------------------------------------ */
/*  The closing plate. A guided run that reached playState "ended"     */
/*  used to stop under the answer wall with no affordance at all       */
/*  (A4 P2, museum curator + interaction design). This plate ends      */
/*  the tour like an ending: the exhibit title, a quiet account of     */
/*  what the visit gathered, and the two ways onward. Quiet by the     */
/*  sensitivity rules; the ledger it points to is a record of loss,    */
/*  never a score.                                                     */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { allVoices } from "@/lib/exhibit/voices";
import { announce, moveFocus } from "@/lib/exhibit/focus";
import { clearScopedPlay } from "@/lib/exhibit/scoped-play";
import { unlockAudio } from "../audio/NarrationController";

const plateButton =
  "exh-plat inline-flex min-h-12 items-center border px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-200";

export default function EndPlate() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  /* the plate is itself a transition: bring it into view, hand it
     keyboard focus, and tell the live region the tour is over */
  useEffect(() => {
    const noMotion =
      document.querySelector('[data-testid="exhibit-root"]')?.getAttribute("data-motion") === "off";
    rootRef.current?.scrollIntoView({ behavior: noMotion ? "auto" : "smooth", block: "center" });
    moveFocus(headingRef.current);
    announce("The tour has ended.");
  }, []);

  const restart = () => {
    clearScopedPlay();
    unlockAudio();
    dispatch({
      type: "RESTORE",
      state: {
        mode: "guided",
        muted: state.muted,
        captionsOn: state.captionsOn,
        reducedMotion: state.reducedMotion,
        advisoryAccepted: state.advisoryAccepted,
      },
    });
    dispatch({ type: "BEGIN" });
  };

  const exploreStations = () => {
    clearScopedPlay();
    dispatch({ type: "SET_MODE", mode: "explore" });
  };

  const entries = state.ledgerPosted.length;
  const voicesHeard = state.voicesFound.length;
  const voicesTotal = allVoices().length;

  return (
    <div
      ref={rootRef}
      data-testid="end-plate"
      className="mt-16 scroll-mt-24 border border-exh-ink/40 bg-exh-linen-deep/40 px-6 py-10 text-center sm:px-10 md:py-12"
    >
      <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
        End of the tour
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-display text-3xl text-exh-ink outline-none md:text-4xl"
      >
        The Ground Keeps Moving
      </h2>
      <div className="mx-auto mt-6 h-px w-16 bg-exh-ink/30" aria-hidden="true" />
      <p className="mx-auto mt-6 max-w-md font-body text-sm leading-relaxed text-exh-ink-soft">
        {`The ledger closed at ${entries} ${entries === 1 ? "entry" : "entries"}. You heard ${voicesHeard} of ${voicesTotal} voices along the way. Both stay open if you want to look back.`}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="end-restart"
          onClick={restart}
          className={`${plateButton} border-exh-ink bg-exh-linen text-exh-ink hover:bg-exh-ink hover:text-exh-linen`}
        >
          Start the tour again
        </button>
        <button
          type="button"
          data-testid="end-explore"
          onClick={exploreStations}
          className={`${plateButton} border-exh-ink/40 bg-exh-linen text-exh-ink hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen`}
        >
          Explore the stations
        </button>
      </div>
    </div>
  );
}
