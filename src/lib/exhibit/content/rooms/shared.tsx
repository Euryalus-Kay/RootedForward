"use client";
/* ------------------------------------------------------------------ */
/*  Shared contracts and primitives for the machine-room content       */
/*  modules. A room is a fixed floor plan: the thesis wall (rendered   */
/*  by MachineRoom from machines.json) followed by five stations,      */
/*  THE INSTRUMENT, THE PAPER, THE PEOPLE, THE FIGHT, STILL RUNNING?.  */
/*  Every claim in a station goes through FactValue or SourceSup;      */
/*  these primitives exist so the three content modules stay copy      */
/*  plus registered fact ids and nothing else.                         */
/* ------------------------------------------------------------------ */
import type { ReactNode } from "react";
import { getFact, hasFact } from "@/lib/exhibit/facts";
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";

export type RoomStationId = "instrument" | "paper" | "people" | "fight" | "still-running";

export interface RoomStation {
  /** the five machine rooms use RoomStationId; the counter room names
   *  its own stations, so the contract stays a plain string */
  id: string;
  /** the exh-plat station eyebrow, e.g. "THE INSTRUMENT" */
  eyebrow: string;
  /** one quiet serif line under the eyebrow */
  lead?: string;
  body: ReactNode;
}

/** The five canonical eyebrows, so the floor plan reads identically
 *  in every room. */
export const STATION_EYEBROWS: Record<RoomStationId, string> = {
  instrument: "The Instrument",
  paper: "The Paper",
  people: "The People",
  fight: "The Fight",
  "still-running": "Still Running?",
};

/* ---- fact card: one registered figure on its own plate ------------ */

export interface FactCardProps {
  id: string;
  /** plat label above the figure */
  label: string;
  /** render the fact's asOf line under the figure (STILL RUNNING? stations) */
  dated?: boolean;
  /** optional context sentence, soft ink, under the figure */
  children?: ReactNode;
}

export function FactCard({ id, label, dated = false, children }: FactCardProps) {
  const asOf = dated && hasFact(id) ? getFact(id).asOf : undefined;
  return (
    <PaperCard data-testid={`room-fact-${id}`} className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        {label}
      </p>
      <div className="mt-2">
        <FactValue id={id} size="lg" />
      </div>
      {asOf ? <p className="exh-mono mt-1.5 text-[10px] text-exh-ink-soft">{asOf}</p> : null}
      {children ? (
        <p className="mt-2.5 text-sm leading-relaxed text-exh-ink-soft">{children}</p>
      ) : null}
    </PaperCard>
  );
}

/* ---- paired card: two figures that only mean something together --- */

export interface PairCardProps {
  label: string;
  aId: string;
  bId: string;
  /** one line under both figures, e.g. where the count comes from */
  footer?: string;
}

export function PairCard({ label, aId, bId, footer }: PairCardProps) {
  return (
    <PaperCard data-testid={`room-pair-${aId}`} className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        {label}
      </p>
      <div className="mt-3 space-y-3">
        <div className="border-l-2 border-exh-ink/25 pl-3">
          <FactValue id={aId} size="lg" />
        </div>
        <div className="border-l-2 border-exh-ink/25 pl-3">
          <FactValue id={bId} size="lg" />
        </div>
      </div>
      {footer ? (
        <p className="mt-3 text-xs leading-relaxed text-exh-ink-soft">{footer}</p>
      ) : null}
    </PaperCard>
  );
}

/* ---- verbatim record card: a period document behind the house chip - */

export interface RecordField {
  label: string;
  value: string;
}

export interface RecordCardProps {
  /** plat line naming the record, e.g. the survey sheet it comes from */
  eyebrow: string;
  /** the form line the excerpt was transcribed from, mono, optional */
  fieldLabel?: string;
  /** VERBATIM period text; rendered inside quotation marks */
  quote: string;
  /** small mono note after the quote, e.g. an elision notice */
  quoteNote?: string;
  /** form fields transcribed from the same record, label plus value */
  fields?: RecordField[];
  /** citation attach point; a registered fact id for the record */
  factId?: string;
  /** the racist-language warning chip; on by default, off for period
   *  quotes that carry no slur (the label still marks them period) */
  warning?: boolean;
}

/** The period-language warning chip wording matches The Lens (ch6),
 *  the exhibit's one established convention for surveyor prose. */
export function RecordCard({ eyebrow, fieldLabel, quote, quoteNote, fields, factId, warning = true }: RecordCardProps) {
  return (
    <PaperCard tone="deep" data-testid="room-record-card" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
        {eyebrow}
        {factId ? <FactValue id={factId} className="sr-only" /> : null}
      </p>
      <span className="exh-plat mt-1.5 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
        {warning ? (
          <>period document; contains the era&rsquo;s racist language</>
        ) : (
          <>period document, quoted verbatim</>
        )}
      </span>
      {fields && fields.length > 0 ? (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-y border-exh-ink/15 py-2.5">
          {fields.map((f) => (
            <div key={f.label} className="contents">
              <dt className="exh-plat text-[9px] font-semibold uppercase leading-5 tracking-[0.16em] text-exh-ink-soft">
                {f.label}
              </dt>
              <dd className="exh-mono text-xs leading-5 text-exh-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {fieldLabel ? <p className="exh-mono mt-3 text-[10px] text-exh-ink/60">{fieldLabel}</p> : null}
      <blockquote className="exh-serif mt-1.5 font-display text-base italic leading-relaxed text-exh-ink">
        &ldquo;{quote}&rdquo;
      </blockquote>
      {quoteNote ? <p className="exh-mono mt-1.5 text-[10px] text-exh-ink-soft">{quoteNote}</p> : null}
    </PaperCard>
  );
}

/* ---- plain archive attribution line -------------------------------- */

export function AttributionCard({ label, text }: { label: string; text: string }) {
  return (
    <PaperCard className="p-4">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        {label}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-exh-ink-soft">{text}</p>
    </PaperCard>
  );
}

/* ---- two-up grid used by most PAPER and FIGHT stations ------------- */

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
