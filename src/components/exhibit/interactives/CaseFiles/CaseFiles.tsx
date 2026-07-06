"use client";
/* ------------------------------------------------------------------ */
/*  The Case Files, the first CH7 pause point. Four folders in a       */
/*  cabinet, one per Supreme Court case in data/exhibit/cases.json.    */
/*  Opening a folder (tap or Enter, 250ms unfold, instant under        */
/*  reduced motion) reveals the citation, the holding, and the         */
/*  consequence, plus a stamp button that strikes the case's verdict   */
/*  onto the folder: red only for LEFT STANDING, ink otherwise. The    */
/*  Hansberry folder carries the brick, the mob, and the play. All     */
/*  four stamps reveal the arc line and complete the beat.             */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState } from "react";
import casesJson from "../../../../../data/exhibit/cases.json";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import Stamp from "../../shared/Stamp";
import FactValue from "../../shared/FactValue";
import VoiceCard from "../../shared/VoiceCard";

interface CaseRecord {
  caseId: string;
  name: string;
  citation: string;
  decided: number;
  factRef: string;
  holding: string;
  consequence: string;
  stamp: string;
  url: string;
}

const CASES = (casesJson as { cases: CaseRecord[] }).cases;

const ARC_LINE =
  "Zoning falls in 1917. Private covenants stand in 1926. A dent in 1940. The armor falls in 1948.";

const UNFOLD_CSS = `
.exh-case-unfold { animation: exhCaseUnfold 250ms ease-out both; transform-origin: top; }
@keyframes exhCaseUnfold { from { opacity: 0; transform: scaleY(0.96); } to { opacity: 1; transform: none; } }
.exhibit-root[data-motion="off"] .exh-case-unfold { animation: none; }
`;

/** red is semantic: the covenant left in force */
function stampTone(stampText: string): "red" | "ink" {
  return stampText === "LEFT STANDING" ? "red" : "ink";
}

/** surname shorthand for the folder tab */
function shortName(name: string): string {
  return name.split(" v.")[0] ?? name;
}

export default function CaseFiles() {
  const api = useInteractive();
  const [openId, setOpenId] = useState<string | null>(null);
  const [stamped, setStamped] = useState<string[]>([]);

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  useEffect(() => {
    if (stamped.length === CASES.length) complete();
  }, [stamped, complete]);

  const toggleFolder = (caseId: string) => {
    api.onInteraction();
    setOpenId((prev) => (prev === caseId ? null : caseId));
  };

  const stampCase = (caseId: string) => {
    api.onInteraction();
    setStamped((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
  };

  const openCase = openId ? CASES.find((c) => c.caseId === openId) : undefined;
  const allStamped = stamped.length === CASES.length;

  return (
    <div className="w-full">
      <style>{UNFOLD_CSS}</style>
      <p className="exh-plat mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Open each folder. Stamp the outcome.
      </p>

      {/* ---------------- the cabinet row ---------------- */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {CASES.map((c) => {
          const isOpen = openId === c.caseId;
          const isStamped = stamped.includes(c.caseId);
          return (
            <button
              key={c.caseId}
              type="button"
              data-testid={`case-folder-${c.caseId}`}
              data-stamped={isStamped ? "true" : "false"}
              aria-expanded={isOpen}
              aria-controls="case-open-panel"
              onClick={() => toggleFolder(c.caseId)}
              className={`exh-paper min-h-16 rounded-sm border p-2.5 text-left transition-colors ${
                isOpen
                  ? "border-exh-ink bg-exh-linen-deep"
                  : "border-exh-ink/25 bg-exh-linen hover:border-exh-ink/60"
              }`}
            >
              <span
                aria-hidden="true"
                className="mb-1.5 block h-1.5 w-10 rounded-t-sm border border-b-0 border-exh-ink/30 bg-exh-linen-deep"
              />
              <span className="exh-plat block text-xs font-semibold tracking-[0.12em] text-exh-ink uppercase">
                {shortName(c.name)}
              </span>
              <span className="exh-mono mt-0.5 block text-[11px] text-exh-ink/70">{c.decided}</span>
              <span className="mt-1.5 block min-h-5">
                {isStamped ? (
                  <Stamp text={c.stamp} tone={stampTone(c.stamp)} size="sm" />
                ) : (
                  <span className="exh-plat text-[9px] tracking-[0.18em] text-exh-ink/45 uppercase">
                    not yet stamped
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------- the open folder ---------------- */}
      {openCase && (
        <PaperCard
          key={openCase.caseId}
          id="case-open-panel"
          data-testid="case-open-panel"
          className={`mt-3 p-4 sm:p-5 ${api.reducedMotion ? "" : "exh-case-unfold"}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="exh-serif text-lg leading-snug text-exh-ink sm:text-xl">
              {openCase.name}
            </h4>
            <p className="exh-mono text-xs text-exh-ink/70">
              {openCase.citation} · decided {openCase.decided}
            </p>
          </div>
          <div className="mt-1">
            <FactValue id={openCase.factRef} size="sm" />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                The holding
              </p>
              <p className="mt-1 text-sm leading-snug text-exh-ink">{openCase.holding}</p>
            </div>
            <div>
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                The consequence
              </p>
              <p className="mt-1 text-sm leading-snug text-exh-ink">{openCase.consequence}</p>
            </div>
          </div>

          {openCase.caseId === "hansberry" && (
            <PaperCard tone="deep" className="mt-4 p-3">
              <p className="text-sm leading-snug text-exh-ink">
                A mob gathered outside the house, a chunk of masonry came through a window, and the
                child inside grew up to put the memory on stage in <em>A Raisin in the Sun</em>.
              </p>
              <div className="mt-2">
                <VoiceCard personId="lorraine-hansberry" size="sm" />
              </div>
            </PaperCard>
          )}

          <div className="mt-4 flex min-h-14 items-center">
            {stamped.includes(openCase.caseId) ? (
              <Stamp
                text={openCase.stamp}
                tone={stampTone(openCase.stamp)}
                size="lg"
                animate={!api.reducedMotion}
              />
            ) : (
              <button
                type="button"
                data-testid="case-stamp-button"
                onClick={() => stampCase(openCase.caseId)}
                className="exh-plat min-h-12 cursor-pointer rounded-sm border-2 border-exh-ink bg-exh-linen px-5 text-xs font-bold uppercase tracking-[0.2em] text-exh-ink hover:bg-exh-linen-deep"
              >
                Stamp the outcome
              </button>
            )}
          </div>
        </PaperCard>
      )}

      {/* ---------------- the arc, once all four are struck ------------ */}
      {allStamped && (
        <div
          data-testid="case-arc"
          className={`mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4 ${
            api.reducedMotion ? "" : "exh-ledger-in"
          }`}
        >
          <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">{ARC_LINE}</p>
        </div>
      )}
    </div>
  );
}
