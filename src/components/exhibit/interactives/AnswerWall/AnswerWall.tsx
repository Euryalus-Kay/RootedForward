"use client";
/* ------------------------------------------------------------------ */
/*  The Wall, the closing station and CH11's final pause point. The    */
/*  exhibit ends on a question instead of a summary. Visitors type a   */
/*  140-character answer, optionally sign a first name, and their      */
/*  words join a review queue; approved answers from earlier visitors  */
/*  drift on the wall as linen chips. Everything a visitor submits is  */
/*  held for review before it appears, and the station says so.        */
/*                                                                     */
/*  Until migration 008 is applied the collection table does not       */
/*  exist. The API answers migrationPending and the station tells the  */
/*  visitor the truth instead of pretending the words were saved.      */
/*                                                                     */
/*  Completion fires on submit or after a twenty-second dwell, so a    */
/*  visitor who reads the wall without writing still closes the tour.  */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import Stamp from "../../shared/Stamp";

const PROMPT_ID = "who-is-this-city-built-for";
const BODY_CAP = 140;
const NAME_CAP = 40;
const DWELL_MS = 20000;

const WALL_CSS = `
.aw-drift { animation: awDrift var(--aw-dur, 9s) ease-in-out var(--aw-delay, 0s) infinite alternate; }
@keyframes awDrift { from { transform: translateY(2px); } to { transform: translateY(-4px); } }
.exhibit-root[data-motion="off"] .aw-drift { animation: none; }
`;

interface WallAnswer {
  body: string;
  displayName: string | null;
  createdAt: string;
}

type SubmitState = "idle" | "submitting" | "held" | "migrationPending" | "error";

const INPUT_CLASS =
  "h-12 w-full rounded-[2px] border border-exh-ink/40 bg-exh-linen px-3 text-base text-exh-ink placeholder:text-exh-ink/35 focus:border-exh-ink focus:outline-none disabled:opacity-50";

const LABEL_CLASS =
  "exh-plat mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft";

/** one approved answer, a linen chip on the wall */
function AnswerChip({
  answer,
  index,
  drift,
}: {
  answer: WallAnswer;
  index: number;
  drift: boolean;
}) {
  const style: React.CSSProperties & Record<string, string> = {
    marginTop: `${(index % 3) * 10}px`,
  };
  if (drift) {
    style["--aw-dur"] = `${8 + (index % 5) * 1.7}s`;
    style["--aw-delay"] = `${(index % 7) * -1.3}s`;
  }
  return (
    <PaperCard className={`max-w-64 px-3 py-2.5 ${drift ? "aw-drift" : ""}`} style={style}>
      <p className="font-display text-base leading-snug text-exh-ink">{answer.body}</p>
      {answer.displayName && (
        <p className="exh-plat mt-1.5 text-[9px] uppercase tracking-[0.18em] text-exh-ink-soft">
          {answer.displayName}
        </p>
      )}
    </PaperCard>
  );
}

export default function AnswerWall() {
  const api = useInteractive();
  const apiRef = useRef(api);
  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [own, setOwn] = useState<{ body: string; displayName: string | null } | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [answers, setAnswers] = useState<WallAnswer[] | null>(null);

  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const fetchedRef = useRef(false);
  const doneRef = useRef(false);
  const lastInteractRef = useRef(0);

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    apiRef.current.onComplete();
  };

  /* fetch the wall when the station goes live */
  useEffect(() => {
    if (!api.active || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/exhibit/submissions?kind=answer_wall&prompt=${PROMPT_ID}`
        );
        const json = (await res.json().catch(() => null)) as {
          answers?: WallAnswer[];
        } | null;
        if (cancelled) return;
        setAnswers(res.ok && Array.isArray(json?.answers) ? json.answers : []);
      } catch {
        if (!cancelled) setAnswers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api.active]);

  /* a visitor who reads without writing still completes after a dwell */
  useEffect(() => {
    if (!api.active || doneRef.current) return;
    const t = setTimeout(complete, DWELL_MS);
    return () => clearTimeout(t);
  }, [api.active]);

  const onType = (value: string) => {
    setBody(value.slice(0, BODY_CAP));
    const now = performance.now();
    if (now - lastInteractRef.current > 400) {
      lastInteractRef.current = now;
      apiRef.current.onInteraction();
    }
  };

  const locked = submitState === "held" || submitState === "migrationPending";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || locked || submitState === "submitting") return;
    apiRef.current.onInteraction();

    const displayName = name.trim().slice(0, NAME_CAP) || null;
    /* optimistic: the visitor's own chip lands immediately, marked held */
    setOwn({ body: text, displayName });
    setSubmitState("submitting");
    complete();

    try {
      const res = await fetch("/api/exhibit/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "answer_wall",
          promptId: PROMPT_ID,
          body: text,
          displayName: displayName ?? undefined,
          website: honeypotRef.current?.value ?? "",
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        held?: boolean;
        migrationPending?: boolean;
      } | null;
      if (res.status === 503 && json?.migrationPending) {
        setSubmitState("migrationPending");
        return;
      }
      if (res.ok && json?.held) {
        setSubmitState("held");
        return;
      }
      setOwn(null);
      setSubmitState("error");
    } catch {
      setOwn(null);
      setSubmitState("error");
    }
  };

  const drift = !api.reducedMotion;
  const wallLoaded = answers !== null;

  return (
    <div className="w-full" data-testid="answer-wall" data-submit-state={submitState}>
      <style>{WALL_CSS}</style>

      {/* ---------------- the prompt plate ---------------- */}
      <div className="text-center">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          The exhibit ends on a question
        </p>
        <p className="font-display mt-2 text-2xl leading-snug text-exh-ink md:text-3xl">
          Who is this city built for?
        </p>
      </div>

      {/* ---------------- the visitor's answer ---------------- */}
      {!locked && (
        <form onSubmit={onSubmit} className="mx-auto mt-5 max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="aw-input" className={LABEL_CLASS}>
                Your answer
              </label>
              <input
                id="aw-input"
                data-testid="aw-input"
                type="text"
                value={body}
                onChange={(e) => onType(e.target.value)}
                maxLength={BODY_CAP}
                disabled={submitState === "submitting"}
                placeholder="In a sentence or less"
                autoComplete="off"
                className={INPUT_CLASS}
              />
              <p
                className="exh-mono mt-1 text-right text-[11px] text-exh-ink-soft"
                aria-hidden="true"
              >
                {body.length} / {BODY_CAP}
              </p>
            </div>
            <div className="sm:w-40">
              <label htmlFor="aw-name" className={LABEL_CLASS}>
                First name, optional
              </label>
              <input
                id="aw-name"
                data-testid="aw-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, NAME_CAP))}
                maxLength={NAME_CAP}
                disabled={submitState === "submitting"}
                autoComplete="off"
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-[11px]" aria-hidden="true">
                &nbsp;
              </p>
            </div>
          </div>

          {/* honeypot; humans never see it, autofillers do */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="aw-website">Website</label>
            <input
              id="aw-website"
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            data-testid="aw-submit"
            disabled={!body.trim() || submitState === "submitting"}
            className="exh-plat mt-2 min-h-12 w-full cursor-pointer rounded-[2px] border-2 border-exh-ink bg-exh-ink px-6 text-[11px] font-bold uppercase tracking-[0.25em] text-exh-linen transition-colors hover:bg-exh-ink/85 disabled:cursor-default disabled:opacity-40 sm:w-auto"
          >
            {submitState === "submitting" ? "Adding" : "Add your answer"}
          </button>

          {submitState === "error" && (
            <p className="mt-2 text-sm leading-snug text-exh-ink-soft" aria-live="polite">
              The wall could not take your answer just now. Try once more.
            </p>
          )}
        </form>
      )}

      {/* ---------------- the visitor's own chip ---------------- */}
      {own && (
        <div className="mt-5 flex justify-center" aria-live="polite">
          <PaperCard tone="deep" data-testid="aw-own" className="max-w-72 px-4 py-3 text-center">
            <p className="font-display text-base leading-snug text-exh-ink">{own.body}</p>
            {own.displayName && (
              <p className="exh-plat mt-1.5 text-[9px] uppercase tracking-[0.18em] text-exh-ink-soft">
                {own.displayName}
              </p>
            )}
            <div className="mt-2">
              <Stamp text="Held for review" tone="ink" size="sm" />
            </div>
          </PaperCard>
        </div>
      )}

      {submitState === "held" && (
        <p
          className="exh-plat mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-exh-ink-soft"
          aria-live="polite"
        >
          A person reads every answer before it joins the wall
        </p>
      )}

      {submitState === "migrationPending" && (
        <p
          className="mx-auto mt-3 max-w-md text-center text-sm leading-snug text-exh-ink-soft"
          aria-live="polite"
          data-testid="aw-migration-pending"
        >
          The wall opens when the collection table is installed. Your words were not lost;
          write them down.
        </p>
      )}

      {/* ---------------- the wall ---------------- */}
      <div className="mt-7 border-t border-exh-ink/20 pt-5">
        <p className="exh-plat text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          From earlier visitors
        </p>
        <div
          data-testid="aw-field"
          className="mt-4 flex flex-wrap items-start justify-center gap-3"
        >
          {wallLoaded &&
            answers.map((a, i) => (
              <AnswerChip key={`${a.createdAt}-${i}`} answer={a} index={i} drift={drift} />
            ))}
        </div>
        {wallLoaded && answers.length === 0 && (
          <p className="exh-plat mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-exh-ink/50">
            The first answers are being gathered.
          </p>
        )}
        {!wallLoaded && (
          <p className="exh-plat mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-exh-ink/50">
            Reading the wall
          </p>
        )}
      </div>
    </div>
  );
}
