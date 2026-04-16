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
      {/* Header */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Podcast
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            The Podcast
          </h1>
          <p className="mt-8 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
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
