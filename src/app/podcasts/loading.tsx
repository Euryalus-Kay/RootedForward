import { SkeletonLine, SkeletonText } from "@/components/ui/Skeleton";

/* Skeleton for /podcasts. Mirrors the live layout (typographic
   opener, one embed-sized block) so nothing jumps when the real page
   streams in. */

export default function PodcastsLoading() {
  return (
    <>
      {/* Opener */}
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-11 w-4/5 animate-pulse rounded bg-cream-dark" />
          <div className="mt-6 max-w-[55ch]">
            <SkeletonText lines={3} />
          </div>
        </div>
      </section>

      {/* Player area */}
      <section className="bg-cream pb-20 pt-12 md:pb-28 md:pt-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-[352px] w-full animate-pulse rounded-lg bg-cream-dark" />
          <div className="mt-6">
            <SkeletonLine width="50%" height="0.875rem" />
          </div>
        </div>
      </section>
    </>
  );
}
