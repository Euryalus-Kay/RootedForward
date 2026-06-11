/* Standard in-page section header: small index numeral, eyebrow,
   display heading, optional lede. Keeps every page's sections on
   the same typographic rhythm. */

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export default function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  tone = "light",
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  lede?: string;
  /** light = on cream backgrounds, dark = on forest/ink backgrounds */
  tone?: "light" | "dark";
  className?: string;
}) {
  const titleColor = tone === "light" ? "text-forest" : "text-cream";
  const ledeColor = tone === "light" ? "text-ink/70" : "text-cream/70";
  const ruleColor = tone === "light" ? "bg-rust/60" : "bg-rust-light/70";

  return (
    <div className={cn("max-w-3xl", className)}>
      {(index || eyebrow) && (
        <Reveal y={14}>
          <div className="flex items-baseline gap-4">
            {index && (
              <span className="index-numeral text-sm text-rust">{index}</span>
            )}
            {eyebrow && (
              <p
                className={cn(
                  "eyebrow",
                  tone === "light" ? "text-warm-gray" : "text-cream/55"
                )}
              >
                {eyebrow}
              </p>
            )}
          </div>
        </Reveal>
      )}
      <Reveal mask className="mt-3">
        <h2 className={cn("font-display text-3xl md:text-5xl", titleColor)}>
          {title}
        </h2>
      </Reveal>
      <Reveal y={10} delay={0.1}>
        <div className={cn("mt-5 h-px w-14", ruleColor)} aria-hidden="true" />
      </Reveal>
      {lede && (
        <Reveal delay={0.15}>
          <p
            className={cn(
              "mt-5 font-body text-base leading-relaxed md:text-lg",
              ledeColor
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </div>
  );
}
