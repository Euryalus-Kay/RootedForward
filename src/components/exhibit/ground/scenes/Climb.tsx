"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the True-Scale Climb. Both 2022 medians drawn on one        */
/*  scale, zero line shared at the top of the track; the Black median  */
/*  completes within about one viewport and the white median keeps     */
/*  the page going roughly six times as far. The scale ratio is        */
/*  computed from the fact registry values, never hardcoded. A skip    */
/*  link targets the receipt; a small fixed minimap shows both bars    */
/*  at fit scale with a you-are-here cursor driven by Intersection-    */
/*  Observer sentinels (discrete steps, no per-pixel handlers). The    */
/*  climb is literal page height, so reduced motion changes nothing.   */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SceneProps } from "./registry";
import { getFact } from "@/lib/exhibit/facts";
import { FactValue } from "../../shared/FactValue";
import { SourceSup, SourceSupGroup } from "../../shared/SourceSup";

const BLACK_ID = "present.scf_black_44900";
const WHITE_ID = "present.scf_white_285000";
const GAP_ID = "present.gap_6to1";
const OVERPAY_ID = "contracts.avg_overpayment_71000";
const CBL_ID = "cbl.savings";

/* dollar values straight from the registry; the pixel scale derives
   from these, so the drawing can never disagree with the citation */
const BLACK_USD = Number(getFact(BLACK_ID).value);
const WHITE_USD = Number(getFact(WHITE_ID).value);
const OVERPAY_USD = Number(getFact(OVERPAY_ID).value);
const CBL_USD = Number(getFact(CBL_ID).value);

/* the Black median occupies about one viewport of track */
const BLACK_VH = 82;
const TRACK_VH = (WHITE_USD / BLACK_USD) * BLACK_VH;
const pct = (usd: number) => `${(usd / WHITE_USD) * 100}%`;

/* waypoints where the white column passes whole multiples of the
   Black median, derived only from the two SCF values above; they
   give every viewport of the climb a hairline to stand on */
const MULTIPLE_WORD: Record<number, string> = {
  2: "twice the Black median",
  3: "three times the Black median",
  4: "four times the Black median",
  5: "five times the Black median",
  6: "six times, and still going",
};
const MULTIPLES = [2, 3, 4, 5, 6].filter((n) => n * BLACK_USD < WHITE_USD);

/* the white column's warm paper tone; the page's linen never reads
   as a blank gutter the way pure white did */
const PAPER_BAR: CSSProperties = { backgroundColor: "#F7F1E3" };

/* you-are-here resolution for the minimap, discrete steps only */
const SEGMENTS = 12;

const HAIRLINE = "absolute inset-x-0 border-t border-exh-ink/25";
const NOTE_TEXT = "text-[0.8rem] leading-snug text-exh-ink";

export default function Climb(_props: SceneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [seg, setSeg] = useState(0);
  const [inView, setInView] = useState(false);

  const activeSegs = useRef(new Set<number>());

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const sentinels = Array.from(track.querySelectorAll<HTMLElement>("[data-climb-sentinel]"));
    /* each sentinel is a full segment of the track, so the viewport's
       center band always holds at least one while the climb is on
       screen; the cursor steps discretely and the minimap hides
       itself once the summit frame takes over */
    const stepIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const n = Number((entry.target as HTMLElement).dataset.climbSentinel);
          if (Number.isNaN(n)) continue;
          if (entry.isIntersecting) activeSegs.current.add(n);
          else activeSegs.current.delete(n);
        }
        const live = activeSegs.current;
        setInView(live.size > 0);
        if (live.size > 0) setSeg(Math.max(...live) + 1);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sentinels.forEach((s) => stepIo.observe(s));
    return () => stepIo.disconnect();
  }, []);

  /* minimap geometry, fit scale */
  const MINI_H = 104;
  const miniBlack = (BLACK_USD / WHITE_USD) * MINI_H;
  const cursorFromBottom = Math.min(MINI_H, (seg / SEGMENTS) * MINI_H);

  return (
    <section data-testid="scene-climb" className="max-w-[34rem]">
      <header className="max-w-[30rem]">
        <h3 className="font-display text-xl leading-snug text-exh-ink">
          The two medians, drawn to one scale
        </h3>
        <div className="mt-3 text-[0.95rem] leading-relaxed text-exh-ink">
          From here the page itself is the measure. Both 2022 medians of
          family wealth nationwide run at one scale from the same zero line.
          The Black median completes in about one screen. The white median
          keeps the page going.
          <SourceSupGroup factIds={[BLACK_ID, WHITE_ID]} />
        </div>
        <a
          href="#a6-receipt"
          data-testid="climb-skip"
          onClick={(e) => {
            // the sticky Stage covers the top of the viewport, so a plain
            // anchor jump would land the receipt behind it; center it in
            // the readable band instead and hand focus over
            const target = document.getElementById("a6-receipt");
            if (!target) return;
            e.preventDefault();
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            target.scrollIntoView({ block: "center" });
          }}
          className="exh-plat mt-4 inline-flex min-h-11 items-center border border-exh-ink/40 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue"
        >
          Skip the climb
        </a>
      </header>

      {/* the track. Zero at the top; scrolling on is climbing the dollar axis. */}
      <div
        ref={trackRef}
        data-testid="climb-track"
        className="relative mt-8"
        style={{ height: `${TRACK_VH}vh` }}
      >
        {/* the shared zero line */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-exh-ink/50" />
        <p className="exh-plat absolute right-0 top-1.5 text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
          both start here, at zero
        </p>

        {/* the two columns, one pixel-per-dollar scale */}
        <div
          aria-hidden="true"
          data-testid="climb-bar-black"
          className="absolute left-[4%] top-0 w-[16%] bg-exh-ink"
          style={{ height: pct(BLACK_USD) }}
        />
        <div
          aria-hidden="true"
          data-testid="climb-bar-white"
          className="absolute left-[26%] top-0 h-full w-[16%] border border-exh-ink/60"
          style={PAPER_BAR}
        />

        {/* column names and figures at the zero line, so every
            mid-climb viewport identifies both bars */}
        {/* big number first; the two figures lead the chart at a step
            up from their plat-caps names */}
        <p className="exh-plat absolute left-[4%] top-1.5 w-[16%] text-center text-[10px] uppercase leading-tight tracking-[0.12em] text-exh-linen">
          Black median
          <span className="exh-mono mt-0.5 block text-sm font-semibold normal-case tracking-normal">$44,890</span>
        </p>
        <p className="exh-plat absolute left-[26%] top-1.5 w-[16%] text-center text-[10px] uppercase leading-tight tracking-[0.12em] text-exh-ink">
          white median
          <span className="exh-mono mt-0.5 block text-sm font-semibold normal-case tracking-normal">$285,010</span>
        </p>
        <span className="absolute left-[4%] top-14 w-[16%] text-center">
          <SourceSup factId={BLACK_ID} />
        </span>
        <span className="absolute left-[26%] top-14 w-[16%] text-center">
          <SourceSup factId={WHITE_ID} />
        </span>

        {/* the Black median's end, on the shared axis */}
        <div aria-hidden="true" className={HAIRLINE} style={{ top: pct(BLACK_USD) }} />
        <div className={`absolute left-[48%] right-[4.5rem] ${NOTE_TEXT}`} style={{ top: `calc(${pct(BLACK_USD)} + 6px)` }}>
          The Black median ends here.
          <span className="mt-1 block">
            <FactValue id={BLACK_ID} size="sm" />
          </span>
        </div>

        {/* the physical bracket, the cross-section's measured rule; it
            spans zero to three Black medians beside the rising column
            and lands on the existing waypoint that names it */}
        <div
          aria-hidden="true"
          data-testid="climb-bracket"
          className="absolute left-[43.5%] top-0 w-[1.75%] border-y border-r border-exh-ink/50"
          style={{ height: pct(3 * BLACK_USD) }}
        />

        {/* waypoints, whole multiples of the Black median */}
        {MULTIPLES.map((n) => (
          <div key={n}>
            <div aria-hidden="true" className={HAIRLINE} style={{ top: pct(n * BLACK_USD) }} />
            <p
              className="exh-plat absolute left-[48%] right-[4.5rem] text-[10px] uppercase tracking-[0.16em] text-exh-ink-soft"
              style={{ top: `calc(${pct(n * BLACK_USD)} + 6px)` }}
            >
              {MULTIPLE_WORD[n]}
            </p>
          </div>
        ))}

        {/* two ledger events, kept off this axis because their dollars
            are not 2022 dollars; no deflator exists in the record */}
        <aside
          data-testid="climb-off-axis"
          className={`absolute left-[48%] right-[4.5rem] border-l border-exh-ink/25 pl-3 ${NOTE_TEXT}`}
          style={{ top: "38%" }}
        >
          <p className="exh-plat text-[10px] uppercase tracking-[0.16em] text-exh-ink-soft">
            From the ledger, off this axis
          </p>
          <p className="mt-2">
            <span className="exh-mono whitespace-nowrap">$71,000</span>, 2019
            dollars. The average overcharge on one contract-sold house.
            <SourceSup factId={OVERPAY_ID} />
          </p>
          <p className="mt-2">
            About <span className="exh-mono whitespace-nowrap">$14,000</span>{" "}
            per renegotiated contract, dollars of their years.
            <SourceSup factId={CBL_ID} />
          </p>
        </aside>

        <div className={`absolute left-[48%] right-[4.5rem] ${NOTE_TEXT} text-exh-ink-soft`} style={{ top: "70%" }}>
          The white median keeps going.
        </div>

        {/* the white median's end, at the foot of the track */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-exh-ink/50" />
        <div className={`absolute bottom-2 left-[48%] right-[4.5rem] ${NOTE_TEXT}`}>
          The white median ends here.
          <span className="mt-1 block">
            <FactValue id={WHITE_ID} size="sm" />
          </span>
        </div>

        {/* IO segment sentinels, the minimap's discrete steps */}
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            data-climb-sentinel={i}
            aria-hidden="true"
            className="absolute left-0 w-px"
            style={{ top: `${(i / SEGMENTS) * 100}%`, height: `${100 / SEGMENTS}%` }}
          />
        ))}
      </div>

      {/* the summit frame, both complete bars in one view */}
      <div data-testid="climb-summit" className="mt-14">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Both columns, one frame
        </p>
        <p className="mt-1.5 text-sm leading-snug text-exh-ink-soft">
          Median family wealth nationwide, the 2022 survey.
        </p>
        <div className="relative mt-3 h-[42vh] min-h-[260px] border-b border-exh-ink/50">
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[8%] w-[18%] bg-exh-ink"
            style={{ height: pct(BLACK_USD) }}
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-[34%] h-full w-[18%] border border-exh-ink/60"
            style={PAPER_BAR}
          />
          <div className="absolute right-0 top-0 max-w-[38%] text-right">
            <FactValue id={WHITE_ID} size="sm" />
          </div>
          <div
            className="absolute right-0 max-w-[38%] text-right"
            style={{ bottom: pct(BLACK_USD) }}
          >
            <FactValue id={BLACK_ID} size="sm" />
          </div>
        </div>
        <div className="mt-3 font-display text-lg leading-snug text-exh-ink">
          <FactValue id={GAP_ID} size="lg" mono={false} />
        </div>
      </div>

      {/* fixed minimap while the track is in view; decorative, the
          figures themselves live in the annotations above */}
      {inView && (
        <div
          aria-hidden="true"
          data-testid="climb-minimap"
          className="fixed bottom-12 right-3 z-20 border border-exh-ink/30 bg-exh-linen-deep/95 px-2 pb-1.5 pt-2"
        >
          <div className="relative" style={{ height: MINI_H, width: 34 }}>
            <div
              className="absolute bottom-0 left-1 w-2.5 bg-exh-ink"
              style={{ height: miniBlack }}
            />
            <div
              className="absolute bottom-0 right-1 h-full w-2.5 border border-exh-ink/60"
              style={PAPER_BAR}
            />
            <div
              className="absolute inset-x-0 border-t-2"
              style={{ bottom: cursorFromBottom, borderTopColor: "var(--exh-rust, #A8502F)" }}
            />
          </div>
          <p className="exh-plat mt-1 text-center text-[8px] uppercase tracking-[0.14em] text-exh-ink-soft">
            you are here
          </p>
        </div>
      )}
    </section>
  );
}
