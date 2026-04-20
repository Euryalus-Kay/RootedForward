"use client";

import { useState } from "react";
import { ROLES, type RoleKey } from "@/lib/game/roles";
import { OBJECTIVES_BY_ID } from "@/lib/game/objectives";
import type { GameState } from "@/lib/game/types";

export function PauseMenu({
  state,
  onResume,
  onRestart,
  onMenu,
  onSave,
}: {
  state: GameState;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onSave: () => void;
}) {
  const [mode, setMode] = useState<"main" | "confirm-restart" | "confirm-menu">("main");
  const role = ROLES[state.roleKey as RoleKey] ?? ROLES.alderman;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-cream shadow-2xl">
        <div className="border-b border-border bg-cream-dark px-6 py-4">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Paused &middot; year {state.year}
          </p>
          <h2 className="mt-1 font-display text-2xl text-forest">Pause menu</h2>
        </div>

        {mode === "main" && (
          <>
            <div className="px-6 py-5">
              <dl className="space-y-2 font-body text-sm">
                <Row label="Player" value={state.displayName} />
                <Row label="Role" value={role.name} />
                <Row label="Seed" value={state.seed} />
                <Row label="Cards played" value={state.playedCards.length.toString()} />
                <Row label="Events resolved" value={state.resolvedEvents.length.toString()} />
                <Row label="Notes read" value={state.notesRead.size.toString()} />
                {state.objectives.length > 0 && (
                  <div className="pt-2">
                    <dt className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">Goals</dt>
                    <dd className="mt-1 space-y-1">
                      {state.objectives.map((id) => {
                        const o = OBJECTIVES_BY_ID.get(id);
                        if (!o) return null;
                        const done = o.test(state);
                        return (
                          <p key={id} className={`font-body text-sm ${done ? "text-forest" : "text-ink/60"}`}>
                            {done ? "[done] " : "[  ] "}{o.name}
                          </p>
                        );
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex flex-col gap-2 border-t border-border bg-cream-dark/40 p-4">
              <button
                onClick={onResume}
                className="w-full rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Resume
              </button>
              <button
                onClick={() => { onSave(); }}
                className="w-full rounded-sm border border-border bg-cream px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
              >
                Save now
              </button>
              <button
                onClick={() => setMode("confirm-restart")}
                className="w-full rounded-sm border border-border bg-cream px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
              >
                Restart run
              </button>
              <button
                onClick={() => setMode("confirm-menu")}
                className="w-full rounded-sm border border-border bg-cream px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:bg-cream-dark"
              >
                Return to main menu
              </button>
            </div>
          </>
        )}

        {mode === "confirm-restart" && (
          <div className="p-6">
            <p className="font-display text-lg text-forest">Restart this run?</p>
            <p className="mt-3 font-body text-sm text-ink/70">
              Your current progress will be wiped. Your leaderboard submission
              from a completed run is unaffected.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={onRestart}
                className="flex-1 rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Yes, restart
              </button>
              <button
                onClick={() => setMode("main")}
                className="flex-1 rounded-sm border border-border bg-cream px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {mode === "confirm-menu" && (
          <div className="p-6">
            <p className="font-display text-lg text-forest">Back to main menu?</p>
            <p className="mt-3 font-body text-sm text-ink/70">
              Your run is autosaved. You can continue from the main menu
              whenever you want.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={onMenu}
                className="flex-1 rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Main menu
              </button>
              <button
                onClick={() => setMode("main")}
                className="flex-1 rounded-sm border border-border bg-cream px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/60 pb-1.5">
      <dt className="font-body text-xs uppercase tracking-widest text-warm-gray">{label}</dt>
      <dd className="font-body text-sm font-medium text-forest">{value}</dd>
    </div>
  );
}
