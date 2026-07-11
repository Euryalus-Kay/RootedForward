/* ------------------------------------------------------------------ */
/*  R9 copy loader. Flattens data/exhibit/ground-copy.json into an     */
/*  ordered step list with each step's Stage state resolved (states    */
/*  carry forward until a step sets a new one) and the ledger posts    */
/*  accumulated. Pure module, safe on server and client.               */
/* ------------------------------------------------------------------ */
import raw from "../../../../data/exhibit/ground-copy.json";
import type { GroundCopy, GroundStep, ResolvedStep, StageState } from "./types";

export const GROUND_COPY = raw as unknown as GroundCopy;

const OPENING_STAGE: StageState = {
  frame: "citywide",
  era: "1940",
  grades: "full",
  linework: true,
  labels: true,
  cam: "wide",
  tilt: 0,
  veil: "none",
  press: false,
  marksMode: "badge",
};

function resolve(): ResolvedStep[] {
  const out: ResolvedStep[] = [];
  let stage: StageState = OPENING_STAGE;
  let posted: string[] = [];
  let index = 0;
  GROUND_COPY.acts.forEach((act, actIndex) => {
    for (const step of act.steps) {
      if (step.stage) {
        // carry unset flags forward so "marks stay on" needs no
        // repetition. R10 carry rules: cam and marksMode persist like
        // marks; tilt, veil, note, and sr are events that reset unless
        // the new state restates them; press is monotonic (the stamp
        // never lifts once a3-s2 lands it).
        const pressed = stage.press || step.stage.press || false;
        stage = {
          ...stage,
          note: null,
          tilt: 0,
          veil: "none",
          sr: undefined,
          ...step.stage,
          press: pressed,
        };
      }
      if (step.post && step.post.length) posted = [...posted, ...step.post];
      out.push({
        ...(step as GroundStep),
        index,
        actId: act.id,
        actIndex,
        resolvedStage: stage,
        postedThrough: posted,
      });
      index += 1;
    }
  });
  return out;
}

export const RESOLVED_STEPS: ResolvedStep[] = resolve();

export const STEP_BY_ID: Record<string, ResolvedStep> = Object.fromEntries(
  RESOLVED_STEPS.map((s) => [s.id, s])
);

/** chapter number (1-based) for every chapterHead step id, in order */
export const CHAPTER_NUMBERS: Record<string, number> = (() => {
  const heads = RESOLVED_STEPS.filter((s) => s.role === "chapterHead");
  return Object.fromEntries(heads.map((s, i) => [s.id, i + 1]));
})();

export const CHAPTER_COUNT = Object.keys(CHAPTER_NUMBERS).length;

/** the register cursor year for a step (last parseable era carried forward) */
export const CURSOR_YEARS: number[] = (() => {
  let year = 1940;
  return RESOLVED_STEPS.map((s) => {
    const parsed = parseInt(s.resolvedStage.era, 10);
    if (!Number.isNaN(parsed)) year = parsed;
    return year;
  });
})();
