"use client";
/* ------------------------------------------------------------------ */
/*  HudFrame mounts the exhibit's four persistent HUD systems plus     */
/*  the shared aria-live region every system announces through.        */
/*                                                                     */
/*  Composition (all fixed, HUD layer z-40, sheets and popovers z-50): */
/*    desktop md+   Machine Status Board pinned top-left column,       */
/*                  Ledger pinned top-right (w-72, internal scroll),   */
/*                  voices chip above the ledger, Timeline Spine as    */
/*                  the bottom rail (h-16).                            */
/*    mobile        Machine board as a 5-lamp row on the left of a     */
/*                  strip at top-12 (under an assumed 48px exhibit     */
/*                  header), Ledger collapsed to a tap-total chip on   */
/*                  the right of the same strip, voices chip in the    */
/*                  top controls row, spine compact (h-11).            */
/*                                                                     */
/*  Nothing here may cover the CaptionBar strip (the 72px band above   */
/*  the spine); the ledger's max height already reserves that zone,    */
/*  and every wrapper is sized to its content so stage scroll stays    */
/*  free.                                                              */
/* ------------------------------------------------------------------ */
import { Ledger, LedgerChip } from "./Ledger";
import { MachineBoard } from "./MachineBoard";
import { TimelineSpine } from "./TimelineSpine";
import { VoiceMedallions } from "./VoiceMedallions";

/* ---- shared polite announcer -------------------------------------- */
/*  Ledger posts and machine switches can land in the same commit      */
/*  (CHAPTER_DONE applies both), so announcements within a short       */
/*  window merge into one utterance instead of clobbering each other.  */

let liveQueue: string[] = [];
let liveLastAt = 0;
let liveClearTimer: number | null = null;

export function exhAnnounce(text: string) {
  if (typeof document === "undefined" || !text) return;
  const el = document.getElementById("exh-live");
  if (!el) return;
  const now = Date.now();
  if (now - liveLastAt > 1200) liveQueue = [];
  liveLastAt = now;
  liveQueue.push(text);
  el.textContent = liveQueue.join(" ");
  if (liveClearTimer !== null) window.clearTimeout(liveClearTimer);
  liveClearTimer = window.setTimeout(() => {
    liveQueue = [];
    liveClearTimer = null;
    const node = document.getElementById("exh-live");
    if (node) node.textContent = "";
  }, 6000);
}

export interface HudFrameProps {
  /** reserved for a future portal target under the exhibit header */
  mobileHeaderSlot?: never;
}

export function HudFrame() {
  return (
    <>
      {/* the one live region every HUD system writes to */}
      <div id="exh-live" aria-live="polite" className="sr-only" />

      {/* machine status board: column on md+, lamp row on mobile */}
      <div className="fixed left-2 top-12 z-40 md:left-3 md:top-24">
        <MachineBoard />
      </div>

      {/* the ledger, top-right on md+ (stays mounted on mobile so its
          announcements keep firing; only the panel is hidden) */}
      <div className="fixed right-3 top-24 z-40 hidden md:block">
        <Ledger />
      </div>

      {/* mobile ledger chip, right end of the top strip */}
      <div className="fixed right-2 top-12 z-40 md:hidden">
        <LedgerChip />
      </div>

      {/* voices chip, near the top controls */}
      <div className="fixed right-2 top-1.5 z-40 md:right-3 md:top-6">
        <VoiceMedallions />
      </div>

      <TimelineSpine />
    </>
  );
}

export default HudFrame;
