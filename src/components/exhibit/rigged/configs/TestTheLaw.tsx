"use client";
/* ------------------------------------------------------------------ */
/*  Test the Law, the short 1953 conservation-standard station.        */
/*  Honesty rule, kept on the surface: no statute text is on file, so  */
/*  the form is framed as the standard the second wave used and its    */
/*  provenance chip says exactly that, with the tier carried by a      */
/*  SourceSup to the documented commission. A thriving described       */
/*  block passes every readout; the only grounds the form offers is    */
/*  possible future blight; the CONDEMN stamp works and the refusal    */
/*  lever returns the same dead line every time.                       */
/* ------------------------------------------------------------------ */
import RiggedInstrument, { type RiggedShellConfig } from "../RiggedInstrument";

const CONFIG: RiggedShellConfig = {
  id: "test-the-law",
  formTitle: "The conservation standard",
  era: "1953",
  provenance: "described from renewal-era accounts; statute text pending archival sourcing",
  provenanceFactRef: "renewal.secc_1952",
  intro: "The block before you is thriving. Rule on the petition to clear it.",
  fields: [
    { kind: "readout", id: "condition", label: "Condition", value: "Fresh paint. Passing." },
    {
      kind: "readout",
      id: "organization",
      label: "Block organization",
      value: "Active block club. Passing.",
    },
    { kind: "readout", id: "upkeep", label: "Upkeep", value: "Gardens kept. Passing." },
    { kind: "readout", id: "taxes", label: "Taxes", value: "Paid in full. Passing." },
    {
      kind: "select",
      id: "grounds",
      label: "Grounds for condemnation",
      options: [{ value: "possible-future-blight", label: "possible future blight" }],
    },
    {
      kind: "attempt-note",
      id: "statute-note",
      text: "The petition may be refused only on statutory grounds.",
    },
  ],
  actionLabel: "Condemn",
  evaluate: () => ({
    locked: true,
    stampText: "CONDEMNED",
    stampTone: "red",
    verdictLine: "Possible future blight is grounds enough. The block clears.",
  }),
  maxAttempts: 1,
  incompleteLine: "Grounds must be entered before the petition is ruled on.",
  refusalAction: { label: "Refuse the petition", line: "No statutory barrier found." },
  debrief: {
    heading: "The second wave needed no blight at all",
    body:
      "The first wave of clearance condemned present blight. The standard the second wave used condemned the possibility of it, so a sound block could be taken for what it might become. That is the tool the renewal commission carried through the 1950s.",
    factRefs: ["renewal.secc_1952"],
  },
};

export default function TestTheLaw() {
  return <RiggedInstrument config={CONFIG} />;
}
