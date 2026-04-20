"use client";

import { useState } from "react";
import { ResourceIcon, ScoreIcon, CategoryIcon, ParcelIcon } from "./icons";
import type { ParcelType } from "@/lib/game/types";

/**
 * The single polished How-to-Play overlay. Auto-opens on first game start,
 * reopenable via the "?" button in the HUD. Explains the whole game in
 * about ninety seconds of reading: what Parkhaven is, what HOLC meant,
 * what your resources do, how cards work, how events work, how you win.
 */

interface Section {
  title: string;
  render: () => React.ReactNode;
}

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);

  const sections: Section[] = [
    {
      title: "Quick start",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            You govern a fictional Chicago neighborhood from <span className="font-semibold text-forest">1940 to 2040</span>,
            in 5-year turns. Each turn you play <span className="font-semibold text-forest">policy cards</span>{" "}
            and react to <span className="font-semibold text-forest">historical events</span>. The choices add up to
            an archetype and a leaderboard rank.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-cream-dark/40 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-800">
                  <ResourceIcon resource="capital" size={16} />
                </div>
                <p className="font-display text-sm font-semibold text-forest">Capital</p>
              </div>
              <p className="mt-2 font-body text-[12px] text-ink/70">Money. For grants and construction.</p>
            </div>
            <div className="rounded-md border border-border bg-cream-dark/40 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rust/15 text-rust-dark">
                  <ResourceIcon resource="power" size={16} />
                </div>
                <p className="font-display text-sm font-semibold text-forest">Power</p>
              </div>
              <p className="mt-2 font-body text-[12px] text-ink/70">Political muscle. For tough fights.</p>
            </div>
            <div className="rounded-md border border-border bg-cream-dark/40 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-forest/15 text-forest">
                  <ResourceIcon resource="trust" size={16} />
                </div>
                <p className="font-display text-sm font-semibold text-forest">Trust</p>
              </div>
              <p className="mt-2 font-body text-[12px] text-ink/70">Community buy-in. For organizing.</p>
            </div>
            <div className="rounded-md border border-border bg-cream-dark/40 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
                  <ResourceIcon resource="knowledge" size={16} />
                </div>
                <p className="font-display text-sm font-semibold text-forest">Knowledge</p>
              </div>
              <p className="mt-2 font-body text-[12px] text-ink/70">Earned by reading glossary pop-ups.</p>
            </div>
          </div>

          <div className="mt-5 rounded-md bg-forest/5 p-4">
            <p className="font-display text-sm font-semibold text-forest">Each turn:</p>
            <ol className="mt-2 space-y-1.5 font-body text-[13px] text-ink/75">
              <li><span className="font-semibold text-rust">1.</span> Click cards to read them. Click again to play. Watch the ward map highlight where each card lands.</li>
              <li><span className="font-semibold text-rust">2.</span> Resolve any pop-up event by picking one of its options.</li>
              <li><span className="font-semibold text-rust">3.</span> Click <span className="font-semibold text-forest">Advance 5 years</span> to push time forward.</li>
            </ol>
          </div>

          <p className="mt-4 font-body text-[12px] italic text-warm-gray">
            The game autosaves. Press Esc any time to pause, save, or restart. Want the full story behind HOLC, redlining, and the rest? Use Next below.
          </p>
        </>
      ),
    },
    {
      title: "Parkhaven",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            You govern <span className="font-semibold text-forest">Parkhaven</span>,
            a fictional Chicago neighborhood. It is a 7-by-10 grid of{" "}
            <span className="font-semibold">70 parcels</span>. Each parcel is a
            block or a lot with a home, a shop, a school, a church, a vacant plot.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-ink/80">
            The game starts in <span className="font-semibold">1940</span> and
            runs to <span className="font-semibold">2040</span>. A century, in
            <span className="font-semibold"> 5-year turns</span>. You will make
            roughly twenty decisions over a 20-minute run.
          </p>
          <div className="mt-6 rounded-md border border-border bg-cream-dark/50 p-4">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
              The ward
            </p>
            <div className="mt-3 grid grid-cols-10 gap-[3px]">
              {Array.from({ length: 70 }).map((_, i) => {
                const row = Math.floor(i / 10);
                const color = row < 2 ? "#4A79A8" : row < 4 ? "#D4A83A" : "#B8373A";
                return <div key={i} className="aspect-square rounded-[2px] shadow-sm" style={{ backgroundColor: color }} />;
              })}
            </div>
            <p className="mt-3 font-body text-sm text-ink/75">
              The colors are <span className="font-semibold">HOLC grades</span>.
              Scroll to page 2 for what that means.
            </p>
          </div>
        </>
      ),
    },
    {
      title: "HOLC grades, redlining, and the colors",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            In 1940, a federal agency called the <span className="font-semibold text-forest">Home Owners&rsquo; Loan Corporation (HOLC)</span> graded
            every neighborhood in America A through D for mortgage lending.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-ink/80">
            The grade was officially about housing condition. In practice it
            was about race. Black neighborhoods almost always got a D and were
            <span className="font-semibold"> colored red on the map</span>. That is where
            the word <span className="italic">redlining</span> comes from.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-ink/80">
            The grade followed the block for decades. Banks refused mortgages
            in red areas even after redlining became illegal in 1968.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { g: "A", color: "#4F8A4A", desc: "Best. New, affluent, white-only.", imp: "FHA-backed loans, infrastructure, low insurance rates." },
              { g: "B", color: "#4A79A8", desc: "Still desirable.", imp: "Loans available, property values rise steadily." },
              { g: "C", color: "#D4A83A", desc: "Definitely declining.", imp: "Loans restricted. White-flight pressure begins." },
              { g: "D", color: "#B8373A", desc: "Hazardous (redlined).", imp: "No loans. Disinvestment. Contract sellers move in." },
            ].map((g) => (
              <div key={g.g} className="flex gap-3 rounded-md border border-border bg-cream-dark/30 p-3">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md text-2xl font-bold text-cream shadow-md"
                  style={{ backgroundColor: g.color }}
                >
                  {g.g}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-forest">{g.desc}</p>
                  <p className="mt-1 font-body text-[11px] leading-snug text-ink/70">{g.imp}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 font-body text-xs italic text-warm-gray">
            Source: Nelson, Winling et al., Mapping Inequality, University of
            Richmond Digital Scholarship Lab.
          </p>
        </>
      ),
    },
    {
      title: "Your four resources",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            You spend resources to play cards. Resources accumulate slowly
            each year. Different starting roles get different mixes.
          </p>
          <div className="mt-6 space-y-3">
            {[
              { k: "capital" as const, label: "Capital", desc: "Dollars you can spend on buildings, grants, and subsidies. Every role starts with some. Accrues every year." },
              { k: "power" as const, label: "Power", desc: "Political muscle. Needed for cards that fight zoning boards, speculators, or the mayor." },
              { k: "trust" as const, label: "Trust", desc: "Community buy-in. Earned by organizing. Spent on cards that ask residents to take risks." },
              { k: "knowledge" as const, label: "Knowledge", desc: "Earned by reading glossary entries during the game. Unlocks research-heavy cards." },
            ].map((r) => (
              <div key={r.k} className="flex items-start gap-4 rounded-md border border-border bg-cream-dark/30 p-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${
                  r.k === "capital" ? "bg-amber-100 text-amber-700"
                  : r.k === "power" ? "bg-rust/15 text-rust-dark"
                  : r.k === "trust" ? "bg-forest/15 text-forest"
                  : "bg-indigo-100 text-indigo-700"
                }`}>
                  <ResourceIcon resource={r.k} size={22} />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-forest">{r.label}</p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-ink/70">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "How to play a card",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            Each year you hold a hand of <span className="font-semibold">policy cards</span>.
            Every card represents a real lever from Chicago history: a zoning
            rule, a federal program, a community organizing push.
          </p>
          <ol className="mt-5 space-y-3 font-body text-sm text-ink/75">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">1</span>
              <span><span className="font-semibold text-forest">Click a card</span> to read the full description. Click it again (or click elsewhere) to deselect.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">2</span>
              <span>Check the <span className="font-semibold text-forest">costs</span> at the top (with resource icons). If you cannot afford it the card is dimmed.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">3</span>
              <span>Check the <span className="font-semibold text-forest">effects</span> at the bottom (Equity, Heritage, Growth, Sustainability). Positive values are forest-green. Negative are rust-red.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">4</span>
              <span>Click <span className="font-semibold text-forest">Play</span> when the card is selected. The effect applies immediately.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rust text-xs font-bold text-white">5</span>
              <span>Play as many cards as you can afford each turn. Then click <span className="font-semibold text-forest">Advance 5 years</span> to push time forward.</span>
            </li>
          </ol>
          <div className="mt-5 rounded-md border border-forest/25 bg-forest/5 p-4 font-body text-sm text-ink/75">
            <span className="font-semibold text-forest">Tip.</span> You don&rsquo;t
            have to spend all your resources each year. Saving up for a Rare
            or Legendary card can be worth it.
          </div>
        </>
      ),
    },
    {
      title: "Random events",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            Most years, a <span className="font-semibold text-forest">random event</span> fires.
            It is a real Chicago moment from that period: the Great Migration,
            a contract-buyer strike, the 1966 Chicago Freedom Movement, the
            Plan for Transformation, the 2013 CPS school closures.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-ink/80">
            An event presents you with a forced choice. You pick one option.
            Each option has different score and parcel consequences. No
            option is &ldquo;right.&rdquo;
          </p>
          <div className="mt-5 rounded-md border border-border bg-cream-dark/30 p-4">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-rust">
              Example
            </p>
            <p className="mt-2 font-display text-base font-semibold text-forest">
              Great Migration arrival (1940s)
            </p>
            <p className="mt-2 font-body text-sm text-ink/75">
              Twenty-eight Black families just arrived from Mississippi.
              Where do they go?
            </p>
            <div className="mt-3 space-y-2">
              <div className="rounded-sm border border-border bg-cream p-2.5 font-body text-[12px] text-ink/80">
                <span className="font-semibold text-forest">A.</span> Open the central blocks to them.
                <span className="ml-2 text-forest">(Equity +3, Heritage +2)</span>
              </div>
              <div className="rounded-sm border border-border bg-cream p-2.5 font-body text-[12px] text-ink/80">
                <span className="font-semibold text-forest">B.</span> Concentrate them in the south blocks.
                <span className="ml-2 text-rust-dark">(Equity -2, Heritage -1)</span>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Scoring and winning",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            There is no winning. At year 2040, the game calculates your final
            score from four axes plus bonuses and picks an <span className="font-semibold text-forest">archetype</span>.
          </p>
          <div className="mt-5 space-y-2.5">
            {[
              { k: "equity" as const, label: "Equity", desc: "How evenly your ward treats top vs bottom residents." },
              { k: "heritage" as const, label: "Heritage", desc: "How much of the original neighborhood character survives." },
              { k: "growth" as const, label: "Growth", desc: "New construction, jobs, and tax base." },
              { k: "sustainability" as const, label: "Sustainability", desc: "Green space, transit, climate resilience." },
            ].map((s) => (
              <div key={s.k} className="flex items-start gap-3 rounded-sm border border-border bg-cream-dark/30 p-3">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center text-forest">
                  <ScoreIcon score={s.k} size={16} />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-forest">{s.label}</p>
                  <p className="mt-0.5 font-body text-[12px] text-ink/70">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 font-body text-base leading-relaxed text-ink/80">
            Your final score lands you on the <span className="font-semibold text-forest">leaderboard</span> with a
            rank from D to S. Six archetypes are possible:{" "}
            <span className="italic">Reformer, Organizer, Caretaker, Developer, Speculator, Technocrat</span>.
          </p>
        </>
      ),
    },
    {
      title: "Autosave and pause",
      render: () => (
        <>
          <p className="font-body text-base leading-relaxed text-ink/80">
            The game <span className="font-semibold text-forest">autosaves</span> after every
            decision. Close the tab whenever you want. When you come back, the
            main menu will show a <span className="font-semibold">Continue</span> button with
            your player name, year, and seed.
          </p>
          <p className="mt-3 font-body text-base leading-relaxed text-ink/80">
            Press <kbd className="rounded-sm border border-border bg-cream-dark px-1.5 py-0.5 font-body text-xs font-semibold text-forest">Esc</kbd>{" "}
            at any time to open the pause menu. From there you can save,
            restart, or return to the main menu.
          </p>
          <p className="mt-5 font-body text-sm italic text-warm-gray">
            You can reopen this explainer any time via the{" "}
            <span className="rounded-sm border border-border bg-cream-dark px-1.5 font-body text-xs font-semibold text-forest">?</span>{" "}
            button in the top HUD.
          </p>
          <div className="mt-6 rounded-md border-2 border-rust bg-rust/5 p-5 text-center">
            <p className="font-display text-xl text-forest">You&rsquo;re ready.</p>
            <p className="mt-2 font-body text-sm text-ink/70">
              Step into 1940 and start drawing your lines.
            </p>
          </div>
        </>
      ),
    },
  ];

  const currentSection = sections[page];
  const isLast = page === sections.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-ink/80 backdrop-blur-sm md:items-center md:p-6">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden bg-cream shadow-2xl md:max-h-[90vh] md:rounded-lg md:border md:border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-forest to-forest-light px-6 py-4 text-cream md:px-8 md:py-5">
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust-light">
              How to play &middot; {page + 1} of {sections.length}
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              {currentSection.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">
          {currentSection.render()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border bg-cream-dark/30 px-4 py-3 md:px-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-sm px-4 py-2 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-cream-dark disabled:opacity-40"
          >
            &larr; Back
          </button>

          <div className="flex gap-1.5">
            {sections.map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === page ? "w-8 bg-rust" : "w-2 bg-border hover:bg-warm-gray-light"}`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onClose}
              className="rounded-sm bg-rust px-6 py-2 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Play &rarr;
            </button>
          ) : (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-sm bg-rust px-6 py-2 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Next &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
