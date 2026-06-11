"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import GradeStrip from "@/components/motion/GradeStrip";

const EXPLORE = [
  { label: "About", href: "/about" },
  { label: "Education", href: "/education" },
  { label: "Policy", href: "/policy" },
  { label: "Research", href: "/research" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Contact", href: "/contact" },
] as const;

const PROGRAMS = [
  { label: "Walking Tours", href: "/tours" },
  { label: "Podcast", href: "/podcasts" },
  { label: "Curriculum", href: "/curriculum" },
  { label: "Data & Replication", href: "/research/data" },
] as const;

const CHAPTERS = [{ label: "Chicago", href: "/tours/chicago" }] as const;

/* Inline SVG social icons (lucide-react doesn't include TikTok) */
function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "X (Twitter)", href: "https://x.com", icon: XIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
  { label: "TikTok", href: "https://tiktok.com", icon: TikTokIcon },
] as const;

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      } else {
        setStatus("success");
        setMessage("You're on the list. New papers and episodes, no noise.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
    setTimeout(() => setStatus("idle"), 6000);
  }

  return (
    <footer className="grain relative overflow-hidden bg-forest-deep text-cream">
      <div className="grid-lines-light pointer-events-none absolute inset-0" />

      {/* Newsletter band */}
      <div className="relative border-b border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between lg:px-8">
          <div>
            <p className="ledger text-cream/45">Newsletter</p>
            <h2 className="mt-3 max-w-md font-display text-3xl leading-tight text-cream md:text-4xl">
              The next paper, in your inbox.
            </h2>
          </div>
          <div className="w-full max-w-md">
            <form onSubmit={handleSubscribe} className="flex border-b border-cream/30 pb-2 focus-within:border-cream/70">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent px-1 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="group flex items-center gap-2 px-2 py-2 text-sm font-medium text-cream transition-colors hover:text-rust-light disabled:opacity-50"
              >
                {status === "loading" ? "Sending" : "Subscribe"}
                <span aria-hidden="true" className="arrow-nudge">&rarr;</span>
              </button>
            </form>
            <p
              role="status"
              className={`mt-2 min-h-[1rem] text-xs ${
                status === "error" ? "text-rust-light" : "text-cream/60"
              }`}
            >
              {status === "success" || status === "error" ? message : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-2xl font-semibold tracking-tight">
              Rooted Forward
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/65">
            A youth-led nonprofit documenting how policy shaped American
            neighborhoods, through walking tours, a podcast, published
            research, and organized response.
          </p>
          <GradeStrip className="mt-6 opacity-70" />
        </div>

        <div className="md:col-span-3">
          <h3 className="ledger text-cream/45">Explore</h3>
          <ul className="mt-5 flex flex-col gap-2.5">
            {EXPLORE.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-draw text-sm text-cream/75 transition-colors duration-200 hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="ledger text-cream/45">Programs</h3>
          <ul className="mt-5 flex flex-col gap-2.5">
            {PROGRAMS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-draw text-sm text-cream/75 transition-colors duration-200 hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="ledger text-cream/45">Chapters</h3>
          <ul className="mt-5 flex flex-col gap-2.5">
            {CHAPTERS.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="link-draw text-sm text-cream/75 transition-colors duration-200 hover:text-cream"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="ledger mt-8 text-cream/45">Follow</h3>
          <div className="mt-4 flex items-center gap-4">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-cream/55 transition-colors duration-200 hover:text-cream"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5 lg:px-8">
          <p className="text-xs text-cream/45">
            &copy; {new Date().getFullYear()} Rooted Forward. All rights reserved.
          </p>
          <p className="ledger text-cream/35">Chicago, IL</p>
        </div>
      </div>

      {/* Giant cropped wordmark, rising into place as it enters view */}
      <div
        aria-hidden="true"
        className="relative -mb-[0.26em] select-none overflow-hidden leading-none"
      >
        <motion.p
          initial={{ y: "42%", opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="whitespace-nowrap text-center font-display text-[13.5vw] font-semibold tracking-tight text-cream/[0.06] will-change-transform"
        >
          Rooted Forward
        </motion.p>
      </div>
    </footer>
  );
}
