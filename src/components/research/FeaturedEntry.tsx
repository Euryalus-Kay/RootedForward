/* ------------------------------------------------------------------ */
/*  FeaturedEntry                                                      */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The single featured research entry shown at the top of /research, */
/*  immediately below the header rule.                                */
/*                                                                     */
/*  Layout: full-width horizontal block, 45% image / 55% text on      */
/*  desktop. On mobile it stacks — image first, text below.            */
/*                                                                     */
/*  Fallback cover: if no cover_image_url is supplied, we render a    */
/*  typographic cover — the topic name set in display serif on a     */
/*  muted brand block. That's how academic journals handle missing   */
/*  imagery and it fits the press-archive feel we want on this page. */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { ResearchEntry } from "@/lib/types/database";
import { formatLabel } from "@/lib/research-constants";

interface FeaturedEntryProps {
  entry: ResearchEntry;
}

function formatAuthorList(authors: string[]): string {
  if (authors.length === 0) return "Rooted Forward";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(" and ");
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

function formatDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Typographic cover used when cover_image_url is null. The topic
 * name is set large in display serif on a muted panel. Pure CSS —
 * no external asset.
 */
function TypographicCover({ topic }: { topic: string }) {
  return (
    <div
      role="img"
      aria-label={`Topic: ${topic}`}
      className="relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-sm border border-border bg-cream-dark"
    >
      {/* Subtle diagonal hatch */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="featured-hatch"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="14" stroke="#1A1A1A" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#featured-hatch)" />
      </svg>

      <div className="relative flex h-full w-full flex-col justify-between p-6 md:p-8">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
          Rooted Forward Research
        </p>

        <h3 className="font-display text-[44px] leading-[0.95] text-forest md:text-[56px]">
          {topic}.
        </h3>
      </div>
    </div>
  );
}

export default function FeaturedEntry({ entry }: FeaturedEntryProps) {
  const href = `/research/${entry.slug}`;

  return (
    <section
      aria-labelledby="featured-research-heading"
      className="bg-cream pb-16 pt-10 md:pb-20 md:pt-12"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[45%_1fr] md:gap-14">
          {/* Cover */}
          <div>
            {entry.cover_image_url ? (
              <Link href={href} className="block">
                <img
                  src={entry.cover_image_url}
                  alt={`Cover image for ${entry.title}`}
                  className="aspect-[4/5] w-full rounded-sm border border-border object-cover"
                />
              </Link>
            ) : (
              <TypographicCover topic={entry.topic} />
            )}
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center">
            <p className="font-body text-[13px] text-warm-gray">
              {formatLabel(entry.format)}
            </p>

            <h2
              id="featured-research-heading"
              className="mt-2 font-display text-[32px] leading-[1.1] text-forest md:text-[42px]"
            >
              <Link
                href={href}
                className="transition-colors hover:text-rust"
              >
                {entry.title}
              </Link>
            </h2>

            <p className="mt-6 max-w-[58ch] font-body text-[17px] leading-[1.7] text-ink/80">
              {entry.abstract}
            </p>

            <p className="mt-6 font-body text-[14px] text-warm-gray">
              Published by {formatAuthorList(entry.authors)}
            </p>
            <p className="mt-0.5 font-body text-[14px] text-warm-gray">
              {formatDate(entry.published_date)}
            </p>

            <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 font-body text-[14.5px]">
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
          </div>
        </div>
      </div>
    </section>
  );
}
