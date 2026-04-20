"use client";

import { useEffect, useState } from "react";
import { ROLE_LIST, type Role, type RoleKey } from "@/lib/game/roles";
import { OBJECTIVES, type Objective } from "@/lib/game/objectives";
import { readSaveSummary, type SaveSummary } from "@/lib/game/save";

const TIPS = [
  "There is no winning. Only the trade-offs you choose.",
  "Every card cites a real Chicago source. Hover to see it.",
  "Knowledge is a resource. Read glossary entries to earn it.",
  "Cards rotate by era. The 1940 deck looks nothing like 2030.",
  "Same seed, same starting ward. Share one with a friend and compare archetypes.",
  "Some achievements only unlock if you skip the obvious moves.",
  "Speculators slowly drain memory from the parcels they own.",
  "Factions watch what you do. Their meter matters by the end.",
  "Three protected blocks at year 2000 changes the late game completely.",
];

type ScreenMode = "menu" | "setup" | "role" | "objectives" | "seed";

interface StartConfig {
  displayName: string;
  seed?: string;
  roleKey: RoleKey;
  objectives: string[];
}

export function IntroScreen({
  onStart,
  onContinue,
  onTutorial,
  onLeaderboard,
}: {
  onStart: (cfg: StartConfig) => void;
  onContinue: () => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
}) {
  const [mode, setMode] = useState<ScreenMode>("menu");
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));

  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");
  const [roleKey, setRoleKey] = useState<RoleKey>("alderman");
  const [objectives, setObjectives] = useState<string[]>([]);

  useEffect(() => {
    setSaveSummary(readSaveSummary());
    // If the player clicked "Play this seed" from the leaderboard, the
    // seed is stashed in sessionStorage. Prefill and jump to setup.
    if (typeof window !== "undefined") {
      const replay = window.sessionStorage.getItem("buildTheBlock:replaySeed");
      if (replay) {
        setSeed(replay);
        window.sessionStorage.removeItem("buildTheBlock:replaySeed");
        setMode("setup");
      }
    }
  }, []);

  function toggleObjective(id: string) {
    setObjectives((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  }

  function handleStart() {
    if (!name.trim()) {
      alert("Pick a display name. It will appear on the leaderboard.");
      return;
    }
    onStart({
      displayName: name.trim(),
      seed: seed.trim() || undefined,
      roleKey,
      objectives,
    });
  }

  /* ========================================================== */
  /*  Main menu                                                  */
  /* ========================================================== */
  if (mode === "menu") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          A Rooted Forward Game
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[0.95] text-forest md:text-7xl">
          Build the Block
        </h1>
        <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
          You inherit a fictional Chicago ward in 1940. A hundred years pass.
          You make decisions, watch the ward change, react to events, and see
          the neighborhood you built.
        </p>
        <p className="mt-3 max-w-[55ch] font-body text-base leading-relaxed text-ink/60">
          Strategy game. Six starting roles. Twelve objectives. A deck of
          policy cards that rotates across four eras. A hundred decisions
          later, a leaderboard rank.
        </p>

        {/* Continue save banner */}
        {saveSummary?.exists && (
          <div className="mt-8 rounded-sm border-2 border-rust bg-rust/5 p-5 md:p-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              Saved run
            </p>
            <div className="mt-2 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
              <div>
                <p className="font-display text-xl text-forest md:text-2xl">
                  {saveSummary.displayName}&rsquo;s Parkhaven, year {saveSummary.year}
                </p>
                <p className="font-body text-xs text-warm-gray">
                  Seed: {saveSummary.seed} &middot; Saved {formatAgo(saveSummary.savedAt)}
                </p>
              </div>
              <button
                onClick={onContinue}
                className="mt-3 inline-flex items-center justify-center rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark md:mt-0"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            onClick={() => setMode("setup")}
            className="inline-flex items-center justify-center rounded-sm bg-forest px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light"
          >
            New game
          </button>
          <button
            onClick={onTutorial}
            className="inline-flex items-center justify-center rounded-sm border border-border bg-cream px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
          >
            How to play
          </button>
          <button
            onClick={onLeaderboard}
            className="inline-flex items-center justify-center rounded-sm border border-border bg-cream px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
          >
            Leaderboard
          </button>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Tip
          </p>
          <p className="mt-2 font-display text-lg italic text-forest">
            &ldquo;{TIPS[tipIdx]}&rdquo;
          </p>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Content notice
          </p>
          <p className="mt-2 max-w-[60ch] font-body text-sm leading-relaxed text-ink/65">
            The game depicts racial segregation, displacement, and policy
            violence. Quotations come from the historical record, including
            1940 HOLC surveyor language. You can pause at any time.
          </p>
        </div>
      </div>
    );
  }

  /* ========================================================== */
  /*  Setup (name + seed + advance to role)                      */
  /* ========================================================== */
  if (mode === "setup") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <button
          onClick={() => setMode("menu")}
          className="mb-6 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray hover:text-rust"
        >
          &larr; Back
        </button>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Step 1 of 3
        </p>
        <h2 className="mt-3 font-display text-4xl text-forest md:text-5xl">
          Who are you, and where are you starting?
        </h2>

        <div className="mt-10 rounded-md border border-border bg-cream p-6 shadow-sm md:p-8">
          <label className="block font-body text-sm font-medium text-ink">
            Display name <span className="text-rust">*</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Your handle for the leaderboard"
              className="mt-2 w-full rounded-sm border border-border bg-cream-dark/40 px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
          </label>

          <label className="mt-5 block font-body text-sm font-medium text-ink">
            Seed <span className="font-normal text-warm-gray">(optional)</span>
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              maxLength={60}
              placeholder="Leave blank for a random ward"
              className="mt-2 w-full rounded-sm border border-border bg-cream-dark/40 px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
            />
            <span className="mt-1 block font-body text-xs text-warm-gray">
              Same seed = same starting ward. Share one with a friend and compare archetypes.
            </span>
          </label>

          <button
            onClick={() => {
              if (!name.trim()) { alert("Pick a display name."); return; }
              setMode("role");
            }}
            className="mt-8 inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Next: Pick a role
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================== */
  /*  Role selection                                             */
  /* ========================================================== */
  if (mode === "role") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <button
          onClick={() => setMode("setup")}
          className="mb-6 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray hover:text-rust"
        >
          &larr; Back
        </button>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Step 2 of 3
        </p>
        <h2 className="mt-3 font-display text-4xl text-forest md:text-5xl">
          Who are you in 1940?
        </h2>
        <p className="mt-3 max-w-[60ch] font-body text-base text-ink/70">
          Each role begins with a different mix of capital, political power,
          community trust, and knowledge. Roles also start with signature
          cards that shape the early game.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROLE_LIST.map((r) => (
            <RoleCard key={r.key} role={r} selected={roleKey === r.key} onSelect={() => setRoleKey(r.key)} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => setMode("objectives")}
            className="inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Next: Pick objectives
          </button>
          <button
            onClick={() => {
              setObjectives([]);
              handleStart();
            }}
            className="font-body text-sm font-semibold uppercase tracking-widest text-warm-gray hover:text-forest"
          >
            Skip objectives and begin
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================== */
  /*  Objective selection                                        */
  /* ========================================================== */
  if (mode === "objectives") {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <button
          onClick={() => setMode("role")}
          className="mb-6 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray hover:text-rust"
        >
          &larr; Back
        </button>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Step 3 of 3
        </p>
        <h2 className="mt-3 font-display text-4xl text-forest md:text-5xl">
          Pick up to three goals.
        </h2>
        <p className="mt-3 max-w-[60ch] font-body text-base text-ink/70">
          Goals are optional. Completing them grants bonus score at the end.
          Skipping all of them is fine; the game plays the same either way.
        </p>
        <p className="mt-2 font-body text-xs text-warm-gray">
          Selected: {objectives.length} / 3
        </p>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o) => (
            <ObjectiveCard
              key={o.id}
              objective={o}
              selected={objectives.includes(o.id)}
              canSelect={objectives.length < 3 || objectives.includes(o.id)}
              onToggle={() => toggleObjective(o.id)}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center rounded-sm bg-rust px-10 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Begin in 1940
          </button>
          <button
            onClick={() => { setObjectives([]); handleStart(); }}
            className="font-body text-sm font-semibold uppercase tracking-widest text-warm-gray hover:text-forest"
          >
            Skip goals and begin
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function RoleCard({ role, selected, onSelect }: { role: Role; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`group flex h-full flex-col rounded-md border-2 bg-cream p-5 text-left transition-all ${
        selected ? "border-rust shadow-lg" : "border-border hover:border-rust/50 hover:shadow-md"
      }`}
    >
      <h3 className="font-display text-xl text-forest">{role.name}</h3>
      <p className="mt-1 font-body text-xs font-medium italic text-warm-gray">{role.tagline}</p>
      <p className="mt-4 font-body text-sm leading-relaxed text-ink/70">{role.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {Object.entries(role.bonus).map(([k, v]) => (
          <span key={k} className={`rounded-sm px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-widest ${
            (v as number) >= 0 ? "bg-forest/10 text-forest" : "bg-rust/15 text-rust-dark"
          }`}>
            {k} {(v as number) >= 0 ? "+" : ""}{v}
          </span>
        ))}
        {role.extraDraw ? (
          <span className="rounded-sm bg-amber-100 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-widest text-amber-900">
            +{role.extraDraw} draw
          </span>
        ) : null}
        {role.noteBonus ? (
          <span className="rounded-sm bg-amber-100 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-widest text-amber-900">
            +{role.noteBonus} notes
          </span>
        ) : null}
      </div>
      <p className="mt-auto pt-4 font-body text-xs italic text-warm-gray">
        &ldquo;{role.mottoLine}&rdquo;
      </p>
    </button>
  );
}

function ObjectiveCard({
  objective,
  selected,
  canSelect,
  onToggle,
}: {
  objective: Objective;
  selected: boolean;
  canSelect: boolean;
  onToggle: () => void;
}) {
  const difficultyColor =
    objective.difficulty === "easy" ? "text-forest"
    : objective.difficulty === "medium" ? "text-amber-800"
    : "text-rust";
  return (
    <button
      onClick={onToggle}
      disabled={!canSelect}
      className={`group flex h-full flex-col rounded-sm border-2 bg-cream p-4 text-left transition-all ${
        selected ? "border-rust shadow-md" : canSelect ? "border-border hover:border-rust/40" : "border-border opacity-50"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <h4 className="font-display text-base text-forest">{objective.name}</h4>
        <span className={`font-body text-[10px] font-semibold uppercase tracking-widest ${difficultyColor}`}>
          {objective.difficulty}
        </span>
      </div>
      <p className="mt-2 font-body text-sm leading-snug text-ink/65">{objective.description}</p>
      <p className="mt-auto pt-3 font-body text-xs font-semibold uppercase tracking-widest text-rust">
        +{objective.reward} bonus
      </p>
    </button>
  );
}

function formatAgo(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const m = Math.floor(delta / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
