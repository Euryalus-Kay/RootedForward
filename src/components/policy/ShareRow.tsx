"use client";

/* Share row for campaign detail pages. The copy button writes the
   canonical campaign URL to the clipboard; the X link opens a
   prefilled post. Kept tiny so the page stays a server component. */

import { useState } from "react";

interface ShareRowProps {
  title: string;
  url: string;
}

export default function ShareRow({ title, url }: ShareRowProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable; leave the button as-is.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="link-draw font-body text-sm font-medium text-forest"
      >
        X / Twitter
      </a>
      <button
        onClick={handleCopy}
        className="link-draw cursor-pointer font-body text-sm font-medium text-forest"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
