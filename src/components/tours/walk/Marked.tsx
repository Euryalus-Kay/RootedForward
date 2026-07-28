import { Fragment, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  The tiny markup the walking tours use.                             */
/*                                                                     */
/*  `**bold**` carries the history. The rule from the owner is that    */
/*  reading only the bold should still tell you what happened, so it   */
/*  gets real weight and the ink color rather than a tint.            */
/*                                                                     */
/*  `*italic*` sets publication titles. Harlem's script quotes the     */
/*  Real Estate Record, Ebony, the New York Times and Home to Harlem   */
/*  by name, and they read as shouting without it.                     */
/*                                                                     */
/*  Both are stripped before narration is recorded (see               */
/*  scripts/walk-tts.mjs), so styling never changes what is said.      */
/*  Bold is matched first, so `**...**` never gets read as two         */
/*  italics.                                                           */
/* ------------------------------------------------------------------ */

/** italic runs inside one non-bold stretch of text */
function italics(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(/\*(.+?)\*/g).forEach((part, i) => {
    if (part === "") return;
    out.push(
      i % 2 === 1 ? (
        <em key={`${keyBase}-i${i}`} className="italic">
          {part}
        </em>
      ) : (
        <Fragment key={`${keyBase}-t${i}`}>{part}</Fragment>
      )
    );
  });
  return out;
}

/** render `**bold**` and `*italic*` inside a paragraph of tour copy */
export function marked(text: string, keyBase = "m"): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
    if (i % 2 === 1) {
      out.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-ink">
          {italics(part, `${keyBase}-b${i}`)}
        </strong>
      );
    } else {
      out.push(...italics(part, `${keyBase}-p${i}`));
    }
  });
  return out;
}

/** the same thing as a component, for JSX that reads better inline */
export default function Marked({ text }: { text: string }) {
  return <>{marked(text)}</>;
}
