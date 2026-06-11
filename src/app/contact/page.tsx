import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import ContactForm from "@/components/forms/ContactForm";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Contact | Rooted Forward",
  description: "Get in touch with Rooted Forward.",
};

const CONTACT_EMAIL = "contact@rooted-forward.org";

const DETAILS: { label: string; value: string; href?: string }[] = [
  { label: "Email", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: "Response", value: "Within a few days" },
  { label: "Write about", value: "Questions, partnerships, press" },
];

export default function ContactPage() {
  return (
    <PageTransition>
      <PageBanner
        compact
        eyebrow="Contact / Correspondence"
        title="Get in touch"
        dek="Questions, partnerships, press inquiries, or just want to say hello."
      />

      {/* Split layout: ledger details on the left, the form on the right */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-10 lg:gap-16">
            {/* Details rail */}
            <div className="md:col-span-5 lg:col-span-4">
              <Reveal y={16}>
                <h2 className="font-display text-3xl text-forest md:text-4xl">
                  Write to us
                </h2>
                <p className="mt-4 font-body text-base leading-relaxed text-ink/70">
                  Fill out the form and we will get back to you within a few
                  days.
                </p>
              </Reveal>

              <Reveal delay={0.12} y={14}>
                <dl className="mt-10 border-t border-border">
                  {DETAILS.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-1.5 border-b border-border py-5"
                    >
                      <dt className="ledger text-warm-gray">{row.label}</dt>
                      <dd>
                        {row.href ? (
                          <a
                            href={row.href}
                            className="link-draw font-mono text-sm tracking-wide text-forest"
                          >
                            {row.value}
                          </a>
                        ) : (
                          <span className="font-mono text-sm tracking-wide text-ink/80">
                            {row.value}
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* Form */}
            <div className="md:col-span-7 lg:col-span-8">
              <Reveal delay={0.08} y={20}>
                <div className="border border-border bg-white/40 p-7 md:p-10">
                  <ContactForm />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Closer: point people who want to do more at get-involved */}
      <section className="grain relative overflow-hidden bg-forest py-16 md:py-20">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center lg:px-8">
          <Reveal y={16}>
            <p className="ledger text-cream/50">Beyond the inbox</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl leading-tight text-cream md:text-4xl">
              If you would rather pitch in, start here.
            </h2>
          </Reveal>
          <Reveal delay={0.12} y={12}>
            <Link
              href="/get-involved"
              className="group inline-flex items-center gap-2 rounded-sm border border-cream/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream/60"
            >
              Get involved
              <span aria-hidden="true" className="arrow-nudge">
                &rarr;
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
