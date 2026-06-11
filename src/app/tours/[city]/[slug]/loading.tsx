import { SkeletonLine, SkeletonText } from "@/components/ui/Skeleton";

export default function StopDetailLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Compact banner skeleton */}
      <section className="bg-forest-deep pt-20 pb-10 md:pt-24 md:pb-12">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="h-3 w-52 animate-pulse rounded-md bg-cream/10" />
          <div className="mt-5 h-10 w-3/4 max-w-2xl animate-pulse rounded-md bg-cream/10 md:h-14" />
          <div className="mt-10 h-px w-full bg-cream/15" />
          <div className="mt-5 flex gap-8">
            <div className="h-3 w-24 animate-pulse rounded-md bg-cream/10" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-cream/10" />
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-3">
            <SkeletonLine width="3rem" height="0.75rem" />
            <SkeletonLine width="0.5rem" height="0.75rem" />
            <SkeletonLine width="4rem" height="0.75rem" />
            <SkeletonLine width="0.5rem" height="0.75rem" />
            <SkeletonLine width="8rem" height="0.75rem" />
          </div>

          {/* Video area skeleton */}
          <div className="mt-10">
            <div className="aspect-video w-full animate-pulse rounded-sm bg-cream-dark" />
          </div>

          {/* Description paragraphs */}
          <div className="mt-10 space-y-6">
            <SkeletonText lines={4} />
            <SkeletonText lines={3} />
          </div>

          {/* Sources section */}
          <div className="mt-14 border-t border-border pt-10">
            <SkeletonLine width="5rem" height="0.75rem" />
            <div className="mt-6 space-y-3">
              <SkeletonLine width="85%" height="0.75rem" />
              <SkeletonLine width="70%" height="0.75rem" />
              <SkeletonLine width="60%" height="0.75rem" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
