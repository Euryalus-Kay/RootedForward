"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  PetitionForm                                                       */
/*                                                                     */
/*  Four fields and a button. No account, no sign-in, no redirect.     */
/*  The invisible `website` input is a honeypot; a real person never   */
/*  fills it, and a bot that does gets a success message and no row.   */
/* ------------------------------------------------------------------ */

/* A committee weighs a resident's signature differently from an
   out-of-town one, so we ask rather than guess from the ZIP. */
export const RESIDENCY_OPTIONS = [
  { value: "resident", label: "Yes, I live there" },
  { value: "work_or_school", label: "I work or go to school there" },
  { value: "nearby", label: "I live elsewhere in the metro area" },
  { value: "supporter", label: "No, but I support this" },
] as const;

interface PetitionFormProps {
  slug: string;
  /** The city the bill affects. Names the residency question. */
  city: string;
  /** Rendered above the fields so a signer reads what they are signing. */
  statement: string;
  /** Server-rendered starting count. null means we could not read it. */
  initialCount: number | null;
}

export default function PetitionForm({
  slug,
  city,
  statement,
  initialCount,
}: PetitionFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [residency, setResidency] = useState<string>("resident");
  const [isPublic, setIsPublic] = useState(true);
  const [website, setWebsite] = useState("");
  const [count, setCount] = useState<number | null>(initialCount);
  const [signed, setSigned] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/policy/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, zip, residency, isPublic, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.migrationPending) {
          throw new Error(
            "Signing is not switched on yet. Email contact@rooted-forward.org and we will add your name by hand."
          );
        }
        throw new Error(data.error || "We could not record your signature");
      }
      if (typeof data.count === "number") setCount(data.count);
      setSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-sm border-2 border-forest bg-cream p-8">
        <h2 className="font-display text-2xl text-forest">
          Signed. Thank you.
        </h2>
        <p className="mt-3 font-body text-base leading-relaxed text-ink/75">
          Your name goes on the list we hand to the committee. We will email
          you once when the bill moves, and not for anything else.
        </p>
        {count !== null && (
          <p className="mt-4 font-body text-sm font-semibold uppercase tracking-widest text-rust">
            {count.toLocaleString()} {count === 1 ? "signature" : "signatures"}
          </p>
        )}
      </div>
    );
  }

  const fieldCls =
    "mt-2 w-full rounded-sm border border-border bg-cream px-4 py-3 font-body text-base text-ink placeholder:text-ink/35 focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30";
  const labelCls =
    "block font-body text-xs font-semibold uppercase tracking-widest text-ink/60";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border-2 border-forest bg-cream p-6 md:p-8"
    >
      <h2 className="font-display text-2xl text-forest md:text-3xl">
        Sign this petition
      </h2>
      <p className="mt-4 border-l-2 border-rust pl-4 font-body text-base italic leading-relaxed text-ink/80">
        {statement}
      </p>
      {count !== null && count > 0 && (
        <p className="mt-4 font-body text-sm font-semibold uppercase tracking-widest text-rust">
          {count.toLocaleString()} {count === 1 ? "person has" : "people have"} signed
        </p>
      )}

      <div className="mt-6 flex flex-col gap-5">
        <div>
          <label htmlFor="petition-name" className={labelCls}>
            Your name
          </label>
          <input
            id="petition-name"
            type="text"
            required
            maxLength={80}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldCls}
          />
        </div>

        <div>
          <label htmlFor="petition-email" className={labelCls}>
            Email
          </label>
          <input
            id="petition-email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldCls}
          />
          <p className="mt-2 font-body text-xs text-ink/55">
            Used to check the signature is real and to tell you when the bill
            moves. We never sell it or pass it to anyone.
          </p>
        </div>

        <div>
          <label htmlFor="petition-residency" className={labelCls}>
            Do you live in {city}?
          </label>
          <select
            id="petition-residency"
            value={residency}
            onChange={(e) => setResidency(e.target.value)}
            className={fieldCls}
          >
            {RESIDENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-2 font-body text-xs text-ink/55">
            The committee counts residents separately, so this changes how
            much weight your signature carries.
          </p>
        </div>

        <div>
          <label htmlFor="petition-zip" className={labelCls}>
            ZIP code <span className="font-normal normal-case tracking-normal text-ink/45">(optional)</span>
          </label>
          <input
            id="petition-zip"
            type="text"
            inputMode="numeric"
            maxLength={10}
            autoComplete="postal-code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className={`${fieldCls} max-w-[12rem]`}
          />
          <p className="mt-2 font-body text-xs text-ink/55">
            Lets us show the committee which wards the signatures came from.
          </p>
        </div>

        <label className="flex items-start gap-3 font-body text-sm leading-relaxed text-ink/75">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
          />
          Show my first name and last initial on this page
        </label>

        {/* Honeypot. Hidden from people, visible to bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="petition-website">Leave this field empty</label>
          <input
            id="petition-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="font-body text-sm leading-relaxed text-rust">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
        >
          {sending ? "Adding your name…" : "Add my name"}
        </button>
      </div>
    </form>
  );
}
