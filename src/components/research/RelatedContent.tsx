/* ------------------------------------------------------------------ */
/*  RelatedContent                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Bottom-of-detail-page block that shows related research,         */
/*  campaigns, and tours. All three are optional — if there's nothing */
/*  to link to in a given category, that subsection is skipped.       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { ResearchEntry } from "@/lib/types/database";
import {
  cityLabel,
  formatLabel,
} from "@/lib/research-constants";

interface RelatedCampaignRef {
  id: string;
  slug: string;
  title: string;
  category: string;
}

interface RelatedTourRef {
  slug: string;
  city: string;
  title: string;
}

interface RelatedContentProps {
  relatedEntries: ResearchEntry[];
  relatedCampaigns?: RelatedCampaignRef[];
  relatedTours?: RelatedTourRef[];
}

export default function RelatedContent({
  relatedEntries,
  relatedCampaigns = [],
  relatedTours = [],
}: RelatedContentProps) {
  const hasAny =
    relatedEntries.length > 0 ||
    relatedCampaigns.length > 0 ||
    relatedTours.length > 0;

  if (!hasAny) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mt-16 border-t border-border pt-12"
    >
      <h2
        id="related-heading"
        className="font-display text-[28px] leading-tight text-forest md:text-[32px]"
      >
        Related
      </h2>

      {relatedEntries.length > 0 && (
        <div className="mt-8">
          <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-gray">
            More research
          </h3>
          <ul className="mt-4 flex flex-col divide-y divide-border border-t border-border">
            {relatedEntries.map((entry) => (
              <li key={entry.id} className="py-5">
                <Link
                  href={`/research/${entry.slug}`}
                  className="group block"
                >
                  <p className="font-display text-[19px] leading-snug text-forest transition-colors group-hover:text-rust md:text-[20px]">
                    {entry.title}
                  </p>
                  <p className="mt-1 font-body text-[13px] text-warm-gray">
                    {entry.topic}
                    <span className="mx-1.5">·</span>
                    {cityLabel(entry.city)}
                    <span className="mx-1.5">·</span>
                    {formatLabel(entry.format)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedCampaigns.length > 0 && (
        <div className="mt-10">
          <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-gray">
            Related campaigns
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {relatedCampaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/policy/campaigns/${c.slug}`}
                  className="font-body text-[15px] text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  {c.title}
                </Link>
                <span className="ml-2 font-body text-[13px] text-warm-gray">
                  {c.category}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedTours.length > 0 && (
        <div className="mt-10">
          <h3 className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-gray">
            Related walking tour stops
          </h3>
          <ul className="mt-4 flex flex-col gap-2">
            {relatedTours.map((t) => (
              <li key={`${t.city}/${t.slug}`}>
                <Link
                  href={`/tours/${t.city}/${t.slug}`}
                  className="font-body text-[15px] text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  {t.title}
                </Link>
                <span className="ml-2 font-body text-[13px] text-warm-gray">
                  {t.city}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
