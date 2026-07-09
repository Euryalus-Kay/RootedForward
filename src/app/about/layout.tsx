import type { Metadata } from "next";

/* The about page is a client component, so its metadata lives here. */

export const metadata: Metadata = {
  title: "About | Rooted Forward",
  description:
    "Rooted Forward is a youth-led nonprofit in Chicago tracing how redlining, urban renewal, and highway construction shaped the city's neighborhoods. Founded by Zain Zaidi and run by students.",
};

export default function AboutLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
