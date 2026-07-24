import SwiftUI

// ------------------------------------------------------------------
// The organization's front door. The masthead, the mission, then the
// tours we offer. The walk itself lives one push away on
// TourDetailView, so this screen reads like Rooted Forward and not
// like one tour wearing the whole app.
// ------------------------------------------------------------------

struct HomeView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    @State private var tourTarget: TourTarget?
    @State private var showSettings = false
    @State private var scrolled = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            // The bar stays put and the content scrolls under it. A
            // web page scrolls its header away; an app keeps it.
            VStack(spacing: 0) {
                masthead
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        mission
                        tours
                        footer
                    }
                    .background(scrollWatcher)
                }
                .coordinateSpace(name: "home-scroll")
                .onPreferenceChange(ScrollOffsetKey.self) { minY in
                    let past = minY < -4
                    if past != scrolled {
                        withAnimation(RFMotion.gated(.rfAppear, reduceMotion)) {
                            scrolled = past
                        }
                    }
                }
                .refreshable {
                    await content.refresh()
                }
            }
            .background(RF.cream)
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(for: String.self) { _ in
                TourDetailView { index in
                    tourTarget = TourTarget(index: index)
                }
            }
        }
        // The chip contributes its own inset, so no screen has to
        // reserve blank space for a control that is usually absent.
        .safeAreaInset(edge: .bottom, spacing: 0) {
            ListeningChip { index in
                tourTarget = TourTarget(index: index)
            }
        }
        .fullScreenCover(item: $tourTarget) { target in
            TourView(startAt: target.index)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
        .onAppear { Haptics.warm() }
    }

    /// Reports how far the content has scrolled, so the bar can grow
    /// its hairline only once something has passed under it.
    private var scrollWatcher: some View {
        GeometryReader { geo in
            Color.clear.preference(
                key: ScrollOffsetKey.self,
                value: geo.frame(in: .named("home-scroll")).minY
            )
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
                    .frame(width: 44, height: 44)
            }
            // Pulls the 44pt hit area's glyph back into optical line
            // with the logo on the other side of the bar
            .padding(.trailing, -11)
            .accessibilityLabel("Settings")
            .accessibilityIdentifier("home-settings")
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 6)
        .background(RF.cream)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(RF.border)
                .frame(height: 1)
                .opacity(scrolled ? 1 : 0)
        }
    }

    // MARK: - Mission

    private var mission: some View {
        VStack(alignment: .leading, spacing: 0) {
            // One headline, two inks. The rust sentence names who we
            // are at the same size as the mission itself.
            (Text("A student-run Chicago nonprofit. ")
                .foregroundColor(RF.rust)
                + Text("Rooted Forward educates people about racial inequality in Chicago and works to address it through education and political advocacy.")
                .foregroundColor(RF.forest))
                .font(RF.display(26, weight: 600))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 44)
                .accessibilityAddTraits(.isHeader)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .top) {
            // The 1940 HOLC survey map, ghosted behind the mission.
            Color.clear
                .frame(height: 380)
                .overlay {
                    MediaImage(
                        sitePath: "/media/hyde-park-walk/holc-chicago-1940.jpg",
                        contentMode: .fill
                    )
                    .scaleEffect(1.08)
                    .offset(x: 4, y: -30)
                }
                .clipped()
                // Enough to read as a survey map behind the words
                // rather than an uneven stain, and still quiet enough
                // that the forest type stays crisp over it.
                .opacity(0.2)
                // Fade both edges so the scan dissolves into the
                // paper instead of ending on a pasted rectangle.
                .mask(
                    LinearGradient(
                        stops: [
                            .init(color: .clear, location: 0),
                            .init(color: .black, location: 0.18),
                            .init(color: .black, location: 0.62),
                            .init(color: .clear, location: 1),
                        ],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .accessibilityHidden(true)
        }
    }

    // MARK: - Tours

    private var tours: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Self-guided tours")
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)

            Text("Free audio tours walking you through the racial history of these locations.")
                .font(RF.body(15.5))
                .foregroundStyle(RF.ink.opacity(0.7))
                .padding(.top, 6)

            NavigationLink(value: "hyde-park-walk") {
                TourCard(
                    visited: progress.visitedCount(in: content.tour.mainline),
                    total: content.tour.mainline.count,
                    hasProgress: progress.hasProgress
                )
            }
            .buttonStyle(PressablePlateStyle())
            .accessibilityIdentifier("home-tour-card")
            .padding(.top, 18)
        }
        .padding(.horizontal, 24)
        .padding(.top, 52)
    }

    // MARK: - Footer

    private var footer: some View {
        VStack(spacing: 12) {
            SurveyRule(color: RF.warmGrayLight)
            Link(destination: URL(string: "https://rooted-forward.org")!) {
                Text("rooted-forward.org")
                    .font(RF.body(13, weight: 500))
                    .foregroundStyle(RF.warmGrayDark)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 64)
        .padding(.bottom, 28)
    }
}

/// Tracks the home scroll offset so the bar can earn its hairline.
struct ScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = min(value, nextValue())
    }
}

/// Which stop the tour opens on.
struct TourTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

/// The sheets behind the tour screen's info rows.
enum InfoSheet: String, Identifiable {
    case essay, plates, details
    var id: String { rawValue }
}

/// The walk's listing card. A photograph, the title, one line, and
/// once the walk is under way, how far along it is.
private struct TourCard: View {
    @EnvironmentObject private var content: ContentStore
    let visited: Int
    let total: Int
    let hasProgress: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            MediaImage(
                sitePath: "/media/hyde-park-walk/hyde-park-aerial-1927.jpg",
                contentMode: .fill
            )
            .frame(height: 168)
            .frame(maxWidth: .infinity)
            .clipped()
            .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)

            VStack(alignment: .leading, spacing: 6) {
                Text(content.tour.title)
                    .font(RF.display(26, weight: 600))
                    .foregroundStyle(RF.forest)

                Text("A racial history of the neighborhood.")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.85))
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)

                if hasProgress {
                    progressStrip
                        .padding(.top, 10)
                }
            }
            .padding(.horizontal, 14)
            .padding(.top, 4)
            .padding(.bottom, 16)
        }
        .plate()
        .contentShape(Rectangle())
    }

    private var progressStrip: some View {
        VStack(alignment: .leading, spacing: 6) {
            Rectangle().fill(RF.border).frame(height: 1)
            Text("\(visited) of \(total) visited")
                .font(RF.body(13, weight: 600))
                .foregroundStyle(RF.forest)
                .padding(.top, 4)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(RF.border)
                    Rectangle()
                        .fill(RF.rust)
                        .frame(width: geo.size.width * CGFloat(visited) / CGFloat(max(total, 1)))
                }
            }
            .frame(height: 3)
            .accessibilityHidden(true)
        }
    }
}

/// The resume-audio chip pinned over the home screen while narration
/// plays. Isolated so audio progress updates re-render only this.
struct ListeningChip: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var audio: AudioEngine
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let onOpen: (Int) -> Void

    var body: some View {
        // Arrives the same way the transport bar inside the tour does,
        // since it is the same piece of state wearing a different hat.
        ZStack {
            if audio.currentStopID != nil {
                chip
                    .padding(.horizontal, 16)
                    .padding(.bottom, 10)
                    .transition(
                        reduceMotion
                            ? .opacity
                            : .move(edge: .bottom).combined(with: .opacity)
                    )
            }
        }
        .animation(RFMotion.gated(.rfMove, reduceMotion), value: audio.currentStopID != nil)
    }

    private var chip: some View {
        HStack(spacing: 12) {
            Button {
                Haptics.press()
                audio.isPlaying ? audio.pause() : audio.resume()
            } label: {
                Image(systemName: audio.isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(Circle().fill(RF.rust))
                    // The circle stays 34pt; the finger gets 44
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
            }
            .accessibilityHidden(true)

            Button {
                let index = content.tour.stops.firstIndex { audio.isCurrent($0.id) } ?? 0
                onOpen(index)
            } label: {
                HStack(spacing: 8) {
                    Text(audio.currentStopTitle)
                        .font(RF.body(14, weight: 600))
                        .foregroundStyle(RF.ink)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    if audio.isPlaying {
                        PlayingWave()
                    }
                    Image(systemName: "chevron.up")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(RF.warmGrayDark)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .plate()
        .overlay(alignment: .bottom) {
            // How far into the stop, read off the inner edge of the
            // plate so the chip answers "how much is left" on sight.
            GeometryReader { geo in
                Rectangle()
                    .fill(RF.rust)
                    .frame(
                        width: geo.size.width * (audio.duration > 0
                            ? min(1, audio.currentTime / audio.duration) : 0)
                    )
                    .animation(.linear(duration: 0.25), value: audio.currentTime)
            }
            .frame(height: 2)
            .padding(.horizontal, 1)
            .padding(.bottom, 1)
            .accessibilityHidden(true)
        }
        // One VoiceOver element: named for the narration, opens the
        // tour, with play/pause as a custom action.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Now playing, \(audio.currentStopTitle)")
        .accessibilityHint("Opens the tour")
        .accessibilityAction(named: audio.isPlaying ? "Pause" : "Play") {
            audio.isPlaying ? audio.pause() : audio.resume()
        }
    }
}
