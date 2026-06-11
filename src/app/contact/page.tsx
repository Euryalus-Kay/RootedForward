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
      {/* Banner */}
      <section className="relative pt-16 pb-12 md:pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            Contact
          </h1>
        </div>
      </section>

      {/* Form */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <p className="font-body text-base leading-relaxed text-ink/70">
            Questions, partnerships, press inquiries, or just want to say
            hello. Fill out the form and we will get back to you within a few
            days.
          </p>
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
