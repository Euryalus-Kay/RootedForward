/* The city route redirects to /tours, so this skeleton only flashes
   while the redirect resolves. Mirror the tours index banner. */

export default function CityTourLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <section className="flex min-h-[52vh] flex-col justify-end bg-forest-deep md:min-h-[58vh]">
        <div className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8 md:pb-16">
          <div className="h-3 w-44 animate-pulse rounded-md bg-cream/10" />
          <div className="mt-5 h-12 w-72 animate-pulse rounded-md bg-cream/10 md:h-16 md:w-96" />
          <div className="mt-10 h-px w-full bg-cream/15" />
          <div className="mt-5 flex gap-8">
            <div className="h-3 w-16 animate-pulse rounded-md bg-cream/10" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-cream/10" />
          </div>
        </div>
      </section>
    </div>
  );
}
