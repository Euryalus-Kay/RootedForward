"use client";

/* ------------------------------------------------------------------ */
/*  The small shared parts of the walk editor.                         */
/*                                                                     */
/*  This screen is dense on purpose, so the field, label and card      */
/*  classes live in one place rather than being retyped forty times    */
/*  across four files. Palette and type follow the site, not a         */
/*  separate admin theme, so the editor still reads as Rooted Forward. */
/* ------------------------------------------------------------------ */

import { cn } from "@/lib/utils";

export const cardCls = "rounded-sm border border-border bg-white/60";

export const inputCls =
  "w-full rounded-sm border border-border bg-white px-3 py-2 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:bg-cream-dark disabled:text-warm-gray";

export const labelCls =
  "mb-1 block font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray";

export const eyebrowCls =
  "font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-sm bg-rust px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-border bg-white px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-50";

export const btnQuiet =
  "inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust disabled:cursor-not-allowed disabled:opacity-50";

export const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-sm border border-border text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:cursor-not-allowed disabled:opacity-30";

/** One labelled text input. `hint` is set under the field for the
 *  things the owner cannot be expected to remember, like which paths
 *  the phone will accept. */
export function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = "text",
  disabled,
  className,
}: {
  label: string;
  value: string | number;
  onChange: (next: string) => void;
  hint?: string;
  placeholder?: string;
  type?: "text" | "number";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <input
        type={type}
        className={inputCls}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 font-body text-xs text-warm-gray">{hint}</p>}
    </div>
  );
}

/** A labelled textarea. Prose on this site is stored as an array of
 *  paragraphs, so most callers pass `paragraphs` and let TextArea keep
 *  the blank lines. */
export function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 4,
  placeholder,
  disabled,
  className,
  mono,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <textarea
        rows={rows}
        className={cn(inputCls, "leading-relaxed", mono && "font-mono text-xs")}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 font-body text-xs text-warm-gray">{hint}</p>}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded-sm border-border text-forest focus:ring-forest"
      />
      {label}
    </label>
  );
}

/** The heading above every block of fields. Set as an eyebrow so the
 *  page reads as one long form rather than a stack of little pages. */
export function SectionCard({
  title,
  note,
  right,
  children,
}: {
  title: string;
  note?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cardCls}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className={eyebrowCls}>{title}</h2>
          {note && (
            <p className="mt-1 max-w-2xl font-body text-xs leading-relaxed text-warm-gray">
              {note}
            </p>
          )}
        </div>
        {right}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/* ---- turning prose into arrays and back -------------------------- */

/** Paragraphs are stored one per array entry. In the editor they are
 *  one blank line apart, which is how anybody actually writes, and the
 *  round trip is lossless for the shapes this site stores. */
export function paragraphsToText(paragraphs: string[] | undefined): string {
  return (paragraphs ?? []).join("\n\n");
}

export function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
