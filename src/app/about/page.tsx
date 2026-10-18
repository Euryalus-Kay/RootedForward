/* ------------------------------------------------------------------ */
/*  /about, titled "Our story"                                         */
/*                                                                     */
/*  Rebuilt October 18, 2026. The owner found the July page cluttered  */
/*  and did not want the box with the survey count, the team section   */
/*  or the ask on it. He pointed at mommysgifttome.org/our-story for   */
/*  the shape (a title, a one-paragraph lede, a story block with a     */
/*  large headline and a short rule, a paler section with a centered   */
/*  title and cards), and at the Initiatives page for the opening,     */
/*  where the picture runs the full width behind the words, veiled in  */
/*  cream from the left. He renamed the page "Our story" the same day; */
/*  the address stays /about.                                          */
/*                                                                     */
/*  The mission and the five things we do are the wording he signed   */
/*  off in the tri-fold brochure on October 12, 2026 ("raises          */
/*  awareness", not "educates"). The four paragraphs of the story are  */
/*  his own, sent on October 18 and kept word for word, survey count   */
/*  and all. The roster lives on /about/team.                          */
/*                                                                     */
/*  The picture behind the opening is a generated image the owner      */
/*  supplied of the six people on the roster. It is only ever a faded  */
/*  background and is never captioned as a photograph. Do not mirror   */
/*  it; the mark and the lettering on the shirts read backwards.       */
/*                                                                     */
/*  House rules that hold here: no small tracked labels over headings  */
/*  (he asked for those to come off the site in July 2026), no         */
/*  SurveyRule on this page, no dash punctuation anywhere in the copy, */
/*  no aphorism headlines, pairs, triads or numbered rows.             */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import Reveal from "@/components/about/Reveal";
import styles from "@/components/about/motion.module.css";

const MISSION_WHO = "A student-run nonprofit started in Chicago.";
const MISSION_WHAT =
  "Rooted Forward raises awareness of racial inequality in cities across the United States, and works to address it through education and political advocacy.";

export const metadata: Metadata = {
  title: "Our story | Rooted Forward",
  description: `${MISSION_WHO} ${MISSION_WHAT}`,
};

/* The story is the owner's, sent October 18, 2026, word for word. */
const STORY = [
  "Zain Zaidi founded Rooted Forward after becoming interested in the divisions between Chicago\u2019s neighborhoods. Living on the Near South Side and going to school in Hyde Park, he often noticed how much changed within a few blocks, especially around the University of Chicago. He began researching how those differences developed, learning about the redlining, restrictive covenants, and urban renewal projects that had shaped the neighborhoods he knew.",
  "Rooted Forward brings students together to research this history and share it with their communities. Early outreach included surveys and conversations with more than 140 people at the Obama Presidential Center, which revealed how unfamiliar much of this history was, even to lifelong Chicagoans. Today, students in three cities contribute research, develop free educational resources, and lead community outreach.",
  "The organization shares its research through lectures at schools, walking tours, and work with museums and cultural institutions, including the Chicago Maritime Museum, Glessner House Museum, and the Japanese American Service Committee\u2019s Legacy Center. At the Chicago Maritime Museum, Rooted Forward created an exhibit around a 1931 illustrated map of Chicago, with an interactive guide explaining the racial discrimination and housing restrictions reflected in its drawings. Its free app also allows people to take a self-guided walking tour of Hyde Park, learning about the neighborhood\u2019s history at the places where it happened.",
  "Alongside this educational work, Rooted Forward helps residents get involved in local policy. The team explains proposed housing legislation, gathers petition signatures, and advocates for bills that have stalled in committee. This work connects the history of segregation and disinvestment with efforts to address their effects today.",
];

const WORK = [
  {
    title: "Self-guided walking tours",
    line: "We create free self-guided tours of different neighborhoods to show their history. They run on our iPhone app. You walk at your own pace, and at each stop the app tells you what happened there. You can also take one from home.",
    link: { label: "Get the app", href: "/tours" },
  },
  {
    title: "Community outreach",
    line: "We do outreach and education in the community, showing people this history and our work and promoting our free tours. We have held events at farmers’ markets and community events.",
    link: { label: "Help run one", href: "/get-involved" },
  },
  {
    title: "School visits",
    line: "We give presentations and lead workshops at schools, showing students our research and the history behind it.",
    link: { label: "Invite us", href: "/contact" },
  },
  {
    title: "Museum partnerships",
    line: "We partner with museums, among them the Glessner House, the Japanese American Service Committee’s Legacy Center, and the Chicago Maritime Museum.",
    link: { label: "See the exhibit", href: "/look-closer" },
  },
  {
    title: "Policy advocacy",
    line: "We run petitions on bills that are already introduced and stuck in a committee, then submit the signatures as public comment.",
    link: { label: "Sign a petition", href: "/policy" },
  },
];

const RULE = "mt-5 h-1 w-16 rounded-full bg-rust";

export default function AboutPage() {
  return (
    <PageTransition>
      {/* ============================================================
          THE OPENING
          The picture full width behind the title and the lede, veiled
          in cream from the left so the words sit on plain ground, and
          fading out along the bottom. The founder stands at the right
          of the picture, where it shows through.
          ============================================================ */}
      <section className="relative overflow-hidden border-b border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/site/team-banner.jpg"
          srcSet="/media/site/team-banner-900.jpg 900w, /media/site/team-banner.jpg 1536w"
          sizes="100vw"
          width={1536}
          height={1024}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[50%_12%] opacity-80 saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/[0.95] to-cream/85 md:via-cream/90 md:to-cream/45" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:pb-24 md:pt-24">
          <h1 className={`font-display text-6xl font-semibold leading-[0.95] tracking-tight text-forest sm:text-7xl md:text-8xl ${styles.rise}`}>
            Our story
          </h1>
          <p
            className={`mt-7 max-w-[34ch] font-display text-xl leading-[1.25] tracking-tight text-ink sm:text-2xl md:text-3xl ${styles.rise}`}
            style={{ animationDelay: "160ms" }}
          >
            <span className="text-rust">{MISSION_WHO}</span> {MISSION_WHAT}
          </p>
        </div>
      </section>

      {/* ============================================================
          HOW IT STARTED
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-4xl font-semibold leading-tight tracking-tight text-forest md:text-5xl">
              How it started
            </h2>
            <div className={RULE} />
          </Reveal>
          <div className="mt-8 flex max-w-3xl flex-col gap-5 font-body text-lg leading-relaxed text-ink/80">
            {STORY.map((p, i) => (
              <Reveal key={p} delay={i * 90}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT WE DO
          Five cards on the paler ground, three then two.
          ============================================================ */}
      <section className="bg-cream-dark/40 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="flex flex-col items-center text-center">
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-forest md:text-5xl">What we do</h2>
              <div className={RULE} />
            </div>
          </Reveal>
          <div className="mt-12 flex flex-wrap justify-center gap-5">
            {WORK.map((item, i) => (
              <Reveal key={item.title} delay={i * 70} className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                <div className="flex h-full flex-col rounded-2xl border border-border bg-cream p-7 md:p-8">
                  <h3 className="font-display text-2xl leading-tight text-ink">{item.title}</h3>
                  <p className="mt-3 font-body text-base leading-relaxed text-ink/70">{item.line}</p>
                  <Link
                    href={item.link.href}
                    className="group mt-auto inline-block pt-6 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                  >
                    {item.link.label}{" "}
                    <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
