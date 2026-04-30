"use client";

import type { Card, CardCategory, CardRarity, Resources } from "@/lib/game/types";
import { CategoryIcon, ResourceIcon, ScoreIcon } from "./icons";
import { effectiveCost } from "@/lib/game/cards";
import { FLAG_BY_KEY } from "@/lib/game/flags";

const CATEGORY_COLOR: Record<CardCategory, string> = {
  zoning: "from-amber-700 to-amber-900",
  finance: "from-emerald-700 to-emerald-900",
  infrastructure: "from-stone-700 to-stone-900",
  housing: "from-rust to-rust-dark",
  schools: "from-blue-700 to-blue-900",
  organizing: "from-rose-700 to-rose-900",
  research: "from-indigo-700 to-indigo-900",
  transit: "from-sky-700 to-sky-900",
  preservation: "from-yellow-800 to-yellow-900",
  commerce: "from-orange-700 to-orange-900",
  environment: "from-green-700 to-green-900",
  culture: "from-purple-700 to-purple-900",
};

const RARITY_RING: Record<CardRarity, string> = {
  common: "ring-1 ring-black/10",
  uncommon: "ring-2 ring-forest/40",
  rare: "ring-2 ring-rust",
  legendary: "ring-2 ring-amber-500",
};

const RARITY_DOTS: Record<CardRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
};

const RARITY_DOT_COLOR: Record<CardRarity, string> = {
  common: "bg-cream/60",
  uncommon: "bg-cream/85",
  rare: "bg-rust-light",
  legendary: "bg-amber-300",
};

export function PolicyCard({
  card,
  resources,
  year,
  selected,
  onClick,
  onPlay,
  onDiscard,
}: {
  card: Card;
  resources: Resources;
  /** Current game year. Used to apply inflation to card cost. */
  year: number;
  selected?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
  onDiscard?: () => void;
}) {
  const cost = effectiveCost(card, year);
  const affordable =
    (cost.capital ?? 0) <= resources.capital &&
    (cost.power ?? 0) <= resources.power &&
    (cost.trust ?? 0) <= resources.trust &&
    (cost.knowledge ?? 0) <= resources.knowledge;
  const missing = ([
    ["capital", "Capital", cost.capital ?? 0, resources.capital],
    ["power", "Power", cost.power ?? 0, resources.power],
    ["trust", "Trust", cost.trust ?? 0, resources.trust],
    ["knowledge", "Knowledge", cost.knowledge ?? 0, resources.knowledge],
  ] as const)
    .filter(([, , need, have]) => need > have)
    .map(([, label, need, have]) => `${need - have} ${label}`);
  const isFree = !cost.capital && !cost.power && !cost.trust && !cost.knowledge;
  const dotCount = RARITY_DOTS[card.rarity];

  return (
    <div
      data-testid="policy-card"
      onClick={onClick}
      className={`relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg bg-gradient-to-b from-cream to-cream-dark/40 sm:w-[15.5rem] ${
        RARITY_RING[card.rarity]
      } ${selected ? "game-card-selected" : "game-card"} ${
        !affordable ? "opacity-60" : ""
      }`}
    >
      {/* Category header strip with gradient + rarity dots */}
      <div className={`relative flex items-center justify-between px-3 py-2 text-cream bg-gradient-to-r ${CATEGORY_COLOR[card.category]}`}>
        <div className="flex items-center gap-1.5">
          <CategoryIcon category={card.category} size={13} className="opacity-95" />
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.2em]">
            {card.category}
          </span>
        </div>
        <div className="flex gap-0.5" aria-label={`${card.rarity} rarity`} title={card.rarity}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${RARITY_DOT_COLOR[card.rarity]}`} />
          ))}
        </div>
      </div>

      {/* Title block */}
      <div className="px-3.5 pt-3 pb-2">
        <h3 className="font-display text-[16px] font-semibold leading-[1.15] text-forest">
          {card.name}
        </h3>
        {card.flavor && (
          <p className="mt-1.5 font-body text-[11px] italic leading-snug text-warm-gray">
            {card.flavor}
          </p>
        )}
      </div>

      {/* Cost row — labeled chips so it is obvious which resource each is */}
      <div className="px-3.5 pb-2">
        <p className="mb-1 font-body text-[9px] font-bold uppercase tracking-[0.22em] text-warm-gray">
          Card cost
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {isFree ? (
            <span className="rounded-full bg-forest/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest text-forest">
              Free
            </span>
          ) : (
            <>
              {cost.capital ? <CostChip k="capital" label="Capital" value={cost.capital} have={resources.capital} /> : null}
              {cost.power ? <CostChip k="power" label="Power" value={cost.power} have={resources.power} /> : null}
              {cost.trust ? <CostChip k="trust" label="Trust" value={cost.trust} have={resources.trust} /> : null}
              {cost.knowledge ? <CostChip k="knowledge" label="Knowledge" value={cost.knowledge} have={resources.knowledge} /> : null}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 pb-3">
        <p className="font-body text-[12.5px] leading-snug text-ink">{card.description}</p>
      </div>

      {/* Effects panel */}
      <div className="mt-auto border-t border-border/60 bg-cream-dark/40 px-3.5 py-2.5">
        <EffectSummary card={card} />
      </div>

      {/* Action buttons (only when selected) */}
      {selected && (
        <div className="flex gap-1.5 border-t border-border bg-cream p-2">
          {onPlay && (
            <button
              onClick={(e) => { e.stopPropagation(); if (affordable) onPlay(); }}
              disabled={!affordable}
              className="btn-primary flex-1 rounded-md px-3 py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-cream disabled:cursor-not-allowed disabled:opacity-50"
            >
              Play
            </button>
          )}
          {onDiscard && (
            <button
              onClick={(e) => { e.stopPropagation(); onDiscard(); }}
              className="btn-cream rounded-md px-3 py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const COST_PALETTE: Record<"capital" | "power" | "trust" | "knowledge", { ok: string; bad: string }> = {
  capital: {
    ok: "border-amber-300/70 bg-amber-100 text-amber-900",
    bad: "border-rust/40 bg-rust/15 text-rust-dark",
  },
  power: {
    ok: "border-rust/40 bg-rust/15 text-rust-dark",
    bad: "border-rust/50 bg-rust/25 text-rust-dark",
  },
  trust: {
    ok: "border-forest/30 bg-forest/12 text-forest",
    bad: "border-rust/40 bg-rust/15 text-rust-dark",
  },
  knowledge: {
    ok: "border-indigo-300/70 bg-indigo-100 text-indigo-900",
    bad: "border-rust/40 bg-rust/15 text-rust-dark",
  },
};

function CostChip({
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
  const palette = ok ? COST_PALETTE[k].ok : COST_PALETTE[k].bad;
  return (
    <span
      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-body tabular-nums ${palette}`}
      title={`Costs ${value} ${label}`}
    >
      <ResourceIcon resource={k} size={11} />
      <span className="text-[11.5px] font-bold">{value}</span>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] opacity-80">
        {label}
      </span>
    </span>
  );
}

function EffectSummary({ card }: { card: Card }) {
  const e = card.effect;
  type Row = { label: string; value: number; positive: boolean; kind: "score" | "resource"; iconKey: string };
  const rows: Row[] = [];
  const flags = [
    ...(e.setFlag ? [e.setFlag] : []),
    ...(e.setFlags ?? []),
  ];
  if (e.equity)         rows.push({ label: "Equity",         value: e.equity,         positive: e.equity > 0,         kind: "score",    iconKey: "equity" });
  if (e.heritage)       rows.push({ label: "Heritage",       value: e.heritage,       positive: e.heritage > 0,       kind: "score",    iconKey: "heritage" });
  if (e.growth)         rows.push({ label: "Growth",         value: e.growth,         positive: e.growth > 0,         kind: "score",    iconKey: "growth" });
  if (e.sustainability) rows.push({ label: "Sustainability", value: e.sustainability, positive: e.sustainability > 0, kind: "score",    iconKey: "sustainability" });
  if (e.knowledge)      rows.push({ label: "Knowledge",      value: e.knowledge,      positive: e.knowledge > 0,      kind: "resource", iconKey: "knowledge" });
  if (e.trust)          rows.push({ label: "Trust",          value: e.trust,          positive: e.trust > 0,          kind: "resource", iconKey: "trust" });
  if (e.capital)        rows.push({ label: "Capital",        value: e.capital,        positive: e.capital > 0,        kind: "resource", iconKey: "capital" });
  if (e.power)          rows.push({ label: "Power",          value: e.power,          positive: e.power > 0,          kind: "resource", iconKey: "power" });

  return (
    <div className="space-y-1">
      {rows.length === 0 && (
        <p className="font-body text-[11px] italic text-warm-gray">No score change</p>
      )}
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 font-body text-[12px]"
        >
          <span className={`flex items-center gap-1.5 ${r.positive ? "text-forest" : "text-rust-dark"}`}>
            <span className="opacity-90">
              {r.kind === "score"
                ? <ScoreIcon score={r.iconKey as never} size={12} />
                : <ResourceIcon resource={r.iconKey as never} size={12} />}
            </span>
            <span className="font-medium text-ink/85">{r.label}</span>
          </span>
          <span className={`font-display text-[13px] font-bold tabular-nums ${r.positive ? "text-forest" : "text-rust-dark"}`}>
            {r.positive ? "+" : ""}{r.value}
          </span>
        </div>
      ))}
      {flags.length > 0 && (
        <div className="mt-1.5 rounded-sm bg-forest/10 px-2 py-1 font-body text-[10.5px] leading-snug text-forest">
          <span className="font-bold uppercase tracking-widest">Long-term &middot; </span>
          {flags
            .map((flag) => FLAG_BY_KEY.get(flag)?.label ?? flag)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
