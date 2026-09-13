import type { Metadata, Viewport } from "next";
import LookCloserMap from "@/components/look-closer/LookCloserMap";
import { EXHIBIT, LOOK_CLOSER_FEATURE, MUSEUM } from "@/lib/look-closer";

/* ------------------------------------------------------------------ */
/*  /look-closer                                                       */
/*                                                                     */
/*  The map on the museum's wall, for a phone. The wall itself runs    */
/*  the kiosk bundle at /kiosk/map, which is what the museum's panel   */
/*  loads and must not change; this route is the same map and the     */
/*  same words rebuilt for a hand-held screen turned sideways. The     */
/*  room covers the site chrome, so the page carries no header or      */
/*  footer of its own. ?app=1 is the iPhone app's web view, which      */
/*  hides the links back to the site.                                  */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Look Closer | Rooted Forward",
  description: `${EXHIBIT.line} Turn your phone sideways to explore the map and the twelve details behind its jokes.`,
  openGraph: {
    title: "Look Closer",
    description: EXHIBIT.line,
    images: [{ url: LOOK_CLOSER_FEATURE.image, alt: LOOK_CLOSER_FEATURE.imageAlt }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F3EEE3",
};

export default async function LookCloserPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app } = await searchParams;
  return (
    <>
      {/* read by search engines and screen readers; the room itself is
          an application, not a document */}
      <h1 className="sr-only">
        {EXHIBIT.title}. {EXHIBIT.line} {EXHIBIT.partnership}. {MUSEUM.address}.
      </h1>
      <LookCloserMap inApp={app === "1"} />
    </>
  );
}
