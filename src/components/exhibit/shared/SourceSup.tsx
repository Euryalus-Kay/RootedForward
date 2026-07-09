"use client";
/* ------------------------------------------------------------------ */
/*  SourceSup, the superscript citation trigger used by FactValue and  */
/*  free text. Visually a tiny dagger, but the real hit area is a      */
/*  centered 44px square drawn with an ::after box. Clicking           */
/*  opens a small fixed-position paper popover (measured from the      */
/*  trigger rect so it survives overflow containers like the ledger    */
/*  scroll) with the citation line, the provenance tier chip and its   */
/*  one-line gloss, and a source link. The trigger is a plain          */
/*  disclosure (aria-expanded, no dialog claim); the popover follows   */
/*  its dagger through scrolls instead of vanishing, and Escape        */
/*  closes and refocuses. SourceSupGroup collapses a paragraph-end     */
/*  run of four or more daggers into one popover listing every         */
/*  source, so citation-dense wall text stops reading as a glitch.     */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import { citationLine, getFact, hasFact } from "@/lib/exhibit/facts";
import type { FactSource, FactTier } from "@/lib/exhibit/types";
import { cn } from "@/lib/utils";
import { PaperCard } from "./PaperCard";

const POPOVER_WIDTH = 272;

/* a run of this many refs or more collapses into one grouped popover */
const GROUP_THRESHOLD = 4;

/* one-line tier definitions, matching the About panel's Method block,
   so REPORTED can never be read as "reported to police" */
const TIER_GLOSS: Record<FactTier, string> = {
  documented: "Documented figures rest on primary records or published scholarship.",
  reported: "Reported figures rest on journalism or secondary accounts.",
  attributed: "Attributed figures rest on a single source.",
};

export interface SourceSupProps {
  /** resolve tier + citation from the fact registry */
  factId?: string;
  /** or cite a raw source directly (free text use) */
  source?: FactSource;
  /** optional footnote number rendered after the dagger */
  index?: number;
  className?: string;
}

/** Provenance tier chip. compact shows the bare tier word for inline use;
 *  the full form carries the single-source policy label for attributed. */
export function TierBadge({ tier, compact = false }: { tier: FactTier; compact?: boolean }) {
  const label = tier === "attributed" && !compact ? "attributed, single source" : tier;
  return (
    <span
      data-tier={tier}
      className={cn(
        "exh-plat inline-block align-middle text-[11px] uppercase leading-none tracking-[0.18em] md:text-[9px]",
        tier === "documented" && "text-exh-ink-soft/80",
        tier === "reported" && "rounded-[2px] border border-exh-ink/40 px-1 py-0.5 text-exh-ink-soft",
        tier === "attributed" && "rounded-[2px] border-2 border-exh-ink px-1 py-0.5 font-bold text-exh-ink"
      )}
    >
      {label}
    </span>
  );
}

/* ---- shared popover plumbing --------------------------------------- */

interface PopoverPos {
  left: number;
  top?: number;
  bottom?: number;
}

function computePos(btn: HTMLButtonElement | null): PopoverPos | null {
  const r = btn?.getBoundingClientRect();
  if (!r) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(
    Math.max(8, r.left + r.width / 2 - POPOVER_WIDTH / 2),
    Math.max(8, vw - POPOVER_WIDTH - 8)
  );
  const below = r.bottom + 6;
  // keep clear of the caption strip and spine at the bottom of the stage
  if (below > vh - 220) return { left, bottom: Math.max(8, vh - r.top + 6) };
  return { left, top: below };
}

function useSupPopover() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && e.target instanceof Node && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    /* the popover follows its dagger through scrolls, keyboard paging
       included, instead of vanishing mid-read */
    const onScroll = () => setPos(computePos(btnRef.current));
    const onResize = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const p = computePos(btnRef.current);
    if (!p) return;
    setPos(p);
    setOpen(true);
  };

  return { open, pos, wrapRef, btnRef, toggle };
}

const TRIGGER_CLASS = cn(
  "relative inline-flex items-center justify-center align-super text-[11px] leading-none text-exh-blue md:text-[9px]",
  // visually small, physically tappable: a centered 44px hit box
  // independent of the dagger's own rendered size
  "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
);

export function SourceSup({ factId, source, index, className }: SourceSupProps) {
  const { open, pos, wrapRef, btnRef, toggle } = useSupPopover();

  const fact = factId && hasFact(factId) ? getFact(factId) : null;
  const src = fact?.source ?? source;

  if (!src) return null;

  const line = fact
    ? citationLine(fact)
    : citationLine({ id: "", value: "", display: "", tier: "reported", source: src });
  const marker = index != null ? `†${index}` : "†";

  return (
    <span ref={wrapRef} className={cn("relative inline-block", className)}>
      <button
        ref={btnRef}
        type="button"
        data-testid="source-sup"
        aria-expanded={open}
        aria-label={src.title ? `Source, ${src.title}` : "Source"}
        onClick={toggle}
        className={TRIGGER_CLASS}
      >
        <span className="exh-mono" aria-hidden="true">
          {marker}
        </span>
      </button>
      {open && pos && (
        <PaperCard
          data-testid="source-popover"
          tone="deep"
          className="fixed z-50 p-2.5 text-left"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: POPOVER_WIDTH }}
        >
          {fact && (
            <div className="mb-1.5">
              <TierBadge tier={fact.tier} />
              <p className="mt-1 text-[11px] leading-snug text-exh-ink-soft">
                {TIER_GLOSS[fact.tier]}
              </p>
            </div>
          )}
          <p className="text-[11px] leading-snug text-exh-ink">{line || src.title}</p>
          {src.url && (
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex min-h-10 items-center text-[11px] text-exh-blue underline underline-offset-2"
            >
              View source
            </a>
          )}
        </PaperCard>
      )}
    </span>
  );
}

/* ---- grouped citations ---------------------------------------------- */

export interface SourceSupGroupProps {
  factIds: string[];
  className?: string;
}

/**
 * A paragraph's citation run. Below GROUP_THRESHOLD the daggers stay
 * individual; at or past it they collapse into one dagger whose
 * popover lists every source with its tier chip, so a nine-dagger
 * run never prints.
 */
export function SourceSupGroup({ factIds, className }: SourceSupGroupProps) {
  const known = factIds.filter((id) => hasFact(id));
  if (known.length < GROUP_THRESHOLD) {
    return (
      <>
        {factIds.map((id) => (
          <SourceSup key={id} factId={id} className={className} />
        ))}
      </>
    );
  }
  return <GroupedSup factIds={known} className={className} />;
}

function GroupedSup({ factIds, className }: SourceSupGroupProps) {
  const { open, pos, wrapRef, btnRef, toggle } = useSupPopover();
  const facts = factIds.map((id) => getFact(id));

  return (
    <span ref={wrapRef} className={cn("relative inline-block", className)}>
      <button
        ref={btnRef}
        type="button"
        data-testid="source-sup-group"
        aria-expanded={open}
        aria-label={`Sources, ${facts.length} citations`}
        onClick={toggle}
        className={TRIGGER_CLASS}
      >
        <span className="exh-mono" aria-hidden="true">
          †
        </span>
      </button>
      {open && pos && (
        <PaperCard
          data-testid="source-popover"
          tone="deep"
          className="fixed z-50 max-h-[50vh] overflow-y-auto p-2.5 text-left"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: POPOVER_WIDTH }}
        >
          <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft md:text-[10px]">
            {facts.length} sources for this passage
          </p>
          <ul className="mt-1.5">
            {facts.map((f) => (
              <li key={f.id} className="border-t border-exh-ink/10 py-1.5 first:border-t-0">
                <TierBadge tier={f.tier} compact />
                <p className="mt-0.5 text-[11px] leading-snug text-exh-ink">{citationLine(f)}</p>
                {f.source.url && (
                  <a
                    href={f.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex min-h-8 items-center text-[11px] text-exh-blue underline underline-offset-2"
                  >
                    View source
                  </a>
                )}
              </li>
            ))}
          </ul>
        </PaperCard>
      )}
    </span>
  );
}

export default SourceSup;
