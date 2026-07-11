/* ------------------------------------------------------------------ */
/*  Shared paper-bounds constants. A tiny pure module so the client    */
/*  controller and the server StageBase can share the veil's frame     */
/*  rect without the client bundle ever importing StageBase (which     */
/*  would pull geometry.json into it).                                 */
/* ------------------------------------------------------------------ */
export const PAPER_X = -600;
export const PAPER_Y = -600;
export const PAPER_W = 3760;
export const PAPER_H = 2640;
export const VEIL_RECT = `M${PAPER_X} ${PAPER_Y}H${PAPER_X + PAPER_W}V${PAPER_Y + PAPER_H}H${PAPER_X}Z`;
