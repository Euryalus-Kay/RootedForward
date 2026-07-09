import { SkeletonLine, SkeletonText } from "@/components/ui/Skeleton";

/* Skeleton for /podcasts. Mirrors the live layout (forest banner,
   narrow intro column, one embed-sized block) so nothing jumps when
   the real page streams in. */

export default function PodcastsLoading() {
  return (
    <>
      {/* Banner */}
      <section className="relative bg-forest/80 pt-16 pb-12 md:pb-16">
        <div className="flex items-center justify-center pt-12 md:pt-16">
          <div className="h-12 w-52 animate-pulse rounded-sm bg-cream/20" />
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream pb-8 pt-12 md:pt-16">
        <div className="mx-auto max-w-3xl px-6">
          <SkeletonLine width="4rem" height="0.75rem" />
          <div className="mt-6 max-w-[60ch]">
            <SkeletonText lines={3} />
          </div>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* Player area */}
      <section className="bg-cream pb-20 pt-8 md:pb-28">
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
