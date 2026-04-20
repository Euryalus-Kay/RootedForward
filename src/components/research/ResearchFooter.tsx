/* ------------------------------------------------------------------ */
/*  ResearchFooter                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Single email prompt below the directors section. Deliberately    */
/*  quiet — one line of text, one link. That's what the spec calls   */
/*  for.                                                               */
/*                                                                     */
/* ------------------------------------------------------------------ */

export default function ResearchFooter() {
  return (
    <section className="border-t border-border bg-cream pb-28 pt-16 md:pb-32">
      <div className="mx-auto max-w-4xl px-6">
        <p className="max-w-[65ch] font-body text-[15px] leading-relaxed text-warm-gray">
          Interested in collaborating on research or accessing our primary
          source collections? Reach us at{" "}
          <a
            href="mailto:contact@rooted-forward.org"
            className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
          >
            contact@rooted-forward.org
          </a>
          .
        </p>
      </div>
    </section>
  );
}
