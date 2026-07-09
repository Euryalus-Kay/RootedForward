"use client";

import { useState } from "react";

/* Small share helper for campaign pages. Copies the campaign URL to
   the clipboard and confirms inline. */

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable; the X share link still works */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="font-body text-sm text-forest underline underline-offset-2 hover:text-rust"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
