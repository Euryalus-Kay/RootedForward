"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "BaldwinBench", Act 4. James Baldwin's verbatim line on   */
/*  urban renewal, alone in the bench register. The text and its       */
/*  quote status come from the voices registry; quotation marks        */
/*  render only because the status begins with "verbatim". The fact    */
/*  people.baldwin_negro_removal carries the WGBH citation.            */
/* ------------------------------------------------------------------ */
import type { SceneProps } from "./registry";
import { isVerbatim, voiceOf } from "@/lib/exhibit/voices";
import { SourceSup } from "../../shared/SourceSup";

export default function BaldwinBench(_props: SceneProps) {
  const voice = voiceOf("james-baldwin");
  if (!voice) return null;
  const quoted = isVerbatim(voice);

  return (
    <section data-testid="scene-baldwinBench" className="mx-auto max-w-[32rem] py-[10vh]">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        In his own words
      </p>
      <figure className="mt-6">
        <blockquote>
          <p className="font-display text-2xl leading-snug text-exh-ink md:text-3xl">
            {quoted ? <>&ldquo;{voice.quote.text}&rdquo;</> : voice.quote.text}
            {voice.factRef ? <SourceSup factId={voice.factRef} /> : null}
          </p>
        </blockquote>
        <figcaption className="mt-6">
          <span className="block font-display text-base text-exh-ink">{voice.name}</span>
          <span className="exh-mono block text-xs text-exh-ink-soft">1924 to 1987</span>
          <span className="exh-plat block text-[10px] uppercase tracking-[0.16em] text-exh-ink-soft">
            Televised conversation with Kenneth Clark, 1963
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
