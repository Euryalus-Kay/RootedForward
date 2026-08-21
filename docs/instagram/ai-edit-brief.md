# The tools of segregation, edit brief for the AI editor

This is the instruction set for editing seven vertical videos. Part 1
applies to every video in the series. Part 3 is the shot by shot brief
for each one. Part 4 is a block you can paste straight into a video
tool.

Read Part 1 before touching a timeline. The series only works if all
seven look like they came out of the same drawer.

---

# Part 1. The series bible

## Format

- 1080 by 1920, 9 by 16, 30 fps, H.264, target 12 Mbps
- Length 40 to 50 seconds. Do not pad to 60
- Audio 48 kHz stereo. Voice normalized to minus 16 LUFS integrated,
  true peak no higher than minus 1 dBTP
- Safe area. No text in the top 220 px or the bottom 420 px, because
  the Instagram interface sits there
- Deliver with burned in captions and a separate clean version

## Colour

Use these exact values. No other colours anywhere in the series.

| Name | Hex | Used for |
|---|---|---|
| Cream | #F5F0E8 | the standard background |
| Paper | #FBF8F2 | cards sitting on cream |
| Forest | #1B3A2D | headline type, the end card field |
| Rust | #C45D3E | one accent per screen, rules, key numbers |
| Ink | #1A1A1A | body type |
| Plate red | #8C2A1A | quotations from the historical record only |
| Border | #DDD6C8 | hairlines |

Rust is an accent. One rust element on screen at a time. If two want to
be rust, the number wins.

## Type

- Headlines and numbers, **Source Serif 4**, weight 600
- Captions and labels, **DM Sans**, weight 500 or 700
- The font files are in the repo at `ios/Resources/Fonts/`
- Never mix in a third family. Never use a system default
- Never set headline type in all capitals, and never letterspace it
  wide. This series does not use tracked capitals anywhere

## The motion language

Everything moves the way paper and film move when a person handles
them. Slow, weighted, and never bouncy.

- **Stills.** Push in 3 to 5 percent over 5 to 6 seconds, ease out
  only. Never push in and out on the same image. Never rotate an
  archival photograph
- **Cuts.** Cut on the end of a spoken sentence, on the consonant, not
  in the gap after it. The pauses in the script are the cut points
- **Transitions.** Hard cuts throughout. The only exception is a 6
  frame dissolve between a then and now pair of the same view
- **Text on.** A mask wipe left to right over 7 frames, ease out. Hold.
  Cut it off hard, do not fade it out
- **Numbers.** Count up over 12 frames, then settle. Only for the
  headline number of a video, at most twice per video
- **Easing.** Use ease out, cubic. Never ease in and out on a push,
  it reads as a camera zoom and this series has no camera

## Captions

- Burned in, matching the spoken words exactly, word for word
- DM Sans 700, 62 px, ink on a paper lozenge at 92 percent opacity,
  corner radius 4 px, 24 px padding
- Two to four words per card. Change on the word, not on a timer
- Bottom of the safe area, 460 px from the bottom edge
- The words the script marks in bold turn rust in the caption for the
  duration of that word only

## Archival images

- **The credit line is not optional.** Every archival image carries its
  credit in DM Sans 500, 22 px, ink at 60 percent, lower left, 40 px
  in from the edge, for the entire time the image is on screen. The
  exact credit text is given per asset in Part 2
- Never crop a credit off, never cover it with a caption
- Colour grade, none. Do not warm these up, do not add grain, do not
  add a vignette. They are documents, not mood

## Sound

- One bed for the whole series. Sparse upright piano or low strings,
  no drums, no vocals, sitting at minus 24 LUFS under the voice
- The bed drops 4 dB under every quotation and comes back after
- One sound effect exists in this series, a single paper turn, used at
  the cut into the last section of each video. Nothing else
- No risers, no impacts, no whooshes, no ticking clocks

## Hooks and end card

- Frame one is a text card, on screen before the voice starts, holding
  for 1.2 seconds. Forest type on cream, Source Serif 600, 96 px,
  three lines maximum. The exact words are given per video
- The end card is 2 seconds. Forest field, the Rooted Forward mark
  centred, then in DM Sans 500 at 44 px, two lines, "The whole walk is
  free in our app" and "rooted-forward.org"

## Things that will ruin this series

Read this list twice.

- **No AI generated photographs of real people.** Jesse Binga, Fannie
  Barrier Williams, Mark Satter, Dempsey Travis, Carl and Lorraine
  Hansberry and Frederick Babcock were real. If there is no free
  photograph of them in Part 2, they are named in type and not
  pictured. A synthetic portrait of a real person is a lie
- **No fabricated documents.** Do not generate a deed, a newspaper
  front page, a bank form, a map or a code of ethics booklet. When the
  script quotes a document, set the quotation as type on cream so it
  reads plainly as a quotation
- **No stock footage standing in for history.** No modern protest
  footage, no generic city drone shots, no hands flipping through
  unrelated books
- No glitch, VHS, film burn, light leak, lens flare, chromatic
  aberration, or 3D extruded text
- No zoom bounce on beat, no speed ramps, no whip pans
- No emoji, no arrows drawn on screen, no red circles
- No captions that paraphrase what was said
- No em dashes in any on screen text. Use a full stop
- No music with lyrics and no track that would be recognised

---

# Part 2. The asset library

Every file below is already in the repository at
`public/media/hyde-park-walk/` unless another path is given. Use these
before looking anywhere else, because they are the pictures the tour
itself uses and their rights are known.

## Clear to publish

| File | Shows | Credit line to burn in |
|---|---|---|
| `robie-1911.jpg` | The Robie House when new, about 1911 | Historic American Buildings Survey. Public domain. |
| `robie-today.jpg` | The same house now | Photograph by Warren LeMay, 2023, via Wikimedia Commons. |
| `hansberry-house-today.jpg` | 6140 South Rhodes Avenue today | Photograph by Legimet, via Wikimedia Commons. |
| `drexel-1907.jpg` | Drexel Boulevard about 1907 | Detroit Publishing Company, Library of Congress. |
| `drexel-fountain-1890.jpg` | The Drexel Fountain about 1890 | Public domain. |
| `kitchenette-1941.jpg` | A Black Belt flat cut into kitchenettes, 1941 | Russell Lee, April 1941, Farm Security Administration. Public domain. |
| `drexel-today.jpg` | The boulevard today near 50th | Photograph by Warren LeMay, 2024, via Wikimedia Commons. |
| `sutherland-today.jpg` | The Sutherland today | Photograph by Teemu008, via Wikimedia Commons. |
| `university-apartments-today.jpg` | Pei's towers in 55th Street | Photograph by Teemu008, via Wikimedia Commons. |
| `55th-street-today.jpg` | Renewal era townhouses today | Photograph by Warren LeMay, via Wikimedia Commons. |
| `../site/holc-chicago-1940.jpg` | The 1940 HOLC security map of Chicago | Home Owners' Loan Corporation, 1940. Public domain. |
| `../site/holc-chicago-1940-city.jpg` | The same map, city sheet | Home Owners' Loan Corporation, 1940. Public domain. |
| `../site/hyde-park-aerial-1928.jpg` | Hyde Park from the air, 1928 | Chicago Aerial Survey Co., 1928. Public domain. |

## Ask before using

These four are reproduced from a book and carry no rights line. They
are fine inside the app under a book credit. Putting them on a public
Instagram account is a separate publication, so **do not use them
without asking Zain first.**

`fifty-fifth-1955.jpg`, `fifty-fifth-1961.jpg`, `rhythm-liquors-1960.jpg`,
`hyde-park-a-1961.jpg`

Video 7 is written so it works without them.

## When there is no photograph

Several of these stories have no free image. That is normal for this
material and it is not a problem to solve with generated pictures. Use
one of these three instead.

1. **A quotation card.** The words set in Source Serif 600 at 72 px,
   plate red, on cream, with a 3 px rust rule above and the source in
   DM Sans 24 px below
2. **A stat card.** Rust rule, then the number in Source Serif 600 at
   180 px in forest, then the label in DM Sans 500 at 40 px in ink
3. **The presenter.** Cut back to Zain on camera. A talking head is
   more honest than an invented image, and it resets the viewer's
   attention

---

# Part 3. The seven videos

Each brief gives the hook card, a beat sheet against the script, the
one animated moment worth building, and the sound note. Timecodes
assume a 45 second cut and should shift with the real read.

---

## Video 1. The Hyde Park Improvement Protective Club

**Hook card, 0.0 to 1.2**
> The Hyde Park
> Improvement
> Protective Club. 1908.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 1.2 to 6 | Zain on camera, hook line | captions only |
| 6 to 12 | `hyde-park-aerial-1928.jpg`, slow push | stat card, **350 members**, over the lower third |
| 12 to 18 | Zain | captions |
| 18 to 24 | Card on cream, the club's promise. "Blacklist any realtor who sold to a Black buyer." Source Serif 600, 84 px, forest, built in two wipes so "blacklist" lands alone first | as pictured |
| 24 to 32 | Quotation card, plate red on cream, the Property Owners' Journal line, built one clause at a time in three wipes | quotation |
| 32 to 38 | Cut to black for 6 frames, then a stat card, **58 bombings, 1917 to 1921** | stat card |
| 38 to 45 | Zain for Jesse Binga | captions, **I will not run** in rust |

**The animated moment.** The club's name. Set it in full across three
lines, Source Serif 600, forest, and build it one word at a time on the
beat as Zain says it. Improvement. Protective. Club. The euphemism is
the point, so let the viewer read it slowly.

**Do not** picture Jesse Binga or Fannie Barrier Williams. Set their
names in type.

**Sound.** Bed only. Paper turn on the cut into the bombing stat. Bed
out entirely under Binga's last line, so "the race is at stake and not
himself" lands in silence.

---

## Video 2. The realtors' rulebook

**Hook card**
> The realtors' code
> had a rule
> about race.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 6 | Zain | captions |
| 6 to 10 | Card, **Article 34**, Source Serif 600 at 200 px, forest, on cream | June 6, 1924 in DM Sans beneath |
| 10 to 22 | Quotation card for Article 34, set in plate red. Build it in two wipes, the second one landing on "members of any race or nationality" | the article text |
| 22 to 28 | `robie-1911.jpg`, slow push, while the enforcement lines are read | caption: **boards had to adopt it** |
| 28 to 34 | Card, **310 South Michigan Avenue**, forest, with "about seven miles from here" beneath | as pictured |
| 34 to 40 | A date strip that builds left to right, 1924, 1921, 1950 | dates in rust |
| 40 to 45 | Zain for the apology line | caption: **2020** in rust |

**The animated moment.** The date strip. The dates sit on one baseline
and arrive as they are spoken, each earlier one dimming to 40 percent as
the next lands. Then, on the final line, 2020 drops onto the same
baseline in rust while the rest stay dim. The whole argument of the
video is in that one graphic.

**Sound.** Bed drops 4 dB under Article 34 and stays down until the
quotation ends.

---

## Video 3. Restrictive covenants

**Hook card**
> The deed to a house
> could say who was
> not allowed to live in it.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 7 | Zain | captions |
| 7 to 13 | Card. A single line of type on cream, then a second line arriving underneath it, then a third, to show a restriction passing to the next owner and the next | caption: **it bound the next owner** |
| 13 to 20 | Card, **Nathan William MacChesney**, and beneath it "drafted the model covenant, 1927" | as pictured |
| 20 to 30 | Quotation card, the model covenant text in plate red. Hold longer than feels comfortable. This is the sentence the whole video exists for | the covenant text |
| 30 to 36 | `../site/holc-chicago-1940.jpg` used as a field, with **38 of 85 square miles** shaded over it | stat card |
| 36 to 41 | `hansberry-house-today.jpg`, slow push | caption: **6140 South Rhodes** |
| 41 to 46 | Zain, the last line about deeds today | caption: **still there** in rust |

**The animated moment.** The 38 of 85. Take the Chicago map, desaturate
it to 20 percent, then fill 38 out of 85 equal blocks across the frame
in rust, one block every 2 frames, while the number counts up. It
should take a beat too long, so the viewer feels the extent of it.

**Do not** generate a picture of a deed. The quotation card is the
document.

**Sound.** Everything drops out for the covenant quotation except the
voice.

---

## Video 4. Blockbusting

**Hook card**
> They made money
> keeping people out.
> Then they made money
> letting them in.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 6 | Zain | captions |
| 6 to 12 | `drexel-1907.jpg`, slow push | caption: **1948** |
| 12 to 22 | The sequence, three cards. A telephone ringing set purely as type, "the evening phone call". Then "the flyer under the door". Then "your block is about to turn" | as pictured |
| 22 to 32 | The money graphic, described below | **$12,000** then **$22,000** |
| 32 to 38 | `kitchenette-1941.jpg`, slow push | credit burned in |
| 38 to 45 | Zain for the two lies and the closing line | caption: **the man in the middle kept the difference** |

**The animated moment.** The money. A single horizontal line across the
frame. On the left, $12,000 in forest, arriving as it is spoken. On the
right, $22,000 in rust. Then the gap between them fills with a solid
rust bar and the word **profit** sits under it in DM Sans. Nothing
else moves. No coins, no arrows, no cash imagery.

**Sound.** Paper turn on the cut to the kitchenette photograph.

---

## Video 5. Buying on contract

**Hook card**
> Ten years of payments.
> You still own
> nothing.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 6 | Zain | captions |
| 6 to 16 | The payment counter, described below | running total |
| 16 to 24 | Stat cards in sequence, **75 to 95 percent**, then **84 percent markup** | as pictured |
| 24 to 34 | Zain for the Bolton story | caption: **three times** in rust |
| 34 to 40 | Card, **Mark Satter, died at 49**, in Source Serif on cream | as pictured |
| 40 to 46 | Card, the closing figure, held to the end card | **$3 to $4 billion** |

**The animated moment.** The payment counter. A number counting up in
Source Serif at 160 px, month by month, with a small "months paid"
label in DM Sans beneath it. Let it run to a real total, then on the
word "evict" cut the whole thing to **0** in one frame with no
animation. Hold on the zero for a full second in silence. That single
frame is the whole mechanism of contract selling.

**Do not** picture the Boltons or Mark Satter.

**Sound.** The bed runs under the counter and stops dead on the zero.
Silence for one second. Bed returns on the next line.

---

## Video 6. Redlining

**Hook card**
> The government
> made a map.
> 1940.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 6 | Zain | captions |
| 6 to 14 | `../site/holc-chicago-1940.jpg` full frame, slow push | credit burned in |
| 14 to 20 | The four colour legend, described below | green, blue, yellow, red |
| 20 to 28 | Back to the map, pushed in on the South Side | caption: **three or four families** |
| 28 to 34 | Card, **yellow, definitely declining**, on the actual yellow from the map | as pictured |
| 34 to 40 | Quotation card, the 1938 FHA manual line, plate red | quotation |
| 40 to 47 | Zain for Dempsey Travis, then the last word alone | **243 banks**, then **1** |

**The animated moment.** Two of them, and they are the best in the
series.

First, the legend. Four swatches build left to right as the colours are
named, each with its label under it. When "hazardous" lands, everything
except red drops to 15 percent opacity.

Second, the ending. Show **243** in Source Serif at 200 px. Then, on
the word "one", replace it with **1** at the same size in rust, in a
single frame cut. Then hold on that 1, alone on cream, for a full two
seconds while Zain says "one" a second time. Do not cut away early.

**Sound.** Bed out completely for the final two seconds. Just the word.

---

## Video 7. Urban renewal

**Hook card**
> Four thousand families.
> One street.
> Federal policy.

**Beat sheet**

| Time | Picture | Text on screen |
| --- | --- | --- |
| 0 to 6 | Zain on the street itself, if you can shoot it there | captions |
| 6 to 12 | Card, **November 7, 1958**, and beneath, "the first big one in the country" | as pictured |
| 12 to 20 | `hyde-park-aerial-1928.jpg`, slow push, while the 1953 law is explained | caption: **might become blighted** in rust |
| 20 to 28 | The money graphic, described below | **$40m** and **$4m** |
| 28 to 36 | `university-apartments-today.jpg` then `55th-street-today.jpg`, hard cut between them | credits burned in |
| 36 to 42 | Card, **nearly 4,000 families displaced** | as pictured |
| 42 to 48 | Zain, then the final stat | **34 units** |

**The animated moment.** The forty and the four. Draw a rust bar across
the full frame width labelled **$40 million, public money, to buy and
clear**. Then, directly beneath it, draw a second bar to one tenth the
width, labelled **$4 million, what developers paid**. Hold both on
screen together. Let the viewer do the arithmetic themselves. No
narration over it for one full second.

Then the last card. **34.** In forest, alone, with "units of public
housing built" beneath it. Hold to the end card.

**Sound.** Paper turn on the cut to the towers. Bed out for the last
card.

---

# Part 4. Paste this into the tool

> Edit a 45 second vertical video, 1080x1920, 30fps, for Instagram.
> Documentary style, archival and typographic, no camera moves except
> slow push ins on still photographs.
>
> Palette, and use no other colours. Background #F5F0E8, cards #FBF8F2,
> headline type #1B3A2D, one accent #C45D3E, body type #1A1A1A,
> historical quotations #8C2A1A, hairlines #DDD6C8.
>
> Type. Source Serif 4 semibold for headlines and numbers, DM Sans for
> captions and labels. No third typeface, no all capitals, no wide
> letterspacing.
>
> Motion. Hard cuts on the end of spoken sentences. Push in 3 to 5
> percent over 5 to 6 seconds on stills, ease out only. Text arrives on
> a left to right mask wipe over 7 frames and cuts out hard. No fades
> out, no bounce, no speed ramps, no whip pans, no glitch, no light
> leaks, no 3D text.
>
> Captions burned in, matching the audio word for word, DM Sans bold 62
> px, dark type on a light lozenge, two to four words at a time,
> changing on the word, sitting 460 px above the bottom edge.
>
> Every archival photograph carries its credit line in the lower left in
> 22 px type for the whole time it is on screen. Do not crop or cover
> it. Do not grade, grain or vignette these images.
>
> Sound. One sparse instrumental bed with no vocals at minus 24 LUFS
> under the voice, dropping 4 dB under every quotation. One paper turn
> sound effect per video. No risers, impacts or whooshes.
>
> Absolute rules. Do not generate images of real historical people. Do
> not generate documents, deeds, newspapers or maps. Do not use stock
> footage of modern cities or protests. When there is no real
> photograph, use a typographic card instead.
>
> The script and the shot list follow.

---

# A note on rights, before you post

The four photographs listed under "ask before using" in Part 2 are
reproduced from a University of Chicago Press book and carry no licence
of their own. They sit inside the app under a book credit. Posting them
to a public account is a different act. Ask before any of them go into
a video, and note that video 7 is written so that it does not need
them.

Everything else in Part 2 is public domain or Creative Commons, and the
credit lines above are the ones to use.
