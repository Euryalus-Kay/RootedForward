"use client";
/* ------------------------------------------------------------------ */
/*  About this exhibit, the final section. Who made it, how the        */
/*  figures are sourced, and the bibliography generated from the       */
/*  fact registry: every unique source in data/exhibit/facts.json,     */
/*  de-duplicated and alphabetized, as a readable two-column           */
/*  reference list.                                                    */
/* ------------------------------------------------------------------ */
import { useMemo } from "react";
import { allFacts } from "@/lib/exhibit/facts";
import type { FactSource } from "@/lib/exhibit/types";

interface BibEntry {
  title: string;
  author?: string;
  year?: number;
  url?: string;
}

function keyOf(s: FactSource): string {
  return [s.title, s.author ?? "", s.year ?? ""].join("|");
}

function collectSources(): BibEntry[] {
  const seen = new Map<string, BibEntry>();
  for (const f of allFacts()) {
    for (const s of [f.source, ...(f.secondarySources ?? [])]) {
      if (!s?.title) continue;
      const k = keyOf(s);
      if (!seen.has(k)) {
        seen.set(k, { title: s.title, author: s.author, year: s.year, url: s.url });
      } else if (!seen.get(k)!.url && s.url) {
        seen.get(k)!.url = s.url;
      }
    }
  }
  return [...seen.values()].sort((a, b) =>
    (a.author ?? a.title).localeCompare(b.author ?? b.title)
  );
}

export default function AboutPanel() {
  const sources = useMemo(() => collectSources(), []);

  return (
    <section
      id="about"
      data-testid="about-panel"
      className="scroll-mt-8 border-t border-exh-ink/15 py-14 md:py-20"
    >
      <header className="mb-8">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
          Colophon
        </p>
        <h2 className="mt-3 font-display text-3xl text-exh-ink md:text-4xl">About this exhibit</h2>
        <div className="mt-6 h-px w-16 bg-exh-ink/30" aria-hidden="true" />
      </header>

      <div className="max-w-[65ch] space-y-6">
        <div>
          <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
            Who made it
          </p>
          <p className="mt-2 font-display text-lg leading-[1.75] text-exh-ink">
            Rooted Forward, a youth-led Chicago nonprofit documenting racial inequity in American
            cities through walking tours, podcasts, and community storytelling.
          </p>
        </div>
        <div>
          <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
            Method
          </p>
          <p className="mt-2 font-display text-lg leading-[1.75] text-exh-ink">
            Every figure on these pages resolves to a sourced fact registry, and every number
            carries its citation where it appears. The documents shown are the real ones or are
            absent, never reconstructed.
          </p>
        </div>
      </div>

      <div className="mt-12">
        <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Sources
        </p>
        <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-exh-ink-soft">
          The <span className="exh-mono">{sources.length}</span> works and records behind the fact
          registry, alphabetized.
        </p>
        <ul
          data-testid="bibliography"
          className="mt-5 gap-x-10 space-y-3 sm:columns-2 sm:space-y-0"
        >
          {sources.map((s) => (
            <li
              key={keyOf(s)}
              data-testid="bib-entry"
              className="break-inside-avoid pb-3 text-sm leading-snug text-exh-ink"
            >
              {s.author ? <span>{s.author}. </span> : null}
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-exh-ink/40 underline-offset-2 hover:decoration-exh-ink"
                >
                  {s.title}
                </a>
              ) : (
                <span>{s.title}</span>
              )}
              {s.year ? <span className="exh-mono text-exh-ink-soft"> ({s.year})</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
