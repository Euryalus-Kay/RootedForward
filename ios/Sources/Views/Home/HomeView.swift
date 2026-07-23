import SwiftUI

// ------------------------------------------------------------------
// The home screen, kept quiet. One title, one sentence, one line of
// facts, one button. The stops speak through their photographs, and
// everything wordy (the essay, the five red plates, the practical
// notes) lives one tap away in sheets instead of stacked captions.
// ------------------------------------------------------------------

struct HomeView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    @State private var tourTarget: TourTarget?
    @State private var showSettings = false
    @State private var confirmRestart = false
    @State private var infoSheet: InfoSheet?
    @State private var heroDrift = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    masthead
                    hero
                    stopsStrip
                    infoRows
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
        .sheet(item: $infoSheet) { sheet in
            InfoSheetView(sheet: sheet) { index in
                infoSheet = nil
                tourTarget = TourTarget(index: index)
            }
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
                .frame(width: 28, height: 28)
                .accessibilityHidden(true)
            Text("Rooted Forward")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
            Spacer()
            Button {
                showSettings = true
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 17, weight: .medium))
                    .foregroundStyle(RF.ink.opacity(0.55))
                    .frame(width: 40, height: 40)
            }
            .accessibilityLabel("Settings")
            .accessibilityIdentifier("home-settings")
        }
        .padding(.horizontal, 24)
        .padding(.top, 8)
    }

    // MARK: - Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: -14) {
                Text("Walk")
                Text("Hyde Park")
            }
            .font(RF.didone(54, weight: 600))
            .foregroundStyle(RF.forest)
            .padding(.top, 52)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)

            Text(firstSentence(of: content.tour.dek))
                .font(RF.body(17))
                .foregroundStyle(RF.ink.opacity(0.7))
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 18)

            Text("\(content.tour.stops.count) stops · \(content.tour.distanceMiles, specifier: "%.1f") miles · \(content.tour.listenMinutes) minutes of audio")
                .font(RF.body(14, weight: 500))
                .foregroundStyle(RF.warmGray)
                .padding(.top, 12)

            startControls
                .padding(.top, 32)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .top) {
            // The 1940 HOLC survey map, ghosted and drifting slowly.
            Color.clear
                .frame(height: 420)
                .overlay {
                    MediaImage(
                        sitePath: "/media/hyde-park-walk/holc-chicago-1940.jpg",
                        contentMode: .fill
                    )
                    .scaleEffect(heroDrift ? 1.14 : 1.05)
                    .offset(x: heroDrift ? -16 : 10, y: heroDrift ? -12 : 6)
                }
                .clipped()
                .opacity(0.1)
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

    private func firstSentence(of text: String) -> String {
        guard let period = text.firstIndex(of: ".") else { return text }
        return String(text[...period])
    }

    private var startControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                if progress.hasProgress {
                    tourTarget = TourTarget(index: min(progress.lastIndex, content.tour.stops.count - 1))
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
                    Text("\(progress.visited.count) of \(content.tour.stops.count) visited")
                        .font(RF.body(13))
                        .foregroundStyle(RF.warmGray)
                    Button("Start over") {
                        confirmRestart = true
                    }
                    .font(RF.body(13, weight: 600))
                    .foregroundStyle(RF.rust)
                }
            }
        }
    }

    // MARK: - Stops strip

    private var stopsStrip: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("The stops")
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.forest)
                .padding(.horizontal, 24)

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
                .padding(.horizontal, 24)
                .padding(.vertical, 6)
            }
        }
        .padding(.top, 52)
    }

    // MARK: - Info rows

    private var infoRows: some View {
        VStack(spacing: 0) {
            infoRow("Why this walk", identifier: "home-essay-more") {
                infoSheet = .essay
            }
            divider
            infoRow("The five red plates") {
                infoSheet = .plates
            }
            divider
            infoRow("Before you walk") {
                infoSheet = .practical
            }
            divider
            Link(destination: URL(string: "https://rooted-forward.org/tours/chicago/hyde-park")!) {
                HStack {
                    Text("Read the exhibit")
                        .font(RF.body(16, weight: 500))
                        .foregroundStyle(RF.ink.opacity(0.85))
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(RF.warmGray)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
                .contentShape(Rectangle())
            }
        }
        .plate()
        .padding(.horizontal, 24)
        .padding(.top, 44)
    }

    private var divider: some View {
        Rectangle().fill(RF.border.opacity(0.8)).frame(height: 1)
    }

    private func infoRow(_ title: String, identifier: String? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(title)
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.85))
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RF.warmGray)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            // Without an explicit content shape, the transparent gap
            // in the middle of the row is not tappable at all.
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(identifier ?? "row-\(title)")
    }

    // MARK: - Footer

    private var footer: some View {
        VStack(spacing: 12) {
            SurveyRule(color: RF.warmGrayLight)
            Link(destination: URL(string: "https://rooted-forward.org")!) {
                Text("rooted-forward.org")
                    .font(RF.body(13, weight: 500))
                    .foregroundStyle(RF.warmGray)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 56)
        .padding(.bottom, 100)
    }
}

/// Which stop the tour opens on.
struct TourTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

/// The sheets behind the home screen's info rows.
enum InfoSheet: String, Identifiable {
    case essay, plates, practical
    var id: String { rawValue }
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

                Text(audio.currentStopTitle)
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.ink)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.up")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RF.warmGray)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .plate()
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
