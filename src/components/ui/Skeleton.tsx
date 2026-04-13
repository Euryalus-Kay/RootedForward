import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SkeletonLine                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLine({
  width = "100%",
  height = "1rem",
  className,
}: SkeletonLineProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-cream-dark",
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonAvatar                                                     */
/* ------------------------------------------------------------------ */

interface SkeletonAvatarProps {
  size?: string;
  className?: string;
}

export function SkeletonAvatar({
  size = "3rem",
  className,
}: SkeletonAvatarProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-cream-dark",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonText                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-cream-dark"
          style={{
            height: "0.875rem",
            width: i === lines - 1 ? "60%" : "100%",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SkeletonCard                                                       */
/* ------------------------------------------------------------------ */

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-cream",
        className
      )}
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <div className="aspect-video w-full animate-pulse bg-cream-dark" />

      {/* Text area */}
      <div className="p-5">
        {/* Title */}
        <SkeletonLine width="70%" height="1.25rem" />

        {/* Description lines */}
        <div className="mt-4">
          <SkeletonText lines={2} />
        </div>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-3">
          <SkeletonLine width="4rem" height="0.75rem" />
          <SkeletonLine width="5rem" height="0.75rem" />
        </div>
      </div>
    </div>
  );
}
