/* ------------------------------------------------------------------ */
/*  /tours                                                             */
/*                                                                     */
/*  Rebuilt July 2026. This page no longer hosts a tour of its own.    */
/*  It explains what the tours are, lists the routes that are          */
/*  finished, and sends people to the iPhone app. The in-browser       */
/*  Hyde Park player moved to /tours/hyde-park-walk and stays linked    */
/*  as the fallback for anyone without an iPhone.                      */
/*                                                                     */
/*  Two things are deliberately kept in one place each, so the page    */
/*  is cheap to update later.                                          */
/*    - The App Store link lives in src/lib/app-store.ts. Fill it in   */
/*      and every button here becomes a live link.                     */
/*    - The list of tours lives in src/lib/tours/catalog.ts. Add an    */
/*      entry and it shows up in the list below.                       */
/*                                                                     */
/*  Voice rules from the owner apply. No aphorisms, no balanced-pair   */
/*  sentences, no numbered rows, no triads. Say the concrete thing.    */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import AppStoreButton from "@/components/app/AppStoreButton";
import { APP } from "@/lib/app-store";
import { TOUR_CATALOG } from "@/lib/tours/catalog";

export const metadata: Metadata = {
  title: "Tours | Rooted Forward",
  description:
    "Free self-guided audio tours of the neighborhoods we research, in the Rooted Forward iPhone app. Walk Hyde Park in Chicago is the first route, thirteen stops and about four miles.",
};

/* ------------------------------------------------------------------ */
/*  Line icons, same heroicons-outline vocabulary as the home page.    */
/* ------------------------------------------------------------------ */

const ICON = "h-6 w-6";

function SpeakerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function SignalSlashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 .53 4.575M10.61 2.844a9.75 9.75 0 0 1 8.548 8.549M3 3l18 18M6.364 6.364a9.75 9.75 0 0 0 1.79 11.272" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: SpeakerIcon,
    title: "Narration at every stop",
    body: "You stand where it happened and hear what happened there. The whole script is printed under the player, so you can read it instead if you would rather not use headphones.",
  },
  {
    icon: MapPinIcon,
    title: "A map that knows where you are",
    body: "The route is drawn over the 1929 government survey of the neighborhood. Turn on location and your own dot appears on it, along with walking directions between stops.",
  },
  {
    icon: PhotoIcon,
    title: "The photographs, credited",
    body: "Archival pictures of each corner sit next to the same view today, and every source is named on the stop it belongs to.",
  },
  {
    icon: SignalSlashIcon,
    title: "Works with no signal",
    body: "Audio, photographs, and the map are all on the phone once the app is installed, so a dead zone or a dead data plan does not end the walk.",
  },
  {
    icon: LockIcon,
    title: "Free, with no account",
    body: "Nothing to sign up for, no ads, and no tracking. If you allow location, it is used to draw your dot and never leaves the phone.",
  },
];

/* A phone shell for the app screenshots, drawn in the site palette. */
function Phone({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-ink/15 bg-ink p-1.5 shadow-[0_18px_40px_-18px_rgba(27,58,45,0.45)] sm:rounded-[2rem] sm:p-2 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block w-full rounded-[1.1rem] object-cover sm:rounded-[1.5rem]"
      />
    </div>
  );
}

export default function ToursPage() {
  return (
    <PageTransition>
      {/* ============================================================
          OPENER
          What the tours are, and the app button, next to the app
          itself. The 1940 HOLC map washes in behind the type.
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-border bg-cream">
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-7">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                Tours
              </p>
              <h1 className="mt-4 max-w-[15ch] font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
                Take the tour on your phone.
              </h1>
              <p className="mt-6 max-w-[52ch] font-body text-lg leading-relaxed text-ink/80">
                Our student researchers take one neighborhood at a time and
                work out how race shaped it, out of the deeds, the appraisal
                maps, and the plans the city drew. What they find becomes a
                free audio tour you can walk at your own pace, whenever you
                want.
              </p>
              <p className="mt-4 max-w-[52ch] font-body text-lg leading-relaxed text-ink/80">
                The tours live in our iPhone app. Hyde Park in Chicago is the
                first route finished, and more neighborhoods are being
                researched now.
              </p>

              <div className="mt-9 flex flex-wrap items-start gap-x-10 gap-y-5">
                <AppStoreButton tone="rust" />
                <a
                  href="#tours"
                  className="group mt-2 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
                >
                  See the tours{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
              </div>
            </div>

            {/* The app itself, on a panel of the 1940 HOLC map so the
                phone has something to sit against. */}
            <div className="md:col-span-5">
              <div className="relative overflow-hidden rounded-sm border border-border bg-cream-dark px-8 py-10 md:px-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/media/site/holc-chicago-1940.jpg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] mix-blend-multiply"
                />
                <div className="relative mx-auto max-w-[14rem]">
                  <Phone
                    src={APP.screenshots[1].src}
                    alt={APP.screenshots[1].alt}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT YOU GET
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            The app
          </p>
          <h2 className="mt-4 max-w-[18ch] font-display text-3xl leading-tight text-forest md:text-4xl">
            What you get when you download it
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-10 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-rust/45 text-rust">
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-display text-2xl text-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/75">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* The rest of the screens. A swipeable strip on phones, a
              row of three once there is room for one. */}
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-7 sm:overflow-visible sm:px-0 sm:pb-0">
              {[APP.screenshots[0], APP.screenshots[2], APP.screenshots[3]].map(
                (shot) => (
                  <div key={shot.src} className="w-44 shrink-0 snap-start sm:w-auto">
                    <Phone src={shot.src} alt={shot.alt} />
                  </div>
                )
              )}
            </div>
            <p className="mt-4 font-body text-[11px] text-ink/55 sm:text-center">
              Screens from the Hyde Park tour in the app.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE TOURS
          Driven by TOUR_CATALOG. One entry today.
          ============================================================ */}
      <section id="tours" className="scroll-mt-16 border-t border-border bg-cream-dark py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            The routes
          </p>
          <h2 className="mt-4 font-display text-3xl leading-tight text-forest md:text-4xl">
            What you can walk right now
          </h2>

          <div className="mt-12 flex flex-col gap-14">
            {TOUR_CATALOG.map((tour) => (
              <article
                key={tour.slug}
                className="grid grid-cols-1 gap-y-8 border-t border-border pt-10 md:grid-cols-12 md:gap-x-14"
              >
                <div className="md:col-span-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tour.image.src}
                    alt={tour.image.alt}
                    loading="lazy"
                    className="w-full rounded-sm border border-border object-cover"
                  />
                  <p className="mt-2 font-body text-[11px] leading-snug text-ink/60">
                    {tour.image.credit}
                  </p>
                </div>

                <div className="md:col-span-7">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center rounded-sm bg-forest px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-cream">
                      In the app
                    </span>
                    <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/55">
                      {tour.city}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-3xl text-ink md:text-4xl">
                    {tour.title}
                  </h3>
                  <p className="mt-4 max-w-[54ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                    {tour.blurb}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                    {tour.facts.map((fact) => (
                      <div key={fact.label} className="bg-cream px-4 py-3">
                        <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-ink/55">
                          {fact.label}
                        </p>
                        <p className="mt-1 font-body text-sm font-semibold text-forest">
                          {fact.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <AppStoreButton tone="rust" withNote={false} />
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                    {tour.readHref && (
                      <Link
                        href={tour.readHref}
                        className="group font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                      >
                        {tour.readLabel ?? "Read it online"}{" "}
                        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                          &rarr;
                        </span>
                      </Link>
                    )}
                    {tour.browserHref && (
                      <Link
                        href={tour.browserHref}
                        className="group font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                      >
                        Walk it in your browser{" "}
                        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                          &rarr;
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* What is coming. Named cities only, no invented routes. */}
          <div className="mt-16 border-t border-border pt-10">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
              Next
            </p>
            <h3 className="mt-4 max-w-[20ch] font-display text-2xl leading-tight text-forest md:text-3xl">
              More neighborhoods are in the works
            </h3>
            <p className="mt-4 max-w-[58ch] font-body text-base leading-relaxed text-ink/75">
              Chicago is where we started and still where most of the work is.
              We have members in New York and Washington, DC digging through
              the records for their own neighborhoods now. A route goes in the
              app once the research behind it is finished and checked, so this
              list grows slowly on purpose.
            </p>
            <Link
              href="/get-involved"
              className="group mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
            >
              Help research the next one{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          IN PERSON
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                In person
              </p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-forest md:text-4xl">
                Or walk Hyde Park with a guide
              </h2>
              <p className="mt-5 max-w-[52ch] font-body text-base leading-relaxed text-ink/75">
                Our student researchers run the same route in person for small
                groups, about two hours, working from the documents the app is
                built on. You can ask them questions the recording cannot
                answer.
              </p>
              <a
                href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-10 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Book on Viator
              </a>
            </div>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/hyde-park-walk/cobb-hall-1900.jpg"
                alt="Cobb Lecture Hall about 1900, a long four-storey limestone Gothic block with steep gables and turrets, young trees along the sidewalk and a horse and buggy passing on the unpaved street"
                loading="lazy"
                className="w-full rounded-sm border border-border object-cover"
              />
              <p className="mt-2 font-body text-[11px] leading-snug text-ink/60">
                Cobb Lecture Hall about 1900, a stop on the walk. Detroit
                Publishing Company, Library of Congress Prints and Photographs
                Division. No known restrictions on publication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          DOWNLOAD
          The closer. One more App Store button, plus the fallback for
          anyone who is not on an iPhone.
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/app/app-icon.svg"
                alt=""
                aria-hidden="true"
                className="h-16 w-16 rounded-[14px] border border-cream/20"
              />
              <h2 className="mt-6 max-w-[16ch] font-display text-3xl leading-tight text-cream md:text-4xl">
                Download the app
              </h2>
              <p className="mt-5 max-w-[50ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
                It is free, and every tour we finish shows up in it. Get it
                before you leave the house, since the whole walk works without
                a signal.
              </p>
              <p className="mt-4 font-body text-sm text-cream/60">
                {APP.platform}, {APP.requires}. {APP.price}.
              </p>

              <div className="mt-8">
                <AppStoreButton tone="onDark" />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-sm border border-cream/20 p-6">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/60">
                  No iPhone
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-cream/75">
                  The Hyde Park walk runs in a browser too, with the same
                  audio, map, and photographs. It is not as good on the street,
                  but it is the whole tour.
                </p>
                <Link
                  href="/tours/hyde-park-walk"
                  className="group mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:text-rust"
                >
                  Open it in your browser{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
