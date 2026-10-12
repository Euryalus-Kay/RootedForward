import Link from "next/link";
import { EXHIBIT, EXHIBIT_PHOTO, LOOK_CLOSER_FEATURE, MUSEUM, WEB_COPY } from "@/lib/look-closer";

/* ------------------------------------------------------------------ */
/*  The museum block on the home page.                                 */
/*                                                                     */
/*  The joint exhibit with the Chicago Maritime Museum: the 1931       */
/*  Turzak map on their wall in Bridgeport with a touch screen         */
/*  running /kiosk/map beside it, and the same guide open to any       */
/*  phone at /look-closer. The block is the museum's blue so it reads  */
/*  as theirs and ours together. The two marks above the title say     */
/*  the collaboration before it is read; the lede names both           */
/*  partners, so the marks carry no names of their own. The words are  */
/*  the owner's (September 13, 2026).                                  */
/*                                                                     */
/*  Thinned on October 12, 2026 at the owner's request (the block      */
/*  read as cluttered): gone are the "Now on view" tag, the names      */
/*  beside the marks, the photograph's caption, both paragraphs (he    */
/*  saw a first cut with one left and asked for less text still) and  */
/*  the address line, which /look-closer and the museum's own site     */
/*  carry. What remains is the title, the one line on the exhibit,    */
/*  and the two doors. The words still live in src/lib/look-closer.ts, */
/*  where /look-closer and the app's sheet read all of them. He was    */
/*  shown the two pictures side by side at one height as well, and    */
/*  chose this arrangement, the photograph pinned over the map.        */
/* ------------------------------------------------------------------ */

const MAP_PATH = "/look-closer/map";
const MAT = "bg-white p-1.5 shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]";

export default function MuseumExhibit() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        background: `linear-gradient(135deg, #0A84C8 0%, ${MUSEUM.blue} 55%, #005A8C 100%)`,
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-y-10 md:grid-cols-12 md:gap-x-14">
          {/* The map, and the installation photograph set over its
              corner like a print pinned to it, so both are seen and
              neither is large. */}
          <div className="md:col-span-5">
            <div className="relative pb-[26%]">
              <Link href={MAP_PATH} className="group block" aria-label="Open the map">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOOK_CLOSER_FEATURE.image}
                  alt={LOOK_CLOSER_FEATURE.imageAlt}
                  loading="lazy"
                  className={`w-full ${MAT} transition-transform group-hover:-translate-y-0.5`}
                />
              </Link>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={EXHIBIT_PHOTO.src}
                srcSet={`${EXHIBIT_PHOTO.small} 700w, ${EXHIBIT_PHOTO.src} 1200w`}
                sizes="(min-width: 768px) 18vw, 44vw"
                alt={EXHIBIT_PHOTO.alt}
                loading="lazy"
                className={`absolute bottom-0 right-4 w-[44%] ${MAT}`}
              />
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Rooted Forward" className="h-10 w-10 rounded-full ring-2 ring-white/90" />
              <span className="font-display text-lg text-white/70" aria-hidden="true">
                &amp;
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MUSEUM.logo} alt={MUSEUM.name} className="h-10 w-10 rounded-full ring-2 ring-white/90" />
            </div>

            <h2 className="mt-6 font-display text-5xl font-semibold leading-none tracking-tight text-cream md:text-6xl">
              {EXHIBIT.title}
            </h2>
            <p className="mt-3 font-body text-sm font-medium tracking-wide text-white/80">{LOOK_CLOSER_FEATURE.byline}</p>
            <p className="mt-6 max-w-[34ch] font-display text-xl leading-snug text-cream md:text-2xl">{WEB_COPY.lede}</p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={MAP_PATH}
                className="inline-flex items-center rounded-sm bg-white px-7 py-4 font-body text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-cream"
                style={{ color: MUSEUM.blue }}
              >
                {WEB_COPY.explore}
              </Link>
              <a
                href={MUSEUM.visitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center rounded-sm border border-white/80 px-7 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/10"
              >
                {WEB_COPY.visit}{" "}
                <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </a>
            </div>
            <Link
              href="/look-closer"
              className="group mt-7 inline-block font-body text-sm font-semibold text-white underline decoration-white/50 underline-offset-4 transition-colors hover:text-cream"
            >
              Read more about the map{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
