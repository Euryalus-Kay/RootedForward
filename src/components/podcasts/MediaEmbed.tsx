"use client";

import {
  toEmbedUrl,
  toApplePodcastsEmbedUrl,
  detectEmbedPlatform,
  type EmbedPlatform,
} from "@/lib/utils";

interface MediaEmbedProps {
  url: string;
  title: string;
}

function SpotifyEmbed({ url, title }: { url: string; title: string }) {
  const embedSrc = toEmbedUrl(url);
  return (
    <iframe
      src={embedSrc}
      width="100%"
      height="152"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg"
      title={`Listen: ${title}`}
      style={{ border: "none", borderRadius: "12px" }}
    />
  );
}

function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const embedSrc = toEmbedUrl(url);
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-ink">
      <iframe
        src={embedSrc}
        title={`Watch: ${title}`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: "none" }}
      />
    </div>
  );
}

function ApplePodcastsEmbed({ url, title }: { url: string; title: string }) {
  const embedSrc = toApplePodcastsEmbedUrl(url);
  return (
    <iframe
      src={embedSrc}
      width="100%"
      height="175"
      allow="autoplay; clipboard-write; encrypted-media"
      loading="lazy"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      className="rounded-lg"
      title={`Listen: ${title}`}
      style={{ border: "none", borderRadius: "12px" }}
    />
  );
}

function GenericEmbed({ url, title }: { url: string; title: string }) {
  return (
    <iframe
      src={url}
      width="100%"
      height="200"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      className="rounded-lg"
      title={title}
      style={{ border: "none", borderRadius: "12px" }}
    />
  );
}

export default function MediaEmbed({ url, title }: MediaEmbedProps) {
  if (!url) {
    return (
      <div className="flex items-center justify-center rounded-sm border border-border bg-cream px-6 py-8">
        <p className="font-body text-sm tracking-wide text-warm-gray">
          Episode coming soon
        </p>
      </div>
    );
  }

  const platform = detectEmbedPlatform(url);

  switch (platform) {
    case "spotify":
      return <SpotifyEmbed url={url} title={title} />;
    case "youtube":
      return <YouTubeEmbed url={url} title={title} />;
    case "apple-podcasts":
      return <ApplePodcastsEmbed url={url} title={title} />;
    default:
      return <GenericEmbed url={url} title={title} />;
  }
}
