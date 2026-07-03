"use client";
/* ------------------------------------------------------------------ */
/*  TimelineSpine, the bottom rail from 1832 to 2026.                  */
/*                                                                     */
/*  Continuous progress writes a scaleX transform straight to a ref    */
/*  from the playhead bus, so per-frame time never re-renders React.   */
/*  The red 1921 to 1968 span reveals once the tour first reaches the  */
/*  chapter whose spine year enters that era (the prologue chapters    */
/*  ch0 and ch0_5 are flash-forwards and do not count), latched        */
/*  once per session under the firedOnce key "spine-red-span".         */
/*  Node dots: passed chapters filled ink, the current chapter a       */
/*  pulsing gold ring, future hollow. Clicking a node asks before      */
/*  jumping. Mobile gets a compact rail plus an era chip that opens    */
/*  a chapter sheet.                                                   */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import timelineJson from "../../../../data/exhibit/timeline.json";
import { CHAPTER_ORDER, type TimelineNodeDef } from "@/lib/exhibit/types";
import { BLOCK_COUNTS, CHAPTER_META } from "@/lib/exhibit/content";
import { useExhibitDispatch, useExhibitState, usePlayheadBus } from "@/lib/exhibit/ExhibitProvider";
import type { PlayheadSnapshot } from "@/lib/exhibit/playhead";
import { motionMs } from "@/lib/exhibit/debug";
import { cn } from "@/lib/utils";
import { PaperCard } from "../shared/PaperCard";

const TIMELINE = timelineJson as unknown as {
  spanStart: number;
  spanEnd: number;
  redSpan: { start: number; end: number; note: string };
  nodes: TimelineNodeDef[];
};

const CHAPTER_COUNT = CHAPTER_ORDER.length;

const pctOf = (year: number) =>
  ((year - TIMELINE.spanStart) / (TIMELINE.spanEnd - TIMELINE.spanStart)) * 100;

/* The chapter index that reveals the red span. Prologue chapters sit
   before ch1 in the order and are flash-forwards (ch0 opens in 1940),
   so the scan starts at the first chronological chapter. */
const RED_REVEAL_INDEX = (() => {
  const firstChrono = CHAPTER_ORDER.indexOf("ch1");
  const meta = CHAPTER_META.find((m) => m.index >= firstChrono && m.spineYear >= TIMELINE.redSpan.start);
  return meta ? meta.index : CHAPTER_COUNT - 1;
})();

/* Year labels thin themselves out so clustered nodes (1832/1833,
   1921/1924/1926, 1952/1955/1958) never collide. */
const LABELED_YEARS = (() => {
  const out = new Set<number>();
  let last = -Infinity;
  for (const n of [...TIMELINE.nodes].sort((a, b) => a.year - b.year)) {
    const p = pctOf(n.year);
    if (p - last >= 4.2) {
      out.add(n.year);
      last = p;
    }
  }
  return out;
})();

interface JumpConfirm {
  year: number;
  title: string;
  chapterIndex: number;
  leftPct: number;
  /** the chapter the chip was opened in; the chip only lives there */
  openedAtChapter: number;
}

export function TimelineSpine() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const bus = usePlayheadBus();
  const fillRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm] = useState<JumpConfirm | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const chapterId = CHAPTER_ORDER[state.chapterIndex];
  const meta = CHAPTER_META[state.chapterIndex];
  const instant = state.reducedMotion || state.silentEffects;

  /* ---- continuous progress, no per-frame React state ----
     writeFill closes over the chapter and block position, so the
     subscription renews only at block boundaries. subscribe() replays
     the last snapshot immediately, and every frame after that writes
     the transform straight to the ref. */
  const chapterIndex = state.chapterIndex;
  const blockIndex = state.blockIndex;
  const writeFill = useCallback(
    (snap: PlayheadSnapshot | null) => {
      const blocks = BLOCK_COUNTS[chapterId] ?? 0;
      let inBlock = 0;
      if (snap && snap.blockId && snap.blockId.startsWith(`${chapterId}-`) && snap.blockDurationMs > 0) {
        inBlock = Math.min(1, snap.msIntoBlock / snap.blockDurationMs);
      }
      const inChapter = blocks > 0 ? Math.min(1, (blockIndex + inBlock) / blocks) : 0;
      const p = Math.min(1, (chapterIndex + inChapter) / CHAPTER_COUNT);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
    },
    [chapterId, chapterIndex, blockIndex]
  );

  useEffect(() => bus.subscribe(writeFill), [bus, writeFill]);

  /* ---- red span latch (once per session) ---- */
  const redFired = state.firedOnce.includes("spine-red-span");
  const redRevealed = redFired || state.chapterIndex >= RED_REVEAL_INDEX;
  useEffect(() => {
    if (redRevealed && !redFired) dispatch({ type: "MARK_FIRED", key: "spine-red-span" });
  }, [redRevealed, redFired, dispatch]);

  /* ---- jump confirmation chip ----
     the chip closes on chapter change by derivation, not by effect:
     it only renders in the chapter it was opened in */
  const activeConfirm = confirm && confirm.openedAtChapter === state.chapterIndex ? confirm : null;

  useEffect(() => {
    if (!activeConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirm(null);
    };
    const onDown = (e: PointerEvent) => {
      if (chipRef.current && e.target instanceof Node && !chipRef.current.contains(e.target)) {
        setConfirm(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [activeConfirm]);

  const askJump = (node: TimelineNodeDef) => {
    const idx = CHAPTER_ORDER.indexOf(node.chapterId);
    if (idx < 0) return;
    setConfirm({
      year: node.year,
      title: CHAPTER_META[idx]?.title ?? "",
      chapterIndex: idx,
      leftPct: pctOf(node.year),
      openedAtChapter: state.chapterIndex,
    });
  };

  const doJump = () => {
    if (!activeConfirm) return;
    dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: activeConfirm.chapterIndex });
    setConfirm(null);
  };

  const statusOf = (node: TimelineNodeDef): "passed" | "current" | "future" => {
    const idx = CHAPTER_ORDER.indexOf(node.chapterId);
    if (idx < state.chapterIndex) return "passed";
    if (idx === state.chapterIndex) return "current";
    return "future";
  };

  return (
    <nav
      aria-label="Tour timeline"
      data-testid="timeline-spine"
      className="exh-paper fixed inset-x-0 bottom-0 z-40 h-11 border-t border-exh-ink/15 md:h-16"
      style={{ backgroundColor: "var(--color-exh-linen-deep)" }}
    >
      {/* inner rail, clamped 24px from each edge */}
      <div className="absolute inset-y-0 left-6 right-6">
        {/* base rule */}
        <div className="absolute left-0 right-0 top-[21px] h-0.5 bg-exh-ink/20 md:top-6" />

        {/* the 1921 to 1968 span, the years the machinery ran at full power */}
        <motion.div
          data-testid="spine-red-span"
          aria-hidden="true"
          initial={false}
          animate={{ scaleX: redRevealed ? 1 : 0 }}
          transition={{ duration: instant || redFired ? 0 : motionMs(400) / 1000, ease: "easeOut" }}
          style={{
            originX: 0,
            left: `${pctOf(TIMELINE.redSpan.start)}%`,
            width: `${pctOf(TIMELINE.redSpan.end) - pctOf(TIMELINE.redSpan.start)}%`,
          }}
          className="absolute top-[19px] h-1.5 rounded-full bg-exh-red/80 md:top-[21px] md:h-2"
        />

        {/* progress fill, written straight to the ref by the playhead bus */}
        <div
          ref={fillRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-[20.5px] h-[3px] origin-left bg-exh-ink will-change-transform md:top-6 md:h-0.5"
          style={{ transform: "scaleX(0)" }}
        />

        {/* nodes */}
        {TIMELINE.nodes.map((node) => {
          const status = statusOf(node);
          const idx = CHAPTER_ORDER.indexOf(node.chapterId);
          const chTitle = CHAPTER_META[idx]?.title ?? "";
          return (
            <span key={node.id}>
              {/* mobile, decorative dot */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-[19.5px] h-[5px] w-[5px] -translate-x-1/2 rounded-full border md:hidden",
                  status === "passed" && "border-exh-ink bg-exh-ink",
                  status === "current" && "border-exh-ink bg-exh-gold",
                  status === "future" && "border-exh-ink/50 bg-exh-linen"
                )}
                style={{ left: `${pctOf(node.year)}%` }}
              />
              {/* desktop, tappable node */}
              <button
                type="button"
                data-testid={`spine-node-${node.year}`}
                aria-label={`Jump to ${node.year}, ${chTitle}`}
                aria-current={status === "current" ? "step" : undefined}
                onClick={() => askJump(node)}
                className="absolute top-0 hidden h-full w-6 -translate-x-1/2 md:block"
                style={{ left: `${pctOf(node.year)}%` }}
              >
                {/* dot centered on the rail line at 25px */}
                <span className="absolute left-1/2 top-[25px] inline-flex h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                  {status === "current" && (
                    <span
                      aria-hidden="true"
                      className="exh-lamp-armed absolute -inset-1.5 rounded-full border-2 border-exh-gold"
                    />
                  )}
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full border",
                      status === "passed" && "border-exh-ink bg-exh-ink",
                      status === "current" && "border-exh-ink bg-exh-gold",
                      status === "future" && "border-exh-ink/60 bg-exh-linen"
                    )}
                  />
                </span>
              </button>
              {/* desktop year label, thinned to avoid collisions */}
              {LABELED_YEARS.has(node.year) && (
                <span
                  aria-hidden="true"
                  className="exh-mono absolute top-9 hidden -translate-x-1/2 text-[10px] text-exh-ink-soft md:block"
                  style={{ left: `${pctOf(node.year)}%` }}
                >
                  {node.year}
                </span>
              )}
            </span>
          );
        })}

        {/* jump confirmation chip, anchored above the asked node */}
        {activeConfirm && (
          <div
            ref={chipRef}
            className="absolute bottom-full z-50 mb-2 -translate-x-1/2"
            style={{ left: `clamp(150px, ${activeConfirm.leftPct}%, calc(100% - 150px))` }}
          >
            <PaperCard tone="deep" className="w-max max-w-72 px-3 py-2">
              <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
                Jump to <span className="exh-mono">{activeConfirm.year}</span>, {activeConfirm.title}?
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={doJump}
                  className="exh-plat min-h-12 flex-1 rounded-sm bg-exh-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-linen"
                >
                  Jump
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  className="exh-plat min-h-12 flex-1 rounded-sm border border-exh-ink/40 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink"
                >
                  Stay
                </button>
              </div>
            </PaperCard>
          </div>
        )}
      </div>

      {/* mobile era chip opens the chapter sheet */}
      <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            data-testid="spine-era-chip"
            aria-label="Choose a chapter"
            className="absolute right-1.5 top-1/2 flex min-h-10 -translate-y-1/2 items-center gap-1.5 rounded-sm border border-exh-ink/20 bg-exh-linen px-2.5 shadow-[0_1px_3px_rgba(28,26,23,0.12)] after:absolute after:-inset-1 after:content-[''] md:hidden"
          >
            <span className="exh-mono text-[10px] text-exh-ink">{meta?.era}</span>
            <span aria-hidden="true" className="text-[8px] text-exh-ink-soft">
              ▲
            </span>
          </button>
        </Dialog.Trigger>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-exh-ink/40" />
        <Dialog.Content
          aria-describedby={undefined}
          data-testid="spine-chapter-sheet"
          className="exh-paper fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-md border-t border-exh-ink/20 shadow-[0_-4px_16px_rgba(28,26,23,0.2)]"
        >
          <div className="flex items-center justify-between border-b border-exh-ink/15 py-1 pl-4 pr-1">
            <Dialog.Title className="exh-plat text-xs font-semibold uppercase tracking-[0.18em] text-exh-ink">
              Chapters
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex h-12 w-12 items-center justify-center text-lg text-exh-ink"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>
          <ul className="overflow-y-auto p-2">
            {CHAPTER_META.map((ch) => (
              <li key={ch.id}>
                <button
                  type="button"
                  aria-current={ch.index === state.chapterIndex ? "step" : undefined}
                  onClick={() => {
                    dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: ch.index });
                    setSheetOpen(false);
                  }}
                  className={cn(
                    "flex h-12 w-full items-center justify-between gap-3 border-l-2 px-3 text-left",
                    ch.index === state.chapterIndex
                      ? "border-exh-gold bg-exh-linen-deep"
                      : "border-transparent"
                  )}
                >
                  <span className="exh-plat truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
                    {ch.title}
                  </span>
                  <span className="exh-mono shrink-0 text-[10px] text-exh-ink-soft">{ch.era}</span>
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Root>
    </nav>
  );
}

export default TimelineSpine;
