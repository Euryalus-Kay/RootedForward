"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "hansberryVoice" (#a3-hansberry). Lorraine Hansberry at   */
/*  the South Rhodes address, no avatar. Words come from the voice     */
/*  registry; the exhibit's honesty rule holds here as everywhere,     */
/*  quotation marks appear only when the registry entry is verbatim.   */
/*  The current entry is a sourced paraphrase, so the card labels the  */
/*  words "in summary" and renders them without quote marks. If the    */
/*  registry ever carries a verbatim quote the card upgrades itself.   */
/* ------------------------------------------------------------------ */
import type { ReactNode } from "react";
import type { SceneProps } from "./registry";
import { isVerbatim, voiceOf } from "@/lib/exhibit/voices";
import SourceSup, { SourceSupGroup } from "../../shared/SourceSup";

/* published titles render in italic wherever the registry text names them */
const TITLES = ["A Raisin in the Sun", "To Be Young, Gifted and Black"];

function withTitles(text: string): ReactNode[] {
  for (const title of TITLES) {
    const at = text.indexOf(title);
    if (at !== -1) {
      return [
        ...withTitles(text.slice(0, at)),
        <i key={title}>{title}</i>,
        ...withTitles(text.slice(at + title.length)),
      ];
    }
  }
  return text ? [text] : [];
}

export default function HansberryVoice(_props: SceneProps) {
  const voice = voiceOf("lorraine-hansberry");
  if (!voice) return null;

  const verbatim = isVerbatim(voice);
  const words = verbatim ? voice.quote : voice.paraphrase;
  if (!words) return null;

  return (
    <figure className="mx-auto max-w-md" data-testid="scene-hansberryVoice">
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        6140 South Rhodes Avenue
        <SourceSupGroup factIds={["people.lorraine_hansberry"]} />
      </p>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        The Hansberrys moved here in 1937, inside covenanted territory. One of the children in
        the house was seven-year-old Lorraine.
        <SourceSupGroup factIds={["people.lorraine_hansberry", "cases.hansberry_1940"]} />
      </p>

      <blockquote className="mt-5 border-l-2 border-exh-ink/30 pl-4">
        {verbatim && (
          <span className="exh-plat mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
            In her own words
          </span>
        )}
        {!verbatim && (
          <span className="exh-plat mb-1.5 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[11px] md:text-[9px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
            in summary
          </span>
        )}
        <p className="font-display text-lg italic leading-relaxed text-exh-ink">
          {verbatim ? <>&ldquo;{withTitles(words.text)}&rdquo;</> : withTitles(words.text)}
          {voice.factRef && <SourceSup factId={voice.factRef} />}
        </p>
      </blockquote>

      <figcaption className="mt-3 pl-4">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.18em] text-exh-ink">
          {voice.name}
          <span className="exh-mono ml-2 font-normal normal-case tracking-normal text-exh-ink-soft">
            {voice.years}
          </span>
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-exh-ink-soft">{voice.role}</p>
        <p className="mt-1.5 text-[11px] leading-snug text-exh-ink-soft">{withTitles(words.source)}</p>
      </figcaption>
    </figure>
  );
}
