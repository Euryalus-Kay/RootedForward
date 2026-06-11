/* The four HOLC mortgage-security grades as a small color mark.
   A quiet, on-subject signature used as an accent across the site:
   green A, blue B, yellow C, red D — the 1930s map legend that the
   whole project is about. */

import { cn } from "@/lib/utils";

const GRADES = [
  { letter: "A", className: "bg-grade-a" },
  { letter: "B", className: "bg-grade-b" },
  { letter: "C", className: "bg-grade-c" },
  { letter: "D", className: "bg-grade-d" },
] as const;

export default function GradeStrip({
  className,
  size = "sm",
  labeled = false,
}: {
  className?: string;
  size?: "sm" | "md";
  labeled?: boolean;
}) {
  const box = size === "sm" ? "h-2 w-6" : "h-3 w-9";
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label="The four HOLC mortgage security grades, A through D"
      role="img"
    >
      {GRADES.map((g) => (
        <span key={g.letter} className="flex flex-col items-center gap-1">
          <span className={cn(box, g.className)} />
          {labeled && (
            <span className="ledger text-[10px] opacity-60">{g.letter}</span>
          )}
        </span>
      ))}
    </div>
  );
}
