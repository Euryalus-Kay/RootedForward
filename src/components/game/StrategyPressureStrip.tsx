"use client";

import { computeStrategyPressure } from "@/lib/game/strategy-pressure";
import type { GameState } from "@/lib/game/types";

const toneClass = {
  good: "bg-forest text-cream",
  warn: "bg-amber-500 text-ink",
  danger: "bg-rust text-cream",
  neutral: "bg-warm-gray text-cream",
};

const trackClass = {
  good: "bg-forest/15",
  warn: "bg-amber-200",
  danger: "bg-rust/15",
  neutral: "bg-warm-gray/15",
};

export function StrategyPressureStrip({ state }: { state: GameState }) {
  const report = computeStrategyPressure(state);
  const gap = report.marketHeat - report.residentShield;
  const status =
    gap >= 16
      ? "Speculators are favored next turn"
      : gap <= -16
        ? "Residents are shielded next turn"
        : "Next turn is contested";

  return (
    <div className="rounded-sm border border-border bg-cream p-3 shadow-sm" data-testid="strategy-pressure-strip">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Strategy pressure
          </p>
          <p className="mt-0.5 font-display text-base text-forest">{status}</p>
        </div>
        <p className="font-body text-[11px] text-ink/60">
          {report.vulnerableParcels} vulnerable parcels / {report.protectedParcels} protected
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        {report.meters.map((meter) => (
          <div key={meter.key} className="rounded-sm border border-border/70 bg-cream-dark/30 p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
                {meter.label}
              </span>
              <span className="font-display text-sm font-bold text-forest">{meter.value}</span>
            </div>
            <div className={`mt-1 h-2 overflow-hidden rounded-full ${trackClass[meter.tone]}`}>
              <div
                className={`h-full rounded-full ${toneClass[meter.tone]}`}
                style={{ width: `${meter.value}%` }}
              />
            </div>
            <p className="mt-1 font-body text-[10.5px] leading-snug text-ink/60">
              {meter.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
