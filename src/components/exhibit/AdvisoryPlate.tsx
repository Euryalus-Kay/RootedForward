/* ------------------------------------------------------------------ */
/*  Inline content advisory at the top of chapter four. A bordered     */
/*  plate, not a modal: no focus trap, no play state, one quiet        */
/*  anchor that skips to the next chapter for readers who prefer to.   */
/* ------------------------------------------------------------------ */

export default function AdvisoryPlate({ skipToId }: { skipToId: string }) {
  return (
    <aside
      data-testid="advisory-plate"
      aria-label="Content advisory"
      className="mb-10 border border-exh-ink bg-exh-linen-deep/40 p-5 sm:p-6"
    >
      <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Content advisory
      </p>
      <p className="mt-3 font-body text-base leading-relaxed text-exh-ink">
        This chapter documents racial terrorism, including bombings, the killing of a teenager,
        and the death of a child. No graphic imagery is shown.
      </p>
      <a
        href={`#${skipToId}`}
        data-testid="advisory-skip"
        className="exh-plat mt-4 inline-flex min-h-12 items-center border border-exh-ink/40 bg-exh-linen px-5 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors duration-200 hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
      >
        Skip this chapter
      </a>
    </aside>
  );
}
