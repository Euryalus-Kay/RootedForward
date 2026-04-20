"use client";

import type { DriftLine } from "@/lib/game/state";

/**
 * Shows the per-turn score drift from earlier decisions. Each line
 * names the flag-setting decision and the score axes it nudges every
 * turn. Empty when the player has set no compounding flags yet.
 */
export function LastingEffects({ lines }: { lines: DriftLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="mt-4 rounded-md border border-border bg-cream p-4 shadow-sm">
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
        Lasting effects of earlier decisions
      </p>
      <p className="mt-1 font-body text-[11px] text-warm-gray">
        Applied to your scores every turn until 2040.
      </p>
      <ul className="mt-3 space-y-2">
        {lines.map((d) => (
          <li key={d.flag} className="flex items-start justify-between gap-3 border-l-2 border-rust/50 pl-3">
            <span className="font-body text-[12px] text-ink/80">{d.description}</span>
            <span className="flex flex-shrink-0 flex-wrap items-center justify-end gap-x-2 text-right font-body text-[11px] font-semibold">
              {d.equity !== 0 && <span className={d.equity > 0 ? "text-forest" : "text-rust-dark"}>Equity {d.equity > 0 ? "+" : ""}{d.equity}</span>}
              {d.heritage !== 0 && <span className={d.heritage > 0 ? "text-forest" : "text-rust-dark"}>Heritage {d.heritage > 0 ? "+" : ""}{d.heritage}</span>}
              {d.growth !== 0 && <span className={d.growth > 0 ? "text-forest" : "text-rust-dark"}>Growth {d.growth > 0 ? "+" : ""}{d.growth}</span>}
              {d.sustainability !== 0 && <span className={d.sustainability > 0 ? "text-forest" : "text-rust-dark"}>Sustain. {d.sustainability > 0 ? "+" : ""}{d.sustainability}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
