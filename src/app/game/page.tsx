import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import BuildTheBlock from "@/components/game/BuildTheBlock";

export const metadata: Metadata = {
  title: "The Game | Rooted Forward",
  description:
    "Build the Block — a 20-minute browser game where you make a century of decisions in a fictional Chicago ward. Real history, real consequences.",
};

export default function GamePage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        <BuildTheBlock />
      </div>
    </PageTransition>
  );
}
