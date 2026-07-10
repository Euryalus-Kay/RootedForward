"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "gradeFlood" (#a3-flood), the exhibit's fulcrum. The      */
/*  flood steps above re-ink the map in sheet filing order; this       */
/*  scene shows the paperwork those grades stood on. One A sheet and   */
/*  one D sheet verbatim (the registered quote facts), the corpus      */
/*  patterns computed across every digitized sheet, and the inspect    */
/*  gesture: tapping any polygon on the Stage, or choosing an area     */
/*  from the labeled select (the keyboard and screen-reader path),     */
/*  opens a card with that area's grade, number, filing date, and      */
/*  the surveyor's own remarks. Sheet text loads once through the      */
/*  module-scope cache in lib/exhibit/holc-descriptions. No motion     */
/*  anywhere in this scene; every state is a resolved render.          */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import type { SceneProps } from "./registry";
import { getFact } from "@/lib/exhibit/facts";
import { STEP_BY_ID } from "@/lib/exhibit/ground/copy";
import {
  excerptUsable,
  sheetDesignation,
  sheetName,
  useHolcDescriptions,
  type DescArea,
} from "@/lib/exhibit/holc-descriptions";
import { useGround } from "../engine/GroundProvider";
import { FactValue } from "../../shared/FactValue";
import { SourceSup } from "../../shared/SourceSup";
import sheetsAnalysis from "../../../../../data/exhibit/sheets-analysis.json";

const EYEBROW_CLASS =
  "exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft md:text-[10px]";

/* grade words follow the Surveyor's Files reading room */
const GRADE_WORD: Record<string, string> = {
  A: "Grade A, best",
  B: "Grade B, still desirable",
  C: "Grade C, definitely declining",
  D: "Grade D, hazardous",
};

const GRADE_ORDER = ["A", "B", "C", "D"] as const;

/* The evidence pair. Area ids match the quote facts' registry notes
 * (sheet A11 is areaId 1097, sheet D106 is areaId 1635); labels and
 * filing dates come from the sheets themselves once loaded. */
const PAIR = [
  {
    areaId: 1097,
    factId: "sheets.a11_restricted_quote",
    caption: "The surveyor lists the restriction among the merits of the best grade.",
  },
  {
    areaId: 1635,
    factId: "sheets.d106_not_restricted_quote",
    caption: "On the lowest grade, the words so far treat restriction as the expected condition.",
  },
];

/* the computed patterns across the whole corpus, all registry facts */
const CORPUS = [
  { id: "sheets.race_by_grade", label: "Race" },
  { id: "sheets.infiltration_negro", label: "Infiltration" },
  { id: "sheets.mortgage_gradient", label: "Mortgage funds" },
  { id: "sheets.blighted_by_grade", label: "Blighted" },
];

/* "sheet D106, 1939 to 1940" -> "Sheet D106" (the D106 transcription
 * lost its area-number field, so the registry's designation stands in) */
function labelFromFactAsOf(asOf?: string): string | null {
  const m = asOf?.match(/^sheet\s+([A-D]\d+)/i);
  return m ? `Sheet ${m[1].toUpperCase()}` : null;
}

function areaLabel(a: DescArea): string {
  const des = sheetDesignation(a);
  if (des) return `Area ${des}`;
  return sheetName(a) ?? "Unnumbered area";
}

export default function GradeFlood(_props: SceneProps) {
  const desc = useHolcDescriptions();
  const { setAreaTap, activeIndex } = useGround();

  /* the inspect gesture answers from this step onward, never before
     the flood has run (the map above is still bare paper until then) */
  const floodIndex = STEP_BY_ID["a3-flood"]?.index ?? 0;
  const activeRef = useRef(activeIndex);
  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const [openId, setOpenId] = useState<number | null>(null);
  const [selectValue, setSelectValue] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const selectId = useId();

  const byId = useMemo(() => {
    const m = new Map<number, DescArea>();
    for (const a of desc.data?.areas ?? []) m.set(Number(a.areaId), a);
    return m;
  }, [desc.data]);

  const grouped = useMemo(() => {
    const groups: Record<string, DescArea[]> = { A: [], B: [], C: [], D: [] };
    for (const a of desc.data?.areas ?? []) if (groups[a.grade]) groups[a.grade].push(a);
    const num = (a: DescArea) => {
      const des = sheetDesignation(a);
      return des ? Number(des.split("-")[1]) : Number.MAX_SAFE_INTEGER;
    };
    for (const g of GRADE_ORDER) {
      groups[g].sort(
        (x, y) => num(x) - num(y) || (sheetName(x) ?? "").localeCompare(sheetName(y) ?? "")
      );
    }
    return groups;
  }, [desc.data]);

  const sheetTotal = useMemo(() => {
    const byGrade = (sheetsAnalysis as { sheetsByGrade: Record<string, number> }).sheetsByGrade;
    return Object.values(byGrade).reduce((sum, n) => sum + n, 0);
  }, []);

  const openCard = useCallback((areaId: number) => {
    const ae = document.activeElement;
    openerRef.current = ae instanceof HTMLElement ? ae : null;
    setOpenId(areaId);
  }, []);

  const closeCard = useCallback(() => {
    setOpenId(null);
    const opener = openerRef.current;
    if (opener && opener.isConnected && opener !== document.body) opener.focus();
    else selectRef.current?.focus();
  }, []);

  /* the Stage's delegated tap handler routes area taps here while the
     scene is mounted; unregister on unmount so no dead handler lives on */
  useEffect(() => {
    setAreaTap((areaId: number) => {
      if (activeRef.current < floodIndex) return;
      openCard(areaId);
      if (byId.has(areaId)) setSelectValue(String(areaId));
    });
    return () => setAreaTap(null);
  }, [setAreaTap, openCard, floodIndex, byId]);

  /* focus lands on the card whenever it opens or switches sheets */
  useEffect(() => {
    if (openId !== null) cardRef.current?.focus();
  }, [openId]);

  const area = openId !== null ? byId.get(openId) : undefined;
  const areaGradeWord = area ? GRADE_WORD[area.grade] : undefined;

  return (
    <section data-testid="scene-gradeFlood" className="max-w-[44rem]">
      <p className={EYEBROW_CLASS}>The sheets behind the grades</p>
      <p className="mt-3 max-w-[34rem] font-display text-lg leading-[1.65] text-exh-ink">
        Each grade on the map above rests on a one-page form a federal surveyor filed. Here is
        what two of those forms say, word for word.
      </p>

      {/* ---------------- the evidence pair ---------------- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PAIR.map((p) => {
          const fact = getFact(p.factId);
          const sheet = byId.get(p.areaId);
          const des = sheet ? sheetDesignation(sheet) : null;
          const label = des ? `Area ${des}` : labelFromFactAsOf(fact.asOf) ?? "Sheet";
          const name = sheet ? sheetName(sheet) : null;
          const date = sheet?.security_grade_fields?.date ?? null;
          const grade = sheet?.grade ?? (p.factId.startsWith("sheets.a") ? "A" : "D");
          return (
            <div
              key={p.factId}
              data-testid={`flood-pair-${grade}`}
              className="border border-exh-ink/25 bg-exh-linen-deep/50 p-5"
            >
              <p className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 shrink-0"
                  style={{ background: `var(--g-${grade.toLowerCase()})` }}
                />
                <span className="exh-plat text-[11px] font-semibold uppercase tracking-[0.22em] text-exh-ink">
                  {GRADE_WORD[grade]}
                </span>
              </p>
              <p className="exh-plat mt-2 text-[11px] uppercase leading-snug tracking-[0.16em] text-exh-ink-soft">
                {label}
                {name ? <> &middot; {name}</> : null}
                {date ? (
                  <>
                    {" "}
                    &middot; <span className="exh-mono normal-case tracking-normal">Filed {date}</span>
                  </>
                ) : null}
              </p>
              {/* div, not p: the citation popover mounts block elements inline */}
              <div className="mt-4 font-display text-lg leading-relaxed text-exh-ink">
                &ldquo;{String(fact.value)}&rdquo;
                <SourceSup factId={p.factId} />
              </div>
              <p className="mt-3 border-t border-exh-ink/15 pt-3 text-sm leading-relaxed text-exh-ink-soft">
                {p.caption}
              </p>
              <a
                href={`#room-files:${p.areaId}`}
                className="exh-plat mt-3 inline-block min-h-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink underline decoration-exh-ink/40 underline-offset-4 hover:decoration-exh-ink"
              >
                Read the full sheet in the study room
              </a>
            </div>
          );
        })}
      </div>

      {/* ---------------- the corpus patterns ---------------- */}
      <div className="mt-8" data-testid="flood-corpus">
        <p className={EYEBROW_CLASS}>
          Across all <span className="exh-mono">{sheetTotal}</span> sheets
        </p>
        <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-exh-ink-soft">
          The pattern holds across the whole survey.
        </p>
        <ul className="mt-3 max-w-[38rem] divide-y divide-exh-ink/15 border-y border-exh-ink/15">
          {CORPUS.map((c) => (
            <li key={c.id} className="py-3 text-sm leading-relaxed">
              <FactValue id={c.id} label={c.label} mono={false} size="sm" className="text-exh-ink" />
            </li>
          ))}
        </ul>
      </div>

      {/* ---------------- the inspect gesture ---------------- */}
      <div className="mt-8">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink">
          Tap any area on the map above for the sheet behind its grade.
        </p>
        <div className="mt-4 max-w-[26rem]">
          <label
            htmlFor={selectId}
            className="exh-plat block text-[11px] uppercase tracking-[0.18em] text-exh-ink-soft"
          >
            Or choose an area to read its sheet
          </label>
          <select
            id={selectId}
            ref={selectRef}
            data-testid="flood-area-select"
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setSelectValue(v);
              openCard(Number(v));
            }}
            className="mt-2 block w-full min-h-11 cursor-pointer border border-exh-ink/40 bg-exh-linen px-3 py-2 text-sm text-exh-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
          >
            <option value="">
              {desc.done ? "Choose an area" : "Loading the sheets"}
            </option>
            {GRADE_ORDER.map((g) =>
              grouped[g].length ? (
                <optgroup key={g} label={GRADE_WORD[g]}>
                  {grouped[g].map((a) => (
                    <option key={String(a.areaId)} value={String(a.areaId)}>
                      {areaLabel(a)}, graded {a.grade}
                    </option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
        </div>

        {/* ---------------- the sheet card ---------------- */}
        {openId !== null ? (
          <div
            ref={cardRef}
            tabIndex={-1}
            role="group"
            aria-label={
              area
                ? `Surveyor's sheet, ${areaLabel(area)}${areaGradeWord ? `, ${areaGradeWord}` : ""}`
                : "Surveyor's sheet"
            }
            data-testid="flood-sheet-card"
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              /* an open citation popover claims the Escape for itself */
              if (cardRef.current?.querySelector('[data-testid="source-popover"]')) return;
              e.stopPropagation();
              closeCard();
            }}
            className="mt-5 border border-exh-ink/40 bg-exh-linen-deep/50 p-5 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {area && areaGradeWord ? (
                  <p className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-3 w-3 shrink-0"
                      style={{ background: `var(--g-${area.grade.toLowerCase()})` }}
                    />
                    <span className="exh-plat text-[11px] font-semibold uppercase tracking-[0.22em] text-exh-ink">
                      {areaGradeWord}
                    </span>
                  </p>
                ) : (
                  <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.22em] text-exh-ink">
                    {area ? "Ungraded on the 1940 sheet" : "No sheet on file"}
                  </p>
                )}
                {area ? (
                  <p className="exh-plat mt-2 text-[11px] uppercase leading-snug tracking-[0.16em] text-exh-ink-soft">
                    {areaLabel(area)}
                    {sheetName(area) && sheetDesignation(area) ? <> &middot; {sheetName(area)}</> : null}
                    {area.security_grade_fields?.date ? (
                      <>
                        {" "}
                        &middot;{" "}
                        <span className="exh-mono normal-case tracking-normal">
                          Filed {area.security_grade_fields.date}
                        </span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                data-testid="flood-card-close"
                onClick={closeCard}
                className="exh-plat inline-flex min-h-11 shrink-0 cursor-pointer items-center border border-exh-ink/40 bg-transparent px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
              >
                Close
              </button>
            </div>

            {area && excerptUsable(area) ? (
              <>
                <p className="exh-plat mt-4 text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
                  {area.excerptLabel ?? "From the sheet"}
                </p>
                <p className="mt-2 font-display text-base leading-relaxed text-exh-ink">
                  &ldquo;{area.excerpt}&rdquo;
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-exh-ink-soft">
                {area
                  ? "The digitized copy of this sheet's remarks is too damaged to read here."
                  : "The digitized files carry no sheet for this area."}
              </p>
            )}

            {area ? (
              <a
                href={`#room-files:${openId}`}
                className="exh-plat mt-4 inline-block min-h-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink underline decoration-exh-ink/40 underline-offset-4 hover:decoration-exh-ink"
              >
                Read the full sheet in the study room
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
