"use client";

import { useReducer, useState, useCallback, useEffect, useRef } from "react";
import { reducer, freshState, YEAR_STEP } from "@/lib/game/state";
import { CARD_BY_ID } from "@/lib/game/cards";
import { EVENT_BY_ID } from "@/lib/game/events";
import { previewTargets } from "@/lib/game/parcels";
import { ROLES, type RoleKey } from "@/lib/game/roles";
import { OBJECTIVES_BY_ID } from "@/lib/game/objectives";
import { saveToLocal, loadFromLocal, clearSave } from "@/lib/game/save";
import ParcelGrid, { ParcelLegend, ParcelTooltip } from "./ParcelGrid";
import { ResourceHUD, ScoreBar } from "./ResourceHUD";
import { PolicyCard } from "./PolicyCard";
import { EventModal } from "./EventModal";
import { EndScreen } from "./EndScreen";
import { IntroScreen } from "./IntroScreen";
import { Toasts } from "./Toasts";
import { Leaderboard } from "./Leaderboard";
import { ContextPanel } from "./ContextPanel";
import { PauseMenu } from "./PauseMenu";
import { HowToPlay } from "./HowToPlay";
import type { Parcel } from "@/lib/game/types";

const HOW_TO_PLAY_SEEN_KEY = "buildTheBlock:htpSeen:v1";

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

const lookupEvent = (id: string) => EVENT_BY_ID.get(id);

export default function GameRoot() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const [hovered, setHovered] = useState<Parcel | null>(null);
  const [paused, setPaused] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const lastSavedAt = useRef<number>(0);

  /* ------------- first-time auto-open how-to-play ------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.phase !== "playing") return;
    try {
      const seen = window.localStorage.getItem(HOW_TO_PLAY_SEEN_KEY);
      if (!seen) {
        setHowToPlayOpen(true);
        window.localStorage.setItem(HOW_TO_PLAY_SEEN_KEY, "1");
      }
    } catch {
      // ignore
    }
  }, [state.phase]);

  /* ------------- autosave ------------- */
  useEffect(() => {
    if (state.phase === "menu" || state.phase === "ended" || state.phase === "leaderboard") return;
    // Debounce: save at most once every 300ms
    const now = Date.now();
    if (now - lastSavedAt.current < 300) return;
    lastSavedAt.current = now;
    saveToLocal(state);
  }, [state]);

  /* ------------- keyboard shortcut for pause ------------- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && (state.phase === "playing" || state.phase === "event")) {
        setPaused((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase]);

  /* ------------- action creators ------------- */
  const handleStart = useCallback(
    (cfg: { displayName: string; seed?: string; roleKey?: string; objectives?: string[] }) => {
      dispatch({ type: "START_GAME", ...cfg });
    },
    []
  );
  const handleContinue = useCallback(() => {
    const restored = loadFromLocal(lookupEvent);
    if (restored) dispatch({ type: "RESTORE_STATE", state: restored });
  }, []);
  const handleTutorial = useCallback(() => setHowToPlayOpen(true), []);
  const handlePlayCard = useCallback((cardId: string) => dispatch({ type: "PLAY_CARD", cardId }), []);
  const handleDiscardCard = useCallback((cardId: string) => dispatch({ type: "DISCARD_CARD", cardId }), []);
  const handleSelectCard = useCallback((cardId: string | null) => dispatch({ type: "SELECT_CARD", cardId }), []);
  const handleEndYear = useCallback(() => dispatch({ type: "END_YEAR" }), []);
  const handleResolveEvent = useCallback((idx: number) => dispatch({ type: "RESOLVE_EVENT", optionIndex: idx }), []);
  const handleReadNote = useCallback((term: string) => dispatch({ type: "READ_NOTE", term }), []);
  const handleDismissToast = useCallback((id: string) => dispatch({ type: "DISMISS_TOAST", id }), []);
  const handleReturnMenu = useCallback(() => { clearSave(); dispatch({ type: "RETURN_TO_MENU" }); setPaused(false); }, []);
  const handleRestart = useCallback(() => { clearSave(); dispatch({ type: "RESTART_GAME" }); setPaused(false); }, []);
  const handleViewLeaderboard = useCallback(() => dispatch({ type: "VIEW_LEADERBOARD" }), []);

  const era = eraName(state.year);
  const role = ROLES[state.roleKey as RoleKey] ?? ROLES.alderman;

  /* ------------- preview targets for the selected card ------------- */
  const selectedCard = state.selectedCard ? CARD_BY_ID.get(state.selectedCard) : undefined;
  const previewTargetIds = selectedCard
    ? previewTargets(state.parcels, selectedCard.effect.transformParcels, state.seed + ":card:" + state.playedCards.length)
    : [];

  /* ========================================================== */
  /*  Phase: menu                                                */
  /* ========================================================== */
  if (state.phase === "menu") {
    return (
      <>
        <IntroScreen
          onStart={handleStart}
          onContinue={handleContinue}
          onTutorial={handleTutorial}
          onLeaderboard={handleViewLeaderboard}
        />
        {howToPlayOpen && <HowToPlay onClose={() => setHowToPlayOpen(false)} />}
      </>
    );
  }

  /* ========================================================== */
  /*  Phase: leaderboard (from menu)                             */
  /* ========================================================== */
  if (state.phase === "leaderboard") {
    return <Leaderboard onClose={handleReturnMenu} />;
  }

  /* ========================================================== */
  /*  Phase: ended                                               */
  /* ========================================================== */
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

  /* ========================================================== */
  /*  Phase: intro (first playing view)                          */
  /* ========================================================== */
  if (state.phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          1940 &middot; Parkhaven &middot; Playing as {role.name}
        </p>
        <h2 className="mt-4 font-display text-5xl text-forest md:text-7xl">You inherit the ward.</h2>
        <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          The Depression is ending. Federal mortgage policy is being
          rewritten. The first wave of the Great Migration is arriving.
          You hold a starting hand of {state.hand.length} cards.
        </p>

        {state.objectives.length > 0 && (
          <div className="mt-8 rounded-sm border border-rust/30 bg-rust/5 p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              Your goals
            </p>
            <ul className="mt-3 space-y-2 font-body text-sm text-ink/75">
              {state.objectives.map((id) => {
                const o = OBJECTIVES_BY_ID.get(id);
                if (!o) return null;
                return (
                  <li key={id}>
                    <span className="font-semibold text-forest">{o.name}</span>{" "}
                    <span className="text-ink/55">&middot; {o.description}</span>{" "}
                    <span className="text-rust">+{o.reward} bonus</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          onClick={() => dispatch({ type: "ADVANCE_TUTORIAL" })}
          className="mt-10 inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          Step into 1940
        </button>
      </div>
    );
  }

  /* ========================================================== */
  /*  Phase: playing or event                                    */
  /* ========================================================== */
  return (
    <div className="bg-cream pb-20 pt-6 md:pt-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Top HUD */}
        <div className="flex flex-col gap-3">
          <ResourceHUD resources={state.resources} year={state.year} era={era} />
          <div className="flex items-center justify-between">
            <p className="font-body text-xs text-warm-gray">
              Playing as <span className="font-semibold text-forest">{role.name}</span>
              {" · "}
              <span className="text-forest">{state.displayName}</span>
              {" · "}
              Seed <span className="text-forest">{state.seed}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHowToPlayOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-cream font-display text-sm font-bold text-forest transition-colors hover:bg-cream-dark"
                aria-label="How to play"
                title="How to play"
              >
                ?
              </button>
              <button
                onClick={() => setPaused(true)}
                className="rounded-sm border border-border bg-cream px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest hover:bg-cream-dark"
              >
                Pause &middot; Esc
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left column: ward + context + score bar */}
          <aside className="lg:col-span-5">
            <div className="rounded-md border border-border bg-gradient-to-br from-cream via-cream to-cream-dark/40 p-3 shadow-sm md:p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Parkhaven &middot; {state.parcels.reduce((s, p) => s + p.residents, 0).toLocaleString()} residents
                </p>
                <button
                  onClick={() => setHowToPlayOpen(true)}
                  className="font-body text-[10px] font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
                >
                  What am I looking at?
                </button>
              </div>

              {/* Card preview banner */}
              {selectedCard && previewTargetIds.length > 0 && (
                <div className="mb-2 rounded-sm bg-rust/15 px-3 py-2 font-body text-xs text-rust-dark animate-pulse">
                  <span className="font-semibold">{selectedCard.name}</span> would affect{" "}
                  <span className="font-semibold">{previewTargetIds.length}</span>{" "}
                  parcel{previewTargetIds.length === 1 ? "" : "s"} (highlighted in green ring).
                </div>
              )}
              {selectedCard && previewTargetIds.length === 0 && (
                <div className="mb-2 rounded-sm bg-cream-dark/60 px-3 py-2 font-body text-xs text-ink/70">
                  <span className="font-semibold text-forest">{selectedCard.name}</span>{" "}
                  affects scores and resources. No specific parcel changes.
                </div>
              )}

              {/* Grid with vertical district labels on the left */}
              <div className="flex gap-2">
                <div className="relative flex w-12 flex-col items-end font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
                  {/* North = top 2 of 7 rows */}
                  <span className="absolute left-0 right-2 text-right" style={{ top: "calc(2 / 7 * 50%)" }}>North</span>
                  <span className="absolute left-0 right-2 text-right" style={{ top: "calc(50% - 6px)" }}>Central</span>
                  <span className="absolute left-0 right-2 text-right" style={{ bottom: "calc(2 / 7 * 50%)" }}>South</span>
                  {/* Vertical line to make it feel like a y-axis */}
                  <span className="absolute right-0 top-2 bottom-2 w-px bg-border" />
                </div>
                <div className="flex-1">
                  <ParcelGrid parcels={state.parcels} onHover={setHovered} highlight={previewTargetIds} />
                </div>
              </div>

              {/* East/west hint: lake is right side */}
              <p className="mt-2 text-right font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
                Lake Michigan is to the east &rarr;
              </p>
            </div>
            <div className="mt-3">
              <ParcelLegend />
            </div>

            {/* Ward stats strip */}
            <WardStats parcels={state.parcels} />
            <div className="mt-4">
              <ContextPanel year={state.year} />
            </div>
            <div className="mt-4">
              <ScoreBar scores={state.scores} />
            </div>
            {state.objectives.length > 0 && (
              <ObjectivesHUD state={state} />
            )}
            {hovered && (
              <div className="mt-4">
                <ParcelTooltip parcel={hovered} />
              </div>
            )}
          </aside>

          {/* Right column: hand */}
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
                className="inline-flex flex-col items-center justify-center rounded-sm bg-forest px-6 py-2.5 font-body font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light"
              >
                <span className="text-sm">Advance {YEAR_STEP} years &rarr;</span>
                <span className="text-[9px] opacity-70">to {state.year + YEAR_STEP}</span>
              </button>
            </div>

            <p className="mt-3 max-w-[55ch] font-body text-sm text-ink/65">
              Click a card to read it. Click <span className="font-semibold text-forest">Play</span> when ready. You can play as
              many cards as you can afford each year. Confused?{" "}
              <button
                onClick={() => setHowToPlayOpen(true)}
                className="font-semibold text-rust underline underline-offset-2 hover:text-rust-dark"
              >
                Open the tutorial.
              </button>
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
                    ...state.playedCards.slice(-4).reverse().map((p) => ({
                      year: p.year,
                      text: `played ${CARD_BY_ID.get(p.cardId)?.name ?? p.cardId}`,
                    })),
                    ...state.resolvedEvents.slice(-4).reverse().map((e) => ({
                      year: e.year,
                      text: e.outcome,
                    })),
                  ]
                    .sort((a, b) => b.year - a.year)
                    .slice(0, 6)
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
      {state.phase === "event" && state.currentEvent && !paused && (
        <EventModal
          event={state.currentEvent}
          onChoose={handleResolveEvent}
          onReadNote={handleReadNote}
        />
      )}

      {/* Pause menu */}
      {paused && (
        <PauseMenu
          state={state}
          onResume={() => setPaused(false)}
          onRestart={handleRestart}
          onMenu={handleReturnMenu}
          onSave={() => { saveToLocal(state); setPaused(false); }}
        />
      )}

      {/* How-to-play modal */}
      {howToPlayOpen && <HowToPlay onClose={() => setHowToPlayOpen(false)} />}

      {/* Toasts */}
      <Toasts messages={state.messages} onDismiss={handleDismissToast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Objectives HUD (shows progress inline during the run)              */
/* ------------------------------------------------------------------ */

function WardStats({ parcels }: { parcels: import("@/lib/game/types").Parcel[] }) {
  const housing = parcels.filter((p) => ["single-family", "two-flat", "three-flat", "courtyard", "tower", "rehab-tower", "land-trust"].includes(p.type)).length;
  const civic = parcels.filter((p) => ["school", "church", "library", "clinic", "park", "community-garden", "mural"].includes(p.type)).length;
  const protectedCount = parcels.filter((p) => p.protected).length;
  const speculator = parcels.filter((p) => p.owner === "speculator").length;
  const vacant = parcels.filter((p) => p.type === "vacant").length;
  return (
    <div className="mt-3 grid grid-cols-5 gap-1 rounded-sm border border-border bg-cream p-3 font-body text-[11px] shadow-sm">
      <Stat label="Housing" value={housing} />
      <Stat label="Civic" value={civic} />
      <Stat label="Protected" value={protectedCount} highlight={protectedCount > 0} />
      <Stat label="Speculator" value={speculator} negative={speculator > 0} />
      <Stat label="Vacant" value={vacant} />
    </div>
  );
}

function Stat({ label, value, highlight, negative }: { label: string; value: number; highlight?: boolean; negative?: boolean }) {
  return (
    <div className="text-center">
      <p className={`font-display text-base font-bold leading-none ${highlight ? "text-forest" : negative ? "text-rust" : "text-ink/80"}`}>
        {value}
      </p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-warm-gray">{label}</p>
    </div>
  );
}

function ObjectivesHUD({ state }: { state: import("@/lib/game/types").GameState }) {
  return (
    <div className="mt-4 rounded-sm border border-border bg-cream p-4 shadow-sm">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
        Goals
      </p>
      <ul className="mt-3 space-y-2 font-body text-sm">
        {state.objectives.map((id) => {
          const o = OBJECTIVES_BY_ID.get(id);
          if (!o) return null;
          const done = o.test(state);
          return (
            <li key={id} className={done ? "text-forest" : "text-ink/70"}>
              <span className={`mr-2 inline-block h-3 w-3 rounded-sm ${done ? "bg-forest" : "bg-cream-dark border border-border"}`} />
              {o.name}
              <span className="ml-2 font-body text-xs text-warm-gray">+{o.reward}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
