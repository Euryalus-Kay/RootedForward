"use client";

import { useEffect } from "react";

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
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-warm-gray">
        Something went wrong
      </p>
      <h1 className="mt-4 font-display text-3xl text-forest md:text-4xl">
        We hit an unexpected error
      </h1>
      <p className="mt-4 max-w-md text-ink-light">
        This page encountered a problem. You can try reloading it.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-rust px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rust-dark"
      >
        Try Again
      </button>
    </div>
  );
}
