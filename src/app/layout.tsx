import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalSearchShortcut from "@/components/ui/GlobalSearchShortcut";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Rooted Forward | Documenting Racial Inequity in American Cities",
  description:
    "Rooted Forward is a youth-led nonprofit documenting racial inequity in American cities through walking tours, podcasts, and community storytelling. Explore histories of redlining, displacement, and resistance across Chicago, New York, Dallas, and San Francisco.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-body bg-cream text-ink">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <GlobalSearchShortcut />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--color-cream)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            },
            success: {
              iconTheme: {
                primary: "var(--color-forest)",
                secondary: "var(--color-cream)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--color-rust)",
                secondary: "var(--color-cream)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
