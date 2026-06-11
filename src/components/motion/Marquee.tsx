/* Slow horizontal ticker. Content is duplicated for the seamless loop;
   the duplicate is aria-hidden. Pauses on hover, stops entirely under
   reduced motion (handled in globals.css). */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Marquee({
  children,
  className,
  duration = 60,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
