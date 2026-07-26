import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Privacy Policy | Rooted Forward",
  description:
    "How Rooted Forward collects, uses, shares, retains and deletes information on rooted-forward.org and in the Walk Hyde Park iOS app.",
};

/* ------------------------------------------------------------------
   The privacy policy for rooted-forward.org and the Walk Hyde Park
   iOS app. The App Store listing points here, and Apple's review
   guideline 5.1.1 requires this page to name the data collected, how
   it is collected, every use of it, the third parties that receive
   it, how long it is kept, and how someone withdraws consent and
   deletes their account. Keep every claim on this page true of what
   the site and the app actually do.
   ------------------------------------------------------------------ */

const EFFECTIVE = "July 26, 2026";

const SUMMARY = [
  "The Walk Hyde Park app collects nothing. There is no account, no sign-in, and no analytics in it at all.",
  "Your tour progress and your location stay on your phone. Neither one is ever sent to us.",
  "On the website you can read everything, including the whole tour and the research archive, without an account.",
  "We show no advertising, run no tracking of any kind, and never sell or rent anything about you.",
];

type Row = { item: string; why: string; where: string };

const SITE_ROWS: Row[] = [
  {
    item: "Your name and email address",
    why: "So you can sign in, comment, and sign policy campaigns",
    where: "Only if you create an account",
  },
  {
    item: "Your password",
    why: "So you can sign in. It is hashed by our sign-in provider and we never see it",
    where: "Only if you create an account with a password",
  },
  {
    item: "Your Google name and email",
    why: "Creates the account when you choose to sign in with Google",
    where: "Only if you use Google sign-in",
  },
  {
    item: "Comments, campaign signatures and anything you submit",
    why: "So it can appear where you posted it, attached to your account",
    where: "Only what you choose to write",
  },
  {
    item: "A record of research files you download",
    why: "So we can see how the archive gets used and stop abuse of it",
    where: "Only when you download from the research archive",
  },
  {
    item: "A sign-in cookie",
    why: "Keeps you signed in between pages. It is the only cookie we set",
    where: "Only while you are signed in",
  },
  {
    item: "Ordinary server logs, including your IP address",
    why: "Our host records these to serve pages and block attacks",
    where: "Every visit, the same as any website",
  },
];

const APP_ROWS: Row[] = [
  {
    item: "Which stops you have finished and where you stopped",
    why: "So the walk picks up where you left it",
    where: "Your phone only. Deleting the app deletes it",
  },
  {
    item: "Your location, if you allow it",
    why: "Draws your dot on the tour map and tells you when a stop is near",
    where: "Your phone only. It is never sent anywhere",
  },
  {
    item: "Nothing else",
    why: "There is no account, no sign-in, no analytics and no advertising identifier in the app",
    where: "Nowhere, because it does not exist",
  },
];

type Section = {
  id: string;
  title: string;
  paragraphs?: string[];
  rows?: Row[];
  bullets?: string[];
  /** Rendered under the bullet list, for sections that open with a
   *  list and then close on a sentence. */
  after?: string[];
};

const SECTIONS: Section[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    paragraphs: [
      "Rooted Forward is a student-run nonprofit in Chicago. We publish research, a podcast, policy work, and a free self-guided walking tour of Hyde Park. This policy covers the website at rooted-forward.org and the Walk Hyde Park app for iPhone and iPad. Both are run by the same small group of people, and you can reach us at contact@rooted-forward.org.",
      "The app is the simple half of this page. It collects nothing at all. Everything that follows about accounts, sign-in and stored records applies to the website only, and even there it only applies if you choose to make an account, which nothing requires you to do.",
    ],
  },
  {
    id: "website",
    title: "What the website collects",
    paragraphs: [
      "You can read every page on this site, including the research archive and the full text of the walking tour, without signing in and without telling us anything about yourself.",
    ],
    rows: SITE_ROWS,
  },
  {
    id: "app",
    title: "What the Walk Hyde Park app collects",
    paragraphs: [
      "Nothing. That is the whole answer, and the rest of this section is only there to show its work.",
      "The app ships with the entire tour inside it. Every stop, every photograph and all of the narration are already on your phone when you install it, so the walk runs in airplane mode. There is no account, no sign-in screen, no registration, no analytics library, no crash reporter, no advertising identifier and no tracking of any kind. We could not tell you how many people finished the walk, let alone who they are.",
      "Two things exist while you use it, and both stay on your phone.",
    ],
    rows: APP_ROWS,
    after: [
      "The app makes exactly one request to us, an ordinary web request to rooted-forward.org asking for the latest tour text. That is how a correction reaches you without waiting on an App Store update. It carries nothing about you.",
    ],
  },
  {
    id: "location",
    title: "How the app uses your location",
    paragraphs: [
      "The app asks for location once, when you tap Find me on the tour map, and it asks for it only while you are using the app, never in the background. Say no and everything keeps working. All the app does with your position is draw your dot on the map and tell you when you are close to the next stop.",
      "That calculation happens on your phone. Your coordinates are never transmitted to us, never written to our database, and never handed to anyone else. We could not tell you where a single walker has been.",
      "You can turn location off at any time in the iOS Settings app under Privacy and Security, then Location Services, then Walk Hyde Park. The tour keeps working.",
    ],
  },
  {
    id: "uses",
    title: "How we use what we do collect",
    paragraphs: [
      "This section is about the website, since the app gives us nothing to use.",
    ],
    bullets: [
      "To sign you in and keep you signed in.",
      "To show your comments, submissions and campaign signatures under your name where you posted them.",
      "To reply when you write to us.",
      "To understand which research datasets get used, and to stop anyone from scraping the archive.",
      "To keep the site running, secure, and free of abuse.",
    ],
    after: [
      "That is the complete list. We do not build advertising profiles, we do not score or rank you, and we do not use your information to train any model.",
    ],
  },
  {
    id: "sharing",
    title: "Who else handles your information",
    paragraphs: [
      "We use a small number of companies to run the website. They process information on our instructions, under their own written security commitments, and they are not permitted to use it for their own purposes. None of them receives anything from the app.",
    ],
    bullets: [
      "Supabase holds accounts, sign-in records, comments, signatures and download logs.",
      "Vercel hosts the website and keeps ordinary server logs.",
      "Google receives nothing unless you choose Google sign-in, in which case Google gives us your name and email to create the account.",
      "Apple distributes the app and shows us anonymous, aggregate download figures in its own dashboard. Apple never tells us who you are, and the app sends Apple nothing on our behalf.",
    ],
    after: [
      "We do not sell your information, we do not rent it, and we do not trade it. The only other time we would hand anything over is if the law required it, and we would tell you unless we were legally barred from doing so.",
    ],
  },
  {
    id: "never",
    title: "What we never do",
    bullets: [
      "No advertising, anywhere on the site or in the app.",
      "No third-party analytics, no tracking pixels, no advertising identifiers, no cross-site or cross-app tracking.",
      "No selling or renting of anything about you, to anyone, ever.",
      "No location data leaving your phone.",
      "No account anywhere in the app, and no account needed on the site to read, listen, or walk.",
      "No use of anything you write to train a model, ours or anyone else's.",
    ],
  },
  {
    id: "retention",
    title: "How long we keep things",
    bullets: [
      "Your account and profile stay until you delete them.",
      "Comments, submissions and campaign signatures stay until you delete your account, which removes them with it.",
      "Research download records are kept for two years, then deleted.",
      "Server logs are kept by our host for about thirty days.",
      "Nothing from the app is on our side at all, so there is nothing for us to keep or to delete. Removing the app removes everything it held.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and your rights",
    paragraphs: [
      "You can ask us for a copy of everything tied to your account, ask us to correct something wrong, ask us to delete it, or withdraw a permission you gave us earlier. Write to contact@rooted-forward.org and we will answer within thirty days. We will not charge you and we will not treat you differently for asking.",
      "If you are in California, the European Union, or the United Kingdom, the rights your law gives you are the rights described here, and we extend them to everyone regardless of where they live.",
    ],
  },
  {
    id: "delete",
    title: "Deleting your account",
    paragraphs: [
      "This applies to the website only. The app has no account to delete, and deleting the app removes everything it ever held, since all of it was on your phone.",
      "To delete a website account, email contact@rooted-forward.org from the address on the account and we will remove it within seven days. Deletion is permanent. Your profile, your sign-in record, your comments, your submissions and your signatures go with it. We cannot restore an account once it is gone.",
    ],
  },
  {
    id: "security",
    title: "How we protect it",
    paragraphs: [
      "Everything travels over HTTPS. Passwords are hashed by our sign-in provider and are never stored or seen by us in readable form. Access to the database is limited to the people who run the organization. The app holds no credentials at all, so there is nothing in it to steal.",
      "No system is perfect, and we will not pretend otherwise. If a breach ever affects your information we will tell you and the relevant authorities as quickly as the law requires.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "The site and the app are made for a general audience, including students, and the tour is written to be walked by a high school class. We do not knowingly collect personal information from anyone under 13. Nothing about reading, listening or walking requires an account, so a child can use all of it without giving us anything.",
      "If you believe a child under 13 has created an account, write to contact@rooted-forward.org and we will delete it.",
    ],
  },
  {
    id: "international",
    title: "People outside the United States",
    paragraphs: [
      "We are based in Chicago and our providers store data in the United States. If you use the site or the app from elsewhere, your information is processed here, where privacy law may differ from your own country's.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "If we change what we collect or what we do with it, we will update this page and change the date at the top. If the change is a significant one, we will say so plainly at the top of the page rather than hoping you notice.",
    ],
  },
  {
    id: "contact",
    title: "How to reach us",
    paragraphs: [
      "Email contact@rooted-forward.org with anything about this policy, a request about your information, or a question you think this page should have answered. A person reads it.",
    ],
  },
];

function DataTable({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-sm border border-border">
      <div className="hidden bg-cream-dark/60 md:grid md:grid-cols-[1.1fr_1.3fr_1fr]">
        {["What", "Why we have it", "Where it lives"].map((h) => (
          <div
            key={h}
            className="border-r border-border px-4 py-3 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-forest last:border-r-0"
          >
            {h}
          </div>
        ))}
      </div>
      {rows.map((row, i) => (
        <div
          key={row.item}
          className={`grid gap-1 px-4 py-4 md:grid-cols-[1.1fr_1.3fr_1fr] md:gap-0 md:px-0 md:py-0 ${
            i > 0 ? "border-t border-border" : ""
          } ${i % 2 === 1 ? "bg-cream-dark/25" : ""}`}
        >
          <div className="font-body text-sm font-semibold leading-snug text-ink md:border-r md:border-border md:px-4 md:py-4">
            {row.item}
          </div>
          <div className="font-body text-sm leading-relaxed text-ink/75 md:border-r md:border-border md:px-4 md:py-4">
            {row.why}
          </div>
          <div className="font-body text-sm leading-relaxed text-warm-gray md:px-4 md:py-4">
            {row.where}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Privacy Policy
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            What we keep, and what we don&apos;t.
          </h1>
          <p className="mt-5 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            This page covers rooted-forward.org and the Walk Hyde Park app for
            iPhone and iPad. The app collects nothing at all. On the website we
            keep only what an account needs, and this page says plainly what
            that is, why we have it, how long we hold it, and how to get rid of
            it.
          </p>
          <p className="mt-6 font-body text-sm text-warm-gray">
            Effective {EFFECTIVE}. Last updated {EFFECTIVE}.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-cream-dark/40 py-12 md:py-14">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            The short version
          </h2>
          <ul className="mt-5 space-y-3">
            {SUMMARY.map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[0.6em] h-px w-4 shrink-0 bg-rust"
                />
                <span className="font-body text-base leading-relaxed text-ink/85">
                  {line}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-body text-sm italic leading-relaxed text-warm-gray">
            The short version is a summary, not the policy. The sections below
            are the policy.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-cream py-10">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Contents
          </h2>
          <ol className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {SECTIONS.map((section, i) => (
              <li key={section.id} className="flex gap-3">
                <span className="font-body text-sm tabular-nums text-rust">
                  {i + 1}.
                </span>
                <a
                  href={`#${section.id}`}
                  className="font-body text-sm leading-relaxed text-ink/80 underline decoration-border underline-offset-4 transition-colors hover:text-forest hover:decoration-forest"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-3xl space-y-14 px-6">
          {SECTIONS.map((section, i) => (
            <div key={section.id} id={section.id} className="scroll-mt-28">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 font-display text-2xl text-forest md:text-3xl">
                {section.title}
              </h2>

              {section.paragraphs && (
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((p, j) => (
                    <p
                      key={j}
                      className="font-body text-base leading-relaxed text-ink/80"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}

              {section.rows && <DataTable rows={section.rows} />}

              {section.bullets && (
                <ul className="mt-5 space-y-2.5">
                  {section.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-rust"
                      />
                      <span className="font-body text-base leading-relaxed text-ink/80">
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {section.after && (
                <div className="mt-5 space-y-4">
                  {section.after.map((p, j) => (
                    <p
                      key={j}
                      className="font-body text-base leading-relaxed text-ink/80"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/50">
            Questions
          </p>
          <p className="mt-4 font-display text-2xl text-cream md:text-3xl">
            <a
              href="mailto:contact@rooted-forward.org"
              className="underline decoration-cream/30 underline-offset-[6px] transition-colors hover:decoration-cream"
            >
              contact@rooted-forward.org
            </a>
          </p>
          <p className="mt-5 font-body text-base leading-relaxed text-cream/65">
            Rooted Forward, Chicago, Illinois. Effective {EFFECTIVE}.
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
