import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

/* Reusable photo placeholder for sections without real images yet */
function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative h-full min-h-[300px] w-full bg-cream-dark md:min-h-0">
      <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`p-${label}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1A1A1A" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${label})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-body text-xs uppercase tracking-widest text-warm-gray-light">
          {label}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO — full screen photo with giant title
          ============================================================ */}
      <section className="relative h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        />
        <div className="absolute inset-0 bg-ink/50" />

        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <h1 className="text-center font-display text-[4rem] leading-[0.85] tracking-tight text-white sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] drop-shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            Rooted
            <br />
            Forward
          </h1>
        </div>

        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="font-body text-xs uppercase tracking-widest text-white/50">
              Scroll
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 animate-bounce text-white/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* ============================================================
          MISSION — centered, clean
          ============================================================ */}
      <section className="bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-display text-3xl leading-relaxed text-cream md:text-4xl lg:text-5xl lg:leading-snug">
            A youth-led nonprofit in Chicago tracing what redlining, urban
            renewal, and highway construction did to the neighborhoods people
            live in today. We organize the response through education, policy,
            and research.
          </p>
          <Link
            href="/about"
            className="mt-10 inline-flex items-center font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-light"
          >
            About Us &rarr;
          </Link>
        </div>
      </section>

      {/* ============================================================
          WALKING TOURS — photo left, text right
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <PhotoPlaceholder label="Tour photo" />
        </div>
        <div className="order-1 flex flex-col justify-center bg-cream px-6 py-16 sm:px-10 md:order-2 md:px-16 md:py-24">
          <h2 className="font-display text-4xl text-forest md:text-5xl">
            Walking Tours
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/70 md:text-lg">
            Self-guided stops across Chicago&rsquo;s South and West sides.
            Each one pairs a specific location with the policy decision that
            shaped it. Redlining boundaries you can still see in the
            infrastructure. Urban renewal demolitions. Highway routes drawn
            through the middle of Black neighborhoods.
          </p>
          <Link
            href="/tours"
            className="mt-8 inline-flex w-fit items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Explore Tours
          </Link>
        </div>
      </section>

      {/* ============================================================
          PODCAST — text left, photo right
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-forest px-6 py-16 sm:px-10 md:px-16 md:py-24">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            The Podcast
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-cream/70 md:text-lg">
            Conversations with historians, lifelong residents, urban planners,
            and organizers about the places our tours visit. The research behind
            each stop, told by the people who lived it and the people still
            fighting over it.
          </p>
          <Link
            href="/podcasts"
            className="mt-8 inline-flex w-fit items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Listen Now
          </Link>
        </div>
        <div>
          <PhotoPlaceholder label="Podcast photo" />
        </div>
      </section>

      {/* ============================================================
          POLICY — photo left, text right
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <PhotoPlaceholder label="Policy photo" />
        </div>
        <div className="order-1 flex flex-col justify-center bg-cream px-6 py-16 sm:px-10 md:order-2 md:px-16 md:py-24">
          <h2 className="font-display text-4xl text-forest md:text-5xl">
            Policy Work
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/70 md:text-lg">
            Active campaigns you can sign onto, tools for drafting public
            comments and policy proposals, and a channel for residents to
            submit their own ideas. Once you understand how these patterns
            work, the next step is changing them.
          </p>
          <Link
            href="/policy"
            className="mt-8 inline-flex w-fit items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            View Policy
          </Link>
        </div>
      </section>

      {/* ============================================================
          FEATURED STOP — full width dark section
          ============================================================ */}
      <section className="bg-ink py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray-light">
            Featured Stop
          </p>
          <h2 className="mt-3 font-display text-3xl text-cream md:text-5xl">
            The Redlining Boundary at Bronzeville
          </h2>
          <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-cream/65 md:text-lg">
            Stand at the corner where the Home Owners&rsquo; Loan Corporation
            drew a red line in 1938 and you can still see it today. Not on a
            map, but in the built environment. North of the line: maintained
            sidewalks, mature trees, single-family homes. South of the line:
            disinvestment written into every vacant lot.
          </p>
          <Link
            href="/tours/chicago/redlining-boundary-bronzeville"
            className="mt-8 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            View This Stop
          </Link>
        </div>
      </section>

      {/* ============================================================
          CTA
          ============================================================ */}
      <section className="bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Get Involved
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We are looking for young researchers, storytellers, tour guides,
            and people who want to do the work. If this matters to you, we
            need you.
          </p>
          <Link
            href="/get-involved"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
