"use client";

import type { Card, CardCategory, CardRarity, Resources } from "@/lib/game/types";

const CATEGORY_COLOR: Record<CardCategory, string> = {
  zoning: "bg-amber-700",
  finance: "bg-emerald-700",
  infrastructure: "bg-stone-700",
  housing: "bg-rust",
  schools: "bg-blue-700",
  organizing: "bg-rose-700",
  research: "bg-indigo-700",
  transit: "bg-sky-700",
  preservation: "bg-yellow-800",
  commerce: "bg-orange-700",
  environment: "bg-green-700",
  culture: "bg-purple-700",
};

const RARITY_RING: Record<CardRarity, string> = {
  common: "border-border",
  uncommon: "border-forest/40",
  rare: "border-rust",
  legendary: "border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.3)]",
};

const RARITY_LABEL: Record<CardRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

export function PolicyCard({
  card,
  resources,
  selected,
  onClick,
  onPlay,
  onDiscard,
}: {
  card: Card;
  resources: Resources;
  selected?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
  onDiscard?: () => void;
}) {
  const affordable =
    (card.cost.capital ?? 0) <= resources.capital &&
    (card.cost.power ?? 0) <= resources.power &&
    (card.cost.trust ?? 0) <= resources.trust &&
    (card.cost.knowledge ?? 0) <= resources.knowledge;

  return (
    <div
      onClick={onClick}
      className={`flex h-full w-56 cursor-pointer flex-col rounded-md border-2 bg-cream transition-all ${
        RARITY_RING[card.rarity]
      } ${selected ? "scale-[1.03] -translate-y-2 shadow-xl" : "hover:-translate-y-1 hover:shadow-md"} ${
        !affordable ? "opacity-60" : ""
      }`}
    >
      {/* Top stripe */}
      <div className={`flex items-center justify-between rounded-t-sm px-3 py-1.5 text-cream ${CATEGORY_COLOR[card.category]}`}>
        <span className="font-body text-[10px] font-semibold uppercase tracking-widest">
          {card.category}
        </span>
        <span className="font-body text-[9px] uppercase tracking-widest opacity-80">
          {RARITY_LABEL[card.rarity]}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pt-3">
        <h3 className="font-display text-base leading-tight text-forest">{card.name}</h3>
        <p className="mt-1 font-body text-[11px] italic text-warm-gray">{card.flavor}</p>
      </div>

      {/* Cost */}
      <div className="mt-2 flex flex-wrap gap-1 px-3">
        {card.cost.capital ? <CostPip label="Cap" value={card.cost.capital} have={resources.capital} /> : null}
        {card.cost.power ? <CostPip label="Pow" value={card.cost.power} have={resources.power} /> : null}
        {card.cost.trust ? <CostPip label="Trs" value={card.cost.trust} have={resources.trust} /> : null}
        {card.cost.knowledge ? <CostPip label="Knw" value={card.cost.knowledge} have={resources.knowledge} /> : null}
      </div>

      {/* Description */}
      <div className="px-3 pt-2 pb-3">
        <p className="font-body text-[12px] leading-snug text-ink/75">{card.description}</p>
      </div>

      {/* Effect summary */}
      <div className="mt-auto px-3 pb-3 pt-1">
        <EffectSummary card={card} />
      </div>

      {/* Action buttons (only when selected) */}
      {selected && (
        <div className="flex gap-1 border-t border-border bg-cream-dark/50 p-2">
          {onPlay && (
            <button
              onClick={(e) => { e.stopPropagation(); if (affordable) onPlay(); }}
              disabled={!affordable}
              className="flex-1 rounded-sm bg-rust px-2 py-1.5 font-body text-[10px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Play
            </button>
          )}
          {onDiscard && (
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(); }}
              className="rounded-sm border border-border bg-cream px-2 py-1.5 font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:bg-cream-dark"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CostPip({ label, value, have }: { label: string; value: number; have: number }) {
  const ok = have >= value;
  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest ${
        ok ? "bg-cream-dark text-forest" : "bg-rust/20 text-rust-dark"
      }`}
    >
      {label}: {value}
    </span>
  );
}

function EffectSummary({ card }: { card: Card }) {
  const e = card.effect;
  const rows: { label: string; value: number; positive: boolean }[] = [];
  if (e.equity) rows.push({ label: "Equity", value: e.equity, positive: e.equity > 0 });
  if (e.heritage) rows.push({ label: "Heritage", value: e.heritage, positive: e.heritage > 0 });
  if (e.growth) rows.push({ label: "Growth", value: e.growth, positive: e.growth > 0 });
  if (e.sustainability) rows.push({ label: "Sustain.", value: e.sustainability, positive: e.sustainability > 0 });
  if (e.knowledge) rows.push({ label: "Knowledge", value: e.knowledge, positive: e.knowledge > 0 });
  if (e.trust) rows.push({ label: "Trust", value: e.trust, positive: e.trust > 0 });
  if (e.capital) rows.push({ label: "Capital", value: e.capital, positive: e.capital > 0 });
  if (e.power) rows.push({ label: "Power", value: e.power, positive: e.power > 0 });

  if (rows.length === 0) return <p className="font-body text-[10px] text-warm-gray">No score change</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {rows.map((r, i) => (
        <span
          key={i}
          className={`font-body text-[10px] font-semibold ${
            r.positive ? "text-forest" : "text-rust-dark"
          }`}
        >
          {r.label} {r.positive ? "+" : ""}{r.value}
        </span>
      ))}
    </div>
  );
}
