"use client";
/* ------------------------------------------------------------------ */
/*  TimelineSpine, the one persistent orientation element. A bottom    */
/*  rail from 1832 to 2026: one node per chapter, positioned by its    */
/*  spine year, each a plain scroll-to-chapter anchor. The 1921 to     */
/*  1968 red span renders statically with a small printed label. The   */
/*  active chapter derives from scroll position (ExhibitApp's          */
/*  IntersectionObserver writes it into state). Narrow viewports get   */
/*  a compact rail (tapping it, or the era chip, opens the chapter     */
/*  sheet); both list About and sources at the end.                    */
/* ------------------------------------------------------------------ */
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import timelineJson from "../../../../data/exhibit/timeline.json";
import { CHAPTER_ORDER, type ChapterId } from "@/lib/exhibit/types";
import { CHAPTER_META, displayEraOf, displayTitleOf, EXHIBIT_FLOW } from "@/lib/exhibit/content";
import { scrollToAnchor, useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { cn } from "@/lib/utils";

const TIMELINE = timelineJson as unknown as {
  spanStart: number;
  spanEnd: number;
  redSpan: { start: number; end: number; note: string };
};

const pctOf = (year: number) =>
  ((year - TIMELINE.spanStart) / (TIMELINE.spanEnd - TIMELINE.spanStart)) * 100;

/* Rail nodes: one per chapter in reading order, skipping the overture
   (its 1832 anchor would sit on top of ch1's). */
const RAIL_CHAPTERS: ChapterId[] = EXHIBIT_FLOW.filter((id) => id !== "ch0_5");

const spineYearOf = (id: ChapterId) => CHAPTER_META[CHAPTER_ORDER.indexOf(id)].spineYear;

/* Node dots keep a minimum horizontal separation; the mid-century
   cluster (1948 to 1958) otherwise stacks its dots and hit areas.
   Positions nudge rightward the same way the year labels thin out. */
const MIN_NODE_GAP_PCT = 2.4;
const NODE_PCT: Record<string, number> = (() => {
  const entries = RAIL_CHAPTERS.map((id) => ({ id, pct: pctOf(spineYearOf(id)) })).sort(
    (a, b) => a.pct - b.pct
  );
  let last = -Infinity;
  for (const e of entries) {
    if (e.pct - last < MIN_NODE_GAP_PCT) e.pct = last + MIN_NODE_GAP_PCT;
    last = e.pct;
  }
  return Object.fromEntries(entries.map((e) => [e.id, Math.min(e.pct, 100)]));
})();

/* Year labels thin themselves out so clustered labels never collide. */
const LABELED_YEARS = (() => {
  const out = new Set<number>();
  const years = RAIL_CHAPTERS.map((id) => ({
    year: spineYearOf(id),
    pct: NODE_PCT[id],
  })).sort((a, b) => a.pct - b.pct);
  let last = -Infinity;
  for (const y of years) {
    if (y.pct - last >= 4.2) {
      out.add(y.year);
      last = y.pct;
    }
  }
  return out;
})();

export function TimelineSpine() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeId = CHAPTER_ORDER[state.chapterIndex];
  const behavior: ScrollBehavior = state.reducedMotion ? "auto" : "smooth";

  /* the overture (ch0_5) has no node of its own; the nearest node by
     spine year stays marked so the rail never goes blank */
  const railActiveId = useMemo(() => {
    if (RAIL_CHAPTERS.includes(activeId)) return activeId;
    const year = spineYearOf(activeId);
    let best = RAIL_CHAPTERS[0];
    let bestDist = Infinity;
    for (const id of RAIL_CHAPTERS) {
      const d = Math.abs(spineYearOf(id) - year);
      if (d < bestDist) {
        bestDist = d;
        best = id;
      }
    }
    return best;
  }, [activeId]);

  const go = (chapterId: string) => {
    const idx = CHAPTER_ORDER.indexOf(chapterId as (typeof CHAPTER_ORDER)[number]);
    if (idx >= 0) dispatch({ type: "SET_CHAPTER", chapterIndex: idx });
    scrollToAnchor(chapterId, behavior);
  };

  return (
    <nav
      aria-label="Exhibit timeline"
      data-testid="timeline-spine"
      className="exh-paper fixed inset-x-0 bottom-0 z-40 border-t border-exh-ink/15 pb-[env(safe-area-inset-bottom)]"
      style={{ backgroundColor: "var(--color-exh-linen-deep)" }}
    >
      <div className="relative h-11 md:h-16">
        {/* inner rail, clamped from each edge; room on the right for the
            About link (desktop) and the era chip (mobile) */}
        <div className="absolute inset-y-0 left-6 right-24 md:right-48">
          {/* base rule */}
          <div className="absolute left-0 right-0 top-[21px] h-0.5 bg-exh-ink/20 md:top-6" />

          {/* the 1921 to 1968 span, static, with its printed label */}
          <div
            data-testid="spine-red-span"
            aria-hidden="true"
            style={{
              left: `${pctOf(TIMELINE.redSpan.start)}%`,
              width: `${pctOf(TIMELINE.redSpan.end) - pctOf(TIMELINE.redSpan.start)}%`,
            }}
            className="absolute top-[19px] h-1.5 rounded-full bg-exh-red/80 md:top-[21px] md:h-2"
          />
          <span
            aria-hidden="true"
            data-testid="spine-red-label"
            style={{
              left: `${(pctOf(TIMELINE.redSpan.start) + pctOf(TIMELINE.redSpan.end)) / 2}%`,
            }}
            className="exh-plat absolute top-0.5 hidden -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-[0.16em] text-exh-red/90 md:block"
          >
            1921 to 1968, the machinery at full power
          </span>

          {/* nodes: the dots always render; below md the individual
              24px hit areas are sub-target-size, so the buttons are
              desktop-only and the whole rail opens the chapter sheet */}
          {RAIL_CHAPTERS.map((id) => {
            const meta = CHAPTER_META[CHAPTER_ORDER.indexOf(id)];
            const current = id === railActiveId;
            const title = displayTitleOf(id);
            const leftPct = NODE_PCT[id];
            return (
              <span key={id}>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-[21px] inline-flex h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center md:top-[25px]"
                  style={{ left: `${leftPct}%` }}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full border md:h-2.5 md:w-2.5",
                      current
                        ? "border-exh-ink bg-exh-gold"
                        : "border-exh-ink/60 bg-exh-linen"
                    )}
                  />
                </span>
                <button
                  type="button"
                  data-testid={`spine-node-${meta.spineYear}`}
                  aria-label={`Go to ${title}, ${meta.spineYear}`}
                  aria-current={current ? "true" : undefined}
                  onClick={() => go(id)}
                  className="absolute top-0 hidden h-full w-6 -translate-x-1/2 md:block"
                  style={{ left: `${leftPct}%` }}
                />
                {LABELED_YEARS.has(meta.spineYear) && (
                  <span
                    aria-hidden="true"
                    className="exh-mono absolute top-9 hidden -translate-x-1/2 text-[10px] text-exh-ink-soft md:block"
                    style={{ left: `${leftPct}%` }}
                  >
                    {meta.spineYear}
                  </span>
                )}
              </span>
            );
          })}

          {/* below md the rail itself is one full-size target that
              opens the chapter sheet */}
          <button
            type="button"
            data-testid="spine-rail-open"
            aria-label="Open the chapter list"
            onClick={() => setSheetOpen(true)}
            className="absolute inset-0 md:hidden"
          />
        </div>

        {/* About anchor, desktop */}
        <button
          type="button"
          data-testid="spine-about"
          onClick={() => scrollToAnchor("about", behavior)}
          className="exh-plat absolute right-3 top-1/2 hidden min-h-10 -translate-y-1/2 items-center text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft transition-colors hover:text-exh-ink md:flex"
        >
          About &amp; sources
        </button>

        {/* mobile era chip opens the chapter sheet */}
        <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              data-testid="spine-era-chip"
              aria-label="Choose a chapter"
              className="absolute right-1.5 top-1/2 flex min-h-10 -translate-y-1/2 items-center gap-1.5 rounded-sm border border-exh-ink/20 bg-exh-linen px-2.5 shadow-[0_1px_3px_rgba(28,26,23,0.12)] after:absolute after:-inset-1 after:content-[''] md:hidden"
            >
              <span className="exh-mono text-[11px] text-exh-ink">{displayEraOf(activeId)}</span>
              <span aria-hidden="true" className="text-[8px] text-exh-ink-soft">
                &#9650;
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
                  &#10005;
                </button>
              </Dialog.Close>
            </div>
            <ul className="overflow-y-auto p-2">
              {EXHIBIT_FLOW.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={id === activeId ? "true" : undefined}
                    onClick={() => {
                      go(id);
                      setSheetOpen(false);
                    }}
                    className={cn(
                      "flex h-12 w-full items-center justify-between gap-3 border-l-2 px-3 text-left",
                      id === activeId ? "border-exh-gold bg-exh-linen-deep" : "border-transparent"
                    )}
                  >
                    <span className="exh-plat truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
                      {displayTitleOf(id)}
                    </span>
                    <span className="exh-mono shrink-0 text-[11px] text-exh-ink-soft">
                      {displayEraOf(id)}
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    scrollToAnchor("about", behavior);
                    setSheetOpen(false);
                  }}
                  className="exh-plat flex h-12 w-full items-center border-l-2 border-transparent px-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft"
                >
                  About &amp; sources
                </button>
              </li>
            </ul>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </nav>
  );
}

export default TimelineSpine;
