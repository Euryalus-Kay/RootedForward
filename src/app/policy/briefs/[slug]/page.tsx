import { redirect } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  /policy/briefs/[slug]                                              */
/*                                                                     */
/*  Legacy path. Policy briefs now live in the research_entries       */
/*  table with format = 'brief'. Redirect to the canonical archive   */
/*  URL so existing links continue to work.                            */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BriefRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/research/${slug}`);
}
