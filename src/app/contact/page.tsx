import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import ContactForm from "@/components/forms/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Rooted Forward",
  description:
    "Get in touch with Rooted Forward. Reach our team for questions about tours, podcasts, partnerships, or starting a chapter in your city.",
};

const CHAPTERS = [
  { city: "Chicago", email: "chicago@rootedforward.org" },
  { city: "New York", email: "newyork@rootedforward.org" },
  { city: "Dallas", email: "dallas@rootedforward.org" },
  { city: "San Francisco", email: "sanfrancisco@rootedforward.org" },
];

export default function ContactPage() {
  return (
    <PageTransition>
      {/* Page Header */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Contact
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl lg:text-6xl">
            Let&rsquo;s Connect
          </h1>
          <hr className="mt-8 border-border" />
        </div>
      </section>

      {/* Two-Column Layout */}
      <section className="bg-cream pb-24 md:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-20">
            {/* Left: Contact Form */}
            <div>
              <h2 className="font-display text-3xl text-forest">
                Send Us a Message
              </h2>
              <p className="mt-4 font-body leading-relaxed text-ink/75">
                Whether you have a question about our tours, want to collaborate
                on a project, or just want to say hello, we&rsquo;d love
                to hear from you. Fill out the form and someone from our team
                will get back to you within a few days.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>

            {/* Right: Chapter Info & General Contact */}
            <div>
              <h2 className="font-display text-3xl text-forest">
                Chapter Contacts
              </h2>
              <p className="mt-4 font-body leading-relaxed text-ink/75">
                Each of our city chapters is led by a local team of youth
                organizers. Reach out directly for tour schedules, volunteer
                opportunities, or partnership inquiries.
              </p>

              <div className="mt-8 space-y-4">
                {CHAPTERS.map(({ city, email }) => (
                  <div
                    key={city}
                    className="rounded-sm border border-border bg-cream-dark p-5"
                  >
                    <h3 className="font-display text-lg text-forest">
                      {city}
                    </h3>
                    <a
                      href={`mailto:${email}`}
                      className="mt-1 block font-body text-sm text-rust underline decoration-rust/30 underline-offset-2 transition-colors hover:text-rust-dark hover:decoration-rust"
                    >
                      {email}
                    </a>
                  </div>
                ))}
              </div>

              {/* General Info */}
              <div className="mt-10 rounded-sm border border-border bg-cream-dark p-6">
                <h3 className="font-display text-lg text-forest">
                  General Inquiries
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink/70">
                  For press, partnerships, and general questions:
                </p>
                <a
                  href="mailto:hello@rootedforward.org"
                  className="mt-1 block font-body text-sm text-rust underline decoration-rust/30 underline-offset-2 transition-colors hover:text-rust-dark hover:decoration-rust"
                >
                  hello@rootedforward.org
                </a>
              </div>

              <div className="mt-6 rounded-sm border border-border bg-cream-dark p-6">
                <h3 className="font-display text-lg text-forest">
                  Media &amp; Press
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink/70">
                  For interview requests, media assets, and press inquiries:
                </p>
                <a
                  href="mailto:press@rootedforward.org"
                  className="mt-1 block font-body text-sm text-rust underline decoration-rust/30 underline-offset-2 transition-colors hover:text-rust-dark hover:decoration-rust"
                >
                  press@rootedforward.org
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
