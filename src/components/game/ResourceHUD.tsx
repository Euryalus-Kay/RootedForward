"use client";

import type { Resources, Scores } from "@/lib/game/types";

const RES_LABEL: Record<keyof Resources, string> = {
  capital: "Capital",
  power: "Power",
  trust: "Trust",
  knowledge: "Knowledge",
};

const RES_DESC: Record<keyof Resources, string> = {
  capital: "Spend on programs that need money. Slowly accrues each year.",
  power: "Spend on cards that fight powerful interests. Slowly accrues.",
  trust: "Spend on community-rooted cards. Earned by listening.",
  knowledge: "Spend on data-driven cards. Earned by reading glossary entries.",
};

export function ResourceHUD({
  resources,
  year,
  era,
}: {
  resources: Resources;
  year: number;
  era: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-cream p-3 shadow-sm md:gap-4 md:p-4">
      <div className="flex flex-col">
        <span className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Year</span>
        <span className="font-display text-2xl text-forest md:text-3xl">{year}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Era</span>
        <span className="font-body text-sm font-medium text-forest md:text-base">{era}</span>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        {(Object.keys(resources) as (keyof Resources)[]).map((k) => (
          <ResourcePip key={k} k={k} value={resources[k]} />
        ))}
      </div>
    </div>
  );
}

function ResourcePip({ k, value }: { k: keyof Resources; value: number }) {
  const colors: Record<keyof Resources, string> = {
    capital: "bg-amber-100 text-amber-900 border-amber-300",
    power: "bg-rust/15 text-rust-dark border-rust/30",
    trust: "bg-forest/15 text-forest border-forest/30",
    knowledge: "bg-cream-dark text-ink/80 border-border",
  };
  return (
    <div
      className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 ${colors[k]}`}
      title={RES_DESC[k]}
    >
      <span className="font-body text-[10px] font-semibold uppercase tracking-widest">
        {RES_LABEL[k]}
      </span>
      <span className="font-display text-base font-bold leading-none">{value}</span>
    </div>
  );
}

export function ScoreBar({ scores }: { scores: Scores }) {
  const items: { key: keyof Scores; label: string; color: string }[] = [
    { key: "equity", label: "Equity", color: "bg-rust" },
    { key: "heritage", label: "Heritage", color: "bg-forest" },
    { key: "growth", label: "Growth", color: "bg-amber-600" },
    { key: "sustainability", label: "Sustainability", color: "bg-emerald-700" },
  ];
  return (
    <div className="rounded-sm border border-border bg-cream p-4 shadow-sm">
      <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
        Hidden axes (visible to you only)
      </p>
      <div className="space-y-3">
        {items.map((it) => {
          const v = scores[it.key];
          const pct = Math.max(-50, Math.min(50, v)) / 50;
          return (
            <div key={it.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-body text-xs text-ink/70">{it.label}</span>
                <span className="font-body text-xs font-semibold text-forest">{v >= 0 ? "+" : ""}{v}</span>
              </div>
              <div className="relative mt-1 h-2 rounded-full bg-cream-dark">
                <div
                  className={`absolute top-0 h-full rounded-full ${it.color}`}
                  style={{
                    left: pct >= 0 ? "50%" : `${50 + pct * 50}%`,
                    width: `${Math.abs(pct) * 50}%`,
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px bg-warm-gray-light" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
