/* ------------------------------------------------------------------ */
/*  /podcasts                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Public podcast page. Pulls from the podcasts Supabase table when */
/*  configured, falls back to the Spotify show embed when there are   */
/*  no DB rows. Every episode an admin adds at /admin/podcasts shows */
/*  up here in episode-number-descending order.                        */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import type { Podcast } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Podcast | Rooted Forward",
  description:
    "The Rooted Forward podcast. Conversations about the policies and decisions that shaped Chicago neighborhoods along racial lines.",
};

export const revalidate = 600;

const SPOTIFY_SHOW_ID = "6oekK4O4a23dQSNdLdQ3gA";

async function fetchPublishedPodcasts(): Promise<Podcast[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .eq("published", true)
      .order("episode_number", { ascending: false });
    if (error) return [];
    return (data ?? []) as Podcast[];
  } catch {
    return [];
  }
}

function formatPublishDate(date: string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PodcastsPage() {
  const episodes = await fetchPublishedPodcasts();
  const hasEpisodes = episodes.length > 0;

  return (
    <PageTransition>
      {/* Banner */}
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

      {/* Intro */}
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

      {/* Episodes from the database */}
      {hasEpisodes ? (
        <section className="bg-cream pb-12 pt-4">
          <div className="mx-auto max-w-3xl px-6">
            <ul className="space-y-12">
              {episodes.map((ep) => (
                <li key={ep.id} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-[12px] uppercase tracking-widest text-rust">
                      Episode {ep.episode_number}
                    </span>
                    <span className="font-body text-[12px] text-warm-gray">
                      {formatPublishDate(ep.publish_date)}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl leading-snug text-forest md:text-[28px]">
                    {ep.title}
                  </h2>
                  <p className="max-w-[60ch] font-body text-base leading-relaxed text-ink/80">
                    {ep.description}
                  </p>
                  {ep.guests && ep.guests.length > 0 && (
                    <p className="font-body text-[13px] text-warm-gray">
                      With {ep.guests.join(", ")}
                    </p>
                  )}
                  {ep.embed_url && (
                    <iframe
                      src={ep.embed_url}
                      width="100%"
                      height="232"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="mt-2 rounded-lg"
                      title={`Episode ${ep.episode_number}: ${ep.title}`}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        /* Fallback to Spotify show embed when DB has no rows */
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
              or wherever you get your podcasts.
            </p>
          </div>
        </section>
      )}

      {/* Listen-elsewhere strip — visible whenever DB-backed list is shown */}
      {hasEpisodes && (
        <section className="bg-cream pb-20 pt-8 md:pb-28">
          <div className="mx-auto max-w-3xl px-6">
            <hr className="mb-10 border-border" />
            <p className="font-body text-sm text-warm-gray">
              Subscribe on{" "}
              <a
                href={`https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline underline-offset-2"
              >
                Spotify
              </a>{" "}
              or wherever you get your podcasts.
            </p>
          </div>
        </section>
      )}
    </PageTransition>
  );
}
