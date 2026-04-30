"use client";

import type { DriftLine } from "@/lib/game/state";

/**
 * Lasting effects panel. Used inside the side-panel "Effects" tab.
 * Each row is one compounding decision: the description on the left,
 * a tidy column of per-turn deltas on the right.
 */
export function LastingEffectsStrip({ lines }: { lines: DriftLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="py-2 font-body text-[12px] italic text-warm-gray">
        No lasting effects yet. Cards like &ldquo;Approve a 6-lane expressway&rdquo; or
        &ldquo;Charter a Community Land Trust&rdquo; add compounding effects here.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {lines.map((d) => (
        <EffectRow key={d.flag} d={d} />
      ))}
    </ul>
  );
}

function EffectRow({ d }: { d: DriftLine }) {
  const total = d.equity + d.heritage + d.growth + d.sustainability;
  const positive = total >= 0;
  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 ${
        positive
          ? "border-forest/25 bg-forest/5"
          : "border-rust/25 bg-rust/5"
      }`}
    >
      <span className={`flex-1 font-body text-[12px] leading-snug ${positive ? "text-forest-light" : "text-rust-dark"}`} title={d.description}>
        <span className={`mr-1.5 inline-block ${positive ? "text-forest" : "text-rust"}`} aria-hidden>
          {positive ? "▲" : "▼"}
        </span>
        {d.description}
      </span>
      <span className="flex flex-shrink-0 flex-col items-end gap-0.5 text-right font-body text-[10.5px] font-semibold tabular-nums">
        {d.equity !== 0 && <DeltaTag label="Equity" value={d.equity} />}
        {d.heritage !== 0 && <DeltaTag label="Heritage" value={d.heritage} />}
        {d.growth !== 0 && <DeltaTag label="Growth" value={d.growth} />}
        {d.sustainability !== 0 && <DeltaTag label="Sustain." value={d.sustainability} />}
      </span>
    </li>
  );
}

function DeltaTag({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  const display = formatDelta(value);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 ${
        positive ? "bg-forest/15 text-forest" : "bg-rust/15 text-rust-dark"
      }`}
    >
      <span className="text-[9.5px] uppercase tracking-[0.1em] opacity-75">{label}</span>
      <span className="font-bold">{display}</span>
    </span>
  );
}

/** Round to one decimal, drop trailing .0, and prefix sign. */
function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const abs = Math.abs(rounded);
  const text = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
  return rounded >= 0 ? `+${text}` : `−${text}`;
}
