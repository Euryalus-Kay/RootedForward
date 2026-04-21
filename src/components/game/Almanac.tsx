"use client";

/**
 * Almanac UI.
 *
 * The Almanac is a long-form reference library: chapter-by-chapter
 * deep dives into the historical context of the ward. Unlike the Codex
 * (which is biography/policy/neighborhood snippets), the Almanac is
 * narrative and contextual. Each chapter covers a theme or era with
 * multiple sections, pull-quotes, and source citations.
 */

import { useMemo, useState } from "react";
import { ALMANAC, totalSectionCount, type AlmanacChapter } from "@/lib/game/almanac";

export function Almanac({ onClose }: { onClose: () => void }) {
  const [activeChapter, setActiveChapter] = useState<string | null>(
    ALMANAC[0]?.id ?? null
  );

  const chapter = useMemo(
    () => ALMANAC.find((c) => c.id === activeChapter) ?? null,
    [activeChapter]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Parkhaven Almanac"
    >
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-forest p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              Almanac · {ALMANAC.length} chapters · {totalSectionCount()} sections
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              Parkhaven in Depth
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close almanac"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 font-display text-lg font-bold text-cream hover:bg-cream/25"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Table of contents */}
          <aside className="w-72 border-r border-border bg-cream-dark/30 overflow-y-auto">
            <ul className="divide-y divide-border">
              {ALMANAC.map((c, i) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveChapter(c.id)}
                    className={`block w-full p-4 text-left transition-colors ${
                      activeChapter === c.id
                        ? "bg-rust/15"
                        : "hover:bg-cream-dark/50"
                    }`}
                  >
                    <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-warm-gray">
                      Chapter {i + 1}
                    </p>
                    <p className="mt-1 font-display text-sm font-semibold text-forest">
                      {c.title}
                    </p>
                    <p className="mt-1 font-body text-[12px] text-ink/70 line-clamp-2">
                      {c.subtitle}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Detail */}
          <main className="flex-1 overflow-y-auto bg-cream p-6 md:p-10">
            {chapter ? <ChapterView chapter={chapter} /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function ChapterView({ chapter }: { chapter: AlmanacChapter }) {
  return (
    <article className="mx-auto max-w-prose">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
        Decade{chapter.decades.length === 1 ? "" : "s"} covered ·{" "}
        {chapter.decades.join(", ")}
      </p>
      <h3 className="mt-4 font-display text-4xl leading-tight text-forest md:text-5xl">
        {chapter.title}
      </h3>
      <p className="mt-3 font-body text-xl italic leading-relaxed text-ink/70">
        {chapter.subtitle}
      </p>

      <div className="mt-10 space-y-10">
        {chapter.sections.map((s, idx) => (
          <section key={idx}>
            <h4 className="font-display text-2xl text-forest">{s.heading}</h4>
            <div className="mt-4 space-y-4 font-body text-base leading-relaxed text-ink/80">
              {s.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {s.quote && (
              <blockquote className="mt-6 border-l-4 border-rust bg-rust/5 p-4">
                <p className="font-display text-lg italic text-forest">
                  &ldquo;{s.quote.text}&rdquo;
                </p>
                <p className="mt-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                  — {s.quote.attribution}
                </p>
              </blockquote>
            )}

            {s.source && (
              <p className="mt-4 font-body text-[11px] uppercase tracking-widest text-warm-gray">
                Source · {s.source}
              </p>
            )}
          </section>
        ))}
      </div>

      <div className="mt-16 border-t border-border pt-6">
        <p className="font-body text-xs text-warm-gray">
          Reached the end of this chapter. Use the table of contents on
          the left to move to another chapter. The Almanac will not affect
          your game state; close it to return to Parkhaven.
        </p>
      </div>
    </article>
  );
}
