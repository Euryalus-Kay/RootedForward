/* ------------------------------------------------------------------ */
/*  /podcasts                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Public podcast page. Pulls from the podcasts Supabase table when */
/*  configured, falls back to the Spotify show embed when there are   */
/*  no DB rows. Every episode an admin adds at /admin/podcasts shows */
/*  up here in episode-number-descending order as a ledger-style      */
/*  archive row rendered by PodcastCard.                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import PodcastCard from "@/components/podcasts/PodcastCard";
import type { Podcast } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Podcast | Rooted Forward",
  description:
    "The Rooted Forward podcast. Conversations about the policies and decisions that shaped Chicago neighborhoods along racial lines.",
};

export const revalidate = 600;

const SPOTIFY_SHOW_ID = "6oekK4O4a23dQSNdLdQ3gA";
const SPOTIFY_SHOW_URL = `https://open.spotify.com/show/${SPOTIFY_SHOW_ID}`;

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

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Most recent publish date across the fetched episodes, if any parse. */
function latestPublishDate(episodes: Podcast[]): Date | null {
  const dates = episodes
    .map((ep) => new Date(ep.publish_date + "T00:00:00"))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0] ?? null;
}

export default async function PodcastsPage() {
  const episodes = await fetchPublishedPodcasts();
  const hasEpisodes = episodes.length > 0;
  const latest = latestPublishDate(episodes);

  const bannerMeta = hasEpisodes
    ? [
        `${episodes.length} episode${episodes.length === 1 ? "" : "s"}`,
        ...(latest ? [`Latest ${formatShortDate(latest)}`] : []),
        "Streaming on Spotify",
      ]
    : ["Streaming on Spotify"];

  return (
    <PageTransition>
      <PageBanner
        eyebrow="Education / Podcast"
        title="The Podcast"
        dek="Each episode goes deeper into the places our walking tours visit. We talk with historians, lifelong residents, urban planners, and organizers about the policies and decisions that shaped Chicago's neighborhoods along racial lines."
        meta={bannerMeta}
      />

      {hasEpisodes ? (
        /* ==========================================================
            EPISODE ARCHIVE — ledger rows from the database
            ========================================================== */
        <section className="relative bg-cream py-16 md:py-24">
          <div className="grid-lines absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Episode index"
                title="The archive"
                lede="Newest episodes first. Each entry carries its guests, its date, and the player for the full conversation."
              />
              <Reveal delay={0.2}>
                <a
                  href={SPOTIFY_SHOW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  Open in Spotify
                  <span aria-hidden="true" className="arrow-nudge">
                    &rarr;
                  </span>
                </a>
              </Reveal>
            </div>

            <div className="mt-12 border-b border-border md:mt-16">
              {episodes.map((ep, i) => (
                <Reveal key={ep.id} delay={Math.min(i, 3) * 0.06} y={20}>
                  <PodcastCard {...ep} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* ==========================================================
            FALLBACK — Spotify show embed when DB has no rows
            ========================================================== */
        <section className="relative bg-cream py-16 md:py-24">
          <div className="grid-lines absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
            <SectionHeading
              eyebrow="The show"
              title="Start listening"
              lede="The full show streams below. Subscribe on Spotify or wherever you get your podcasts."
            />

            <Reveal delay={0.15}>
              <div className="mt-12 border border-border bg-white/40 p-4 md:p-5">
                <p className="ledger px-1 pb-4 text-warm-gray">
                  Rooted Forward / Full show
                </p>
                <iframe
                  src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW_ID}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block"
                  style={{ border: "none", borderRadius: "12px" }}
                  title="Rooted Forward Podcast on Spotify"
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============================================================
          SUBSCRIBE — dark closer band
          ============================================================ */}
      <section className="grain relative overflow-hidden bg-ink py-16 md:py-24">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              tone="dark"
              eyebrow="Subscribe"
              title="Take the conversations with you"
              lede="Subscribe on Spotify or wherever you get your podcasts."
            />
            <Reveal delay={0.2}>
              <Magnetic>
                <a
                  href={SPOTIFY_SHOW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Open in Spotify
                </a>
              </Magnetic>
            </Reveal>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
