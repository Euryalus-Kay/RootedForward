/* ------------------------------------------------------------------ */
/*  /get-involved                                                      */
/*                                                                     */
/*  A title and a form. That is the whole page, by the owner's         */
/*  instruction on July 26, 2026, after a longer version with          */
/*  explainer blocks was called over-complicated. Do not add sections  */
/*  back to this page without being asked.                             */
/*                                                                     */
/*  The two tabs (volunteer, podcast guest) live in the form itself,   */
/*  src/components/forms/JoinForm.tsx. The podcast page links to       */
/*  /get-involved#podcast, which opens on the podcast tab.             */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import JoinForm from "@/components/forms/JoinForm";

export const metadata: Metadata = {
  title: "Get Involved | Rooted Forward",
  description:
    "Volunteer with Rooted Forward or come on the podcast. Put your name down and a student will write back. No experience needed.",
};

export default function GetInvolvedPage() {
  return (
    <PageTransition>
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            Get involved
          </h1>
          <p className="mt-6 max-w-[50ch] font-body text-lg leading-relaxed text-ink/80">
            Put your name down and a student will write back. No experience
            needed, and it does not cost anything.
          </p>
        </div>
      </section>

      <section className="bg-cream-dark py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <JoinForm />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
