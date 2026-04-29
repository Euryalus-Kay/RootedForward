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
/*  Top HUD — dark game-bar                                            */
/* ------------------------------------------------------------------ */

export function ResourceHUD({
  resources,
  year,
  era,
  score,
  percentile,
}: {
  resources: Resources;
  year: number;
  era: string;
  score?: number;
  percentile?: number;
}) {
  return (
    <div className="game-bar flex flex-col gap-3 rounded-lg p-3 md:flex-row md:items-center md:gap-5 md:p-4">
      {/* Year stamp + era */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:border-b-0 md:border-r md:border-white/15 md:pb-0 md:pr-5">
        <YearStamp year={year} />
        <div className="flex flex-col">
          <span className="font-body text-[9px] font-semibold uppercase tracking-[0.3em] text-cream/55">
            Era
          </span>
          <span className="font-display text-sm font-semibold leading-tight text-cream md:text-[15px]">
            {era}
          </span>
        </div>
      </div>

      {/* Score */}
      {typeof score === "number" && (
        <div
          data-tut="score"
          className="flex items-center gap-3 border-b border-white/10 pb-3 md:border-b-0 md:border-r md:border-white/15 md:pb-0 md:pr-5"
          title="Live running score. Plays out in full at year 2040."
        >
          <div className="flex flex-col">
            <span className="font-body text-[9px] font-semibold uppercase tracking-[0.3em] text-rust-light">
              Score
            </span>
            <span className="score-glow font-display text-3xl font-bold leading-none md:text-4xl">
              <AnimatedTotal value={score} />
            </span>
            {percentile != null && (
              <span
                className="mt-1 font-body text-[10px] uppercase tracking-widest text-cream/60"
                title="How your current score compares to all finished runs in the leaderboard"
              >
                {percentile >= 50 ? `Top ${Math.max(1, 100 - percentile)}%` : `${percentile}th percentile`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Resources */}
      <div data-tut="resources" className="flex flex-wrap items-center gap-2 md:ml-auto md:flex-nowrap">
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

function YearStamp({ year }: { year: number }) {
  const animated = useAnimatedCount(year, 400);
  return (
    <div className="year-stamp flex flex-col items-center justify-center rounded-md px-3 py-1.5">
      <span className="font-body text-[8.5px] font-semibold uppercase tracking-[0.3em] text-forest/70">
        Year
      </span>
      <span className="font-display text-2xl font-bold leading-none text-forest md:text-[28px]">
        {animated}
      </span>
    </div>
  );
}

const PIP_PALETTE: Record<ResourceKey, { fill: string; text: string; ring: string }> = {
  capital: {
    fill: "linear-gradient(180deg, #F2C76A 0%, #B07F1E 100%)",
    text: "#3a2305",
    ring: "rgba(244, 199, 106, 0.55)",
  },
  power: {
    fill: "linear-gradient(180deg, #E08163 0%, #8a3919 100%)",
    text: "#ffe7d9",
    ring: "rgba(224, 129, 99, 0.6)",
  },
  trust: {
    fill: "linear-gradient(180deg, #5C9C7A 0%, #1B3A2D 100%)",
    text: "#e3f3e9",
    ring: "rgba(92, 156, 122, 0.55)",
  },
  knowledge: {
    fill: "linear-gradient(180deg, #8a8fd6 0%, #3a3f7a 100%)",
    text: "#e6e8ff",
    ring: "rgba(138, 143, 214, 0.55)",
  },
};

function ResourcePip({ k, value }: { k: ResourceKey; value: number }) {
  const animated = useAnimatedCount(value);
  const p = PIP_PALETTE[k];
  return (
    <div
      className="res-pip flex items-center gap-2 rounded-md px-2.5 py-1.5"
      style={
        {
          "--pip-fill": p.fill,
          "--pip-text": p.text,
        } as React.CSSProperties
      }
      title={RES_DESC[k]}
    >
      <span style={{ color: p.text }}>
        <ResourceIcon resource={k} size={18} />
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-body text-[8.5px] font-semibold uppercase tracking-[0.18em] opacity-75" style={{ color: p.text }}>
          {RES_LABEL[k]}
        </span>
        <span className="font-display text-lg font-bold tabular-nums" style={{ color: p.text, textShadow: "0 1px 1px rgba(0,0,0,0.35)" }}>
          {animated}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score bar (still used inside the side panel — kept paper-style)    */
/* ------------------------------------------------------------------ */

export function ScoreBar({ scores }: { scores: Scores }) {
  const items: { key: ScoreKey; label: string; color: string; bg: string }[] = [
    { key: "equity",         label: "Equity",         color: "bg-rust",       bg: "text-rust" },
    { key: "heritage",       label: "Heritage",       color: "bg-forest",     bg: "text-forest" },
    { key: "growth",         label: "Growth",         color: "bg-amber-600",  bg: "text-amber-700" },
    { key: "sustainability", label: "Sustainability", color: "bg-emerald-700", bg: "text-emerald-700" },
  ];
  return (
    <div className="rounded-md bg-cream-dark/30 p-3">
      <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
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
    <span className="font-display text-sm font-bold tabular-nums text-forest">
      {animated >= 0 ? "+" : ""}{animated}
    </span>
  );
}
