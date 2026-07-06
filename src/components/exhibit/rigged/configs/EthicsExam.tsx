"use client";
/* ------------------------------------------------------------------ */
/*  The Ethics Exam, the Machine Room station for THE CODE (M5).       */
/*  Article 34 of the 1924 Realtors' code of ethics is the framed      */
/*  exam header, verbatim from the record. Two scenario questions      */
/*  each take one of two 48px choices, Sell or Refuse; marking the     */
/*  exam lands the era's own outcome for every combination. A sale     */
/*  is EXPELLED with the license line. A refusal is ETHICAL, the       */
/*  code's own word. Once the visitor has seen both outcomes (or has   */
/*  spent every marking) the debrief lands from the data file. All     */
/*  scenario and outcome text flows from ethics_exam.json only.        */
/* ------------------------------------------------------------------ */
import examJson from "../../../../../data/exhibit/ethics_exam.json";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import RiggedInstrument, {
  RiggedRecordPanel,
  type RiggedField,
  type RiggedShellConfig,
  type RiggedVerdict,
} from "../RiggedInstrument";

interface ExamScenario {
  scenarioId: string;
  prompt: string;
  sellOutcome: string;
  refuseOutcome: string;
  sellStamp: string;
  refuseStamp: string;
}

const EXAM = examJson as unknown as {
  articleText: string;
  articleFactRef: string;
  expulsionFactRef: string;
  scenarios: ExamScenario[];
  debrief: { heading: string; body: string; factRefs: string[] };
};

const SELL = "sell";
const REFUSE = "refuse";
const QUESTION_WORD = ["Question one", "Question two", "Question three"];

const FIELDS: RiggedField[] = EXAM.scenarios.map((s, i) => ({
  kind: "select",
  id: s.scenarioId,
  label: QUESTION_WORD[i] ?? `Question ${i + 1}`,
  note: s.prompt,
  display: "buttons",
  options: [
    { value: SELL, label: "Sell" },
    { value: REFUSE, label: "Refuse" },
  ],
}));

function markExam(a: Record<string, string>): RiggedVerdict {
  const fieldNotes: Record<string, string> = {};
  for (const s of EXAM.scenarios) {
    fieldNotes[s.scenarioId] = a[s.scenarioId] === SELL ? s.sellOutcome : s.refuseOutcome;
  }
  const sold = EXAM.scenarios.find((s) => a[s.scenarioId] === SELL);
  if (sold) {
    return {
      locked: true,
      stampText: sold.sellStamp,
      stampTone: "ink",
      verdictLine: sold.sellOutcome,
      fieldNotes,
    };
  }
  const first = EXAM.scenarios[0];
  return {
    locked: true,
    stampText: first.refuseStamp,
    stampTone: "ink",
    verdictLine: first.refuseOutcome,
    fieldNotes,
  };
}

const CONFIG: RiggedShellConfig = {
  id: "ethics-exam",
  formTitle: "The Ethics Exam",
  era: "1924",
  provenance: "article text verbatim; outcomes follow the documented rule",
  intro: "Answer both questions the way a decent person would. The code will mark you.",
  headerPanel: (
    <RiggedRecordPanel label="Article 34, from the 1924 code of ethics" warning>
      <blockquote className="exh-serif text-sm leading-snug text-exh-ink italic sm:text-base">
        &ldquo;{EXAM.articleText}&rdquo;
        <SourceSup factId={EXAM.articleFactRef} />
      </blockquote>
      <div className="mt-2">
        <FactValue id={EXAM.expulsionFactRef} size="sm" />
      </div>
    </RiggedRecordPanel>
  ),
  fields: FIELDS,
  actionLabel: "Mark the exam",
  evaluate: markExam,
  maxAttempts: 4,
  incompleteLine: "Both questions must be answered before the exam is marked.",
  /* the lesson needs both outcomes on the desk; the attempt cap still holds */
  debriefWhen: (history) => {
    const stamps = new Set(history.map((v) => v.stampText));
    return EXAM.scenarios.some((s) => stamps.has(s.sellStamp)) &&
      EXAM.scenarios.some((s) => stamps.has(s.refuseStamp));
  },
  debrief: {
    heading: EXAM.debrief.heading,
    body: EXAM.debrief.body,
    factRefs: EXAM.debrief.factRefs,
  },
};

export default function EthicsExam() {
  return <RiggedInstrument config={CONFIG} />;
}
