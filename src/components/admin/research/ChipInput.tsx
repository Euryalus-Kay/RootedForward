"use client";

/* ------------------------------------------------------------------ */
/*  ChipInput                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Multi-value text chip input used for authors, reviewers, focus    */
/*  areas, related tour slugs.                                         */
/*                                                                     */
/*  - Enter or comma commits a chip.                                   */
/*  - Backspace on an empty input removes the most recent chip.       */
/*  - Click the × on a chip to remove it.                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface ChipInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export default function ChipInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  ariaLabel,
}: ChipInputProps) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (value.includes(cleaned)) {
      setDraft("");
      return;
    }
    onChange([...value, cleaned]);
    setDraft("");
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeAt(value.length - 1);
    }
  };

  return (
    <div
      className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-white px-2 py-1.5 focus-within:border-forest"
      aria-label={ariaLabel}
    >
      {value.map((chip, idx) => (
        <span
          key={`${chip}-${idx}`}
          className="inline-flex items-center gap-1 rounded-sm bg-cream-dark px-2 py-0.5 font-body text-[12.5px] text-ink"
        >
          {chip}
          <button
            type="button"
            onClick={() => removeAt(idx)}
            aria-label={`Remove ${chip}`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-warm-gray transition-colors hover:bg-rust/10 hover:text-rust"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 font-body text-[13.5px] text-ink focus:outline-none"
      />
    </div>
  );
}
