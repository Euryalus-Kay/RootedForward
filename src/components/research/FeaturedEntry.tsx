/* ------------------------------------------------------------------ */
/*  FeaturedEntry                                                      */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The single featured research entry shown at the top of /research, */
/*  immediately below the banner. Section index 01 of the page.       */
/*                                                                     */
/*  Layout: editorial lead. Cover panel on the left (42% on desktop), */
/*  title, abstract, and links on the right. Stacks on mobile with    */
/*  the cover first. The cover tilts toward the cursor.               */
/*                                                                     */
/*  Fallback cover: if no cover_image_url is supplied, we render a    */
/*  typographic cover — the topic name set in display serif on a      */
/*  dark forest panel with the house grain and street-grid texture.   */
/*  That's how academic journals handle missing imagery and it fits   */
/*  the press-archive feel of this page.                               */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { ResearchEntry } from "@/lib/types/database";
import { formatLabel } from "@/lib/research-constants";
import { Reveal } from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";

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
  });
}

/**
 * Typographic cover used when cover_image_url is null. The topic
 * name is set large in display serif on a dark panel. Pure CSS,
 * no external asset.
 */
function TypographicCover({ topic }: { topic: string }) {
  return (
    <div
      role="img"
      aria-label={`Topic: ${topic}`}
      className="grain relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden bg-forest-deep p-7 md:p-9"
    >
      <div className="grid-lines-light absolute inset-0" aria-hidden="true" />

      <p className="ledger relative z-10 text-cream/55">
        Rooted Forward Research
      </p>

      <p className="relative z-10 font-display text-[44px] leading-[0.95] text-cream md:text-[56px]">
        {topic}.
      </p>
    </div>
  );
}

export default function FeaturedEntry({ entry }: FeaturedEntryProps) {
  const href = `/research/${entry.slug}`;

  return (
    <section
      aria-labelledby="featured-research-heading"
      className="bg-cream pb-16 pt-14 md:pb-24 md:pt-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section index row */}
        <Reveal y={12}>
          <div className="flex items-center gap-4">
            <span className="index-numeral text-sm text-rust">01</span>
            <p className="eyebrow text-warm-gray">Featured entry</p>
            <div className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-14 md:grid-cols-[42%_1fr] md:gap-16">
          {/* Cover */}
          <Reveal y={24}>
            <TiltCard max={5}>
              {entry.cover_image_url ? (
                <Link href={href} className="group block overflow-hidden">
                  <img
                    src={entry.cover_image_url}
                    alt={`Cover image for ${entry.title}`}
                    className="photo-archival aspect-[4/5] w-full border border-border object-cover"
                  />
                </Link>
              ) : (
                <TypographicCover topic={entry.topic} />
              )}
            </TiltCard>
          </Reveal>

          {/* Text */}
          <div className="flex flex-col justify-center">
            <Reveal y={14}>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
                <span className="ledger text-rust">{entry.topic}</span>
                <span className="ledger text-warm-gray">
                  {formatLabel(entry.format)}
                </span>
                <span className="ledger text-warm-gray">
                  {formatDate(entry.published_date)}
                </span>
              </div>
            </Reveal>

            <Reveal mask className="mt-5">
              <h2
                id="featured-research-heading"
                className="max-w-2xl font-display text-3xl leading-[1.05] text-forest md:text-[42px]"
              >
                <Link href={href} className="transition-colors hover:text-rust">
                  {entry.title}
                </Link>
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 line-clamp-6 max-w-[58ch] font-body text-base leading-[1.7] text-ink/75 md:text-[17px]">
                {entry.abstract}
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="mt-6 font-body text-sm text-warm-gray">
                Published by {formatAuthorList(entry.authors)}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-5">
                <Link
                  href={href}
                  className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  Read the paper
                  <span aria-hidden="true" className="arrow-nudge">
                    &rarr;
                  </span>
                </Link>
                {entry.pdf_url && (
                  <a
                    href={entry.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-draw font-body text-sm text-forest"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
