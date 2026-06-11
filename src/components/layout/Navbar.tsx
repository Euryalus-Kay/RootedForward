"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  {
    label: "Education",
    href: "/education",
    children: [
      { label: "Walking Tours", href: "/tours" },
      { label: "Podcast", href: "/podcasts" },
      { label: "Curriculum", href: "/curriculum" },
    ],
  },
  { label: "Policy", href: "/policy" },
  {
    label: "Research",
    href: "/research",
    children: [
      { label: "All Papers", href: "/research" },
      { label: "Data & Replication", href: "/research/data" },
    ],
  },
  { label: "Get Involved", href: "/get-involved" },
  { label: "Contact", href: "/contact" },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const pathname = usePathname();

  /* ---- Auth listener ---- */
  useEffect(() => {
    const supabase = createClient();

    async function fetchRole(userId: string) {
      try {
        const { data } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .single();
        setUserRole((data as { role?: string } | null)?.role ?? null);
      } catch {
        setUserRole(null);
      }
    }

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

  /* ---- Scroll behavior: shadow after 8px, hide on scroll down ---- */
  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      /* Only hide once well past the top, and never while a menu is open */
      setHidden(y > 160 && y > lastY.current);
      lastY.current = y;
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

  /* ---- Lock body scroll when the mobile menu is open ---- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ---- Close the menus on navigation ----
     State adjustment during render (the documented React pattern for
     resetting state when a value changes), not an effect. */
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setDropdownOpen(false);
  }

  async function handleSignOut() {
    await signOut();
    setDropdownOpen(false);
    setMobileOpen(false);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <motion.header
      animate={{ y: hidden && !mobileOpen ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`sticky top-0 z-50 bg-cream/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_var(--color-border)]" : ""
      }`}
    >
      <nav className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <img
            src="/logo.svg"
            alt=""
            className="h-8 w-8 transition-transform duration-500 group-hover:rotate-[8deg]"
          />
          <span className="font-display text-xl font-semibold tracking-tight text-forest">
            Rooted Forward
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center justify-end gap-7 md:flex md:pr-2 lg:pr-4">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="relative group">
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`link-draw font-body text-sm transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-forest"
                    : "text-ink hover:text-forest"
                }`}
              >
                {link.label}
              </Link>
              {"children" in link && link.children && (
                <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
                  <div className="min-w-[200px] border border-border bg-cream p-1.5 shadow-[0_12px_40px_rgba(26,26,26,0.12)]">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="group/item flex items-center justify-between px-3 py-2.5 font-body text-sm text-ink transition-colors hover:bg-forest/[0.07] hover:text-forest"
                      >
                        <span>{child.label}</span>
                        <span
                          aria-hidden="true"
                          className="arrow-nudge text-rust opacity-0 transition-opacity group-hover/item:opacity-100"
                        >
                          &rarr;
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Right section */}
        <div className="flex items-center justify-end gap-3">
          {user ? (
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
                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: -4 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="absolute right-0 mt-2 w-48 origin-top-right border border-border bg-cream p-1.5 shadow-[0_12px_40px_rgba(26,26,26,0.12)]"
                  >
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/[0.07]"
                    >
                      <User size={16} />
                      Account
                    </Link>

                    {userRole === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/[0.07]"
                      >
                        <LayoutDashboard size={16} />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm font-body text-ink transition-colors hover:bg-forest/[0.07]"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
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
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              });
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
            className="relative z-[70] flex h-9 w-9 items-center justify-center text-forest md:hidden"
          >
            {mobileOpen ? <X size={22} className="text-cream" /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu — full-screen editorial overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="grain fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-forest-deep md:hidden"
            data-lenis-prevent
          >
            <div className="grid-lines-light pointer-events-none absolute inset-0" />
            <div className="relative flex-1 px-6 pb-10 pt-24">
              <p className="ledger text-cream/40">Menu</p>
              <ul className="mt-6 flex flex-col">
                {NAV_LINKS.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.06 + i * 0.055, ease: EASE }}
                    className="border-b border-cream/10"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-baseline justify-between py-4"
                    >
                      <span className="font-display text-3xl text-cream">
                        {link.label}
                      </span>
                      <span className="index-numeral text-xs text-cream/35">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </Link>
                    {"children" in link && link.children && (
                      <div className="-mt-2 flex flex-wrap gap-x-5 gap-y-1 pb-4">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="font-body text-sm text-cream/55 transition-colors hover:text-cream"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-10 flex items-center justify-between"
              >
                {!user ? (
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-rust px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rust-dark"
                  >
                    Log in / Sign up
                  </Link>
                ) : (
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-cream/25 px-6 py-3 text-sm font-medium text-cream"
                  >
                    Your account
                  </Link>
                )}
                <p className="ledger text-cream/35">Chicago, IL</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
