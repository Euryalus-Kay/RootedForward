"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "Article34". The 1924 rule set alone at display size on   */
/*  empty cream, the smallness of the instrument against the size of   */
/*  its consequence. The verbatim text ships in ethics_exam.json (the  */
/*  same string the machine room quoted); this file never retypes it.  */
/*  One source line under the quote, then the 1921 Chicago expulsion   */
/*  vote as a single caption sentence.                                 */
/* ------------------------------------------------------------------ */
import ethicsJson from "../../../../../data/exhibit/ethics_exam.json";
import FactValue from "../../shared/FactValue";
import { SourceSupGroup } from "../../shared/SourceSup";
import type { SceneProps } from "./registry";

const ETHICS = ethicsJson as unknown as {
  articleText: string;
  articleFactRef: string;
  expulsionFactRef: string;
};

export default function Article34(_props: SceneProps) {
  return (
    <figure data-testid="scene-article34" className="max-w-[34rem]">
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        The realtors&rsquo; rule, quoted in full
      </p>
      <blockquote className="exh-serif mt-6 font-display text-2xl leading-[1.45] text-exh-ink md:text-3xl md:leading-[1.4]">
        &ldquo;{ETHICS.articleText}&rdquo;
      </blockquote>
      <figcaption className="mt-6">
        <FactValue id={ETHICS.articleFactRef} size="sm" mono={false} />
        {/* div, not p: the citation popover mounts block elements inline */}
        <div className="mt-3 text-sm leading-relaxed text-exh-ink-soft">
          Chicago&rsquo;s board had already set the penalty in 1921. Expulsion awaited any member
          who sold to a Black family on a white block.
          <SourceSupGroup factIds={[ETHICS.expulsionFactRef]} />
        </div>
      </figcaption>
    </figure>
  );
}
