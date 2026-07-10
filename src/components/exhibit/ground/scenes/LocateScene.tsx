"use client";
/* ------------------------------------------------------------------ */
/*  Act 0's one tap. The card renders complete without any permission  */
/*  prompt (the exhibit's own ground is the pre-rendered answer); the  */
/*  rust button is the opt-in. Grade words follow the files room. The  */
/*  result feeds the Act 6 receipt through sessionStorage only.        */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import { locateGround, type LocateResult } from "@/lib/exhibit/ground/locate";
import { SourceSupGroup } from "../../shared/SourceSup";

const GRADE_WORD: Record<string, string> = {
  A: "A, called best",
  B: "B, still desirable",
  C: "C, definitely declining",
  D: "D, hazardous",
};

type State = { s: "idle" } | { s: "working" } | { s: "done"; r: LocateResult };

export default function LocateScene() {
  const [state, setState] = useState<State>({ s: "idle" });

  const run = async () => {
    setState({ s: "working" });
    const r = await locateGround();
    setState({ s: "done", r });
  };

  return (
    <aside className="ground-locate" data-testid="ground-locate" id="find-your-ground">
      <p className="gl-default">
        The surveyors wrote three of the four grades onto this one township, B, C, and D, within
        a couple of miles of each other. The sheets they filed are all in this exhibit.
        <SourceSupGroup factIds={["redlining.holc_survey_chicago"]} />
      </p>
      {state.s !== "done" ? (
        <>
          <button
            type="button"
            className="gl-button"
            data-testid="ground-locate-button"
            onClick={run}
            disabled={state.s === "working"}
          >
            {state.s === "working" ? "Reading the 1940 boundaries" : "What grade is the ground under you?"}
          </button>
          <p className="gl-privacy">
            Uses your device location once, with your permission. Nothing leaves this page.
          </p>
        </>
      ) : state.r.state === "hit" ? (
        <p className="gl-result" data-testid="ground-locate-result">
          {state.r.hit.grade && GRADE_WORD[state.r.hit.grade] ? (
            <>
              In 1940 the surveyors graded the ground under you{" "}
              <strong data-grade={state.r.hit.grade}>{GRADE_WORD[state.r.hit.grade]}</strong>. The
              sheet they filed on it is in this exhibit&apos;s study room, and the receipt returns
              at the end of the walk.
            </>
          ) : (
            <>The ground under you sits inside the surveyed city but carries no grade on the 1940 sheet.</>
          )}
        </p>
      ) : state.r.state === "miss" ? (
        <p className="gl-result" data-testid="ground-locate-result">
          This survey never reached the ground under you. The 1940 survey graded metropolitan
          Chicago; 238 other cities got maps of their own.
          <SourceSupGroup
            factIds={["redlining.holc_survey_chicago", "redlining.holc_239_cities"]}
          />
        </p>
      ) : (
        <p className="gl-result" data-testid="ground-locate-result">
          No position was shared. The walk works the same without it, and the offer returns at
          the end.
        </p>
      )}
    </aside>
  );
}
