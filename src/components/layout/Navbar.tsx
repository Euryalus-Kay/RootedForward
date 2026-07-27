"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth-helpers";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/* Flat nav, no dropdowns. The owner asked for About to be one page
   (July 2026), and with curriculum and research hidden there are few
   enough destinations that every one can sit at the top level. */
const NAV_LINKS = [
  { label: "Tours", href: "/tours" },
  { label: "Podcast", href: "/podcasts" },
  { label: "Policy", href: "/policy" },
  { label: "About", href: "/about" },
  { label: "Team", href: "/about/team" },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchRole(userId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      setUserRole(data?.role ?? null);
    } catch {
      setUserRole(null);
    }
  }

  /* ---- Auth listener ---- */
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---- Scroll detection ---- */
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---- Close dropdown on outside click ---- */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---- Lock body scroll when mobile menu is open ---- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    setDropdownOpen(false);
    setMobileOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 bg-cream/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_var(--color-border)]" : ""
      }`}
    >
      <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap"
        >
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight text-forest">
            Rooted Forward
          </span>
        </Link>

        {/* Desktop links, pushed right toward the log in button. They
            used to stop short of a search button that is no longer
            there, so the right padding held for it is gone too.

            These sit behind lg, not md. Seven destinations need about
            345px of text before any gap, which a 768px bar does not
            have after the wordmark and the log in button. At md the row
            overflowed and wrapped the wordmark onto two lines, so 768 to
            1023 gets the hamburger like a phone does. */}
        <ul className="hidden items-center justify-end gap-5 lg:flex xl:gap-7">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-body text-sm text-ink transition-colors duration-200 hover:text-forest"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right section — account, search */}
        <div className="flex items-center justify-end gap-3">
          {user ? (
            /* User dropdown */
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="Account menu"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/10 text-forest transition-colors hover:bg-forest/20"
              >
                <User size={18} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-border bg-cream p-1 shadow-lg"
                  >
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/10"
                    >
                      <User size={16} />
                      Account
                    </Link>

                    {userRole === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/10"
                      >
                        <LayoutDashboard size={16} />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/10"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
          {/* The log in button was removed at the owner's request
              (July 2026). Nothing on the public site needs an account.
              Admins go straight to /admin, which the proxy bounces to
              /auth/login and back again once they are signed in, so the
              route is still gated. The account menu above still renders
              for anyone who is already signed in. */}

          {/* The search button used to sit here. Removed at the owner's
              request (July 2026). The ⌘K modal is still mounted in the
              layout, so the shortcut works for anyone who knows it and
              the button can come back without rewiring anything. */}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-md text-forest lg:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-cream lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2.5 font-body text-base text-ink transition-colors hover:bg-forest/10"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* No log in entry here either. See the note by the
                  desktop account menu above. */}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
