/* ------------------------------------------------------------------ */
/*  Shared focus and announcement helpers for exhibit transitions      */
/*  (A4 accessibility). Focus used to drop to <body> at every state    */
/*  change and pause points began silently; ChapterStage,              */
/*  InteractiveSlot, and the closing plate all route through these     */
/*  two helpers so keyboard and screen-reader visitors keep their      */
/*  place. Announcements go through the #exh-live polite region that   */
/*  HudFrame renders.                                                  */
/* ------------------------------------------------------------------ */

/** Speak through the shared polite live region (#exh-live). */
export function announce(text: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById("exh-live");
  if (el) el.textContent = text;
}

/**
 * Move keyboard focus to an element without scrolling it; scroll
 * choreography stays with the caller. Elements that are not natively
 * focusable get tabindex="-1" first so focus() sticks.
 */
export function moveFocus(el: HTMLElement | null | undefined): void {
  if (!el) return;
  if (el.tabIndex < 0 && !el.hasAttribute("tabindex")) {
    el.setAttribute("tabindex", "-1");
  }
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}
