/* ------------------------------------------------------------------ */
/*  /initiatives                                                       */
/*                                                                     */
/*  Added October 18, 2026 at the owner's request. One box for each    */
/*  thing we have put in front of the public with a partner, so a      */
/*  school, a museum or a funder can see the record in one place.      */
/*  The two exhibits get a collage; the rest get one picture each.     */
/*                                                                     */
/*  Second pass the same day, on his notes. Partner marks on white     */
/*  tiles instead of names, the museum's collage cut to two photos     */
/*  and its mark, the JASC panels marked as ongoing, and the status    */
/*  pills (which read as generated) replaced with a plain status line  */
/*  under each title, the way a museum wall label runs and the way     */
/*  /about marks its cities. Then a round of screenshot review: the    */
/*  boxes split side by side only from lg, since at md the columns     */
/*  were too narrow for the titles, and the mock Community Voices      */
/*  flyer gave way to the real outreach poster. A second round took    */
/*  the status lines out of tracked caps (the owner retired that       */
/*  label style site-wide on July 26, 2026), dropped the "Partners"    */
/*  label and the header watermark, and sized the app phones by the    */
/*  panel's height so they fill it at every width.                     */
/*                                                                     */
/*  The words and photographs live in src/lib/initiatives.ts. Same     */
/*  voice rules as the rest of the site. No em-dashes, no colons in    */
/*  sentences or headings, no triads, captions say what is pictured.   */
/*  Nothing here may claim an event that did not happen.               */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import AppStoreButton from "@/components/app/AppStoreButton";
import Collage from "@/components/initiatives/Collage";
import { APP } from "@/lib/app-store";
import {
  COMMUNITY_VOICES_EVENTS,
  FEATURED,
  GLESSNER_CREDIT,
  PARTNERS,
  PHOTOS,
  type InitiativeLink,
} from "@/lib/initiatives";

export const metadata: Metadata = {
  title: "Initiatives | Rooted Forward",
  description:
    "Exhibits and programs Rooted Forward runs with museums and community organizations, including the Chicago Maritime Museum, the Japanese American Service Committee, and Glessner House.",
};

/* ---- Small pieces ----------------------------------------------- */

/** The status line under a title, plain and in sentence case, the way
 *  a museum wall label gives its date under the title and the maker.
 *  Not tracked caps, which the owner retired site-wide in July 2026. */
function Status({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`font-body text-sm font-medium text-ink/70 ${className}`}>{children}</p>;
}

function ArrowLink({ link }: { link: InitiativeLink }) {
  /* inline, so if a label ever wraps the arrow stays on its last word */
  const cls =
    "group inline font-body text-sm font-semibold uppercase leading-snug tracking-widest text-rust transition-colors hover:text-rust-dark";
  const arrow = (
    <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
      {link.external ? "↗" : "→"}
    </span>
  );
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {link.label} {arrow}
    </a>
  ) : (
    <Link href={link.href} className={cls}>
      {link.label} {arrow}
    </Link>
  );
}

/* The three smaller boxes share one frame, so their titles, text and
   footers line up across the row. */
function Card({
  id,
  media,
  status,
  title,
  children,
  footer,
}: {
  id: string;
  media: React.ReactNode;
  status: string;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <article id={id} className="flex scroll-mt-24 flex-col overflow-hidden rounded-sm border border-border bg-cream">
      <div className="relative aspect-[3/2] overflow-hidden">{media}</div>
      <div className="flex flex-1 flex-col p-7 sm:p-10 lg:p-7">
        <h2 className="text-balance font-display text-2xl leading-tight text-forest lg:text-[1.375rem] xl:text-2xl">{title}</h2>
        <Status className="mt-2">{status}</Status>
        <div className="mt-4 max-w-[48ch] font-body text-base leading-relaxed text-ink/75">{children}</div>
      </div>
      {/* side by side, tall enough for the App Store button so the three
          rules line up; stacked, only as tall as its content */}
      <div className="mt-auto flex items-center border-t border-border px-7 py-5 sm:px-10 lg:min-h-[6rem] lg:px-7 lg:py-4">{footer}</div>
    </article>
  );
}

export default function InitiativesPage() {
  return (
    <PageTransition>
      {/* ============================================================
          HEADER
          The full room at JASC behind the title under a cream wash,
          the same treatment the home banner gives the 1940 map, then
          the partners' own marks. A gallery photo, a pale map and a
          plain cream band were tried here after it; the owner asked
          for this one back (October 18, 2026). The same photo also
          sits in the JASC box below, which he asked for too.
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={PHOTOS.jascCrowd.src}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[50%_42%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/[0.93] to-cream/80 md:via-cream/85 md:to-cream/35" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:pb-20 md:pt-24">
          <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-tight text-forest sm:text-7xl md:text-8xl">
            Initiatives
          </h1>
          <p className="mt-7 max-w-[30ch] text-balance font-display text-2xl leading-[1.25] tracking-tight text-ink sm:text-3xl">
            Exhibits and programs we run with museums and community
            organizations.
          </p>

          {/* The label is the owner's ask (October 18, 2026), set in the
              display serif rather than tracked caps. */}
          <h2 className="mt-14 font-display text-2xl leading-tight text-forest">Partners</h2>
          <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-4 md:max-w-3xl">
            {PARTNERS.map((p) => (
              <li key={p.name}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-20 items-center justify-center rounded-md border border-border bg-white px-3 transition-colors hover:border-ink/30 sm:h-28 sm:px-6"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.logo} alt={p.name} className={`w-auto max-w-full object-contain ${p.logoClass}`} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
          THE TWO EXHIBITS
          Collage on one side, words on the other, alternating.
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:gap-14">
          {FEATURED.map((item, index) => {
            const flip = index % 2 === 1;
            return (
              <article
                key={item.id}
                id={item.id}
                className="grid scroll-mt-24 grid-cols-1 overflow-hidden rounded-sm border border-border bg-cream lg:grid-cols-12"
              >
                <div className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
                  <Collage cells={item.cells} layout={item.layout} />
                </div>

                <div className={`flex flex-col justify-center px-7 py-9 sm:p-10 lg:col-span-5 lg:p-12 ${flip ? "lg:order-1" : ""}`}>
                  <h2 className="text-balance font-display text-3xl leading-tight text-forest md:text-4xl lg:text-3xl xl:text-4xl">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-balance font-display text-lg italic text-ink/60">{item.partner}</p>
                  <Status className="mt-2">{item.status}</Status>

                  <div className="mt-6 flex flex-col gap-4">
                    {item.body.map((para, i) => (
                      <p key={i} className="max-w-[48ch] font-body text-base leading-relaxed text-ink/75">
                        {para}
                      </p>
                    ))}
                  </div>

                  {item.links.length > 0 && (
                    <div className="mt-8 flex flex-col items-start gap-3">
                      {item.links.map((link) => (
                        <ArrowLink key={link.href} link={link} />
                      ))}
                    </div>
                  )}

                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          THREE MORE
          Glessner House (coming), the app, Community Voices.
          ============================================================ */}
      <section className="border-t border-border bg-cream-dark/35 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 md:gap-14 lg:grid-cols-3 lg:gap-8">
          <Card
            id="glessner-house"
            status="February 2027"
            title="Black History Month at Glessner House"
            media={
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS.glessner.src}
                  srcSet={`${PHOTOS.glessner.small} 800w, ${PHOTOS.glessner.src} 1600w`}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  alt={PHOTOS.glessner.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: PHOTOS.glessner.focus }}
                />
              </>
            }
            footer={<ArrowLink link={{ label: "Glessner House", href: "https://www.glessnerhouse.org/", external: true }} />}
          >
            <p>
              We are building an exhibit with the museum, which is housed in
              H.&nbsp;H.&nbsp;Richardson&rsquo;s 1887 granite house on Prairie
              Avenue.
            </p>
            <p className="mt-4 font-body text-[11px] leading-snug text-ink/55">{GLESSNER_CREDIT}</p>
          </Card>

          <Card
            id="app"
            status="Free on iPhone"
            title="The Rooted Forward app"
            media={
              /* Sized by the panel's height, so the phones fill it at
                 every width and crop at the bottom edge. */
              <div className="flex h-full items-start justify-center gap-5 bg-forest px-6 pt-7">
                {[APP.screenshots[1], APP.screenshots[2]].map((shot) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={shot.src}
                    src={shot.src}
                    alt={shot.alt}
                    loading="lazy"
                    className="h-[112%] w-auto max-w-none rounded-t-[20px] border-4 border-b-0 border-[#0f0f0f]"
                  />
                ))}
              </div>
            }
            footer={<AppStoreButton tone="ink" size="sm" withNote={false} />}
          >
            The app plays Walk Hyde Park, our self-guided audio tour. It has
            13 stops over about four miles, starting at Paul Cornell&rsquo;s
            stone at 53rd Street and South Shore Drive.
          </Card>

          <Card
            id="community-voices"
            status="Ongoing"
            title="Community Voices"
            media={
              /* The real poster that stands beside the outreach table
                 (print/poster, October 2026), cut from its map to its foot
                 so the code and address show whole, filling the frame
                 like the photos beside it. A drawn flyer sat here first; it
                 stood for a print piece that does not exist. */
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PHOTOS.outreachPoster.src}
                  srcSet={`${PHOTOS.outreachPoster.small} 855w, ${PHOTOS.outreachPoster.src} 1710w`}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  alt={PHOTOS.outreachPoster.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: PHOTOS.outreachPoster.focus }}
                />
              </>
            }
            footer={<ArrowLink link={{ label: "Help us run one", href: "/get-involved" }} />}
          >
            <p>
              We set up at farmers&rsquo; markets and community events to
              interview residents about their neighborhoods. We also hand out
              our printed materials and show people how to take a tour in the
              app.
            </p>
            {COMMUNITY_VOICES_EVENTS.length > 0 && (
              <ul className="mt-5 divide-y divide-border border-y border-border">
                {COMMUNITY_VOICES_EVENTS.map((ev) => (
                  <li key={ev.date + ev.place} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="font-display text-base text-ink">{ev.name}</span>
                    <span className="text-right font-body text-xs text-ink/60">
                      {new Date(ev.date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <br />
                      {ev.place}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      {/* ============================================================
          THE ASK. The brochure's back panel, in the owner's words
          (October 2026).
          ============================================================ */}
      <section className="bg-ink py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <h2 className="font-display text-4xl leading-tight text-cream md:text-5xl">
                Partner with us
              </h2>
              <p className="mt-5 max-w-[52ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
                We want to partner with people and organizations who can help
                us bring this message to more people. If you or your
                organization would like our materials, we are happy to supply
                them.
              </p>
            </div>
            <div className="lg:col-span-5 lg:text-right">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
