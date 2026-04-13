import {
  SkeletonLine,
  SkeletonText,
} from "@/components/ui/Skeleton";

export default function PodcastsLoading() {
  return (
    <>
      {/* Header section */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <SkeletonLine width="5rem" height="0.75rem" />
          <div className="mt-4">
            <SkeletonLine width="70%" height="2.5rem" />
          </div>
          <hr className="mt-8 border-border" />
          <div className="mt-8 max-w-2xl">
            <SkeletonText lines={3} />
          </div>
        </div>
      </section>

      {/* Episode cards */}
      <section className="bg-cream pb-24 md:pb-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm border border-border bg-cream-dark p-8 md:p-10 lg:p-12"
              >
                <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                  {/* Episode number */}
                  <div className="flex-shrink-0">
                    <SkeletonLine width="4.5rem" height="4rem" />
                  </div>

                  {/* Episode content */}
                  <div className="flex-1">
                    <SkeletonLine width="75%" height="1.5rem" />
                    <div className="mt-2">
                      <SkeletonLine width="40%" height="0.875rem" />
                    </div>
                    <div className="mt-1">
                      <SkeletonLine width="30%" height="0.75rem" />
                    </div>
                    <div className="mt-4">
                      <SkeletonText lines={2} />
                    </div>

                    {/* Player area */}
                    <div className="mt-6">
                      <div className="h-[152px] w-full animate-pulse rounded-sm bg-cream" />
                    </div>
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
