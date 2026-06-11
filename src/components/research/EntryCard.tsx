/* ------------------------------------------------------------------ */
/*  EntryCard                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  A single cell in the /research hairline catalog grid.             */
/*                                                                     */
/*  Structure (in order of visual importance):                        */
/*  1. Ledger row — archive number + topic on the left, format on     */
/*     the right. DM Mono, quiet, bibliographic.                       */
/*  2. Title — display serif, clickable.                               */
/*  3. Abstract — body text, clamped to four lines so grid rows       */
/*     stay even.                                                      */
/*  4. Author line — names, date, city in small muted text.           */
/*  5. Hairline footer — Read link, PDF link, citation count.         */
/*                                                                     */
/*  Cells sit edge to edge inside a gap-px bg-border grid, so the     */
/*  card itself paints a solid cream background and hovers with a     */
/*  background shift rather than a lift (a lift would tear the        */
/*  hairline grid apart).                                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { ResearchEntry } from "@/lib/types/database";
import { cityLabel, formatLabel } from "@/lib/research-constants";

interface EntryCardProps {
  entry: ResearchEntry;
  /** Stable archive number, oldest entry = 1. Rendered as "No. 01". */
  number?: number;
}

function formatAuthorList(authors: string[]): string {
  if (authors.length === 0) return "Rooted Forward";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(" and ");
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

function formatPublishedDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

export default function EntryCard({ entry, number }: EntryCardProps) {
  const href = `/research/${entry.slug}`;
  const citationCount = entry.citations?.length ?? 0;

  return (
    <article className="flex h-full flex-col bg-cream p-7 transition-colors duration-300 hover:bg-white/50 md:p-8">
      {/* Ledger row */}
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {number !== undefined && (
            <span className="ledger text-warm-gray">
              No. {String(number).padStart(2, "0")}
            </span>
          )}
          <span className="ledger text-rust">{entry.topic}</span>
        </div>
        <span className="ledger shrink-0 text-warm-gray">
          {formatLabel(entry.format)}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-5 font-display text-[22px] leading-[1.15] md:text-2xl">
        <Link
          href={href}
          className="text-forest transition-colors hover:text-rust"
        >
          {entry.title}
        </Link>
      </h3>

      {/* Abstract */}
      <p className="mt-4 line-clamp-4 flex-1 font-body text-[15px] leading-[1.65] text-ink/70">
        {entry.abstract}
      </p>

      {/* Bibliographic line */}
      <p className="mt-5 font-body text-[13px] leading-relaxed text-warm-gray">
        {formatAuthorList(entry.authors)}
        <span className="mx-1.5">·</span>
        {formatPublishedDate(entry.published_date)}
        <span className="mx-1.5">·</span>
        {cityLabel(entry.city)}
      </p>

      {/* Hairline footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href={href}
            className="group inline-flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            Read
            <span aria-hidden="true" className="arrow-nudge">
              &rarr;
            </span>
          </Link>
          {entry.pdf_url && (
            <a
              href={entry.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-draw font-body text-[13px] text-forest"
            >
              PDF
            </a>
          )}
        </div>

        {citationCount > 0 && (
          <Link
            href={`${href}#citations`}
            className="ledger text-warm-gray transition-colors hover:text-forest"
          >
            {citationCount} citation{citationCount === 1 ? "" : "s"}
          </Link>
        )}
      </div>
    </article>
  );
}
