"use client";

/**
 * Strategy Panel.
 *
 * Mid-game surface that shows the player which strategic arcs are
 * already complete, which are close (one or two flags away), and
 * which are still fully open. The goal is to make the otherwise
 * invisible flag-system legible, so players can see that their
 * early choices are building toward a late-game reward.
 *
 * Does not affect game state.
 */

import { useMemo, useState } from "react";
import type { GameState } from "@/lib/game/types";
import { SYNERGIES, checkSynergies } from "@/lib/game/synergy";
import { FLAGS, type FlagDef } from "@/lib/game/flags";
import { computeStrategyPressure } from "@/lib/game/strategy-pressure";

export function StrategyPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [tab, setTab] = useState<"pressure" | "combos" | "flags">("pressure");

  const { fired } = useMemo(() => checkSynergies(state), [state]);
  const firedSet = useMemo(() => new Set(fired.map((f) => f.id)), [fired]);
  const flagList = useMemo(
    () => FLAGS.filter((f) => state.flags.has(f.key)),
    [state.flags]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Strategy panel"
    >
      <div className="flex h-full max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-forest p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              Strategy
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              How your decisions compound
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close strategy"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 font-display text-lg font-bold text-cream hover:bg-cream/25"
          >
            ×
          </button>
        </div>

        <div className="flex border-b border-border bg-cream-dark/40">
          <TabBtn label="Pressure" active={tab === "pressure"} onClick={() => setTab("pressure")} />
          <TabBtn label={`Strategic arcs (${fired.length}/${SYNERGIES.length})`} active={tab === "combos"} onClick={() => setTab("combos")} />
          <TabBtn label={`Active flags (${flagList.length})`} active={tab === "flags"} onClick={() => setTab("flags")} />
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {tab === "pressure" ? (
            <PressureView state={state} />
          ) : tab === "combos" ? (
            <CombosView state={state} firedSet={firedSet} />
          ) : (
            <FlagsView flagList={flagList} />
          )}
        </div>
      </div>
    </div>
  );
}

function PressureView({ state }: { state: GameState }) {
  const report = computeStrategyPressure(state);
  const gap = report.marketHeat - report.residentShield;
  return (
    <div className="space-y-6">
      <section className="rounded-sm border border-border bg-cream-dark/30 p-4">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-rust">
          Next-turn forecast
        </p>
        <p className="mt-2 font-display text-2xl text-forest">
          {gap >= 16
            ? "Growth is outrunning protection."
            : gap <= -16
              ? "Residents can absorb the next wave."
              : "The next turn is a knife-edge."}
        </p>
        <p className="mt-2 max-w-[68ch] font-body text-sm leading-relaxed text-ink/70">
          Market heat rises from land values, speculative ownership, recent growth plays,
          TIFs, transit, and luxury approvals. Resident shield rises from trust,
          organizing, protected parcels, land trusts, tenant law, and community benefits.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {report.meters.map((meter) => (
          <div key={meter.key} className="rounded-sm border border-border bg-cream p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display text-lg text-forest">{meter.label}</p>
              <p className="font-display text-3xl text-rust">{meter.value}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-dark">
              <div
                className={`h-full rounded-full ${
                  meter.tone === "danger"
                    ? "bg-rust"
                    : meter.tone === "warn"
                      ? "bg-amber-500"
                      : meter.tone === "good"
                        ? "bg-forest"
                        : "bg-warm-gray"
                }`}
                style={{ width: `${meter.value}%` }}
              />
            </div>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">{meter.description}</p>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-2 rounded-sm border-l-2 border-rust bg-rust/5 p-4 font-body text-sm text-ink/75 md:grid-cols-4">
        <PressureStat label="Vulnerable parcels" value={report.vulnerableParcels} />
        <PressureStat label="Protected parcels" value={report.protectedParcels} />
        <PressureStat label="Speculator parcels" value={report.speculatorParcels} />
        <PressureStat label="Hit by displacement" value={report.displacementParcels} />
      </section>
    </div>
  );
}

function PressureStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">{label}</p>
      <p className="mt-1 font-display text-2xl text-forest">{value}</p>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 text-center font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
        active ? "border-b-2 border-rust bg-cream text-forest" : "text-warm-gray hover:bg-cream/40"
      }`}
    >
      {label}
    </button>
  );
}

function CombosView({ state, firedSet }: { state: GameState; firedSet: Set<string> }) {
  /* Bucket combos into: fired, close, open. "Close" is a best-effort
     heuristic — any combo whose test depends on flags we have most of. */
  const fired = SYNERGIES.filter((s) => firedSet.has(s.id));
  const rest = SYNERGIES.filter((s) => !firedSet.has(s.id));

  return (
    <div className="space-y-6">
      {fired.length > 0 && (
        <section>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-forest">
            Locked in · will award at year 2040
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {fired.map((s) => (
              <div key={s.id} className="rounded-sm border-2 border-forest/50 bg-forest/10 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-forest">✓ {s.name}</p>
                  <span className="font-body text-xs font-semibold uppercase tracking-widest text-rust">
                    +{s.bonus}
                  </span>
                </div>
                <p className="mt-1 font-body text-xs text-ink/75">{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
          Open arcs · still possible
        </p>
        <p className="mt-1 font-body text-xs italic text-warm-gray">
          Play cards that set the flags these arcs need. Each arc rewards the arc, not individual cards.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {rest.map((s) => (
            <div key={s.id} className="rounded-sm border border-border bg-cream-dark/30 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-sm font-semibold text-ink/70">{s.name}</p>
                <span className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                  +{s.bonus} potential
                </span>
              </div>
              <p className="mt-1 font-body text-xs text-ink/65">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-sm border-l-2 border-rust bg-rust/5 p-4">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-rust">
          Year {state.year} · Running bonus
        </p>
        <p className="mt-2 font-body text-sm text-ink/75">
          You have secured <span className="font-display font-bold text-forest">+{fired.reduce((n, s) => n + s.bonus, 0)}</span>{" "}
          points from strategic arcs so far. Play more cards to unlock
          additional arcs before year 2040.
        </p>
      </section>
    </div>
  );
}

function FlagsView({ flagList }: { flagList: FlagDef[] }) {
  const grouped = new Map<string, FlagDef[]>();
  for (const f of flagList) {
    const key = f.group ?? "other";
    const arr = grouped.get(key) ?? [];
    arr.push(f);
    grouped.set(key, arr);
  }

  const groupLabels: Record<string, string> = {
    development: "Development & displacement",
    preservation: "Preservation",
    "equity-tools": "Equity tools",
    climate: "Climate",
    displacement: "Displacement",
    "public-housing": "Public housing",
    historical: "Historical fair-housing work",
    other: "Other",
  };

  if (flagList.length === 0) {
    return (
      <div className="mx-auto max-w-prose pt-8 text-center">
        <p className="font-display text-xl text-forest">No active flags yet.</p>
        <p className="mt-4 font-body text-sm text-ink/65">
          Many cards set a &ldquo;flag&rdquo; when played — a persistent
          consequence that bites every turn for the rest of the game.
          Play a card like &ldquo;Approve a 6-lane expressway&rdquo;,
          &ldquo;Charter a Community Land Trust&rdquo;, or
          &ldquo;Pass a reparations ordinance&rdquo; and it will show up
          here with its compounding per-turn effects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([group, flags]) => (
        <section key={group}>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
            {groupLabels[group] ?? group}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {flags.map((f) => {
              const d = f.drift;
              return (
                <div
                  key={f.key}
                  className={`rounded-sm border p-3 ${
                    f.tone === "positive"
                      ? "border-forest/30 bg-forest/5"
                      : f.tone === "negative"
                      ? "border-rust/30 bg-rust/5"
                      : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`font-display text-sm font-semibold ${
                      f.tone === "positive" ? "text-forest" : f.tone === "negative" ? "text-rust-dark" : "text-amber-900"
                    }`}>
                      {f.label}
                    </p>
                    <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
                      per turn
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-ink/70">{f.description}</p>
                  <p className="mt-2 font-body text-xs font-semibold">
                    {d.equity ? <span className={d.equity > 0 ? "mr-2 text-forest" : "mr-2 text-rust-dark"}>E{d.equity > 0 ? "+" : ""}{d.equity}</span> : null}
                    {d.heritage ? <span className={d.heritage > 0 ? "mr-2 text-forest" : "mr-2 text-rust-dark"}>H{d.heritage > 0 ? "+" : ""}{d.heritage}</span> : null}
                    {d.growth ? <span className={d.growth > 0 ? "mr-2 text-forest" : "mr-2 text-rust-dark"}>G{d.growth > 0 ? "+" : ""}{d.growth}</span> : null}
                    {d.sustainability ? <span className={d.sustainability > 0 ? "text-forest" : "text-rust-dark"}>Su{d.sustainability > 0 ? "+" : ""}{d.sustainability}</span> : null}
                    {!d.equity && !d.heritage && !d.growth && !d.sustainability ? (
                      <span className="text-warm-gray">no direct drift</span>
                    ) : null}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
