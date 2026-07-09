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
import SurveyRule from "@/components/ui/SurveyRule";
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
      {/* Opener */}
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Podcast
          </p>
          <h1 className="mt-4 max-w-[18ch] font-display text-4xl leading-[1.05] text-ink md:text-5xl">
            The podcast
          </h1>
          <p className="mt-6 max-w-[55ch] font-body text-lg leading-relaxed text-ink/75">
            Conversations about Chicago&rsquo;s neighborhoods and the
            policies that shaped them. Listen right here or wherever you
            get your podcasts.
          </p>
          <SurveyRule className="mt-10 text-rust" />
        </div>
      </section>

      {/* Episodes from the database */}
      {hasEpisodes ? (
        <section className="bg-cream pb-12 pt-12 md:pt-16">
          <div className="mx-auto max-w-3xl px-6">
            <ul className="space-y-12">
              {episodes.map((ep) => (
                <li key={ep.id} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-mono text-[12px] uppercase tracking-widest text-rust">
                      Episode {ep.episode_number}
                    </span>
                    <span className="font-body text-[12px] text-ink/60">
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
                    <p className="font-body text-[13px] text-ink/60">
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
        <section className="bg-cream pb-20 pt-12 md:pb-28 md:pt-16">
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
            <p className="mt-6 font-body text-sm text-ink/60">
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
            <p className="font-body text-sm text-ink/60">
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
