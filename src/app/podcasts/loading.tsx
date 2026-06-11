import { SkeletonLine, SkeletonText } from "@/components/ui/Skeleton";

export default function PodcastsLoading() {
  return (
    <>
      {/* Banner silhouette */}
      <section className="relative min-h-[52vh] overflow-hidden bg-forest-deep md:min-h-[58vh]">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-7xl flex-col justify-end px-6 pt-24 pb-12 md:min-h-[58vh] md:pb-16 lg:px-8">
          <div className="h-3 w-40 animate-pulse rounded-md bg-cream/10" />
          <div className="mt-5 h-12 w-72 animate-pulse rounded-md bg-cream/10 md:h-16 md:w-96" />
          <div className="mt-6 h-4 w-full max-w-xl animate-pulse rounded-md bg-cream/10" />
          <div className="mt-10 border-t border-cream/15 pt-5 md:mt-12">
            <div className="h-3 w-56 animate-pulse rounded-md bg-cream/10" />
          </div>
        </div>
      </section>

      {/* Episode archive rows */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          {/* Section heading */}
          <SkeletonLine width="7rem" height="0.75rem" />
          <div className="mt-4">
            <SkeletonLine width="16rem" height="2.5rem" />
          </div>
          <div className="mt-6 max-w-xl">
            <SkeletonText lines={2} />
          </div>

          {/* Ledger rows */}
          <div className="mt-12 md:mt-16">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid gap-x-10 gap-y-5 border-t border-border py-10 md:grid-cols-[7rem_1fr] md:py-14"
              >
                <div className="hidden md:block">
                  <SkeletonLine width="5rem" height="4rem" />
                </div>
                <div>
                  <SkeletonLine width="14rem" height="0.75rem" />
                  <div className="mt-4">
                    <SkeletonLine width="70%" height="1.75rem" />
                  </div>
                  <div className="mt-4">
                    <SkeletonLine width="40%" height="0.75rem" />
                  </div>
                  <div className="mt-4 max-w-xl">
                    <SkeletonText lines={3} />
                  </div>
                  <div className="mt-7">
                    <SkeletonLine width="10rem" height="2.5rem" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
