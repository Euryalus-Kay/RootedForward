import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Podcast | Rooted Forward",
  description:
    "The Rooted Forward podcast. Conversations about the policies and decisions that shaped Chicago neighborhoods along racial lines.",
};

const SPOTIFY_SHOW_ID = "6oekK4O4a23dQSNdLdQ3gA";

export default function PodcastsPage() {
  return (
    <PageTransition>
      {/* ============================================================
          BANNER
          Hero image with a forest tint overlay, matching the
          research, policy, and game banner treatment.
          ============================================================ */}
      <section className="relative pt-16 pb-12 md:pb-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] md:text-5xl lg:text-6xl">
            Podcast
          </h1>
        </div>
      </section>

      {/* Intro prose */}
      <section className="bg-cream pb-8 pt-12 md:pt-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Podcast
          </p>
          <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
            Each episode goes deeper into the places our walking tours visit.
            We talk to historians, lifelong residents, urban planners, and
            organizers about the policies and decisions that shaped
            Chicago&rsquo;s neighborhoods along racial lines.
          </p>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* Spotify show player — auto-updates when new episodes are published */}
      <section className="bg-cream pb-20 pt-8 md:pb-28">
        <div className="mx-auto max-w-3xl px-6">
          <iframe
            src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW_ID}?utm_source=generator&theme=0`}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
            title="Rooted Forward Podcast on Spotify"
          />
          <p className="mt-6 font-body text-sm text-warm-gray">
            Listen on{" "}
            <a
              href={`https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-forest underline underline-offset-2"
            >
              Spotify
            </a>{" "}
            or wherever you get your podcasts. New episodes appear here
            automatically.
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
