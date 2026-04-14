import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import { PLACEHOLDER_PODCASTS } from "@/lib/constants";
import type { Podcast } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Podcasts | Rooted Forward",
  description:
    "Conversations with historians, residents, and organizers about the places our walking tours visit.",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function padEpisode(num: number): string {
  return String(num).padStart(2, "0");
}

async function getPodcasts() {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("podcasts")
      .select(
        "title, description, embed_url, episode_number, publish_date, guests"
      )
      .eq("published", true)
      .order("episode_number", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Pick<
        Podcast,
        | "title"
        | "description"
        | "embed_url"
        | "episode_number"
        | "publish_date"
        | "guests"
      >[];
    }
  } catch {
    // Supabase not configured — fall through
  }

  return PLACEHOLDER_PODCASTS;
}

export default async function PodcastsPage() {
  const podcasts = await getPodcasts();

  return (
    <PageTransition>
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          {/* Page Header */}
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Podcasts
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-5xl lg:text-6xl">
            The Podcast
          </h1>
          <hr className="mt-8 border-border" />

          <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-ink/75">
            Each episode goes deeper into the places our walking tours visit.
            We talk to historians, lifelong residents, urban planners, and
            organizers about the policies and decisions that shaped
            Chicago&rsquo;s neighborhoods along racial lines.
          </p>
        </div>
      </section>

      {/* Episode List */}
      <section className="bg-cream pb-24 md:pb-32">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-8">
            {podcasts.map((episode) => (
              <article
                key={episode.episode_number}
                className="rounded-sm border border-border bg-cream-dark p-8 md:p-10 lg:p-12"
              >
                <div className="flex flex-col gap-6 md:flex-row md:gap-10">
                  {/* Episode Number */}
                  <div className="flex-shrink-0">
                    <span className="font-display text-6xl font-light leading-none text-rust md:text-7xl">
                      {padEpisode(episode.episode_number)}
                    </span>
                  </div>

                  {/* Episode Content */}
                  <div className="flex-1">
                    <h2 className="font-display text-2xl leading-snug text-forest">
                      {episode.title}
                    </h2>

                    {episode.guests && episode.guests.length > 0 && (
                      <p className="mt-2 font-body italic text-warm-gray">
                        with {episode.guests.join(", ")}
                      </p>
                    )}

                    <p className="mt-1 font-body text-sm text-warm-gray-light">
                      {formatDate(episode.publish_date)}
                    </p>

                    <p className="mt-4 font-body leading-relaxed text-ink/75">
                      {episode.description}
                    </p>

                    {/* Embed Area */}
                    <div className="mt-6">
                      {episode.embed_url ? (
                        <iframe
                          src={episode.embed_url}
                          width="100%"
                          height="152"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="rounded-sm"
                          title={`Listen to ${episode.title}`}
                        />
                      ) : (
                        <div className="flex items-center justify-center rounded-sm border border-border bg-cream px-6 py-8">
                          <p className="font-body text-sm tracking-wide text-warm-gray">
                            Episode coming soon
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
