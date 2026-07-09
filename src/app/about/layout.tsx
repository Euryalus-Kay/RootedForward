import type { Metadata } from "next";

/* The about page is a client component, so its metadata lives here. */

export const metadata: Metadata = {
  title: "About | Rooted Forward",
  description:
    "Rooted Forward is a student-run Chicago nonprofit founded by Zain Zaidi. We research the paperwork that decided who could live where in Chicago and teach that history on foot in Hyde Park.",
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
