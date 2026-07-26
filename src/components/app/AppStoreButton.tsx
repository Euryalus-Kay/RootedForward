/* ------------------------------------------------------------------ */
/*  App Store download button.                                         */
/*                                                                     */
/*  Two states, one component. While APP_STORE_URL in src/lib/         */
/*  app-store.ts is null the button renders as a quiet "coming soon"   */
/*  plate at exactly the same size, so the page never reflows when the */
/*  real link lands. Fill that constant in and every button on the     */
/*  site becomes a live link to the App Store.                         */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { APP_STORE_URL } from "@/lib/app-store";

/* Apple's mark, drawn as a single path so the button needs no image. */
function AppleGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.05 20.28c-.98.95-2.06.8-3.09.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

type Tone = "rust" | "onDark" | "ink";

const TONES: Record<Tone, { live: string; pending: string; note: string }> = {
  /* Primary CTA on a cream page. */
  rust: {
    live: "bg-rust text-white hover:bg-rust-dark",
    pending: "border border-dashed border-rust/45 bg-rust/5 text-rust",
    note: "text-ink/60",
  },
  /* On forest or ink sections. */
  onDark: {
    live: "bg-rust text-white hover:bg-rust-dark",
    pending: "border border-dashed border-cream/40 bg-cream/5 text-cream",
    note: "text-cream/60",
  },
  /* The black App Store badge look, for the download block. */
  ink: {
    live: "bg-ink text-cream hover:bg-forest",
    pending: "border border-dashed border-ink/35 bg-ink/5 text-ink",
    note: "text-ink/60",
  },
};

interface AppStoreButtonProps {
  tone?: Tone;
  /** Show the small line under the button explaining the pending state. */
  withNote?: boolean;
  className?: string;
}

export default function AppStoreButton({
  tone = "rust",
  withNote = true,
  className = "",
}: AppStoreButtonProps) {
  const styles = TONES[tone];
  const shell =
    "inline-flex items-center gap-3 rounded-sm px-7 py-4 text-left transition-colors";

  const label = (
    <>
      <AppleGlyph className="h-6 w-6 shrink-0" />
      <span className="flex flex-col leading-tight">
        <span className="font-body text-[11px] uppercase tracking-[0.18em] opacity-80">
          {APP_STORE_URL ? "Download on the" : "Coming soon to the"}
        </span>
        <span className="font-display text-xl">App Store</span>
      </span>
    </>
  );

  return (
    <div className={className}>
      {APP_STORE_URL ? (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${shell} ${styles.live}`}
        >
          {label}
        </a>
      ) : (
        <span className={`${shell} ${styles.pending} cursor-default`}>
          {label}
        </span>
      )}

      {withNote && !APP_STORE_URL && (
        <p className={`mt-3 max-w-[34ch] font-body text-sm leading-relaxed ${styles.note}`}>
          The app is not up yet.{" "}
          <Link
            href="/contact"
            className="underline decoration-1 underline-offset-2 transition-opacity hover:opacity-70"
          >
            Ask us for the link
          </Link>{" "}
          and we will send it the day it lands.
        </p>
      )}
    </div>
  );
}
