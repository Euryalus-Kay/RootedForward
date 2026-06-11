/* ------------------------------------------------------------------ */
/*  PageBanner — the v2 banner shared by every top-level page          */
/*                                                                     */
/*  Left-aligned editorial header over the archival map photo with a   */
/*  slow parallax drift, film grain, a monospace section label, and a  */
/*  meta row pinned to the bottom hairline. Use `compact` on detail    */
/*  pages, default on section landings.                                */
/* ------------------------------------------------------------------ */

import Parallax from "@/components/motion/Parallax";
import WordReveal from "@/components/motion/WordReveal";
import { Reveal } from "@/components/motion/Reveal";
import GradeStrip from "@/components/motion/GradeStrip";

interface PageBannerProps {
  eyebrow: string;
  title: string;
  dek?: string;
  meta?: string[];
  compact?: boolean;
  image?: string;
}

export default function PageBanner({
  eyebrow,
  title,
  dek,
  meta,
  compact = false,
  image = "/hero-redlining.jpg",
}: PageBannerProps) {
  return (
    <section
      className={`grain relative overflow-hidden bg-forest-deep ${
        compact ? "" : "min-h-[52vh] md:min-h-[58vh]"
      }`}
    >
      {/* Backdrop: archival photo drifting slower than the page */}
      <div className="absolute inset-0">
        <Parallax range={36} className="h-[120%] w-full">
          <div
            className="h-full w-full scale-110 bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/95 via-forest/75 to-forest-deep/90" />
      <div className="grid-lines-light absolute inset-0" aria-hidden="true" />

      <div
        className={`relative z-10 mx-auto flex max-w-7xl flex-col justify-end px-6 lg:px-8 ${
          compact
            ? "pt-20 pb-10 md:pt-24 md:pb-12"
            : "min-h-[52vh] pt-24 pb-12 md:min-h-[58vh] md:pb-16"
        }`}
      >
        <Reveal y={16}>
          <p className="ledger text-cream/60">{eyebrow}</p>
        </Reveal>

        <WordReveal
          as="h1"
          text={title}
          delay={0.08}
          className={`mt-4 max-w-4xl font-display text-white ${
            compact
              ? "text-4xl leading-[1.02] md:text-5xl"
              : "text-5xl leading-[0.98] md:text-7xl"
          }`}
        />

        {dek && (
          <Reveal delay={0.25} y={20}>
            <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-cream/75 md:text-lg">
              {dek}
            </p>
          </Reveal>
        )}

        {(meta?.length || !compact) && (
          <Reveal delay={0.35} y={12}>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-cream/15 pt-5 md:mt-12">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                {meta?.map((m) => (
                  <span key={m} className="ledger text-cream/55">
                    {m}
                  </span>
                ))}
              </div>
              <GradeStrip className="opacity-70" />
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
