"use client";

import { useEffect, useState } from "react";
import type { Resources, Scores, ResourceKey, ScoreKey } from "@/lib/game/types";
import { ResourceIcon, ScoreIcon } from "./icons";

const RES_LABEL: Record<ResourceKey, string> = {
  capital: "Capital",
  power: "Power",
  trust: "Trust",
  knowledge: "Knowledge",
};

const RES_DESC: Record<ResourceKey, string> = {
  capital: "Dollars you can spend on programs. Slowly accrues each year.",
  power: "Political capital. Spend on cards that fight powerful interests.",
  trust: "Community trust. Earned by listening and organizing.",
  knowledge: "Earned by reading glossary entries. Unlocks deeper cards.",
};

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function useAnimatedCount(value: number, duration = 350): number {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const from = display;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
}

/* ------------------------------------------------------------------ */
/*  Top HUD                                                            */
/* ------------------------------------------------------------------ */

export function ResourceHUD({
  resources,
  year,
  era,
  score,
}: {
  resources: Resources;
  year: number;
  era: string;
  score?: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-gradient-to-br from-cream via-cream to-cream-dark/40 p-4 shadow-sm md:flex-row md:items-center md:gap-5 md:p-5">
      {/* Year badge */}
      <div className="flex items-center gap-4 border-b border-border pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-5">
        <div className="flex flex-col">
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">Year</span>
          <YearBadge year={year} />
        </div>
        <div className="flex flex-col">
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">Era</span>
          <span className="font-body text-sm font-semibold text-forest md:text-base">{era}</span>
        </div>
      </div>

      {/* Running score */}
      {typeof score === "number" && (
        <div className="flex flex-col border-b border-border pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-5" title="Live running score. Plays out in full at year 2040.">
          <span className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">Score</span>
          <span className="font-display text-2xl font-bold text-rust md:text-3xl">
            <AnimatedTotal value={score} />
          </span>
        </div>
      )}

      {/* Resources */}
      <div className="flex flex-wrap gap-2 md:ml-auto md:flex-nowrap">
        {(Object.keys(resources) as ResourceKey[]).map((k) => (
          <ResourcePip key={k} k={k} value={resources[k]} />
        ))}
      </div>
    </div>
  );
}

function AnimatedTotal({ value }: { value: number }) {
  const animated = useAnimatedCount(value, 500);
  return <>{animated}</>;
}

function YearBadge({ year }: { year: number }) {
  const animated = useAnimatedCount(year, 400);
  return (
    <span className="font-display text-3xl font-bold text-forest md:text-4xl" key={year}>
      {animated}
    </span>
  );
}

function ResourcePip({ k, value }: { k: ResourceKey; value: number }) {
  const animated = useAnimatedCount(value);
  const palette: Record<ResourceKey, { bg: string; ring: string; text: string; icon: string }> = {
    capital:   { bg: "bg-gradient-to-br from-amber-100 to-amber-200/60", ring: "ring-amber-400/30",  text: "text-amber-900", icon: "text-amber-700" },
    power:     { bg: "bg-gradient-to-br from-rust/15 to-rust/30",        ring: "ring-rust/30",       text: "text-rust-dark", icon: "text-rust" },
    trust:     { bg: "bg-gradient-to-br from-forest/15 to-forest/25",    ring: "ring-forest/25",     text: "text-forest",    icon: "text-forest" },
    knowledge: { bg: "bg-gradient-to-br from-indigo-100 to-indigo-200/60", ring: "ring-indigo-400/30", text: "text-indigo-900", icon: "text-indigo-700" },
  };
  const p = palette[k];
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 shadow-sm ring-1 ${p.bg} ${p.ring}`}
      title={RES_DESC[k]}
    >
      <span className={p.icon}>
        <ResourceIcon resource={k} size={18} />
      </span>
      <div className="flex flex-col leading-none">
        <span className={`font-body text-[9px] font-semibold uppercase tracking-widest ${p.text} opacity-70`}>
          {RES_LABEL[k]}
        </span>
        <span className={`font-display text-lg font-bold ${p.text}`}>{animated}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score bar                                                          */
/* ------------------------------------------------------------------ */

export function ScoreBar({ scores }: { scores: Scores }) {
  const items: { key: ScoreKey; label: string; color: string; bg: string }[] = [
    { key: "equity",         label: "Equity",         color: "bg-rust",       bg: "text-rust" },
    { key: "heritage",       label: "Heritage",       color: "bg-forest",     bg: "text-forest" },
    { key: "growth",         label: "Growth",         color: "bg-amber-600",  bg: "text-amber-700" },
    { key: "sustainability", label: "Sustainability", color: "bg-emerald-700", bg: "text-emerald-700" },
  ];
  return (
    <div className="rounded-md border border-border bg-cream p-4 shadow-sm">
      <p className="mb-3 font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
        Hidden axes
      </p>
      <div className="space-y-3">
        {items.map((it) => {
          const v = scores[it.key];
          const pct = Math.max(-50, Math.min(50, v)) / 50;
          return (
            <div key={it.key}>
              <div className="flex items-baseline justify-between">
                <span className={`flex items-center gap-1.5 font-body text-xs font-medium ${it.bg}`}>
                  <ScoreIcon score={it.key} size={12} />
                  {it.label}
                </span>
                <AnimatedScoreValue value={v} />
              </div>
              <div className="relative mt-1 h-2 rounded-full bg-cream-dark shadow-inner">
                <div
                  className={`absolute top-0 h-full rounded-full ${it.color} transition-all duration-500 ease-out`}
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

function AnimatedScoreValue({ value }: { value: number }) {
  const animated = useAnimatedCount(value);
  return (
    <span className="font-display text-sm font-bold text-forest">
      {animated >= 0 ? "+" : ""}{animated}
    </span>
  );
}
