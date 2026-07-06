"use client";
/* ------------------------------------------------------------------ */
/*  The front door. A full-viewport linen cover while playState is     */
/*  "gate": exhibit title, one-line dek, and the two ways in. If a     */
/*  saved visit is past the opening chapter it also offers resume,     */
/*  restoring the durable slice and jumping back to the saved          */
/*  chapter. Begin handlers run unlockAudio() inside the click so      */
/*  mobile autoplay is unlocked before narration starts.               */
/* ------------------------------------------------------------------ */
import { useState, useSyncExternalStore } from "react";
import { CHAPTER_META } from "@/lib/exhibit/content";
import { CHAPTER_ORDER, type ExhibitMode, type ExhibitState } from "@/lib/exhibit/types";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { clearExhibitState, loadExhibitState } from "@/lib/exhibit/persist";
import { unlockAudio } from "./audio/NarrationController";

/* The saved-visit snapshot is external sessionStorage state, read once
   per page load through useSyncExternalStore so the server render (no
   resume row) hydrates cleanly. */
const noopSubscribe = () => () => {};
let savedSnapshotCache: Partial<ExhibitState> | null | undefined;
function readSavedSnapshot(): Partial<ExhibitState> | null {
  if (savedSnapshotCache === undefined) {
    const stored = loadExhibitState();
    savedSnapshotCache =
      stored &&
      (stored.mode === "guided" || stored.mode === "explore") &&
      (stored.chapterIndex ?? 0) > 0
        ? stored
        : null;
  }
  return savedSnapshotCache;
}

export default function ModeGate() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const storedVisit = useSyncExternalStore(noopSubscribe, readSavedSnapshot, () => null);
  const [dismissed, setDismissed] = useState(false);

  const atGate = state.playState === "gate";
  const saved = dismissed ? null : storedVisit;

  if (!atGate) return null;

  const begin = (mode: ExhibitMode) => {
    unlockAudio();
    dispatch({ type: "SET_MODE", mode });
    dispatch({ type: "BEGIN" });
  };

  const resume = () => {
    if (!saved) return;
    unlockAudio();
    const target = Math.max(0, Math.min(saved.chapterIndex ?? 0, CHAPTER_ORDER.length - 1));
    const restored: Partial<ExhibitState> = { ...saved };
    delete restored.playState;
    dispatch({ type: "RESTORE", state: restored });
    // Explore never leaves "gate" on a jump alone; BEGIN moves it off the
    // gate first, then the jump lands on the saved chapter in both modes.
    if (saved.mode === "explore") dispatch({ type: "BEGIN" });
    dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: target });
  };

  const startOver = () => {
    clearExhibitState();
    savedSnapshotCache = null;
    setDismissed(true);
  };

  const savedIndex = Math.max(0, Math.min(saved?.chapterIndex ?? 0, CHAPTER_META.length - 1));
  const savedMeta = CHAPTER_META[savedIndex];

  return (
    <div className="exh-paper fixed inset-0 z-50 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-6 py-16 sm:px-10">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
          Hyde Park, 1832 to 2026
        </p>
        <h1 className="mt-4 font-display text-5xl leading-[1.02] text-exh-ink sm:text-6xl md:text-7xl">
          The Ground Keeps Moving
        </h1>
        <p className="mt-6 max-w-2xl font-display text-lg leading-relaxed text-exh-ink-soft md:text-xl">
          How five machines built a neighborhood and a wealth gap, and who fought back.
        </p>

        {saved && savedMeta && (
          <div className="mt-10 border border-exh-blue/60 bg-exh-linen-deep/50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
                Saved visit
              </p>
              <p className="mt-1 font-display text-lg text-exh-ink">{savedMeta.title}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0 sm:shrink-0">
              <button
                type="button"
                data-testid="mode-resume"
                onClick={resume}
                className="exh-plat inline-flex min-h-12 items-center border border-exh-ink bg-exh-linen px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen"
              >
                Resume where you left off
              </button>
              <button
                type="button"
                onClick={startOver}
                className="exh-plat inline-flex min-h-12 items-center px-3 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink-soft underline decoration-exh-ink/40 underline-offset-4 transition-colors duration-200 hover:text-exh-ink"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            data-testid="mode-guided"
            onClick={() => begin("guided")}
            className="group border border-exh-ink bg-exh-linen p-6 text-left transition-colors duration-300 hover:bg-exh-ink sm:p-8"
          >
            <span className="exh-plat block text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft group-hover:text-exh-linen/80">
              Narrated
            </span>
            <span className="mt-3 block font-display text-2xl text-exh-ink group-hover:text-exh-linen md:text-3xl">
              Guided tour
            </span>
            <span className="mt-3 block font-body text-sm leading-relaxed text-exh-ink-soft group-hover:text-exh-linen/90">
              About <span className="exh-mono">16</span> minutes. The exhibit walks you through,
              station by station, and pauses where there is something to do.
            </span>
            <span className="exh-plat mt-5 block text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink underline decoration-exh-ink/40 underline-offset-4 group-hover:text-exh-linen group-hover:decoration-exh-linen/60">
              Begin the tour
            </span>
          </button>
          <button
            type="button"
            data-testid="mode-explore"
            onClick={() => begin("explore")}
            className="group border border-exh-ink bg-exh-linen p-6 text-left transition-colors duration-300 hover:bg-exh-ink sm:p-8"
          >
            <span className="exh-plat block text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft group-hover:text-exh-linen/80">
              Self paced
            </span>
            <span className="mt-3 block font-display text-2xl text-exh-ink group-hover:text-exh-linen md:text-3xl">
              Explore on your own
            </span>
            <span className="mt-3 block font-body text-sm leading-relaxed text-exh-ink-soft group-hover:text-exh-linen/90">
              Every station open, read at your pace. You can start the narration from any chapter
              later.
            </span>
            <span className="exh-plat mt-5 block text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink underline decoration-exh-ink/40 underline-offset-4 group-hover:text-exh-linen group-hover:decoration-exh-linen/60">
              Enter the exhibit
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
