import SwiftUI

// ------------------------------------------------------------------
// One stop, matching the site's StopDetail: Directions chip, Bodoni
// title, then/now photograph plates with credits, the listen card,
// the transcript with bold markup, the red instrument plates, and
// the hand-off plate walking you to the next stop.
// ------------------------------------------------------------------

struct StopPage: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    let stop: WalkStop
    let isLast: Bool
    let goNext: (() -> Void)?
    let goPrevious: (() -> Void)?

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .id("top")
                    listenCard
                        .padding(.top, 22)
                    imagePlates
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
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Spacer()
                Link(destination: directionsURL(lat: stop.lat, lng: stop.lng)) {
                    HStack(spacing: 6) {
                        Image(systemName: "mappin.and.ellipse")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(RF.rust)
                        Text("Directions")
                            .font(RF.body(14, weight: 600))
                            .foregroundStyle(RF.ink.opacity(0.8))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(.white)
                    .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
                }
                .accessibilityLabel("Walking directions to \(stop.title)")
            }
            .padding(.top, 14)

            Text(stop.title)
                .font(RF.didone(33, weight: 600))
                .foregroundStyle(RF.forest)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 10)
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
        HStack(spacing: 14) {
            PlayButton(stop: stop, size: 52)
            VStack(alignment: .leading, spacing: 3) {
                Text("Listen to this stop")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.ink)
                AudioTimeline(stop: stop)
            }
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
                    FramedImage(image: image)
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
                        Text("The instrument")
                            .eyebrow(RF.plateRed)
                        Text(interrupt.title)
                            .font(RF.display(21, weight: 600))
                            .foregroundStyle(RF.plateRed)
                            .fixedSize(horizontal: false, vertical: true)
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
                    .eyebrow(RF.forest)
                Text(next.text)
                    .font(RF.body(15.5))
                    .foregroundStyle(RF.ink.opacity(0.8))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
                Text("\(WalkFormat.distance(meters: next.distanceMeters)) · about \(next.minutes) min")
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)

                HStack(spacing: 16) {
                    if let goNext {
                        Button("Next stop", action: goNext)
                            .buttonStyle(HardShadowButtonStyle())
                            .accessibilityIdentifier("next-stop")
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
                            }
                        }
                    }
                }
                .padding(.top, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
            } label: {
                Text("Sources for this stop")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.warmGray)
            }
            .tint(RF.warmGray)
            .padding(.top, 30)
        }
    }
}

/// Scrubber + times for one stop's narration.
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

            HStack {
                Text(WalkFormat.clock(seconds: time))
                Spacer()
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
                Spacer()
                Text(WalkFormat.clock(seconds: duration))
            }
            .font(RF.body(12))
            .foregroundStyle(RF.warmGray)
        }
    }

    private var rateLabel: String {
        audio.rate == 1.0 ? "1×" : audio.rate == 1.25 ? "1.25×" : "1.5×"
    }
}

func directionsURL(lat: Double, lng: Double) -> URL {
    URL(string: "https://maps.apple.com/?daddr=\(lat),\(lng)&dirflg=w")!
}
