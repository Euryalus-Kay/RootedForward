/* ------------------------------------------------------------------ */
/*  The wall text's two inline marks, shared by every renderer:        */
/*  **bold** is the quick-read layer, *italic* marks published         */
/*  titles. Bold parses first so ** never reads as two italics.        */
/* ------------------------------------------------------------------ */
import type { ReactNode } from "react";

function renderItalics(text: string, keyBase: string): ReactNode {
  const parts = text.split(/\*(.+?)\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <em key={`${keyBase}-i${i}`}>{part}</em> : part
  );
}

export function renderRichText(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-exh-ink">
        {renderItalics(part, `b${i}`)}
      </strong>
    ) : (
      renderItalics(part, `p${i}`)
    )
  );
}
