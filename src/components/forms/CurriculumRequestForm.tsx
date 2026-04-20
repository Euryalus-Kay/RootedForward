"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const ROLES = ["Teacher", "Professor / Lecturer", "Curriculum coordinator", "Librarian", "Community educator", "Other"] as const;
const SUBJECTS = ["U.S. History", "Civics / Government", "AP Human Geography", "Sociology", "Urban Planning", "Other"] as const;
const TIMELINES = ["This semester", "Next semester", "Next school year", "Just exploring"] as const;

export default function CurriculumRequestForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "" as (typeof ROLES)[number] | "",
    school: "",
    city: "",
    subject: "" as (typeof SUBJECTS)[number] | "",
    studentCount: "",
    timeline: "" as (typeof TIMELINES)[number] | "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.role || !form.school.trim()) {
      toast.error("Name, email, role, and school are required.");
      return;
    }

    setLoading(true);
    try {
      const message = [
        "[CURRICULUM REQUEST]",
        `Role: ${form.role}`,
        `School / Org: ${form.school}`,
        form.city ? `City: ${form.city}` : null,
        form.subject ? `Subject: ${form.subject}` : null,
        form.studentCount ? `Students: ${form.studentCount}` : null,
        form.timeline ? `Timeline: ${form.timeline}` : null,
        form.notes.trim() ? `\nNotes:\n${form.notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          chapter: "Curriculum Request",
          message,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      toast.success("Request received. We'll be in touch within a week.");
    } catch {
      toast.error("Something went wrong. Try emailing us directly.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-cream-dark p-8 md:p-10">
        <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
          Request received
        </p>
        <h3 className="mt-3 font-display text-2xl text-forest md:text-3xl">
          Thanks, {form.name.split(" ")[0]}.
        </h3>
        <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/70">
          Someone from our education team will email you within a week with
          the full kit, slide decks, and a 20-minute call slot if you want
          to walk through it together.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="md:col-span-1">
        <label htmlFor="cur-name" className="mb-1.5 block font-body text-sm font-medium text-ink">
          Your name <span className="text-rust">*</span>
        </label>
        <input
          id="cur-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
          placeholder="First and last"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-email" className="mb-1.5 block font-body text-sm font-medium text-ink">
          Email <span className="text-rust">*</span>
        </label>
        <input
          id="cur-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
          placeholder="you@school.edu"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-role" className="mb-1.5 block font-body text-sm font-medium text-ink">
          Your role <span className="text-rust">*</span>
        </label>
        <select
          id="cur-role"
          required
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
          className={inputClass}
        >
          <option value="">Select a role</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-school" className="mb-1.5 block font-body text-sm font-medium text-ink">
          School or organization <span className="text-rust">*</span>
        </label>
        <input
          id="cur-school"
          type="text"
          required
          value={form.school}
          onChange={(e) => setForm({ ...form, school: e.target.value })}
          className={inputClass}
          placeholder="Lincoln Park HS"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-city" className="mb-1.5 block font-body text-sm font-medium text-ink">
          City
        </label>
        <input
          id="cur-city"
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className={inputClass}
          placeholder="Chicago"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-subject" className="mb-1.5 block font-body text-sm font-medium text-ink">
          Subject
        </label>
        <select
          id="cur-subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value as typeof form.subject })}
          className={inputClass}
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-students" className="mb-1.5 block font-body text-sm font-medium text-ink">
          About how many students
        </label>
        <input
          id="cur-students"
          type="text"
          value={form.studentCount}
          onChange={(e) => setForm({ ...form, studentCount: e.target.value })}
          className={inputClass}
          placeholder="60"
        />
      </div>

      <div className="md:col-span-1">
        <label htmlFor="cur-timeline" className="mb-1.5 block font-body text-sm font-medium text-ink">
          When you&rsquo;d use it
        </label>
        <select
          id="cur-timeline"
          value={form.timeline}
          onChange={(e) => setForm({ ...form, timeline: e.target.value as typeof form.timeline })}
          className={inputClass}
        >
          <option value="">Pick one</option>
          {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="cur-notes" className="mb-1.5 block font-body text-sm font-medium text-ink">
          Anything else we should know
        </label>
        <textarea
          id="cur-notes"
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={inputClass}
          placeholder="A specific unit you want, a question, the day you'd run it..."
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-sm bg-rust px-10 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending..." : "Request the kit"}
        </button>
      </div>
    </form>
  );
}
