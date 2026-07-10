"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the grade receipt. Reprises the Act 0 lookup from           */
/*  sessionStorage; nothing was ever sent anywhere, so the reprise     */
/*  needs no second permission prompt. If no lookup was made the       */
/*  offer returns once more with the same privacy line. The share-     */
/*  able unit is the AREA's sheet permalink, never the visitor's       */
/*  position.                                                          */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import type { SceneProps } from "./registry";
import {
  locateGround,
  storedGround,
  type GroundHit,
  type LocateResult,
} from "@/lib/exhibit/ground/locate";
import { SourceSupGroup } from "../../shared/SourceSup";
import { PaperCard } from "../../shared/PaperCard";

const GRADE_WORD: Record<string, string> = {
  A: "A, called best",
  B: "B, still desirable",
  C: "C, definitely declining",
  D: "D, hazardous",
};

function ReceiptCard({ hit }: { hit: GroundHit }) {
  const word = hit.grade ? GRADE_WORD[hit.grade] : undefined;
  return (
    <PaperCard data-testid="receipt-card" className="mt-5 max-w-[26rem] p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Grade receipt · the 1940 survey
      </p>
      {word ? (
        <p className="mt-3 font-display text-2xl leading-snug text-exh-ink">
          <span
            aria-hidden="true"
            className="mr-2 inline-block h-3.5 w-3.5 border border-exh-ink/40 align-baseline"
            style={{ backgroundColor: `var(--g-${hit.grade!.toLowerCase()})` }}
          />
          {word}
        </p>
      ) : (
        <p className="mt-3 font-display text-xl leading-snug text-exh-ink">
          Inside the surveyed city, no grade recorded on this ground.
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        The grade the surveyors filed on the ground under you, kept from your
        earlier lookup.
      </p>
      <a
        href={`#room-files:${hit.areaId}`}
        data-testid="receipt-sheet-link"
        className="mt-3 inline-flex min-h-10 items-center text-sm text-exh-blue underline underline-offset-2"
      >
        Read the sheet the surveyors filed on this area
      </a>
      <div className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
        Home Owners&apos; Loan Corporation survey of Chicago, 1939 to 1940.
        <SourceSupGroup factIds={["redlining.holc_survey_chicago"]} />
      </div>
      <p className="mt-4 border-t border-exh-ink/25 pt-2.5 text-xs text-exh-ink-soft">
        Kept on this device only.
      </p>
    </PaperCard>
  );
}

type State =
  | { s: "offer" }
  | { s: "working" }
  | { s: "hit"; hit: GroundHit }
  | { s: "miss" }
  | { s: "denied" };

export default function Receipt(_props: SceneProps) {
  const [state, setState] = useState<State>({ s: "offer" });

  // sessionStorage is client-only; read it after mount so the server
  // and first client render agree
  useEffect(() => {
    const stored = storedGround();
    if (stored) setState({ s: "hit", hit: stored });
  }, []);

  const run = async () => {
    setState({ s: "working" });
    const r: LocateResult = await locateGround();
    if (r.state === "hit") setState({ s: "hit", hit: r.hit });
    else setState({ s: r.state });
  };

  return (
    <section data-testid="scene-receipt" className="max-w-[34rem]">
      {state.s === "hit" ? (
        <>
          <p className="font-display text-xl leading-relaxed text-exh-ink">
            The walk ends where it started, on the ground under you.
          </p>
          <ReceiptCard hit={state.hit} />
        </>
      ) : state.s === "miss" ? (
        <p className="font-display text-lg leading-relaxed text-exh-ink" data-testid="receipt-miss">
          The ground under you was never graded. The 1940 survey stopped at
          the edges of metropolitan Chicago; the century this exhibit shows
          did not.
          <SourceSupGroup factIds={["redlining.holc_survey_chicago"]} />
        </p>
      ) : state.s === "denied" ? (
        <p className="font-display text-lg leading-relaxed text-exh-ink" data-testid="receipt-denied">
          No position was shared, and nothing was recorded. The account above
          stands either way.
        </p>
      ) : (
        <>
          <p className="font-display text-xl leading-relaxed text-exh-ink">
            One question is still open, the one the surveyors answered about
            every block on this map.
          </p>
          <button
            type="button"
            data-testid="receipt-locate-button"
            onClick={run}
            disabled={state.s === "working"}
            className="mt-5 inline-flex min-h-12 items-center justify-center bg-exh-red px-5 py-3 text-left text-xs font-semibold uppercase leading-relaxed tracking-[0.2em] text-exh-linen focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue disabled:cursor-wait disabled:opacity-65"
          >
            {state.s === "working"
              ? "Reading the 1940 boundaries"
              : "What grade is the ground under you?"}
          </button>
          <p className="mt-2.5 text-[0.8rem] text-exh-ink-soft">
            Uses your device location once, with your permission. Nothing
            leaves this page.
          </p>
        </>
      )}
    </section>
  );
}
