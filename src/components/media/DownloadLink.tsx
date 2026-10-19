/* A plain download link for one photograph or the zip. The download
   attribute names the saved file; the href is the full-size copy. */

export default function DownloadLink({
  href,
  filename,
  size,
  label = "Download",
  className = "",
}: {
  href: string;
  filename: string;
  size: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      download={filename}
      className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark ${className}`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5">
        <path d="M8 2.5v8m0 0L4.75 7.25M8 10.5l3.25-3.25M3 13.5h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
      <span className="font-medium normal-case tracking-normal text-ink/45">{size}</span>
    </a>
  );
}

export const formatKb = (kb: number) => (kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
