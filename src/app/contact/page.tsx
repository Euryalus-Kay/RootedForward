/* ------------------------------------------------------------------ */
/*  /contact                                                           */
/*                                                                     */
/*  Rebuilt July 2026 to match /tours and /get-involved. The form sits */
/*  on the page immediately, with the direct email address and the     */
/*  volunteer pointer beside it rather than stacked underneath.        */
/*  No small uppercase eyebrows.                                       */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rooted Forward",
  description:
    "Write to Rooted Forward. Questions about the walking tours, the research, press, or partnerships. A student reads every message and replies within a few days.",
};

export default function ContactPage() {
  return (
    <PageTransition>
      {/* ============================================================
          OPENER
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            Say hello.
          </h1>
          <p className="mt-6 max-w-[54ch] font-body text-lg leading-relaxed text-ink/80">
            Questions about a tour, something we got wrong in the research,
            press, a partnership, or anything else. A student reads every
            message and answers within a few days.
          </p>
        </div>
      </section>

      {/* ============================================================
          THE FORM
          ============================================================ */}
      <section className="bg-cream-dark py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-8">
              <ContactForm />
            </div>

            <div className="md:col-span-4">
              <div className="rounded-sm border border-border bg-cream p-6">
                <h2 className="font-display text-2xl leading-tight text-forest">
                  Rather use email?
                </h2>
                <p className="mt-3 font-body text-base leading-relaxed text-ink/75">
                  Write to{" "}
                  <a
                    href="mailto:contact@rooted-forward.org"
                    className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
                  >
                    contact@rooted-forward.org
                  </a>{" "}
                  and it reaches the same people.
                </p>
              </div>

              <div className="mt-6 rounded-sm border border-border bg-cream p-6">
                <h2 className="font-display text-2xl leading-tight text-forest">
                  Want to help instead?
                </h2>
                <p className="mt-3 font-body text-base leading-relaxed text-ink/75">
                  We are students and we need more hands, in Chicago and in
                  other cities.
                </p>
                <Link
                  href="/get-involved"
                  className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  Get involved{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
