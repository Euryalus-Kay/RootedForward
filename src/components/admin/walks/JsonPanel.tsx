"use client";

/* ------------------------------------------------------------------ */
/*  The raw editor for the parts of a bundle that have no sensible     */
/*  form.                                                              */
/*                                                                     */
/*  Geometry is thousands of survey coordinates from                   */
/*  scripts/walk-prep-map.mjs, and the map config is label positions   */
/*  measured against that same drawing. Building inputs for those      */
/*  would be a worse tool than a text box, so they get a text box, a   */
/*  parser and a plain warning. Nothing reaches the tour until the     */
/*  text parses, which keeps a stray comma from shipping a broken map  */
/*  to a phone.                                                        */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnGhost, eyebrowCls } from "./ui";

export default function JsonPanel({
  title,
  note,
  warning,
  value,
  onChange,
  disabled,
  rows = 14,
}: {
  title: string;
  note: string;
  warning?: string;
  value: unknown;
  onChange: (next: unknown) => void;
  disabled?: boolean;
  rows?: number;
}) {
  const serialized = JSON.stringify(value ?? null, null, 2);

  // A closed panel shows whatever the caller currently holds, so
  // opening a different walk needs no resyncing. Once it is open the
  // draft text belongs to whoever is typing, even mid-keystroke while
  // it does not parse, so it is kept apart from the parsed value.
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = draft !== null;
  const text = draft ?? serialized;

  const commit = (next: string) => {
    setDraft(next);
    if (!next.trim()) {
      setError("This section cannot be empty");
      return;
    }
    try {
      const parsed = JSON.parse(next) as unknown;
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That is not valid JSON");
    }
  };

  const format = () => {
    try {
      setDraft(JSON.stringify(JSON.parse(text) as unknown, null, 2));
      setError(null);
    } catch {
      setError("Fix the JSON before tidying it");
    }
  };

  const lines = text.split("\n").length;

  return (
    <div className="rounded-sm border border-border bg-white/60">
      <button
        type="button"
        onClick={() => {
          setDraft(open ? null : serialized);
          setError(null);
        }}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
      >
        <span>
          <span className={eyebrowCls}>{title}</span>
          <span className="mt-1 block max-w-2xl font-body text-xs leading-relaxed text-warm-gray">
            {note}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {error ? (
            <span className="flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-widest text-rust">
              <AlertTriangle className="h-3.5 w-3.5" />
              Invalid
            </span>
          ) : (
            <span className="font-body text-xs text-warm-gray">{lines} lines</span>
          )}
          {open ? (
            <ChevronDown className="h-4 w-4 text-warm-gray" />
          ) : (
            <ChevronRight className="h-4 w-4 text-warm-gray" />
          )}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {warning && (
            <p className="mb-3 flex items-start gap-2 rounded-sm border border-rust/40 bg-rust/5 px-3 py-2 font-body text-xs leading-relaxed text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rust" />
              {warning}
            </p>
          )}
          <textarea
            rows={rows}
            spellCheck={false}
            disabled={disabled}
            value={text}
            onChange={(e) => commit(e.target.value)}
            className={cn(
              "w-full rounded-sm border bg-white px-3 py-2 font-mono text-xs leading-relaxed text-ink focus:outline-none focus:ring-1",
              error
                ? "border-rust focus:border-rust focus:ring-rust"
                : "border-border focus:border-forest focus:ring-forest"
            )}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p
              className={cn(
                "font-body text-xs",
                error ? "text-rust" : "text-warm-gray"
              )}
            >
              {error ? (
                error
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-forest" />
                  Valid JSON, held with the rest of your edits until you save
                </span>
              )}
            </p>
            <button type="button" onClick={format} disabled={disabled} className={btnGhost}>
              Tidy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
