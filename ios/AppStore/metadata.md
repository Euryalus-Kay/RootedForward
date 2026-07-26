# App Store submission kit, Rooted Forward

Everything App Store Connect asks for, in order. Copy fields straight
from here. The writing follows the site's voice rules (no em-dashes,
no colons inside sentences or titles).

---

## Identity

| Field | Value |
|---|---|
| App name | Rooted Forward |
| Subtitle | Walk Hyde Park audio tour |
| Bundle ID | org.rootedforward.walk |
| SKU | rootedforward-walk-001 |
| Primary language | English (U.S.) |
| Primary category | Education |
| Secondary category | Travel |
| Price | Free |
| Support URL | https://rooted-forward.org/contact |
| Marketing URL | https://rooted-forward.org/tours |
| Privacy policy URL | https://rooted-forward.org/privacy |
| Copyright | Rooted Forward |

## Promotional text (170 chars max)

A free self-guided audio walking tour of Hyde Park, Chicago. Thirteen
stops from Paul Cornell's stone to the Obama Presidential Center.

## Description

Walk Hyde Park is a free self-guided audio tour from Rooted Forward,
a student-run Chicago nonprofit. Thirteen stops, about four miles,
from Paul Cornell's stone in Harold Washington Park to the Obama
Presidential Center, with three optional detours to the Hansberry
house, the oldest restaurant in Chicago, and Drexel Boulevard.

Hyde Park sold exclusivity from its first day, and a century of
paperwork decided who got to live in it. This walk goes where the
paperwork was signed. Along the way, red plates name the instruments
that built American housing segregation, one by one. The improvement
associations. The realtors' code of ethics. Restrictive covenants.
Blockbusting. Buying on contract. Redlining. Urban renewal.

WHAT YOU GET

- Thirteen narrated stops and three detours, close to seventy
  minutes of audio, with the full text printed on every stop so you can read
  instead of listen
- A tour map drawn over the 1929 government survey of Hyde Park,
  with the route, every stop, and your position on it
- Then-and-now photographs with full credits at every stop
- Walking directions between stops, with one tap into Apple Maps
- Audio that keeps playing with the screen locked, with controls on
  the lock screen
- The whole tour works offline. Audio, photos, and the map are all
  on your phone.

Location is optional and is used only to draw your dot on the map
and tell you when you are near a stop. It never leaves your phone.
No ads, no tracking, no account required.

The tour was researched and written by Rooted Forward. Sources are
listed on every stop. The narration is also published free at
rooted-forward.org/tours.

## Keywords (100 chars max)

chicago,hyde park,walking tour,audio tour,history,redlining,obama center,architecture,self-guided

## What's New (version 1.0)

The first release. Thirteen stops plus three detours, the full audio,
the 1929 survey map, and offline support.

---

## Age rating questionnaire

The tour narrates documented housing discrimination, one 1919 racial
violence event, and one 1966 rock-throwing incident, in a museum
voice with no images of violence.

| Question | Answer |
|---|---|
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Prolonged graphic violence | None |
| Profanity or crude humor | None |
| Mature or suggestive themes | Infrequent/Mild (historical discussion of racial violence and discrimination) |
| Horror or fear themes | None |
| Medical or treatment information | None |
| Alcohol, tobacco, drug use | None |
| Simulated gambling | None |
| Sexual content or nudity | None |
| Unrestricted web access | No |
| Gambling and contests | No |

Expected rating 12+.

## App privacy (nutrition label)

Data collection answers, matching what the code actually does.

| Type | Collected? | Notes |
|---|---|---|
| Location | Not collected | Processed on device only, never transmitted. Answer "No" for collection since it never leaves the phone. |
| Contact info (email, name) | Collected only if the user signs in | Linked to identity, used for app functionality (account sign-in). Not used for tracking. |
| Identifiers | No | |
| Usage data / analytics | No | The app contains no analytics SDK. |
| Tracking | No | |

If the reviewer asks, sign-in is optional, the tour is fully usable
signed out, and accounts exist for the website's comments and policy
features.

## App Review notes (paste into the Notes field)

This is a fully native SwiftUI self-guided audio walking tour of
Hyde Park, Chicago, from the nonprofit Rooted Forward
(rooted-forward.org). All tour content ships inside the binary and
works offline in airplane mode.

Sign-in is OPTIONAL and never required. It uses email and password
only (no third-party login, so guideline 4.8 does not apply). There
is no in-app account creation; the Create one link opens the website
in the browser. Account deletion is available in the app under
Settings, Your account, Delete account, satisfying guideline
5.1.1(v). Test account available on request, or create one at
https://rooted-forward.org/auth/signup.

Location permission is requested only when the user taps Find me on
the map, is when-in-use, and is processed entirely on device (it
draws the user's dot on the tour map). Background audio keeps the
narration playing while walking with the screen locked.

All photographs are public domain or Creative Commons with credits
printed under each image in the app. The narration and text are
original work by Rooted Forward, also published free on our website.

## Screenshots

Required size, 6.9 inch (1320 x 2868), from iPhone 16 Pro Max or
iPhone 17 Pro Max simulator. Files in `screenshots/`.

Planned set, in order.
1. Home screen (Walk Hyde Park, start button)
2. The map sheet (engraved map with the route and markers)
3. A stop page (Paul Cornell's stone, photos and audio card)
4. A red instrument plate (Restrictive covenants, stop 6)
5. The Why-this-walk essay on the home screen

## Submission checklist

- [ ] Archive with Xcode (Product, Archive) on a signed team profile
- [ ] Upload to App Store Connect, create app record with the
      identity table above
- [ ] Paste description, promotional text, keywords, notes
- [ ] Upload the 6.9 inch screenshots
- [ ] Privacy: fill the nutrition label from the table above
- [ ] Age rating questionnaire from the table above
- [ ] App uses non-exempt encryption, answer No (already in
      Info.plist as ITSAppUsesNonExemptEncryption)
- [ ] Verify https://rooted-forward.org/privacy and /api/walk are
      live before submitting
- [ ] Submit for review
