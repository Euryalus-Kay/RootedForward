"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import { Reveal } from "@/components/motion/Reveal";
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

const inputCls =
  "mt-1.5 w-full rounded-sm border border-border bg-white/40 px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30";

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
        <PageBanner
          compact
          eyebrow="Policy / Community Proposals"
          title="Proposal Received"
        />
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-6">
            <Reveal>
              <p className="font-body text-lg leading-relaxed text-ink/75">
                Thank you for submitting your proposal. We review submissions
                monthly and will be in touch if we move forward with developing
                it into a campaign. Expect to hear from us within 30 days.
              </p>
              <Link
                href="/policy"
                className="mt-9 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Back to Policy
              </Link>
            </Reveal>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageBanner
        compact
        eyebrow="Policy / Community Proposals"
        title="Submit a Policy Proposal"
        dek="If you have identified a problem in your neighborhood that needs policy action, we want to hear it. The strongest proposals get developed into campaigns, with you involved if you want to be."
        meta={["Reviewed monthly", "No account required", "Response within 30 days"]}
      />

      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Form */}
            <div className="max-w-2xl lg:col-span-7">
              <Reveal>
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
                      className={inputCls}
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
                      className={inputCls}
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
                      className={inputCls}
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
                      className={inputCls}
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
                      className={`${inputCls} resize-y`}
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
                      className={`${inputCls} resize-y`}
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
                      className={`${inputCls} resize-y`}
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
                    className="mt-2 w-full rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
                  >
                    {loading ? "Submitting…" : "Submit Proposal"}
                  </button>
                </form>
              </Reveal>
            </div>

            {/* What happens next, right rail */}
            <aside className="lg:col-span-5">
              <Reveal delay={0.15}>
                <div className="border border-border bg-white/40 p-7 lg:sticky lg:top-24">
                  <p className="ledger text-warm-gray">What happens next</p>
                  <ol className="mt-5 flex flex-col">
                    {[
                      "Submissions are reviewed monthly. We respond within 30 days.",
                      "Strong proposals get developed into full campaigns with research backing, public comment infrastructure, and a delivery plan.",
                      "You stay involved if you want to be.",
                    ].map((step, i) => (
                      <li
                        key={i}
                        className={`flex gap-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}
                      >
                        <span className="index-numeral shrink-0 text-sm text-rust">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="font-body text-sm leading-relaxed text-ink/70">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2 border-t border-border pt-5">
                    <p className="font-body text-xs leading-relaxed text-warm-gray">
                      Not sure how to structure it? Read our{" "}
                      <Link
                        href="/policy/guides/write-policy-proposal"
                        className="text-rust underline decoration-rust/30 underline-offset-2 hover:decoration-rust"
                      >
                        guide on writing a policy proposal
                      </Link>{" "}
                      first.
                    </p>
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
