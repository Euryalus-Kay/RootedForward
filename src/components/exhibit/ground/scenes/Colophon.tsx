"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "colophon" (#a6-colophon). The exhibit's closing wall:    */
/*  the colophon line from ground-copy.json, the source record (a      */
/*  count line over a <details> bibliography built from the fact       */
/*  registry), the Mapping Inequality attribution the license          */
/*  requires, and the Study Room door. The door opens the shipped      */
/*  Surveyor's Files reading room in a full-screen dialog (Radix       */
/*  supplies the focus trap, the body scroll lock, and Escape), code-  */
/*  split so the room's chunk loads on first open. This scene also     */
/*  owns the #room-files[:areaId] permalink contract on the R9 page:   */
/*  arriving with the hash opens the room, the room itself resolves    */
/*  the sheet id, opening pushes the hash so the browser Back button   */
/*  closes the room, and closing strips it.                            */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as Dialog from "@radix-ui/react-dialog";
import type { SceneProps } from "./registry";
import { GROUND_COPY } from "@/lib/exhibit/ground/copy";
import { allFacts, buildBibliography } from "@/lib/exhibit/facts";
import { FILES_HASH, FILES_ROOM_PLATE } from "@/lib/exhibit/files-room";
import sheetsAnalysis from "../../../../../data/exhibit/sheets-analysis.json";

/* License condition, verbatim. This string must stay byte-identical to
 * the attribution field carried in src/lib/exhibit/ground/geometry.json
 * and public/exhibit-data/holc-descriptions.json (geometry.json itself
 * is banned from client imports for bundle size, so the sentence is
 * carried here as a constant). */
const MAPPING_INEQUALITY_ATTRIBUTION =
  "Polygons and area descriptions from Mapping Inequality (Robert K. Nelson, LaDale Winling, et al., University of Richmond Digital Scholarship Lab), CC BY-NC 4.0. Underlying HOLC records are public domain.";

/* the reading room is deep material; its chunk loads on first open */
const SurveyorsFiles = dynamic(() => import("../../rooms/SurveyorsFiles"), {
  ssr: false,
  loading: () => (
    <p className="exh-plat px-8 py-16 text-center text-xs uppercase tracking-[0.25em] text-exh-ink-soft">
      Opening the archive
    </p>
  ),
});

const EYEBROW_CLASS =
  "exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft md:text-[10px]";

function isFilesHash(): boolean {
  return typeof window !== "undefined" && window.location.hash.startsWith(FILES_HASH);
}

export default function Colophon(_props: SceneProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const bibliography = useMemo(() => buildBibliography(), []);
  const factCount = allFacts().length;
  /* the sheet total is computed from the archive's own analysis file,
     the same record the reading room lists sheet by sheet */
  const sheetTotal = useMemo(() => {
    const byGrade = (sheetsAnalysis as { sheetsByGrade: Record<string, number> }).sheetsByGrade;
    return Object.values(byGrade).reduce((sum, n) => sum + n, 0);
  }, []);

  /* permalink contract: a #room-files[:areaId] arrival opens the room
     (the room reads the sheet id from the hash itself); Back and
     Forward keep working through popstate */
  useEffect(() => {
    if (isFilesHash()) setOpen(true);
    const onPop = () => setOpen(isFilesHash());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openRoom = () => {
    /* push the room hash so the browser Back button closes the room;
       a deep-linked arrival already carries it */
    if (!isFilesHash()) window.history.pushState(null, "", FILES_HASH);
    setOpen(true);
  };

  const closeRoom = () => {
    setOpen(false);
    if (isFilesHash()) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <section data-testid="scene-colophon" className="border-t border-exh-ink/25 pt-10">
      {/* the wall label plate; sized to screenshot whole on a phone */}
      <div
        data-testid="colophon-plate"
        className="max-w-[26rem] border border-exh-ink/40 bg-exh-linen-deep/30 px-5 py-5"
      >
        <p className={EYEBROW_CLASS}>Colophon</p>
        <p className="mt-2 font-display text-2xl leading-tight text-exh-ink">
          {GROUND_COPY.opening.title}
        </p>
        <p className="exh-mono mt-1 text-sm text-exh-ink">1832 to 2026</p>
        <p className="mt-3 text-sm leading-relaxed text-exh-ink">
          <span className="exh-mono">{factCount}</span> registered facts ·{" "}
          <span className="exh-mono">{bibliography.length}</span> works and records
        </p>
        <p className="exh-plat mt-3 border-t border-exh-ink/25 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          rooted-forward.org
        </p>
      </div>
      <p className="mt-5 max-w-prose font-display text-lg leading-[1.7] text-exh-ink">
        {GROUND_COPY.closing.colophonLine}
      </p>

      {/* ---------------- the source record ---------------- */}
      <div className="mt-8">
        <p className={EYEBROW_CLASS}>The source record</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-exh-ink-soft">
          The <span className="exh-mono">{factCount}</span> facts rest on{" "}
          <span className="exh-mono">{bibliography.length}</span> works and records,
          alphabetized.
        </p>
        <details data-testid="colophon-bibliography" className="group mt-3">
          <summary className="exh-plat inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              &#9656;
            </span>
            Read the full record
          </summary>
          <ul className="mt-3 gap-x-10 space-y-3 border-t border-exh-ink/15 pt-4 sm:columns-2 sm:space-y-0">
            {bibliography.map((s) => (
              <li
                key={[s.title, s.author ?? "", s.yearLabel ?? ""].join("|")}
                data-testid="colophon-bib-entry"
                className="break-inside-avoid pb-3 text-sm leading-snug text-exh-ink"
              >
                {s.author ? <span>{s.author}. </span> : null}
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-exh-ink/40 underline-offset-2 hover:decoration-exh-ink"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
                {s.yearLabel ? (
                  <span className="exh-mono text-exh-ink-soft"> ({s.yearLabel})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* ---------------- the license attribution ---------------- */}
      <p
        data-testid="colophon-attribution"
        className="mt-8 max-w-prose text-xs leading-relaxed text-exh-ink-soft"
      >
        {MAPPING_INEQUALITY_ATTRIBUTION}
      </p>

      {/* ---------------- the Study Room door ---------------- */}
      <Dialog.Root
        open={open}
        onOpenChange={(o) => {
          if (o) openRoom();
          else closeRoom();
        }}
      >
        <Dialog.Trigger asChild>
          <button
            type="button"
            data-testid="ground-study-door"
            className="mt-10 block w-full cursor-pointer border border-exh-ink/40 bg-exh-linen-deep/40 px-5 py-5 text-left transition-colors hover:border-exh-ink"
          >
            <span className={EYEBROW_CLASS}>Study room</span>
            <span className="mt-1 block font-display text-lg leading-snug text-exh-ink">
              All <span className="exh-mono">{sheetTotal}</span> surveyors&rsquo; sheets, searchable.
            </span>
          </button>
        </Dialog.Trigger>

        {/* the scene sits inside .ground-steps-pane (z-index 5), a
            stacking context the sticky stage pane (z-index 10) beats,
            so the room portals to <body>; the .exhibit-root wrapper
            keeps the exhibit's scoped classes working inside it */}
        <Dialog.Portal>
          <div className="exhibit-root">
            <Dialog.Overlay className="fixed inset-0 z-[55] bg-exh-ink/80 backdrop-blur-[3px]" />
            <Dialog.Content
          ref={contentRef}
          data-testid="ground-files-room"
          onEscapeKeyDown={(e) => {
            /* an open citation popover inside the room claims the
               Escape; the room stays while the popover closes itself */
            if (contentRef.current?.querySelector('[data-testid="source-popover"]')) {
              e.preventDefault();
            }
          }}
          className="exh-paper fixed inset-0 z-[56] overflow-y-auto overscroll-contain border-exh-ink/30 bg-exh-linen focus:outline-none md:inset-x-6 md:inset-y-5 md:rounded-sm md:border"
        >
          {/* top bar: nameplate plus the way back, always in reach */}
          <div className="exh-paper sticky top-0 z-10 border-b border-exh-ink/20 bg-exh-linen">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
              <div className="min-w-0">
                <Dialog.Title asChild>
                  <h2 className="exh-plat text-sm font-semibold uppercase leading-snug tracking-[0.25em] text-exh-ink">
                    {FILES_ROOM_PLATE.plainName}
                  </h2>
                </Dialog.Title>
                <p className="exh-plat mt-0.5 text-[11px] uppercase leading-snug tracking-[0.18em] text-exh-ink-soft md:text-[10px]">
                  {FILES_ROOM_PLATE.title}
                </p>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  data-testid="ground-files-close"
                  className="exh-plat inline-flex min-h-12 shrink-0 cursor-pointer items-center border border-exh-ink/40 bg-exh-linen px-4 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink outline-none transition-colors hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
                >
                  Back to the exhibit
                </button>
              </Dialog.Close>
            </div>
          </div>
              <Dialog.Description className="sr-only">
                {FILES_ROOM_PLATE.definition}
              </Dialog.Description>
              <SurveyorsFiles />
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
