/* ------------------------------------------------------------------ */
/*  PaperCard, the exhibit's paper surface primitive. Every HUD panel, */
/*  popover, and chip sits on this: plat-book linen with grain, a      */
/*  hairline ink border, and a whisper of lift. tone="deep" swaps to   */
/*  the darker linen for surfaces that must read as a second sheet.    */
/* ------------------------------------------------------------------ */
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PaperCardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "linen" | "deep";
  className?: string;
  children: ReactNode;
}

export function PaperCard({ tone = "linen", className, children, style, ...rest }: PaperCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-sm border border-exh-ink/15 bg-exh-linen exh-paper",
        "shadow-[0_1px_3px_rgba(28,26,23,0.12)]",
        className
      )}
      style={
        tone === "deep"
          ? // inline style outranks the .exh-paper background-color without !important
            { backgroundColor: "var(--color-exh-linen-deep)", ...style }
          : style
      }
    >
      {children}
    </div>
  );
}

export default PaperCard;
