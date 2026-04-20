"use client";

import { useEffect, useState } from "react";
import type { GameState } from "@/lib/game/types";
import { ARCHETYPES } from "@/lib/game/scoring";
import ParcelGrid, { ParcelLegend } from "./ParcelGrid";
import { ACHIEVEMENT_BY_ID } from "@/lib/game/achievements";
import { OBJECTIVES_BY_ID, completedObjectives } from "@/lib/game/objectives";
import { ROLES, type RoleKey } from "@/lib/game/roles";
import { clearSave, appendLocalRun } from "@/lib/game/save";

export function EndScreen({
  state,
  onReplay,
  onLeaderboard,
  onMenu,
}: {
  state: GameState;
  onReplay: () => void;
  onLeaderboard: () => void;
  onMenu: () => void;
}) {
  const final = state.finalScore;
  const [submitting, setSubmitting] = useState(true);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    if (!final) return;
    // Game has ended - clear the in-progress save so the menu won't
    // offer to "continue" a finished game.
    clearSave();
    // Always log to local leaderboard for personal history, regardless
    // of whether the remote API call succeeds.
    appendLocalRun({
      display_name: state.displayName || "Anonymous",
      seed: state.seed,
      ended_year: state.year,
      total_score: final.total,
      equity_score: final.equity,
      heritage_score: final.heritage,
      growth_score: final.growth,
      sustainability_score: final.sustainability,
      archetype: final.archetype,
      decisions_made: state.playedCards.length,
      events_survived: state.resolvedEvents.length,
      notes_read: state.notesRead.size,
    });
    let cancelled = false;
    const payload = {
      display_name: state.displayName || "Anonymous",
      seed: state.seed,
      ended_year: state.year,
      total_score: final.total,
      equity_score: final.equity,
      heritage_score: final.heritage,
      growth_score: final.growth,
      sustainability_score: final.sustainability,
      archetype: final.archetype,
      decisions_made: state.playedCards.length,
      events_survived: state.resolvedEvents.length,
      notes_read: state.notesRead.size,
      achievements: Array.from(state.achievements),
      final_state: {
        scores: state.scores,
        flags: Array.from(state.flags),
        role: state.roleKey,
        objectives: state.objectives,
        completedObjectives: completedObjectives(state, state.objectives).map((o) => o.id),
      },
    };
    fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setRank(data.rank ?? null);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setSubmitting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [final, state]);

  if (!final) return null;
  const arch = ARCHETYPES[final.archetype];

  return (
    <div className="bg-cream py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-6">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Parkhaven Record &middot; 2040 &middot; Seed: {state.seed}
        </p>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <h1 className="font-display text-5xl text-forest md:text-7xl">{arch.name}</h1>
          <div className="flex items-baseline gap-4">
            <span className="font-display text-6xl font-bold text-rust md:text-7xl">{final.total}</span>
            <span className="font-display text-3xl text-forest">Rank {final.rank}</span>
          </div>
        </div>

        <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          {arch.blurb}
        </p>

        <div className="mt-10 border-l-4 border-rust pl-8 md:pl-12">
          <p className="font-display text-xl leading-snug text-forest md:text-2xl md:leading-snug">
            &ldquo;{arch.resident}&rdquo;
          </p>
          <p className="mt-4 font-body text-sm uppercase tracking-[0.2em] text-warm-gray">
            A Parkhaven resident, in your run as {state.displayName || "Anonymous"}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {[
            { label: "Equity", value: final.equity },
            { label: "Heritage", value: final.heritage },
            { label: "Growth", value: final.growth },
            { label: "Sustainability", value: final.sustainability },
          ].map((s) => (
            <div key={s.label} className="bg-cream p-4 md:p-6">
              <p className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">{s.label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-forest md:text-3xl">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-px grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          <div className="bg-cream p-4 md:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Bonus</p>
            <p className="mt-2 font-display text-xl font-bold text-rust">{final.bonus >= 0 ? "+" : ""}{final.bonus}</p>
          </div>
          <div className="bg-cream p-4 md:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Cards played</p>
            <p className="mt-2 font-display text-xl font-bold text-forest">{state.playedCards.length}</p>
          </div>
          <div className="bg-cream p-4 md:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Events survived</p>
            <p className="mt-2 font-display text-xl font-bold text-forest">{state.resolvedEvents.length}</p>
          </div>
          <div className="bg-cream p-4 md:p-6">
            <p className="font-body text-[10px] uppercase tracking-[0.25em] text-warm-gray">Notes read</p>
            <p className="mt-2 font-display text-xl font-bold text-forest">{state.notesRead.size}</p>
          </div>
        </div>

        {/* Final ward */}
        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Parkhaven, 2040
            </p>
            <div className="mt-4 rounded-sm border border-border bg-cream p-4 shadow-sm">
              <ParcelGrid parcels={state.parcels} />
            </div>
            <div className="mt-4">
              <ParcelLegend />
            </div>
          </div>

          <div className="md:col-span-5">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              The summary
            </p>
            <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
              {final.summary}
            </p>
          </div>
        </div>

        {/* Objectives */}
        {state.objectives.length > 0 && (
          <div className="mt-12 border-t border-border pt-8">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Your goals, settled
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {state.objectives.map((id) => {
                const o = OBJECTIVES_BY_ID.get(id);
                if (!o) return null;
                const done = o.test(state);
                return (
                  <div
                    key={id}
                    className={`rounded-sm border p-3 ${
                      done ? "border-forest bg-forest/5" : "border-border bg-cream-dark"
                    }`}
                  >
                    <p className={`font-display text-sm font-semibold ${done ? "text-forest" : "text-ink/55"}`}>
                      {done ? "Completed: " : "Missed: "}{o.name}
                    </p>
                    <p className="mt-1 font-body text-xs text-ink/65">{o.description}</p>
                    <p className={`mt-2 font-body text-xs font-semibold uppercase tracking-widest ${done ? "text-rust" : "text-warm-gray"}`}>
                      {done ? `+${o.reward} awarded` : `would have awarded +${o.reward}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Role played */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            You played as
          </p>
          <p className="mt-2 font-display text-2xl text-forest">
            {(ROLES[state.roleKey as RoleKey] ?? ROLES.alderman).name}
          </p>
          <p className="mt-1 font-body text-sm italic text-ink/65">
            {(ROLES[state.roleKey as RoleKey] ?? ROLES.alderman).mottoLine}
          </p>
        </div>

        {/* Achievements */}
        {state.achievements.size > 0 && (
          <div className="mt-12 border-t border-border pt-8">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Achievements unlocked
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {Array.from(state.achievements).map((id) => {
                const a = ACHIEVEMENT_BY_ID.get(id);
                if (!a) return null;
                return (
                  <div key={id} className="rounded-sm border border-amber-300 bg-amber-50 p-3">
                    <p className="font-display text-sm font-semibold text-amber-900">{a.name}</p>
                    <p className="mt-1 font-body text-xs text-amber-900/70">{a.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard rank */}
        <div className="mt-12 rounded-sm border border-border bg-cream-dark p-6 md:p-8">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Leaderboard
          </p>
          {submitting ? (
            <p className="mt-3 font-display text-xl text-forest">Submitting your score...</p>
          ) : rank ? (
            <p className="mt-3 font-display text-2xl text-forest md:text-3xl">
              You placed <span className="text-rust">#{rank}</span> on the global leaderboard.
            </p>
          ) : (
            <p className="mt-3 font-display text-xl text-forest">Score saved.</p>
          )}
          <p className="mt-2 font-body text-sm text-ink/65">
            Submitted as {state.displayName || "Anonymous"} on seed {state.seed}.
          </p>
        </div>

        {/* Run log */}
        <div className="mt-12 border-t border-border pt-10">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            What you did
          </p>
          <ul className="mt-6 space-y-3">
            {state.resolvedEvents.map((re, i) => (
              <li key={`re-${i}`} className="border-l-2 border-rust/40 pl-5 font-body text-sm text-ink/70">
                <span className="font-semibold text-forest">{re.year}</span> &middot; you {re.outcome}.
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-10 sm:flex-row sm:items-center">
          <button
            onClick={onReplay}
            className="inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Play again
          </button>
          <button
            onClick={onLeaderboard}
            className="inline-flex items-center justify-center rounded-sm border border-border bg-cream px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
          >
            See the leaderboard
          </button>
          <button
            onClick={onMenu}
            className="font-body text-sm font-semibold uppercase tracking-widest text-warm-gray hover:text-forest"
          >
            Main menu
          </button>
        </div>

        <p className="mt-12 max-w-[60ch] font-body text-sm italic leading-relaxed text-warm-gray">
          &ldquo;In 2040, someone else inherits what you built.&rdquo;
        </p>
      </div>
    </div>
  );
}
