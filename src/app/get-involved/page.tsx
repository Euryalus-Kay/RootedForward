"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Chapter Interest Form (join or start)                              */
/* ------------------------------------------------------------------ */

function ChapterForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "" as "" | "join" | "start",
    chapter: "",
    city: "",
    school: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.interest) {
      toast.error("Please fill in name, email, and select join or start.");
      return;
    }
    if (form.interest === "join" && !form.chapter) {
      toast.error("Please select a chapter.");
      return;
    }
    if (form.interest === "start" && !form.city.trim()) {
      toast.error("Please enter the city where you want to start a chapter.");
      return;
    }

    setLoading(true);
    try {
      const isStart = form.interest === "start";

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "volunteer",
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          chapter: isStart ? form.city.trim() : form.chapter,
          message: [
            isStart ? "[NEW CHAPTER REQUEST]" : "[JOIN CHAPTER]",
            isStart && form.school ? `School/Org: ${form.school}` : null,
            form.message.trim() || null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      toast.success("Submitted successfully.");
    } catch {
      toast.error("Failed to submit. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-cream-dark p-8 text-center">
        <h3 className="font-display text-xl text-forest">
          {form.interest === "start" ? "Request Received" : "Application Received"}
        </h3>
        <p className="mt-3 font-body text-sm text-ink/65">
          {form.interest === "start"
            ? "We will reach out within two weeks with next steps, templates, and a research kit."
            : "A chapter coordinator will reach out within a week."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Interest type */}
      <div>
        <label className="font-body text-sm font-medium text-ink">
          I want to <span className="text-rust">*</span>
        </label>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, interest: "join" })}
            className={`flex-1 rounded-sm border-2 px-4 py-3 font-body text-sm font-semibold transition-colors ${
              form.interest === "join"
                ? "border-rust bg-rust/10 text-rust"
                : "border-border text-ink/60 hover:border-warm-gray"
            }`}
          >
            Join an existing chapter
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, interest: "start" })}
            className={`flex-1 rounded-sm border-2 px-4 py-3 font-body text-sm font-semibold transition-colors ${
              form.interest === "start"
                ? "border-rust bg-rust/10 text-rust"
                : "border-border text-ink/60 hover:border-warm-gray"
            }`}
          >
            Start a new chapter
          </button>
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="font-body text-sm font-medium text-ink">
            Name <span className="text-rust">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-ink">
            Email <span className="text-rust">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="font-body text-sm font-medium text-ink">
          Phone <span className="font-normal text-warm-gray">(optional)</span>
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Conditional: Join fields */}
      {form.interest === "join" && (
        <div>
          <label className="font-body text-sm font-medium text-ink">
            Chapter <span className="text-rust">*</span>
          </label>
          <select
            required
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
          >
            <option value="">Select a chapter</option>
            <option value="Chicago">Chicago</option>
            <option value="New York">New York</option>
            <option value="Dallas">Dallas</option>
            <option value="San Francisco">San Francisco</option>
          </select>
        </div>
      )}

      {/* Conditional: Start fields */}
      {form.interest === "start" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="font-body text-sm font-medium text-ink">
              City <span className="text-rust">*</span>
            </label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
              placeholder="Where you want to start a chapter"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-ink">
              School / Org{" "}
              <span className="font-normal text-warm-gray">(optional)</span>
            </label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
              placeholder="Your school or organization"
            />
          </div>
        </div>
      )}

      {/* Message */}
      {form.interest && (
        <div>
          <label className="font-body text-sm font-medium text-ink">
            Tell us more{" "}
            <span className="font-normal text-warm-gray">(optional)</span>
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={3}
            className="mt-1 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder={
              form.interest === "start"
                ? "Why you want to start a chapter, any organizing experience, etc."
                : "A bit about yourself and what draws you to this work"
            }
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !form.interest}
        className="w-full rounded-sm bg-rust px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : form.interest === "start"
            ? "Request a Chapter Kit"
            : form.interest === "join"
              ? "Submit Application"
              : "Select an option above"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function GetInvolvedPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <section className="relative pt-16 pb-12 md:pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            Get Involved
          </h1>
        </div>
      </section>

      {/* Chapter form */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Students
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Join or Start a Chapter
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Chapters research their city&rsquo;s history, build tours,
                film documentaries, and develop curriculum. Join an existing
                chapter or start one in your city.
              </p>
            </div>
            <div className="md:col-span-8">
              <ChapterForm />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6">
        <hr className="border-border" />
      </div>

      {/* Campaign + Explore */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Campaign */}
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Chicago Residents
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest">
                Support a Campaign
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Sign a campaign, submit a public comment, or propose a policy
                idea. Takes ten minutes.
              </p>
              <Link
                href="/policy"
                className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-rust px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                View Active Campaigns
              </Link>
            </div>

            {/* Explore */}
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Everyone
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest">
                Explore Our Work
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Walk the tours, listen to the podcast, or use our policy tools.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/tours"
                  className="inline-flex w-full items-center justify-center rounded-sm border-2 border-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
                >
                  Walk the Tours
                </Link>
                <Link
                  href="/podcasts"
                  className="inline-flex w-full items-center justify-center rounded-sm border-2 border-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
                >
                  Listen to the Podcast
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-base text-cream/65">
            Questions? Reach us at{" "}
            <a
              href="mailto:contact@rooted-forward.org"
              className="text-cream underline decoration-cream/30 underline-offset-2 transition-colors hover:decoration-cream"
            >
              contact@rooted-forward.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
