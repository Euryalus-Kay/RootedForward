import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WalkTourPage from "@/components/tours/walk/WalkTourPage";
import { getWalkTour } from "@/lib/tours/registry";

/* ------------------------------------------------------------------ */
/*  /tours/harlem-walk                                                 */
/*                                                                     */
/*  Walk Harlem, the first Rooted Forward route outside Chicago.       */
/*  Sixteen stops from the Hotel Theresa north to 145th and Lenox,     */
/*  plus one optional detour southwest to Morningside Park and         */
/*  Columbia, told in the order the history happened.                  */
/*                                                                     */
/*  Same page body as /tours/hyde-park-walk. Everything specific to    */
/*  this city lives in the registry bundle, so the two routes cannot   */
/*  drift apart.                                                       */
/* ------------------------------------------------------------------ */

const bundle = getWalkTour("harlem");

export const metadata: Metadata = {
  title: bundle?.page.metaTitle ?? "Harlem Walking Tour | Rooted Forward",
  description: bundle?.page.metaDescription,
};

export default function HarlemWalkPage() {
  if (!bundle) notFound();
  return <WalkTourPage bundle={bundle} />;
}
