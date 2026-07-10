"use client";
/* ------------------------------------------------------------------ */
/*  FactValue, THE stat renderer. Every displayed figure in the        */
/*  exhibit goes through here so it carries its registry id, its       */
/*  provenance tier, and a citation trigger. Components never hold     */
/*  numeric literals. If the fact id is not registered yet (the        */
/*  registry is generated alongside this HUD) it renders a loud        */
/*  bracketed token instead of crashing the page.                      */
/* ------------------------------------------------------------------ */
import { getFact, hasFact } from "@/lib/exhibit/facts";
import { cn } from "@/lib/utils";
import { SourceSup, TierBadge } from "./SourceSup";

export interface FactValueProps {
  /** fact id in data/exhibit/facts.json */
  id: string;
  label?: string;
  /** defaults to true when the tier is not documented */
  showTierBadge?: boolean;
  size?: "sm" | "md" | "lg";
  /** mono marks a figure; body face suits computed prose tallies */
  mono?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<FactValueProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl md:text-2xl",
};

export function FactValue({ id, label, showTierBadge, size = "md", mono = true, className }: FactValueProps) {
  if (!hasFact(id)) {
    // loud but survivable while facts.json is generated in parallel
    return (
      <span
        data-stat=""
        data-fact-id={id}
        data-fact-missing=""
        className={cn("exh-mono text-xs text-exh-ink-soft", className)}
      >
        [{id}]
      </span>
    );
  }
  const fact = getFact(id);
  const showBadge = showTierBadge ?? fact.tier !== "documented";

  return (
    <span
      data-stat=""
      data-fact-id={id}
      className={cn("inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5", className)}
    >
      {label && (
        <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
          {label}
        </span>
      )}
      {/* the citation mark rides inside the text span so it can never
          wrap onto a line of its own */}
      <span className={cn(mono && "exh-mono", "font-medium text-exh-ink", SIZE_CLASS[size])}>
        {fact.display}
        <SourceSup factId={id} />
      </span>
      {showBadge && <TierBadge tier={fact.tier} compact />}
    </span>
  );
}

export default FactValue;
