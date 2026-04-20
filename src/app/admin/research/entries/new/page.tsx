/* ------------------------------------------------------------------ */
/*  /admin/research/entries/new                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Route for authoring a brand-new research entry. Wraps the         */
/*  shared EntryEditor with no `initial` prop.                         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import EntryEditor from "@/components/admin/research/EntryEditor";

export default function NewResearchEntryPage() {
  return <EntryEditor />;
}
