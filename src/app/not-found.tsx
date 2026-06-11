import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-warm-gray">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl text-forest md:text-5xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-light">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-rust px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-rust-dark"
      >
        Return Home
      </Link>
    </div>
  );
}
