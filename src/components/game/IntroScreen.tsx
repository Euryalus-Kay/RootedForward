"use client";

import { useState } from "react";

const TIPS = [
  "There is no winning. There are only the trade-offs you make.",
  "Every card cites a real Chicago source. Hover to see it.",
  "Knowledge is a resource. Read glossary entries to earn it.",
  "Cards rotate by era. The 1940 deck looks nothing like 2030.",
  "Random events are the historical pressure pushing on Parkhaven.",
  "Each seed is a different ward. Same seed, same starting layout.",
  "Some achievements only unlock if you skip the obvious moves.",
  "Speculators slowly drain memory from the parcels they own.",
  "Protected parcels survive transit announcements better.",
  "Three protected blocks at year 2000 changes the late-game completely.",
];

export function IntroScreen({
  onStart,
  onTutorial,
  onLeaderboard,
}: {
  onStart: (displayName: string, seed?: string) => void;
  onTutorial: () => void;
  onLeaderboard: () => void;
}) {
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));

  function handleStart() {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      alert("Pick a display name. It will appear on the leaderboard.");
      return;
    }
    onStart(trimmed, seed.trim() || undefined);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
        A Rooted Forward Game
      </p>
      <h1 className="mt-5 font-display text-5xl leading-[0.95] text-forest md:text-7xl">
        Build the Block
      </h1>
      <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
        You inherit a fictional Chicago ward in 1940. You have a hundred years
        and a deck of policy cards. Every year you make decisions, react to
        events, and watch the ward change. Every card and every event is
        drawn from the historical record.
      </p>
      <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/60">
        There is no win condition. There is a leaderboard, four sub-scores, and
        an archetype that emerges from how you played. Run it once. Run it ten
        times. The deeper you go, the more the lessons surface.
      </p>

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

        <label className="mt-4 block font-body text-sm font-medium text-ink">
          Seed (optional)
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            maxLength={60}
            placeholder="Leave blank for a fresh ward"
            className="mt-2 w-full rounded-sm border border-border bg-cream-dark/40 px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
          />
          <span className="mt-1 block font-body text-xs text-warm-gray">
            A teacher can give a class the same seed so everyone starts in the same Parkhaven.
          </span>
        </label>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={handleStart}
            className="inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Begin in 1940
          </button>
          <button
            onClick={onTutorial}
            className="inline-flex items-center justify-center rounded-sm border border-border bg-cream px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark"
          >
            How to play
          </button>
          <button
            onClick={onLeaderboard}
            className="font-body text-sm font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
          >
            View leaderboard
          </button>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
          Tip of the run
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
          The game depicts racial segregation, displacement, and policy violence.
          Quotations come from the historical record, including 1940 HOLC surveyor
          language. You can pause at any time.
        </p>
      </div>
    </div>
  );
}
