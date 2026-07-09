/* ------------------------------------------------------------------ */
/*  SurveyRule                                                         */
/*                                                                     */
/*  The site's one signature divider, drawn like the scale bar on a   */
/*  plat map. End ticks run full height, the chain ticks half. Color  */
/*  comes from currentColor so it works on cream (text-rust) and on   */
/*  dark bands (text-rust-light or text-cream/40).                    */
/* ------------------------------------------------------------------ */

export default function SurveyRule({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 12"
      width="96"
      height="12"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <line x1="0.5" y1="6" x2="95.5" y2="6" stroke="currentColor" strokeWidth="1" />
      <line x1="0.5" y1="1" x2="0.5" y2="11" stroke="currentColor" strokeWidth="1" />
      <line x1="24.5" y1="3.5" x2="24.5" y2="8.5" stroke="currentColor" strokeWidth="1" />
      <line x1="48.5" y1="3.5" x2="48.5" y2="8.5" stroke="currentColor" strokeWidth="1" />
      <line x1="72.5" y1="3.5" x2="72.5" y2="8.5" stroke="currentColor" strokeWidth="1" />
      <line x1="95.5" y1="1" x2="95.5" y2="11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
