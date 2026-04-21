"use client";

/**
 * Run Timeline. A chronological view of every card played and every
 * event resolved in this run, grouped by year. Lets players review
 * their choices without ending the game. Useful for self-critique
 * and for post-game reflection.
 */

import { useMemo } from "react";
import type { GameState } from "@/lib/game/types";
import { CARD_BY_ID } from "@/lib/game/cards";
import { EVENT_BY_ID } from "@/lib/game/events";

interface TimelineEntry {
  year: number;
  kind: "card" | "event";
  title: string;
  detail: string;
  lore?: string;
  source?: string;
}

export function RunTimeline({
  state,
  onClose,
}: {
  state: GameState;
  onClose: () => void;
}) {
  const entries = useMemo<TimelineEntry[]>(() => {
    const out: TimelineEntry[] = [];
    for (const p of state.playedCards) {
      const c = CARD_BY_ID.get(p.cardId);
      if (!c) continue;
      out.push({
        year: p.year,
        kind: "card",
        title: c.name,
        detail: c.description,
        lore: c.lore,
        source: c.source,
      });
    }
    for (const e of state.resolvedEvents) {
      const ev = EVENT_BY_ID.get(e.eventId);
      if (!ev) continue;
      out.push({
        year: e.year,
        kind: "event",
        title: ev.title,
        detail: e.outcome,
        lore: ev.lore,
        source: ev.source,
      });
    }
    out.sort((a, b) => a.year - b.year);
    return out;
  }, [state.playedCards, state.resolvedEvents]);

  const byYear = useMemo(() => {
    const m = new Map<number, TimelineEntry[]>();
    for (const e of entries) {
      const arr = m.get(e.year) ?? [];
      arr.push(e);
      m.set(e.year, arr);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [entries]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Run timeline"
    >
      <div className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-forest p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              Timeline
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              Your Parkhaven, from 1940
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close timeline"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 font-display text-lg font-bold text-cream hover:bg-cream/25"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {byYear.length === 0 ? (
            <p className="mx-auto max-w-prose pt-8 text-center font-body text-base italic text-warm-gray">
              No decisions yet. Play a card to begin the timeline.
            </p>
          ) : (
            <div className="relative mx-auto max-w-3xl">
              <div
                className="absolute bottom-0 left-[52px] top-0 w-px bg-border"
                aria-hidden
              />
              <ul className="space-y-6">
                {byYear.map(([year, group]) => (
                  <li key={year} className="relative pl-24">
                    <div className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full bg-rust font-display text-sm font-bold text-cream shadow-md">
                      {year}
                    </div>
                    <ul className="space-y-3">
                      {group.map((e, i) => (
                        <li
                          key={i}
                          className={`rounded-sm border border-border p-4 shadow-sm ${
                            e.kind === "card"
                              ? "bg-cream"
                              : "bg-rust/5"
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="font-display text-base font-semibold text-forest">
                              {e.title}
                            </p>
                            <span
                              className={`rounded-sm px-2 py-0.5 font-body text-[9px] font-semibold uppercase tracking-widest ${
                                e.kind === "card"
                                  ? "bg-forest/10 text-forest"
                                  : "bg-rust/15 text-rust-dark"
                              }`}
                            >
                              {e.kind}
                            </span>
                          </div>
                          <p className="mt-1 font-body text-sm leading-relaxed text-ink/75">
                            {e.detail}
                          </p>
                          {e.lore && (
                            <p className="mt-2 font-body text-xs italic text-ink/60">
                              {e.lore}
                            </p>
                          )}
                          {e.source && (
                            <p className="mt-2 font-body text-[11px] uppercase tracking-widest text-warm-gray">
                              Source · {e.source}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
