/* ------------------------------------------------------------------ */
/*  DirectorCard                                                       */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  One entry in the Industry Directors list on /research.            */
/*                                                                     */
/*  - Horizontal row: square 120×120 photo on the left, text on        */
/*    the right. Stacks on mobile.                                     */
/*  - No shadows, no pills, no decorative flourishes. Designed to     */
/*    read like a faculty-page entry.                                  */
/*  - If the director has no photo, we render their initials on a    */
/*    muted tile using the existing design tokens.                     */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { IndustryDirector } from "@/lib/types/database";

interface DirectorCardProps {
  director: IndustryDirector;
}

function initialsFor(fullName: string): string {
  return fullName
    .replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export default function DirectorCard({ director }: DirectorCardProps) {
  const initials = initialsFor(director.full_name);
  const hasLinks =
    !!director.website_url ||
    !!director.institutional_url ||
    !!director.linkedin_url;

  return (
    <article className="grid grid-cols-1 gap-6 py-8 md:grid-cols-[120px_1fr] md:gap-8 md:py-10">
      {/* Photo */}
      <div className="flex-shrink-0">
        {director.photo_url ? (
          <img
            src={director.photo_url}
            alt={`Portrait of ${director.full_name}`}
            className="h-[120px] w-[120px] rounded-sm border border-border object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-[120px] w-[120px] items-center justify-center rounded-sm border border-border bg-cream-dark font-display text-2xl font-medium tracking-wide text-warm-gray"
          >
            {initials}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <h3 className="font-display text-[22px] leading-snug text-forest md:text-[24px]">
          {director.full_name}
        </h3>
        <p className="mt-1 font-body text-[15px] leading-snug text-ink/70">
          {director.title}
        </p>
        <p className="font-body text-[14px] leading-snug text-warm-gray">
          {director.affiliation}
        </p>

        <p className="mt-4 max-w-[65ch] font-body text-[15.5px] leading-[1.7] text-ink/75">
          {director.bio}
        </p>

        {director.focus_areas.length > 0 && (
          <p className="mt-4 font-body text-[13px] text-warm-gray">
            {director.focus_areas.join("  ·  ")}
          </p>
        )}

        {hasLinks && (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-body text-[13px]">
            {director.website_url && (
              <a
                href={director.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
              >
                Personal site
              </a>
            )}
            {director.institutional_url && (
              <a
                href={director.institutional_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
              >
                Institutional page
              </a>
            )}
            {director.linkedin_url && (
              <a
                href={director.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
              >
                LinkedIn
              </a>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
