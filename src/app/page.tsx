/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/*                                                                     */
/*  Rebuilt July 2026 around one rule from the owner. A visitor who    */
/*  reads only the name and the paragraph under it should already      */
/*  know what this organization does. Everything after that is the     */
/*  four things we actually do, in the order they matter, one short    */
/*  row each. No explaining, no build-up.                              */
/*                                                                     */
/*  Voice rules learned the hard way (owner feedback, July 2026):      */
/*  no aphorism headlines, no balanced-pair sentences ("we teach X,    */
/*  we work on Y"), no numbered 01/02 list rows, no triads. Say the    */
/*  concrete thing.                                                    */
/*                                                                     */
/*  There are no photographs of our own work yet, so the rows carry    */
/*  their weight with type and a line icon rather than an image        */
/*  placeholder. The two archival pictures on the page are public      */
/*  domain, provenance in public/media/hyde-park/credits.json.         */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

/* ------------------------------------------------------------------ */
/*  Line icons. Same heroicons-outline vocabulary the policy page      */
/*  uses, so the site keeps one drawing style.                         */
/* ------------------------------------------------------------------ */

const ICON_CLS = "h-7 w-7";

function MapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_CLS}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_CLS}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_CLS}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_CLS}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  The four things we do. Order is deliberate. Tours carry the most   */
/*  people, policy is the newest.                                      */
/* ------------------------------------------------------------------ */

interface WorkItem {
  label: string;
  title: string;
  body: string[];
  icon: () => React.ReactElement;
  links: { label: string; href: string }[];
}

const WORK: WorkItem[] = [
  {
    label: "Tours",
    title: "Self-guided walking tours",
    icon: MapIcon,
    body: [
      "Our student researchers take one neighborhood at a time and work out how race shaped the blocks people walk past every day. The deeds, the appraisal forms, the bulldozed lots.",
      "They build a tour out of what they find and put it on the Rooted Forward app. You can walk the route with it, or read the whole thing at home. We count how many people take each tour, and that count is how we know whether the research reached anyone.",
    ],
    links: [
      { label: "Walk Hyde Park", href: "/tours" },
      { label: "Read it online instead", href: "/tours/chicago/hyde-park" },
    ],
  },
  {
    label: "Outreach",
    title: "Community outreach",
    icon: ClipboardIcon,
    body: [
      "We set up where people already are, like the Obama Presidential Center in Chicago and neighborhood farmers markets, and we interview and survey residents. We ask about their own block, and we ask what they know about how racial inequality was built into their city.",
      "The answers become data on where the gaps are, and they keep our research answerable to the people who live there. It is also where we hand out the tour app, so somebody standing in the neighborhood can walk it that afternoon.",
    ],
    links: [{ label: "Help us run one", href: "/get-involved" }],
  },
  {
    label: "Podcast",
    title: "The podcast",
    icon: MicrophoneIcon,
    body: [
      "We sit down with people who live in the neighborhoods we study and record what they have been through.",
      "A census table can tell you a block lost half its households. It cannot tell you what that was like, or what the people still there think should happen next. Those conversations decide what we research and what we end up asking the city for.",
    ],
    links: [{ label: "Listen", href: "/podcasts" }],
  },
  {
    label: "Policy",
    title: "Policy advocacy",
    icon: ScaleIcon,
    body: [
      "We run petitions on bills that would undo part of the long-term damage from disinvestment in Black and Brown neighborhoods. Everything open right now is a Chicago bill.",
      "We pick bills that are already written and already introduced and are now sitting in a committee that will not vote. We explain in plain words what each one would do, and we hand the signatures to that committee.",
    ],
    links: [{ label: "Sign a petition", href: "/policy" }],
  },
];

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          WHO WE ARE
          The 1940 HOLC Residential Security Map of Chicago sits
          behind the name. The paragraph under the name is the whole
          pitch, so it says what we do and nothing else.
          ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Cropped to the graded city and shoreline; the full sheet
            with its legend and suburb inset is the og:image. */}
        <img
          src="/media/site/holc-chicago-1940-city.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[50%_44%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/95 to-cream/45" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
          <h1 className="font-display text-6xl font-semibold leading-[0.95] tracking-tight text-forest sm:text-7xl md:text-8xl">
            Rooted Forward
          </h1>
          <p className="mt-8 max-w-[46ch] font-body text-xl leading-relaxed text-ink/85 md:text-2xl md:leading-relaxed">
            We are a student-run nonprofit that started in Chicago and now
            works in New York too. We research how racial inequality was built
            into cities across the United States. That research becomes
            education where there is a gap, and advocacy for the local policy
            that would address it.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/tours"
              className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Take a tour
            </Link>
            <Link
              href="/policy"
              className="group font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
            >
              Sign a petition{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>

        <p className="absolute bottom-4 right-4 z-10 max-w-[46ch] text-right font-body text-[11px] leading-snug text-ink/70">
          Residential Security Map of Chicago. Home Owners&rsquo; Loan
          Corporation, 1940. CC0.
        </p>
      </section>

      {/* ============================================================
          WAYS WE HELP
          Four rows. Big title on the left, the plain description on
          the right, a hairline between each.
          ============================================================ */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            What we do
          </p>
          <h2 className="mt-4 font-display text-5xl font-semibold leading-none tracking-tight text-forest md:text-7xl">
            Ways we help
          </h2>

          <div className="mt-14">
            {WORK.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="grid grid-cols-1 gap-y-6 border-b border-border py-12 md:grid-cols-12 md:gap-x-14 md:py-16"
                >
                  <div className="md:col-span-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/45 text-rust">
                      <Icon />
                    </div>
                    <p className="mt-5 font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/55">
                      {item.label}
                    </p>
                    <h3 className="mt-3 max-w-[14ch] font-display text-3xl leading-tight text-ink md:text-4xl">
                      {item.title}
                    </h3>
                  </div>

                  <div className="md:col-span-7">
                    <div className="flex flex-col gap-4">
                      {item.body.map((para, i) => (
                        <p
                          key={i}
                          className="max-w-[58ch] font-body text-base leading-relaxed text-ink/75 md:text-lg"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                    <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
                      {item.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                        >
                          {link.label}{" "}
                          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                            &rarr;
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          THE NEIGHBORHOOD WE HAVE FINISHED
          One archival picture and one button, so the first tour has
          a door of its own without another wall of text.
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-y-10 md:grid-cols-12 md:gap-x-16">
            <div className="md:col-span-6">
              <img
                src="/media/site/hyde-park-aerial-1928.jpg"
                alt="Aerial photograph of Hyde Park and the lakefront taken by the Chicago Aerial Survey Company in 1928"
                loading="lazy"
                className="w-full rounded-sm border border-cream/20 object-cover"
              />
              <p className="mt-2 font-body text-[11px] text-cream/65">
                Hyde Park and the lakefront from the air, 1928. Chicago Aerial
                Survey Co. Public domain.
              </p>
            </div>
            <div className="md:col-span-6">
              <h2 className="font-display text-3xl leading-tight text-cream md:text-4xl">
                Self-guided Hyde Park tour
              </h2>
              <p className="mt-5 max-w-[52ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
                Sixteen stops around Hyde Park, following how the neighborhood
                decided who was allowed to live in it. Free, and about four
                miles on foot.
              </p>
              <Link
                href="/tours"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Start the tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CLOSER. No archival photo here; pairing one with a
          recruitment button read as too much (owner, July 2026).
          ============================================================ */}
      <section className="bg-ink py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            We could use your help.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] font-body text-lg leading-relaxed text-cream/75">
            Rooted Forward is small and run by students. If you can dig through
            an archive, run a survey table at a market, or edit audio, there is
            work here for you, and you do not need experience to start.
          </p>
          <Link
            href="/get-involved"
            className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
