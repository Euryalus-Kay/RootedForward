import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Podcast | Rooted Forward",
  description:
    "The Rooted Forward podcast. Conversations about the policies and decisions that shaped Chicago neighborhoods along racial lines.",
};

/*
  Spotify show ID for Rooted Forward.
  The full show embed auto-updates when new episodes are published.
  To find your show ID: open your podcast in Spotify, click Share,
  copy the link. The ID is the string after /show/.
*/
const SPOTIFY_SHOW_ID = "6oekK4O4a23dQSNdLdQ3gA";

/*
  Individual episode embeds. Add new episodes to the top of this array.
  To get an episode embed URL: open the episode in Spotify, click Share,
  click "Embed episode", copy the src from the iframe.
*/
const EPISODES = [
  {
    id: "33iDOkYfD3XutfCLHTV1DC",
    embed_url:
      "https://open.spotify.com/embed/episode/33iDOkYfD3XutfCLHTV1DC?utm_source=generator&theme=0",
  },
  // Add more episodes here as they are published:
  // {
  //   id: "YOUR_EPISODE_ID",
  //   embed_url: "https://open.spotify.com/embed/episode/YOUR_EPISODE_ID?utm_source=generator&theme=0",
  // },
];

export default function PodcastsPage() {
  const hasShowEmbed = SPOTIFY_SHOW_ID.length > 0;

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

      {/* Full show player (auto-updates from Spotify) */}
      {hasShowEmbed && (
        <section className="bg-cream py-10">
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
            <p className="mt-4 font-body text-xs text-warm-gray">
              New episodes appear here automatically from Spotify.
            </p>
          </div>
        </section>
      )}

      {/* Individual episodes */}
      <section className="bg-cream pb-20 pt-8 md:pb-28">
        <div className="mx-auto max-w-3xl px-6">
          {!hasShowEmbed && (
            <p className="mb-8 font-body text-sm text-warm-gray">
              Listen on{" "}
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline underline-offset-2"
              >
                Spotify
              </a>{" "}
              or wherever you get your podcasts.
            </p>
          )}

          <div className="flex flex-col gap-6">
            {EPISODES.map((episode, index) => (
              <div key={episode.id}>
                {index > 0 && <hr className="mb-6 border-border" />}
                <iframe
                  src={episode.embed_url}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                  title={`Episode ${EPISODES.length - index}`}
                />
              </div>
            ))}
          </div>

          {EPISODES.length === 0 && (
            <p className="py-12 text-center font-body text-base text-warm-gray">
              Episodes coming soon.
            </p>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
