"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import toast from "react-hot-toast";

const CHICAGO_NEIGHBORHOODS = [
  "Albany Park", "Archer Heights", "Armour Square", "Ashburn", "Auburn Gresham",
  "Austin", "Avalon Park", "Avondale", "Belmont Cragin", "Beverly",
  "Bridgeport", "Brighton Park", "Bronzeville", "Burnside", "Calumet Heights",
  "Chatham", "Chicago Lawn", "Chinatown", "Clearing", "Douglas",
  "Dunning", "East Garfield Park", "East Side", "Edgewater", "Englewood",
  "Fuller Park", "Gage Park", "Garfield Ridge", "Grand Boulevard", "Greater Grand Crossing",
  "Hegewisch", "Hermosa", "Humboldt Park", "Hyde Park", "Irving Park",
  "Jefferson Park", "Kenwood", "Lakeview", "Lincoln Park", "Lincoln Square",
  "Little Village", "Logan Square", "Loop", "Lower West Side", "McKinley Park",
  "Montclare", "Morgan Park", "Mount Greenwood", "Near North Side", "Near South Side",
  "Near West Side", "New City", "North Center", "North Lawndale", "North Park",
  "Norwood Park", "Oakland", "Ohare", "Pilsen", "Portage Park",
  "Pullman", "Riverdale", "Rogers Park", "Roseland", "South Chicago",
  "South Deering", "South Lawndale", "South Shore", "Uptown", "Washington Heights",
  "Washington Park", "West Elsdon", "West Englewood", "West Garfield Park",
  "West Lawn", "West Pullman", "West Ridge", "West Town", "Woodlawn",
] as const;

interface FormData {
  name: string;
  email: string;
  neighborhood: string;
  proposal_title: string;
  problem_description: string;
  proposed_solution: string;
  evidence_sources: string;
  wants_to_collaborate: boolean;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  neighborhood: "",
  proposal_title: "",
  problem_description: "",
  proposed_solution: "",
  evidence_sources: "",
  wants_to_collaborate: false,
};

export default function SubmitProposalPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.proposal_title.trim() || !form.problem_description.trim() || !form.proposed_solution.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/policy/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      setSubmitted(true);
      toast.success("Proposal submitted.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <PageTransition>
        <section className="bg-cream py-28 md:py-36">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h1 className="font-display text-3xl text-forest md:text-4xl">
              Proposal Received
            </h1>
            <p className="mt-6 font-body text-lg leading-relaxed text-ink/75">
              Thank you for submitting your proposal. We review submissions
              monthly and will be in touch if we move forward with developing
              it into a campaign. Expect to hear from us within 30 days.
            </p>
            <Link
              href="/policy"
              className="mt-8 inline-flex items-center rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Back to Policy
            </Link>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="bg-cream pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-2xl px-6">
          <nav className="font-body text-xs text-warm-gray">
            <Link href="/policy" className="hover:text-forest">
              Policy
            </Link>
            {" / "}
            <span className="text-ink/50">Submit a Proposal</span>
          </nav>

          <h1 className="mt-6 font-display text-3xl leading-snug text-forest md:text-4xl">
            Submit a Policy Proposal
          </h1>
          <p className="mt-6 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
            If you&rsquo;ve identified a problem in your neighborhood that
            needs policy action, we want to hear it. Rooted Forward reviews
            submissions monthly. The strongest proposals get developed into
            campaigns, with you involved if you want to be.
          </p>

          <hr className="my-10 border-border" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Name */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                placeholder="you@example.com"
              />
            </div>

            {/* Neighborhood */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Neighborhood
              </label>
              <select
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
              >
                <option value="">Select your neighborhood</option>
                {CHICAGO_NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Proposal Title */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Proposal title <span className="text-rust">*</span>
              </label>
              <input
                type="text"
                value={form.proposal_title}
                onChange={(e) => update("proposal_title", e.target.value)}
                required
                className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                placeholder="A short title for your proposal"
              />
            </div>

            {/* The Problem */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                The problem <span className="text-rust">*</span>
              </label>
              <p className="mt-0.5 font-body text-xs text-warm-gray">
                What is the issue? Who does it affect? Be specific.
              </p>
              <textarea
                value={form.problem_description}
                onChange={(e) => update("problem_description", e.target.value)}
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>

            {/* Proposed Solution */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Proposed solution <span className="text-rust">*</span>
              </label>
              <p className="mt-0.5 font-body text-xs text-warm-gray">
                What specific action should be taken, and by whom?
              </p>
              <textarea
                value={form.proposed_solution}
                onChange={(e) => update("proposed_solution", e.target.value)}
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>

            {/* Evidence */}
            <div>
              <label className="font-body text-sm font-medium text-ink">
                Evidence or sources{" "}
                <span className="font-normal text-warm-gray">(optional)</span>
              </label>
              <textarea
                value={form.evidence_sources}
                onChange={(e) => update("evidence_sources", e.target.value)}
                rows={3}
                className="mt-1 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                placeholder="Links to articles, data, reports, or other sources"
              />
            </div>

            {/* Collaborate checkbox */}
            <label className="flex items-center gap-3 font-body text-sm text-ink/75">
              <input
                type="checkbox"
                checked={form.wants_to_collaborate}
                onChange={(e) => update("wants_to_collaborate", e.target.checked)}
                className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
              />
              I&rsquo;d like to be involved in developing this proposal
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-sm bg-rust px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
            >
              {loading ? "Submitting\u2026" : "Submit Proposal"}
            </button>
          </form>
        </div>
      </section>
    </PageTransition>
  );
}
