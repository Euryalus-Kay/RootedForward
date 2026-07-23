# Rooted Forward iOS app

The Walk Hyde Park self-guided audio tour as a native SwiftUI iPhone
app. No third-party dependencies. All tour content ships in the
bundle, so the whole tour works offline; on launch the app checks
`https://rooted-forward.org/api/walk` and swaps in newer content when
the site changes, so editing `src/lib/tours/hyde-park-walk.ts` and
deploying the site updates the app too.

## Build and run

```sh
./prep-media.sh        # copies tour audio/images from ../public
open RootedForward.xcodeproj
```

Then press Run in Xcode (any iPhone simulator, iOS 17+). The project
file is generated from `project.yml`; if you change that file, run
`xcodegen generate` (`brew install xcodegen`).

Tests: Product > Test in Xcode, or

```sh
xcodebuild -project RootedForward.xcodeproj -scheme RootedForward \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

`RootedForwardTests` checks the bundled content is complete (every
stop's audio, images, thumbnails, projection sanity). The UI tests
walk every screen; `ScreenshotTests` also produces the App Store
screenshots.

## Refreshing the bundled content snapshot

The bundled snapshot is `Resources/Content/tour.json`, the saved
response of `/api/walk`. After editing tour content on the site:

```sh
curl -s https://rooted-forward.org/api/walk -o Resources/Content/tour.json
./prep-media.sh
```

(Not strictly required, since the app self-updates from the API, but
it keeps first launch and offline installs current.)

## Submitting to the App Store

Everything App Store Connect asks for is prepared in
`AppStore/metadata.md`, including the description, keywords, age
rating and privacy questionnaire answers, review notes, and the
submission checklist. Screenshots (6.9 inch, 1320x2868) are in
`AppStore/screenshots/`. Set your team in Xcode's Signing settings,
Product > Archive, and follow the checklist.

## Layout

| Path | What |
|---|---|
| `Sources/Models` | Codable mirror of the site's walk-types.ts + projection math |
| `Sources/Store` | ContentStore (bundle + live sync), ProgressStore, AudioEngine, LocationService, AccountStore |
| `Sources/Theme` | Palette, brand fonts (variable TTFs), plate styles, survey rule |
| `Sources/Views` | Home (with the Why-this-walk essay), Tour (stops, transport bar), Map (canvas, sheet, full-screen explorer), photo viewer, Settings |
| `Resources/Content/tour.json` | Bundled content snapshot from /api/walk |
| `Resources/Fonts` | Bodoni Moda, Fraunces, DM Sans variable TTFs (SIL OFL) |
| `AppStore/` | Icon source, screenshots, full submission kit |
