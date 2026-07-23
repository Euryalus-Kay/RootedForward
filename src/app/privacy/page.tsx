import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Privacy | Rooted Forward",
  description:
    "How Rooted Forward handles your information on this site and in the Walk Hyde Park iOS app.",
};

/* ------------------------------------------------------------------
   The privacy policy for rooted-forward.org and the Walk Hyde Park
   iOS app. The App Store listing points here, so keep this page's
   claims in sync with what the site and the app actually do.
   ------------------------------------------------------------------ */

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "What we collect on the website",
    paragraphs: [
      "You can read everything on this site without an account. If you create one, we store the email address and name you give us so you can sign in, comment, and sign policy campaigns. If you write to us through the contact form, we keep your message and email so we can reply.",
      "Research dataset downloads are logged with the account that requested them. We use this to understand how the archive gets used and to catch abuse.",
      "We use cookies only to keep you signed in. There is no advertising on this site and we do not sell or rent your information to anyone.",
    ],
  },
  {
    title: "What the iOS app collects",
    paragraphs: [
      "The Walk Hyde Park app works fully without an account and without any personal information. Tour progress, the stops you have visited, and your place in the audio stay on your phone.",
      "If you allow location access, your position is used to draw your dot on the tour map and to tell you when you are near a stop. It is processed on your phone and never sent to us or to anyone else. The app works fine if you decline.",
      "Signing in inside the app is optional and uses the same account system as the website. The app sends your email and password to our sign-in service to log you in, and nothing else.",
    ],
  },
  {
    title: "Who processes data for us",
    paragraphs: [
      "Accounts and data live with Supabase, our database and sign-in provider. The site is hosted on Vercel. If you sign in with Google on the website, Google shares your name and email with us to create the account. These providers process data on our behalf and under their own security practices.",
    ],
  },
  {
    title: "Deleting your account",
    paragraphs: [
      "You can delete your account at any time. In the iOS app, open Settings, choose your account, and tap Delete account. On the web, email us and we will remove it. Deletion removes your profile and sign-in record permanently.",
      "You can also email contact@rooted-forward.org for a copy of the information tied to your account, or to ask us anything about this policy.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "The site and app are made for general audiences, including students. We do not knowingly collect personal information from children under 13. Accounts are never required to read, listen, or walk.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "If this policy changes, the new version will appear on this page with a new date. This version is effective July 23, 2026.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Privacy
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            What we keep, and what we don&apos;t.
          </h1>
          <p className="mt-5 max-w-[50ch] font-body text-lg leading-relaxed text-ink/75">
            Rooted Forward is a student-run Chicago nonprofit. We collect as
            little as possible, and this page says plainly what that is, for
            both rooted-forward.org and the Walk Hyde Park iOS app.
          </p>
        </div>
      </section>

      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-xl space-y-12 px-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-2xl text-forest">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="font-body text-base leading-relaxed text-ink/80"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <p className="font-body text-base text-cream/65">
            Questions? Email{" "}
            <a
              href="mailto:contact@rooted-forward.org"
              className="text-cream underline decoration-cream/30 underline-offset-2 transition-colors hover:decoration-cream"
            >
              contact@rooted-forward.org
            </a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
