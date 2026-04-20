"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CHAPTERS,
  ARCHETYPES,
  TOTAL_PARCELS,
  GRID_COLS,
  chooseArchetype,
  type ParcelState,
  type ScoreKey,
  type Option,
} from "@/lib/game-data";

/* ------------------------------------------------------------------ */
/*  Parcel grid                                                        */
/* ------------------------------------------------------------------ */

const STATE_COLOR: Record<ParcelState, string> = {
  untouched: "bg-cream-dark",
  "graded-a": "bg-[#4F8A4A]",
  "graded-b": "bg-[#4A79A8]",
  "graded-c": "bg-[#D4A83A]",
  "graded-d": "bg-[#B8373A]",
  demolished: "bg-ink/40",
  expressway: "bg-ink",
  tower: "bg-warm-gray",
  rehab: "bg-forest",
  displaced: "bg-rust/30",
  preserved: "bg-forest-light",
  "tif-funded": "bg-rust",
};

const STATE_LABEL: Record<ParcelState, string> = {
  untouched: "Untouched parcel",
  "graded-a": "HOLC grade A — Best",
  "graded-b": "HOLC grade B — Still desirable",
  "graded-c": "HOLC grade C — Definitely declining",
  "graded-d": "HOLC grade D — Hazardous (red)",
  demolished: "Demolished",
  expressway: "Expressway corridor",
  tower: "Public-housing tower",
  rehab: "Rehabilitated tower",
  displaced: "Residents displaced",
  preserved: "Preserved through community land trust",
  "tif-funded": "TIF-funded development",
};

function ParcelGrid({ parcels }: { parcels: ParcelState[] }) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
      role="img"
      aria-label="Parkhaven parcel grid"
    >
      {parcels.map((state, i) => (
        <div
          key={i}
          className={`aspect-square rounded-[2px] transition-colors duration-500 ${STATE_COLOR[state]}`}
          title={STATE_LABEL[state]}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Game state                                                         */
/* ------------------------------------------------------------------ */

type Phase = "intro" | "playing" | "transition" | "end";

interface PastDecision {
  chapter: string;
  year: string;
  prompt: string;
  chose: string;
  immediate: string;
  delayed: string;
  source: string;
}

interface GameState {
  phase: Phase;
  chapterIdx: number;
  decisionIdx: number;
  scores: Record<ScoreKey, number>;
  parcels: ParcelState[];
  log: PastDecision[];
  /** consequence card showing after a choice */
  pendingChoice: {
    option: Option;
    chapterTitle: string;
    year: string;
    prompt: string;
  } | null;
}

const INITIAL_STATE: GameState = {
  phase: "intro",
  chapterIdx: 0,
  decisionIdx: 0,
  scores: { displacement: 0, extraction: 0, memory: 0, capital: 0, equity: 0 },
  parcels: Array(TOTAL_PARCELS).fill("untouched") as ParcelState[],
  log: [],
  pendingChoice: null,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BuildTheBlock() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const currentChapter = CHAPTERS[state.chapterIdx];
  const currentDecision = currentChapter?.decisions[state.decisionIdx];

  const start = useCallback(() => {
    setState((s) => ({ ...s, phase: "playing" }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const chooseOption = useCallback(
    (opt: Option) => {
      if (!currentChapter || !currentDecision) return;

      // Apply score deltas
      const nextScores = { ...state.scores };
      const keys: ScoreKey[] = ["displacement", "extraction", "memory", "capital", "equity"];
      for (const k of keys) {
        if (typeof opt.effect[k] === "number") nextScores[k] += opt.effect[k]!;
      }

      // Apply parcel changes
      const nextParcels = [...state.parcels];
      if (opt.effect.parcels) {
        for (const change of opt.effect.parcels) {
          for (const id of change.ids) {
            if (id >= 0 && id < TOTAL_PARCELS) nextParcels[id] = change.state;
          }
        }
      }

      // Add to log
      const logEntry: PastDecision = {
        chapter: currentChapter.title,
        year: currentDecision.year,
        prompt: currentDecision.prompt,
        chose: opt.chose,
        immediate: opt.immediate,
        delayed: opt.delayed,
        source: opt.source,
      };

      setState({
        ...state,
        scores: nextScores,
        parcels: nextParcels,
        log: [...state.log, logEntry],
        pendingChoice: {
          option: opt,
          chapterTitle: currentChapter.title,
          year: currentDecision.year,
          prompt: currentDecision.prompt,
        },
      });
    },
    [state, currentChapter, currentDecision]
  );

  const advance = useCallback(() => {
    setState((s) => {
      if (!s.pendingChoice) return s;
      const chap = CHAPTERS[s.chapterIdx];
      const isLastDecisionInChapter = s.decisionIdx >= chap.decisions.length - 1;
      const isLastChapter = s.chapterIdx >= CHAPTERS.length - 1;

      if (isLastDecisionInChapter && isLastChapter) {
        return { ...s, phase: "end", pendingChoice: null };
      }
      if (isLastDecisionInChapter) {
        return {
          ...s,
          phase: "transition",
          chapterIdx: s.chapterIdx + 1,
          decisionIdx: 0,
          pendingChoice: null,
        };
      }
      return {
        ...s,
        decisionIdx: s.decisionIdx + 1,
        pendingChoice: null,
      };
    });
  }, []);

  const continueToNextChapter = useCallback(() => {
    setState((s) => ({ ...s, phase: "playing" }));
  }, []);

  /* ---------- Intro screen ---------- */
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          A Rooted Forward Game
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[0.95] text-forest md:text-7xl">
          Build the Block
        </h1>
        <p className="mt-8 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          You inherit a fictional Chicago ward in 1940. Over the next twenty
          minutes you make twelve decisions that real Chicago wards faced
          across a century &mdash; about redlining, about contract sellers,
          about the expressway, about the towers, about TIF and the Red
          Line. Every option is drawn from the historical record.
        </p>
        <p className="mt-6 max-w-[55ch] font-body text-base leading-relaxed text-ink/60">
          There is no score. There is no winning. There is a 2040
          neighborhood at the end, and it is the one your decisions built.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            onClick={start}
            className="inline-flex items-center justify-center rounded-sm bg-rust px-10 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Begin in 1940
          </button>
          <span className="font-body text-sm text-warm-gray">
            ~20 minutes &middot; replayable &middot; nothing saves
          </span>
        </div>

        <div className="mt-16 border-t border-border pt-8">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Content notice
          </p>
          <p className="mt-3 max-w-[60ch] font-body text-sm leading-relaxed text-ink/65">
            The game depicts racial segregation, displacement, and policy
            violence. Quotations are taken from the historical record,
            including 1940 HOLC surveyor language. You can pause at any
            time.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Chapter transition ---------- */
  if (state.phase === "transition") {
    const chap = CHAPTERS[state.chapterIdx];
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Chapter {chap.n} &middot; {chap.period}
        </p>
        <h2 className="mt-5 font-display text-4xl leading-tight text-forest md:text-6xl">
          {chap.title}
        </h2>
        <p className="mt-8 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          {chap.summary}
        </p>
        <button
          onClick={continueToNextChapter}
          className="mt-10 inline-flex items-center rounded-sm bg-rust px-10 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          Continue
        </button>
      </div>
    );
  }

  /* ---------- End screen ---------- */
  if (state.phase === "end") {
    return <EndScreen state={state} onReplay={reset} />;
  }

  /* ---------- Playing ---------- */
  if (!currentChapter || !currentDecision) return null;

  const totalDecisions = CHAPTERS.reduce((acc, c) => acc + c.decisions.length, 0);
  const completed = CHAPTERS.slice(0, state.chapterIdx).reduce(
    (acc, c) => acc + c.decisions.length,
    0
  ) + state.decisionIdx;

  return (
    <div className="bg-cream py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Top bar */}
        <div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              Chapter {currentChapter.n} &middot; {currentChapter.period}
            </p>
            <h2 className="mt-1 font-display text-2xl text-forest md:text-3xl">
              {currentChapter.title}
            </h2>
          </div>
          <div className="font-body text-sm text-warm-gray">
            Decision {completed + 1} of {totalDecisions}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full bg-rust transition-all duration-500"
            style={{ width: `${((completed + 1) / totalDecisions) * 100}%` }}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left: parcel grid */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24">
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Parkhaven &middot; the ward
              </p>
              <div className="rounded-sm border border-border bg-cream p-4 md:p-6">
                <ParcelGrid parcels={state.parcels} />
                <p className="mt-4 font-body text-xs leading-relaxed text-ink/55">
                  70 parcels. North at top, lake at right. Colors change as
                  decisions land.
                </p>
              </div>
            </div>
          </aside>

          {/* Right: decision card or consequence */}
          <div className="lg:col-span-7">
            {state.pendingChoice ? (
              <ConsequenceCard pending={state.pendingChoice} onAdvance={advance} />
            ) : (
              <DecisionCard
                year={currentDecision.year}
                prompt={currentDecision.prompt}
                context={currentDecision.context}
                options={currentDecision.options}
                onChoose={chooseOption}
              />
            )}

            {/* Run log */}
            {state.log.length > 0 && !state.pendingChoice && (
              <div className="mt-12 border-t border-border pt-8">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  What you have done so far
                </p>
                <ul className="mt-4 space-y-3">
                  {state.log.slice().reverse().map((d, i) => (
                    <li key={i} className="border-l-2 border-rust/40 pl-4 font-body text-sm text-ink/70">
                      <span className="font-semibold text-forest">
                        {d.year}
                      </span>{" "}
                      &mdash; you {d.chose}.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decision card                                                      */
/* ------------------------------------------------------------------ */

function DecisionCard({
  year,
  prompt,
  context,
  options,
  onChoose,
}: {
  year: string;
  prompt: string;
  context: string;
  options: Option[];
  onChoose: (o: Option) => void;
}) {
  return (
    <article>
      <p className="font-display text-5xl text-rust md:text-6xl">{year}</p>
      <h3 className="mt-3 font-display text-2xl leading-snug text-forest md:text-4xl md:leading-tight">
        {prompt}
      </h3>
      <p className="mt-5 max-w-[58ch] font-body text-base leading-relaxed text-ink/70 md:text-lg md:leading-relaxed">
        {context}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {options.map((o, i) => (
          <button
            key={i}
            onClick={() => onChoose(o)}
            className="group flex items-center gap-4 rounded-sm border border-border bg-cream p-5 text-left transition-all hover:border-rust hover:bg-cream-dark md:p-6"
          >
            <span className="flex-shrink-0 font-display text-xl text-warm-gray group-hover:text-rust">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="font-body text-base text-forest md:text-lg">
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Consequence card                                                   */
/* ------------------------------------------------------------------ */

function ConsequenceCard({
  pending,
  onAdvance,
}: {
  pending: NonNullable<GameState["pendingChoice"]>;
  onAdvance: () => void;
}) {
  return (
    <article>
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
        {pending.year} &middot; you chose
      </p>
      <h3 className="mt-3 font-display text-2xl leading-snug text-forest md:text-3xl">
        You {pending.option.chose}.
      </h3>

      <div className="mt-8 space-y-6">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Immediately
          </p>
          <p className="mt-2 max-w-[58ch] font-body text-base leading-relaxed text-ink/75 md:text-lg md:leading-relaxed">
            {pending.option.immediate}
          </p>
        </div>

        <div className="border-l-4 border-rust pl-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Years later
          </p>
          <p className="mt-2 max-w-[55ch] font-display text-lg leading-snug text-forest md:text-xl">
            {pending.option.delayed}
          </p>
        </div>

        <p className="font-body text-xs italic text-warm-gray">
          Source: {pending.option.source}
        </p>
      </div>

      <button
        onClick={onAdvance}
        className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
      >
        Continue &rarr;
      </button>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  End screen — the Parkhaven Record, 2040                            */
/* ------------------------------------------------------------------ */

function EndScreen({ state, onReplay }: { state: GameState; onReplay: () => void }) {
  const archetypeKey = useMemo(() => chooseArchetype(state.scores), [state.scores]);
  const archetype = ARCHETYPES[archetypeKey];

  // Compass — normalize each axis to -1..+1 for visual placement
  const norm = (v: number, max = 12) => Math.max(-1, Math.min(1, v / max));
  const axes = [
    { label: "Displacement", value: norm(state.scores.displacement) },
    { label: "Extraction", value: norm(state.scores.extraction) },
    { label: "Memory", value: norm(state.scores.memory) },
    { label: "Equity", value: norm(state.scores.equity) },
  ];

  return (
    <div className="bg-cream py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          The Parkhaven Record &middot; 2040
        </p>
        <h2 className="mt-5 font-display text-4xl leading-tight text-forest md:text-6xl">
          {archetype.name}
        </h2>
        <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          {archetype.blurb}
        </p>

        {/* The resident voice */}
        <div className="mt-12 border-l-4 border-rust pl-8 md:pl-12">
          <p className="font-display text-2xl leading-snug text-forest md:text-3xl md:leading-snug">
            &ldquo;{archetype.resident}&rdquo;
          </p>
          <p className="mt-6 font-body text-sm uppercase tracking-[0.2em] text-warm-gray">
            &mdash; A Parkhaven resident, in your run
          </p>
        </div>

        {/* Compass */}
        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              How your run plotted
            </p>
            <div className="mt-6 space-y-4">
              {axes.map((a) => (
                <div key={a.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-body text-forest">{a.label}</span>
                    <span className="font-body text-xs text-warm-gray">
                      {a.value > 0 ? "+" : ""}
                      {(a.value * 100).toFixed(0)}
                    </span>
                  </div>
                  <div className="relative mt-1 h-2 rounded-full bg-cream-dark">
                    <div
                      className="absolute top-0 h-full rounded-full bg-rust"
                      style={{
                        left: a.value >= 0 ? "50%" : `${50 + a.value * 50}%`,
                        width: `${Math.abs(a.value) * 50}%`,
                      }}
                    />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-warm-gray-light" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 font-body text-xs text-warm-gray">
              Four hidden axes the game tracked while you played. None of
              them is a score. They tell you which direction the system
              moved under your hands.
            </p>
          </div>

          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Parkhaven, 2040
            </p>
            <div className="mt-6 rounded-sm border border-border bg-cream p-4">
              <ParcelGrid parcels={state.parcels} />
            </div>
          </div>
        </div>

        {/* Run log */}
        <div className="mt-16 border-t border-border pt-10">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            What you did
          </p>
          <ul className="mt-6 space-y-5">
            {state.log.map((d, i) => (
              <li key={i} className="border-l-2 border-rust/40 pl-5">
                <p className="font-body text-sm text-warm-gray">
                  {d.year} &middot; {d.chapter}
                </p>
                <p className="mt-1 font-body text-base text-forest">
                  You {d.chose}.
                </p>
                <p className="mt-2 max-w-[60ch] font-body text-sm leading-relaxed text-ink/65">
                  {d.delayed}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Replay */}
        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-10 sm:flex-row sm:items-center">
          <button
            onClick={onReplay}
            className="inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Play again
          </button>
          <a
            href="/curriculum"
            className="font-body text-sm font-semibold uppercase tracking-widest text-forest underline underline-offset-4 hover:text-rust"
          >
            Use this in a classroom &rarr;
          </a>
        </div>

        <p className="mt-12 max-w-[60ch] font-body text-sm italic leading-relaxed text-warm-gray">
          &ldquo;In 2040, someone else inherits what you built.&rdquo;
        </p>
      </div>
    </div>
  );
}
