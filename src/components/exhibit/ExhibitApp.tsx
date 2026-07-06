"use client";
/* ------------------------------------------------------------------ */
/*  Client root of the exhibit: provider, gates, HUD, stage, audio.    */
/*  Composition only; every subsystem lives in its own module.         */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { ExhibitProvider, useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { CHAPTER_DEFS, CHAPTER_META } from "@/lib/exhibit/content";
import { CHAPTER_ORDER } from "@/lib/exhibit/types";
import NarrationController from "./audio/NarrationController";
import ModeGate from "./ModeGate";
import AdvisoryGate from "./AdvisoryGate";
import ChapterStage from "./stage/ChapterStage";
import CaptionBar from "./stage/CaptionBar";
import TranscriptView from "./stage/TranscriptView";
import ExhibitControls from "./shared/ExhibitControls";
import HudFrame from "./hud/HudFrame";
import RoomOverlay, { openRoomFromHash } from "./rooms/RoomOverlay";
import { preloadInteractives } from "./interactives/registry";
import type { InteractiveId, StageBlock } from "@/lib/exhibit/types";

function interactivesOf(chapterIndex: number): InteractiveId[] {
  const def = CHAPTER_DEFS[chapterIndex];
  if (!def) return [];
  return def.stage
    .filter((b): b is Extract<StageBlock, { kind: "interactive" }> => b.kind === "interactive")
    .map((b) => b.interactive);
}

function ExhibitRoot() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const meta = CHAPTER_META[state.chapterIndex];
  const motionOff = state.reducedMotion || meta?.sensitivity === "no-motion";
  const inTour = state.mode !== null && state.playState !== "gate";

  // the exhibit is an immersive world; the site navbar/footer yield while
  // a visitor is inside (globals.css body.exhibit-immersive rules)
  useEffect(() => {
    document.body.classList.add("exhibit-immersive");
    return () => document.body.classList.remove("exhibit-immersive");
  }, []);

  // ?ch=ch5 deep links (QC, review digests, owner links): skip the gate
  // straight into the chapter, guided mode, effects fast-forwarded
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ch = q.get("ch");
    if (!ch) return;
    const idx = CHAPTER_ORDER.indexOf(ch as (typeof CHAPTER_ORDER)[number]);
    if (idx < 0) return;
    dispatch({ type: "SET_MODE", mode: "guided" });
    dispatch({ type: "BEGIN" });
    dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: idx });
    // a #room-<id> hash on arrival opens that room over the landed chapter
    openRoomFromHash(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // chapter-boundary prefetch: the next chapter's interactives warm while
  // the current one plays
  useEffect(() => {
    preloadInteractives(interactivesOf(state.chapterIndex + 1));
  }, [state.chapterIndex]);

  // bare #room-<id> links (the URL the room itself pushes) must survive a
  // cold arrival: honor the hash once, on every path out of the gate
  const wasInTour = useRef(false);
  useEffect(() => {
    if (inTour && !wasInTour.current) {
      wasInTour.current = true;
      openRoomFromHash(dispatch);
    }
  }, [inTour, dispatch]);

  return (
    <div
      className="exhibit-root relative min-h-screen"
      data-motion={motionOff ? "off" : "on"}
      data-testid="exhibit-root"
      data-chapter={meta?.id}
      data-playstate={state.playState}
    >
      <NarrationController />
      {state.playState === "gate" && <ModeGate />}
      {state.playState === "advisory" && <AdvisoryGate />}
      {inTour && (
        <>
          <HudFrame />
          <ExhibitControls />
          <main className="relative z-10 pb-40 pt-6 md:pb-32">
            <ChapterStage />
          </main>
          <CaptionBar />
          <RoomOverlay />
          {state.transcriptOpen && <TranscriptView />}
        </>
      )}
    </div>
  );
}

export default function ExhibitApp() {
  return (
    <ExhibitProvider>
      <ExhibitRoot />
    </ExhibitProvider>
  );
}
