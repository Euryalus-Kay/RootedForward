import type { Metadata } from "next";
import KioskFrame from "./KioskFrame";

/* ------------------------------------------------------------------ */
/*  /kiosk/map                                                         */
/*                                                                     */
/*  A viewing page for the bundled map kiosk. Deliberately not linked  */
/*  from anywhere on the site and deliberately out of the sitemap, per */
/*  the owner. It exists so the kiosk has a URL that can be opened and */
/*  stays put, rather than living in a Downloads folder.               */
/*                                                                     */
/*  The bundle itself is a static file at public/kiosk/map-kiosk.html, */
/*  7MB and entirely self-contained, no external requests. It is       */
/*  served as-is; the only edit made to it was its idle reset, from    */
/*  120 seconds down to 20.                                            */
/*                                                                     */
/*  robots.ts already disallows the whole site, so nothing crawls this */
/*  either way. noindex is set here as well so the page carries its    */
/*  own instruction if that ever changes.                              */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Map kiosk",
  robots: { index: false, follow: false, nocache: true },
};

export default function KioskMapPage() {
  return <KioskFrame />;
}
