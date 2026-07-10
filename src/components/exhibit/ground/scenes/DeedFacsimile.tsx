"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "DeedFacsimile". The restrictive covenant as a document   */
/*  panel on deep linen. No verbatim covenant text exists in this      */
/*  repo (the chain-armor precedent: characterization, not quotation,  */
/*  until the archival page is on file), so the operative clause is    */
/*  the deed machine's registered description set in document type,    */
/*  labeled described-not-quoted. A toggle reveals the plain-terms     */
/*  reading below the panel, in modern type, never a modal.            */
/* ------------------------------------------------------------------ */
import { useId, useState } from "react";
import { machineOf } from "@/lib/exhibit/machines";
import { SourceSupGroup } from "../../shared/SourceSup";
import type { SceneProps } from "./registry";

const DEED = machineOf("deed");

export default function DeedFacsimile(_props: SceneProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section data-testid="scene-deedFacsimile" className="max-w-[34rem]">
      <div className="border border-exh-ink/25 bg-exh-linen-deep p-5 sm:p-6">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          Restrictive agreement, printed form
        </p>
        <span className="exh-plat mt-2 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[10px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
          the model&rsquo;s terms, described, not quoted
        </span>
        <p className="exh-serif mt-4 font-display text-xl leading-relaxed text-exh-ink md:text-2xl">
          {DEED
            ? DEED.definition
            : "A clause in the title bound every future owner of the land."}
        </p>
        {/* div, not p: the citation popover mounts block elements inline */}
        <div className="mt-5 border-t border-exh-ink/15 pt-3 text-sm leading-relaxed text-exh-ink-soft">
          A neighbor signed it and a county clerk recorded it. The printed model came from the
          national association&rsquo;s counsel.
          <SourceSupGroup factIds={["covenants.macchesney_template"]} />
        </div>
      </div>
      <button
        type="button"
        data-testid="deed-plain-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center border border-exh-ink/40 bg-transparent px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-exh-ink"
      >
        {open ? "Hide the plain terms" : "Read the clause in plain terms"}
      </button>
      <div id={panelId} hidden={!open} className="mt-3 max-w-[32rem]">
        <p className="text-sm leading-relaxed text-exh-ink">
          Whoever owned the lot could not sell it, lease it, or rent it to anyone who was not
          white. The promise bound the next owner, and every owner after that, and any neighbor
          could go to court to enforce it.
        </p>
      </div>
    </section>
  );
}
