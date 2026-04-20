"use client";

const STEPS = [
  {
    title: "The ward",
    body:
      "Parkhaven is 70 parcels in a 7-by-10 grid. Each parcel has a HOLC grade, an owner, residents, condition, and value. Hover over any parcel to see its details.",
  },
  {
    title: "Resources",
    body:
      "You have four resources: Capital (money), Power (political muscle), Trust (community buy-in), and Knowledge. Resources accrue each year and you spend them to play cards.",
  },
  {
    title: "Cards",
    body:
      "Each year you draw 2 new cards. Cards are policies, programs, ordinances, or projects you can enact. Cards rotate with the era. The 1940 deck is mostly redlining and segregation tools. The 2030 deck has TIF, ARO, and a Red Line Extension.",
  },
  {
    title: "Events",
    body:
      "Random events fire most years. Each is a real Chicago moment: the Great Migration, a contract-buyer strike, the Plan for Transformation, the 2013 school closures. You choose how to respond. Each option has different consequences.",
  },
  {
    title: "Glossary",
    body:
      "Underlined terms in cards and events open glossary popovers. The first time you read each entry you earn +1 Knowledge, which unlocks deeper cards. There is no shortcut to the glossary; you have to be curious.",
  },
  {
    title: "Scoring",
    body:
      "Four hidden axes track the run: Equity, Heritage, Growth, Sustainability. Plus bonuses for protected parcels, land trusts, transit, and notes read. Penalties for speculator-owned parcels and CHA towers.",
  },
  {
    title: "Archetype",
    body:
      "At the end of 2040, your score profile picks one of six archetypes: Reformer, Caretaker, Developer, Speculator, Organizer, or Technocrat. There is no good ending. Each archetype has its own resident voice in the end-screen.",
  },
  {
    title: "Leaderboard",
    body:
      "Your final score posts to the leaderboard under the display name you picked. The same seed gives the same starting layout, so a teacher can have a class run the same Parkhaven and compare their archetypes.",
  },
];

export function Tutorial({ step, onAdvance, onSkip }: { step: number; onAdvance: () => void; onSkip: () => void }) {
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const last = step >= STEPS.length - 1;
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
        Tutorial &middot; {Math.min(step + 1, STEPS.length)} of {STEPS.length}
      </p>
      <h2 className="mt-4 font-display text-4xl leading-tight text-forest md:text-5xl">{cur.title}</h2>
      <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
        {cur.body}
      </p>
      <div className="mt-10 flex gap-3">
        <button
          onClick={onAdvance}
          className="inline-flex items-center justify-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          {last ? "Begin in 1940" : "Continue"}
        </button>
        <button
          onClick={onSkip}
          className="font-body text-sm font-semibold uppercase tracking-widest text-warm-gray hover:text-forest"
        >
          Skip tutorial
        </button>
      </div>

      {/* Progress dots */}
      <div className="mt-12 flex gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full ${i <= step ? "bg-rust" : "bg-cream-dark"}`}
          />
        ))}
      </div>
    </div>
  );
}
