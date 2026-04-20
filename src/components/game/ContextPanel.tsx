"use client";

import { useState } from "react";
import { contextForYear } from "@/lib/game/historical-context";

export function ContextPanel({ year }: { year: number }) {
  const [open, setOpen] = useState(false);
  const ctx = contextForYear(year);
  return (
    <div className="rounded-sm border border-border bg-cream p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-baseline justify-between"
      >
        <div className="text-left">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
            Real history {ctx.fromYear} to {ctx.toYear}
          </p>
          <p className="mt-1 font-display text-base text-forest md:text-lg">{ctx.headline}</p>
        </div>
        <span className="font-body text-xs uppercase tracking-widest text-rust">
          {open ? "hide" : "more"}
        </span>
      </button>
      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="font-body text-sm leading-relaxed text-ink/75">{ctx.body}</p>
          <p className="font-body text-xs italic leading-relaxed text-warm-gray">
            {ctx.realChicago}
          </p>
        </div>
      )}
    </div>
  );
}
