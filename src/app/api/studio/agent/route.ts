import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { layoutDoc } from "@/lib/immersive/timeline";
import type {
  ScriptResult,
  SequenceDoc,
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
/*               current sequence.                                     */
/*                                                                     */
/*  All calls run on claude-fable-5 with adaptive thinking and JSON    */
/*  schema enforced structured outputs, so the client never parses     */
/*  free-form text.                                                    */
/* ------------------------------------------------------------------ */

export const maxDuration = 120;

const MODEL = "claude-fable-5";

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
    "muted",
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
    overlays: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "kind",
          "text",
          "startSec",
          "endSec",
          "position",
          "style",
          "anim",
        ],
        properties: {
          kind: { type: "string", enum: ["title", "lower-third", "caption"] },
          text: { type: "string" },
          startSec: { type: "number" },
          endSec: { type: "number" },
          position: { type: "string", enum: ["center", "lower", "upper"] },
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
      },
    },
    muted: { type: "boolean" },
  },
} as const;

const SEQUENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "notes", "aspect", "music", "segments"],
  properties: {
    title: { type: "string" },
    notes: { type: "string" },
    aspect: { type: "string", enum: ["16:9", "9:16", "1:1"] },
    music: {
      anyOf: [
        {
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
        },
        { type: "null" },
      ],
    },
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

const CRITIQUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "issues", "pacingNotes", "revisedSequence"],
  properties: {
    verdict: { type: "string", enum: ["approve", "revise"] },
    issues: { type: "array", items: { type: "string" } },
    pacingNotes: { type: "string" },
    revisedSequence: { anyOf: [SEQUENCE_SCHEMA, { type: "null" }] },
  },
} as const;

const REVISE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "changelog", "sequence"],
  properties: {
    reply: { type: "string" },
    changelog: { type: "array", items: { type: "string" } },
    sequence: SEQUENCE_SCHEMA,
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
- overlays sit on a segment with startSec/endSec relative to the segment's screen time, inside its duration. "title" for the opening card, "lower-third" for labels, "caption" for guidance. Each overlay carries style {size sm|md|lg, color cream|white|rust|ink, background true|false} and anim "fade"|"slide-up"|"pop"|"none". Titles look best size lg, color cream, background false, anim slide-up. Lower-thirds best size md, background true. Keep text under 60 characters.
- aspect is "16:9" unless the brief asks for vertical ("9:16") or square ("1:1").
- music points at an audio clip from the bin when one exists (volume 0.4 to 0.6, fadeInSec 1 to 2, fadeOutSec 2 to 3, loop true, offsetSec 0). Set music null when the bin has no audio.
- muted is true unless told otherwise.
- Segment ids are short and unique, like "seg-1".`;

const ANALYST_SYSTEM = `You are the Analyst in a documentary video pipeline for Rooted Forward, a civic history project. You receive frames sampled evenly across one clip plus its metadata. Describe only what is visibly there. Note whether the frames look like an equirectangular 360 source (strong horizontal stretching, a full horizon wrap, pole distortion at top and bottom, or compass and horizon markings). Suggest the strongest in/out trim in seconds within the clip duration and call out the best moments with timestamps. Be concrete and brief. If the footage is a labeled synthetic test pattern, say so plainly in the summary.`;

const DIRECTOR_SYSTEM = `You are the Director in a hybrid 2D/360 editing studio for Rooted Forward, a civic history project about urban policy and the Chicago waterfront. You turn a brief and a bin of analyzed clips into one playable sequence.

Editing principles, in order:
1. Serve the brief. If the brief names an order or a mood, follow it.
2. Mostly 2D storytelling with 360 moments as punctuation. Place a pano360 segment where looking around earns something, never back to back with another pano360 unless asked.
3. Pace for the web. Segments run 3 to 8 seconds, the whole cut usually 20 to 60 seconds unless the brief says otherwise.
4. Open with a title overlay on the first segment, close with a quieter overlay or none.
5. Respect every clip's analysis. Trim to its suggested in/out unless you have a stated reason, and never exceed a clip's duration.
6. Use each transition deliberately. ${""}
${SEQUENCE_GRAMMAR}

${HOUSE_STYLE}

Write notes as a two or three sentence director's note explaining the shape of the cut.`;

const CRITIC_SYSTEM = `You are the Critic in a hybrid 2D/360 editing studio. You receive a brief, the clip bin with analyses, and a sequence. Check, in order: trims stay inside clip durations, modes match the clips (pano360 only on 360 clips), pacing in screen time after speed (no segment under 2s or over 10s without reason), speed values stay between 0.5 and 2 unless the brief demands more, transition variety (ripple at most twice, first segment cuts in), filters stay subtle and consistent across the cut, overlay timing inside segment bounds with text under 60 characters, music points at a real audio clip or is null, house style in overlay text, and whether the cut serves the brief. If everything important holds, verdict "approve" with revisedSequence null. If not, verdict "revise" and return a corrected revisedSequence that keeps as much of the Director's intent as possible.
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
  system: string;
  content: Anthropic.ContentBlockParam[] | string;
  schema: Record<string, unknown>;
  maxTokens: number;
}

async function runAgent(
  client: Anthropic,
  { system, content, schema, maxTokens }: AgentCallOptions
): Promise<unknown> {
  const response = await client.messages.create({
    model: MODEL,
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
    throw new Error("The model returned no output");
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

function normalizeSequence(raw: unknown): SequenceDoc {
  const doc = raw as Omit<SequenceDoc, "version">;
  return { version: 1, ...doc };
}

/* ---------------------------- routes ----------------------------- */

export async function GET() {
  const denied = await checkAccess();
  if (denied) return denied;
  return NextResponse.json({
    model: MODEL,
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
        const result = (await runAgent(client, {
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
          trace: { agent: "analyst", model: MODEL, ms: Date.now() - started },
        });
      }

      case "direct": {
        const raw = await runAgent(client, {
          system: DIRECTOR_SYSTEM,
          content: `Brief\n${body.brief || "No brief given. Build a tight, watchable cut from the strongest material."}\n\nClip bin\n${clipBin(body.clips)}`,
          schema: SEQUENCE_SCHEMA,
          maxTokens: 10000,
        });
        return NextResponse.json({
          result: normalizeSequence(raw),
          trace: { agent: "director", model: MODEL, ms: Date.now() - started },
        });
      }

      case "critique": {
        const raw = (await runAgent(client, {
          system: CRITIC_SYSTEM,
          content: `Brief\n${body.brief || "(none)"}\n\nClip bin\n${clipBin(body.clips)}\n\nSequence under review\n${JSON.stringify(body.sequence, null, 2)}`,
          schema: CRITIQUE_SCHEMA,
          maxTokens: 10000,
        })) as {
          verdict: "approve" | "revise";
          issues: string[];
          pacingNotes: string;
          revisedSequence: unknown;
        };
        return NextResponse.json({
          result: {
            ...raw,
            revisedSequence: raw.revisedSequence
              ? normalizeSequence(raw.revisedSequence)
              : null,
          },
          trace: { agent: "critic", model: MODEL, ms: Date.now() - started },
        });
      }

      case "revise": {
        const raw = (await runAgent(client, {
          system: DIRECTOR_SYSTEM,
          content: `The current sequence\n${JSON.stringify(body.sequence, null, 2)}\n\nClip bin\n${clipBin(body.clips)}\n\nBrief\n${body.brief || "(none)"}\n\nInstruction from the editor\n${body.instruction}\n\nApply the instruction to the current sequence. Keep everything the instruction does not touch. Reply conversationally in "reply" (one to three sentences), list concrete edits in "changelog", and return the full updated sequence.`,
          schema: REVISE_SCHEMA,
          maxTokens: 12000,
        })) as { reply: string; changelog: string[]; sequence: unknown };
        return NextResponse.json({
          result: {
            reply: raw.reply,
            changelog: raw.changelog,
            sequence: normalizeSequence(raw.sequence),
          },
          trace: { agent: "director", model: MODEL, ms: Date.now() - started },
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
        const raw = (await runAgent(client, {
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
          trace: { agent: "director", model: MODEL, ms: Date.now() - started },
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
