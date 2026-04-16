"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, LogOut, LayoutDashboard, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth-helpers";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NAV_LINKS = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "The Organization", href: "/about?tab=organization" },
      { label: "People", href: "/about?tab=people" },
    ],
  },
  { label: "Tours", href: "/tours" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Policy", href: "/policy" },
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

  async function fetchRole(userId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();
      setUserRole((data as any)?.role ?? null);
    } catch {
      setUserRole(null);
    }
  }

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
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight text-forest">
            Rooted Forward
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="relative group">
              <Link
                href={link.href}
                className="font-body text-sm text-ink transition-colors duration-200 hover:text-forest"
              >
                {link.label}
              </Link>
              {"children" in link && link.children && (
                <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="min-w-[180px] rounded-lg border border-border bg-cream p-1 shadow-lg">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-md px-3 py-2 font-body text-sm text-ink transition-colors hover:bg-forest/10 hover:text-forest"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Right section */}
        <div className="flex items-center gap-3">
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
          ) : (
            /* Login / Sign up */
            <Link
              href="/auth/login"
              className="hidden rounded-full bg-rust px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rust-dark md:inline-block"
            >
              Log in
            </Link>
          )}

          {/* Search button (desktop) */}
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
              document.dispatchEvent(event);
            }}
            className="hidden items-center gap-2 rounded-full border border-border bg-cream-dark/50 px-3 py-1.5 text-sm text-warm-gray transition-colors hover:border-warm-gray-light hover:text-ink md:flex"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search</span>
            <kbd className="ml-1 rounded border border-border bg-cream px-1.5 py-0.5 text-[10px] font-medium text-warm-gray-light">
              ⌘K
            </kbd>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-md text-forest md:hidden"
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
            className="overflow-hidden border-t border-border bg-cream md:hidden"
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
                  {"children" in link && link.children && (
                    <ul className="ml-4 flex flex-col gap-1">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-md px-3 py-2 font-body text-sm text-warm-gray transition-colors hover:bg-forest/10 hover:text-ink"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}

              {!user && (
                <li className="mt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-full bg-rust px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-rust-dark"
                  >
                    Log in / Sign up
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
