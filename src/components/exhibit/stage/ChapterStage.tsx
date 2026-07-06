"use client";
/* ------------------------------------------------------------------ */
/*  The scrolling stage for the current chapter. Guided mode reveals   */
/*  stage blocks progressively as narration blocks land (figures,      */
/*  stats, and interactives ride with the narration block they         */
/*  follow) and scrolls each new block into view. Explore mode lays    */
/*  the whole chapter out at once with per-chapter play and prev or    */
/*  next controls. Chapter four renders with no motion.                */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { CHAPTER_DEFS } from "@/lib/exhibit/content";
import type { StageBlock } from "@/lib/exhibit/types";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { moveFocus } from "@/lib/exhibit/focus";
import { beginScopedPlay, clearScopedPlay, scopedPlayChapter } from "@/lib/exhibit/scoped-play";
import BlockRenderer from "./BlockRenderer";
import EndPlate from "./EndPlate";
import { unlockAudio } from "../audio/NarrationController";

interface GatedBlock {
  block: StageBlock;
  /** the narration block index this stage block becomes visible with */
  gate: number;
  /** true for the chapter's first narration block */
  opening: boolean;
}

const navButton =
  "exh-plat inline-flex min-h-12 items-center border border-exh-ink/40 bg-exh-linen px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors duration-200 hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-exh-linen disabled:hover:text-exh-ink";

export default function ChapterStage() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const sectionRef = useRef<HTMLElement | null>(null);

  const def = CHAPTER_DEFS[state.chapterIndex];
  const explore = state.mode === "explore";
  const noMotion = state.reducedMotion || def?.meta.sensitivity === "no-motion";

  const gated = useMemo<GatedBlock[]>(() => {
    const out: GatedBlock[] = [];
    let narration = -1;
    for (const block of def?.stage ?? []) {
      if (block.kind === "narration") narration += 1;
      out.push({
        block,
        gate: Math.max(0, narration),
        opening: block.kind === "narration" && narration === 0,
      });
    }
    return out;
  }, [def]);

  const visible = explore ? gated : gated.filter((g) => g.gate <= state.blockIndex);

  /* scroll and focus choreography: new chapter to the top, new
     narration block to its card, a fresh pause point to its plinth.
     Focus rides along at the transitions the A4 accessibility review
     flagged (gate exit, chapter changes, mode conversions, CONTINUE),
     so keyboard visitors never restart from <body>. The advisory
     alertdialog owns focus while it is open; the chapter root takes
     it back when the dialog settles. */
  const prevRef = useRef<{
    chapter: number;
    block: number;
    pausePoint: string | null;
    playState: string;
    mode: string | null;
  } | null>(null);
  useEffect(() => {
    const pausePoint = state.pausePoint?.interactiveId ?? null;
    const prev = prevRef.current;
    prevRef.current = {
      chapter: state.chapterIndex,
      block: state.blockIndex,
      pausePoint,
      playState: state.playState,
      mode: state.mode,
    };
    const root = sectionRef.current;
    if (!root) return;
    const behavior: ScrollBehavior = noMotion ? "auto" : "smooth";
    const advisoryOpen = state.playState === "advisory";
    if (!prev) {
      // gate exit: the stage just mounted, the chapter root takes focus
      if (!advisoryOpen) moveFocus(root);
      return;
    }
    if (prev.chapter !== state.chapterIndex) {
      root.scrollIntoView({ behavior, block: "start" });
      if (!advisoryOpen) moveFocus(root);
      return;
    }
    if (prev.mode !== state.mode) {
      // explore-to-guided conversion or the way back; settle at the top
      root.scrollIntoView({ behavior, block: "start" });
      if (!advisoryOpen) moveFocus(root);
      return;
    }
    if (prev.playState === "advisory" && !advisoryOpen) {
      // the advisory dialog closed on this same chapter
      moveFocus(root);
      return;
    }
    if (!explore && pausePoint && prev.pausePoint !== pausePoint) {
      root
        .querySelector(`[data-pausepoint="${pausePoint}"]`)
        ?.scrollIntoView({ behavior, block: "start" });
      return;
    }
    if (!explore && state.blockIndex > prev.block) {
      const card = root.querySelector<HTMLElement>(
        `[data-kind="narration"][data-gate="${state.blockIndex}"]`
      );
      card?.scrollIntoView({ behavior, block: "start" });
      // CONTINUE unmounts the button a visitor just pressed; hand
      // focus to the narration card the tour resumed on
      if (prev.pausePoint && !pausePoint) moveFocus(card);
    }
  }, [state.chapterIndex, state.blockIndex, state.pausePoint, state.playState, state.mode, explore, noMotion]);

  /* Scoped playback return (A4 P2): explore's "Play this chapter"
     narrates ONE chapter; when the play crosses the chapter boundary
     the visit returns to self-paced explore through existing actions.
     The last chapter is the exception, since its boundary is the
     tour's own ending and the closing plate offers the ways onward. */
  useEffect(() => {
    const scoped = scopedPlayChapter();
    if (scoped === null) return;
    if (state.mode !== "guided") {
      clearScopedPlay();
      return;
    }
    if (state.chapterIndex !== scoped) {
      clearScopedPlay();
      dispatch({ type: "SET_MODE", mode: "explore" });
      // explore's steady state; the pending advisory, if any, stays up
      if (state.playState === "playing") dispatch({ type: "END_TOUR" });
    }
  }, [state.chapterIndex, state.mode, state.playState, dispatch]);

  if (!def) return null;
  const { meta } = def;
  const lastChapter = CHAPTER_DEFS.length - 1;

  const jumpTo = (chapterIndex: number) => dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex });

  const playThisChapter = () => {
    unlockAudio();
    beginScopedPlay(state.chapterIndex);
    dispatch({ type: "SET_MODE", mode: "guided" });
    dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: state.chapterIndex });
  };

  const chapterNav = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => jumpTo(state.chapterIndex - 1)}
        disabled={state.chapterIndex === 0}
        className={navButton}
      >
        Previous chapter
      </button>
      <button type="button" onClick={playThisChapter} className={navButton}>
        Play this chapter
      </button>
      <button
        type="button"
        onClick={() => jumpTo(state.chapterIndex + 1)}
        disabled={state.chapterIndex === lastChapter}
        className={navButton}
      >
        Next chapter
      </button>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      data-testid="chapter-stage"
      data-chapter={meta.id}
      // narrow-viewport scroll margins clear the fixed HUD strip
      // (7.25rem plus the top safe-area inset; see HudFrame)
      className="mx-auto w-full max-w-3xl scroll-mt-[calc(env(safe-area-inset-top,0px)+8.5rem)] px-5 pb-40 pt-16 outline-none sm:px-8 md:scroll-mt-16 md:pt-24"
    >
      <header className="mb-12 md:mb-16">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
          {meta.era}
        </p>
        <h2 className="mt-3 font-display text-3xl text-exh-ink md:text-4xl">{meta.title}</h2>
        <div className="mt-6 h-px w-16 bg-exh-ink/30" aria-hidden="true" />
        {explore && <div className="mt-8">{chapterNav}</div>}
      </header>

      <div className="space-y-10 md:space-y-14">
        {visible.map((g, i) => (
          <motion.div
            key={`${meta.id}-${i}`}
            data-kind={g.block.kind}
            data-gate={g.gate}
            className="scroll-mt-[calc(env(safe-area-inset-top,0px)+8.75rem)] md:scroll-mt-24"
            initial={noMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: noMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            <BlockRenderer block={g.block} opening={g.opening} noMotion={noMotion} />
          </motion.div>
        ))}
      </div>

      {!explore && state.playState === "ended" && <EndPlate />}

      {explore && <footer className="mt-16">{chapterNav}</footer>}
    </section>
  );
}
