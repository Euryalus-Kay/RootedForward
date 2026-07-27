/* ------------------------------------------------------------------ */
/*  /get-involved                                                      */
/*                                                                     */
/*  Rebuilt July 2026 in the same language as /tours. One page, one    */
/*  form, and nothing between the visitor and it that they have to     */
/*  read first. No small uppercase eyebrows, no link dumps that the    */
/*  navbar already covers.                                             */
/*                                                                     */
/*  The page is a server component so it can carry metadata; the form  */
/*  is src/components/forms/JoinForm.tsx and posts the same payload    */
/*  the old inline chapter form did.                                   */
/*                                                                     */
/*  Owner voice rules apply. No aphorisms, no balanced pairs, no       */
/*  numbered rows. Say the concrete thing.                             */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import JoinForm from "@/components/forms/JoinForm";

export const metadata: Metadata = {
  title: "Get Involved | Rooted Forward",
  description:
    "Join a Rooted Forward chapter in Chicago, New York, or Washington, DC, start one in your own city, or come on the podcast and tell us what you have lived through. No experience needed.",
};

/* ------------------------------------------------------------------ */
/*  Line icons, the same heroicons-outline vocabulary as the rest of   */
/*  the site.                                                          */
/* ------------------------------------------------------------------ */

const ICON = "h-6 w-6";

function ResearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}

/* The work that actually exists to be done. Keep this honest. */
const WORK = [
  {
    icon: ResearchIcon,
    title: "Archive work",
    body: "Read deeds, appraisal maps, and old city plans, and write up what you find. This is where every tour and every petition starts.",
  },
  {
    icon: PeopleIcon,
    title: "Tables and surveys",
    body: "Run a table at a market or outside the Obama Presidential Center, talk to people about their own block, and record what they say.",
  },
  {
    icon: MicrophoneIcon,
    title: "Recording and editing",
    body: "Sit in on podcast interviews, cut the audio, and clean up the narration that ends up in the app.",
  },
];

export default function GetInvolvedPage() {
  return (
    <PageTransition>
      {/* ============================================================
          OPENER
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="max-w-[16ch] font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            Come work on this with us.
          </h1>
          <p className="mt-6 max-w-[54ch] font-body text-lg leading-relaxed text-ink/80">
            Rooted Forward is run by students, and there is more work than
            there are people to do it. If you can read an old document, hold a
            conversation with a stranger, or edit audio, there is something
            here for you.
          </p>
          <p className="mt-4 max-w-[54ch] font-body text-lg leading-relaxed text-ink/80">
            You do not need experience and it does not cost anything. Fill in
            the form and a student will write back.
          </p>
          <a
            href="#form"
            className="mt-9 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Sign up
          </a>
        </div>
      </section>

      {/* ============================================================
          WHAT YOU WOULD DO
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="max-w-[18ch] font-display text-3xl leading-tight text-forest md:text-4xl">
            What you would actually do
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-3">
            {WORK.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-rust/45 text-rust">
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-display text-2xl leading-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-[38ch] font-body text-base leading-relaxed text-ink/75">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-12 max-w-[62ch] font-body text-base leading-relaxed text-ink/70">
            Most people start on one of those and drift toward whichever they
            like best. If your city does not have a chapter yet, you can start
            one, and we will send you what the Chicago chapter used to get
            going.
          </p>
        </div>
      </section>

      {/* ============================================================
          THE PODCAST
          The podcast page links here, at /get-involved#podcast, and
          JoinForm reads that hash to preselect the podcast option.
          ============================================================ */}
      <section
        id="podcast"
        className="scroll-mt-16 border-t border-border bg-cream py-16 md:py-20"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-7">
              <h2 className="max-w-[20ch] font-display text-3xl leading-tight text-forest md:text-4xl">
                You can also just come on the podcast
              </h2>
              <p className="mt-5 max-w-[54ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                You do not have to join anything for this one. If you have
                lived somewhere we research and watched it change, we would
                rather record you than write about it secondhand. That is
                where most of what we know comes from.
              </p>
              <p className="mt-4 max-w-[54ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                Tell us a little about what you would want to talk about and
                we will set up a time. Nothing gets recorded before you have
                talked it through with us.
              </p>
              <a
                href="#form"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Put your name in
              </a>
            </div>
            <div className="md:col-span-5">
              <div className="rounded-sm border border-border bg-cream-dark p-6">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Episodes so far are conversations with people from the
                  neighborhoods we study, recorded in their own words.
                </p>
                <Link
                  href="/podcasts"
                  className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  Hear the podcast{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE FORM
          ============================================================ */}
      <section
        id="form"
        className="scroll-mt-16 border-t border-border bg-cream-dark py-16 md:py-24"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-4">
              <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
                Sign up
              </h2>
              <p className="mt-5 max-w-[38ch] font-body text-base leading-relaxed text-ink/75">
                Say what you want to do, leave your email, and a student will
                write back within a few days.
              </p>
              <p className="mt-5 max-w-[38ch] font-body text-base leading-relaxed text-ink/75">
                Chapters run in Chicago, New York, and Washington, DC. Being on
                the podcast works from anywhere.
              </p>
            </div>
            <div className="md:col-span-8">
              <JoinForm />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR PEOPLE WHO DO NOT WANT TO SIGN UP
          ============================================================ */}
      <section className="bg-forest py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="max-w-[20ch] font-display text-3xl leading-tight text-cream md:text-4xl">
            Not looking to join?
          </h2>
          <p className="mt-5 max-w-[52ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
            Signing a petition takes about a minute and it is the thing we can
            hand to a committee. If you have a question first, write to us and
            a person will answer.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Link
              href="/policy"
              className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Sign a petition
            </Link>
            <Link
              href="/contact"
              className="group font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:text-rust"
            >
              Ask us something{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
