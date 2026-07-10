/* ------------------------------------------------------------------ */
/*  The exhibit's opening wall. Built from walltext.json's opening     */
/*  block: kicker, title, the plain-words paragraphs, the how-to-read  */
/*  line, and a quiet Begin anchor that scrolls to the first chapter.  */
/*  No mode state; the page below is the exhibit.                      */
/* ------------------------------------------------------------------ */
import { WALL_OPENING } from "@/lib/exhibit/walltext";
import { SourceSupGroup } from "./shared/SourceSup";

export default function ExhibitHeader() {
  return (
    <header data-testid="exhibit-header" className="pb-14 pt-10 md:pb-20 md:pt-16">
      <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
        {WALL_OPENING.kicker}
      </p>
      <h1 className="mt-4 font-display text-5xl leading-[1.02] text-exh-ink sm:text-6xl md:text-7xl">
        {WALL_OPENING.title}
      </h1>
      {WALL_OPENING.bigIdea && (
        <p
          data-testid="big-idea"
          className="mt-6 max-w-[30ch] font-display text-2xl leading-snug text-exh-ink sm:text-3xl"
        >
          {WALL_OPENING.bigIdea}
        </p>
      )}
      <div className="mt-8 h-px w-16 bg-exh-ink/30" aria-hidden="true" />

      <div data-testid="opening-plainwords" className="mt-8 space-y-6">
        {WALL_OPENING.plainWords.map((p) => (
          <p
            key={p.id}
            data-section-id={p.id}
            className="max-w-[65ch] font-display text-xl leading-[1.65] text-exh-ink md:text-2xl md:leading-[1.6]"
          >
            {p.text}
            <SourceSupGroup factIds={p.factRefs} />
          </p>
        ))}
      </div>

      <p
        data-testid="how-to-read"
        className="mt-8 max-w-[65ch] border-l-2 border-exh-ink/25 pl-4 font-body text-sm leading-relaxed text-exh-ink-soft"
      >
        {WALL_OPENING.howToRead}
      </p>

      <p className="mt-4 max-w-[65ch] font-body text-sm leading-relaxed text-exh-ink-soft">
        {"Chapter 1 can tell you the grade the surveyors gave "}
        <a
          href="#find-your-ground"
          data-testid="find-ground-link"
          className="text-exh-ink underline decoration-exh-ink/40 underline-offset-2 transition-colors hover:decoration-exh-ink"
        >
          the ground under you
        </a>
        {"."}
      </p>

      <a
        href="#ch0"
        data-testid="begin-link"
        className="exh-plat mt-8 inline-flex min-h-12 items-center gap-3 border border-exh-ink bg-exh-linen px-6 text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen"
      >
        Begin
        <span aria-hidden="true">&darr;</span>
      </a>
    </header>
  );
}
