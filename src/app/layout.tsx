import type { Metadata } from "next";
import { Source_Serif_4, DM_Sans, Archivo_Narrow, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalSearchShortcut from "@/components/ui/GlobalSearchShortcut";
import { Toaster } from "react-hot-toast";

/* Self-hosted via next/font instead of the old render-blocking Google
   Fonts @import in globals.css. The CSS variables here feed the
   font-display / font-body / font-plat / font-ledger tokens. */
/* The display face for every heading on the site and in the app. An
   ordinary text serif, chosen in July 2026 to replace two faces the
   owner read as stylish rather than plain. */
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-source-serif",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-dm-sans",
  display: "swap",
});
const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-archivo-narrow",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rooted-forward.org"),
  title: "Rooted Forward | Chicago Neighborhood History and Policy",
  description:
    "Rooted Forward is a student-run Chicago nonprofit. Walking tours of Hyde Park, an online exhibit built from the original documents, a podcast, and housing policy tools.",
  openGraph: {
    title: "Rooted Forward",
    description:
      "A student-run Chicago nonprofit. Walking tours, an online exhibit, a podcast, and housing policy work.",
    url: "https://rooted-forward.org",
    siteName: "Rooted Forward",
    images: [
      {
        url: "/media/site/holc-chicago-1940.jpg",
        width: 1600,
        height: 1263,
        alt: "The Home Owners' Loan Corporation Residential Security Map of Chicago, 1940",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${sourceSerif.variable} ${dmSans.variable} ${archivoNarrow.variable} ${plexMono.variable}`}
    >
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
