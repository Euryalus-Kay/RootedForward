/* ------------------------------------------------------------------ */
/*  Stamp, the reusable ink stamp. A double border (outer rule, linen  */
/*  gap, inner hairline drawn with layered inset shadows) gives the    */
/*  letterpress feel; the whole mark sits at -2deg like a hand strike. */
/*  tone follows the exhibit's semantic color rules: red for DECLINED  */
/*  and debit marks, ink for neutral verdicts, green reserved for the  */
/*  single CBL credit. The .exh-stamp entrance is CSS-driven and       */
/*  auto-disabled under [data-motion="off"], so reduced motion needs   */
/*  no JS branch here.                                                 */
/* ------------------------------------------------------------------ */
import { cn } from "@/lib/utils";

export interface StampProps {
  text: string;
  tone: "red" | "ink" | "green";
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const TONE_CLASS: Record<StampProps["tone"], string> = {
  red: "text-exh-red",
  ink: "text-exh-ink",
  green: "text-exh-green",
};

const SIZE_CLASS: Record<NonNullable<StampProps["size"]>, string> = {
  sm: "border px-2 py-0.5 text-[10px] shadow-[inset_0_0_0_1px_var(--color-exh-linen),inset_0_0_0_2px_currentColor]",
  md: "border-2 px-3 py-1 text-xs shadow-[inset_0_0_0_2px_var(--color-exh-linen),inset_0_0_0_3px_currentColor]",
  lg: "border-2 px-4 py-1.5 text-lg shadow-[inset_0_0_0_2px_var(--color-exh-linen),inset_0_0_0_3.5px_currentColor]",
};

export function Stamp({ text, tone, size = "md", animate = false, className }: StampProps) {
  return (
    <span
      data-testid="stamp"
      className={cn(
        "exh-plat inline-block -rotate-2 select-none rounded-[2px] border-current font-bold uppercase tracking-[0.18em]",
        "opacity-90 mix-blend-multiply",
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        animate && "exh-stamp",
        className
      )}
    >
      {text}
    </span>
  );
}

export default Stamp;
