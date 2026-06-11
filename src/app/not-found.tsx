import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import GradeStrip from "@/components/motion/GradeStrip";

export default function NotFound() {
  return (
    <div className="grain grid-lines relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-6 py-24">
      <div className="relative z-10 flex flex-col items-center text-center">
        <Reveal y={14}>
          <p className="ledger text-warm-gray">Page not found</p>
        </Reveal>

        <Reveal mask delay={0.08}>
          <h1 className="index-numeral text-[8rem] leading-[0.9] text-forest md:text-[14rem]">
            404
          </h1>
        </Reveal>

        <Reveal y={10} delay={0.25}>
          <GradeStrip className="mt-8 justify-center opacity-80" />
        </Reveal>

        <Reveal delay={0.35}>
          <p className="mt-8 max-w-md font-body text-lg leading-relaxed text-ink/70">
            There is no record at this address.
          </p>
        </Reveal>

        <Reveal delay={0.45}>
          <Link
            href="/"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Return home
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
