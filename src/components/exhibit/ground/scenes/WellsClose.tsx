"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "WellsClose". Ida B. Wells alone on the wall, closing     */
/*  the fair chapter, where her words belong in time; the quote is     */
/*  the preface to the pamphlet she distributed at the 1893            */
/*  exposition itself. Her words come only from the voice registry     */
/*  and render inside quotation marks only because the registry        */
/*  marks them verbatim; if that status ever changes the scene         */
/*  refuses to render rather than fake a quote. No avatar, no image,   */
/*  no motion.                                                         */
/* ------------------------------------------------------------------ */
import type { SceneProps } from "./registry";
import { isVerbatim, voiceOf } from "@/lib/exhibit/voices";
import SourceSup from "../../shared/SourceSup";

export default function WellsClose(_props: SceneProps) {
  const voice = voiceOf("ida-b-wells");
  if (!voice || !isVerbatim(voice) || !voice.quote) return null;

  return (
    <figure data-testid="scene-wellsClose" className="max-w-[36rem] pb-[24svh] pt-[24svh]">
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        At the fair itself, in her own words
      </p>
      <blockquote className="mt-6">
        <p className="font-display text-2xl leading-snug text-exh-ink md:text-3xl">
          &ldquo;{voice.quote.text}&rdquo;
          <SourceSup factId={voice.factRef ?? undefined} />
        </p>
      </blockquote>
      <figcaption className="mt-8">
        <p className="font-display text-lg text-exh-ink">{voice.name}</p>
        <p className="exh-mono mt-1 text-xs text-exh-ink-soft">{voice.years}</p>
        <p className="exh-plat mt-2 text-[11px] uppercase leading-snug tracking-[0.14em] text-exh-ink-soft">
          {voice.quote.source}
        </p>
      </figcaption>
    </figure>
  );
}
