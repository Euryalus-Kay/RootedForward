"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Tours", href: "/tours" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Contact", href: "/contact" },
] as const;

const CHAPTERS = ["Chicago", "New York", "Dallas", "San Francisco"] as const;

/* Inline SVG social icons (lucide-react doesn't include TikTok) */
function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46L20 4" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    // Placeholder: replace with real newsletter subscription logic
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <footer className="bg-forest text-cream">
      {/* Main grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* Left column */}
        <div>
          <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
            Rooted Forward
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">
            A youth-led nonprofit documenting racial inequity in American cities
            through walking tours, podcasts, and community storytelling.
          </p>
          <p className="mt-6 text-xs text-cream/50">
            &copy; {new Date().getFullYear()} Rooted Forward. All rights reserved.
          </p>
        </div>

        {/* Middle column - Quick links */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-cream/60">
            Quick Links
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-cream/80 transition-colors duration-200 hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column - Chapters */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-cream/60">
            Our Chapters
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {CHAPTERS.map((city) => (
              <li key={city}>
                <Link
                  href={`/tours/${city.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-cream/80 transition-colors duration-200 hover:text-cream"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between lg:px-8">
          {/* Newsletter */}
          <div className="w-full max-w-md">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-cream/60">
              Stay Updated
            </h3>
            <p className="mt-1 text-sm text-cream/70">
              Get new episodes and tour updates in your inbox.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-3 flex gap-2"
            >
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
                className="flex-1 rounded-lg border border-cream/20 bg-cream/10 px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust"
              />
              <button
                type="submit"
                className="rounded-lg bg-rust px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-rust-dark"
              >
                Subscribe
              </button>
            </form>
            {status === "success" && (
              <p className="mt-2 text-xs text-cream/70">
                Thanks for subscribing!
              </p>
            )}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-cream/60 transition-colors duration-200 hover:text-cream"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
