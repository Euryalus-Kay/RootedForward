/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/*                                                                     */
/*  Centers on the organization's three pillars (Education, Policy,    */
/*  Research) as full-bleed dark bands with alternating sides and a    */
/*  distinct line icon each. Backgrounds alternate ink / forest the    */
/*  whole way down (the Get involved closer lands on ink right before  */
/*  the forest footer) so no two adjacent sections share a color. A    */
/*  faint diagonal hatch keeps the dark fields from reading as flat    */
/*  slabs.                                                             */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

/* Heroicons-style outline paths, matching the icon language already   */
/* used on the policy page. Each pillar gets its own glyph.            */
const ICON_PATHS: Record<string, string> = {
  // open book — learning
  book:
    "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
  // megaphone — advocacy
  megaphone:
    "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46",
  // magnifying glass — investigation
  search:
    "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
};

function PillarIcon({
  name,
  className,
  strokeWidth = 1.5,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name]} />
    </svg>
  );
}

/* Faint diagonal hatch so the dark color fields read as textured       */
/* paper rather than flat slabs. Cream lines at low opacity work on     */
/* both the ink and forest backgrounds.                                 */
function HatchOverlay({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.06]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={`hatch-${id}`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="24" stroke="#F5F0E8" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#hatch-${id})`} />
    </svg>
  );
}

/* Three pillars, in the order Education, Policy, Research. Backgrounds  */
/* alternate forest / ink, and the layout alternates sides per band.    */
const PILLARS = [
  {
    icon: "book",
    title: "Education",
    href: "/education",
    bg: "bg-forest",
    desc:
      "The story of how American cities got segregated does not fit in one form, so we tell it in four. Walking tours you take on foot, a podcast with the people who lived it, a game where you build a block and watch the policy play out, and a free curriculum built for the classroom.",
    items: ["Walking tours", "Podcast", "The game", "Curriculum"],
    cta: "See how we teach it",
  },
  {
    icon: "megaphone",
    title: "Policy",
    href: "/policy",
    bg: "bg-ink",
    desc:
      "Once you can see how the patterns formed, the question is what to do about the parts still running. We organize that response in Chicago. Sign onto active campaigns, add your name to public comment drives, read the briefs, or send us a proposal of your own.",
    items: ["Active campaigns", "Public comment drives", "Policy briefs", "Community proposals"],
    cta: "See active campaigns",
  },
  {
    icon: "search",
    title: "Research",
    href: "/research",
    bg: "bg-forest",
    desc:
      "All of it stands on the research. Our team works through the archives, namely HOLC redlining maps, city planning records, and oral history collections, and sits with residents to get what the records leave out. We pair that with housing, school, and zoning data, then publish the papers and release the data so anyone can check the work.",
    items: ["Policy briefs", "Primary source archives", "Oral histories", "Data analysis"],
    cta: "Read the research",
  },
];

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO — full screen photo with the giant wordmark
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
          MISSION / THESIS — ink band, bridges into the pillars
          ============================================================ */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28">
        <HatchOverlay id="mission" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust-light">
            What we do
          </p>
          <p className="mt-6 font-display text-2xl leading-relaxed text-cream md:text-[2rem] md:leading-[1.4]">
            Rooted Forward is a youth-led nonprofit in Chicago. We trace what
            redlining, urban renewal, and highway construction did to the
            neighborhoods people live in now, and we organize the response. The
            work runs on three pillars.
          </p>
        </div>
      </section>

      {/* ============================================================
          THREE PILLARS — full-bleed dark bands, alternating sides
          ============================================================ */}
      {PILLARS.map((p, i) => {
        const markerLeft = i % 2 === 0; // Education left, Policy right, Research left
        return (
          <section key={p.title} className={`group relative overflow-hidden ${p.bg} py-20 md:py-28`}>
            <HatchOverlay id={p.title} />
            <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-y-8 px-6 md:grid-cols-12 md:gap-x-16">
              {/* Marker — large feature icon for this pillar */}
              <div
                className={`flex flex-col items-start md:col-span-4 ${
                  markerLeft ? "md:order-1" : "md:order-2 md:items-end"
                }`}
              >
                <PillarIcon
                  name={p.icon}
                  strokeWidth={1}
                  className="h-20 w-20 text-rust-light transition-transform duration-500 group-hover:-translate-y-1 md:h-28 md:w-28"
                />
                <div className="mt-5 h-px w-12 bg-rust/50" aria-hidden="true" />
              </div>

              {/* Text */}
              <div className={`md:col-span-8 ${markerLeft ? "md:order-2" : "md:order-1"}`}>
                <h2 className="font-display text-5xl leading-[0.95] text-cream md:text-6xl">
                  {p.title}
                </h2>
                <p className="mt-5 max-w-2xl font-body text-base leading-relaxed text-cream/75 md:text-lg">
                  {p.desc}
                </p>

                <ul className="mt-7 grid max-w-lg grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-center gap-2.5 font-body text-sm text-cream/85">
                      <span aria-hidden="true" className="text-rust-light">
                        &rarr;
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className="group/cta mt-9 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream"
                >
                  <span>{p.cta}</span>
                  <span aria-hidden="true" className="transition-transform group-hover/cta:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* ============================================================
          GET INVOLVED — ink closer, sits against the forest footer
          ============================================================ */}
      <section className="relative overflow-hidden bg-ink py-20 md:py-28">
        <HatchOverlay id="cta" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Get involved
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We need young researchers, tour guides, podcast producers, and
            people who want to push on policy. If this is your city and this
            matters to you, there is a place for you here.
          </p>
          <Link
            href="/get-involved"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
