/* ------------------------------------------------------------------ */
/*  /app-verification                                                  */
/*                                                                     */
/*  The page App Review loads to confirm that the iPhone app named     */
/*  Rooted Forward is published by Rooted Forward.                     */
/*                                                                     */
/*  Apple rejected version 1.0 under Guideline 4.1(a), Copycats, on    */
/*  July 24 2026. The developer account is an individual membership    */
/*  rather than an organization named Rooted Forward, so the listing   */
/*  read to the reviewer as an unauthorized use of the nonprofit's     */
/*  name. Apple's stated remedy is documentary evidence of authority.  */
/*  A statement published on the organization's own domain is the      */
/*  piece a reviewer can verify without taking anyone's word for it,   */
/*  so this page exists and its URL is cited in the App Review notes.  */
/*                                                                     */
/*  It names the Apple Developer Team ID rather than the account       */
/*  holder, because the Team ID identifies the membership exactly and  */
/*  a private individual's name does not belong on a public page.      */
/*  The account holder is named in the signed authorization letter     */
/*  attached privately to the review.                                  */
/*                                                                     */
/*  Keep this page live. Removing it would strand the citation in the  */
/*  review notes and invite the same rejection on the next version.    */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "App Verification | Rooted Forward",
  description:
    "Rooted Forward publishes the Rooted Forward app for iPhone. This page confirms the Apple Developer account authorized to distribute it.",
};

const FACTS: { term: string; value: string }[] = [
  { term: "App name", value: "Rooted Forward" },
  { term: "Bundle identifier", value: "org.rootedforward.walk" },
  { term: "Apple Developer Team ID", value: "Q3J68NFZCP" },
  { term: "Platform", value: "iPhone, iOS 17 or newer" },
  { term: "Price", value: "Free, with no advertising and no in-app purchases" },
  { term: "Publisher", value: "Rooted Forward, rooted-forward.org" },
];

export default function AppVerificationPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            App verification
          </h1>
          <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/80">
            Rooted Forward publishes the iPhone application named Rooted
            Forward. This page confirms which Apple Developer account is
            authorized to distribute it, so that anyone reviewing the listing
            can verify the app is ours.
          </p>
        </div>
      </section>

      <section className="bg-cream-dark py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl text-forest md:text-4xl">
              The authorization
            </h2>
            <div className="mt-6 flex max-w-[62ch] flex-col gap-5 font-body text-base leading-relaxed text-ink/80 md:text-lg md:leading-relaxed">
              <p>
                Rooted Forward is a student-run nonprofit based in Chicago. We
                research and publish free walking tours, an online exhibit, a
                podcast, and housing policy work. Rooted Forward was started by
                Zain Zaidi, who is named on our{" "}
                <a
                  href="/about"
                  className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
                >
                  about page
                </a>{" "}
                and who directs the app.
              </p>
              <p>
                Rooted Forward owns the name Rooted Forward, the tour text, the
                narration, the maps, and the design used in the application. We
                authorize the Apple Developer Program membership with Team ID
                Q3J68NFZCP to publish and distribute that application under our
                name, and to use our name and our content in the application and
                in its App Store listing. That membership is held on our behalf,
                and it is the only Apple Developer account we have authorized.
              </p>
              <p>
                The walking tour inside the app is the same tour published free
                on this website, which anyone can read at{" "}
                <a
                  href="/tours"
                  className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
                >
                  rooted-forward.org/tours
                </a>
                . Every photograph in the app carries its credit under the
                picture, and the sources for each stop are listed on the stop.
              </p>
            </div>

            <div className="mt-10 rounded-sm border border-border bg-cream p-6 md:p-8">
              <h3 className="font-display text-xl text-forest">
                The application
              </h3>
              <dl className="mt-5 flex flex-col gap-3">
                {FACTS.map((fact) => (
                  <div
                    key={fact.term}
                    className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:gap-6"
                  >
                    <dt className="font-body text-sm font-semibold text-warm-gray sm:w-56 sm:shrink-0">
                      {fact.term}
                    </dt>
                    <dd className="font-body text-base text-ink/85">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-8 max-w-[62ch] font-body text-base leading-relaxed text-ink/70">
              To confirm any of this, write to{" "}
              <a
                href="mailto:contact@rooted-forward.org"
                className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
              >
                contact@rooted-forward.org
              </a>
              , which is the address on our{" "}
              <a
                href="/contact"
                className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
              >
                contact page
              </a>{" "}
              and reaches the same people who publish this site.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
