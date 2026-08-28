import SwiftUI

// ------------------------------------------------------------------
// One stop, matching the site's StopDetail. Serif title, then/now
// photograph plates, the listen card, the transcript with bold
// markup, the red instrument plates, and the hand-off plate walking
// you to the next stop. Directions rides the floating pill row.
// ------------------------------------------------------------------

struct StopPage: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var edits: EditStore

    let stop: WalkStop
    let isLast: Bool
    let goNext: (() -> Void)?
    let goPrevious: (() -> Void)?
    /// Fires when the big title scrolls out of the viewport (and again
    /// when it returns), so the tour's top bar can pin the stop name.
    var onTitleHidden: ((Bool) -> Void)? = nil
    /// Fires once the walker has actually scrolled this page, which
    /// is the signal that they are reading rather than passing through.
    var onScrolled: (() -> Void)? = nil
    /// A red plate to open on rather than the top of the stop, set
    /// when the walker taps an entry in the tools-of-segregation
    /// index. Nil is the ordinary case.
    var scrollToPlate: String? = nil
    var onPlateShown: (() -> Void)? = nil

    @State private var appeared = false
    @State private var reportedTitleHidden = false
    @State private var restingMaxY: CGFloat?
    @State private var reportedScroll = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                // No entrance animation here. The cover presenting or
                // the page sliding is already the transition, and a
                // second one on top of it only delayed the reading.
                VStack(alignment: .leading, spacing: 0) {
                    header
                        .id("top")
                    if let video = stop.video {
                        VideoPlate(video: video)
                            .padding(.top, 22)
                    }
                    listenCard
                        .padding(.top, 22)
                    imagePlates
                    transcript
                    trailingPlates
                    handOff
                    sources
                    NoteButton(
                        makeTarget: { n in .note(content.slug, stop, n) },
                        existing: edits.noteCount(forStop: stop.id, slug: content.slug)
                    )
                }
                .padding(.horizontal, 20)
                // The chrome fades the text out over a gradient now,
                // so the page no longer reserves a phone's thickness
                // of blank paper for a bar that may never appear.
                .padding(.bottom, 132)
            }
            .background(RF.cream)
            .coordinateSpace(name: "stop-scroll")
            .onPreferenceChange(TitleMaxYKey.self) { maxY in
                guard maxY != .greatestFiniteMagnitude else { return }
                if restingMaxY == nil { restingMaxY = maxY }
                // Two bounds rather than one. A thumb resting near a
                // single threshold used to insert and remove the
                // pinned name over and over while someone read.
                if !reportedTitleHidden, maxY < 0 {
                    reportedTitleHidden = true
                    onTitleHidden?(true)
                } else if reportedTitleHidden, maxY > 28 {
                    reportedTitleHidden = false
                    onTitleHidden?(false)
                }
                if !reportedScroll, let rest = restingMaxY, maxY < rest - 24 {
                    reportedScroll = true
                    onScrolled?()
                }
            }
            .onChange(of: stop.id) { _, _ in
                proxy.scrollTo("top", anchor: .top)
            }
            .onAppear {
                appeared = true
                guard let plate = scrollToPlate else { return }
                // One runloop turn so the plate has been laid out and
                // the proxy can actually find its anchor.
                DispatchQueue.main.async {
                    withAnimation(.rfAppear) {
                        proxy.scrollTo(plate, anchor: .top)
                    }
                    onPlateShown?()
                }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Directions lives in the floating pill row next to Map.
            Editable(.stopTitle(content.slug, stop), original: stop.title) { title in
                Text(title)
                    .font(RF.display(30, weight: 600))
                    .foregroundStyle(RF.forest)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 16)
                    .accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("stop-title-\(stop.number)")
                    // Reports the title's bottom edge in the viewport so
                    // the top bar knows when the name has scrolled away.
                    .background(
                        GeometryReader { geo in
                            Color.clear.preference(
                                key: TitleMaxYKey.self,
                                value: geo.frame(in: .named("stop-scroll")).maxY
                            )
                        }
                    )
            }

            Editable(.stopDek(content.slug, stop), original: stop.dek) { dek in
                Text(dek)
                    .font(RF.body(17))
                    .foregroundStyle(RF.ink.opacity(0.72))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 10)
            }
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

    /// Every photograph on the stop, historic views then the modern one.
    private var allImages: [WalkImage] {
        stop.images + (stop.nowImage.map { [$0] } ?? [])
    }

    /// Photographs with no paragraph anchor, which mat above the story
    /// the way they always have.
    @ViewBuilder
    private var imagePlates: some View {
        let plates = allImages.filter { $0.after == nil }
        if !plates.isEmpty {
            VStack(alignment: .leading, spacing: 22) {
                ForEach(plates, id: \.src) { image in
                    // The full credit lives in the photo room; the
                    // plate keeps only its small date label.
                    FramedImage(
                        image: image, showCredit: false,
                        photoEdit: photoEdit(for: image)
                    )
                }
            }
            .padding(.top, 26)
        }
    }

    /// Photographs anchored to one paragraph, set right under it.
    private func images(after index: Int) -> [WalkImage] {
        allImages.filter { $0.after == index }
    }

    /// Where a photograph sits among this stop's plates, so a caption
    /// edit has a key that survives being retyped.
    private func photoEdit(for image: WalkImage) -> PhotoEditContext? {
        guard Beta.editing, let index = allImages.firstIndex(of: image) else { return nil }
        return PhotoEditContext(slug: content.slug, stop: stop, index: index)
    }

    // MARK: - Transcript

    /// The story, with each red plate and each anchored photograph set
    /// after the paragraph that sets it up, so nothing stacks back to
    /// back and no picture arrives ahead of its sentence.
    private var transcript: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(Array(stop.transcript.enumerated()), id: \.offset) { index, paragraph in
                Editable(.transcript(content.slug, stop, index), original: paragraph) { text in
                    MarkedText(text: text)
                }
                ForEach(images(after: index), id: \.src) { image in
                    FramedImage(
                        image: image, showCredit: false,
                        photoEdit: photoEdit(for: image)
                    )
                    .padding(.top, 6)
                }
                ForEach(plates(after: index), id: \.offset) { plate in
                    redPlate(plate.element, at: plate.offset)
                        .padding(.top, 6)
                }
            }
        }
        .padding(.top, 26)
    }

    // MARK: - Red plates

    /// Plates carry their position in the stop's own list, because that
    /// is what a caption or a rewrite is keyed to.
    private func plates(after index: Int) -> [(offset: Int, element: WalkInterrupt)] {
        Array((stop.interrupts ?? []).enumerated()).filter { $0.element.after == index }
    }

    /// Plates with no anchor keep the older behavior and land after
    /// the whole story.
    @ViewBuilder
    private var trailingPlates: some View {
        let loose = Array((stop.interrupts ?? []).enumerated()).filter {
            $0.element.after == nil || ($0.element.after ?? 0) >= stop.transcript.count
        }
        if !loose.isEmpty {
            VStack(alignment: .leading, spacing: 20) {
                ForEach(loose, id: \.offset) { plate in
                    redPlate(plate.element, at: plate.offset)
                }
            }
            .padding(.top, 28)
        }
    }

    private func redPlate(_ interrupt: WalkInterrupt, at plateIndex: Int) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Editable(
                .plateTitle(content.slug, stop, plateIndex),
                original: interrupt.title
            ) { title in
                Text(title)
                    .font(RF.display(21, weight: 600))
                    .foregroundStyle(RF.plateRed)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)
            }
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(interrupt.body.enumerated()), id: \.offset) { i, paragraph in
                    Editable(
                        .plateBody(content.slug, stop, plateIndex, i),
                        original: paragraph
                    ) { text in
                        MarkedText(text: text, size: 15.5, color: RF.ink.opacity(0.82))
                    }
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .redPlate()
        // The anchor the tools-of-segregation index scrolls to.
        .id(interrupt.id)
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
                Editable(.directions(content.slug, stop), original: next.text) { text in
                    Text(text)
                        .font(RF.body(15.5))
                        .foregroundStyle(RF.ink.opacity(0.8))
                        .lineSpacing(5)
                        .fixedSize(horizontal: false, vertical: true)
                }
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
        .animation(RFMotion.appear, value: audio.isPlaying)
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

/// Bottom edge of the stop title measured in the scroll viewport;
/// negative or near-zero means the title has scrolled out of view.
private struct TitleMaxYKey: PreferenceKey {
    static var defaultValue: CGFloat = .greatestFiniteMagnitude
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = min(value, nextValue())
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
