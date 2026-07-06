"use client";
/* ------------------------------------------------------------------ */
/*  Grade Your Block, the Machine Room appraisal station. The 1939     */
/*  HOLC Area Description form from grade_your_block.json, its twelve  */
/*  field labels reproduced verbatim (period language, chipped as      */
/*  such), answered through plain-language selects the visitor can     */
/*  set as generously as they like. The rig is the form's own          */
/*  occupancy and infiltration lines. The instant line 1-D is          */
/*  anything but zero (or 1-E reports Black families arriving) the     */
/*  Security Grade select is held at D under a red HAZARDOUS strike,   */
/*  and every other good answer visibly does nothing. The debrief      */
/*  shows the manuals that built the form and a real Chicago sheet     */
/*  from the survey record.                                            */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import gybJson from "../../../../../data/exhibit/grade_your_block.json";
import RiggedInstrument, {
  RiggedRecordPanel,
  type RiggedAnswers,
  type RiggedField,
  type RiggedSelectOption,
  type RiggedShellConfig,
} from "../RiggedInstrument";

/* ---------------- source data ---------------- */

interface GybSourceField {
  fieldId: string;
  formItem: string;
  section: string;
  historicalLabel: string;
  type: string;
  options?: string[];
}

const GYB = gybJson as unknown as {
  fields: GybSourceField[];
  lockRule: { fieldId: string; note: string };
  sampleAreas: number[];
};

const LOCK_FIELD = GYB.lockRule.fieldId; // negro_percent
const INFILTRATION_FIELD = "infiltration_of";
const ZERO = "0";
const NO_INFILTRATION = "None";
const ARRIVING = "Black families arriving";

/** plain-language answer sets for the form's free-entry lines; fields the
 *  record itself stored as selects keep their own transcribed options */
const FRIENDLY: Record<string, { options: string[]; defaultValue: string }> = {
  occupation_or_type: {
    options: [
      "Professional and business, steady incomes",
      "White collar and skilled trades",
      "Mixed wage earners",
    ],
    defaultValue: "Professional and business, steady incomes",
  },
  foreign_born_percent: { options: ["0%", "5%", "15%", "40%"], defaultValue: "0%" },
  foreign_born_nationality: {
    options: ["None noted", "Mixed European", "Many nations"],
    defaultValue: "None noted",
  },
  negro_percent: { options: [ZERO, "2%", "10%", "60%"], defaultValue: ZERO },
  infiltration_of: { options: [NO_INFILTRATION, ARRIVING], defaultValue: NO_INFILTRATION },
  buildings_type: {
    options: [
      "Single family homes, six to eight rooms",
      "Well kept two flats",
      "Larger flats and rooming houses",
    ],
    defaultValue: "Single family homes, six to eight rooms",
  },
  average_age: { options: ["5 years", "15 years", "30 years", "45 years"], defaultValue: "5 years" },
  home_ownership: { options: ["90%", "75%", "50%", "25%"], defaultValue: "90%" },
};

/** best answer first for the record's own select fields */
const RECORD_OPTION_ORDER: Record<string, string[]> = {
  construction: ["Brick", "Frame and brick", "Brick- frame", "Frame- brick", "Frame- few brick", "Frame"],
  repair: ["Very good", "Good", "Fairly good", "Fair", "Fair to poor", "Poor"],
  predicted_price_trend: ["Up", "Firm", "Static", "No change", "Weak", "Down"],
  mortagage_funds: ["Ample", "Ample 5%", "FHA", "Limited", "Very limited", "None"],
};

function toOptions(values: string[]): RiggedSelectOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

const gradeHeld = (a: RiggedAnswers): boolean =>
  a[LOCK_FIELD] !== ZERO || a[INFILTRATION_FIELD] !== NO_INFILTRATION;

/* ---------------- fields ---------------- */

const FIELDS: RiggedField[] = [
  ...GYB.fields.map((f): RiggedField => {
    const friendly = FRIENDLY[f.fieldId];
    const ordered = RECORD_OPTION_ORDER[f.fieldId];
    const options = friendly
      ? friendly.options
      : (ordered ?? f.options ?? []).filter((o, i, arr) => arr.indexOf(o) === i);
    return {
      kind: "select",
      id: f.fieldId,
      label: f.historicalLabel,
      formItem: f.formItem,
      section: f.section,
      historical: true,
      options: toOptions(options),
      defaultValue: friendly?.defaultValue ?? options[0],
    };
  }),
  {
    kind: "select",
    id: "security_grade",
    label: "Security Grade",
    historical: true,
    options: [
      { value: "A", label: "A, First" },
      { value: "B", label: "B, Second" },
      { value: "C", label: "C, Third" },
      { value: "D", label: "D, Fourth" },
    ],
    defaultValue: "A",
    lockWhen: (a) => (gradeHeld(a) ? "D" : null),
    lockNote: "Lines 1-D and 1-E hold the grade at Fourth. No other line on this form can move it.",
    lockStamp: { text: "HAZARDOUS", tone: "red" },
  },
  {
    kind: "attempt-note",
    id: "refile-note",
    text: "You may re-file this form up to three times. Try any strategy the lines allow.",
  },
];

/* ---------------- the real sheet, fetched from the survey record ----- */

const DESCRIPTIONS_URL = "/exhibit-data/holc-descriptions.json";
const RECORD_AREA_ID = GYB.sampleAreas[0];

interface RecordArea {
  areaId: number | string;
  grade: string;
  name?: string | null;
  excerpt: string;
  excerptLabel?: string;
  security_grade_fields?: Record<string, string>;
}

interface RecordCache {
  promise: Promise<void>;
  area: RecordArea | null;
  attribution: string | null;
  done: boolean;
}

let recordCache: RecordCache | null = null;

function loadRecord(): RecordCache {
  if (recordCache) return recordCache;
  const entry: RecordCache = { promise: Promise.resolve(), area: null, attribution: null, done: false };
  entry.promise = fetch(DESCRIPTIONS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${DESCRIPTIONS_URL}`);
      return res.json();
    })
    .then((json: { attribution?: string; areas?: RecordArea[] }) => {
      entry.area = (json.areas ?? []).find((a) => String(a.areaId) === String(RECORD_AREA_ID)) ?? null;
      entry.attribution = json.attribution ?? null;
    })
    .catch(() => {
      entry.area = null;
    })
    .finally(() => {
      entry.done = true;
    });
  recordCache = entry;
  return entry;
}

/** the real record's field keys, shown with the same verbatim labels the
 *  visitor just worked, plus the sheet's own filing lines */
const RECORD_ROWS: Array<{ key: string; label: string }> = [
  { key: "security_grade", label: "Security Grade" },
  ...GYB.fields
    .filter((f) =>
      ["occupation_or_type", "foreign_born_percent", "negro_percent", "infiltration_of", "mortagage_funds"].includes(
        f.fieldId
      )
    )
    .map((f) => ({ key: f.fieldId, label: f.historicalLabel })),
];

function GybRealRecord() {
  const [state, setState] = useState<{ done: boolean; area: RecordArea | null; attribution: string | null }>(() => {
    if (typeof window !== "undefined" && recordCache?.done) {
      return { done: true, area: recordCache.area, attribution: recordCache.attribution };
    }
    return { done: false, area: null, attribution: null };
  });

  useEffect(() => {
    let alive = true;
    const entry = loadRecord();
    const publish = () => {
      if (alive) setState({ done: true, area: entry.area, attribution: entry.attribution });
    };
    if (entry.done) publish();
    else entry.promise.then(publish);
    return () => {
      alive = false;
    };
  }, []);

  const { done, area, attribution } = state;
  const sheet = area?.security_grade_fields;

  return (
    <RiggedRecordPanel label="from the 1939 to 1940 survey record" warning>
      {!done && <p className="text-sm leading-snug text-exh-ink-soft">Reading the survey record.</p>}
      {done && !area && (
        <p className="text-sm leading-snug text-exh-ink-soft">
          The digitized sheet is unavailable right now.
        </p>
      )}
      {area && (
        <div data-testid="gyb-real-record">
          <p className="exh-mono text-[11px] text-exh-ink/75">
            Area {sheet?.area_number ?? String(area.areaId)}
            {sheet?.location ? `, ${sheet.location}` : ""}
            {sheet?.date ? `. ${sheet.date}.` : "."}
          </p>
          {area.excerptLabel && (
            <p className="exh-mono mt-2 text-[10px] text-exh-ink/60">{area.excerptLabel}</p>
          )}
          <blockquote className="exh-serif mt-1 text-sm leading-snug text-exh-ink italic">
            &ldquo;{area.excerpt.trim()}&rdquo;
          </blockquote>
          {sheet && (
            <div className="mt-2 space-y-1 border-t border-exh-ink/15 pt-2">
              {RECORD_ROWS.filter((r) => sheet[r.key]).map((r) => (
                <p key={r.key} className="exh-mono text-[11px] leading-snug text-exh-ink/85">
                  <span className="text-exh-ink/55">{r.label}</span> {sheet[r.key]}
                </p>
              ))}
            </div>
          )}
          {attribution && (
            <p className="mt-2 text-[10px] leading-snug text-exh-ink/60">{attribution}</p>
          )}
        </div>
      )}
    </RiggedRecordPanel>
  );
}

/* ---------------- the instrument ---------------- */

const CONFIG: RiggedShellConfig = {
  id: "grade-your-block",
  formTitle: "Area Description form",
  era: "Chicago, 1939 to 1940",
  provenance: "field labels verbatim from the HOLC form",
  intro: "Fill the sheet for the best block you can imagine. Then file the grade.",
  headerPanel: (
    <RiggedRecordPanel label="form fields from the record" warning>
      <p className="text-sm leading-snug text-exh-ink-soft">
        The item numbers, section headings, and field labels below are the form&rsquo;s own,
        word for word. The answers you can choose from are plain language, and every generous
        answer is allowed.
      </p>
    </RiggedRecordPanel>
  ),
  fields: FIELDS,
  actionLabel: "File the grade",
  evaluate: (a) => {
    if (gradeHeld(a)) {
      return {
        locked: true,
        stampText: "HAZARDOUS",
        stampTone: "red",
        verdictLine:
          "Filed at D. With line 1-D above zero, no answer about repair, income, or ownership could move the grade.",
      };
    }
    const g = a.security_grade;
    return {
      locked: false,
      stampText: `GRADE ${g} FILED`,
      stampTone: g === "D" ? "red" : "ink",
      verdictLine:
        g === "A"
          ? "Filed as you graded it. Keep line 1-D at zero and the form obeys your every entry."
          : "Filed as you graded it. The form accepted every entry.",
    };
  },
  maxAttempts: 3,
  debrief: {
    heading: "The grade was decided before you sat down",
    body:
      "The lock you hit was the design. Period appraisal manuals scored the presence of Black residents as a risk to value in itself, so this sheet treats any entry above zero on line 1-D as a hazard that no repair, income, or ownership answer can offset. Surveyors filed the same judgment across Chicago in 1939 and 1940. A sheet from the real record is below.",
    factRefs: ["redlining.babcock_manual", "redlining.holc_survey_chicago"],
    realRecord: <GybRealRecord />,
  },
};

export default function GradeYourBlock() {
  return <RiggedInstrument config={CONFIG} />;
}
