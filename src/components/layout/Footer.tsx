import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Site footer. Logo and tagline, quick links, and contact. The      */
/*  newsletter form (which faked a success state without recording    */
/*  anything) and the placeholder social icons (which pointed at      */
/*  bare platform homepages) were removed in July 2026; add socials   */
/*  back only with the organization's real profile URLs.              */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "About", href: "/about" },
  { label: "Tours", href: "/tours" },
  { label: "Podcast", href: "/podcasts" },
  { label: "Policy", href: "/policy" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-forest text-cream">
      {/* Main grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        {/* Left column */}
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
            <span className="font-display text-2xl font-semibold tracking-tight">Rooted Forward</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">
            A youth-led Chicago nonprofit tracing how housing policy shaped
            the city&rsquo;s neighborhoods, and organizing the response.
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

        {/* Right column - Contact */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-cream/60">
            Contact
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-cream/75">
            Questions, press, partnerships, or anything else.
          </p>
          <a
            href="mailto:contact@rooted-forward.org"
            className="mt-2 inline-block text-sm text-cream underline decoration-cream/30 underline-offset-2 transition-colors hover:decoration-cream"
          >
            contact@rooted-forward.org
          </a>
          <p className="mt-5 text-sm text-cream/75">
            Based in Chicago.
          </p>
        </div>
      </div>
    </footer>
  );
}
