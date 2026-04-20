"use client";

import { useEffect } from "react";
import type { ToastMessage } from "@/lib/game/types";

export function Toasts({
  messages,
  onDismiss,
}: {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timers = messages.map((m) =>
      setTimeout(() => onDismiss(m.id), m.ttl)
    );
    return () => timers.forEach(clearTimeout);
  }, [messages, onDismiss]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex max-w-sm flex-col gap-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`pointer-events-auto rounded-sm border px-4 py-2 shadow-lg transition-all ${
            m.kind === "good"
              ? "border-forest/30 bg-forest text-cream"
              : m.kind === "warn"
                ? "border-rust/30 bg-rust text-white"
                : m.kind === "achievement"
                  ? "border-amber-500 bg-amber-100 text-amber-900"
                  : "border-border bg-cream text-ink"
          }`}
        >
          <p className="font-body text-sm">{m.text}</p>
        </div>
      ))}
    </div>
  );
}
