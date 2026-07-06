"use client";
/* ------------------------------------------------------------------ */
/*  The Machinery of Exclusion, the CH3 pause point. Three document    */
/*  cards on a desk, one per documented tactic of the 1908-09 Hyde     */
/*  Park Improvement Protective Club. Honesty rule, enforced in the    */
/*  layout: these are plain-language SUMMARIES of tactics documented   */
/*  in period press and histories, labeled as such on the desk, with   */
/*  no fake period typography pretending to be scans. Each card flips  */
/*  on tap or Enter (rotateY, instant under reduced motion); the       */
/*  buyout card carries the fannie-barrier-williams voice medallion.   */
/*  Beneath the desk, the 1917 Urban League counter beat runs 664      */
/*  applicants against the fifty houses the canvass found.             */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { getFact } from "@/lib/exhibit/facts";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import VoiceCard from "../../shared/VoiceCard";

const DESK_LABEL = "The club's methods, as documented in 1908 and 1909 press and histories";
const DESK_PROMPT = "Three tactics on the desk. Turn each card over.";
const NOTE_SUMMARIES = "Plain-language summaries, not facsimiles.";
const COUNTER_EYEBROW = "Summer 1917, one day at the Chicago Urban League";
const CLOSING_LINE = "Chicago did more than practice exclusion. It refined the method.";
const URBAN_LEAGUE_FACT = "colorline.urban_league_664_50";

interface CardDef {
  id: string;
  eyebrow: string;
  title: string;
  back: string;
  factId: string;
  voiceId?: string;
}

const CARDS: CardDef[] = [
  {
    id: "pledge",
    eyebrow: "Document one",
    title: "The pledge",
    back: "Members pledged to fire Black workers and boycott agents who sold or rented to Black families.",
    factId: "colorline.club_founded",
  },
  {
    id: "boycott",
    eyebrow: "Document two",
    title: "The boycott",
    back: "Any realtor who broke the line faced the club's organized boycott.",
    factId: "colorline.club_founded",
  },
  {
    id: "buyout",
    eyebrow: "Document three",
    title: "The buyout",
    back: "The club raised funds to buy out Black homeowners who refused to leave. Fannie Barrier Williams refused.",
    factId: "colorline.club_founded",
    voiceId: "fannie-barrier-williams",
  },
];

/* ---------------- one flipping document card ---------------- */

function FlipCard({
  card,
  index,
  reducedMotion,
  onFirstFlip,
  onTap,
  children,
}: {
  card: CardDef;
  index: number;
  reducedMotion: boolean;
  onFirstFlip: () => void;
  onTap: () => void;
  children?: ReactNode;
}) {
  const [up, setUp] = useState(false); // up = summary side showing
  const flippedOnce = useRef(false);
  const frontBtn = useRef<HTMLButtonElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);

  const flip = (to: boolean) => {
    onTap();
    setUp(to);
    if (to && !flippedOnce.current) {
      flippedOnce.current = true;
      onFirstFlip();
    }
    requestAnimationFrame(() => {
      (to ? backBtn : frontBtn).current?.focus();
    });
  };

  return (
    <div style={{ perspective: "1200px" }} data-card-id={card.id} data-flipped={up || undefined}>
      <div
        className="grid [transform-style:preserve-3d]"
        style={{
          transform: up ? "rotateY(180deg)" : "none",
          transition: reducedMotion ? "none" : `transform ${motionMs(300)}ms ease-in-out`,
        }}
      >
        {/* front, the engraved title */}
        <div className="col-start-1 row-start-1 [backface-visibility:hidden]" inert={up}>
          <button
            ref={frontBtn}
            type="button"
            data-testid={`machinery-card-front-${index}`}
            onClick={() => flip(true)}
            aria-label={`${card.title}. Turn the card to read the summary.`}
            className="exh-paper block h-full w-full cursor-pointer rounded-sm border-2 border-exh-ink/70 bg-exh-linen p-1.5 text-center shadow-[0_1px_3px_rgba(28,26,23,0.12)]"
          >
            <span className="flex h-full min-h-44 flex-col items-center justify-center gap-3 border border-exh-ink/40 px-3 py-6">
              <span className="exh-plat text-[9px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
                {card.eyebrow}
              </span>
              <span className="font-display text-2xl leading-tight text-exh-ink">{card.title}</span>
              <span className="exh-plat mt-1 text-[9px] uppercase tracking-[0.2em] text-exh-ink-soft">
                Tap to turn
              </span>
            </span>
          </button>
        </div>

        {/* back, the plain-language summary */}
        <div
          className="col-start-1 row-start-1 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          inert={!up}
        >
          <PaperCard tone="deep" className="flex h-full min-h-44 flex-col p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="exh-plat text-[9px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                In plain language
              </span>
              <button
                ref={backBtn}
                type="button"
                onClick={() => flip(false)}
                aria-label={`Turn ${card.title} card back over`}
                className="exh-plat min-h-12 cursor-pointer border border-exh-ink/35 px-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-exh-ink hover:border-exh-ink"
              >
                Turn back
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-exh-ink">
              {card.back}
              <SourceSup factId={card.factId} />
            </p>
            {children}
          </PaperCard>
        </div>
      </div>
    </div>
  );
}

/* ---------------- the interactive ---------------- */

export default function MachineryCards() {
  const api = useInteractive();

  const [flippedCount, setFlippedCount] = useState(0);
  const [applicants, setApplicants] = useState(0);

  const doneRef = useRef(false);

  const urbanLeague = getFact(URBAN_LEAGUE_FACT);
  const target = typeof urbanLeague.value === "number" ? urbanLeague.value : 0;

  const onFirstFlip = useCallback(() => setFlippedCount((c) => c + 1), []);

  // all three cards read once ends the beat
  useEffect(() => {
    if (flippedCount < CARDS.length || doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [flippedCount, api]);

  // the 1917 counter runs when the station goes live. Restart-safe (no
  // once-guard) so StrictMode's dev remount and reduced-motion flips both
  // land on the full figure; under reduced motion the duration collapses
  // so the first frame reads 664.
  useEffect(() => {
    if (!api.active) return;
    const dur = api.reducedMotion ? 1 : Math.max(1, motionMs(1200));
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setApplicants(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [api.active, api.reducedMotion, target]);

  return (
    <div className="w-full" onPointerDownCapture={api.onInteraction}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          {DESK_PROMPT}
        </p>
        <p
          data-testid="machinery-cards-flipped"
          data-count={flippedCount}
          className="exh-mono text-[11px] text-exh-ink/70"
        >
          {flippedCount} of {CARDS.length} read
        </p>
      </div>

      {/* the desk */}
      <PaperCard tone="deep" className="p-4 sm:p-5">
        <p className="exh-plat text-center text-[10px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-exh-ink">
          {DESK_LABEL}
        </p>
        <p className="exh-plat mt-1 text-center text-[9px] uppercase tracking-[0.18em] text-exh-ink-soft">
          {NOTE_SUMMARIES}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARDS.map((card, i) => (
            <FlipCard
              key={card.id}
              card={card}
              index={i}
              reducedMotion={api.reducedMotion}
              onFirstFlip={onFirstFlip}
              onTap={api.onInteraction}
            >
              {card.voiceId ? (
                <div className="mt-3 flex justify-center">
                  <VoiceCard personId={card.voiceId} size="sm" />
                </div>
              ) : null}
            </FlipCard>
          ))}
        </div>
      </PaperCard>

      {/* the 1917 counter beat */}
      <PaperCard className="mt-4 p-4">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          {COUNTER_EYEBROW}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-10 gap-y-3">
          <div>
            <p
              data-testid="urban-league-count"
              data-count={applicants}
              className="exh-mono text-3xl leading-none text-exh-ink"
            >
              {applicants.toLocaleString("en-US")}
            </p>
            <p className="exh-plat mt-1.5 text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
              applicants for houses in one day
            </p>
          </div>
          <div>
            <p className="exh-mono text-3xl leading-none text-exh-ink">
              50
              <SourceSup factId={URBAN_LEAGUE_FACT} />
            </p>
            <p className="exh-plat mt-1.5 text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
              houses available
            </p>
          </div>
        </div>
        <div className="mt-3">
          <FactValue id={URBAN_LEAGUE_FACT} />
        </div>
        <p className="exh-serif mt-3 text-base leading-snug text-exh-ink sm:text-lg">{CLOSING_LINE}</p>
      </PaperCard>
    </div>
  );
}
