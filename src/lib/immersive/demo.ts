import type {
  SequenceAsset,
  SequenceDoc,
  StudioMediaItem,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Built-in demo media. All of it is generated, clearly labeled test  */
/*  footage that ships in public/media. It exists so the player, the   */
/*  admin test viewer, and the Studio pipeline can be exercised        */
/*  before real footage is uploaded.                                   */
/* ------------------------------------------------------------------ */

export const DEMO_MEDIA: StudioMediaItem[] = [
  {
    id: "demo-surface",
    name: "test-clip-surface.mp4",
    kind: "video",
    url: "/media/studio/test-clip-surface.mp4",
    durationSec: 8,
    width: 1280,
    height: 720,
    is360: false,
    persisted: true,
    analysis: null,
  },
  {
    id: "demo-descent",
    name: "test-clip-descent.mp4",
    kind: "video",
    url: "/media/studio/test-clip-descent.mp4",
    durationSec: 8,
    width: 1280,
    height: 720,
    is360: false,
    persisted: true,
    analysis: null,
  },
  {
    id: "demo-lakebed",
    name: "test-clip-lakebed.mp4",
    kind: "video",
    url: "/media/studio/test-clip-lakebed.mp4",
    durationSec: 8,
    width: 1280,
    height: 720,
    is360: false,
    persisted: true,
    analysis: null,
  },
  {
    id: "demo-pano-video",
    name: "test-pano.mp4 (360)",
    kind: "video",
    url: "/media/360/test-pano.mp4",
    durationSec: 12,
    width: 2048,
    height: 1024,
    is360: true,
    persisted: true,
    analysis: null,
  },
  {
    id: "demo-pano-photo",
    name: "test-pano.jpg (360)",
    kind: "image",
    url: "/media/360/test-pano.jpg",
    width: 4096,
    height: 2048,
    is360: true,
    persisted: true,
    analysis: null,
  },
  {
    id: "demo-ambient",
    name: "test-ambient.mp3",
    kind: "audio",
    url: "/media/studio/test-ambient.mp3",
    durationSec: 24,
    width: 0,
    height: 0,
    is360: false,
    persisted: true,
    analysis: null,
  },
];

export const DEMO_ASSETS: Record<string, SequenceAsset> = Object.fromEntries(
  DEMO_MEDIA.map((m) => [
    m.id,
    {
      url: m.url,
      kind: m.kind,
      is360: m.is360,
      poster: m.is360 ? "/media/360/test-pano-poster.jpg" : null,
    },
  ])
);

/* ------------------------------------------------------------------ */
/*  A handmade reference sequence that exercises every transition and  */
/*  both modes. The admin test viewer plays it as-is, and the Studio   */
/*  can load it as a starting point.                                   */
/* ------------------------------------------------------------------ */

export const DEMO_SEQUENCE: SequenceDoc = {
  version: 1,
  title: "Hybrid player test sequence",
  notes:
    "Reference cut over the generated test clips. Exercises styled titles, Ken Burns, color grades, speed, transitions, a 360 look-around segment, a music bed, and subtitles.",
  aspect: "16:9",
  assets: DEMO_ASSETS,
  music: {
    clipId: "demo-ambient",
    volume: 0.5,
    fadeInSec: 1.5,
    fadeOutSec: 2.5,
    loop: true,
    offsetSec: 0,
  },
  subtitles: [
    { id: "cue-1", startSec: 0.6, endSec: 3.4, text: "A reference cut for the hybrid player." },
    { id: "cue-2", startSec: 4.2, endSec: 7.6, text: "Color grades, speed, and transitions are all live." },
    { id: "cue-3", startSec: 9.0, endSec: 12.5, text: "This segment is 360. Grab the frame to look around." },
    { id: "cue-4", startSec: 16.5, endSec: 19.5, text: "The music bed under this cut is a synthetic test tone." },
  ],
  segments: [
    {
      id: "seg-1",
      clipId: "demo-surface",
      mode: "2d",
      inSec: 0,
      outSec: 4.5,
      transitionIn: { type: "cut", durationSec: 0 },
      kenBurns: {
        fromScale: 1,
        toScale: 1.08,
        fromX: 0,
        fromY: 0,
        toX: 0.3,
        toY: 0.1,
      },
      overlays: [
        {
          kind: "title",
          text: "Hybrid player test",
          startSec: 0.4,
          endSec: 3.2,
          position: "center",
          style: { size: "lg", color: "cream", background: false },
          anim: "slide-up",
        },
      ],
    },
    {
      id: "seg-2",
      clipId: "demo-descent",
      mode: "2d",
      inSec: 0.5,
      outSec: 5,
      transitionIn: { type: "ripple", durationSec: 1.2 },
      filter: {
        brightness: 0.96,
        contrast: 1.05,
        saturate: 1.15,
        hueDeg: -12,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      },
      kenBurns: {
        fromScale: 1.05,
        toScale: 1.12,
        fromX: 0,
        fromY: -0.2,
        toX: 0,
        toY: 0.4,
      },
      overlays: [
        {
          kind: "lower-third",
          text: "Ripple in, underwater grade",
          startSec: 1.4,
          endSec: 4,
          position: "lower",
          style: { size: "md", color: "cream", background: true },
          anim: "slide-up",
        },
      ],
    },
    {
      id: "seg-3",
      clipId: "demo-pano-video",
      mode: "pano360",
      inSec: 0,
      outSec: 7,
      transitionIn: { type: "crossfade", durationSec: 1 },
      panoMotion: { fromYawDeg: 0, toYawDeg: 130 },
    },
    {
      id: "seg-4",
      clipId: "demo-lakebed",
      mode: "2d",
      inSec: 1,
      outSec: 5.5,
      speed: 0.75,
      transitionIn: { type: "blur", durationSec: 1 },
      filter: {
        brightness: 0.9,
        contrast: 1.1,
        saturate: 0.85,
        hueDeg: -18,
        blur: 0,
        grayscale: 0,
        sepia: 0,
      },
      kenBurns: {
        fromScale: 1.1,
        toScale: 1,
        fromX: 0.4,
        fromY: 0,
        toX: -0.4,
        toY: 0,
      },
      overlays: [
        {
          kind: "lower-third",
          text: "Blur in, slow motion, cold grade",
          startSec: 1.2,
          endSec: 4.5,
          position: "lower",
          style: { size: "md", color: "cream", background: true },
          anim: "fade",
        },
      ],
    },
    {
      id: "seg-5",
      clipId: "demo-surface",
      mode: "2d",
      inSec: 4,
      outSec: 7.5,
      transitionIn: { type: "zoom", durationSec: 0.9 },
      overlays: [
        {
          kind: "title",
          text: "End of test",
          startSec: 1,
          endSec: 3,
          position: "center",
          style: { size: "md", color: "rust", background: false },
          anim: "pop",
        },
      ],
    },
  ],
};
