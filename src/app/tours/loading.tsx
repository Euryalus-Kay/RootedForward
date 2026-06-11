import { SkeletonLine, SkeletonText } from "@/components/ui/Skeleton";

export default function ToursLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Banner skeleton */}
      <section className="flex min-h-[52vh] flex-col justify-end bg-forest-deep md:min-h-[58vh]">
        <div className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8 md:pb-16">
          <div className="h-3 w-44 animate-pulse rounded-md bg-cream/10" />
          <div className="mt-5 h-12 w-72 animate-pulse rounded-md bg-cream/10 md:h-16 md:w-96" />
          <div className="mt-10 h-px w-full bg-cream/15" />
          <div className="mt-5 flex gap-8">
            <div className="h-3 w-16 animate-pulse rounded-md bg-cream/10" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-cream/10" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-cream/10" />
          </div>
        </div>
      </section>

      {/* Stop ledger + map plate skeleton */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SkeletonLine width="8rem" height="0.75rem" />
          <div className="mt-4">
            <SkeletonLine width="40%" height="2.5rem" />
          </div>
          <div className="mt-6 max-w-3xl">
            <SkeletonText lines={3} />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="border border-border bg-white/40">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-border px-6 py-6 last:border-b-0"
                >
                  <SkeletonLine width="60%" height="1.25rem" />
                  <div className="mt-3">
                    <SkeletonText lines={2} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-border bg-white/40 p-6">
              <div className="aspect-[2/3] w-full animate-pulse rounded-sm bg-cream-dark" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
