/* Skeleton for /tours. Mirrors the opener with its phone, the feature
   grid, and the tour card so the page does not jump when the real
   content streams in. */

export default function ToursLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-cream">
      {/* Opener */}
      <section className="border-b border-border pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">
              <div className="h-3 w-16 rounded bg-cream-dark" />
              <div className="mt-5 h-12 w-4/5 max-w-2xl rounded bg-cream-dark" />
              <div className="mt-7 h-4 w-full max-w-xl rounded bg-cream-dark" />
              <div className="mt-3 h-4 w-5/6 max-w-lg rounded bg-cream-dark" />
              <div className="mt-3 h-4 w-2/3 max-w-md rounded bg-cream-dark" />
              <div className="mt-9 h-16 w-60 rounded-sm bg-cream-dark" />
            </div>
            <div className="md:col-span-5">
              <div className="mx-auto aspect-[1320/2868] max-w-[15rem] rounded-[2rem] bg-cream-dark md:max-w-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Screens, then the feature grid */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 sm:gap-7">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[1320/2868] rounded-[2rem] bg-cream-dark" />
            ))}
          </div>
          <div className="mt-20 h-3 w-20 rounded bg-cream-dark" />
          <div className="mt-5 h-10 w-3/5 max-w-xl rounded bg-cream-dark" />
          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-10 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="h-11 w-11 rounded-full bg-cream-dark" />
                <div className="mt-4 h-7 w-2/3 rounded bg-cream-dark" />
                <div className="mt-4 h-4 w-full rounded bg-cream-dark" />
                <div className="mt-2 h-4 w-4/5 rounded bg-cream-dark" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour card */}
      <section className="border-t border-border bg-cream-dark py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="h-3 w-20 rounded bg-border" />
          <div className="mt-5 h-10 w-2/3 max-w-lg rounded bg-border" />
          <div className="mt-12 grid grid-cols-1 gap-y-8 border-t border-border pt-10 md:grid-cols-12 md:gap-x-14">
            <div className="md:col-span-5">
              <div className="aspect-[1400/1147] rounded-sm bg-cream" />
            </div>
            <div className="md:col-span-7">
              <div className="h-6 w-28 rounded-sm bg-cream" />
              <div className="mt-5 h-10 w-3/5 rounded bg-cream" />
              <div className="mt-5 h-4 w-full rounded bg-cream" />
              <div className="mt-2 h-4 w-5/6 rounded bg-cream" />
              <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-cream" />
                ))}
              </div>
              <div className="mt-8 h-16 w-56 rounded-sm bg-cream" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
