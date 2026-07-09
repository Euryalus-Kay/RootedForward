"use client";
/* ------------------------------------------------------------------ */
/*  The Gap, at Scale, CH11 pause point 1. The 2022 Survey of          */
/*  Consumer Finances medians drawn at true proportion. The Black-     */
/*  median column fits comfortably on one screen; the white-median     */
/*  column is drawn at the exact published ratio (about 6.35 times     */
/*  taller), so the only way to reach its top is to scroll the full    */
/*  height of the gap inside this station's own scroll region. The     */
/*  scroll is the interaction. On the way up, quiet mile-markers       */
/*  pass: the Black median itself at its true height, then the three   */
/*  mechanism decades as evenly spaced scale markers, labeled as       */
/*  markers, never amounts. No parallax, no easing, no reward at the   */
/*  top beyond the number itself.                                      */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { getFact, hasFact } from "@/lib/exhibit/facts";
import { useInteractive } from "../InteractiveContext";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import PaperCard from "../../shared/PaperCard";

const WHITE_FACT = "present.scf_white_285000";
const BLACK_FACT = "present.scf_black_44900";
const GAP_FACT = "present.gap_6to1";

/* layout, px unless noted */
const BLACK_BAR_VIEW_FRACTION = 0.52; /* H as a share of the visible region */
const CAP_PX = 172; /* zone above the white column's top */
const BASE_PX = 88; /* baseline zone under both columns */
const COMPLETE_AT = 0.9; /* completion at 90 percent of the climb */
const KEY_LINE = 64;
const PAGE_FRACTION = 0.8;
const INTERACT_EVERY_MS = 250;

/* column centers, percent of the region width; side by side on every
   viewport, thinner bars on small screens via the width classes */
const BLACK_X = "28%";
const WHITE_X = "62%";

/* The three mechanism markers, evenly spaced above the Black-median
   rule. Their positions are decorative, spacing only; each dagger
   cites the mechanism's documentation, never a dollar height. */
const MECHANISM_MARKERS = [
  { key: "covenants", label: "the covenant decades", factId: "covenants.coverage_claim" },
  { key: "redlining", label: "the redlined decades", factId: "redlining.black_loans_under_2pct" },
  { key: "contracts", label: "the contract decades", factId: "contracts.extraction_3_4b" },
] as const;

const MARKER_LABEL_CLASS =
  "exh-plat pl-7 text-left text-[11px] md:text-[10px] uppercase leading-snug tracking-[0.18em] text-exh-ink-soft sm:pl-11";

export default function GapAtScale() {
  const api = useInteractive();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);
  const initRef = useRef(false);
  const lastInteractRef = useRef(0);
  const progressRef = useRef(0);

  const [viewH, setViewH] = useState(0);

  /* the two medians come from the registry, values and display alike */
  const whiteFact = hasFact(WHITE_FACT) ? getFact(WHITE_FACT) : null;
  const blackFact = hasFact(BLACK_FACT) ? getFact(BLACK_FACT) : null;
  const ratio =
    typeof whiteFact?.value === "number" &&
    typeof blackFact?.value === "number" &&
    blackFact.value > 0
      ? whiteFact.value / blackFact.value
      : null;

  const blackH = ratio && viewH ? Math.round(viewH * BLACK_BAR_VIEW_FRACTION) : 0;
  const whiteH = blackH && ratio ? Math.round(blackH * ratio) : 0;
  const innerH = whiteH ? CAP_PX + whiteH + BASE_PX : 0;

  /* measure the visible region so the Black column fits comfortably */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* open at the base of both columns; the climb starts at the ground */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || initRef.current || !innerH) return;
    if (el.scrollHeight <= el.clientHeight) return;
    initRef.current = true;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [innerH]);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    rootRef.current?.setAttribute("data-complete", "true");
    api.onComplete();
  }, [api]);

  const readProgress = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - el.scrollTop / max));
  }, []);

  /* the scroll is the interaction; progress rides a data attribute so
     no scroll tick ever re-renders React */
  const onScroll = useCallback(() => {
    const p = readProgress();
    progressRef.current = p;
    rootRef.current?.setAttribute("data-progress", String(Math.round(p * 100)));
    const now = performance.now();
    if (now - lastInteractRef.current > INTERACT_EVERY_MS) {
      lastInteractRef.current = now;
      api.onInteraction();
    }
    if (initRef.current && api.active && p >= COMPLETE_AT) complete();
  }, [api, complete, readProgress]);

  /* a visitor who climbed before the tour halted here still gets credit */
  useEffect(() => {
    if (api.active && initRef.current && progressRef.current >= COMPLETE_AT) complete();
  }, [api.active, complete]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;
      /* reduced motion means plain jumps, no eased glide */
      const behavior: ScrollBehavior = api.reducedMotion ? "auto" : "smooth";
      if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        api.onInteraction();
        el.scrollTo({ top: e.key === "Home" ? 0 : el.scrollHeight, behavior });
        return;
      }
      let delta: number | null = null;
      if (e.key === "ArrowUp") delta = -KEY_LINE;
      else if (e.key === "ArrowDown") delta = KEY_LINE;
      else if (e.key === "PageUp") delta = -Math.round(el.clientHeight * PAGE_FRACTION);
      else if (e.key === "PageDown") delta = Math.round(el.clientHeight * PAGE_FRACTION);
      if (delta == null) return;
      e.preventDefault();
      api.onInteraction();
      el.scrollBy({ top: delta, behavior });
    },
    [api]
  );

  /* mile-markers at true bottom offsets inside the tall region */
  const markers = useMemo(() => {
    if (!blackH || !whiteH) return [];
    const step = (whiteH - blackH) / 4;
    return [
      {
        key: "black-median",
        label: "the median Black family's total",
        factId: BLACK_FACT,
        bottom: BASE_PX + blackH,
      },
      ...MECHANISM_MARKERS.map((m, i) => ({ ...m, bottom: BASE_PX + blackH + step * (i + 1) })),
    ];
  }, [blackH, whiteH]);

  /* resilient path: a registry gap must never dead-end the tour */
  if (!ratio) {
    return (
      <button
        type="button"
        onClick={() => {
          api.onInteraction();
          complete();
        }}
        aria-label="Continue the tour"
        className="block w-full"
        data-testid="gap-at-scale"
        data-progress="0"
      >
        <div className="border border-exh-ink/25 bg-exh-linen-deep/40 px-6 py-12 text-center">
          <p className="exh-plat text-xs uppercase tracking-[0.25em] text-exh-ink/70">
            The figures are being prepared
          </p>
          <p className="exh-plat mt-3 text-[11px] md:text-[10px] uppercase tracking-[0.2em] text-exh-ink/70">
            Tap to continue
          </p>
        </div>
      </button>
    );
  }

  return (
    <div ref={rootRef} data-testid="gap-at-scale" data-progress="0" className="w-full">
      <p className="exh-plat text-[11px] uppercase tracking-[0.22em] text-exh-ink-soft">
        Scroll to raise the white column, or focus it and use the arrow keys
      </p>

      <div
        ref={scrollRef}
        role="region"
        tabIndex={0}
        aria-label="The wealth gap at true scale. Scroll, or use the arrow and page keys, to climb from the base of both columns to the top of the white column."
        data-testid="gap-scroll"
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="mt-2 h-[70vh] min-h-[420px] w-full overflow-y-auto overflow-x-hidden overscroll-y-contain border border-exh-ink/25 bg-exh-linen-deep/30"
      >
        {innerH > 0 && (
          <div className="relative w-full" style={{ height: innerH }}>
            {/* the top of the climb */}
            <div className="absolute inset-x-0 top-0 px-4 pt-5 text-center" style={{ height: CAP_PX }}>
              <p className="font-display text-xl leading-snug text-exh-ink md:text-2xl">
                A gap of more than six to one.
              </p>
              <div className="mt-1.5 flex justify-center">
                <FactValue id={GAP_FACT} size="sm" />
              </div>
            </div>

            {/* mile-marker rules pass behind the columns on the way up */}
            {markers.map((m) => (
              <div key={m.key}>
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-exh-ink/20"
                  style={{ bottom: m.bottom }}
                />
                {/* div, not p: SourceSup's popover is a <div> and React
                    flags div-inside-p as a hydration risk (A4 P2) */}
                <div
                  className={`absolute right-2 ${MARKER_LABEL_CLASS}`}
                  style={{ left: WHITE_X, bottom: m.bottom + 4 }}
                >
                  {m.label}
                  <SourceSup factId={m.factId} />
                </div>
              </div>
            ))}

            {/* the two columns, bases on the same ground line */}
            <div
              aria-hidden="true"
              data-testid="gap-bar-black"
              className="absolute w-10 -translate-x-1/2 bg-exh-ink sm:w-16"
              style={{ left: BLACK_X, bottom: BASE_PX, height: blackH }}
            />
            <div
              aria-hidden="true"
              data-testid="gap-bar-white"
              className="absolute w-10 -translate-x-1/2 border border-exh-ink/40 bg-white/85 sm:w-16"
              style={{ left: WHITE_X, bottom: BASE_PX, height: whiteH }}
            />

            {/* registry chips at each column's top */}
            <PaperCard
              className="absolute w-max max-w-[44%] -translate-x-1/2 px-2.5 py-1.5 text-center"
              style={{ left: BLACK_X, bottom: BASE_PX + blackH + 10 }}
            >
              <FactValue id={BLACK_FACT} size="sm" />
            </PaperCard>
            <PaperCard
              className="absolute w-max max-w-[44%] -translate-x-1/2 px-2.5 py-1.5 text-center"
              style={{ left: WHITE_X, bottom: BASE_PX + whiteH + 10 }}
            >
              <FactValue id={WHITE_FACT} size="sm" />
            </PaperCard>

            {/* the ground line both columns stand on. Each caption is
                capped to its own column's share of the width (the two
                centers sit 34% apart, so 30% boxes can never touch) and
                wraps, so the tracked uppercase strings cannot run
                together on narrow viewports. */}
            <div className="absolute inset-x-0 bottom-0 border-t border-exh-ink/40" style={{ height: BASE_PX }}>
              <p
                className="exh-plat absolute top-2 w-max max-w-[30%] -translate-x-1/2 text-center text-[11px] md:text-[10px] uppercase leading-snug tracking-[0.18em] text-exh-ink-soft sm:max-w-[40%]"
                style={{ left: BLACK_X }}
              >
                the median Black family
              </p>
              <p
                className="exh-plat absolute top-2 w-max max-w-[30%] -translate-x-1/2 text-center text-[11px] md:text-[10px] uppercase leading-snug tracking-[0.18em] text-exh-ink-soft sm:max-w-[40%]"
                style={{ left: WHITE_X }}
              >
                the median white family
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="exh-plat mt-2 text-[11px] md:text-[10px] leading-snug text-exh-ink/70">
        Both columns are drawn to the same scale from the 2022 Survey of Consumer Finances
        medians. The horizontal lines along the climb mark scale, not amounts.
      </p>
    </div>
  );
}
