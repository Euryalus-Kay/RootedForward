import {
  SkeletonLine,
  SkeletonText,
} from "@/components/ui/Skeleton";

export default function CityTourLoading() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonLine width="3rem" height="0.75rem" />
          <SkeletonLine width="0.5rem" height="0.75rem" />
          <SkeletonLine width="4rem" height="0.75rem" />
          <SkeletonLine width="0.5rem" height="0.75rem" />
          <SkeletonLine width="5rem" height="0.75rem" />
        </div>

        {/* City name */}
        <div className="mt-6">
          <SkeletonLine width="40%" height="2.5rem" />
        </div>

        {/* Description */}
        <div className="mt-4 max-w-2xl">
          <SkeletonText lines={2} />
        </div>

        {/* Map area skeleton */}
        <div className="mt-10">
          <div className="aspect-[16/9] w-full animate-pulse rounded-lg bg-cream-dark" />
        </div>

        {/* Stop list items */}
        <div className="mt-10 flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-cream p-6"
            >
              <SkeletonLine width="60%" height="1.25rem" />
              <div className="mt-3">
                <SkeletonText lines={2} />
              </div>
              <div className="mt-4">
                <SkeletonLine width="5rem" height="0.875rem" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
