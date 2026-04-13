import {
  SkeletonLine,
  SkeletonText,
} from "@/components/ui/Skeleton";

export default function StopDetailLoading() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <SkeletonLine width="3rem" height="0.75rem" />
          <SkeletonLine width="0.5rem" height="0.75rem" />
          <SkeletonLine width="4rem" height="0.75rem" />
          <SkeletonLine width="0.5rem" height="0.75rem" />
          <SkeletonLine width="5rem" height="0.75rem" />
          <SkeletonLine width="0.5rem" height="0.75rem" />
          <SkeletonLine width="8rem" height="0.75rem" />
        </div>

        {/* Title */}
        <div className="mt-8">
          <SkeletonLine width="80%" height="2.5rem" />
        </div>

        {/* Meta line */}
        <div className="mt-4 flex items-center gap-4">
          <SkeletonLine width="5rem" height="0.875rem" />
          <SkeletonLine width="6rem" height="0.875rem" />
        </div>

        {/* Video area skeleton */}
        <div className="mt-8">
          <div className="aspect-video w-full animate-pulse rounded-lg bg-cream-dark" />
        </div>

        {/* Description paragraphs */}
        <div className="mt-10 space-y-6">
          <SkeletonText lines={4} />
          <SkeletonText lines={3} />
          <SkeletonText lines={4} />
        </div>

        {/* Sources section */}
        <div className="mt-12 rounded-lg border border-border p-6">
          <SkeletonLine width="5rem" height="1.125rem" />
          <div className="mt-4 space-y-3">
            <SkeletonLine width="85%" height="0.75rem" />
            <SkeletonLine width="70%" height="0.75rem" />
            <SkeletonLine width="60%" height="0.75rem" />
          </div>
        </div>
      </div>
    </section>
  );
}
