/* ------------------------------------------------------------------ */
/*  ResearchFooter                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Correspondence block at the end of /research, above the global    */
/*  site footer. One framed card on cream: a collaboration prompt     */
/*  and a single mailto action. Kept deliberately quiet so the page   */
/*  closes on the work, not on a sales pitch.                          */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";

export default function ResearchFooter() {
  return (
    <section className="bg-cream pb-20 pt-4 md:pb-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal y={20}>
          <div className="grid grid-cols-1 items-center gap-8 border border-border bg-white/40 px-7 py-10 md:grid-cols-[1fr_auto] md:px-12 md:py-12">
            <div>
              <p className="eyebrow text-warm-gray">Correspondence</p>
              <h2 className="mt-3 font-display text-2xl text-forest md:text-3xl">
                Work with the archive
              </h2>
              <p className="mt-4 max-w-[60ch] font-body text-[15px] leading-relaxed text-ink/70">
                Interested in collaborating on research or accessing our
                primary source collections? Reach us at{" "}
                <a
                  href="mailto:contact@rooted-forward.org"
                  className="link-draw text-forest"
                >
                  contact@rooted-forward.org
                </a>
                .
              </p>
            </div>

            <Magnetic>
              <a
                href="mailto:contact@rooted-forward.org"
                className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Email us
              </a>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
