"use client";

import { useEffect, useState } from "react";
import { readLocalLeaderboard } from "@/lib/game/save";

interface LeaderboardEntry {
  id: string;
  display_name: string;
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
}: {
  highlightId?: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const remote: LeaderboardEntry[] = data.leaderboard ?? [];
        const local = readLocalLeaderboard();
        // Merge: local entries that aren't in remote get appended; sort
        // combined by total_score desc, dedupe by id.
        const combined = [...remote, ...local];
        const seen = new Set<string>();
        const merged: LeaderboardEntry[] = [];
        for (const e of combined) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          merged.push(e);
        }
        merged.sort((a, b) => b.total_score - a.total_score);
        setEntries(merged.slice(0, 50));
      })
      .catch(() => {
        if (cancelled) return;
        // Remote unreachable: show local-only leaderboard
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
            <div
              key={e.id}
              className={`grid grid-cols-1 gap-1 border-b border-border/60 px-4 py-3 font-body text-sm last:border-b-0 md:grid-cols-[40px_1fr_120px_120px_80px_80px] md:gap-4 md:py-2.5 ${
                e.id === highlightId ? "bg-rust/15" : ""
              }`}
            >
              <span className="font-display text-base font-bold text-forest md:font-normal">{i + 1}</span>
              <span className="font-medium text-forest">{e.display_name}</span>
              <span className="text-warm-gray md:text-ink/70">{titleCase(e.archetype)}</span>
              <span className="font-display text-base font-bold text-rust">{e.total_score}</span>
              <span className="text-warm-gray">{e.decisions_made}</span>
              <span className="text-warm-gray">{e.notes_read}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function titleCase(s: string): string {
  return s.replace(/(^|[\s-])(\w)/g, (_, sep, ch) => sep + ch.toUpperCase());
}
