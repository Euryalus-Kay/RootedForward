"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Join Chapter Form                                                  */
/* ------------------------------------------------------------------ */

function JoinChapterForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", chapter: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.chapter) {
      toast.error("Please fill in name, email, and chapter.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("submissions").insert({
        type: "volunteer" as const,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        chapter: form.chapter,
        message: form.message.trim() || null,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Application submitted.");
    } catch {
      toast.error("Failed to submit. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-cream-dark p-8 text-center">
        <h3 className="font-display text-xl text-forest">Application Received</h3>
        <p className="mt-3 font-body text-sm text-ink/65">
          A chapter coordinator will reach out within a week. Thank you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="font-body text-sm font-medium text-ink">Name <span className="text-rust">*</span></label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="Your name" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-ink">Email <span className="text-rust">*</span></label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="font-body text-sm font-medium text-ink">Phone <span className="font-normal text-warm-gray">(optional)</span></label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="(555) 123-4567" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-ink">Chapter <span className="text-rust">*</span></label>
          <select required value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30">
            <option value="">Select a chapter</option>
            <option value="Chicago">Chicago</option>
            <option value="New York">New York</option>
            <option value="Dallas">Dallas</option>
            <option value="San Francisco">San Francisco</option>
          </select>
        </div>
      </div>
      <div>
        <label className="font-body text-sm font-medium text-ink">Why do you want to join? <span className="font-normal text-warm-gray">(optional)</span></label>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
          className="mt-1 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
          placeholder="A few sentences about yourself and what draws you to this work" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-sm bg-rust px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50">
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Start Chapter Form                                                 */
/* ------------------------------------------------------------------ */

function StartChapterForm() {
  const [form, setForm] = useState({ name: "", email: "", city: "", school: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.city.trim()) {
      toast.error("Please fill in name, email, and city.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("submissions").insert({
        type: "contact" as const,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        chapter: form.city.trim(),
        message: `NEW CHAPTER REQUEST\nCity: ${form.city}\nSchool/Org: ${form.school}\n\n${form.message}`,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Request submitted.");
    } catch {
      toast.error("Failed to submit. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-cream-dark p-8 text-center">
        <h3 className="font-display text-xl text-forest">Request Received</h3>
        <p className="mt-3 font-body text-sm text-ink/65">
          We will reach out within two weeks with next steps, templates, and a research kit. Thank you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="font-body text-sm font-medium text-ink">Name <span className="text-rust">*</span></label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="Your name" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-ink">Email <span className="text-rust">*</span></label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="font-body text-sm font-medium text-ink">City <span className="text-rust">*</span></label>
          <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="Where you want to start a chapter" />
        </div>
        <div>
          <label className="font-body text-sm font-medium text-ink">School / Organization <span className="font-normal text-warm-gray">(optional)</span></label>
          <input type="text" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
            placeholder="Your school or organization" />
        </div>
      </div>
      <div>
        <label className="font-body text-sm font-medium text-ink">Tell us about your interest</label>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3}
          className="mt-1 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
          placeholder="Why you want to start a chapter, any experience with community organizing, etc." />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-sm bg-forest px-6 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light disabled:opacity-50">
        {loading ? "Submitting..." : "Request a Chapter Kit"}
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
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-redlining.jpg')" }} />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            Get Involved
          </h1>
        </div>
      </section>

      {/* ============================================================
          JOIN A CHAPTER
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Students
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Join a Chapter
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Chapters are where the work happens. Each one researches its
                city&rsquo;s history of inequity, builds tours, films
                documentaries, and develops curriculum. Fill out the form and a
                coordinator will reach out within a week.
              </p>
            </div>
            <div className="md:col-span-8">
              <JoinChapterForm />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6"><hr className="border-border" /></div>

      {/* ============================================================
          START A CHAPTER
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Organizers
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Start a Chapter
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                We help students launch chapters in new cities with templates,
                a research kit, and direct mentorship through the first year.
                Tell us where you are and we will send you everything you need
                to get started.
              </p>
            </div>
            <div className="md:col-span-8">
              <StartChapterForm />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6"><hr className="border-border" /></div>

      {/* ============================================================
          SUPPORT A CAMPAIGN
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Chicago Residents
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Support a Campaign
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Writing a public comment takes about ten minutes and puts your
                name in the official record. Signing onto collective letters
                adds your weight to coalitions pushing for legislative changes.
              </p>
            </div>
            <div className="flex flex-col justify-center md:col-span-8">
              <Link
                href="/policy"
                className="inline-flex w-full items-center justify-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                View Active Campaigns
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6"><hr className="border-border" /></div>

      {/* ============================================================
          EXPLORE OUR WORK
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-ink/50">
                For Everyone
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">
                Explore Our Work
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/60">
                Walk the tours, listen to the podcast, share a documentary with
                someone who would benefit from seeing it, or bring our
                curriculum to a teacher you know.
              </p>
            </div>
            <div className="flex flex-col gap-4 md:col-span-8">
              <Link
                href="/tours"
                className="inline-flex w-full items-center justify-center rounded-sm border-2 border-forest px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
              >
                Walk the Tours
              </Link>
              <Link
                href="/podcasts"
                className="inline-flex w-full items-center justify-center rounded-sm border-2 border-forest px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
              >
                Listen to the Podcast
              </Link>
              <Link
                href="/policy"
                className="inline-flex w-full items-center justify-center rounded-sm border-2 border-forest px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
              >
                Policy Learning Zone
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-base leading-relaxed text-cream/65">
            Questions? Reach us at{" "}
            <a
              href="mailto:hello@rootedforward.org"
              className="text-cream underline decoration-cream/30 underline-offset-2 transition-colors hover:decoration-cream"
            >
              hello@rootedforward.org
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
