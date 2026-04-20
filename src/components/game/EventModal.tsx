"use client";

import type { GameEvent } from "@/lib/game/types";
import { GameText } from "./Glossary";

export function EventModal({
  event,
  onChoose,
  onReadNote,
}: {
  event: GameEvent;
  onChoose: (optionIndex: number) => void;
  onReadNote: (term: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-cream shadow-2xl">
        <div className="border-b border-border bg-cream-dark px-6 py-4 md:px-8 md:py-5">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Event {typeof event.year === "number" ? event.year : `${event.year.from}-${event.year.to}`}
          </p>
          <h2 className="mt-2 font-display text-2xl text-forest md:text-3xl">{event.title}</h2>
        </div>

        <div className="px-6 py-5 md:px-8 md:py-6">
          <p className="font-display text-lg leading-snug text-forest md:text-xl md:leading-snug">
            {event.headline}
          </p>
          <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/75">
            {event.body}
          </p>

          {/* Glossary terms inline */}
          {event.glossary && event.glossary.length > 0 && (
            <p className="mt-4 font-body text-xs text-warm-gray">
              Related terms:{" "}
              {event.glossary.map((g, i) => (
                <span key={g}>
                  <button
                    type="button"
                    onClick={() => onReadNote(g)}
                    className="underline decoration-rust decoration-dotted underline-offset-2 hover:text-rust"
                  >
                    {g}
                  </button>
                  {i < event.glossary!.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {event.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onChoose(i)}
                className="group rounded-sm border-2 border-border bg-cream p-4 text-left transition-all hover:border-rust hover:bg-cream-dark"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-warm-gray group-hover:text-rust">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-body text-base font-medium text-forest">{opt.label}</span>
                </div>
                <EffectPreview effect={opt.effect} />
              </button>
            ))}
          </div>

          <p className="mt-6 font-body text-[11px] italic text-warm-gray">
            Source: {event.source}
          </p>
        </div>
      </div>
    </div>
  );
}

function EffectPreview({ effect }: { effect: import("@/lib/game/types").CardEffect }) {
  const items: { label: string; value: number }[] = [];
  if (effect.equity) items.push({ label: "Equity", value: effect.equity });
  if (effect.heritage) items.push({ label: "Heritage", value: effect.heritage });
  if (effect.growth) items.push({ label: "Growth", value: effect.growth });
  if (effect.sustainability) items.push({ label: "Sustain.", value: effect.sustainability });
  if (effect.capital) items.push({ label: "Capital", value: effect.capital });
  if (effect.power) items.push({ label: "Power", value: effect.power });
  if (effect.trust) items.push({ label: "Trust", value: effect.trust });
  if (effect.knowledge) items.push({ label: "Knowledge", value: effect.knowledge });
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-7 font-body text-[11px]">
      {items.map((it, i) => (
        <span key={i} className={it.value > 0 ? "text-forest" : "text-rust-dark"}>
          {it.label} {it.value > 0 ? "+" : ""}{it.value}
        </span>
      ))}
    </div>
  );
}
