"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Headphones,
  Building2,
  FileText,
  Inbox,
  Users,
  MessageSquare,
  Scale,
  BookOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tours", label: "Tours", icon: MapPin },
  { href: "/admin/podcasts", label: "Podcasts", icon: Headphones },
  { href: "/admin/cities", label: "Cities", icon: Building2 },
  { href: "/admin/content", label: "Site Content", icon: FileText },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/about/board", label: "Board", icon: Users },
  { href: "/admin/policy", label: "Policy", icon: Scale },
  { href: "/admin/research", label: "Research", icon: BookOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-forest-light/30">
        <h1 className="font-display text-xl font-semibold text-cream">
          Rooted Forward
        </h1>
        <span className="mt-1 inline-block rounded-full bg-rust px-3 py-0.5 text-xs font-medium text-cream">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-rust text-cream"
                      : "text-cream/70 hover:bg-forest-light hover:text-cream"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-forest-light/30 px-3 py-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/70 transition-colors hover:bg-forest-light hover:text-cream"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-forest transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-5 rounded-md p-1 text-cream/70 hover:text-cream lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-cream px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-ink hover:bg-cream-dark lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold text-forest">
            Admin Dashboard
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-cream p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
