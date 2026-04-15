import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import VolunteerForm from "@/components/forms/VolunteerForm";

export const metadata: Metadata = {
  title: "Get Involved | Rooted Forward",
  description:
    "Join a chapter, support a campaign, or bring our work to your community.",
};

export default function GetInvolvedPage() {
  return (
    <PageTransition>
      {/* Banner */}
      <section className="relative pt-16 pb-12 md:pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            Get Involved
          </h1>
        </div>
      </section>

      {/* Directory rows */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">

          {/* Row 1: For Students */}
          <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-12 md:gap-12 md:py-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Students
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Start or join a chapter
              </h2>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
                Chapters are where the work happens. Each one researches its
                city&rsquo;s history of inequity, builds neighborhood walking
                tours, films documentaries, and develops curriculum for local
                schools. We have chapters in Chicago, New York, Dallas, and
                San Francisco, and we help students launch new ones in other
                cities with templates, research kits, and direct mentorship
                through the first year.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/contact"
                  className="font-body text-sm font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  Join an existing chapter &rarr;
                </Link>
                <Link
                  href="/contact"
                  className="font-body text-sm font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  Start a chapter in your city &rarr;
                </Link>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Row 2: For Chicago Residents */}
          <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-12 md:gap-12 md:py-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Chicago
                <br />
                Residents
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Support an active campaign
              </h2>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
                Writing a public comment on an open campaign takes about ten
                minutes and puts your name into the official record on issues
                being decided right now. Signing onto collective letters adds
                your weight to coalitions pushing for specific legislative
                changes. Both are open to anyone.
              </p>
              <div className="mt-6">
                <Link
                  href="/policy"
                  className="font-body text-sm font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  View active campaigns &rarr;
                </Link>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Row 3: For Everyone */}
          <div className="grid grid-cols-1 gap-4 py-12 md:grid-cols-12 md:gap-12 md:py-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Everyone
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Show up for the community
              </h2>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
                Come to a walking tour, listen to the podcast, share a
                documentary with someone who would benefit from seeing it, or
                bring our curriculum to a teacher you know. Visibility for the
                people and neighborhoods we cover is part of what makes this
                work.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/tours"
                  className="font-body text-sm font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  Upcoming tours &rarr;
                </Link>
                <Link
                  href="/podcasts"
                  className="font-body text-sm font-semibold text-rust transition-colors hover:text-rust-dark"
                >
                  Listen to the podcast &rarr;
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Volunteer Form */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                Volunteer
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Sign up
              </h2>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
                Fill out the form and a chapter coordinator will reach out
                within a week. All backgrounds and experience levels welcome.
              </p>
              <div className="mt-8">
                <VolunteerForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-base leading-relaxed text-cream/65">
            Questions? Reach us at{" "}
            <a
              href="mailto:hello@rootedforward.org"
              className="text-cream underline decoration-cream/30 underline-offset-2 transition-colors hover:decoration-cream"
            >
              hello@rootedforward.org
            </a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
