/* Skeleton for /tours. Mirrors the typographic opener, the exhibit
   block, and the in-person tour block so the page does not jump when
   the real content streams in. */

export default function ToursLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-cream">
      {/* Opener */}
      <section className="border-b border-border pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-3 w-16 rounded bg-cream-dark" />
          <div className="mt-5 h-12 w-4/5 max-w-2xl rounded bg-cream-dark" />
          <div className="mt-7 h-4 w-3/4 max-w-xl rounded bg-cream-dark" />
          <div className="mt-3 h-4 w-2/3 max-w-lg rounded bg-cream-dark" />
          <div className="mt-10 h-3 w-24 rounded bg-cream-dark" />
        </div>
      </section>

      {/* Exhibit block */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <div className="h-3 w-28 rounded bg-cream-dark" />
              <div className="mt-4 h-10 w-4/5 rounded bg-cream-dark" />
              <div className="mt-4 h-4 w-full rounded bg-cream-dark" />
              <div className="mt-2 h-4 w-5/6 rounded bg-cream-dark" />
              <div className="mt-8 h-12 w-48 rounded-sm bg-cream-dark" />
            </div>
            <div className="aspect-[1600/753] rounded-sm bg-cream-dark" />
          </div>
        </div>
      </section>

      {/* In-person block */}
      <section className="border-t border-border bg-cream-dark/60 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-3 w-20 rounded bg-border" />
          <div className="mt-4 h-10 w-72 rounded bg-border" />
          <div className="mt-10 grid grid-cols-2 gap-px border border-border sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-cream" />
            ))}
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="h-4 w-full rounded bg-border" />
              <div className="mt-2 h-4 w-5/6 rounded bg-border" />
              <div className="mt-2 h-4 w-2/3 rounded bg-border" />
              <div className="mt-8 h-12 w-44 rounded-sm bg-border" />
            </div>
            <div className="aspect-[1400/1147] rounded-sm border border-border bg-cream" />
          </div>
        </div>
      </section>
    </div>
  );
}
