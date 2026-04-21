"use client";

/**
 * Statistics Dashboard. Shows the player a detailed breakdown of the
 * run so far: score arc, parcel composition, faction balance, cards
 * played by category, and resource trajectories. Accessible from the
 * pause menu and the HUD.
 *
 * Does not affect game state. Visualizations are built with CSS; no
 * external chart library is pulled in.
 */

import type { GameState } from "@/lib/game/types";
import { CARD_BY_ID } from "@/lib/game/cards";

export function StatsDashboard({
  state,
  onClose,
}: {
  state: GameState;
  onClose: () => void;
}) {
  const cardsByCategory = new Map<string, number>();
  for (const p of state.playedCards) {
    const c = CARD_BY_ID.get(p.cardId);
    if (!c) continue;
    cardsByCategory.set(c.category, (cardsByCategory.get(c.category) ?? 0) + 1);
  }
  const categoryRows = Array.from(cardsByCategory.entries())
    .sort((a, b) => b[1] - a[1]);

  const parcelCounts = new Map<string, number>();
  for (const p of state.parcels) {
    parcelCounts.set(p.type, (parcelCounts.get(p.type) ?? 0) + 1);
  }
  const parcelRows = Array.from(parcelCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const ownerCounts = new Map<string, number>();
  for (const p of state.parcels) {
    ownerCounts.set(p.owner, (ownerCounts.get(p.owner) ?? 0) + 1);
  }
  const ownerRows = Array.from(ownerCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const scores = state.scores;
  const resources = state.resources;
  const maxScore = Math.max(
    Math.abs(scores.equity),
    Math.abs(scores.heritage),
    Math.abs(scores.growth),
    Math.abs(scores.sustainability),
    40
  );

  const residents = state.parcels.reduce((s, p) => s + p.residents, 0);
  const protectedCount = state.parcels.filter((p) => p.protected).length;
  const displacement = state.parcels.filter((p) => p.displacementEvents > 0).length;
  const avgCondition = state.parcels.length > 0
    ? Math.round(state.parcels.reduce((s, p) => s + p.condition, 0) / state.parcels.length)
    : 0;
  const avgValue = state.parcels.length > 0
    ? Math.round(state.parcels.reduce((s, p) => s + p.value, 0) / state.parcels.length)
    : 0;
  const avgMemory = state.parcels.length > 0
    ? Math.round(state.parcels.reduce((s, p) => s + p.memory, 0) / state.parcels.length)
    : 0;

  const flagsList = Array.from(state.flags);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Run statistics"
    >
      <div className="flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-forest p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              Run stats
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              {state.displayName}&rsquo;s Parkhaven, {state.year}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close stats"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 font-display text-lg font-bold text-cream hover:bg-cream/25"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Residents" value={residents.toLocaleString()} />
            <Tile label="Cards played" value={state.playedCards.length} />
            <Tile label="Events resolved" value={state.resolvedEvents.length} />
            <Tile label="Notes read" value={state.notesRead.size} />
            <Tile label="Protected parcels" value={protectedCount} />
            <Tile label="Land trust parcels" value={state.parcels.filter((p) => p.type === "land-trust").length} />
            <Tile label="Speculator parcels" value={state.parcels.filter((p) => p.owner === "speculator").length} negative />
            <Tile label="Displaced parcels" value={displacement} negative={displacement > 0} />
          </div>

          {/* Score bars */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Score axes
            </p>
            <div className="mt-3 space-y-3">
              <BarRow label="Equity" value={scores.equity} max={maxScore} />
              <BarRow label="Heritage" value={scores.heritage} max={maxScore} />
              <BarRow label="Growth" value={scores.growth} max={maxScore} />
              <BarRow label="Sustainability" value={scores.sustainability} max={maxScore} />
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Current resources
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Capital" value={resources.capital} />
              <Tile label="Power" value={resources.power} />
              <Tile label="Trust" value={resources.trust} />
              <Tile label="Knowledge" value={resources.knowledge} />
            </div>
          </div>

          {/* Parcel health */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Parcel health (averages)
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Tile label="Condition" value={`${avgCondition}/100`} />
              <Tile label="Land value" value={`${avgValue}/100`} />
              <Tile label="Memory" value={`${avgMemory}/100`} />
            </div>
          </div>

          {/* Cards by category */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Cards played, by category
            </p>
            {categoryRows.length === 0 ? (
              <p className="mt-3 font-body text-sm italic text-warm-gray">
                No cards played yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {categoryRows.map(([cat, n]) => (
                  <CategoryRow key={cat} label={cat} n={n} max={categoryRows[0][1]} />
                ))}
              </div>
            )}
          </div>

          {/* Parcels by type */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Parcels by type
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
              {parcelRows.map(([t, n]) => (
                <div key={t} className="rounded-sm border border-border bg-cream-dark/20 px-3 py-2">
                  <p className="font-display text-lg font-bold text-forest">{n}</p>
                  <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-warm-gray">
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parcels by owner */}
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
              Parcels by owner
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-5">
              {ownerRows.map(([o, n]) => (
                <div
                  key={o}
                  className={`rounded-sm border px-3 py-2 ${
                    o === "speculator" || o === "absentee"
                      ? "border-rust/30 bg-rust/10"
                      : o === "land-trust"
                      ? "border-forest/30 bg-forest/10"
                      : "border-border bg-cream-dark/20"
                  }`}
                >
                  <p className="font-display text-lg font-bold text-forest">{n}</p>
                  <p className="mt-0.5 font-body text-[10px] uppercase tracking-widest text-warm-gray">
                    {o}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          {flagsList.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                Active flags ({flagsList.length})
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {flagsList.map((f) => (
                  <span
                    key={f}
                    className="rounded-sm bg-cream-dark/40 px-2 py-1 font-body text-[11px] text-ink/80"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, negative }: { label: string; value: number | string; negative?: boolean }) {
  return (
    <div className="rounded-sm border border-border bg-cream-dark/30 p-3">
      <p className={`font-display text-2xl font-bold leading-none ${negative ? "text-rust-dark" : "text-forest"}`}>
        {value}
      </p>
      <p className="mt-1 font-body text-[10px] uppercase tracking-widest text-warm-gray">
        {label}
      </p>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100);
  const positive = value >= 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="font-body text-sm font-semibold text-forest">{label}</p>
        <p className={`font-display text-base font-bold ${positive ? "text-forest" : "text-rust-dark"}`}>
          {positive ? "+" : ""}
          {Math.round(value)}
        </p>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-cream-dark/60">
        <div
          className={`h-full rounded-full ${positive ? "bg-forest" : "bg-rust-dark"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CategoryRow({ label, n, max }: { label: string; n: number; max: number }) {
  const pct = (n / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
        {label}
      </div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream-dark/50">
        <div
          className="h-full rounded-full bg-rust"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-right font-display text-sm font-bold text-forest">
        {n}
      </div>
    </div>
  );
}
