"use client";
/* ------------------------------------------------------------------ */
/*  HudFrame mounts the exhibit's four persistent HUD systems plus     */
/*  the shared aria-live region every system announces through.        */
/*                                                                     */
/*  Composition (all fixed, HUD layer z-40, sheets and popovers z-50): */
/*    desktop md+   transport cluster docked top-right (see            */
/*                  ExhibitControls), voices chip under it, Ledger     */
/*                  under the chip (w-72, internal scroll), Machine    */
/*                  Status Board a labeled left column below the       */
/*                  breadcrumb line, Timeline Spine the bottom rail    */
/*                  (h-16).                                            */
/*    narrow        one full-width plated strip across the top on the  */
/*                  deep linen (same surface as the spine): row one    */
/*                  holds the voices chip and a reserved right slot    */
/*                  the fixed transport cluster docks over; row two    */
/*                  holds the 5-lamp machine row and the ledger chip.  */
/*                  The pause-point countdown chip portals directly    */
/*                  below the strip. The strip wrapper dissolves on    */
/*                  md+ (display: contents) so each system keeps one   */
/*                  React instance and its testid stays unique.        */
/*                                                                     */
/*  The strip is STRIP_PX tall (7.25rem) plus the top safe-area        */
/*  inset; ChapterStage reserves matching scroll margins so guided     */
/*  scroll choreography never lands prose under it. Nothing here may   */
/*  cover the CaptionBar band above the spine; the ledger's max        */
/*  height reserves that zone.                                         */
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

      {/* the plated top strip (narrow viewports); dissolves on md+ so each
          chip keeps a single instance and takes its fixed corner instead */}
      <div
        data-testid="hud-strip"
        className="exh-paper fixed inset-x-0 top-0 z-40 border-b border-exh-ink/15 pt-[env(safe-area-inset-top)] md:contents"
        style={{ backgroundColor: "var(--color-exh-linen-deep)" }}
      >
        <div className="flex flex-col gap-1.5 p-1.5 md:contents">
          {/* strip row one: voices chip in its own slot; the fixed transport
              cluster (ExhibitControls) docks over the reserved right slot */}
          <div className="flex h-12 items-center justify-between gap-1.5 md:contents">
            <div className="min-w-0 md:fixed md:right-3 md:top-[4.25rem] md:z-40">
              <VoiceMedallions />
            </div>
            <div aria-hidden="true" className="h-12 w-[12.5rem] shrink-0 md:hidden" />
          </div>
          {/* strip row two: machine lamp row left, ledger chip right */}
          <div className="flex h-12 items-center justify-between gap-1.5 md:contents">
            <div className="md:fixed md:left-3 md:top-28 md:z-40">
              <MachineBoard />
            </div>
            <div className="shrink-0 md:hidden">
              <LedgerChip />
            </div>
          </div>
        </div>
      </div>

      {/* the ledger, top-right under the voices chip on md+ (stays mounted
          on mobile so its announcements keep firing; only the panel is
          hidden) */}
      <div className="fixed right-3 top-32 z-40 hidden md:block">
        <Ledger />
      </div>

      {/* portal target for the pause-point countdown chip. ContinueButton
          mounts a compact "Continuing in Ns, tap to stay" chip here only
          while its own button sits outside the viewport, so the idle
          auto-continue is never invisible at tall stations. Directly below
          the strip on narrow viewports, centered and clear of the corner
          HUD systems on md+. */}
      <div
        id="exh-hud-continue-chip"
        className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+7.5rem)] z-40 -translate-x-1/2 md:top-20"
      />

      <TimelineSpine />
    </>
  );
}

export default HudFrame;
