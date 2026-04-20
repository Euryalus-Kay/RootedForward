"use client";

import type { Card, CardCategory, CardRarity, Resources } from "@/lib/game/types";
import { CategoryIcon, ResourceIcon, ScoreIcon } from "./icons";

const CATEGORY_COLOR: Record<CardCategory, string> = {
  zoning: "from-amber-700 to-amber-800",
  finance: "from-emerald-700 to-emerald-900",
  infrastructure: "from-stone-700 to-stone-900",
  housing: "from-rust to-rust-dark",
  schools: "from-blue-700 to-blue-900",
  organizing: "from-rose-700 to-rose-900",
  research: "from-indigo-700 to-indigo-900",
  transit: "from-sky-600 to-sky-800",
  preservation: "from-yellow-800 to-yellow-900",
  commerce: "from-orange-700 to-orange-900",
  environment: "from-green-700 to-green-900",
  culture: "from-purple-700 to-purple-900",
};

const RARITY_RING: Record<CardRarity, string> = {
  common: "ring-1 ring-border",
  uncommon: "ring-2 ring-forest/40",
  rare: "ring-2 ring-rust shadow-[0_0_18px_rgba(196,93,62,0.15)]",
  legendary: "ring-2 ring-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.28)]",
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
      className={`relative flex h-full w-56 cursor-pointer flex-col overflow-hidden rounded-md bg-cream shadow-md transition-all duration-200 ${
        RARITY_RING[card.rarity]
      } ${selected ? "-translate-y-2 scale-[1.03] shadow-xl" : "hover:-translate-y-1 hover:shadow-lg"} ${
        !affordable ? "opacity-55" : ""
      }`}
    >
      {/* Category header with gradient and icon */}
      <div className={`relative flex items-center justify-between px-3 py-2 text-cream bg-gradient-to-r ${CATEGORY_COLOR[card.category]}`}>
        <div className="flex items-center gap-1.5">
          <CategoryIcon category={card.category} size={12} className="opacity-90" />
          <span className="font-body text-[10px] font-semibold uppercase tracking-widest">
            {card.category}
          </span>
        </div>
        <span className={`font-body text-[9px] uppercase tracking-widest opacity-80 ${card.rarity === "legendary" ? "text-amber-200" : card.rarity === "rare" ? "text-rust-light" : ""}`}>
          {RARITY_LABEL[card.rarity]}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pt-3">
        <h3 className="font-display text-[15px] font-semibold leading-tight text-forest">{card.name}</h3>
        <p className="mt-1 font-body text-[10.5px] italic text-warm-gray">{card.flavor}</p>
      </div>

      {/* Cost row */}
      <div className="mt-2 flex flex-wrap gap-1 border-t border-border/60 px-3 pt-2">
        {card.cost.capital ? <CostPip k="capital" value={card.cost.capital} have={resources.capital} /> : null}
        {card.cost.power ? <CostPip k="power" value={card.cost.power} have={resources.power} /> : null}
        {card.cost.trust ? <CostPip k="trust" value={card.cost.trust} have={resources.trust} /> : null}
        {card.cost.knowledge ? <CostPip k="knowledge" value={card.cost.knowledge} have={resources.knowledge} /> : null}
      </div>

      {/* Description */}
      <div className="px-3 pt-2 pb-3">
        <p className="font-body text-[11.5px] leading-snug text-ink/75">{card.description}</p>
      </div>

      {/* Effect summary */}
      <div className="mt-auto border-t border-border/60 bg-cream-dark/30 px-3 py-2">
        <EffectSummary card={card} />
      </div>

      {/* Action buttons (only when selected) */}
      {selected && (
        <div className="flex gap-1 border-t border-border bg-cream p-2">
          {onPlay && (
            <button
              onClick={(e) => { e.stopPropagation(); if (affordable) onPlay(); }}
              disabled={!affordable}
              className="flex-1 rounded-sm bg-rust px-3 py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Play
            </button>
          )}
          {onDiscard && (
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(); }}
              className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:bg-cream-dark"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CostPip({ k, value, have }: { k: "capital" | "power" | "trust" | "knowledge"; value: number; have: number }) {
  const ok = have >= value;
  const palette = {
    capital: ok ? "text-amber-800" : "text-rust-dark",
    power: ok ? "text-rust-dark" : "text-rust-dark",
    trust: ok ? "text-forest" : "text-rust-dark",
    knowledge: ok ? "text-indigo-700" : "text-rust-dark",
  };
  return (
    <span
      className={`flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-body text-[10px] font-bold ${
        ok ? "bg-cream-dark/70" : "bg-rust/10"
      } ${palette[k]}`}
    >
      <ResourceIcon resource={k} size={10} />
      {value}
    </span>
  );
}

function EffectSummary({ card }: { card: Card }) {
  const e = card.effect;
  const rows: { key: string; value: number; positive: boolean; icon: React.ReactNode }[] = [];
  if (e.equity)         rows.push({ key: "Eq",  value: e.equity,         positive: e.equity > 0,         icon: <ScoreIcon score="equity" size={10} /> });
  if (e.heritage)       rows.push({ key: "Hr",  value: e.heritage,       positive: e.heritage > 0,       icon: <ScoreIcon score="heritage" size={10} /> });
  if (e.growth)         rows.push({ key: "Gr",  value: e.growth,         positive: e.growth > 0,         icon: <ScoreIcon score="growth" size={10} /> });
  if (e.sustainability) rows.push({ key: "Sus", value: e.sustainability, positive: e.sustainability > 0, icon: <ScoreIcon score="sustainability" size={10} /> });
  if (e.knowledge)      rows.push({ key: "Kn",  value: e.knowledge,      positive: e.knowledge > 0,      icon: <ResourceIcon resource="knowledge" size={10} /> });
  if (e.trust)          rows.push({ key: "Tr",  value: e.trust,          positive: e.trust > 0,          icon: <ResourceIcon resource="trust" size={10} /> });
  if (e.capital)        rows.push({ key: "Ca",  value: e.capital,        positive: e.capital > 0,        icon: <ResourceIcon resource="capital" size={10} /> });
  if (e.power)          rows.push({ key: "Pw",  value: e.power,          positive: e.power > 0,          icon: <ResourceIcon resource="power" size={10} /> });

  if (rows.length === 0) {
    return <p className="font-body text-[10px] text-warm-gray">No score change</p>;
  }
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
      {rows.map((r, i) => (
        <span
          key={i}
          className={`flex items-center gap-0.5 font-body text-[10px] font-semibold ${
            r.positive ? "text-forest" : "text-rust-dark"
          }`}
        >
          {r.icon}
          <span>{r.positive ? "+" : ""}{r.value}</span>
        </span>
      ))}
    </div>
  );
}
