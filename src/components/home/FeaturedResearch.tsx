/* ------------------------------------------------------------------ */
/*  Featured research strip on the home page                           */
/*                                                                     */
/*  Server component: pulls three real papers from the catalog and     */
/*  the live paper/dataset counts. Cards tilt toward the cursor.       */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  formatLabel,
} from "@/lib/research-constants";
import { RESEARCH_DATASETS } from "@/lib/research-datasets";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import TiltCard from "@/components/motion/TiltCard";

const FEATURED_SLUGS = [
  "holc-redlining-present-day-outcomes-chicago",
  "the-606-trail-displacement",
  "chicago-tif-spending-distribution",
];

export default function FeaturedResearch() {
  const entries = PLACEHOLDER_RESEARCH_ENTRIES;
  const paperCount = entries.length;
  const datasetCount = Object.keys(RESEARCH_DATASETS).length;

  const featured = FEATURED_SLUGS.map((slug) =>
    entries.find((e) => e.slug === slug)
  ).filter((e): e is NonNullable<typeof e> => Boolean(e));
  const cards = featured.length === 3 ? featured : entries.slice(0, 3);

  return (
    <section className="relative bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="From the archive"
            title="Research you can check"
            lede={`${paperCount} published papers, ${datasetCount} public datasets. Every figure traces to a file you can download and recompute.`}
          />
          <Reveal delay={0.2}>
            <Link
              href="/research"
              className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
            >
              All papers
              <span aria-hidden="true" className="arrow-nudge">
                &rarr;
              </span>
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 0.1} className="h-full">
              <TiltCard className="h-full" max={4}>
                <Link
                  href={`/research/${entry.slug}`}
                  className="card-lift flex h-full flex-col border border-border bg-white/40 p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="ledger text-rust">{entry.topic}</span>
                    <span className="ledger text-warm-gray">
                      {formatLabel(entry.format)}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-2xl leading-tight text-forest">
                    {entry.title}
                  </h3>
                  <p className="mt-4 line-clamp-4 flex-1 font-body text-sm leading-relaxed text-ink/70">
                    {entry.abstract}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="font-body text-xs text-warm-gray">
                      {entry.authors.join(", ")}
                    </span>
                    <span aria-hidden="true" className="arrow-nudge text-rust">
                      &rarr;
                    </span>
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
