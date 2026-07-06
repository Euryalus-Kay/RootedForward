"use client";
/* ------------------------------------------------------------------ */
/*  You Are the Commission, the Machine Room station for THE           */
/*  BULLDOZER (M2). Three parcel dossiers from dossiers.json sit side  */
/*  by side, each a described composite of a documented building type  */
/*  and labeled as such. The blight checklist is the instrument. Its   */
/*  four lines are readouts from the record's categories, not visitor  */
/*  inputs. PROTECT THIS BLOCK always returns the same dead line, and  */
/*  the APPROVED FOR CLEARANCE stamp is the only control that works.   */
/*  Once all three parcels are ruled, one shared debrief drawer        */
/*  delivers the checklist's lesson with the plan's documented         */
/*  numbers.                                                           */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef, useState } from "react";
import dossiersJson from "../../../../../data/exhibit/dossiers.json";
import { announce } from "@/lib/exhibit/focus";
import { useInteractive } from "../../interactives/InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import SourceSup from "../../shared/SourceSup";
import RiggedInstrument, {
  RiggedDebriefDrawer,
  type RiggedField,
  type RiggedShellConfig,
} from "../RiggedInstrument";

interface Parcel {
  parcelId: string;
  title: string;
  described: string;
  checklist: { age: boolean; density: boolean; mixedUse: boolean; obsolescence: boolean };
  typeNote: string;
}

const DOSSIERS = dossiersJson as unknown as {
  checklistFactRef: string;
  planFactRefs: string[];
  parcels: Parcel[];
  verdict: { approveStamp: string; protectResult: string; lesson: string };
};

const CHECKLIST_LINES: Array<{ key: keyof Parcel["checklist"]; label: string }> = [
  { key: "age", label: "Age" },
  { key: "density", label: "Density" },
  { key: "mixedUse", label: "Mixed use" },
  { key: "obsolescence", label: "Obsolescence" },
];

/** what the stamp line says for each dossier, from its own checklist */
const RULING_LINE: Record<string, string> = {
  "kitchenette-firetrap": "Age, density, and obsolescence check. Cleared.",
  "sound-six-flat": "Age and density check. Upkeep is not a line on this checklist. Cleared.",
  "artist-storefronts": "Every line checks. Cleared.",
};

function checklistFields(parcel: Parcel): RiggedField[] {
  return CHECKLIST_LINES.map(({ key, label }) => ({
    kind: "readout",
    id: key,
    label,
    value: parcel.checklist[key] ? "checked" : "not checked",
  }));
}

export default function YouAreTheCommission() {
  const api = useInteractive();
  const [ruled, setRuled] = useState<string[]>([]);
  const allRuled = ruled.length === DOSSIERS.parcels.length;

  const configs = useMemo<RiggedShellConfig[]>(
    () =>
      DOSSIERS.parcels.map((parcel) => ({
        id: `commission-${parcel.parcelId}`,
        formTitle: "Blight checklist",
        era: "",
        provenance: "",
        intro: "",
        fields: checklistFields(parcel),
        actionLabel: "Approve for clearance",
        evaluate: () => ({
          locked: false,
          stampText: DOSSIERS.verdict.approveStamp,
          stampTone: "red",
          verdictLine: RULING_LINE[parcel.parcelId] ?? "The checklist is satisfied. Cleared.",
        }),
        maxAttempts: 1,
        debrief: null,
        refusalAction: { label: "Protect this block", line: DOSSIERS.verdict.protectResult },
        onVerdict: () =>
          setRuled((prev) => (prev.includes(parcel.parcelId) ? prev : [...prev, parcel.parcelId])),
      })),
    []
  );

  const announcedRef = useRef(false);
  useEffect(() => {
    if (allRuled && !announcedRef.current) {
      announcedRef.current = true;
      announce("All three parcels are ruled. The finding is open.");
    }
  }, [allRuled]);

  return (
    <div data-testid="rigged-commission" data-ruled={ruled.length} className="w-full">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          You are the commission. Rule on each parcel.
        </p>
        <p className="text-xs leading-snug text-exh-ink-soft">
          The checklist lines are the plan&rsquo;s own categories.
          <SourceSup factId={DOSSIERS.checklistFactRef} />
        </p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {DOSSIERS.parcels.map((parcel, i) => (
          <div key={parcel.parcelId} className="flex flex-col">
            <PaperCard
              data-testid={`commission-parcel-${parcel.parcelId}`}
              className="flex-1 p-3.5"
            >
              <span
                aria-hidden="true"
                className="mb-1.5 block h-1.5 w-10 rounded-t-sm border border-b-0 border-exh-ink/30 bg-exh-linen-deep"
              />
              <p className="exh-mono text-[10px] text-exh-ink-soft">Dossier {i + 1}</p>
              <h4 className="exh-serif mt-0.5 text-base leading-snug text-exh-ink sm:text-lg">
                {parcel.title}
              </h4>
              <p className="mt-1.5 text-sm leading-snug text-exh-ink-soft">{parcel.described}</p>
              <span className="exh-plat mt-2 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
                {parcel.typeNote}
              </span>
            </PaperCard>
            <div className="mt-2">
              <RiggedInstrument config={configs[i]} />
            </div>
          </div>
        ))}
      </div>

      {allRuled && (
        <RiggedDebriefDrawer
          shellId="commission"
          reducedMotion={api.reducedMotion}
          debrief={{
            heading: "The checklist had one answer",
            body: DOSSIERS.verdict.lesson,
            factRefs: DOSSIERS.planFactRefs,
          }}
        />
      )}
    </div>
  );
}
