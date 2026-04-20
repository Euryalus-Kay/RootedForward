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
        <GameRoot />
      </div>
    </PageTransition>
  );
}
