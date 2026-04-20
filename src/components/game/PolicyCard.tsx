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
      className={`relative flex h-full w-60 cursor-pointer flex-col overflow-hidden rounded-md bg-cream shadow-md transition-all duration-200 ${
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
      <div className="mt-2 border-t border-border/60 px-3 pt-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-body text-[9px] font-bold uppercase tracking-widest text-warm-gray">
            Costs
          </span>
          <div className="flex flex-wrap gap-1">
            {card.cost.capital ? <CostPip k="capital" label="Capital" value={card.cost.capital} have={resources.capital} /> : null}
            {card.cost.power ? <CostPip k="power" label="Power" value={card.cost.power} have={resources.power} /> : null}
            {card.cost.trust ? <CostPip k="trust" label="Trust" value={card.cost.trust} have={resources.trust} /> : null}
            {card.cost.knowledge ? <CostPip k="knowledge" label="Knowledge" value={card.cost.knowledge} have={resources.knowledge} /> : null}
            {!card.cost.capital && !card.cost.power && !card.cost.trust && !card.cost.knowledge && (
              <span className="font-body text-[10px] italic text-warm-gray">free</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 pt-2 pb-3">
        <p className="font-body text-[11.5px] leading-snug text-ink/75">{card.description}</p>
      </div>

      {/* Effect summary */}
      <div className="mt-auto border-t border-border/60 bg-cream-dark/40 px-3 py-2">
        <p className="mb-1 font-body text-[9px] font-bold uppercase tracking-widest text-warm-gray">
          Effects
        </p>
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

function CostPip({
  k,
  label,
  value,
  have,
}: {
  k: "capital" | "power" | "trust" | "knowledge";
  label: string;
  value: number;
  have: number;
}) {
  const ok = have >= value;
  const palette = {
    capital: ok ? "text-amber-900 bg-amber-100" : "text-rust-dark bg-rust/15",
    power: ok ? "text-rust-dark bg-rust/15" : "text-rust-dark bg-rust/25",
    trust: ok ? "text-forest bg-forest/15" : "text-rust-dark bg-rust/15",
    knowledge: ok ? "text-indigo-800 bg-indigo-100" : "text-rust-dark bg-rust/15",
  };
  return (
    <span
      className={`flex items-center gap-1 rounded-sm px-1.5 py-1 font-body text-[11px] font-semibold ${palette[k]}`}
      title={`Costs ${value} ${label}`}
    >
      <ResourceIcon resource={k} size={12} />
      <span className="font-bold">{value}</span>
      <span className="text-[10px] opacity-80">{label}</span>
    </span>
  );
}

function EffectSummary({ card }: { card: Card }) {
  const e = card.effect;
  type Row = { label: string; value: number; positive: boolean; kind: "score" | "resource"; iconKey: string };
  const rows: Row[] = [];
  if (e.equity)         rows.push({ label: "Equity",         value: e.equity,         positive: e.equity > 0,         kind: "score",    iconKey: "equity" });
  if (e.heritage)       rows.push({ label: "Heritage",       value: e.heritage,       positive: e.heritage > 0,       kind: "score",    iconKey: "heritage" });
  if (e.growth)         rows.push({ label: "Growth",         value: e.growth,         positive: e.growth > 0,         kind: "score",    iconKey: "growth" });
  if (e.sustainability) rows.push({ label: "Sustainability", value: e.sustainability, positive: e.sustainability > 0, kind: "score",    iconKey: "sustainability" });
  if (e.knowledge)      rows.push({ label: "Knowledge",      value: e.knowledge,      positive: e.knowledge > 0,      kind: "resource", iconKey: "knowledge" });
  if (e.trust)          rows.push({ label: "Trust",          value: e.trust,          positive: e.trust > 0,          kind: "resource", iconKey: "trust" });
  if (e.capital)        rows.push({ label: "Capital",        value: e.capital,        positive: e.capital > 0,        kind: "resource", iconKey: "capital" });
  if (e.power)          rows.push({ label: "Power",          value: e.power,          positive: e.power > 0,          kind: "resource", iconKey: "power" });

  if (rows.length === 0) {
    return <p className="font-body text-[11px] italic text-warm-gray">No score change</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center justify-between font-body text-[12px] ${
            r.positive ? "text-forest" : "text-rust-dark"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={r.positive ? "text-forest" : "text-rust-dark"}>
              {r.kind === "score"
                ? <ScoreIcon score={r.iconKey as never} size={12} />
                : <ResourceIcon resource={r.iconKey as never} size={12} />}
            </span>
            <span className="font-medium">{r.label}</span>
          </span>
          <span className="font-display font-bold">
            {r.positive ? "+" : ""}{r.value}
          </span>
        </div>
      ))}
    </div>
  );
}
