/* ------------------------------------------------------------------ */
/*  /media                                                             */
/*                                                                     */
/*  A selection of our photographs, with captions, free to download.   */
/*  Unlisted at the owner's request (October 18, 2026): nothing on the */
/*  site links here, it is not in the sitemap, and search engines are  */
/*  asked to skip it. Every photograph is at /media/all.               */
/*                                                                     */
/*  Photos in a row share one height and keep their own shape (each    */
/*  figure grows in proportion to its aspect ratio), so nothing is     */
/*  cropped. Below sm the rows stack. Clicking a photo opens it full   */
/*  size. The words and the row order live in src/lib/media-gallery.ts. */
/*                                                                     */
/*  The public image folder is also /media, so this page shares the   */
/*  path with public/media/* files and with the uploads route. They do */
/*  not collide, since none of those is the bare /media or /media/all. */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import DownloadLink, { formatKb } from "@/components/media/DownloadLink";
import { CURATED, GALLERY_ZIP, PLACES, galleryPaths, photoBySlug, type GalleryPhoto } from "@/lib/media-gallery";

export const metadata: Metadata = {
  title: "Photographs | Rooted Forward",
  description: "Photographs of Rooted Forward at the Chicago Maritime Museum and the Japanese American Service Committee.",
  robots: { index: false, follow: false },
};

function Figure({ photo }: { photo: GalleryPhoto }) {
  const paths = galleryPaths(photo.slug);
  return (
    <figure className="min-w-0" style={{ flex: `${photo.w / photo.h} 1 0%` }}>
      <a href={paths.display} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-sm bg-cream-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={paths.display}
          srcSet={`${paths.thumb} 800w, ${paths.display} ${photo.w}w`}
          sizes="(min-width: 640px) 60vw, 100vw"
          width={photo.w}
          height={photo.h}
          alt={photo.alt}
          loading="lazy"
          className="h-auto w-full transition-transform duration-500 hover:scale-[1.015]"
          style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
        />
      </a>
      <figcaption className="mt-3 flex flex-col items-start gap-1.5">
        <span className="max-w-[60ch] font-body text-sm leading-snug text-ink/75">{photo.caption}</span>
        <DownloadLink href={paths.full} filename={`rooted-forward-${photo.slug}.jpg`} size={formatKb(photo.kb)} />
      </figcaption>
    </figure>
  );
}

export default function MediaPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-14 pt-16 md:pb-16 md:pt-24">
          <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-tight text-forest sm:text-7xl md:text-8xl">
            Photographs
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/media/all"
              className="group font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
            >
              All photographs{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
            <DownloadLink
              href={GALLERY_ZIP.href}
              filename="rooted-forward-photographs.zip"
              label="Download all"
              size={`${GALLERY_ZIP.mb} MB`}
              className="text-sm!"
            />
          </div>
          <p className="mt-4 font-body text-sm text-ink/60">Please credit Rooted Forward.</p>
        </div>
      </section>

      {(Object.keys(CURATED) as GalleryPhoto["place"][]).map((place, i) => (
        <section key={place} className={`bg-cream py-14 md:py-20 ${i > 0 ? "border-t border-border" : ""}`}>
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">{PLACES[place].name}</h2>
            <p className="mt-2 font-display text-lg italic text-ink/60">
              {PLACES[place].pre}
              <span className="not-italic">{PLACES[place].work}</span>
              {PLACES[place].post}
            </p>

            <div className="mt-10 flex flex-col gap-10 md:gap-12">
              {CURATED[place].map((row) => (
                <div key={row.join()} className="flex flex-col gap-10 sm:flex-row sm:gap-5">
                  {row.map((slug) => (
                    <Figure key={slug} photo={photoBySlug(slug)} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </PageTransition>
  );
}
