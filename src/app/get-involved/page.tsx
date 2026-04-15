import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import VolunteerForm from "@/components/forms/VolunteerForm";

export const metadata: Metadata = {
  title: "Get Involved | Rooted Forward",
  description:
    "Join the movement. Lead a tour, start a chapter, or support Rooted Forward's mission to document racial inequity through walking tours and podcasts.",
};

const WAYS_TO_PARTICIPATE = [
  {
    title: "Lead a Tour",
    description:
      "Become a youth tour guide in your city. We provide training, research materials, and a community of peers. You bring your voice, your curiosity, and your commitment to telling the truth about the places you call home.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Start a Chapter",
    description:
      "Bring Rooted Forward to your city. Every place has a history of racial inequity written into its streets. We'll help you research, organize, and launch a chapter that documents and shares that history with your community.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Support Our Work",
    description:
      "Your donation keeps our tours free and our podcasts independent. Whether you give once or monthly, sponsor an episode or underwrite a chapter, every dollar helps us document history that matters and make it accessible to everyone.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-6 w-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    ),
  },
];

const CHAPTERS = [
  { city: "Chicago", email: "chicago@rootedforward.org" },
  { city: "New York", email: "newyork@rootedforward.org" },
  { city: "Dallas", email: "dallas@rootedforward.org" },
  { city: "San Francisco", email: "sanfrancisco@rootedforward.org" },
];

export default function GetInvolvedPage() {
  return (
    <PageTransition>
      {/* Page Header */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Get Involved
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl lg:text-6xl">
            This Work Belongs to All of Us
          </h1>
          <hr className="mt-8 border-border" />
          <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-ink/75">
            Rooted Forward exists because young people decided the history of
            their neighborhoods deserved to be told. There are many ways to join
            this effort, whether you want to walk, talk, organize, or give.
          </p>
        </div>
      </section>

      {/* Three Ways to Participate */}
      <section className="bg-cream pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {WAYS_TO_PARTICIPATE.map((item) => (
              <div
                key={item.title}
                className="rounded-sm border border-border bg-cream-dark p-8 md:p-10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/40 text-rust">
                  {item.icon}
                </div>
                <h3 className="mt-6 font-display text-2xl text-forest">
                  {item.title}
                </h3>
                <p className="mt-4 font-body leading-relaxed text-ink/75">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Signup Form */}
      <section className="border-t border-border bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-5 md:gap-16">
            <div className="md:col-span-2">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Volunteer
              </p>
              <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
                Join Our Team
              </h2>
              <p className="mt-4 font-body leading-relaxed text-ink/75">
                Fill out the form and a chapter coordinator will reach out within
                a week. We welcome people of all backgrounds and experience
                levels. If you care about truth-telling and community, you belong
                here.
              </p>
            </div>
            <div className="md:col-span-3">
              <VolunteerForm />
            </div>
          </div>
        </div>
      </section>

      {/* Chapter Contact Section */}
      <section className="border-t border-border bg-cream-dark py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Chapters
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Reach Out Directly
          </h2>
          <p className="mt-4 max-w-xl font-body leading-relaxed text-ink/75">
            Each chapter is led by a local team of youth organizers. Contact them
            directly to learn about upcoming tours, volunteer opportunities, or
            partnership inquiries.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CHAPTERS.map(({ city, email }) => (
              <div
                key={city}
                className="rounded-sm border border-border bg-cream p-6"
              >
                <h3 className="font-display text-xl text-forest">{city}</h3>
                <a
                  href={`mailto:${email}`}
                  className="mt-2 block font-body text-sm text-rust underline decoration-rust/30 underline-offset-2 transition-colors hover:text-rust-dark hover:decoration-rust"
                >
                  {email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
