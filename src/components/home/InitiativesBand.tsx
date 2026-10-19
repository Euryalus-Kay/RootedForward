import Link from "next/link";
import { PARTNERS, PHOTOS } from "@/lib/initiatives";

/* ------------------------------------------------------------------ */
/*  The home page's Initiatives band, straight after the museum block  */
/*  and above "Ways we help" (owner, October 18, 2026).                */
/*                                                                     */
/*  The founder at the Chicago Maritime Museum's podium fills the      */
/*  right side, full height, faded into the cream from the left only   */
/*  (the way the home banner fades the 1940 map), with the door to     */
/*  /initiatives over it. The owner prefers no fade at the top or      */
/*  bottom edge. He saw this photo paired with the JASC one (fading    */
/*  in turn, pinned over its corner, side by side) and chose it alone. */
/*  Below lg the photograph lies behind the words under a cream wash   */
/*  (owner, October 18, 2026), the way the /initiatives header carries */
/*  its photo, instead of sitting above them.                          */
/* ------------------------------------------------------------------ */

export default function InitiativesBand() {
  const podium = PHOTOS.maritimePodium;

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="absolute inset-0 lg:left-auto lg:w-[62%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={podium.src}
          srcSet={`${podium.small} 800w, ${podium.src} 1453w`}
          sizes="(min-width: 1024px) 62vw, 100vw"
          alt={podium.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-[45%_25%] sm:object-[60%_30%] lg:object-[100%_40%]"
        />
        {/* below lg, a wash over the whole photo so the words read on it;
            on a phone the crop keeps him at the right, clear of the slide */}
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/88 to-cream/50 lg:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-cream to-transparent lg:hidden" />
        {/* The fade clears by about halfway across, so the speaker's face
            is not veiled; between lg and xl the photo is narrower, so it
            clears sooner. */}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-cream via-cream/45 via-15% to-transparent to-30% lg:block xl:via-25% xl:to-60%" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-32">
        <div className="lg:max-w-[26rem]">
          <h2 className="font-display text-5xl font-semibold leading-none tracking-tight text-forest md:text-7xl">
            Initiatives
          </h2>
          <p className="mt-6 max-w-[34ch] text-balance font-display text-xl leading-snug text-ink md:text-2xl">
            Exhibits and programs we run with museums and community
            organizations.
          </p>
          {/* The partners' own marks, the same tiles /initiatives uses,
              under the same label. */}
          <p className="mt-8 font-display text-lg leading-tight text-forest">Partners</p>
          <ul className="mt-3 grid max-w-[26rem] grid-cols-3 gap-2">
            {PARTNERS.map((partner) => (
              <li
                key={partner.name}
                className="flex h-20 items-center justify-center rounded-md border border-border bg-white px-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={partner.logo} alt={partner.name} className={`w-auto max-w-full object-contain ${partner.bandClass}`} />
              </li>
            ))}
          </ul>
          <Link
            href="/initiatives"
            className="mt-9 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            See our initiatives
          </Link>
        </div>
      </div>
    </section>
  );
}
