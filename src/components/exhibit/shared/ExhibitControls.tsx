"use client";
/* ------------------------------------------------------------------ */
/*  The small fixed control cluster: mute, captions, transcript, and   */
/*  in guided mode pause or resume. Right-anchored on every viewport:  */
/*  on narrow screens it docks into the reserved right slot of the     */
/*  HudFrame strip's first row (matching top offsets), on md+ it sits  */
/*  in the top-right corner clear of the centered chapter column.      */
/*  Hidden at the mode gate.                                           */
/* ------------------------------------------------------------------ */
import { Captions, CaptionsOff, FileText, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";

const controlButton =
  "flex h-12 w-12 items-center justify-center text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen";

export default function ExhibitControls() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();

  if (state.playState === "gate") return null;

  const guided = state.mode === "guided";
  const showPause = guided && (state.playState === "playing" || state.playState === "paused");
  const paused = state.playState === "paused";

  return (
    <div
      data-testid="exhibit-controls"
      className="fixed right-1.5 top-[calc(env(safe-area-inset-top,0px)+0.375rem)] z-40 flex items-center divide-x divide-exh-ink/20 border border-exh-ink/30 bg-exh-linen shadow-sm md:right-3 md:top-3"
    >
      {showPause && (
        <button
          type="button"
          onClick={() => dispatch({ type: paused ? "RESUME" : "PAUSE" })}
          aria-label={paused ? "Resume the tour" : "Pause the tour"}
          className={controlButton}
        >
          {paused ? (
            <Play className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Pause className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
        aria-label={state.muted ? "Unmute narration" : "Mute narration"}
        aria-pressed={state.muted}
        className={controlButton}
      >
        {state.muted ? (
          <VolumeX className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "TOGGLE_CAPTIONS" })}
        aria-label={state.captionsOn ? "Turn captions off" : "Turn captions on"}
        aria-pressed={state.captionsOn}
        className={controlButton}
      >
        {state.captionsOn ? (
          <Captions className="h-5 w-5" aria-hidden="true" />
        ) : (
          <CaptionsOff className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "TOGGLE_TRANSCRIPT" })}
        aria-label="Open the transcript"
        aria-haspopup="dialog"
        aria-expanded={state.transcriptOpen}
        className={controlButton}
      >
        <FileText className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
