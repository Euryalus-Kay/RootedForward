/* ------------------------------------------------------------------ */
/*  IndustryDirectorsSection                                           */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Section 5 of the /research page. Lives below the archive with    */
/*  generous whitespace above.                                         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { IndustryDirector } from "@/lib/types/database";
import DirectorCard from "@/components/research/DirectorCard";

interface IndustryDirectorsSectionProps {
  directors: IndustryDirector[];
}

export default function IndustryDirectorsSection({
  directors,
}: IndustryDirectorsSectionProps) {
  if (directors.length === 0) return null;

  const ordered = [...directors].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  return (
    <section
      id="industry-directors"
      aria-labelledby="industry-directors-heading"
      className="border-t border-border bg-cream py-24 md:py-32"
    >
      <div className="mx-auto max-w-4xl px-6">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
          People
        </p>
        <h2
          id="industry-directors-heading"
          className="mt-3 font-display text-[36px] leading-tight text-forest md:text-[48px]"
        >
          Industry Directors
        </h2>
        <p className="mt-6 max-w-[65ch] font-body text-[17px] leading-[1.7] text-ink/75">
          Professionals and academics who guide the research agenda, review
          methodology, and connect the work to the broader fields of urban
          planning, housing policy, and public history.
        </p>

        <div className="mt-12 flex flex-col divide-y divide-border border-t border-border">
          {ordered.map((director) => (
            <DirectorCard key={director.id} director={director} />
          ))}
        </div>
      </div>
    </section>
  );
}
