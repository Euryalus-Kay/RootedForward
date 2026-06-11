"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grain grid-lines relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-24">
      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="ledger text-warm-gray">Something went wrong</p>
        <h1 className="mt-4 font-display text-3xl text-forest md:text-5xl">
          The page hit an unexpected error
        </h1>
        <div className="mt-6 h-px w-14 bg-rust/60" aria-hidden="true" />
        <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/70">
          You can try reloading it. If the problem keeps happening, head back
          to the front page.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-sm border border-forest/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-ink transition-colors hover:bg-forest/5"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
