/* ------------------------------------------------------------------ */
/*  /media/all                                                         */
/*                                                                     */
/*  Every photograph the owner has given us, each with its caption and */
/*  a download of the full-size copy, plus a zip of the set. Unlisted  */
/*  like /media (owner, October 18, 2026). Thumbnails are square crops */
/*  so the sheet reads as one even grid; the downloads are uncropped.  */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import DownloadLink, { formatKb } from "@/components/media/DownloadLink";
import { GALLERY, GALLERY_ZIP, PLACES, galleryPaths, type GalleryPhoto } from "@/lib/media-gallery";

export const metadata: Metadata = {
  title: "All photographs | Rooted Forward",
  description: "Every Rooted Forward photograph, free to download.",
  robots: { index: false, follow: false },
};

export default function AllMediaPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-24">
          <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-forest sm:text-6xl md:text-7xl">
            All photographs
          </h1>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/media"
              className="group font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
            >
              <span aria-hidden="true" className="inline-block transition-transform group-hover:-translate-x-1">
                &larr;
              </span>{" "}
              Selected photographs
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

      {(Object.keys(PLACES) as GalleryPhoto["place"][]).map((place, i) => (
        <section key={place} className={`bg-cream py-12 md:py-16 ${i > 0 ? "border-t border-border" : ""}`}>
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl leading-tight text-forest md:text-3xl">{PLACES[place].name}</h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
              {GALLERY.filter((p) => p.place === place).map((photo) => {
                const paths = galleryPaths(photo.slug);
                return (
                  <li key={photo.slug} className="flex flex-col">
                    <a
                      href={paths.display}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square overflow-hidden rounded-sm bg-cream-dark"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={paths.thumb}
                        alt={photo.alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                        style={{ objectPosition: photo.focus ?? "50% 50%" }}
                      />
                    </a>
                    <p className="mt-2.5 font-body text-[13px] leading-snug text-ink/75">{photo.caption}</p>
                    <DownloadLink
                      href={paths.full}
                      filename={`rooted-forward-${photo.slug}.jpg`}
                      size={formatKb(photo.kb)}
                      className="mt-auto self-start pt-2"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </PageTransition>
  );
}
