"use client";

import { useReducer, useState, useCallback, useEffect, useRef } from "react";
import { reducer, freshState, YEAR_STEP, computeDrift } from "@/lib/game/state";
import { CARD_BY_ID } from "@/lib/game/cards";
import { EVENT_BY_ID } from "@/lib/game/events";
import { previewTargets } from "@/lib/game/parcels";
import { computeLiveScore } from "@/lib/game/scoring";
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
import { PauseMenu } from "./PauseMenu";
import { TutorialCoach, TUTORIAL_STEP_COUNT, TUTORIAL_DONE_KEY } from "./TutorialCoach";
import { LastingEffectsStrip } from "./LastingEffects";
import { Codex } from "./Codex";
import { DecadeOverlay } from "./DecadeOverlay";
import { StatsDashboard } from "./StatsDashboard";
import { RunTimeline } from "./RunTimeline";
import { Almanac } from "./Almanac";
import type { Parcel, GameState } from "@/lib/game/types";

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

type SidePanel = "goals" | "score" | "effects" | "ward";
type Modal = null | "codex" | "stats" | "timeline" | "almanac";

export default function GameRoot() {
  const [state, dispatch] = useReducer(reducer, undefined, freshState);
  const [hovered, setHovered] = useState<Parcel | null>(null);
  const [paused, setPaused] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<number>(-1);
  const [modal, setModal] = useState<Modal>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [decadeOverlayOpen, setDecadeOverlayOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>("score");
  const rootRef = useRef<HTMLDivElement>(null);
  const lastSavedAt = useRef<number>(0);
  const lastDecadeShown = useRef<number>(0);
  const previousPhase = useRef(state.phase);

  /* ------------- keep the active game above the static page banner ------------- */
  useEffect(() => {
    if (
      state.phase === "playing" &&
      previousPhase.current !== "playing" &&
      previousPhase.current !== "event"
    ) {
      rootRef.current?.scrollIntoView({ block: "start" });
    }
    previousPhase.current = state.phase;
  }, [state.phase]);

  /* ------------- autosave ------------- */
  useEffect(() => {
    if (state.phase === "menu" || state.phase === "ended" || state.phase === "leaderboard") return;
    const now = Date.now();
    if (now - lastSavedAt.current < 300) return;
    lastSavedAt.current = now;
    saveToLocal(state);
  }, [state]);

  /* ------------- decade overlay trigger ------------- */
  useEffect(() => {
    if (state.phase !== "playing") return;
    const decade = Math.floor(state.year / 10) * 10;
    if (lastDecadeShown.current === 0) {
      lastDecadeShown.current = decade;
      return;
    }
    if (decade > lastDecadeShown.current) {
      lastDecadeShown.current = decade;
      const id = window.setTimeout(() => setDecadeOverlayOpen(true), 0);
      return () => window.clearTimeout(id);
    }
  }, [state.year, state.phase]);

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

  /* ------------- close more menu on outside click ------------- */
  useEffect(() => {
    if (!moreOpen) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-more-menu]")) setMoreOpen(false);
    }
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  /* ------------- auto-start tutorial on first run ------------- */
  useEffect(() => {
    if (state.phase !== "playing") return;
    if (tutorialStep !== -1) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(TUTORIAL_DONE_KEY)) return;
    if (state.year !== 1940) return;
    setTutorialStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  /* ------------- when tutorial enters step 3 (score-tab), force the
                   side panel to Score so the explanation matches what
                   the player sees inside the highlighted box. */
  useEffect(() => {
    if (tutorialStep === 2) setSidePanel("score");
  }, [tutorialStep]);

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
  const handleTutorial = useCallback(() => setTutorialStep(0), []);
  const handleTutorialNext = useCallback(() => {
    setTutorialStep((s) => {
      const next = s + 1;
      if (next >= TUTORIAL_STEP_COUNT) {
        if (typeof window !== "undefined") window.localStorage.setItem(TUTORIAL_DONE_KEY, "1");
        return -1;
      }
      return next;
    });
  }, []);
  const handleTutorialSkip = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(TUTORIAL_DONE_KEY, "1");
    setTutorialStep(-1);
  }, []);
  const handlePlayCard = useCallback((cardId: string) => dispatch({ type: "PLAY_CARD", cardId }), []);
  const handleDiscardCard = useCallback((cardId: string) => dispatch({ type: "DISCARD_CARD", cardId }), []);
  const handleRedraw = useCallback(() => dispatch({ type: "REDRAW_HAND" }), []);
  const handleSelectCard = useCallback((cardId: string | null) => dispatch({ type: "SELECT_CARD", cardId }), []);
  const handleEndYear = useCallback(() => dispatch({ type: "END_YEAR" }), []);
  const handleResolveEvent = useCallback((idx: number) => dispatch({ type: "RESOLVE_EVENT", optionIndex: idx }), []);
  const handleReadNote = useCallback((term: string) => dispatch({ type: "READ_NOTE", term }), []);
  const handleDismissToast = useCallback((id: string) => dispatch({ type: "DISMISS_TOAST", id }), []);
  const handleReturnMenu = useCallback(() => {
    saveToLocal(state);
    dispatch({ type: "RETURN_TO_MENU" });
    setPaused(false);
  }, [state]);
  const handleRestart = useCallback(() => { clearSave(); dispatch({ type: "RESTART_GAME" }); setPaused(false); }, []);
  const handleViewLeaderboard = useCallback(() => dispatch({ type: "VIEW_LEADERBOARD" }), []);

  const era = eraName(state.year);
  const role = ROLES[state.roleKey as RoleKey] ?? ROLES.alderman;

  /* ------------- preview targets for the selected card ------------- */
  const selectedCard = state.selectedCard ? CARD_BY_ID.get(state.selectedCard) : undefined;
  const previewTargetIds = selectedCard
    ? previewTargets(state.parcels, selectedCard.effect.transformParcels, state.seed + ":card:" + state.playedCards.length)
    : [];

  /* ------------- live running score ------------- */
  const liveScore = computeLiveScore(state);

  /* ------------- percentile fetch (throttled) ------------- */
  const [percentile, setPercentile] = useState<number | undefined>(undefined);
  const lastFetchedScore = useRef<number>(-1);
  useEffect(() => {
    if (state.phase !== "playing" && state.phase !== "event") return;
    if (Math.abs(liveScore.total - lastFetchedScore.current) < 10) return;
    lastFetchedScore.current = liveScore.total;
    let cancelled = false;
    fetch(`/api/leaderboard?percentile=${liveScore.total}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (typeof d.percentile === "number") setPercentile(d.percentile);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [liveScore.total, state.phase]);

  /* ========================================================== */
  /*  Phase: menu                                                */
  /* ========================================================== */
  if (state.phase === "menu") {
    return (
      <IntroScreen
        onStart={handleStart}
        onContinue={handleContinue}
        onLeaderboard={handleViewLeaderboard}
      />
    );
  }

  if (state.phase === "leaderboard") {
    return (
      <Leaderboard
        onClose={handleReturnMenu}
        onReplaySeed={(seed) => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("buildTheBlock:replaySeed", seed);
          }
          handleReturnMenu();
        }}
      />
    );
  }

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
    <div ref={rootRef} className="scroll-mt-16 bg-cream pb-20 pt-6 md:scroll-mt-20 md:pt-10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Top HUD: year, score, resources, action buttons */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
          <div className="flex-1">
            <ResourceHUD
              resources={state.resources}
              year={state.year}
              era={era}
              score={liveScore.total}
              percentile={percentile}
            />
          </div>
          <div className="flex shrink-0 items-stretch gap-2">
            <button
              onClick={handleTutorial}
              className="flex h-full min-h-[3rem] items-center justify-center rounded-md border border-border bg-cream px-3 font-display text-base font-bold text-forest transition-colors hover:bg-cream-dark"
              aria-label="Restart tutorial"
              title="Restart tutorial"
            >
              ?
            </button>
            <div className="relative" data-more-menu>
              <button
                onClick={() => setMoreOpen((o) => !o)}
                className="flex h-full min-h-[3rem] items-center justify-center rounded-md border border-border bg-cream px-4 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
              >
                More
              </button>
              {moreOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-md border border-border bg-cream shadow-lg"
                  role="menu"
                >
                  <MenuItem onClick={() => { setModal("codex"); setMoreOpen(false); }}>Codex</MenuItem>
                  <MenuItem onClick={() => { setModal("stats"); setMoreOpen(false); }}>Stats</MenuItem>
                  <MenuItem onClick={() => { setModal("timeline"); setMoreOpen(false); }}>Timeline</MenuItem>
                  <MenuItem onClick={() => { setModal("almanac"); setMoreOpen(false); }}>Almanac</MenuItem>
                </div>
              )}
            </div>
            <button
              onClick={() => setPaused(true)}
              className="flex h-full min-h-[3rem] items-center justify-center rounded-md border border-border bg-cream px-4 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
              title="Pause (Esc)"
            >
              Pause
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left column: ward + tabbed reference panel */}
          <aside className="order-2 lg:order-1 lg:col-span-5">
            <div className="rounded-md border border-border bg-gradient-to-br from-cream via-cream to-cream-dark/40 p-3 shadow-sm md:p-4">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Parkhaven &middot; {state.parcels.reduce((s, p) => s + p.residents, 0).toLocaleString()} residents
              </p>

              {/* Selected card preview, single line */}
              {selectedCard && (
                <div className="mt-2 rounded-sm bg-rust/10 px-3 py-1.5 font-body text-[11px] text-rust-dark">
                  <span className="font-semibold">{selectedCard.name}</span>{" "}
                  {previewTargetIds.length > 0
                    ? <>highlights {previewTargetIds.length} parcel{previewTargetIds.length === 1 ? "" : "s"}.</>
                    : <>changes scores, not parcels.</>}
                </div>
              )}

              <div className="mt-3">
                <ParcelGrid parcels={state.parcels} onHover={setHovered} highlight={previewTargetIds} />
              </div>
              <p className="mt-2 font-body text-[10px] uppercase tracking-widest text-warm-gray">
                Hover a parcel for details
              </p>
            </div>

            {hovered && (
              <div className="mt-3">
                <ParcelTooltip parcel={hovered} />
              </div>
            )}

            {/* Tabbed reference panel */}
            <div data-tut="score-tab" className="mt-4 rounded-md border border-border bg-cream shadow-sm">
              <div className="flex border-b border-border">
                <Tab active={sidePanel === "score"} onClick={() => setSidePanel("score")}>Score</Tab>
                <Tab active={sidePanel === "goals"} onClick={() => setSidePanel("goals")} count={state.objectives.length}>Goals</Tab>
                <Tab active={sidePanel === "effects"} onClick={() => setSidePanel("effects")} count={computeDrift(state).length}>Effects</Tab>
                <Tab active={sidePanel === "ward"} onClick={() => setSidePanel("ward")}>Ward</Tab>
              </div>
              <div className="p-3">
                {sidePanel === "score" && <ScoreBar scores={state.scores} />}
                {sidePanel === "goals" && <GoalsView state={state} />}
                {sidePanel === "effects" && <LastingEffectsStrip lines={computeDrift(state)} />}
                {sidePanel === "ward" && <WardStats parcels={state.parcels} />}
              </div>
            </div>

            <details className="mt-3 rounded-md border border-border bg-cream-dark/30 p-3 text-warm-gray">
              <summary className="cursor-pointer font-body text-[11px] font-semibold uppercase tracking-widest hover:text-forest">
                Map legend
              </summary>
              <div className="mt-3">
                <ParcelLegend />
              </div>
            </details>
          </aside>

          {/* Right column: hand */}
          <main className="order-1 lg:order-2 lg:col-span-7">
            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  Your hand
                </p>
                <h3 className="mt-1 font-display text-2xl text-forest md:text-3xl">
                  {state.hand.length} card{state.hand.length === 1 ? "" : "s"}
                </h3>
              </div>
              <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:flex-nowrap">
                {(() => {
                  const cost = state.redrawsThisTurn + 1;
                  const tappedOut = state.redrawsThisTurn >= 3;
                  const cantAfford = state.resources.power < cost;
                  return (
                    <button
                      onClick={handleRedraw}
                      disabled={tappedOut || cantAfford}
                      title={tappedOut ? "Redrawn 3 times this turn." : `Discard hand and draw 3 fresh cards. Costs ${cost} Power.`}
                      className="inline-flex min-w-[8.5rem] flex-1 flex-col items-center justify-center rounded-sm border border-border bg-cream px-3 py-2.5 font-body font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    >
                      <span className="text-[11px]">Redraw</span>
                      <span className="text-[9px] opacity-70">{tappedOut ? "max this turn" : `−${cost} Power`}</span>
                    </button>
                  );
                })()}
                <button
                  data-tut="end-year"
                  onClick={handleEndYear}
                  className="inline-flex min-w-[10rem] flex-[1.2] flex-col items-center justify-center rounded-sm bg-forest px-6 py-2.5 font-body font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light sm:flex-none"
                >
                  <span className="text-sm">End year &rarr;</span>
                  <span className="text-[9px] opacity-70">to {state.year + YEAR_STEP}</span>
                </button>
              </div>
            </div>

            <p className="mt-3 font-body text-[12px] text-ink/60">
              Click a card to read it. Click <span className="font-semibold text-forest">Play</span> to commit.
            </p>

            {/* Hand */}
            <div data-tut="hand" className="mt-5 flex flex-wrap gap-3">
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
                      year={state.year}
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
              <details className="mt-8 border-t border-border pt-4">
                <summary className="cursor-pointer font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray hover:text-rust">
                  Recent activity
                </summary>
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
              </details>
            )}
          </main>
        </div>
      </div>

      {/* Event modal */}
      {state.phase === "event" && state.currentEvent && !paused && (
        <EventModal
          event={state.currentEvent}
          playerRole={state.roleKey}
          onChoose={handleResolveEvent}
          onReadNote={handleReadNote}
        />
      )}

      {paused && (
        <PauseMenu
          state={state}
          onResume={() => setPaused(false)}
          onRestart={handleRestart}
          onMenu={handleReturnMenu}
          onSave={() => { saveToLocal(state); setPaused(false); }}
        />
      )}

      {tutorialStep >= 0 && state.phase === "playing" && (
        <TutorialCoach
          step={tutorialStep}
          onNext={handleTutorialNext}
          onSkip={handleTutorialSkip}
        />
      )}
      {modal === "codex" && <Codex onClose={() => setModal(null)} />}
      {modal === "stats" && <StatsDashboard state={state} onClose={() => setModal(null)} />}
      {modal === "timeline" && <RunTimeline state={state} onClose={() => setModal(null)} />}
      {modal === "almanac" && <Almanac onClose={() => setModal(null)} />}

      {decadeOverlayOpen && (
        <DecadeOverlay
          year={state.year}
          onClose={() => setDecadeOverlayOpen(false)}
        />
      )}

      <Toasts messages={state.messages} onDismiss={handleDismissToast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small inline components                                            */
/* ------------------------------------------------------------------ */

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="block w-full px-4 py-2.5 text-left font-body text-xs font-semibold uppercase tracking-widest text-forest hover:bg-cream-dark"
    >
      {children}
    </button>
  );
}

function Tab({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2.5 text-center font-body text-[11px] font-semibold uppercase tracking-widest transition-colors ${
        active ? "border-b-2 border-rust bg-cream text-forest" : "text-warm-gray hover:bg-cream-dark/30"
      }`}
    >
      {children}
      {typeof count === "number" && count > 0 && (
        <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${active ? "bg-rust text-cream" : "bg-warm-gray/20 text-warm-gray"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function GoalsView({ state }: { state: GameState }) {
  if (state.objectives.length === 0) {
    return (
      <p className="py-2 font-body text-[12px] italic text-warm-gray">
        No goals chosen. Score for any axis still counts at the end.
      </p>
    );
  }
  return (
    <ul className="space-y-2 font-body text-[13px]">
      {state.objectives.map((id) => {
        const o = OBJECTIVES_BY_ID.get(id);
        if (!o) return null;
        const done = o.test(state);
        return (
          <li key={id} className={`flex items-start gap-2 ${done ? "text-forest" : "text-ink/70"}`}>
            <span className={`mt-0.5 inline-block h-3 w-3 flex-shrink-0 rounded-sm ${done ? "bg-forest" : "border border-border bg-cream-dark"}`} />
            <span className="flex-1">
              <span className="font-semibold">{o.name}</span>
              <span className="ml-2 text-[11px] text-warm-gray">+{o.reward}</span>
              <span className="block text-[11.5px] text-ink/55">{o.description}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function WardStats({ parcels }: { parcels: Parcel[] }) {
  const housing = parcels.filter((p) => ["single-family", "two-flat", "three-flat", "courtyard", "tower", "rehab-tower", "land-trust"].includes(p.type)).length;
  const civic = parcels.filter((p) => ["school", "church", "library", "clinic", "park", "community-garden", "mural"].includes(p.type)).length;
  const protectedCount = parcels.filter((p) => p.protected).length;
  const speculator = parcels.filter((p) => p.owner === "speculator").length;
  const vacant = parcels.filter((p) => p.type === "vacant").length;
  const residents = parcels.reduce((s, p) => s + p.residents, 0);
  return (
    <div className="grid grid-cols-3 gap-2 font-body text-[11px]">
      <Stat label="Housing" value={housing} />
      <Stat label="Civic" value={civic} />
      <Stat label="Vacant" value={vacant} />
      <Stat label="Protected" value={protectedCount} highlight={protectedCount > 0} />
      <Stat label="Speculator" value={speculator} negative={speculator > 0} />
      <Stat label="Residents" value={residents} />
    </div>
  );
}

function Stat({ label, value, highlight, negative }: { label: string; value: number; highlight?: boolean; negative?: boolean }) {
  return (
    <div className="rounded-sm bg-cream-dark/30 p-2 text-center">
      <p className={`font-display text-base font-bold leading-none ${highlight ? "text-forest" : negative ? "text-rust" : "text-ink/80"}`}>
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[9px] uppercase tracking-widest text-warm-gray">{label}</p>
    </div>
  );
}
