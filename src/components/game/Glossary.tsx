"use client";

import { useState } from "react";
import { GLOSSARY } from "@/lib/game/glossary";

/**
 * Inline term that opens a popover with the definition. The first time
 * the user opens a popover for a given term, the parent component should
 * dispatch READ_NOTE to award knowledge.
 */
export function Term({
  term,
  onRead,
  variant = "inline",
}: {
  term: string;
  onRead: (term: string) => void;
  variant?: "inline" | "bare";
}) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[term];
  if (!entry) return <span>{term}</span>;

  function handleClick() {
    if (!open) onRead(term);
    setOpen(!open);
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === "bare"
            ? "underline decoration-rust decoration-dotted underline-offset-2 hover:text-rust"
            : "border-b border-dotted border-rust pb-px text-forest hover:text-rust"
        }
      >
        {entry.term}
      </button>
      {open && (
        <span
          className="absolute left-0 top-full z-50 mt-1 block w-72 rounded-sm border border-border bg-cream p-4 text-left shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <span className="block font-display text-base font-semibold text-forest">{entry.term}</span>
          <span className="mt-1 block font-body text-xs uppercase tracking-widest text-rust">
            {entry.era ?? "definition"}
          </span>
          <span className="mt-2 block font-body text-sm leading-relaxed text-ink/80">
            {entry.long}
          </span>
          {entry.source && (
            <span className="mt-3 block font-body text-xs italic text-warm-gray">
              Source: {entry.source}
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 block font-body text-xs uppercase tracking-widest text-rust hover:text-rust-dark"
          >
            Close
          </button>
        </span>
      )}
    </span>
  );
}

/** Render a paragraph of game text, replacing {Term} markers with Term components */
export function GameText({
  text,
  onRead,
  className = "",
}: {
  text: string;
  onRead: (term: string) => void;
  className?: string;
}) {
  const parts: (string | { term: string })[] = [];
  const re = /\{([A-Z][a-zA-Z0-9]*)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push({ term: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return (
    <span className={className}>
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <span key={i}>{p}</span>
        ) : (
          <Term key={i} term={p.term} onRead={onRead} />
        )
      )}
    </span>
  );
}
