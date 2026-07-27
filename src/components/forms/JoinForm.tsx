"use client";

/* ------------------------------------------------------------------ */
/*  JoinForm                                                           */
/*                                                                     */
/*  The one form on /get-involved. Three choices at the top, then the  */
/*  fewest fields we can ask for. It posts the same payload the old    */
/*  chapter form did (type volunteer, with the chapter or the city in  */
/*  the chapter field), so /api/submissions and the admin list keep    */
/*  working unchanged. The message is tagged so the admin queue can    */
/*  tell the three apart.                                              */
/*                                                                     */
/*  Rebuilt July 2026 alongside /tours. No uppercase tracked labels,   */
/*  no required phone number, no school field. Anything extra goes in  */
/*  the open message box.                                              */
/*                                                                     */
/*  /get-involved#podcast preselects the podcast-guest option, which   */
/*  is what the podcast page links to.                                 */
/* ------------------------------------------------------------------ */

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

/* Chapters that actually exist. Add a city here when it opens. */
const CHAPTERS = ["Chicago", "New York", "Washington, DC"];

const FIELD =
  "w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-base text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30";

const LABEL = "mb-1.5 block font-body text-sm font-medium text-ink";

type Interest = "" | "join" | "start" | "podcast";

export default function JoinForm() {
  const [interest, setInterest] = useState<Interest>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    chapter: "",
    city: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  /* The podcast page links to /get-involved#podcast, so land with that
     option already chosen instead of making the visitor find it. The
     listener covers the in-page link to the same anchor. */
  useEffect(() => {
    const apply = () => {
      if (window.location.hash === "#podcast") setInterest("podcast");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!interest) {
      toast.error("Pick what you want to do.");
      return;
    }
    if (interest === "join" && !form.chapter) {
      toast.error("Pick a chapter.");
      return;
    }
    if (interest !== "join" && !form.city.trim()) {
      toast.error("Tell us which city.");
      return;
    }

    setLoading(true);
    try {
      const tag =
        interest === "start"
          ? "[NEW CHAPTER REQUEST]"
          : interest === "podcast"
            ? "[PODCAST GUEST]"
            : "[JOIN CHAPTER]";
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "volunteer",
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          chapter: interest === "join" ? form.chapter : form.city.trim(),
          message: [tag, form.message.trim() || null]
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
        <h3 className="font-display text-2xl text-forest">
          Thanks. We have it.
        </h3>
        <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/75">
          A student reads every one of these and will write back to{" "}
          {form.email.trim().toLowerCase()}. It usually takes a few days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-border bg-cream p-6 md:p-8"
    >
      <fieldset>
        <legend className={LABEL}>What do you want to do?</legend>
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { key: "join", label: "Join a chapter" },
              { key: "start", label: "Start one in my city" },
              { key: "podcast", label: "Be on the podcast" },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={interest === option.key}
              onClick={() => setInterest(option.key)}
              className={`rounded-sm border px-4 py-3.5 font-body text-base transition-colors ${
                interest === option.key
                  ? "border-rust bg-rust/10 font-semibold text-rust"
                  : "border-border text-ink/70 hover:border-warm-gray"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
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

      {interest === "join" && (
        <div className="mt-5">
          <label htmlFor="join-chapter" className={LABEL}>
            Which chapter
          </label>
          <select
            id="join-chapter"
            required
            value={form.chapter}
            onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            className={FIELD}
          >
            <option value="">Pick one</option>
            {CHAPTERS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}

      {(interest === "start" || interest === "podcast") && (
        <div className="mt-5">
          <label htmlFor="join-city" className={LABEL}>
            Which city
          </label>
          <input
            id="join-city"
            type="text"
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="The city you are in"
            className={FIELD}
          />
        </div>
      )}

      <div className="mt-5">
        <label htmlFor="join-message" className={LABEL}>
          Anything you want us to know{" "}
          <span className="font-normal text-warm-gray">(optional)</span>
        </label>
        <textarea
          id="join-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder={
            interest === "podcast"
              ? "What you would want to talk about. Your block, what changed, what you lived through."
              : "What you would like to work on, your school, how much time you have. Whatever is useful."
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

      <p className="mt-4 font-body text-sm text-ink/55">
        {interest === "podcast"
          ? "Nothing is recorded until you have talked it through with us first."
          : "No experience needed, and there is no cost to join."}
      </p>
    </form>
  );
}
