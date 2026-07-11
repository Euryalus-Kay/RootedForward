"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the bridge. Answers the visitor who concedes everything     */
/*  through 1970 with three evidence rows from the record since, all   */
/*  registry-sourced, plus two register notes. Evidence rows, not      */
/*  milestones; every figure on screen resolves to a fact id.          */
/* ------------------------------------------------------------------ */
import type { ReactNode } from "react";
import type { SceneProps } from "./registry";
import { FactValue } from "../../shared/FactValue";
import { SourceSup, SourceSupGroup } from "../../shared/SourceSup";

function RowTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg leading-snug text-exh-ink">{children}</h3>;
}

export default function Bridge(_props: SceneProps) {
  return (
    <section data-testid="scene-bridge" className="max-w-[34rem]">
      <p className="font-display text-xl leading-relaxed text-exh-ink">
        Say the story ended in 1970, two generations back. The record since
        then answers on its own.
      </p>

      <div className="mt-9 flex flex-col gap-8">
        <article className="border-t border-exh-ink/25 pt-4" data-testid="bridge-row-instrument">
          <RowTitle>The instrument returns</RowTitle>
          <div className="mt-2 text-[0.95rem] leading-relaxed text-exh-ink">
            After the 2008 crash, contract-for-deed selling returned to Black
            neighborhoods; reporting traced it across Chicago by 2016.
            <SourceSup factId="contracts.post_2008_return" />
          </div>
        </article>

        <article className="border-t border-exh-ink/25 pt-4" data-testid="bridge-row-grades">
          <RowTitle>The grades still price the ground</RowTitle>
          <div className="mt-2 text-[0.95rem] leading-relaxed text-exh-ink">
            Measured across today’s census tracts matched to the surveyors’ polygons.
            <SourceSup factId="redlining.holc_survey_chicago" />
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <FactValue id="present.holc_income_gradient" size="sm" />
            </li>
            <li>
              <FactValue id="present.holc_ownership_gradient" size="sm" />
            </li>
            <li>
              <FactValue id="present.holc_subsidy_siting" size="sm" />
            </li>
          </ul>
        </article>

        <article className="border-t border-exh-ink/25 pt-4" data-testid="bridge-row-moving">
          <RowTitle>The ground is moving again</RowTitle>
          <div className="mt-2 text-[0.95rem] leading-relaxed text-exh-ink">
            In Woodlawn, on the blocks around the new presidential center.
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {/* big number first; the price figure leads the row and
                the supporting record follows */}
            <li>
              <FactValue id="present.woodlawn_prices" size="md" />
            </li>
            <li>
              <FactValue id="present.obama_center_opened" size="sm" />
            </li>
            <li>
              <FactValue id="present.woodlawn_affordable" size="sm" />
            </li>
            <li>
              <FactValue id="present.woodlawn_ordinance_2020" size="sm" />
            </li>
            <li>
              <FactValue id="present.audit_2026" size="sm" />
            </li>
          </ul>
        </article>
      </div>

      <div className="mt-10 border-l-2 border-exh-ink/25 pl-3.5 text-sm leading-relaxed text-exh-ink-soft">
        <div>
          Illinois created a process for removing racial covenants from deeds
          in 2022.
          <SourceSupGroup factIds={["redlining.illinois_removal_2022"]} />
        </div>
        <div className="mt-2">
          The Realtors delivered a formal apology in November 2020.
          <SourceSupGroup factIds={["code.apology_2020"]} />
        </div>
      </div>
    </section>
  );
}
