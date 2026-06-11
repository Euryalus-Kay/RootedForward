"use client";

/**
 * Decade Overlay. Shown at the start of each new decade (every 10
 * years). Briefs the player on national, Chicago, and Parkhaven-level
 * context for the upcoming decade. Dismiss to continue play.
 *
 * The overlay is informational; it does not affect mechanics.
 */

import { useState, useEffect } from "react";
import { decadeSummaryForYear, type DecadeSummary } from "@/lib/game/decade-summaries";

const DISMISSED_KEY = "buildTheBlock:decadesSeen:v1";

export function DecadeOverlay({
  year,
  onClose,
  force,
}: {
  year: number;
  onClose: () => void;
  force?: boolean;
}) {
  const [summary, setSummary] = useState<DecadeSummary | null>(null);

  useEffect(() => {
    const s = decadeSummaryForYear(year);
    if (!s) {
      onClose();
      return;
    }
    if (!force) {
      try {
        const seen = JSON.parse(
          typeof window === "undefined" ? "[]" : window.localStorage.getItem(DISMISSED_KEY) ?? "[]"
        );
        if (Array.isArray(seen) && seen.includes(s.startYear)) {
          onClose();
          return;
        }
      } catch {}
    }
    setSummary(s);
  }, [year, onClose, force]);

  function handleDismiss() {
    if (!summary) {
      onClose();
      return;
    }
    try {
      const seen = JSON.parse(
        typeof window === "undefined"
          ? "[]"
          : window.localStorage.getItem(DISMISSED_KEY) ?? "[]"
      );
      const next = Array.isArray(seen) ? [...seen, summary.startYear] : [summary.startYear];
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {}
    onClose();
  }

  if (!summary) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        <div className="flex items-start justify-between border-b border-border bg-rust p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              New decade
            </p>
            <h2 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
              {summary.title}
            </h2>
            <p className="mt-1 font-body text-sm italic text-cream/80">
              {summary.subtitle}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss decade summary"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/20 font-display text-lg font-bold text-cream hover:bg-cream/30"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6 md:p-8">
          <Section heading="National" body={summary.national} />
          <Section heading="Chicago" body={summary.chicago} />
          <Section heading="Parkhaven" body={summary.parkhaven} />

          {summary.watchFor.length > 0 && (
            <div className="rounded-sm border-l-2 border-rust bg-rust/5 p-4">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-rust">
                Watch for
              </p>
              <ul className="mt-2 space-y-1 font-body text-sm text-ink/80">
                {summary.watchFor.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rust" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-border bg-cream-dark/40 p-4">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center rounded-sm bg-forest px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-cream hover:bg-forest-light"
          >
            Continue into {summary.startYear}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
        {heading}
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-ink/80">
        {body}
      </p>
    </div>
  );
}
