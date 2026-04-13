"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/ui/ScrollReveal";

/* ------------------------------------------------------------------ */
/*  Testimonial data                                                   */
/* ------------------------------------------------------------------ */

interface Testimonial {
  quote: string;
  name: string;
  age: number;
  city: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Walking through Bronzeville with Rooted Forward changed how I see my own neighborhood.",
    name: "Maya",
    age: 17,
    city: "Chicago",
  },
  {
    quote:
      "I never knew the highway near my house was built to keep people apart. Now I can\u2019t unsee it.",
    name: "Darius",
    age: 19,
    city: "Dallas",
  },
  {
    quote:
      "The podcast episodes made me want to start a chapter in my own city.",
    name: "Sofia",
    age: 16,
    city: "San Francisco",
  },
  {
    quote:
      "This isn\u2019t just history \u2014 it\u2019s happening right now. Rooted Forward helped me understand that.",
    name: "Jaylen",
    age: 18,
    city: "New York",
  },
];

const AUTO_ROTATE_MS = 6000;

/* ------------------------------------------------------------------ */
/*  Slide variants                                                     */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TestimonialsSection() {
  const [[activeIndex, direction], setActiveIndex] = useState<
    [number, number]
  >([0, 1]);

  /* ---- auto-rotate ---- */
  const goTo = useCallback(
    (index: number) => {
      setActiveIndex([index, index > activeIndex ? 1 : -1]);
    },
    [activeIndex]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(([prev]) => [
        (prev + 1) % TESTIMONIALS.length,
        1,
      ]);
    }, AUTO_ROTATE_MS);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const testimonial = TESTIMONIALS[activeIndex];

  return (
    <section className="bg-cream-dark py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollReveal>
          <p className="text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Voices
          </p>
          <h2 className="mt-3 text-center font-display text-3xl text-forest md:text-4xl">
            What Participants Are Saying
          </h2>
        </ScrollReveal>

        {/* Carousel area */}
        <div className="relative mt-14 flex min-h-[16rem] flex-col items-center justify-center">
          {/* Decorative quote mark */}
          <span
            className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 select-none font-display text-[10rem] leading-none text-rust/20 md:text-[14rem]"
            aria-hidden="true"
          >
            &ldquo;
          </span>

          {/* Slides */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.blockquote
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.45,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="relative z-10 text-center"
            >
              <p className="mx-auto max-w-2xl font-display text-xl italic leading-relaxed text-ink md:text-2xl lg:text-3xl">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <footer className="mt-6">
                <span className="font-body text-base font-medium text-ink-light">
                  {testimonial.name}, {testimonial.age}
                </span>
                <span className="mx-2 text-warm-gray-light">&mdash;</span>
                <span className="font-body text-base text-warm-gray">
                  {testimonial.city}
                </span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          {/* Navigation dots */}
          <div
            className="mt-10 flex items-center gap-3"
            role="tablist"
            aria-label="Testimonial navigation"
          >
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => goTo(i)}
                className="group relative flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "h-3 w-3 bg-rust"
                      : "h-2 w-2 bg-warm-gray-light group-hover:bg-warm-gray"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
