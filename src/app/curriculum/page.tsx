import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import CurriculumRequestForm from "@/components/forms/CurriculumRequestForm";

export const metadata: Metadata = {
  title: "Curriculum | Rooted Forward",
  description:
    "Free classroom materials on housing policy, redlining, and displacement. Request the kit for your school.",
};

export default function CurriculumPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Banner */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex flex-col items-center justify-center pt-12 md:pt-16">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/80">
              For Educators
            </p>
            <h1 className="mt-3 font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              Curriculum
            </h1>
          </div>
        </section>

        {/* Intro + Form */}
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-body text-lg leading-relaxed text-ink/80 md:text-xl">
              Free classroom materials for high school and college courses on
              Chicago housing policy, redlining, and displacement. Tell us a
              little about your class and we will send what fits.
            </p>

            <div className="mt-12 md:mt-16">
              <CurriculumRequestForm />
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
