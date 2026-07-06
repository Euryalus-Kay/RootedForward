/* ------------------------------------------------------------------ */
/*  Scoped chapter playback (A4 P2, interaction design). Explore's     */
/*  "Play this chapter" converts the visit to guided narration for     */
/*  ONE chapter; this module-level flag lets ChapterStage return the   */
/*  visitor to self-paced explore at the chapter boundary through      */
/*  existing reducer actions, keeping the reducer untouched.           */
/*  Session-local by design; a reload lands on the resume flow.        */
/* ------------------------------------------------------------------ */

let scopedChapter: number | null = null;

/** Arm scoped playback for the chapter the visitor pressed Play on. */
export function beginScopedPlay(chapterIndex: number): void {
  scopedChapter = chapterIndex;
}

/** The chapter index scoped playback is armed for, or null. */
export function scopedPlayChapter(): number | null {
  return scopedChapter;
}

export function clearScopedPlay(): void {
  scopedChapter = null;
}
