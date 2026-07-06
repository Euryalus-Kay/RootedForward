"use client";
/* ------------------------------------------------------------------ */
/*  RiggedInstrument, the shared shell for the Machine Room stations.  */
/*  The visitor is handed a working period tool (an appraisal form,    */
/*  an ethics exam, a blight checklist, a statute standard) and full   */
/*  agency to use it fairly. The instrument removes that agency: a     */
/*  lock rule can hold a select where the form wants it, a refusal     */
/*  lever always returns the same dead line, and evaluate decides the  */
/*  verdict no matter how carefully the fields were filled. After      */
/*  maxAttempts (or an earlier config trigger) the debrief drawer      */
/*  slides up, instant under reduced motion, and shows why no input    */
/*  could change the outcome. Verdicts announce to #exh-live.          */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { announce, moveFocus } from "@/lib/exhibit/focus";
import { useInteractive } from "../interactives/InteractiveContext";
import PaperCard from "../shared/PaperCard";
import Stamp from "../shared/Stamp";
import FactValue from "../shared/FactValue";
import SourceSup from "../shared/SourceSup";

/* ---------------- config contract ---------------- */

export type RiggedAnswers = Record<string, string>;

export interface RiggedSelectOption {
  value: string;
  label: string;
}

export interface RiggedSelectField {
  kind: "select";
  id: string;
  /** field label; verbatim period text when historical is true */
  label: string;
  /** the form's own item id, e.g. "1-D" */
  formItem?: string;
  /** the form's own section heading, rendered once per run of fields */
  section?: string;
  /** label is verbatim from the period form */
  historical?: boolean;
  /** body text under the label (a scenario prompt, a clarifier) */
  note?: string;
  options: RiggedSelectOption[];
  /** omitted means unanswered; filing nudges until every select has a value */
  defaultValue?: string;
  /** menu renders a native select; buttons renders 48px choice buttons */
  display?: "menu" | "buttons";
  /** THE RIG. When this returns a value the control is held there and
   *  the visitor's changes visibly do nothing. */
  lockWhen?: (answers: RiggedAnswers) => string | null;
  /** shown and announced while the hold is active */
  lockNote?: string;
  /** small stamp struck beside the held control */
  lockStamp?: { text: string; tone: "red" | "ink" };
}

export interface RiggedReadoutField {
  kind: "readout";
  id: string;
  label: string;
  value: string;
  formItem?: string;
  section?: string;
  note?: string;
}

export interface RiggedAttemptNoteField {
  kind: "attempt-note";
  id: string;
  text: string;
}

export type RiggedField = RiggedSelectField | RiggedReadoutField | RiggedAttemptNoteField;

export interface RiggedVerdict {
  /** true when the instrument overrode the visitor's intent */
  locked: boolean;
  stampText: string;
  stampTone: "red" | "ink";
  verdictLine: string;
  /** optional per-field outcome lines, keyed by field id */
  fieldNotes?: Record<string, string>;
}

export interface RiggedDebrief {
  heading: string;
  body: string;
  factRefs: string[];
  realRecord?: ReactNode;
}

export interface RiggedShellConfig {
  id: string;
  formTitle: string;
  era: string;
  /** provenance chip text; empty string hides the chip */
  provenance: string;
  /** optional citation dagger beside the provenance chip */
  provenanceFactRef?: string;
  intro: string;
  /** framed historical panel between intro and fields (e.g. Article 34) */
  headerPanel?: ReactNode;
  fields: RiggedField[];
  /** the instrument's action button, e.g. "File the grade" */
  actionLabel: string;
  evaluate: (answers: RiggedAnswers) => RiggedVerdict;
  maxAttempts: number;
  /** opens the debrief before maxAttempts; the cap still applies */
  debriefWhen?: (history: RiggedVerdict[], answers: RiggedAnswers) => boolean;
  /** null lets a composition (the Commission) render one shared drawer */
  debrief: RiggedDebrief | null;
  /** the dead lever; always returns its line, never a verdict */
  refusalAction?: { label: string; line: string };
  /** nudge when a select is unanswered at filing time */
  incompleteLine?: string;
  /** observer hook for compositions */
  onVerdict?: (verdict: RiggedVerdict, attempts: number) => void;
}

export interface RiggedInstrumentProps {
  config: RiggedShellConfig;
}

/* ---------------- scoped css ---------------- */

const RIGGED_CSS = `
.exh-rigged-drawer { animation: exhRiggedUp 320ms cubic-bezier(0.2, 0.8, 0.3, 1) both; }
@keyframes exhRiggedUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.exhibit-root[data-motion="off"] .exh-rigged-drawer { animation: none; }
.exh-rigged-lockflash { animation: exhRiggedLockFlash 420ms ease-out both; }
@keyframes exhRiggedLockFlash { 0% { background-color: rgba(176, 50, 43, 0.14); } 100% { background-color: transparent; } }
.exhibit-root[data-motion="off"] .exh-rigged-lockflash { animation: none; }
`;

const WARNING_CHIP = "period document; contains the era’s racist language";

/* ---------------- shared framed panels ---------------- */

/** "from the record" panel used for verbatim historical material,
 *  with the period-language warning chip where racist language appears */
export function RiggedRecordPanel({
  label,
  warning = false,
  children,
  className = "",
}: {
  label: string;
  warning?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-sm border border-exh-ink/30 bg-exh-linen-deep/50 p-3 ${className}`}>
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
        {label}
      </p>
      {warning && (
        <span className="exh-plat mt-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
          {WARNING_CHIP}
        </span>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** the debrief drawer body; the shell mounts it when its trigger fires,
 *  and the Commission mounts one shared drawer across its three shells */
export function RiggedDebriefDrawer({
  shellId,
  debrief,
  reducedMotion,
}: {
  shellId: string;
  debrief: RiggedDebrief;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    moveFocus(ref.current);
  }, []);
  const headingId = `rigged-debrief-heading-${shellId}`;
  return (
    <div
      ref={ref}
      role="region"
      aria-labelledby={headingId}
      data-testid={`rigged-debrief-${shellId}`}
      className={`mt-3 ${reducedMotion ? "" : "exh-rigged-drawer"}`}
    >
      <PaperCard tone="deep" className="border-t-2 border-t-exh-ink p-4 sm:p-5">
        <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          The finding
        </p>
        <h5 id={headingId} className="exh-serif mt-1 text-lg leading-snug text-exh-ink sm:text-xl">
          {debrief.heading}
        </h5>
        <p className="mt-2 text-sm leading-snug text-exh-ink">{debrief.body}</p>
        {debrief.factRefs.length > 0 && (
          <div className="mt-3 flex flex-col items-start gap-1.5 border-t border-exh-ink/15 pt-3">
            {debrief.factRefs.map((f) => (
              <FactValue key={f} id={f} size="sm" />
            ))}
          </div>
        )}
        {debrief.realRecord && <div className="mt-3">{debrief.realRecord}</div>}
      </PaperCard>
    </div>
  );
}

/* ---------------- the shell ---------------- */

export default function RiggedInstrument({ config }: RiggedInstrumentProps) {
  const api = useInteractive();
  const {
    id,
    formTitle,
    era,
    provenance,
    provenanceFactRef,
    intro,
    headerPanel,
    fields,
    actionLabel,
    evaluate,
    maxAttempts,
    debriefWhen,
    debrief,
    refusalAction,
    incompleteLine,
    onVerdict,
  } = config;

  const selects = useMemo(
    () => fields.filter((f): f is RiggedSelectField => f.kind === "select"),
    [fields]
  );

  const [answers, setAnswers] = useState<RiggedAnswers>(() => {
    const a: RiggedAnswers = {};
    for (const f of fields) {
      if (f.kind === "select") a[f.id] = f.defaultValue ?? "";
    }
    return a;
  });
  const [history, setHistory] = useState<RiggedVerdict[]>([]);
  const [verdict, setVerdict] = useState<RiggedVerdict | null>(null);
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  /** counters double as animation keys so repeat strikes re-flash */
  const [refusals, setRefusals] = useState(0);
  const [lockPoke, setLockPoke] = useState<{ fieldId: string; n: number } | null>(null);

  const attempts = history.length;
  const spent = attempts >= maxAttempts;
  const done = spent || debriefOpen;

  const lockFor = (f: RiggedSelectField): string | null =>
    f.lockWhen ? f.lockWhen(answers) : null;

  const effectiveValue = (f: RiggedSelectField): string => lockFor(f) ?? answers[f.id] ?? "";

  const effectiveAnswers = (): RiggedAnswers => {
    const out: RiggedAnswers = { ...answers };
    for (const f of selects) {
      const held = lockFor(f);
      if (held != null) out[f.id] = held;
    }
    return out;
  };

  const anyLockActive = selects.some((f) => lockFor(f) != null);
  const rigLocked = anyLockActive || (verdict?.locked ?? false);

  const setSelect = (f: RiggedSelectField, value: string) => {
    api.onInteraction();
    if (done) return;
    if (lockFor(f) != null) {
      // the form holds this line; the attempted change visibly does nothing
      setLockPoke((p) => ({ fieldId: f.id, n: (p?.n ?? 0) + 1 }));
      if (f.lockNote) announce(f.lockNote);
      return;
    }
    const next = { ...answers, [f.id]: value };
    // announce any hold that engages the instant this value lands
    for (const s of selects) {
      if (!s.lockWhen) continue;
      const was = s.lockWhen(answers) != null;
      const now = s.lockWhen(next) != null;
      if (now && !was) {
        setLockPoke((p) => ({ fieldId: s.id, n: (p?.n ?? 0) + 1 }));
        if (s.lockNote) announce(s.lockNote);
      }
    }
    setAnswers(next);
  };

  const file = () => {
    api.onInteraction();
    if (done) return;
    const eff = effectiveAnswers();
    if (selects.some((f) => !eff[f.id])) {
      const line = incompleteLine ?? "Every line on the form must be answered.";
      setNudge(line);
      announce(line);
      return;
    }
    setNudge(null);
    const v = evaluate(eff);
    const nextHistory = [...history, v];
    setVerdict(v);
    setHistory(nextHistory);
    announce(`${v.stampText}. ${v.verdictLine}`);
    api.onComplete();
    onVerdict?.(v, nextHistory.length);
    const early = debriefWhen ? debriefWhen(nextHistory, eff) : false;
    if (debrief && (early || nextHistory.length >= maxAttempts)) setDebriefOpen(true);
  };

  const retry = () => {
    api.onInteraction();
    if (done) return;
    setVerdict(null);
    announce("The form is open again.");
  };

  const refuse = () => {
    api.onInteraction();
    if (!refusalAction || done) return;
    setRefusals((n) => n + 1);
    announce(refusalAction.line);
  };

  /* ---------------- field rows ---------------- */

  /** field ids that open a new form section (heading rendered once per run) */
  const sectionBreaks = useMemo(() => {
    const breaks = new Set<string>();
    let last: string | undefined;
    for (const f of fields) {
      const section = f.kind === "attempt-note" ? undefined : f.section;
      if (section && section !== last) breaks.add(f.id);
      if (section) last = section;
    }
    return breaks;
  }, [fields]);

  const renderSelect = (f: RiggedSelectField) => {
    const value = effectiveValue(f);
    const held = lockFor(f) != null;
    const controlId = `rigged-${id}-${f.id}`;
    const labelId = `rigged-${id}-${f.id}-label`;
    const lockNoteId = `rigged-${id}-${f.id}-locknote`;
    const outcome = verdict?.fieldNotes?.[f.id];
    const asButtons = f.display === "buttons";

    const labelBlock = (
      <span className="min-w-0 flex-1">
        <span className="exh-plat block text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
          {f.formItem && <span className="exh-mono mr-1.5 text-exh-ink-soft">{f.formItem}.</span>}
          {f.label}
        </span>
        {f.note && <span className="mt-1 block text-sm leading-snug text-exh-ink-soft">{f.note}</span>}
      </span>
    );

    const control = asButtons ? (
      <div
        role="group"
        aria-labelledby={labelId}
        data-testid={`rigged-field-${id}-${f.id}`}
        data-value={value}
        className="flex w-full gap-2"
      >
        {f.options.map((o) => {
          const pressed = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => setSelect(f, o.value)}
              className={`exh-plat min-h-12 flex-1 rounded-sm border-2 px-4 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                pressed
                  ? "border-exh-ink bg-exh-ink/90 text-exh-linen"
                  : "border-exh-ink/40 bg-exh-linen text-exh-ink hover:border-exh-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    ) : (
      <select
        id={controlId}
        data-testid={`rigged-field-${id}-${f.id}`}
        value={value}
        onChange={(e) => setSelect(f, e.target.value)}
        aria-describedby={held && f.lockNote ? lockNoteId : undefined}
        className="exh-mono min-h-12 w-full rounded-sm border border-exh-ink/40 bg-exh-linen px-3 text-sm text-exh-ink sm:w-56"
      >
        {f.defaultValue === undefined && (
          <option value="" disabled>
            select
          </option>
        )}
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );

    return (
      <div key={f.id} className="relative py-3" data-field-held={held ? "true" : "false"}>
        {/* the refused-change flash; keyed so repeat strikes re-run, an
            overlay so the select itself never remounts or drops focus */}
        {lockPoke?.fieldId === f.id && !api.reducedMotion && (
          <span
            key={lockPoke.n}
            aria-hidden="true"
            className="exh-rigged-lockflash pointer-events-none absolute inset-0"
          />
        )}
        {asButtons ? (
          <div>
            <span id={labelId}>{labelBlock}</span>
            <div className="mt-2">{control}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <label htmlFor={controlId} className="flex min-w-0 flex-1">
              {labelBlock}
            </label>
            <div className="flex items-center gap-2">
              {held && f.lockStamp && (
                <span data-testid={`rigged-lock-${id}-${f.id}`}>
                  <Stamp
                    text={f.lockStamp.text}
                    tone={f.lockStamp.tone}
                    size="sm"
                    animate={!api.reducedMotion}
                  />
                </span>
              )}
              {control}
            </div>
          </div>
        )}
        {held && f.lockNote && (
          <p id={lockNoteId} className="mt-1.5 text-xs leading-snug text-exh-red">
            {f.lockNote}
          </p>
        )}
        {outcome && (
          <p
            data-testid={`rigged-fieldnote-${id}-${f.id}`}
            className="mt-2 border-l-2 border-exh-ink/30 pl-2.5 text-sm leading-snug text-exh-ink"
          >
            {outcome}
          </p>
        )}
      </div>
    );
  };

  const renderField = (f: RiggedField) => {
    if (f.kind === "attempt-note") {
      return (
        <div key={f.id} className="py-2.5">
          <p className="text-xs leading-snug text-exh-ink-soft italic">{f.text}</p>
        </div>
      );
    }
    if (f.kind === "readout") {
      return (
        <div key={f.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
          <span className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
            {f.formItem && <span className="exh-mono mr-1.5 text-exh-ink-soft">{f.formItem}.</span>}
            {f.label}
          </span>
          <span
            data-testid={`rigged-readout-${id}-${f.id}`}
            className="exh-mono text-sm text-exh-ink"
          >
            {f.value}
          </span>
          {f.note && <span className="w-full text-xs leading-snug text-exh-ink-soft">{f.note}</span>}
        </div>
      );
    }
    return renderSelect(f);
  };

  /* ---------------- render ---------------- */

  return (
    <div
      role="group"
      aria-label={formTitle}
      data-testid={`rigged-${id}`}
      data-attempts={attempts}
      data-locked={rigLocked ? "true" : "false"}
      className="w-full"
    >
      <style>{RIGGED_CSS}</style>
      <PaperCard className="p-4 sm:p-6">
        {/* ------- form head ------- */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {era && (
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
                {era}
              </p>
            )}
            <h4 className="exh-serif mt-0.5 text-lg leading-snug text-exh-ink sm:text-xl">
              {formTitle}
            </h4>
          </div>
          {provenance && (
            <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-snug tracking-[0.15em] text-exh-ink-soft">
              {provenance}
              {provenanceFactRef && <SourceSup factId={provenanceFactRef} />}
            </span>
          )}
        </div>
        {intro && <p className="mt-1.5 text-sm leading-snug text-exh-ink-soft">{intro}</p>}

        {headerPanel && <div className="mt-4">{headerPanel}</div>}

        {/* ------- the fields, thin rules between ------- */}
        <div className="mt-4 border-t border-exh-ink/15">
          {fields.map((f) => {
            const section = f.kind === "attempt-note" ? undefined : f.section;
            const showSection = section && sectionBreaks.has(f.id);
            return (
              <div key={f.id} className="border-b border-exh-ink/15">
                {showSection && (
                  <p className="exh-plat pt-3 text-[9px] font-semibold tracking-[0.25em] text-exh-ink-soft uppercase">
                    {section}
                  </p>
                )}
                {renderField(f)}
              </div>
            );
          })}
        </div>

        {/* ------- action row ------- */}
        {!done && !verdict && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid={`rigged-action-${id}`}
              onClick={file}
              className="exh-plat min-h-12 rounded-sm border-2 border-exh-ink bg-exh-linen px-5 text-xs font-bold uppercase tracking-[0.2em] text-exh-ink hover:bg-exh-linen-deep"
            >
              {actionLabel}
            </button>
            {refusalAction && (
              <button
                type="button"
                data-testid={`rigged-refuse-${id}`}
                onClick={refuse}
                className="exh-plat min-h-12 rounded-sm border border-exh-ink/50 bg-exh-linen px-5 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink-soft hover:border-exh-ink"
              >
                {refusalAction.label}
              </button>
            )}
            {maxAttempts > 1 && (
              <span className="exh-mono text-xs text-exh-ink-soft">
                filing {attempts + 1} of {maxAttempts}
              </span>
            )}
          </div>
        )}

        {nudge && !verdict && (
          <p
            data-testid={`rigged-nudge-${id}`}
            className="mt-2 text-xs leading-snug text-exh-ink-soft"
          >
            {nudge}
          </p>
        )}

        {refusalAction && refusals > 0 && !verdict && (
          <div
            key={refusals}
            data-testid={`rigged-refusal-line-${id}`}
            className={`mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 px-3 py-2.5 ${
              api.reducedMotion ? "" : "exh-ledger-in"
            }`}
          >
            <p className="exh-plat text-[9px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              The instrument returns
            </p>
            <p className="exh-serif mt-0.5 text-sm leading-snug text-exh-ink">
              {refusalAction.line}
            </p>
          </div>
        )}

        {/* ------- the verdict ------- */}
        {verdict && (
          <div
            data-testid={`rigged-verdict-${id}`}
            className="mt-4 border-t border-exh-ink/20 pt-4"
          >
            <Stamp
              text={verdict.stampText}
              tone={verdict.stampTone}
              size="lg"
              animate={!api.reducedMotion}
            />
            <p className="exh-serif mt-2 text-base leading-snug text-exh-ink">
              {verdict.verdictLine}
            </p>
            {!done && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid={`rigged-retry-${id}`}
                  onClick={retry}
                  className="exh-plat min-h-12 rounded-sm border border-exh-ink/50 bg-exh-linen px-5 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink hover:border-exh-ink"
                >
                  Try again
                </button>
                <span className="exh-mono text-xs text-exh-ink-soft">
                  filed {attempts} of {maxAttempts}
                </span>
              </div>
            )}
          </div>
        )}
      </PaperCard>

      {/* ------- the debrief drawer ------- */}
      {debrief && debriefOpen && (
        <RiggedDebriefDrawer shellId={id} debrief={debrief} reducedMotion={api.reducedMotion} />
      )}
    </div>
  );
}
