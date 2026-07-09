import { redirect } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  /policy/briefs/[slug]                                              */
/*                                                                     */
/*  Legacy path. Briefs used to live here, then moved into the        */
/*  research archive. With /research hidden (owner request, July      */
/*  2026), old brief links land on the policy page instead of a 404.  */
/*  When research is restored, point this back at /research/<slug>.   */
/* ------------------------------------------------------------------ */

export default async function BriefRedirect() {
  redirect("/policy");
}
