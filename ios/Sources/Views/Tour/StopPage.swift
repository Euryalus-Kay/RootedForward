import SwiftUI

// ------------------------------------------------------------------
// One stop, matching the site's StopDetail: Bodoni title, then/now
// photograph plates, the listen card, the transcript with bold
// markup, the red instrument plates, and the hand-off plate walking
// you to the next stop. Directions rides the floating pill row.
// ------------------------------------------------------------------

struct StopPage: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    let stop: WalkStop
    let isLast: Bool
    let goNext: (() -> Void)?
    let goPrevious: (() -> Void)?

    @State private var appeared = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .id("top")
                        .reveal(appeared, delay: 0, reduced: reduceMotion)
                    listenCard
                        .padding(.top, 22)
                        .reveal(appeared, delay: 0.08, reduced: reduceMotion)
                    imagePlates
                        .reveal(appeared, delay: 0.16, reduced: reduceMotion)
                    transcript
                    interruptPlates
                    handOff
                    sources
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 170)
            }
            .background(RF.cream)
            .onChange(of: stop.id) { _, _ in
                proxy.scrollTo("top", anchor: .top)
            }
            .onAppear {
                appeared = true
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Directions lives in the floating pill row next to Map.
            Text(stop.title)
                .font(RF.display(30, weight: 600))
                .foregroundStyle(RF.forest)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 16)
                .accessibilityAddTraits(.isHeader)
                .accessibilityIdentifier("stop-title-\(stop.number)")

            Text(stop.dek)
                .font(RF.body(17))
                .foregroundStyle(RF.ink.opacity(0.72))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 10)
        }
    }

    // MARK: - Listen card

    private var listenCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                PlayButton(stop: stop, size: 44)
                ListenCardTitle(stop: stop)
                Spacer(minLength: 0)
            }
            AudioTimeline(stop: stop)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
    }

    // MARK: - Images

    @ViewBuilder
    private var imagePlates: some View {
        let plates = stop.images + (stop.nowImage.map { [$0] } ?? [])
        if !plates.isEmpty {
            VStack(alignment: .leading, spacing: 22) {
                ForEach(plates, id: \.src) { image in
                    // The full credit lives in the photo room; the
                    // plate keeps only its small date label.
                    FramedImage(image: image, showCredit: false)
                }
            }
            .padding(.top, 26)
        }
    }

    // MARK: - Transcript

    private var transcript: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(Array(stop.transcript.enumerated()), id: \.offset) { _, paragraph in
                MarkedText(text: paragraph)
            }
        }
        .padding(.top, 26)
    }

    // MARK: - Red plates

    @ViewBuilder
    private var interruptPlates: some View {
        if let interrupts = stop.interrupts, !interrupts.isEmpty {
            VStack(alignment: .leading, spacing: 20) {
                ForEach(interrupts) { interrupt in
                    VStack(alignment: .leading, spacing: 10) {
                        Text(interrupt.title)
                            .font(RF.display(21, weight: 600))
                            .foregroundStyle(RF.plateRed)
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityAddTraits(.isHeader)
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(Array(interrupt.body.enumerated()), id: \.offset) { _, paragraph in
                                MarkedText(text: paragraph, size: 15.5, color: RF.ink.opacity(0.82))
                            }
                        }
                    }
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .redPlate()
                }
            }
            .padding(.top, 28)
        }
    }

    // MARK: - Hand-off

    @ViewBuilder
    private var handOff: some View {
        if let next = stop.toNext {
            VStack(alignment: .leading, spacing: 12) {
                Text("On the way")
                    .font(RF.display(17, weight: 600))
                    .foregroundStyle(RF.forest)
                    .accessibilityAddTraits(.isHeader)
                Text(next.text)
                    .font(RF.body(15.5))
                    .foregroundStyle(RF.ink.opacity(0.8))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
                Text("\(WalkFormat.distance(meters: next.distanceMeters)), about \(next.minutes) min")
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)

                HStack(spacing: 16) {
                    if let goNext {
                        Button("Next stop", action: goNext)
                            .buttonStyle(HardShadowButtonStyle())
                            .accessibilityIdentifier("next-stop")
                    }
                    if let goPrevious {
                        Button {
                            goPrevious()
                        } label: {
                            Text("Back")
                                .font(RF.body(15, weight: 600))
                                .foregroundStyle(RF.ink.opacity(0.65))
                                .padding(.horizontal, 6)
                                .frame(minHeight: 44)
                                .contentShape(Rectangle())
                        }
                        .accessibilityLabel("Back to the previous stop")
                    }
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .plate()
            .padding(.top, 30)
        } else if isLast {
            VStack(alignment: .leading, spacing: 12) {
                Text("End of the walk.")
                    .font(RF.display(21, weight: 400, italic: true))
                    .foregroundStyle(RF.forest)
                Text("Thanks for walking with us. The exhibit and the rest of Rooted Forward's work live at rooted-forward.org.")
                    .font(RF.body(15))
                    .foregroundStyle(RF.ink.opacity(0.75))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
                if let goPrevious {
                    Button {
                        goPrevious()
                    } label: {
                        Text("Previous stop")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.forest)
                            .underline()
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .plate()
            .padding(.top, 30)
        }
    }

    // MARK: - Sources

    @ViewBuilder
    private var sources: some View {
        if let sources = stop.sources, !sources.isEmpty {
            DisclosureGroup {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(sources) { source in
                        if let url = URL(string: source.url) {
                            Link(destination: url) {
                                Text(source.label)
                                    .font(RF.body(13.5))
                                    .foregroundStyle(RF.forest)
                                    .underline()
                                    .multilineTextAlignment(.leading)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(minHeight: 34, alignment: .leading)
                                    .contentShape(Rectangle())
                            }
                        }
                    }
                }
                .padding(.top, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
            } label: {
                Text("Sources for this stop")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.warmGrayDark)
            }
            .tint(RF.warmGrayDark)
            .padding(.top, 30)
        }
    }
}

/// "Listen to this stop", or the live wave while it narrates.
struct ListenCardTitle: View {
    @EnvironmentObject private var audio: AudioEngine
    let stop: WalkStop

    var body: some View {
        HStack(spacing: 8) {
            if audio.isCurrent(stop.id) && audio.isPlaying {
                PlayingWave()
                Text("Now playing")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.rustDark)
            } else {
                Text("Listen to this stop")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.ink)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: audio.isPlaying)
    }
}

/// Scrubber, times, speed, and 15-second skips for one stop.
struct AudioTimeline: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var audio: AudioEngine
    let stop: WalkStop

    var body: some View {
        let isCurrent = audio.isCurrent(stop.id)
        let duration = isCurrent && audio.duration > 0 ? audio.duration : stop.audioSeconds
        let time = isCurrent ? audio.currentTime : 0

        VStack(alignment: .leading, spacing: 5) {
            Slider(
                value: Binding(
                    get: { min(time, duration) },
                    set: { newValue in
                        if isCurrent {
                            audio.seek(to: newValue)
                        }
                    }
                ),
                in: 0...max(duration, 1)
            )
            .tint(RF.rust)
            .disabled(!isCurrent)
            .accessibilityLabel("Narration position")
            .accessibilityValue(
                "\(WalkFormat.clock(seconds: time)) of \(WalkFormat.clock(seconds: duration))"
            )

            HStack(spacing: 14) {
                Text(WalkFormat.clock(seconds: time))
                    .monospacedDigit()
                Spacer()
                Button {
                    Haptics.tap()
                    audio.skip(by: -15)
                } label: {
                    Image(systemName: "gobackward.15")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(isCurrent ? RF.ink.opacity(0.7) : RF.warmGrayLight)
                        .frame(width: 44, height: 44)
                }
                .disabled(!isCurrent)
                .accessibilityLabel("Back 15 seconds")
                Button {
                    audio.cycleRate()
                } label: {
                    Text(rateLabel)
                        .font(RF.body(12, weight: 700))
                        .foregroundStyle(isCurrent ? RF.forest : RF.warmGrayLight)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .overlay(Capsule().strokeBorder(isCurrent ? RF.border : RF.border.opacity(0.6), lineWidth: 1))
                }
                .disabled(!isCurrent)
                .accessibilityLabel("Playback speed \(rateLabel)")
                Button {
                    Haptics.tap()
                    audio.skip(by: 15)
                } label: {
                    Image(systemName: "goforward.15")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(isCurrent ? RF.ink.opacity(0.7) : RF.warmGrayLight)
                        .frame(width: 44, height: 44)
                }
                .disabled(!isCurrent)
                .accessibilityLabel("Forward 15 seconds")
                Spacer()
                Text(WalkFormat.clock(seconds: duration))
                    .monospacedDigit()
            }
            .font(RF.body(12))
            // Dark enough for AA at this size; warmGray sits at 3.5:1
            .foregroundStyle(RF.ink.opacity(0.62))
        }
    }

    private var rateLabel: String {
        audio.rate == 1.0 ? "1×" : audio.rate == 1.25 ? "1.25×" : "1.5×"
    }
}

func directionsURL(lat: Double, lng: Double) -> URL {
    URL(string: "https://maps.apple.com/?daddr=\(lat),\(lng)&dirflg=w")!
}

extension View {
    /// Gentle entrance: fade and rise once when the page first shows.
    func reveal(_ on: Bool, delay: Double, reduced: Bool) -> some View {
        self
            .opacity(on || reduced ? 1 : 0)
            .offset(y: on || reduced ? 0 : 12)
            .animation(
                reduced ? nil : .easeOut(duration: 0.5).delay(delay),
                value: on
            )
    }
}
