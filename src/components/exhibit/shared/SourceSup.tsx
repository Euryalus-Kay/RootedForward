"use client";
/* ------------------------------------------------------------------ */
/*  SourceSup, the superscript citation trigger used by FactValue and  */
/*  free text. Visually a tiny dagger, but the real hit area is a      */
/*  centered 44px square drawn with an ::after box. Clicking           */
/*  opens a small fixed-position paper popover (measured from the      */
/*  trigger rect so it survives overflow containers like the ledger    */
/*  scroll) with the citation line, the provenance tier chip, and a    */
/*  source link. Keyboard operable, Escape closes and refocuses.       */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import { citationLine, getFact, hasFact } from "@/lib/exhibit/facts";
import type { FactSource, FactTier } from "@/lib/exhibit/types";
import { cn } from "@/lib/utils";
import { PaperCard } from "./PaperCard";

const POPOVER_WIDTH = 272;

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
        "exh-plat inline-block align-middle text-[9px] uppercase leading-none tracking-[0.18em]",
        tier === "documented" && "text-exh-ink-soft/80",
        tier === "reported" && "rounded-[2px] border border-exh-ink/40 px-1 py-0.5 text-exh-ink-soft",
        tier === "attributed" && "rounded-[2px] border-2 border-exh-ink px-1 py-0.5 font-bold text-exh-ink"
      )}
    >
      {label}
    </span>
  );
}

export function SourceSup({ factId, source, index, className }: SourceSupProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fact = factId && hasFact(factId) ? getFact(factId) : null;
  const src = fact?.source ?? source;

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
    const onMove = () => setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  if (!src) return null;

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - POPOVER_WIDTH / 2), Math.max(8, vw - POPOVER_WIDTH - 8));
    const below = r.bottom + 6;
    // keep clear of the caption strip and spine at the bottom of the stage
    if (below > vh - 220) setPos({ left, bottom: Math.max(8, vh - r.top + 6) });
    else setPos({ left, top: below });
    setOpen(true);
  };

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
        aria-haspopup="dialog"
        aria-label={src.title ? `Source, ${src.title}` : "Source"}
        onClick={toggle}
        className={cn(
          "relative inline-flex items-center justify-center align-super text-[9px] leading-none text-exh-blue",
          // visually small, physically tappable: a centered 44px hit box
          // independent of the dagger's own rendered size
          "after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
        )}
      >
        <span className="exh-mono" aria-hidden="true">
          {marker}
        </span>
      </button>
      {open && pos && (
        <PaperCard
          role="dialog"
          aria-label="Source"
          data-testid="source-popover"
          tone="deep"
          className="fixed z-50 p-2.5 text-left"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: POPOVER_WIDTH }}
        >
          {fact && (
            <div className="mb-1.5">
              <TierBadge tier={fact.tier} />
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

export default SourceSup;
