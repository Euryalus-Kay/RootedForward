import SwiftUI

// ------------------------------------------------------------------
// The home screen. A museum placard, not an app list: cream paper,
// the 1940 HOLC survey map ghosted behind the masthead, Bodoni tour
// title, survey-rule divider, hard-shadow rust CTA, then the eleven
// stops as framed plates, the five red instrument plates, and the
// practical cards, all drawn from live tour content.
// ------------------------------------------------------------------

struct HomeView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    @State private var tourTarget: TourTarget?
    @State private var showSettings = false
    @State private var confirmRestart = false
    @State private var essayExpanded = false
    @State private var heroDrift = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    masthead
                    hero
                    essay
                    stopsStrip
                    platesCard
                    practicalCards
                    footer
                }
            }
            .background(RF.cream)

            ListeningChip { index in
                tourTarget = TourTarget(index: index)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 10)
        }
        .fullScreenCover(item: $tourTarget) { target in
            TourView(startAt: target.index)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .confirmationDialog(
            "Start the walk over?",
            isPresented: $confirmRestart,
            titleVisibility: .visible
        ) {
            Button("Start over", role: .destructive) {
                progress.reset()
                tourTarget = TourTarget(index: 0)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your visited stops reset. The audio files stay on your phone.")
        }
    }

    // MARK: - Masthead

    private var masthead: some View {
        HStack(spacing: 10) {
            Image("LogoMark")
                .resizable()
                .frame(width: 30, height: 30)
                .accessibilityHidden(true)
            Text("Rooted Forward")
                .font(RF.display(19, weight: 600))
                .foregroundStyle(RF.forest)
            Spacer()
            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(RF.ink.opacity(0.65))
                    .frame(width: 40, height: 40)
            }
            .accessibilityLabel("Settings")
            .accessibilityIdentifier("home-settings")
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    // MARK: - Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
                Text("Self-guided audio tour")
                    .eyebrow()
                    .padding(.top, 36)

                Text("Walk Hyde Park")
                    .font(RF.didone(46, weight: 600))
                    .foregroundStyle(RF.forest)
                    .padding(.top, 10)
                    .accessibilityAddTraits(.isHeader)

                Text(content.tour.dek)
                    .font(RF.body(16.5))
                    .foregroundStyle(RF.ink.opacity(0.78))
                    .lineSpacing(6)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 14)

                Text("\(content.tour.distanceMiles, specifier: "%.1f") miles, mostly flat")
                    .font(RF.display(17, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)
                    .padding(.top, 12)

                SurveyRule()
                    .padding(.top, 18)

                stats
                    .padding(.top, 18)

            startControls
                .padding(.top, 24)
        }
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .top) {
            // The 1940 HOLC survey map, ghosted and drifting slowly,
            // like a document on a light table.
            Color.clear
                .frame(height: 380)
                .overlay {
                    MediaImage(
                        sitePath: "/media/hyde-park-walk/holc-chicago-1940.jpg",
                        contentMode: .fill
                    )
                    .scaleEffect(heroDrift ? 1.14 : 1.05)
                    .offset(x: heroDrift ? -16 : 10, y: heroDrift ? -12 : 6)
                }
                .clipped()
                .opacity(0.12)
                .mask(
                    LinearGradient(
                        colors: [.black, .black, .clear],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .accessibilityHidden(true)
                .onAppear {
                    guard !reduceMotion else { return }
                    withAnimation(.easeInOut(duration: 48).repeatForever(autoreverses: true)) {
                        heroDrift = true
                    }
                }
        }
    }

    // MARK: - Why this walk

    private var essay: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Why this walk")
                .eyebrow()
            Text(content.intro.title)
                .font(RF.display(24, weight: 600))
                .foregroundStyle(RF.forest)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 14) {
                ForEach(
                    Array((essayExpanded ? content.intro.paragraphs : Array(content.intro.paragraphs.prefix(1))).enumerated()),
                    id: \.offset
                ) { _, paragraph in
                    MarkedText(text: paragraph, size: 15.5)
                }
            }

            if essayExpanded {
                Text(content.intro.byline)
                    .font(RF.display(14, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Button {
                withAnimation(.easeInOut(duration: 0.3)) {
                    essayExpanded.toggle()
                }
            } label: {
                HStack(spacing: 5) {
                    Text(essayExpanded ? "Fold it away" : "Keep reading")
                    Image(systemName: essayExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 11, weight: .semibold))
                }
                .font(RF.body(14, weight: 600))
                .foregroundStyle(RF.rust)
            }
            .accessibilityIdentifier("home-essay-more")
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
        .padding(.horizontal, 20)
        .padding(.top, 40)
    }

    private var stats: some View {
        HStack(spacing: 0) {
            statBlock(value: "\(content.tour.stops.count)", label: "stops")
            divider
            statBlock(value: String(format: "%.1f", content.tour.distanceMiles), label: "miles")
            divider
            statBlock(value: "\(content.tour.listenMinutes)", label: "min of audio")
            Spacer()
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(RF.border)
            .frame(width: 1, height: 34)
            .padding(.horizontal, 18)
    }

    private func statBlock(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(RF.didone(26, weight: 600))
                .foregroundStyle(RF.ink)
            Text(label)
                .font(RF.body(12, weight: 500))
                .tracking(1.2)
                .textCase(.uppercase)
                .foregroundStyle(RF.warmGray)
        }
    }

    private var startControls: some View {
        VStack(alignment: .leading, spacing: 12) {
            Button {
                if progress.hasProgress {
                    let index = min(progress.lastIndex, content.tour.stops.count - 1)
                    tourTarget = TourTarget(index: index)
                } else {
                    tourTarget = TourTarget(index: 0)
                }
            } label: {
                Text(progress.hasProgress
                    ? "Resume at stop \(min(progress.lastIndex, content.tour.stops.count - 1) + 1)"
                    : "Start the tour")
            }
            .buttonStyle(HardShadowButtonStyle())
            .accessibilityIdentifier("home-start")

            if progress.hasProgress {
                HStack(spacing: 10) {
                    Text("\(progress.visited.count) of \(content.tour.stops.count) stops visited")
                        .font(RF.body(13))
                        .foregroundStyle(RF.warmGray)
                    Button("Start over") {
                        confirmRestart = true
                    }
                    .font(RF.body(13, weight: 600))
                    .foregroundStyle(RF.rust)
                }
            } else {
                Text(content.tour.startLabel)
                    .font(RF.body(13))
                    .foregroundStyle(RF.warmGray)
            }
        }
    }

    // MARK: - Stops strip

    private var stopsStrip: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("The eleven stops")
                .eyebrow()
                .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 14) {
                    ForEach(Array(content.tour.stops.enumerated()), id: \.element.id) { index, stop in
                        Button {
                            tourTarget = TourTarget(index: index)
                        } label: {
                            StopCard(stop: stop, visited: progress.isVisited(stop.id))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 6)
            }
        }
        .padding(.top, 40)
    }

    // MARK: - The red plates

    private var platesCard: some View {
        let plates: [(stopIndex: Int, title: String)] = content.tour.stops.enumerated().flatMap { index, stop in
            (stop.interrupts ?? []).map { (stopIndex: index, title: $0.title) }
        }
        return VStack(alignment: .leading, spacing: 12) {
            Text("The instruments")
                .eyebrow(RF.plateRed)
            Text("Five red plates name them")
                .font(RF.display(23, weight: 600))
                .foregroundStyle(RF.plateRed)
            Text("Nothing here was weather. Along the walk, red plates name the tools that built segregation, one by one.")
                .font(RF.body(15))
                .foregroundStyle(RF.ink.opacity(0.75))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(plates.enumerated()), id: \.offset) { n, plate in
                    Button {
                        tourTarget = TourTarget(index: plate.stopIndex)
                    } label: {
                        HStack(spacing: 10) {
                            Text("\(n + 1)")
                                .font(RF.didone(15, weight: 600))
                                .foregroundStyle(RF.plateRedGround)
                                .frame(width: 22, height: 22)
                                .background(Circle().fill(RF.plateRed))
                            Text(plate.title)
                                .font(RF.body(15, weight: 600))
                                .foregroundStyle(RF.ink.opacity(0.85))
                            Spacer()
                            Text("Stop \(plate.stopIndex + 1)")
                                .font(RF.body(13))
                                .foregroundStyle(RF.warmGray)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(RF.warmGray)
                        }
                        .padding(.vertical, 11)
                    }
                    .buttonStyle(.plain)
                    if n < plates.count - 1 {
                        Rectangle().fill(RF.plateRed.opacity(0.15)).frame(height: 1)
                    }
                }
            }
            .padding(.top, 4)
        }
        .padding(18)
        .redPlate()
        .padding(.horizontal, 20)
        .padding(.top, 40)
    }

    // MARK: - Practical

    private var practicalCards: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Before you walk")
                .eyebrow()
            ForEach(content.tour.practical) { card in
                VStack(alignment: .leading, spacing: 8) {
                    Text(card.title)
                        .font(RF.display(18, weight: 600))
                        .foregroundStyle(RF.forest)
                    Text(card.text)
                        .font(RF.body(14.5))
                        .foregroundStyle(RF.ink.opacity(0.75))
                        .lineSpacing(5)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .plate()
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 40)
    }

    // MARK: - Footer

    private var footer: some View {
        VStack(alignment: .leading, spacing: 14) {
            SurveyRule(color: RF.cream.opacity(0.4))
            Text("Prefer to stay in?")
                .font(RF.display(21, weight: 600))
                .foregroundStyle(RF.cream)
            Text("The Ground Keeps Moving is the online exhibit that pairs with this walk. One map, five instruments, and the bill.")
                .font(RF.body(14.5))
                .foregroundStyle(RF.cream.opacity(0.75))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
            Link(destination: URL(string: "https://rooted-forward.org/tours/chicago/hyde-park")!) {
                HStack(spacing: 6) {
                    Text("Read the exhibit")
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 12, weight: .semibold))
                }
                .font(RF.body(15, weight: 600))
                .foregroundStyle(RF.cream)
                .underline()
            }
            Text("A student-run Chicago nonprofit.\nrooted-forward.org")
                .font(RF.body(12.5))
                .foregroundStyle(RF.cream.opacity(0.6))
                .padding(.top, 16)
        }
        .padding(20)
        .padding(.bottom, 84)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RF.forest)
        .padding(.top, 44)
    }
}

/// The resume-audio chip pinned over the home screen while narration
/// plays. Isolated so audio progress updates re-render only this.
struct ListeningChip: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var audio: AudioEngine
    let onOpen: (Int) -> Void

    var body: some View {
        if audio.currentStopID != nil {
            chip
        }
    }

    private var chip: some View {
        Button {
            let index = content.tour.stops.firstIndex { audio.isCurrent($0.id) } ?? 0
            onOpen(index)
        } label: {
            HStack(spacing: 12) {
                Button {
                    audio.isPlaying ? audio.pause() : audio.resume()
                } label: {
                    Image(systemName: audio.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Circle().fill(RF.rust))
                }
                .accessibilityLabel(audio.isPlaying ? "Pause" : "Play")

                VStack(alignment: .leading, spacing: 1) {
                    Text(audio.currentStopTitle)
                        .font(RF.body(14, weight: 600))
                        .foregroundStyle(RF.ink)
                        .lineLimit(1)
                    Text("Tap to return to the tour")
                        .font(RF.body(12))
                        .foregroundStyle(RF.warmGray)
                }
                Spacer()
                Image(systemName: "chevron.up")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RF.warmGray)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .plate()
        }
        .buttonStyle(.plain)
    }
}

/// Which stop the tour opens on.
struct TourTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

/// One framed thumbnail in the horizontal stop strip.
private struct StopCard: View {
    @EnvironmentObject private var content: ContentStore
    let stop: WalkStop
    let visited: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            MediaImage(
                sitePath: ContentStore.thumbPath(for: (stop.nowImage ?? stop.images.first)?.src ?? ""),
                contentMode: .fill
            )
            .frame(width: 128, height: 86)
            .clipped()
            .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
            .padding(8)
            .plate()

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("\(stop.number)")
                    .font(RF.didone(17, weight: 600))
                    .foregroundStyle(visited ? RF.forest : RF.rust)
                Text(stop.title)
                    .font(RF.body(13, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.8))
                    .lineLimit(2, reservesSpace: true)
                    .multilineTextAlignment(.leading)
                if visited {
                    Image(systemName: "checkmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(RF.forest)
                }
            }
            .frame(width: 136, alignment: .leading)
        }
    }
}
