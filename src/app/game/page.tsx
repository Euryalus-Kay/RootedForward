import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import GameRoot from "@/components/game/GameRoot";

export const metadata: Metadata = {
  title: "Game | Rooted Forward",
  description:
    "Build the Block. A strategy game about a hundred years of Chicago neighborhood policy. Real cards, real events, real history.",
};

export default function GamePage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* ==========================================================
            BANNER
            Hero image with a forest tint overlay, matching the
            research, policy, and podcasts banner treatment.
            ========================================================== */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
            <h1 className="font-display text-4xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] md:text-5xl lg:text-6xl">
              Game
            </h1>
          </div>
        </section>

        <GameRoot />
      </div>
    </PageTransition>
  );
}
