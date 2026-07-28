import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WalkTourPage from "@/components/tours/walk/WalkTourPage";
import { getWalkTour } from "@/lib/tours/registry";

/* ------------------------------------------------------------------ */
/*  /tours/hyde-park-walk                                              */
/*                                                                     */
/*  The Hyde Park racial-history audio walking tour, in the browser.   */
/*  Starts at Paul Cornell's stone by 53rd Street, crosses the         */
/*  neighborhood he built, and names the instruments that decided who  */
/*  could live in it. The map is our own SVG built from Census TIGER   */
/*  geometry; the audio is pregenerated and served from /public.       */
/*  (The earlier Jackson Park version of this walk survives in         */
/*  src/lib/tours/jackson-park-walk.ts.)                               */
/*                                                                     */
/*  This page used to be /tours itself. In July 2026 /tours became     */
/*  the page that explains the tours and sends people to the iPhone    */
/*  app, and this player moved down here so that anyone without an     */
/*  iPhone can still take the walk. The App Store listing promises     */
/*  the narration is free on the site, so keep this route reachable.   */
/*  It is linked from /tours and from the app-download block there.    */
/*                                                                     */
/*  The page body is shared with Walk Harlem. Everything specific to   */
/*  this city lives in the registry bundle.                            */
/* ------------------------------------------------------------------ */

const bundle = getWalkTour("hyde-park");

export const metadata: Metadata = {
  title: bundle?.page.metaTitle ?? "Hyde Park Walking Tour | Rooted Forward",
  description: bundle?.page.metaDescription,
};

export default function HydeParkWalkPage() {
  if (!bundle) notFound();
  return <WalkTourPage bundle={bundle} />;
}
