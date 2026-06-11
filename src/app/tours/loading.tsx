import {
  SkeletonLine,
  SkeletonCard,
} from "@/components/ui/Skeleton";

export default function ToursLoading() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Page header skeleton */}
        <SkeletonLine width="4rem" height="0.75rem" />
        <div className="mt-4">
          <SkeletonLine width="60%" height="2.5rem" />
        </div>
        <div className="mt-6">
          <SkeletonLine width="90%" height="1rem" />
          <div className="mt-2">
            <SkeletonLine width="70%" height="1rem" />
          </div>
        </div>

        {/* City cards grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
