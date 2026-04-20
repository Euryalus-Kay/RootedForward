"use client";

import { useState } from "react";
import type { DriftLine } from "@/lib/game/state";

/**
 * Compact horizontal strip that sits directly under the top HUD.
 * Always visible, no scrolling needed. Click "details" to expand the
 * full panel inline. Each chip names a compounding decision and shows
 * its per-turn deltas in shorthand.
 */
export function LastingEffectsStrip({ lines }: { lines: DriftLine[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border bg-cream p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
          Lasting effects
        </span>
        {lines.length === 0 ? (
          <span className="font-body text-[11px] italic text-warm-gray">
            None yet. Cards like &ldquo;Approve a 6-lane expressway&rdquo; or &ldquo;Add 300 police officers&rdquo; add compounding effects here.
          </span>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {lines.map((d) => (
                <Chip key={d.flag} d={d} />
              ))}
            </div>
            <button
              onClick={() => setOpen((o) => !o)}
              className="ml-auto font-body text-[10px] font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
            >
              {open ? "Hide details" : "Details"}
            </button>
          </>
        )}
      </div>

      {open && lines.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-border pt-3">
          {lines.map((d) => (
            <li key={d.flag} className="flex items-start justify-between gap-3">
              <span className="font-body text-[12px] text-ink/80">{d.description}</span>
              <span className="flex flex-shrink-0 flex-wrap items-center justify-end gap-x-2 text-right font-body text-[11px] font-semibold">
                {d.equity !== 0 && <span className={d.equity > 0 ? "text-forest" : "text-rust-dark"}>Equity {d.equity > 0 ? "+" : ""}{d.equity}</span>}
                {d.heritage !== 0 && <span className={d.heritage > 0 ? "text-forest" : "text-rust-dark"}>Heritage {d.heritage > 0 ? "+" : ""}{d.heritage}</span>}
                {d.growth !== 0 && <span className={d.growth > 0 ? "text-forest" : "text-rust-dark"}>Growth {d.growth > 0 ? "+" : ""}{d.growth}</span>}
                {d.sustainability !== 0 && <span className={d.sustainability > 0 ? "text-forest" : "text-rust-dark"}>Sustain. {d.sustainability > 0 ? "+" : ""}{d.sustainability}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ d }: { d: DriftLine }) {
  // Best-effort short label from the description
  const short = d.description
    .replace(/^(Expressway you approved is still polluting|Tax abatement is starving the school fund|Fast-track luxury permits are pushing rents up|Heavy policing is eroding community trust|TIF without affordable allocation|Preservation overlays still working|Transit station displacing residents|CHA towers you built keep deteriorating)/, (m) => m)
    .split(" ").slice(0, 4).join(" ");
  const positive = d.equity + d.heritage + d.growth + d.sustainability >= 0;
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] font-medium ${
        positive ? "bg-forest/15 text-forest" : "bg-rust/15 text-rust-dark"
      }`}
      title={d.description}
    >
      <span>{short}</span>
      <span className="font-bold">
        {d.equity !== 0 && <>E{d.equity > 0 ? "+" : ""}{d.equity} </>}
        {d.heritage !== 0 && <>H{d.heritage > 0 ? "+" : ""}{d.heritage} </>}
        {d.growth !== 0 && <>G{d.growth > 0 ? "+" : ""}{d.growth} </>}
        {d.sustainability !== 0 && <>Su{d.sustainability > 0 ? "+" : ""}{d.sustainability}</>}
      </span>
    </span>
  );
}

/**
 * The original full-width version. Still exported in case we want it
 * back, but the strip is now the primary surface.
 */
export function LastingEffects({ lines }: { lines: DriftLine[] }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-cream p-4 shadow-sm">
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
        Lasting effects of earlier decisions
      </p>
      <p className="mt-1 font-body text-[11px] text-warm-gray">
        Some cards leave compounding effects that hit your scores every single turn until 2040. They show up here.
      </p>
      {lines.length === 0 ? (
        <p className="mt-3 rounded-sm border border-dashed border-border bg-cream-dark/30 p-3 font-body text-[11px] italic text-warm-gray">
          No lasting effects yet. Cards like &ldquo;Approve a 6-lane expressway,&rdquo; &ldquo;Build a 16-story public housing tower,&rdquo; or &ldquo;Add 300 police officers&rdquo; will start adding lines here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lines.map((d) => (
            <li key={d.flag} className="flex items-start justify-between gap-3 border-l-2 border-rust/50 pl-3">
              <span className="font-body text-[12px] text-ink/80">{d.description}</span>
              <span className="flex flex-shrink-0 flex-wrap items-center justify-end gap-x-2 text-right font-body text-[11px] font-semibold">
                {d.equity !== 0 && <span className={d.equity > 0 ? "text-forest" : "text-rust-dark"}>Equity {d.equity > 0 ? "+" : ""}{d.equity}</span>}
                {d.heritage !== 0 && <span className={d.heritage > 0 ? "text-forest" : "text-rust-dark"}>Heritage {d.heritage > 0 ? "+" : ""}{d.heritage}</span>}
                {d.growth !== 0 && <span className={d.growth > 0 ? "text-forest" : "text-rust-dark"}>Growth {d.growth > 0 ? "+" : ""}{d.growth}</span>}
                {d.sustainability !== 0 && <span className={d.sustainability > 0 ? "text-forest" : "text-rust-dark"}>Sustain. {d.sustainability > 0 ? "+" : ""}{d.sustainability}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
