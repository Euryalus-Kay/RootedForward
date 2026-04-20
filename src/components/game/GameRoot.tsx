"use client";

import { useReducer, useState, useMemo, useCallback } from "react";
import { reducer, freshState } from "@/lib/game/state";
import { CARD_BY_ID } from "@/lib/game/cards";
import ParcelGrid, { ParcelLegend, ParcelTooltip } from "./ParcelGrid";
import { ResourceHUD, ScoreBar } from "./ResourceHUD";
import { PolicyCard } from "./PolicyCard";
import { EventModal } from "./EventModal";
import { EndScreen } from "./EndScreen";
import { IntroScreen } from "./IntroScreen";
import { Tutorial } from "./Tutorial";
import { Toasts } from "./Toasts";
import { Leaderboard } from "./Leaderboard";
import type { Parcel } from "@/lib/game/types";

const ERAS = [
  { fromYear: 1940, toYear: 1955, name: "Lines on a Map" },
  { fromYear: 1956, toYear: 1975, name: "Contracts and Covenants" },
  { fromYear: 1976, toYear: 2000, name: "Towers and Renewal" },
  { fromYear: 2001, toYear: 2040, name: "Modern Toolkit" },
];

function eraName(year: number): string {
  for (const e of ERAS) if (year >= e.fromYear && year <= e.toYear) return e.name;
  return "Modern Toolkit";
}

export default function GameRoot() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const [hovered, setHovered] = useState<Parcel | null>(null);

  const handleStart = useCallback(
    (displayName: string, seed?: string) => {
      dispatch({ type: "START_GAME", displayName, seed });
    },
    []
  );
  const handleTutorial = useCallback(() => dispatch({ type: "START_TUTORIAL" }), []);
  const handleAdvanceTutorial = useCallback(() => dispatch({ type: "ADVANCE_TUTORIAL" }), []);
  const handleSkipTutorial = useCallback(() => dispatch({ type: "SKIP_TUTORIAL" }), []);
  const handlePlayCard = useCallback((cardId: string) => dispatch({ type: "PLAY_CARD", cardId }), []);
  const handleDiscardCard = useCallback((cardId: string) => dispatch({ type: "DISCARD_CARD", cardId }), []);
  const handleSelectCard = useCallback((cardId: string | null) => dispatch({ type: "SELECT_CARD", cardId }), []);
  const handleEndYear = useCallback(() => dispatch({ type: "END_YEAR" }), []);
  const handleResolveEvent = useCallback((idx: number) => dispatch({ type: "RESOLVE_EVENT", optionIndex: idx }), []);
  const handleReadNote = useCallback((term: string) => dispatch({ type: "READ_NOTE", term }), []);
  const handleDismissToast = useCallback((id: string) => dispatch({ type: "DISMISS_TOAST", id }), []);
  const handleReturnMenu = useCallback(() => dispatch({ type: "RETURN_TO_MENU" }), []);
  const handleViewLeaderboard = useCallback(() => dispatch({ type: "VIEW_LEADERBOARD" }), []);

  const era = eraName(state.year);

  // ============================================================
  // Phase: menu / intro
  // ============================================================
  if (state.phase === "menu") {
    return (
      <IntroScreen
        onStart={handleStart}
        onTutorial={handleTutorial}
        onLeaderboard={handleViewLeaderboard}
      />
    );
  }

  // ============================================================
  // Phase: tutorial
  // ============================================================
  if (state.phase === "tutorial") {
    return (
      <Tutorial
        step={state.tutorialStep}
        onAdvance={() => {
          if (state.tutorialStep >= 7) {
            // last step, transition to playing - need name though
            const name = prompt("Pick a display name for the leaderboard:") || "Anonymous";
            handleStart(name);
          } else {
            handleAdvanceTutorial();
          }
        }}
        onSkip={handleSkipTutorial}
      />
    );
  }

  // ============================================================
  // Phase: leaderboard (from main menu)
  // ============================================================
  if (state.phase === "leaderboard") {
    return <Leaderboard onClose={handleReturnMenu} />;
  }

  // ============================================================
  // Phase: ended
  // ============================================================
  if (state.phase === "ended") {
    return (
      <EndScreen
        state={state}
        onReplay={handleReturnMenu}
        onLeaderboard={handleViewLeaderboard}
        onMenu={handleReturnMenu}
      />
    );
  }

  // ============================================================
  // Phase: intro (already-started, first display)
  // ============================================================
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          1940 &middot; Parkhaven
        </p>
        <h2 className="mt-4 font-display text-5xl text-forest md:text-7xl">
          You inherit the ward.
        </h2>
        <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          The Depression is just ending. Federal mortgage policy is being
          rewritten. The first wave of the Great Migration is arriving.
          You are the new alderman, the new planner, the new neighborhood
          association president, the new landlord, depending on which year
          you stand in.
        </p>
        <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/65">
          You have a starting hand of five cards and a hundred years to
          play them.
        </p>
        <button
          onClick={() => dispatch({ type: "ADVANCE_TUTORIAL" })}
          className="mt-10 inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          Step into 1940
        </button>
      </div>
    );
  }

  // ============================================================
  // Phase: playing or event
  // ============================================================
  return (
    <div className="bg-cream pb-20 pt-6 md:pt-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Top HUD */}
        <ResourceHUD resources={state.resources} year={state.year} era={era} />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: parcel grid + score bar + tooltip */}
          <aside className="lg:col-span-5">
            <div className="rounded-sm border border-border bg-cream p-3 shadow-sm md:p-4">
              <ParcelGrid parcels={state.parcels} onHover={setHovered} />
            </div>
            <div className="mt-3">
              <ParcelLegend />
            </div>
            <div className="mt-4">
              <ScoreBar scores={state.scores} />
            </div>
            {hovered && (
              <div className="mt-4">
                <ParcelTooltip parcel={hovered} />
              </div>
            )}
          </aside>

          {/* Right: card hand + actions */}
          <main className="lg:col-span-7">
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  Your hand
                </p>
                <h3 className="mt-1 font-display text-2xl text-forest md:text-3xl">
                  {state.hand.length} card{state.hand.length === 1 ? "" : "s"}
                </h3>
              </div>
              <button
                onClick={handleEndYear}
                className="inline-flex items-center justify-center rounded-sm bg-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light"
              >
                End year &rarr;
              </button>
            </div>

            <p className="mt-3 max-w-[55ch] font-body text-sm text-ink/65">
              Click a card to read it. Click again to play. You can play as
              many cards as you can afford each year.
            </p>

            {/* Hand */}
            <div className="mt-6 flex flex-wrap gap-3">
              {state.hand.length === 0 ? (
                <p className="font-body text-sm italic text-warm-gray">
                  No cards in hand. End the year to draw new ones.
                </p>
              ) : (
                state.hand.map((cardId) => {
                  const card = CARD_BY_ID.get(cardId);
                  if (!card) return null;
                  return (
                    <PolicyCard
                      key={cardId}
                      card={card}
                      resources={state.resources}
                      selected={state.selectedCard === cardId}
                      onClick={() => handleSelectCard(state.selectedCard === cardId ? null : cardId)}
                      onPlay={() => handlePlayCard(cardId)}
                      onDiscard={() => handleDiscardCard(cardId)}
                    />
                  );
                })
              )}
            </div>

            {/* Recent activity */}
            {(state.playedCards.length > 0 || state.resolvedEvents.length > 0) && (
              <div className="mt-10 border-t border-border pt-6">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Recent activity
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    ...state.playedCards.slice(-3).reverse().map((p) => ({
                      year: p.year,
                      text: `played ${CARD_BY_ID.get(p.cardId)?.name ?? p.cardId}`,
                    })),
                    ...state.resolvedEvents.slice(-3).reverse().map((e) => ({
                      year: e.year,
                      text: e.outcome,
                    })),
                  ]
                    .sort((a, b) => b.year - a.year)
                    .slice(0, 5)
                    .map((entry, i) => (
                      <li key={i} className="border-l-2 border-rust/40 pl-4 font-body text-sm text-ink/65">
                        <span className="font-semibold text-forest">{entry.year}</span> &middot; you {entry.text}.
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Event modal */}
      {state.phase === "event" && state.currentEvent && (
        <EventModal
          event={state.currentEvent}
          onChoose={handleResolveEvent}
          onReadNote={handleReadNote}
        />
      )}

      {/* Toasts */}
      <Toasts messages={state.messages} onDismiss={handleDismissToast} />
    </div>
  );
}
