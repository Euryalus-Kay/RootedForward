# The proofreading build

A build of the app where every piece of writing is tappable. Tap a
paragraph, retype it, add a note, and the change is held on the phone
and drawn in place, so the tour can be read as it would stand. When
the pass is done the app exports one document holding every change,
every note, and the exact text each one replaces. That document goes
back to Claude and gets applied to the real content.

Nothing is uploaded. Nothing on the site or in the App Store build
moves until the document is applied.

## The switch

One line, in [`Sources/Beta/BetaEditing.swift`](Sources/Beta/BetaEditing.swift):

```swift
static let editing = true
```

`true` is the proofreading build. `false` is the app that ships, with
no gestures, no marks, no stored file, and no extra rows anywhere.

While it is on, the home screen wears a red band saying so. That band
exists to make it impossible to archive a proofreading build by
accident.

## The loop

**1. Build it for the phone.**

```bash
cd ios && xcodegen generate
```

Then open `RootedForward.xcodeproj`, pick your iPhone, and run. The
band across the top of home means it worked.

**2. Read the tour and change what is wrong.**

- Tap any writing. Stop titles, deks, transcript paragraphs, red plate
  titles and bodies, walking directions, the intro, the byline, and
  the practical cards are all live.
- Two stars around a phrase make it bold, one star makes it italic,
  the same as the site. What you type is drawn straight away.
- The small pencil in the corner of a photograph opens its caption,
  its credit, and the description VoiceOver reads.
- The button at the foot of a stop adds a note about the whole stop,
  the kind that asks for a different photograph or says a stop runs
  long.
- A rust rule in the margin marks rewritten text. A forest rule marks
  a note. The toggle in Your edits draws a faint rule beside
  everything that can be tapped, if you want to see the extent of it.

**3. Export.**

Settings, or the Edits button in the tour's top bar, opens Your edits.
Export writes `rooted-forward-edits-<date>.md` and hands it to the
share sheet, so it can go out by AirDrop, Mail, Messages, or into
Files. Copy puts the same text on the clipboard.

**4. Send it to Claude.** The document says what it is and carries
every key, so it needs no covering note.

**5. Turn the switch off** before archiving anything for the App
Store, and check the band is gone from home.

## Applying a document

```bash
node scripts/walk-apply-edits.mjs ~/Downloads/rooted-forward-edits-2026-07-28-2128.md
```

Reports only. It finds every change in the tour source and says
whether it can be placed. Add `--apply` to write them.

A change lands only when its shipped text is found exactly once in the
file its key points at, so a document that has gone stale against a
rewritten tour fails loudly rather than half-landing. Notes are
printed for a person to read, and any stop whose spoken words changed
is listed with the command that re-records it.

Keys map to files like this:

| Key | File |
|---|---|
| `<slug>/intro/...` | `src/components/tours/walk/WalkIntro.tsx`, `HarlemIntro.tsx` |
| everything else | `src/lib/tours/<slug>-walk.ts` |

## What the keys look like

Every entry in the document carries one, built from slugs and
positions rather than from the words, so it survives the text being
retyped.

```
hyde-park/stop/paul-cornells-stone/transcript/2
hyde-park/stop/paul-cornells-stone/plate/0/body/1
harlem/stop/hotel-theresa/photo/1/credit
harlem/intro/paragraph/3
harlem/tour/dek
hyde-park/practical/2/text
```

## Two things worth knowing

**The narration does not follow the text.** Recordings are made from
these strings by `scripts/walk-tts.mjs`. Change a transcript paragraph
and the audio still says the old words until it is re-recorded, which
is why the export lists those stops separately.

**Content refreshes do not wipe a pass.** The app pulls fresh content
from the site on every foregrounding. Keys are positional, so an edit
keeps pointing at the same paragraph. If that paragraph was rewritten
on the site in the meantime, the apply script will say the document
has gone stale there rather than overwriting the newer wording.
