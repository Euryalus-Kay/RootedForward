"use client";
/* ------------------------------------------------------------------ */
/*  The Surveyor's Files, a reading room (ch6 door). Every digitized   */
/*  HOLC area description sheet for Chicago, browsable by grade and    */
/*  searchable by neighborhood, with the form's own entries shown      */
/*  verbatim. Each sheet has a permalink (#room-files:<areaId>) so a   */
/*  reader can cite a specific document. No game, no completion; the   */
/*  room is an archive with a reading table.                           */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  excerptUsable,
  sheetDesignation,
  sheetName,
  useHolcDescriptions,
  type DescArea,
} from "@/lib/exhibit/holc-descriptions";
import { FILES_HASH, sheetIdFromHash } from "@/lib/exhibit/files-room";
import { moveFocus } from "@/lib/exhibit/focus";
import PaperCard from "../shared/PaperCard";
import FactValue from "../shared/FactValue";
import sheetsAnalysis from "../../../../data/exhibit/sheets-analysis.json";

/* ------- the printed form's entries, in the form's own order ------- */

const FIELD_ROWS: Array<{ key: keyof NonNullable<DescArea["security_grade_fields"]>; label: string }> = [
  { key: "security_grade", label: "Security grade" },
  { key: "area_number", label: "Area number" },
  { key: "location", label: "Location" },
  { key: "date", label: "Date" },
  { key: "occupation_or_type", label: "Occupation or type of inhabitants" },
  { key: "foreign_born_percent", label: "Foreign-born, percent" },
  { key: "foreign_born_nationality", label: "Foreign-born, nationality" },
  { key: "negro_percent", label: "Negro, percent" },
  { key: "infiltration_of", label: "Infiltration of" },
  { key: "population.increasing", label: "Population increasing" },
  { key: "population.static", label: "Population static" },
  { key: "population.decreasing", label: "Population decreasing" },
  { key: "mortagage_funds", label: "Availability of mortgage funds" },
];

const GRADE_WORD: Record<string, string> = {
  A: "Grade A, best",
  B: "Grade B, still desirable",
  C: "Grade C, definitely declining",
  D: "Grade D, hazardous",
};

const PAGE_SIZE = 48;

function sheetSortKey(a: DescArea): [string, number, string] {
  const des = sheetDesignation(a);
  if (des) {
    const [g, n] = des.split("-");
    return [g, Number(n), ""];
  }
  return [a.grade || "Z", Number.MAX_SAFE_INTEGER, sheetName(a) ?? String(a.areaId)];
}

export default function SurveyorsFiles() {
  const desc = useHolcDescriptions();
  const areas = desc.data?.areas;

  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window !== "undefined" ? sheetIdFromHash(window.location.hash) : null
  );
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const arrivedViaLink = useRef<boolean>(selectedId !== null);
  const focusSheetOnOpen = useRef(false);

  const sorted = useMemo(() => {
    if (!areas) return [];
    return [...areas].sort((a, b) => {
      const ka = sheetSortKey(a);
      const kb = sheetSortKey(b);
      if (ka[0] !== kb[0]) return ka[0] < kb[0] ? -1 : 1;
      if (ka[1] !== kb[1]) return ka[1] - kb[1];
      return ka[2] < kb[2] ? -1 : ka[2] > kb[2] ? 1 : 0;
    });
  }, [areas]);

  const gradeCounts = useMemo(() => {
    const c: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const a of sorted) if (c[a.grade] !== undefined) c[a.grade] += 1;
    return c;
  }, [sorted]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((a) => {
      if (gradeFilter !== "all" && a.grade !== gradeFilter) return false;
      if (!q) return true;
      const hay = [
        sheetName(a) ?? "",
        sheetDesignation(a) ?? "",
        a.security_grade_fields?.location ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, gradeFilter, query]);

  const selected = useMemo(
    () => (selectedId ? sorted.find((a) => String(a.areaId) === selectedId) ?? null : null),
    [sorted, selectedId]
  );

  /* two drawer rows can print identically (the record holds two
     "D Woodlawn" sheets); duplicates carry a second field, location
     or date, so a reader can tell them apart before opening */
  const duplicateRowKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of sorted) {
      const k = `${sheetDesignation(a) ?? a.grade}|${
        sheetName(a) ?? a.security_grade_fields?.location?.trim() ?? "Unnamed area"
      }`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [sorted]);

  /* permalink sync: selecting a sheet rewrites the room hash in place
     (replaceState, so Back still exits the room in one step) */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.startsWith(FILES_HASH)) return;
    const target = selectedId ? `${FILES_HASH}:${selectedId}` : FILES_HASH;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [selectedId]);

  /* a deep-linked arrival lands on its sheet once the data is in */
  useEffect(() => {
    if (arrivedViaLink.current && selected && sheetRef.current) {
      arrivedViaLink.current = false;
      sheetRef.current.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [selected]);

  /* choosing a sheet from the drawer moves focus (and the reader) to
     the opened sheet card, so keyboard and screen-reader visitors are
     not left stranded in the list */
  useEffect(() => {
    if (focusSheetOnOpen.current && selected && sheetRef.current) {
      focusSheetOnOpen.current = false;
      sheetRef.current.scrollIntoView({ behavior: "auto", block: "start" });
      moveFocus(sheetRef.current);
    }
  }, [selected]);

  const openSheet = (a: DescArea) => {
    setCopied(false);
    focusSheetOnOpen.current = true;
    setSelectedId(String(a.areaId));
  };

  const closeSheet = () => {
    setSelectedId(null);
    // hand the reader back to the drawer they chose from
    moveFocus(drawerRef.current);
  };

  const copyPermalink = async () => {
    if (!selectedId || typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}${FILES_HASH}:${selectedId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copy the link to this sheet", url);
    }
  };

  const shown = filtered.slice(0, visibleCount);
  const designation = selected ? sheetDesignation(selected) : null;
  const name = selected ? sheetName(selected) : null;
  const fields = selected?.security_grade_fields;
  const fieldRows = fields
    ? FIELD_ROWS.filter((r) => {
        const v = fields[r.key];
        return typeof v === "string" && v.trim().length > 0;
      })
    : [];

  return (
    <div data-testid="surveyors-files" className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8">
      {/* ---------------- what this archive is ---------------- */}
      <p className="max-w-prose text-base leading-relaxed text-exh-ink">
        When the federal surveyors graded a neighborhood, they filed a printed description form
        for it. This room holds every sheet in the digitized record for Chicago and its suburbs
        {areas ? `, ${areas.length} in all` : ""}. The form asked for the race and national
        origin of an area&rsquo;s residents before it asked about the condition of the houses.
        The entries below are shown as they were typed.
      </p>
      <span className="exh-plat mt-3 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[11px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft md:text-[9px]">
        period documents; they contain the era&rsquo;s racist language
      </span>

      {/* ---------------- patterns in the record ---------------- */}
      <PaperCard data-testid="files-patterns" className="mt-6 p-4 sm:p-6">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft md:text-[10px]">
          Patterns in the record
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-exh-ink">
          Read one sheet and you see a neighborhood. Counted together, the sheets show the
          system. Every count below is computed from the archive on this page and can be
          re-run against it.
        </p>
        <ul className="mt-4 space-y-3">
          <li className="border-t border-exh-ink/15 pt-3">
            <p className="text-sm leading-relaxed text-exh-ink">
              The form asked for race before it asked about the houses, and the answers sort
              cleanly by grade.
            </p>
            <div className="mt-1"><FactValue id="sheets.race_by_grade" size="sm" /></div>
          </li>
          <li className="border-t border-exh-ink/15 pt-3">
            <p className="text-sm leading-relaxed text-exh-ink">
              The form&rsquo;s Infiltration question, asking what was moving in, was answered
              with a race almost only on the lowest grade.
            </p>
            <div className="mt-1"><FactValue id="sheets.infiltration_negro" size="sm" /></div>
          </li>
          <li className="border-t border-exh-ink/15 pt-3">
            <p className="text-sm leading-relaxed text-exh-ink">
              The surveyors also recorded what lenders were already doing. Credit followed
              the grade before the map was printed.
            </p>
            <div className="mt-1"><FactValue id="sheets.mortgage_gradient" size="sm" /></div>
          </li>
          <li className="border-t border-exh-ink/15 pt-3">
            <p className="text-sm leading-relaxed text-exh-ink">
              The vocabulary that would later justify clearance appears here first, and only
              at the bottom of the scale.
            </p>
            <div className="mt-1"><FactValue id="sheets.blighted_by_grade" size="sm" /></div>
          </li>
        </ul>
        {areas && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["1097", "1635"] as const).map((qid) => {
              const q = (sheetsAnalysis.quotedSheets as Record<string, { label?: string; grade?: string; quote?: string | null }>)[qid];
              if (!q?.quote) return null;
              const target = sorted.find((a) => String(a.areaId) === qid);
              return (
                <div key={qid} className="border border-exh-ink/25 bg-exh-linen-deep/40 p-3">
                  <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft md:text-[10px]">
                    Sheet {q.label ?? qid}
                  </p>
                  <blockquote className="exh-serif mt-1 text-sm leading-snug text-exh-ink italic">
                    &ldquo;{q.quote}&rdquo;
                  </blockquote>
                  <div className="mt-1">
                    <FactValue id={qid === "1097" ? "sheets.a11_restricted_quote" : "sheets.d106_not_restricted_quote"} size="sm" />
                  </div>
                  {target && (
                    <button
                      type="button"
                      data-testid={`files-pattern-open-${qid}`}
                      onClick={() => openSheet(target)}
                      className="exh-plat mt-2 min-h-10 cursor-pointer border border-exh-ink/40 bg-exh-linen px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-exh-ink transition-colors hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
                    >
                      Read the whole sheet
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PaperCard>

      {/* ---------------- the open sheet ---------------- */}
      <div ref={sheetRef} className="mt-6 scroll-mt-20">
        {selected ? (
          <PaperCard tone="deep" data-testid="files-sheet" className="p-4 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`exh-plat text-sm font-bold uppercase tracking-[0.18em] ${
                  selected.grade === "D" ? "text-exh-red" : "text-exh-ink"
                }`}
              >
                {GRADE_WORD[selected.grade] ?? "Ungraded"}
              </span>
              <span className="exh-mono ml-auto text-xs text-exh-ink/70">
                {designation ?? `digitized record ${String(selected.areaId)}`}
              </span>
            </div>
            {name && <p className="exh-serif mt-1.5 text-lg leading-snug text-exh-ink">{name}</p>}

            {fieldRows.length > 0 && (
              <div className="mt-4 border-t border-exh-ink/15 pt-3">
                <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft md:text-[10px]">
                  From the printed form, as filed
                </p>
                <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {fieldRows.map((r) => (
                    <div key={r.key} className="flex flex-col border-b border-exh-ink/10 pb-1.5">
                      <dt className="exh-plat text-[11px] uppercase tracking-[0.14em] text-exh-ink-soft md:text-[10px]">
                        {r.label}
                      </dt>
                      <dd className="exh-mono text-sm text-exh-ink">{fields?.[r.key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {excerptUsable(selected) && (
              <div className="mt-4 border-t border-exh-ink/15 pt-3">
                {selected.excerptLabel && (
                  <p className="exh-mono text-[11px] text-exh-ink/70 md:text-[10px]">{selected.excerptLabel}</p>
                )}
                <blockquote className="exh-serif mt-1 text-sm leading-relaxed text-exh-ink italic">
                  &ldquo;{selected.excerpt.trim()}&rdquo;
                </blockquote>
              </div>
            )}

            {selected.corruptedFields && selected.corruptedFields.length > 0 && (
              <p className="mt-4 text-xs leading-snug text-exh-ink-soft">
                Some entries on this sheet were corrupted in the source transcription and are
                omitted rather than guessed at.
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-testid="files-permalink"
                onClick={copyPermalink}
                className="exh-plat min-h-12 cursor-pointer border border-exh-ink/40 bg-exh-linen px-4 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
              >
                {/* the live region reads the label swap out loud */}
                <span aria-live="polite">{copied ? "Link copied" : "Copy a link to this sheet"}</span>
              </button>
              <button
                type="button"
                data-testid="files-clear"
                onClick={closeSheet}
                className="exh-plat min-h-12 cursor-pointer px-2 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink-soft underline-offset-4 hover:underline"
              >
                Close this sheet
              </button>
            </div>
          </PaperCard>
        ) : (
          <PaperCard data-testid="files-sheet-empty" className="p-4 sm:p-6">
            <p className="text-sm leading-snug text-exh-ink-soft">
              {desc.done && areas
                ? "No sheet is open. Choose one from the drawer below."
                : desc.done
                  ? "The archive could not be loaded. Reload the page to try again."
                  : "Opening the archive."}
            </p>
          </PaperCard>
        )}
      </div>

      {/* ---------------- the drawer ---------------- */}
      {areas && (
        <div ref={drawerRef} className="mt-8 scroll-mt-20">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by grade">
            {(["all", "A", "B", "C", "D"] as const).map((g) => (
              <button
                key={g}
                type="button"
                data-testid={`files-grade-${g}`}
                aria-pressed={gradeFilter === g}
                onClick={() => {
                  setGradeFilter(g);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`exh-plat min-h-11 cursor-pointer border px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                  gradeFilter === g
                    ? "border-exh-ink bg-exh-ink text-exh-linen"
                    : "border-exh-ink/40 bg-exh-linen text-exh-ink hover:border-exh-ink"
                }`}
              >
                {g === "all" ? `All ${sorted.length}` : `${g} ${gradeCounts[g] ?? 0}`}
              </button>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft md:text-[10px]">
              Search by neighborhood or area number
            </span>
            <input
              type="search"
              data-testid="files-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Woodlawn, Kenwood, D-74"
              className="mt-1.5 w-full max-w-sm border border-exh-ink/40 bg-exh-linen px-3 py-2.5 text-sm text-exh-ink placeholder:text-exh-ink/40 focus:border-exh-ink focus:outline-none"
            />
          </label>

          <ul data-testid="files-list" className="mt-4 divide-y divide-exh-ink/10 border-y border-exh-ink/20">
            {shown.map((a) => {
              const d = sheetDesignation(a);
              const n = sheetName(a);
              const loc = a.security_grade_fields?.location?.trim();
              const primary = n ?? loc ?? "Unnamed area";
              const open = selectedId === String(a.areaId);
              let detail: string | null = null;
              if (duplicateRowKeys.has(`${d ?? a.grade}|${primary}`)) {
                const date = a.security_grade_fields?.date?.trim();
                detail = n && loc && loc !== n ? loc : date ?? null;
              }
              return (
                <li key={String(a.areaId)}>
                  <button
                    type="button"
                    onClick={() => openSheet(a)}
                    aria-pressed={open}
                    className={`flex min-h-12 w-full cursor-pointer items-baseline gap-3 px-2 py-2.5 text-left transition-colors hover:bg-exh-linen-deep/60 ${
                      open ? "bg-exh-linen-deep/80" : ""
                    }`}
                  >
                    <span
                      className={`exh-mono w-14 shrink-0 text-xs ${
                        a.grade === "D" ? "text-exh-red" : "text-exh-ink/70"
                      }`}
                    >
                      {d ?? a.grade}
                    </span>
                    <span className="exh-serif min-w-0 flex-1 truncate text-sm text-exh-ink">
                      {primary}
                      {detail ? <span className="text-exh-ink/70">, {detail}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && (
            <p className="mt-3 text-sm text-exh-ink-soft">
              No sheet matches. Try a shorter name, or clear the grade filter.
            </p>
          )}
          {filtered.length > shown.length && (
            <button
              type="button"
              data-testid="files-more"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="exh-plat mt-4 min-h-12 cursor-pointer border border-exh-ink/40 bg-exh-linen px-5 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
            >
              Show more sheets
            </button>
          )}
        </div>
      )}

      {/* ---------------- provenance ---------------- */}
      {desc.data?.attribution && (
        <p className="mt-10 border-t border-exh-ink/15 pt-4 text-xs leading-relaxed text-exh-ink-soft">
          {desc.data.attribution}
        </p>
      )}
    </div>
  );
}
