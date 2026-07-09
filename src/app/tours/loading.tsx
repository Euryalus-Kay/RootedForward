/* Skeleton for /tours. Mirrors the banner, intro, and the two big
   content blocks (online exhibit card, in-person tour) so the page
   does not jump when the real content streams in. */

export default function ToursLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-cream">
      {/* Banner */}
      <section className="relative bg-forest/80 pt-16 pb-12 md:pb-16">
        <div className="flex items-center justify-center pt-12 md:pt-16">
          <div className="h-12 w-40 rounded-sm bg-cream/20" />
        </div>
      </section>

      {/* Intro */}
      <section className="pt-14 md:pt-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-4 w-3/4 rounded bg-cream-dark" />
          <div className="mt-3 h-4 w-2/3 rounded bg-cream-dark" />
          <div className="mt-3 h-4 w-1/2 rounded bg-cream-dark" />
        </div>
      </section>

      {/* Exhibit card */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 rounded-sm border border-border bg-cream-dark/40 p-8 md:grid-cols-2 md:p-12">
            <div>
              <div className="h-3 w-28 rounded bg-border" />
              <div className="mt-4 h-10 w-4/5 rounded bg-border" />
              <div className="mt-4 h-4 w-full rounded bg-border" />
              <div className="mt-2 h-4 w-5/6 rounded bg-border" />
              <div className="mt-8 h-12 w-48 rounded-sm bg-border" />
            </div>
            <div className="aspect-[1600/753] rounded-sm bg-border" />
          </div>
        </div>
      </section>

      {/* In-person block */}
      <section className="bg-cream-dark/60 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-10 w-72 rounded bg-border" />
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="h-4 w-full rounded bg-border" />
              <div className="mt-2 h-4 w-5/6 rounded bg-border" />
              <div className="mt-2 h-4 w-2/3 rounded bg-border" />
            </div>
            <div className="h-64 rounded-sm border border-border bg-cream" />
          </div>
        </div>
      </section>
    </div>
  );
}
