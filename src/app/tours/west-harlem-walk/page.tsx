import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWalkTour } from "@/lib/tours/registry";
import WalkTourPage from "@/components/tours/walk/WalkTourPage";

/* ------------------------------------------------------------------ */
/*  Walk Columbia and West Harlem. Everything on the page comes from    */
/*  the bundle in src/lib/tours/registry.ts; this file only names it.  */
/*  While the walk's switch is off the page answers 404.               */
/* ------------------------------------------------------------------ */

const bundle = getWalkTour("west-harlem");

export const metadata: Metadata = {
  title: bundle?.page.metaTitle ?? "Columbia and West Harlem Walking Tour | Rooted Forward",
  description: bundle?.page.metaDescription,
};

export default function WestHarlemWalkPage() {
  if (!bundle) notFound();
  return <WalkTourPage bundle={bundle} />;
}
