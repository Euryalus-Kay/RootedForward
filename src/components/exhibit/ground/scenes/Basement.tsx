"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "basement". The one warm room, where a person is the      */
/*  artifact. Ruth Wells and Clyde Ross carry the chapter, set large;  */
/*  their words resolve through the voice registry, and the honesty    */
/*  rule holds here exactly as in VoiceCard: quotation marks render    */
/*  only when quoteStatus begins with "verbatim". The registry holds   */
/*  paraphrases for both, so the room shows summaries behind the       */
/*  "in summary" chip rather than invented quotes. The paperwork is    */
/*  demoted to one evidence line; the honest cost is stated; King      */
/*  closes. No photograph: the archive holds no North Lawndale or      */
/*  CBL image in window (the nearest candidate was a 1973 newsstand    */
/*  five miles and five years away), so per the data-absence rule      */
/*  the two voices carry the room unaccompanied.                       */
/* ------------------------------------------------------------------ */
import { isVerbatim, voiceOf } from "@/lib/exhibit/voices";
import FactValue from "../../shared/FactValue";
import SourceSup, { SourceSupGroup } from "../../shared/SourceSup";
import type { SceneProps } from "./registry";

/* one person, set large; the room's walls are their words */
function RoomVoice({ personId }: { personId: string }) {
  const voice = voiceOf(personId);
  if (!voice) return null;
  const verbatim = isVerbatim(voice);
  const words = verbatim ? voice.quote : voice.paraphrase;
  if (!words) return null;
  return (
    <figure className="border-l-2 border-exh-ink/30 pl-4 sm:pl-5">
      {!verbatim && (
        <span className="exh-plat mb-2 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
          in summary
        </span>
      )}
      <blockquote className="font-display text-xl italic leading-relaxed text-exh-ink sm:text-2xl">
        {verbatim ? <>&ldquo;{words.text}&rdquo;</> : words.text}
        {voice.factRef && <SourceSup factId={voice.factRef} />}
      </blockquote>
      <figcaption className="mt-3">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
          {voice.name}
          <span className="exh-mono ml-2 normal-case tracking-normal text-exh-ink-soft">
            {voice.years}
          </span>
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-exh-ink-soft">{voice.role}</p>
        <p className="exh-plat mt-1 text-[10px] uppercase tracking-[0.08em] text-exh-ink-soft">
          {words.source}
        </p>
      </figcaption>
    </figure>
  );
}

export default function Basement(_props: SceneProps) {
  return (
    <section data-testid="scene-basement" aria-label="The church basement" className="max-w-xl">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        The one warm room
      </p>
      <p className="mt-3 font-display text-lg leading-relaxed text-exh-ink">
        January 1968, a church basement in North Lawndale. Neighbors who had bought on contract
        began reading their agreements to each other and heard the same terms on every page.
        They organized as the Contract Buyers League.
        <SourceSupGroup factIds={["cbl.founded_1968"]} />
      </p>

      <div className="mt-8 space-y-8">
        <RoomVoice personId="ruth-wells" />
        <RoomVoice personId="clyde-ross" />
      </div>

      {/* the paperwork, demoted to one evidence line */}
      <div className="mt-8 border-y border-exh-ink/20 py-3">
        <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
          The record, one line
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <FactValue id="cbl.strike_500" size="sm" />
          <FactValue id="cbl.renegotiated_155_by_1971" size="sm" />
          <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
            <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-green">
              the one credit
            </span>
            <FactValue id="cbl.savings" size="sm" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-exh-ink">The strike had a price.</p>
          <div className="mt-1">
            <FactValue id="cbl.evicted_70" size="sm" />
          </div>
        </div>
      </div>

      {/* King closes the room */}
      <div className="mt-8">
        <p className="text-sm leading-relaxed text-exh-ink-soft">
          Two years before the basement filled, King had taken a flat in the same neighborhood.
          <SourceSupGroup factIds={["people.king_lawndale_1966"]} />
        </p>
        <div className="mt-4">
          <RoomVoice personId="martin-luther-king" />
        </div>
      </div>
    </section>
  );
}
