import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { layoutDoc } from "@/lib/immersive/timeline";
import { ORCHESTRATION_PRESETS, STUDIO_MODELS } from "@/lib/immersive/types";
import type {
  ScriptResult,
  SequenceDoc,
  StudioAgentAction,
  StudioAgentRequest,
  StudioClipAnalysis,
} from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  Studio agent pipeline.                                             */
/*                                                                     */
/*  Three agents share one endpoint, dispatched by action:             */
/*    analyze  - the Analyst looks at sampled frames from a clip and   */
/*               returns a structured read of its content.             */
/*    direct   - the Director turns the brief + clip analyses into a   */
/*               SequenceDoc (the playable edit decision list).        */
/*    critique - the Critic reviews a sequence for pacing and          */
/*               continuity and may return a revised cut.              */
/*    revise   - the Director applies a chat instruction to the        */
/*               current sequence, or answers a question about it.     */
/*                                                                     */
/*  Every call uses adaptive thinking and JSON schema enforced         */
/*  structured outputs, so the client never parses free-form text.     */
/*  The model is orchestrated per role: Fable 5 for the creative and   */
/*  visual roles, Opus 4.8 for surgical cuts and review. The client    */
/*  may override per call from an allowlist.                           */
/* ------------------------------------------------------------------ */

export const maxDuration = 120;

const DEFAULT_MODELS = ORCHESTRATION_PRESETS[0].models;

function modelFor(action: StudioAgentAction, requested?: string): string {
  if (
    requested &&
    (STUDIO_MODELS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return DEFAULT_MODELS[action];
}

/* --------------------------- auth ------------------------------- */

async function checkAccess(): Promise<NextResponse | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
  }
  // Local fallback mode has no auth system at all; never allow that in
  // a production deployment.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }
  return null;
}

/* ------------------------ output schemas ------------------------- */

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "subjects",
    "motion",
    "quality",
    "looksEquirect",
    "suggestedInSec",
    "suggestedOutSec",
    "bestMoments",
  ],
  properties: {
    summary: { type: "string" },
    subjects: { type: "array", items: { type: "string" } },
    motion: { type: "string" },
    quality: { type: "string" },
    looksEquirect: { type: "boolean" },
    suggestedInSec: { type: "number" },
    suggestedOutSec: { type: "number" },
    bestMoments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["atSec", "why"],
        properties: {
          atSec: { type: "number" },
          why: { type: "string" },
        },
      },
    },
  },
} as const;

/* Overlay text item. Position is plain xPct/yPct coordinates of the
   text's center (2..98); the old three-slot position enum was swapped
   out to pay the compiled-grammar cost of the audio field. */
const OVERLAY_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "kind",
    "text",
    "startSec",
    "endSec",
    "xPct",
    "yPct",
    "style",
    "anim",
  ],
  properties: {
    kind: { type: "string", enum: ["title", "lower-third", "caption"] },
    text: { type: "string" },
    startSec: { type: "number" },
    endSec: { type: "number" },
    xPct: { type: "number" },
    yPct: { type: "number" },
    style: {
      type: "object",
      additionalProperties: false,
      required: ["size", "color", "background"],
      properties: {
        size: { type: "string", enum: ["sm", "md", "lg"] },
        color: {
          type: "string",
          enum: ["cream", "white", "rust", "ink"],
        },
        background: { type: "boolean" },
      },
    },
    anim: {
      type: "string",
      enum: ["fade", "slide-up", "pop", "none"],
    },
  },
} as const;

const SEGMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "clipId",
    "mode",
    "inSec",
    "outSec",
    "speed",
    "transitionIn",
    "kenBurns",
    "panoMotion",
    "filter",
    "overlays",
    "gain",
    "audioFade",
  ],
  properties: {
    id: { type: "string" },
    clipId: { type: "string" },
    mode: { type: "string", enum: ["2d", "pano360"] },
    inSec: { type: "number" },
    outSec: { type: "number" },
    speed: { type: "number" },
    transitionIn: {
      type: "object",
      additionalProperties: false,
      required: ["type", "durationSec"],
      properties: {
        type: {
          type: "string",
          enum: [
            "cut",
            "crossfade",
            "dip-black",
            "slide-left",
            "ripple",
            "wipe",
            "zoom",
            "blur",
          ],
        },
        durationSec: { type: "number" },
      },
    },
    kenBurns: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["fromScale", "toScale", "fromX", "fromY", "toX", "toY"],
          properties: {
            fromScale: { type: "number" },
            toScale: { type: "number" },
            fromX: { type: "number" },
            fromY: { type: "number" },
            toX: { type: "number" },
            toY: { type: "number" },
          },
        },
        { type: "null" },
      ],
    },
    panoMotion: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["fromYawDeg", "toYawDeg", "pitchDeg"],
          properties: {
            fromYawDeg: { type: "number" },
            toYawDeg: { type: "number" },
            pitchDeg: { type: "number" },
          },
        },
        { type: "null" },
      ],
    },
    filter: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: [
            "brightness",
            "contrast",
            "saturate",
            "hueDeg",
            "blur",
            "grayscale",
            "sepia",
          ],
          properties: {
            brightness: { type: "number" },
            contrast: { type: "number" },
            saturate: { type: "number" },
            hueDeg: { type: "number" },
            blur: { type: "number" },
            grayscale: { type: "number" },
            sepia: { type: "number" },
          },
        },
        { type: "null" },
      ],
    },
    overlays: { type: "array", items: OVERLAY_ITEM_SCHEMA },
    /* Clip soundtrack as two plain numbers; an object or a nullable
       union here pushes the compiled grammar over the API size limit.
       gain 0 = silent. The route expands them to SegmentAudio. */
    gain: { type: "number" },
    audioFade: { type: "number" },
  },
} as const;

const AUDIO_TRACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "clipId",
    "volume",
    "fadeInSec",
    "fadeOutSec",
    "loop",
    "offsetSec",
  ],
  properties: {
    clipId: { type: "string" },
    volume: { type: "number" },
    fadeInSec: { type: "number" },
    fadeOutSec: { type: "number" },
    loop: { type: "boolean" },
    offsetSec: { type: "number" },
  },
} as const;

const SEQUENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "notes",
    "aspect",
    "music",
    "voiceover",
    "segments",
  ],
  properties: {
    title: { type: "string" },
    notes: { type: "string" },
    aspect: { type: "string", enum: ["16:9", "9:16", "1:1"] },
    music: { anyOf: [AUDIO_TRACK_SCHEMA, { type: "null" }] },
    voiceover: { anyOf: [AUDIO_TRACK_SCHEMA, { type: "null" }] },
    /* subtitles are deliberately NOT in this schema; they carry
       through server-side and the script action writes them. The
       grammar budget went to overlay coordinates and clip gain. */
    segments: { type: "array", items: SEGMENT_SCHEMA },
  },
} as const;

const SCRIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["narration", "subtitles", "notes"],
  properties: {
    narration: { type: "string" },
    subtitles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["startSec", "endSec", "text"],
        properties: {
          startSec: { type: "number" },
          endSec: { type: "number" },
          text: { type: "string" },
        },
      },
    },
    notes: { type: "string" },
  },
} as const;

/* The full sequence schema compiles to a grammar close to the API's
   size limit; wrapping it in a larger response object tips it over.
   Revise and critique therefore run as two calls each: a small
   verdict/reply call first, then (only when something must change) a
   second call whose schema is the bare sequence. Questions resolve in
   one fast call this way. */

const CRITIQUE_HEAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "issues", "pacingNotes"],
  properties: {
    verdict: { type: "string", enum: ["approve", "revise"] },
    issues: { type: "array", items: { type: "string" } },
    pacingNotes: { type: "string" },
  },
} as const;

const REVISE_HEAD_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "changed", "changelog"],
  properties: {
    reply: { type: "string" },
    changed: { type: "boolean" },
    changelog: { type: "array", items: { type: "string" } },
  },
} as const;

/* Patch-shaped text pass: redesigns overlays per segment without
   regenerating (or risking) the rest of the cut. */
const OVERLAYS_PATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "items"],
  properties: {
    reply: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["segmentId", "overlays"],
        properties: {
          segmentId: { type: "string" },
          overlays: { type: "array", items: OVERLAY_ITEM_SCHEMA },
        },
      },
    },
  },
} as const;

/* ------------------------ system prompts ------------------------- */

const HOUSE_STYLE = `House writing rules for any overlay text you produce:
- No em-dashes. Use commas, periods, or parentheses.
- No colons inside sentences and no colons in titles.
- Plain, concrete, documentary tone. No hype words.
- Never state a factual claim (dates, numbers, names, history) that was not given to you in the brief or clip context. Test footage gets neutral text.`;

const SEQUENCE_GRAMMAR = `You output an edit decision list with this grammar:
- segments play in order; each references a clip by clipId and trims it with inSec/outSec (seconds within the clip, inSec < outSec, never beyond the clip duration).
- mode is "2d" for flat clips and "pano360" for equirectangular clips. Only mark a segment pano360 if the clip is 360.
- speed is the playback rate, normally 1. Use 0.5 to 0.75 for a slow contemplative beat, 1.5 to 2 to compress dull motion. A segment's screen time is (out - in) / speed.
- transitionIn describes how the segment enters. "cut" (durationSec 0) for hard cuts, "crossfade" (0.6 to 1.2s) as the workhorse, "dip-black" (0.8 to 1.4s) for chapter breaks, "slide-left" (0.7 to 1s) for lateral moves, "wipe" (0.6 to 1s) for brisk reveals, "zoom" (0.7 to 1s) for energy, "blur" (0.8 to 1.2s) for dreamlike shifts, "ripple" (1 to 1.6s) as the water signature, at most once or twice per cut.
- The first segment always enters with a cut.
- kenBurns animates 2d segments. Scales stay between 1.0 and 1.18, pan values between -1 and 1. Use slow moves, never both a big zoom and a big pan at once. Set kenBurns null on pano360 segments.
- panoMotion animates pano360 segments as a slow heading drift in degrees (20 to 140 degrees of total travel reads well, pitchDeg between -20 and 20). Set panoMotion null on 2d segments.
- filter is an optional color grade per 2d segment (null for none). brightness/contrast/saturate stay between 0.7 and 1.3, hueDeg between -30 and 30, blur normally 0, grayscale and sepia 0 to 1 only for deliberate looks. A cool teal grade reads as underwater (saturate 1.1, hueDeg -12, brightness 0.95). Use grades to unify the cut, not on every segment differently.
- overlays sit on a segment with startSec/endSec relative to the segment's screen time, inside its duration. "title" for the opening card, "lower-third" for labels, "caption" for guidance. xPct/yPct place the text's center as a percentage of the frame (2 to 98). Canonical placements: a title at 50/45, a lower-third at 18/84, a caption at 50/88; place text away from the action when the clip analysis says where the action is. When revising, carry existing overlay positions through unchanged unless the note is about them. Each overlay carries style {size sm|md|lg, color cream|white|rust|ink, background true|false} and anim "fade"|"slide-up"|"pop"|"none". Titles look best size lg, color cream, background false, anim slide-up. Lower-thirds best size md, background true. Keep text under 60 characters.
- gain is the clip's own soundtrack level per segment, 0 to 1. Most segments use 0 (silent). Ride natural sound under the music with 0.2 to 0.5. audioFade fades that sound in and out (0.5 to 1 second reads well; use 0 when gain is 0).
- aspect is "16:9" unless the brief asks for vertical ("9:16") or square ("1:1").
- music points at an audio clip from the bin when one exists (volume 0.4 to 0.6, fadeInSec 1 to 2, fadeOutSec 2 to 3, loop true, offsetSec 0). Set music null when the bin has no audio.
- voiceover points at a recorded narration audio clip from the bin (its name usually starts with "voiceover") when the editor asks for one, same fields as music but volume 0.9 to 1 and loop false. Otherwise null. While a voiceover plays, the music ducks automatically.
- subtitles are not part of your output. They are written by the narration step and edited by hand, and they carry through every revision automatically.
- Segment ids are short and unique, like "seg-1".`;

const ANALYST_SYSTEM = `You are the Analyst in a documentary video pipeline for Rooted Forward, a civic history project. You receive frames sampled evenly across one clip plus its metadata. Describe only what is visibly there. Note whether the frames look like an equirectangular 360 source (strong horizontal stretching, a full horizon wrap, pole distortion at top and bottom, or compass and horizon markings). Suggest the strongest in/out trim in seconds within the clip duration and call out the best moments with timestamps. Be concrete and brief. If the footage is a labeled synthetic test pattern, say so plainly in the summary.`;

const DIRECTOR_SYSTEM = `You are the Director in a hybrid 2D/360 editing studio for Rooted Forward, a civic history project about urban policy and the Chicago waterfront. You turn a brief and a bin of analyzed clips into one playable sequence.

Editing principles, in order:
1. Serve the brief. If the brief names an order or a mood, follow it.
2. Earn the first two seconds. Open on the clip with the strongest motion or the clearest image, with the title overlay riding on it. A viewer who is not hooked by second two is gone.
3. Mostly 2D storytelling with 360 moments as punctuation. Place a pano360 segment where looking around earns something, never back to back with another pano360 unless asked. Give a 360 moment 6 to 10 seconds of screen time so the camera drift reads; a 3 second 360 segment is wasted.
4. Cut on rhythm, not on a metronome. Vary segment lengths deliberately, never three near-equal segments in a row. Hold on the strongest material, move fast through connective tissue. Segments run 3 to 8 seconds in screen time, the whole cut usually 20 to 60 seconds unless the brief says otherwise.
5. A transition is an event. Cuts and crossfades are the default; every showier transition needs a reason (a chapter turn, entering the water, a reveal). When in doubt, cut.
6. One look per cut. Pick a grade direction and apply it consistently across the 2D segments; do not grade every segment differently.
7. Open with a title overlay on the first segment, close with a quieter overlay or none. Text earns its place; no overlay should restate what the footage already shows.
8. Respect every clip's analysis. Trim toward its suggested in/out and best moments unless you have a stated reason, and never exceed a clip's duration. If the analysis flags a weak stretch, do not use it.
${SEQUENCE_GRAMMAR}

${HOUSE_STYLE}

Write notes as a two or three sentence director's note explaining the shape of the cut.`;

const CRITIC_SYSTEM = `You are the Critic in a hybrid 2D/360 editing studio. You receive a brief, the clip bin with analyses, and a sequence. Check, in order: trims stay inside clip durations, modes match the clips (pano360 only on 360 clips), pacing in screen time after speed (no segment under 2s or over 10s without reason, 360 segments long enough for their drift to read), speed values stay between 0.5 and 2 unless the brief demands more, transition variety (ripple at most twice, first segment cuts in), filters stay subtle and consistent across the cut, overlay timing inside segment bounds with text under 60 characters, music and voiceover point at real audio clips from the bin or are null, subtitle problems (overlaps, length over 70 characters, cues outside the runtime) flagged in issues only since subtitles carry through automatically and are edited elsewhere, house style in overlay text, and whether the cut serves the brief. If everything important holds, verdict "approve". If not, verdict "revise" and list each problem in issues, concretely enough that an editor could act on it (name the segment id and the exact change). When asked for the corrected sequence in a follow-up, fix exactly those issues, keep as much of the Director's intent as possible, and carry subtitles, music, and voiceover through unchanged unless they are what failed a check.
${SEQUENCE_GRAMMAR}

${HOUSE_STYLE}`;

const SCRIPT_SYSTEM = `You are the narration writer in a documentary studio for Rooted Forward, a civic history project. You receive a brief, a clip bin with analyses, and the final sequence with each segment's absolute start and end time on the timeline. Write two things.

1. narration: a short spoken script the editor will record as a voiceover, written to be read aloud at a calm pace (about 2.3 words per second) over the whole cut. It must fit the total runtime with room to breathe. Plain, concrete, documentary register. Never state a fact (dates, numbers, names, history) that is not in the brief or the clip analyses; for labeled test footage, describe what the viewer is seeing in neutral terms.

2. subtitles: timed cues matching that narration, in absolute timeline seconds, each 2 to 4 seconds long, never overlapping, text under 70 characters, together covering the narration line by line.

${HOUSE_STYLE}

In notes, say in one sentence how you paced the read.`;

/* --------------------------- helpers ----------------------------- */

function getApiKey(req: NextRequest): string | null {
  // Environment key is the normal path. A per-request key from the
  // admin UI is accepted as a fallback so the studio works before the
  // env var is configured; it is used for this request only.
  return (
    process.env.ANTHROPIC_API_KEY || req.headers.get("x-anthropic-key") || null
  );
}

interface AgentCallOptions {
  model: string;
  system: string;
  content: Anthropic.ContentBlockParam[] | string;
  schema: Record<string, unknown>;
  maxTokens: number;
}

async function runAgent(
  client: Anthropic,
  { model, system, content, schema, maxTokens }: AgentCallOptions
): Promise<unknown> {
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema,
      },
    },
    messages: [{ role: "user", content }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!textBlock) {
    // Usually max_tokens spent entirely on thinking; surface that.
    throw new Error(
      `The model returned no output (stop_reason ${response.stop_reason})`
    );
  }
  return JSON.parse(textBlock.text);
}

function frameBlocks(frames: string[]): Anthropic.ContentBlockParam[] {
  return frames.slice(0, 8).map((dataUrl) => {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new Error("Frames must be base64 image data URLs");
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: match[1] as "image/jpeg" | "image/png" | "image/webp",
        data: match[2],
      },
    };
  });
}

function clipBin(
  clips: Array<{
    id: string;
    name: string;
    kind: string;
    durationSec?: number;
    is360: boolean;
    analysis?: StudioClipAnalysis | null;
  }>
): string {
  return JSON.stringify(
    clips.map((c) => ({
      clipId: c.id,
      name: c.name,
      kind: c.kind,
      durationSec: c.durationSec ?? null,
      is360: c.is360,
      analysis: c.analysis ?? null,
    })),
    null,
    2
  );
}

type RawSegment = Record<string, unknown> & {
  gain?: number;
  audioFade?: number;
};

/** Expand the schema's gain/audioFade pair into SegmentAudio + muted. */
function normalizeSegment(raw: RawSegment): SequenceDoc["segments"][number] {
  const { gain, audioFade, ...rest } = raw;
  const g = typeof gain === "number" ? Math.max(0, Math.min(1, gain)) : 0;
  const fade = typeof audioFade === "number" ? Math.max(0, audioFade) : 0;
  return {
    ...(rest as unknown as SequenceDoc["segments"][number]),
    audio: g > 0.001 ? { volume: g, fadeInSec: fade, fadeOutSec: fade } : null,
    muted: g <= 0.001,
  };
}

function normalizeSequence(raw: unknown): SequenceDoc {
  const doc = raw as Omit<SequenceDoc, "version" | "subtitles">;
  return {
    version: 1,
    ...doc,
    segments: ((doc.segments ?? []) as unknown as RawSegment[]).map(
      normalizeSegment
    ),
    // The schema cannot express subtitles; fresh cuts start empty and
    // revisions get them carried through by mergeSequencePreserve.
    subtitles: [],
  };
}

/**
 * The structured-output schema cannot express transform, stickers, or
 * the assets map (and may drop manual audio), so every full-sequence
 * AI pass would silently destroy manual work without this merge.
 * Returned segments that match an incoming id carry those fields
 * forward; subtitle cues that match exactly keep their identity.
 */
function mergeSequencePreserve(
  next: SequenceDoc,
  prev: SequenceDoc | undefined
): SequenceDoc {
  if (!prev) return next;
  const prevSegs = new Map(prev.segments.map((s) => [s.id, s]));
  const prevCues = prev.subtitles ?? [];
  return {
    ...next,
    assets: prev.assets,
    segments: next.segments.map((s) => {
      const old = prevSegs.get(s.id);
      if (!old) return s;
      return {
        ...s,
        transform: old.transform ?? null,
        audio: s.audio ?? old.audio ?? null,
        stickers: old.stickers ?? [],
      };
    }),
    subtitles: prevCues,
  };
}

/**
 * A hallucinated clipId would produce a segment the player cannot
 * resolve; reject those at the agent boundary instead of at playback.
 */
function validateClipRefs(
  doc: SequenceDoc,
  clips: Array<{ id: string }>
): { doc: SequenceDoc; dropped: string[] } {
  const ids = new Set(clips.map((c) => c.id));
  const dropped: string[] = [];
  const segments = doc.segments.filter((s) => {
    if (ids.has(s.clipId)) return true;
    dropped.push(s.clipId);
    return false;
  });
  return {
    doc: {
      ...doc,
      segments,
      music: doc.music && ids.has(doc.music.clipId) ? doc.music : null,
      voiceover:
        doc.voiceover && ids.has(doc.voiceover.clipId) ? doc.voiceover : null,
    },
    dropped,
  };
}

const STRUCTURAL_EDIT_NOTE = `Structural edits are allowed and expected when the note calls for them. You may add segments using any clip in the bin, including clips not yet on the timeline, remove segments, duplicate a segment, or reorder them. Give new segments fresh unique ids and reference clips only by a clipId that exists in the bin.`;

/* ---------------------------- routes ----------------------------- */

export async function GET() {
  const denied = await checkAccess();
  if (denied) return denied;
  return NextResponse.json({
    model: DEFAULT_MODELS.direct,
    models: DEFAULT_MODELS,
    keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}

export async function POST(req: NextRequest) {
  const denied = await checkAccess();
  if (denied) return denied;

  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "no-api-key",
        message:
          "ANTHROPIC_API_KEY is not set on the server. Add it to the environment (locally in .env.local, on Vercel via project settings) or paste a key in the Studio settings panel.",
      },
      { status: 503 }
    );
  }

  let body: StudioAgentRequest;
  try {
    body = (await req.json()) as StudioAgentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const started = Date.now();

  try {
    switch (body.action) {
      case "analyze": {
        if (!body.frames?.length) {
          return NextResponse.json(
            { error: "frames are required" },
            { status: 400 }
          );
        }
        const model = modelFor("analyze", body.model);
        const result = (await runAgent(client, {
          model,
          system: ANALYST_SYSTEM,
          content: [
            ...frameBlocks(body.frames),
            {
              type: "text",
              text: `Clip metadata\nname: ${body.clipName}\nduration: ${body.durationSec}s\nresolution: ${body.width}x${body.height}\nframes are sampled evenly from 0s to ${body.durationSec}s in order.`,
            },
          ],
          schema: ANALYSIS_SCHEMA,
          maxTokens: 4000,
        })) as StudioClipAnalysis;
        return NextResponse.json({
          result,
          trace: { agent: "analyst", model, ms: Date.now() - started },
        });
      }

      case "direct": {
        const model = modelFor("direct", body.model);
        const raw = await runAgent(client, {
          model,
          system: DIRECTOR_SYSTEM,
          content: `Brief\n${body.brief || "No brief given. Build a tight, watchable cut from the strongest material."}${
            body.styleHint
              ? `\n\nCreative direction for this attempt\n${body.styleHint}`
              : ""
          }\n\nClip bin\n${clipBin(body.clips)}`,
          schema: SEQUENCE_SCHEMA,
          maxTokens: 10000,
        });
        const checked = validateClipRefs(normalizeSequence(raw), body.clips);
        if (checked.dropped.length > 0) {
          checked.doc.notes = `${checked.doc.notes ?? ""} (${checked.dropped.length} segment(s) referencing unknown clips were removed.)`;
        }
        return NextResponse.json({
          result: checked.doc,
          trace: { agent: "director", model, ms: Date.now() - started },
        });
      }

      case "critique": {
        const model = modelFor("critique", body.model);
        const ctx = `Brief\n${body.brief || "(none)"}\n\nClip bin\n${clipBin(body.clips)}\n\nSequence under review\n${JSON.stringify(body.sequence, null, 2)}`;
        const head = (await runAgent(client, {
          model,
          system: CRITIC_SYSTEM,
          content: ctx,
          schema: CRITIQUE_HEAD_SCHEMA,
          // Adaptive thinking shares this budget; keep room so a long
          // review never starves the text output.
          maxTokens: 8000,
        })) as {
          verdict: "approve" | "revise";
          issues: string[];
          pacingNotes: string;
        };
        let revised: SequenceDoc | null = null;
        if (head.verdict === "revise") {
          const fixed = await runAgent(client, {
            model,
            system: CRITIC_SYSTEM,
            content: `${ctx}\n\nYou reviewed this sequence and found these issues\n${head.issues.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nYour pacing notes\n${head.pacingNotes}\n\nReturn the corrected sequence now. The issues plus the pacing notes are the complete fix list; apply every fix mentioned in either.`,
            schema: SEQUENCE_SCHEMA,
            maxTokens: 12000,
          });
          revised = validateClipRefs(
            mergeSequencePreserve(normalizeSequence(fixed), body.sequence),
            body.clips
          ).doc;
        }
        return NextResponse.json({
          result: { ...head, revisedSequence: revised },
          trace: { agent: "critic", model, ms: Date.now() - started },
        });
      }

      case "revise": {
        const model = modelFor("revise", body.model);
        const history = (body.chatContext ?? [])
          .slice(-8)
          .map((m) => `${m.role === "user" ? "Editor" : "Director"}: ${m.text}`)
          .join("\n");
        const ctx = `The current sequence (the full timeline, including subtitles, music, and voiceover)\n${JSON.stringify(body.sequence, null, 2)}\n\nClip bin\n${clipBin(body.clips)}\n\nBrief\n${body.brief || "(none)"}${
          history
            ? `\n\nRecent conversation (for context, the last line is what matters most)\n${history}`
            : ""
        }`;
        const head = (await runAgent(client, {
          model,
          system: DIRECTOR_SYSTEM,
          content: `${ctx}\n\nNote from the editor\n${body.instruction}\n\nDecide what the note needs. If it asks for a change to the cut, set "changed" true and list each concrete edit in "changelog" (name segment ids and exact values where it matters); you will produce the updated sequence in the next step. You may change anything on the timeline, including the title, aspect, music, voiceover, subtitles, and per-segment audio. ${STRUCTURAL_EDIT_NOTE} If the note is a question or a request for advice instead, set "changed" false, answer it in "reply", and leave "changelog" empty. Read the note against the conversation, so follow-ups like "shorter" or "undo that last idea" resolve to what was just discussed. Always write "reply" as one to three conversational sentences.`,
          schema: REVISE_HEAD_SCHEMA,
          // Adaptive thinking shares this budget.
          maxTokens: 6000,
        })) as { reply: string; changed: boolean; changelog: string[] };
        let updatedSequence: SequenceDoc | null = null;
        if (head.changed) {
          // An empty changelog with changed=true would let the second
          // call improvise; pin it to the minimal edit instead.
          const editList =
            head.changelog.length > 0
              ? `You decided on these edits\n${head.changelog.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nYou told the editor: "${head.reply}"\n\nThe changelog plus that reply is the complete edit list; apply every edit mentioned in either and nothing more.`
              : `Make the minimal edit the note asks for and nothing else. You told the editor: "${head.reply}".`;
          const updated = await runAgent(client, {
            model,
            system: DIRECTOR_SYSTEM,
            content: `${ctx}\n\nNote from the editor\n${body.instruction}\n\n${editList}\n\n${STRUCTURAL_EDIT_NOTE}\n\nReturn the full updated sequence with exactly those edits applied. Carry everything the edits do not touch through unchanged, including subtitles, music, voiceover, and overlay positions.`,
            schema: SEQUENCE_SCHEMA,
            maxTokens: 12000,
          });
          const checked = validateClipRefs(
            mergeSequencePreserve(normalizeSequence(updated), body.sequence),
            body.clips
          );
          updatedSequence = checked.doc;
          if (checked.dropped.length > 0) {
            head.changelog.push(
              `Removed ${checked.dropped.length} segment(s) that referenced clips not in the bin`
            );
          }
        }
        return NextResponse.json({
          result: {
            reply: head.reply,
            changelog: head.changelog,
            sequence: updatedSequence,
          },
          trace: { agent: "director", model, ms: Date.now() - started },
        });
      }

      case "revise-segment": {
        const target = body.sequence.segments.find(
          (s) => s.id === body.segmentId
        );
        if (!target) {
          return NextResponse.json(
            { error: "Unknown segment id" },
            { status: 400 }
          );
        }
        const model = modelFor("revise-segment", body.model);
        const raw = (await runAgent(client, {
          model,
          system: `${DIRECTOR_SYSTEM}\n\nFor this request you are editing ONE segment only. Return the updated segment, keeping its id. You may change any of its fields (trim, speed, transition, motion, filter, overlays, audio handling) but you may not change which segment it is.`,
          content: `The full sequence, for context\n${JSON.stringify(body.sequence, null, 2)}\n\nClip bin\n${clipBin(body.clips)}\n\nBrief\n${body.brief || "(none)"}\n\nThe segment to edit\n${JSON.stringify(target, null, 2)}\n\nInstruction from the editor about this segment\n${body.instruction}`,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["reply", "segment"],
            properties: {
              reply: { type: "string" },
              segment: SEGMENT_SCHEMA,
            },
          },
          maxTokens: 6000,
        })) as { reply: string; segment: { id: string } };
        // The id is load-bearing; restore it if the model drifted,
        // expand gain/audioFade, and carry through what the schema
        // cannot express.
        const converted = normalizeSegment(
          raw.segment as unknown as RawSegment
        );
        raw.segment = {
          ...converted,
          id: body.segmentId,
          transform: target.transform ?? null,
          audio: converted.audio ?? target.audio ?? null,
          stickers: target.stickers ?? [],
        } as typeof raw.segment;
        return NextResponse.json({
          result: raw,
          trace: { agent: "director", model, ms: Date.now() - started },
        });
      }

      case "script": {
        const { timed, total } = layoutDoc(body.sequence);
        const clipNames = new Map(body.clips.map((c) => [c.id, c.name]));
        const segTable = timed
          .map(({ seg, startSec, lenSec }, i) => {
            const overlayText = (seg.overlays ?? [])
              .map((o) => `"${o.text}"`)
              .join(", ");
            return `${i + 1}. ${startSec.toFixed(1)}s to ${(startSec + lenSec).toFixed(1)}s, ${
              clipNames.get(seg.clipId) ?? seg.clipId
            } (${seg.mode})${overlayText ? `, on-screen text ${overlayText}` : ""}`;
          })
          .join("\n");
        const model = modelFor("script", body.model);
        const raw = (await runAgent(client, {
          model,
          system: SCRIPT_SYSTEM,
          content: `Brief\n${body.brief || "(none)"}\n\nTotal runtime ${total.toFixed(1)} seconds\n\nTimeline\n${segTable}\n\nClip bin\n${clipBin(body.clips)}`,
          schema: SCRIPT_SCHEMA,
          maxTokens: 6000,
        })) as {
          narration: string;
          subtitles: { startSec: number; endSec: number; text: string }[];
          notes: string;
        };
        const stamp = Date.now().toString(36);
        const result: ScriptResult = {
          narration: raw.narration,
          notes: raw.notes,
          subtitles: raw.subtitles.map((c, i) => ({
            id: `cue-${stamp}-${i}`,
            startSec: c.startSec,
            endSec: c.endSec,
            text: c.text,
          })),
        };
        return NextResponse.json({
          result,
          trace: { agent: "director", model, ms: Date.now() - started },
        });
      }

      case "overlays": {
        // Patch-shaped text pass: only overlays move, so the rest of
        // the cut (and the grammar budget) is never at risk.
        const model = modelFor("direct", body.model);
        const { timed } = layoutDoc(body.sequence);
        const segTable = timed
          .map(({ seg, startSec, lenSec }, i) => {
            const clip = body.clips.find((c) => c.id === seg.clipId);
            return `${i + 1}. id ${seg.id}, ${startSec.toFixed(1)}s to ${(startSec + lenSec).toFixed(1)}s, ${clip?.name ?? seg.clipId} (${seg.mode})${
              clip?.analysis ? `, content: ${clip.analysis.summary}` : ""
            }, current overlays: ${JSON.stringify(seg.overlays ?? [])}`;
          })
          .join("\n");
        const raw = (await runAgent(client, {
          model,
          system: `${DIRECTOR_SYSTEM}\n\nFor this request you are designing ONLY the text layer. Return one item per segment whose overlays should change, with that segment's complete new overlays array (an empty array clears it). Segments you do not list keep their text untouched. Never change anything except overlays.`,
          content: `Brief\n${body.brief || "(none)"}\n\nTimeline\n${segTable}\n\nInstruction\n${
            body.instruction ||
            "Design the text for this cut. A strong opening title, lower-thirds where context earns them, nothing redundant. Place text away from the action using xPct/yPct."
          }`,
          schema: OVERLAYS_PATCH_SCHEMA,
          maxTokens: 8000,
        })) as {
          reply: string;
          items: { segmentId: string; overlays: unknown[] }[];
        };
        const segIds = new Set(body.sequence.segments.map((s) => s.id));
        return NextResponse.json({
          result: {
            reply: raw.reply,
            items: raw.items.filter((it) => segIds.has(it.segmentId)),
          },
          trace: { agent: "director", model, ms: Date.now() - started },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        {
          error: "bad-api-key",
          message: "The Anthropic API key was rejected. Check the key value.",
        },
        { status: 502 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        {
          error: "rate-limited",
          message: "The Anthropic API is rate limiting. Wait a moment and retry.",
        },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "anthropic-error", message: err.message },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "agent-failed", message },
      { status: 500 }
    );
  }
}
