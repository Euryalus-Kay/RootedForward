/* ------------------------------------------------------------------ */
/*  /contact                                                           */
/*                                                                     */
/*  A title and a form, same as /get-involved. The owner cut the       */
/*  banner and the "Say hello" copy on July 26, 2026, since a visitor  */
/*  already knows what a contact page is. Do not add an opener or a    */
/*  side panel back without being asked.                               */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rooted Forward",
  description:
    "Write to Rooted Forward. A student reads every message and replies within a few days.",
};

export default function ContactPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            Contact us
          </h1>
        </div>
      </section>

      <section className="bg-cream-dark py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <ContactForm />
            <p className="mt-6 font-body text-base text-ink/70">
              Or email{" "}
              <a
                href="mailto:contact@rooted-forward.org"
                className="text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
              >
                contact@rooted-forward.org
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
