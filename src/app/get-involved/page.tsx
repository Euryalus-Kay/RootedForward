"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";

const CONTACT_EMAIL = "contact@rooted-forward.org";
const CHAPTER_CITIES = ["Chicago", "New York", "Dallas", "San Francisco"];

/* v2 input language: monospace ledger labels over bottom-hairline
   fields, matching the footer newsletter. */
const FIELD =
  "w-full border-b border-ink/25 bg-transparent px-0 py-2.5 font-body text-base text-ink placeholder:text-warm-gray-light transition-colors focus:border-rust focus:outline-none";
const LABEL = "ledger block text-ink/55";

function SelectChevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-warm-gray"
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

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
      <div className="border border-border bg-white/40 p-8 md:p-10">
        <p className="ledger text-rust">Received</p>
        <h3 className="mt-3 font-display text-2xl text-forest">
          {form.interest === "start" ? "Request received" : "Application received"}
        </h3>
        <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-ink/65">
          {form.interest === "start"
            ? "We will reach out within two weeks with next steps, templates, and a research kit."
            : "A chapter coordinator will reach out within a week."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Interest type */}
      <fieldset>
        <legend className={LABEL}>
          I want to <span className="text-rust">*</span>
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
          {(
            [
              { value: "join", index: "01", label: "Join an existing chapter" },
              { value: "start", index: "02", label: "Start a new chapter" },
            ] as const
          ).map((opt) => {
            const selected = form.interest === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setForm({ ...form, interest: opt.value })}
                className={`px-5 py-4 text-left transition-colors ${
                  selected
                    ? "bg-forest"
                    : "bg-cream hover:bg-cream-dark/70"
                }`}
              >
                <span
                  className={`ledger ${
                    selected ? "text-cream/60" : "text-warm-gray"
                  }`}
                >
                  {opt.index}
                </span>
                <span
                  className={`mt-1 block font-body text-sm font-semibold ${
                    selected ? "text-cream" : "text-ink/75"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="chapter-name" className={LABEL}>
            Name <span className="text-rust">*</span>
          </label>
          <input
            id="chapter-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={FIELD}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="chapter-email" className={LABEL}>
            Email <span className="text-rust">*</span>
          </label>
          <input
            id="chapter-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={FIELD}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="chapter-phone" className={LABEL}>
          Phone <span className="normal-case text-warm-gray">(optional)</span>
        </label>
        <input
          id="chapter-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={FIELD}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Conditional: Join fields */}
      {form.interest === "join" && (
        <div>
          <label htmlFor="chapter-select" className={LABEL}>
            Chapter <span className="text-rust">*</span>
          </label>
          <div className="relative">
            <select
              id="chapter-select"
              required
              value={form.chapter}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              className={`${FIELD} cursor-pointer appearance-none pr-8`}
            >
              <option value="">Select a chapter</option>
              {CHAPTER_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>
      )}

      {/* Conditional: Start fields */}
      {form.interest === "start" && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <label htmlFor="chapter-city" className={LABEL}>
              City <span className="text-rust">*</span>
            </label>
            <input
              id="chapter-city"
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={FIELD}
              placeholder="Where you want to start a chapter"
            />
          </div>
          <div>
            <label htmlFor="chapter-school" className={LABEL}>
              School / Org{" "}
              <span className="normal-case text-warm-gray">(optional)</span>
            </label>
            <input
              id="chapter-school"
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              className={FIELD}
              placeholder="Your school or organization"
            />
          </div>
        </div>
      )}

      {/* Message */}
      {form.interest && (
        <div>
          <label htmlFor="chapter-message" className={LABEL}>
            Tell us more{" "}
            <span className="normal-case text-warm-gray">(optional)</span>
          </label>
          <textarea
            id="chapter-message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={3}
            className={`${FIELD} resize-y`}
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
        className="group mt-1 inline-flex items-center justify-center gap-2 self-start rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : form.interest === "start"
            ? "Request a chapter kit"
            : form.interest === "join"
              ? "Submit application"
              : "Select an option above"}
        {!loading && form.interest && (
          <span aria-hidden="true" className="arrow-nudge">
            &rarr;
          </span>
        )}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const WAYS = [
  {
    index: "01",
    audience: "For students",
    title: "Join or start a chapter",
    body: "Chapters research their city's history, build tours, film documentaries, and develop curriculum. Join an existing chapter or start one in your city.",
    links: [{ label: "Go to the form", href: "#chapter-form", anchor: true }],
  },
  {
    index: "02",
    audience: "For Chicago residents",
    title: "Support a campaign",
    body: "Sign a campaign, submit a public comment, or propose a policy idea. Takes ten minutes.",
    links: [{ label: "View active campaigns", href: "/policy", anchor: false }],
  },
  {
    index: "03",
    audience: "For everyone",
    title: "Explore the work",
    body: "Walk the tours, listen to the podcast, or use our policy tools.",
    links: [
      { label: "Tours", href: "/tours", anchor: false },
      { label: "Podcast", href: "/podcasts", anchor: false },
    ],
  },
];

export default function GetInvolvedPage() {
  return (
    <PageTransition>
      <PageBanner
        eyebrow="Get Involved / Ways In"
        title="Where you come in"
        dek="Three ways into the work, whether you have a school year or ten minutes."
        meta={["For students", "For Chicago residents", "For everyone"]}
      />

      {/* ============================================================
          01 — THREE WAYS IN
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            index="01"
            eyebrow="Pathways"
            title="Three ways in"
            lede="Different commitments, same work. Start where you are."
          />

          <div className="mt-12 grid grid-cols-1 gap-px bg-border md:grid-cols-3">
            {WAYS.map((way) => (
              <Reveal key={way.index} className="h-full">
                <div className="flex h-full flex-col bg-cream p-8 transition-colors hover:bg-cream-dark md:p-10">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                    {way.audience}
                  </p>
                  <h3 className="mt-4 font-display text-2xl leading-tight text-forest md:text-3xl">
                    {way.title}
                  </h3>
                  <p className="mt-5 flex-1 font-body text-[15px] leading-relaxed text-ink/70">
                    {way.body}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {way.links.map((link) =>
                      link.anchor ? (
                        <a
                          key={link.href}
                          href={link.href}
                          className="group inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                        >
                          {link.label}
                          <span aria-hidden="true" className="arrow-nudge">
                            &darr;
                          </span>
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="group inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                        >
                          {link.label}
                          <span aria-hidden="true" className="arrow-nudge">
                            &rarr;
                          </span>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          02 — THE CHAPTER FORM
          ============================================================ */}
      <section
        id="chapter-form"
        className="scroll-mt-24 border-t border-border bg-cream py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-10 lg:gap-16">
            {/* Rail */}
            <div className="md:col-span-5 lg:col-span-4">
              <SectionHeading
                index="02"
                eyebrow="Chapters"
                title="Join or start one"
                lede="Chapters research their city's history, build tours, film documentaries, and develop curriculum."
              />

              <Reveal delay={0.15} y={14}>
                <p className="ledger mt-10 text-warm-gray">Current chapters</p>
                <ul className="mt-3 border-t border-border">
                  {CHAPTER_CITIES.map((city, i) => (
                    <li
                      key={city}
                      className="flex items-baseline justify-between border-b border-border py-3"
                    >
                      <span className="font-mono text-sm tracking-wide text-ink/80">
                        {city}
                      </span>
                      <span className="ledger text-warm-gray">
                        0{i + 1}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 font-body text-sm leading-relaxed text-ink/60">
                  No chapter near you? Pick start, and we will send next
                  steps, templates, and a research kit.
                </p>
              </Reveal>
            </div>

            {/* Form */}
            <div className="md:col-span-7 lg:col-span-8">
              <Reveal delay={0.1} y={20}>
                <ChapterForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CLOSER — questions / contact
          ============================================================ */}
      <section className="grain relative overflow-hidden bg-forest py-16 md:py-24">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-6 md:flex-row md:items-center lg:px-8">
          <Reveal y={16}>
            <p className="ledger text-cream/50">Questions</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-cream md:text-4xl">
              Not sure where you fit?
            </h2>
            <p className="mt-4 max-w-md font-body text-base leading-relaxed text-cream/70">
              Reach us directly, or send a note through the contact page.
            </p>
          </Reveal>
          <Reveal delay={0.12} y={12}>
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8">
              <Magnetic>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Contact us
                </Link>
              </Magnetic>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="link-draw font-mono text-sm tracking-wide text-cream/75 hover:text-cream"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
