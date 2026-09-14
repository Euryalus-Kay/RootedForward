import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import {
  EXHIBIT,
  EXHIBIT_PHOTO,
  LOOK_CLOSER_FEATURE,
  MAP_CREDIT,
  MUSEUM,
  WEB_COPY,
} from "@/lib/look-closer";

/* ------------------------------------------------------------------ */
/*  /look-closer                                                       */
/*                                                                     */
/*  The words for the exhibit on the Chicago Maritime Museum's wall:   */
/*  what it is, who made it, where to see it, and the way into the     */
/*  map. The map itself is the kiosk software the museum runs, served  */
/*  at /look-closer/map (public/kiosk/map-phone.html, built by         */
/*  scripts/build-kiosk-phone.mjs from the wall's own build), so this  */
/*  page carries no viewer of its own. The wording is the owner's.     */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: `${EXHIBIT.title} | Rooted Forward`,
  description: WEB_COPY.lede,
  openGraph: {
    title: EXHIBIT.title,
    description: WEB_COPY.lede,
    images: [{ url: LOOK_CLOSER_FEATURE.image, alt: LOOK_CLOSER_FEATURE.imageAlt }],
  },
};

const MAP_PATH = "/look-closer/map";

export default function LookCloserPage() {
  return (
    <PageTransition>
      <section className="bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12 md:pb-24 md:pt-16">
          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-14">
            <div className="md:col-span-7">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.svg" alt="" className="h-9 w-9 rounded-full" />
                  <span className="font-display text-lg text-warm-gray" aria-hidden="true">
                    &amp;
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MUSEUM.logo} alt="" className="h-9 w-9 rounded-full border border-ink/15" />
                </div>
                <p className="font-body text-sm font-semibold text-ink">{WEB_COPY.lockup}</p>
                <span
                  className="rounded-sm border px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: MUSEUM.blue, borderColor: MUSEUM.blue }}
                >
                  {LOOK_CLOSER_FEATURE.note}
                </span>
              </div>

              <h1 className="mt-6 font-display text-5xl font-semibold leading-none tracking-tight text-forest md:text-6xl">
                {EXHIBIT.title}
              </h1>
              <p className="mt-5 max-w-[34ch] font-display text-xl leading-snug text-ink md:text-2xl">
                {WEB_COPY.lede}
              </p>
              {WEB_COPY.body.map((para) => (
                <p key={para} className="mt-4 max-w-[58ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                  {para}
                </p>
              ))}

              {/* The door to the map. The kiosk is a 16:9 stage built
                  for a big screen; on the site a phone is turned away to
                  the app, and the map page says so itself. */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link
                  href={MAP_PATH}
                  className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Open the map
                </Link>
                <p className="max-w-[30ch] font-body text-sm leading-snug text-ink/70">
                  Built for a desktop screen. On a phone, open it in the Rooted Forward app.
                </p>
              </div>

              <div className="mt-10 border border-border bg-paper p-5" style={{ borderTopColor: MUSEUM.blue, borderTopWidth: 4 }}>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MUSEUM.logo} alt="" className="h-11 w-11 rounded-full border border-ink/15" />
                  <div>
                    <p className="font-display text-xl text-forest">See it in person</p>
                    <p className="font-body text-sm text-ink/75">On the wall at the {MUSEUM.name}</p>
                  </div>
                </div>
                <p className="mt-4 font-body text-base leading-relaxed text-ink">
                  {MUSEUM.address}, {MUSEUM.building.charAt(0).toLowerCase() + MUSEUM.building.slice(1)}.
                </p>
                <p className="mt-1 font-body text-base leading-relaxed text-ink">{MUSEUM.hours}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                  <a
                    href={MUSEUM.visitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group font-body text-sm font-semibold uppercase tracking-widest transition-colors hover:text-forest"
                    style={{ color: MUSEUM.blue }}
                  >
                    Plan a visit{" "}
                    <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </a>
                  <a
                    href={MUSEUM.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm font-semibold uppercase tracking-widest text-ink/70 transition-colors hover:text-forest"
                  >
                    The museum
                  </a>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <Link href={MAP_PATH} className="group block" aria-label="Open the map">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOOK_CLOSER_FEATURE.image}
                  alt={LOOK_CLOSER_FEATURE.imageAlt}
                  className="w-full border border-border bg-white p-1.5 shadow-[6px_6px_0_0_rgba(26,26,26,0.08)] transition-transform group-hover:-translate-y-0.5"
                />
              </Link>
              <p className="mt-2 font-body text-[11px] leading-snug text-ink/60">
                {MAP_CREDIT.title}. {MAP_CREDIT.makers}. {MAP_CREDIT.publisher}. {MAP_CREDIT.holder}.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EXHIBIT_PHOTO.src}
                srcSet={`${EXHIBIT_PHOTO.small} 700w, ${EXHIBIT_PHOTO.src} 1200w`}
                sizes="(min-width: 768px) 40vw, 100vw"
                alt={EXHIBIT_PHOTO.alt}
                loading="lazy"
                className="mt-8 w-full border border-border bg-white p-1.5 shadow-[6px_6px_0_0_rgba(26,26,26,0.08)]"
              />
              <p className="mt-2 font-body text-[11px] leading-snug text-ink/60">{EXHIBIT_PHOTO.caption}</p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
