"use client";

import { useEffect, useState } from "react";
import { readLocalLeaderboard } from "@/lib/game/save";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  seed?: string;
  ended_year?: number;
  total_score: number;
  equity_score: number;
  heritage_score: number;
  growth_score: number;
  sustainability_score: number;
  archetype: string;
  decisions_made: number;
  events_survived: number;
  notes_read: number;
  created_at: string;
}

export function Leaderboard({
  highlightId,
  onClose,
  onReplaySeed,
}: {
  highlightId?: string;
  onClose: () => void;
  onReplaySeed?: (seed: string) => void;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const remote: LeaderboardEntry[] = data.leaderboard ?? [];
        const local = readLocalLeaderboard();
        // Dedup by run signature (same player + same score + same shape
        // means the run was logged both locally and remotely). Prefer
        // the remote copy when both exist.
        const seen = new Set<string>();
        const merged: LeaderboardEntry[] = [];
        const sig = (e: LeaderboardEntry) =>
          `${e.display_name}|${e.total_score}|${e.archetype}|${e.decisions_made}|${e.events_survived}`;
        for (const e of [...remote, ...local]) {
          const key = sig(e);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(e);
        }
        merged.sort((a, b) => b.total_score - a.total_score);
        setEntries(merged.slice(0, 50));
      })
      .catch(() => {
        if (cancelled) return;
        setEntries(readLocalLeaderboard());
        setError("Showing your local runs (remote leaderboard unreachable).");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Build the Block
          </p>
          <h1 className="mt-2 font-display text-4xl text-forest md:text-5xl">Leaderboard</h1>
        </div>
        <button
          onClick={onClose}
          className="font-body text-sm font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
        >
          Back &rarr;
        </button>
      </div>

      <p className="mt-4 max-w-[55ch] font-body text-sm text-ink/70">
        The top fifty Parkhavens this month. Every score is a different shape of the same century.
      </p>

      {error && (
        <p className="mt-8 rounded-sm border border-rust/30 bg-rust/10 p-4 font-body text-sm text-rust-dark">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-sm border border-border bg-cream shadow-sm">
        <div className="hidden grid-cols-[40px_1fr_120px_120px_80px_80px] gap-4 border-b border-border bg-cream-dark px-4 py-3 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray md:grid">
          <span>#</span>
          <span>Player</span>
          <span>Archetype</span>
          <span>Total</span>
          <span>Cards</span>
          <span>Notes</span>
        </div>

        {entries == null ? (
          <p className="p-8 text-center font-body text-sm text-warm-gray">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="p-8 text-center font-body text-sm text-warm-gray">
            Nobody has finished a run yet. Be the first.
          </p>
        ) : (
          entries.map((e, i) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className={`grid w-full grid-cols-1 gap-1 border-b border-border/60 px-4 py-3 text-left font-body text-sm transition-colors last:border-b-0 hover:bg-cream-dark/50 md:grid-cols-[40px_1fr_120px_120px_80px_80px] md:gap-4 md:py-2.5 ${
                e.id === highlightId ? "bg-rust/15" : ""
              }`}
            >
              <span className="font-display text-base font-bold text-forest md:font-normal">{i + 1}</span>
              <span className="font-medium text-forest">{e.display_name}</span>
              <span className="text-warm-gray md:text-ink/70">{titleCase(e.archetype)}</span>
              <span className="font-display text-base font-bold text-rust">{e.total_score}</span>
              <span className="text-warm-gray">{e.decisions_made}</span>
              <span className="text-warm-gray">{e.notes_read}</span>
            </button>
          ))
        )}
      </div>

      {/* Selected run detail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-cream shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border bg-cream-dark/40 p-5">
              <div>
                <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
                  {titleCase(selected.archetype)} &middot; {selected.ended_year ?? 2040}
                </p>
                <h3 className="mt-1 font-display text-2xl text-forest">{selected.display_name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-warm-gray hover:text-forest"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-baseline justify-between">
                <span className="font-body text-xs uppercase tracking-widest text-warm-gray">Total score</span>
                <span className="font-display text-4xl font-bold text-rust">{selected.total_score}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Equity</p><p className="font-display text-lg text-forest">{selected.equity_score}</p></div>
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Heritage</p><p className="font-display text-lg text-forest">{selected.heritage_score}</p></div>
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Growth</p><p className="font-display text-lg text-forest">{selected.growth_score}</p></div>
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Sustain.</p><p className="font-display text-lg text-forest">{selected.sustainability_score}</p></div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Cards played</p><p className="font-display text-base text-forest">{selected.decisions_made}</p></div>
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Events</p><p className="font-display text-base text-forest">{selected.events_survived}</p></div>
                <div><p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Notes read</p><p className="font-display text-base text-forest">{selected.notes_read}</p></div>
              </div>

              {selected.seed && (
                <div className="border-t border-border pt-3">
                  <p className="font-body text-[10px] uppercase tracking-widest text-warm-gray">Seed</p>
                  <p className="mt-1 font-body text-sm font-medium text-forest">{selected.seed}</p>
                  {onReplaySeed && (
                    <button
                      onClick={() => onReplaySeed(selected.seed!)}
                      className="mt-3 inline-flex items-center rounded-sm bg-rust px-5 py-2 font-body text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                    >
                      Play this seed &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function titleCase(s: string): string {
  return s.replace(/(^|[\s-])(\w)/g, (_, sep, ch) => sep + ch.toUpperCase());
}
