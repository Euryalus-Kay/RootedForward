/* ------------------------------------------------------------------ */
/*  EntryCard                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  A single entry in the /research vertical feed.                    */
/*                                                                     */
/*  Structure (in order of visual importance):                        */
/*  1. Title — serif, medium-large, clickable.                         */
/*  2. Abstract — body text, max 65ch.                                 */
/*  3. Author line — names + date, small muted text.                  */
/*  4. Metadata line — topic · city · format, small muted text.       */
/*  5. Citation count — "N citations" linking to #citations on the    */
/*     detail page.                                                    */
/*  6. Links — "Read →" and "PDF →" as inline text links.              */
/*                                                                     */
/*  No shadows, no pills, no colored tags. The metadata is quiet —     */
/*  it's meant to read like bibliographic fine print on a library      */
/*  catalog card, not a dashboard result.                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { ResearchEntry } from "@/lib/types/database";
import { cityLabel, formatLabel } from "@/lib/research-constants";

interface EntryCardProps {
  entry: ResearchEntry;
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

export default function EntryCard({ entry }: EntryCardProps) {
  const href = `/research/${entry.slug}`;
  const citationCount = entry.citations?.length ?? 0;

  return (
    <article className="max-w-3xl">
      <h2 className="font-display text-[26px] leading-[1.2] md:text-[28px]">
        <Link
          href={href}
          className="text-forest transition-colors hover:text-rust"
        >
          {entry.title}
        </Link>
      </h2>

      <p className="mt-3 max-w-[65ch] font-body text-[16px] leading-[1.7] text-ink/75">
        {entry.abstract}
      </p>

      <p className="mt-4 font-body text-[13px] leading-relaxed text-warm-gray">
        By {formatAuthorList(entry.authors)}
        <span className="mx-1.5">·</span>
        {formatPublishedDate(entry.published_date)}
      </p>

      <p className="mt-0.5 font-body text-[13px] leading-relaxed text-warm-gray">
        <span>{entry.topic}</span>
        <span className="mx-1.5">·</span>
        <span>{cityLabel(entry.city)}</span>
        <span className="mx-1.5">·</span>
        <span>{formatLabel(entry.format)}</span>
      </p>

      {citationCount > 0 && (
        <p className="mt-2 font-body text-[13px] leading-relaxed text-warm-gray">
          <Link
            href={`${href}#citations`}
            className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-warm-gray"
          >
            {citationCount} citation{citationCount === 1 ? "" : "s"}
          </Link>
        </p>
      )}

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-body text-[14px]">
        <Link
          href={href}
          className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
        >
          Read &rarr;
        </Link>
        {entry.pdf_url && (
          <a
            href={entry.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
          >
            PDF &rarr;
          </a>
        )}
      </p>
    </article>
  );
}
