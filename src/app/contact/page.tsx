import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rooted Forward",
  description:
    "Get in touch with Rooted Forward.",
};

export default function ContactPage() {
  return (
    <PageTransition>
      {/* Opener */}
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Contact
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            Say hello.
          </h1>
          <p className="mt-5 max-w-[50ch] font-body text-lg leading-relaxed text-ink/75">
            Questions, partnerships, press inquiries, or just want to say
            hello. Fill out the form and we will get back to you within a
            few days.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-xl px-6">
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Email */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <p className="font-body text-base text-cream/65">
            Or email us directly at{" "}
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
