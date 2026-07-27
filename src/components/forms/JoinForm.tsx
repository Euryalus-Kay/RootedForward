"use client";

/* ------------------------------------------------------------------ */
/*  JoinForm                                                           */
/*                                                                     */
/*  The whole of /get-involved. Two tabs, four fields, one button.     */
/*  Rewritten July 26, 2026 after the owner called the previous        */
/*  version over-complicated. Keep it this short. No chapter join or   */
/*  start toggle, no school field, no phone.                           */
/*                                                                     */
/*  It posts to /api/submissions as type volunteer with the city in    */
/*  the chapter field, so the admin queue is unchanged. The message is */
/*  tagged so the two tabs are distinguishable there.                  */
/*                                                                     */
/*  /get-involved#podcast opens on the podcast tab, which is what the  */
/*  podcast page links to.                                             */
/* ------------------------------------------------------------------ */

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const FIELD =
  "w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-base text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30";

const LABEL = "mb-1.5 block font-body text-sm font-medium text-ink";

type Tab = "volunteer" | "podcast";

const TABS: { key: Tab; label: string }[] = [
  { key: "volunteer", label: "Volunteer" },
  { key: "podcast", label: "Be a podcast guest" },
];

export default function JoinForm() {
  const [tab, setTab] = useState<Tab>("volunteer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    city: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  /* The podcast page links to /get-involved#podcast. */
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === "#podcast") setTab("podcast");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "volunteer",
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          chapter: form.city.trim(),
          message: [
            tab === "podcast" ? "[PODCAST GUEST]" : "[VOLUNTEER]",
            form.message.trim() || null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      toast.error("That did not go through. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-sm border border-border bg-cream p-8 md:p-10">
        <h2 className="font-display text-2xl text-forest">
          Thanks. We have it.
        </h2>
        <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/75">
          A student reads every one of these and will write back to{" "}
          {form.email.trim().toLowerCase()}. It usually takes a few days.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-sm border border-b-0 px-5 py-3 font-body text-base transition-colors ${
              tab === t.key
                ? "border-border bg-cream font-semibold text-forest"
                : "border-transparent text-ink/55 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-sm rounded-tl-none border border-border bg-cream p-6 md:p-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="join-name" className={LABEL}>
              Name
            </label>
            <input
              id="join-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="join-email" className={LABEL}>
              Email
            </label>
            <input
              id="join-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className={FIELD}
            />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="join-city" className={LABEL}>
            City
          </label>
          <input
            id="join-city"
            type="text"
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Where you are"
            className={FIELD}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="join-message" className={LABEL}>
            {tab === "podcast"
              ? "What you would want to talk about"
              : "Anything you want us to know"}{" "}
            <span className="font-normal text-warm-gray">(optional)</span>
          </label>
          <textarea
            id="join-message"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={
              tab === "podcast"
                ? "Your block, what changed, what you lived through."
                : "What you would like to work on, your school, how much time you have."
            }
            className={`${FIELD} resize-y`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-7 w-full rounded-sm bg-rust px-6 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
        >
          {loading ? "Sending" : "Send it"}
        </button>
      </form>
    </div>
  );
}
