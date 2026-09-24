/* ------------------------------------------------------------------ */
/*  The walk survey.                                                   */
/*                                                                     */
/*  Two short cards in the iPhone app. The first comes up when a       */
/*  walker leaves the opening page for stop one, the second at the end */
/*  of the walk, and the two scales repeat so the change between them  */
/*  can be measured. The owner asked for it in September 2026 to show  */
/*  the tours' impact, kept under twenty seconds, sliders and multiple */
/*  choice only, anonymous, and skippable.                             */
/*                                                                     */
/*  The app draws whatever this says. It rides in every /api/walk      */
/*  payload, so the wording can change without an App Store release,   */
/*  and /api/walk/survey checks every answer against these questions.  */
/*                                                                     */
/*  Change the words freely. Changing a question's id or kind, or the  */
/*  number of points on a scale, needs a new survey id as well,        */
/*  because answers are compared within one id. A new id also asks     */
/*  every walker again, including the ones who already answered.       */
/*                                                                     */
/*  Setting WALK_SURVEY_ON to false takes the cards out of the app at  */
/*  its next refresh. Answers already given are kept.                  */
/* ------------------------------------------------------------------ */

export type WalkSurveyPhase = "pre" | "post";

export interface WalkSurveyOption {
  /** what is stored, so a label can be reworded without breaking the data */
  value: string;
  label: string;
}

export interface WalkSurveyQuestion {
  id: string;
  kind: "scale" | "choice";
  prompt: string;
  /** scale only. One word per point, lowest first. Stored as 1 to n. */
  labels?: string[];
  /** choice only. Stored as the option's value. */
  options?: WalkSurveyOption[];
}

export interface WalkSurveyPart {
  title: string;
  /** Left empty on purpose: the owner wants no caption under the title
   *  (September 24, 2026). The key stays because app build 33 requires
   *  it; later builds skip an empty note. */
  note: string;
  body: string;
  submit: string;
  questions: WalkSurveyQuestion[];
}

export interface WalkSurvey {
  /** answers carry it, and a new one asks everyone again */
  id: string;
  skip: string;
  thanks: string;
  pre: WalkSurveyPart;
  post: WalkSurveyPart;
}

export const WALK_SURVEY_ON = true;

/** Asked before and after, word for word, so the two can be compared. */
const KNOWLEDGE: WalkSurveyQuestion = {
  id: "knowledge",
  kind: "scale",
  prompt: "How much do you know about redlining and housing discrimination?",
  labels: ["Nothing", "A little", "Some", "Quite a bit", "A lot"],
};

const LASTING_EFFECT: WalkSurveyQuestion = {
  id: "lasting_effect",
  kind: "scale",
  prompt: "How much do you think past housing laws shape who lives where today?",
  labels: ["Not at all", "A little", "Somewhat", "Quite a bit", "A great deal"],
};

const BODY =
  "We use this data to measure the impact of our tours and how much people know about these topics. All data collected is anonymous.";

export const WALK_SURVEY: WalkSurvey = {
  id: "impact-2026-09",
  skip: "Skip",
  thanks: "Thank you",
  pre: {
    title: "Pre-tour survey",
    note: "",
    body: BODY,
    submit: "Submit",
    questions: [
      KNOWLEDGE,
      LASTING_EFFECT,
      {
        id: "role",
        kind: "choice",
        prompt: "Which describes you best?",
        options: [
          { value: "student", label: "Student" },
          { value: "teacher", label: "Teacher" },
          { value: "resident", label: "Local resident" },
          { value: "visitor", label: "Visitor" },
        ],
      },
    ],
  },
  post: {
    title: "Post-tour survey",
    note: "",
    body: BODY,
    submit: "Submit",
    questions: [
      KNOWLEDGE,
      LASTING_EFFECT,
      {
        id: "recommend",
        kind: "choice",
        prompt: "Would you recommend this tour to a friend?",
        options: [
          { value: "yes", label: "Yes" },
          { value: "maybe", label: "Maybe" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
};

/** What /api/walk carries. Null when the survey is switched off, so
 *  the app shows nothing. */
export function activeWalkSurvey(): WalkSurvey | null {
  return WALK_SURVEY_ON ? WALK_SURVEY : null;
}

/**
 * Every answer checked against its question, and every question
 * answered. The app only lets a card be sent complete, so anything
 * less is not the app and is refused whole rather than stored in part.
 */
export function cleanSurveyAnswers(
  phase: WalkSurveyPhase,
  raw: unknown
): Record<string, number | string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const given = raw as Record<string, unknown>;
  const questions = WALK_SURVEY[phase].questions;
  if (Object.keys(given).length !== questions.length) return null;

  const out: Record<string, number | string> = {};
  for (const q of questions) {
    const value = given[q.id];
    if (q.kind === "scale") {
      const points = q.labels?.length ?? 0;
      if (typeof value !== "number" || !Number.isInteger(value)) return null;
      if (value < 1 || value > points) return null;
      out[q.id] = value;
    } else {
      if (typeof value !== "string") return null;
      if (!q.options?.some((o) => o.value === value)) return null;
      out[q.id] = value;
    }
  }
  return out;
}
