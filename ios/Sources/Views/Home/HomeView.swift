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
    @State private var heroDrift = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack(alignment: .bottom) {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        masthead
                        mission
                        tours
                        footer
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
            .accessibilityLabel("Settings")
            .accessibilityIdentifier("home-settings")
        }
        .padding(.horizontal, 24)
        .padding(.top, 8)
    }

    // MARK: - Mission

    private var mission: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("A student-run Chicago nonprofit")
                .font(RF.display(15.5, weight: 400, italic: true))
                .foregroundStyle(RF.ink.opacity(0.6))
                .padding(.top, 56)

            Text("We educate people about racial inequality in Chicago, and we work to address it.")
                .font(RF.display(29, weight: 600))
                .foregroundStyle(RF.forest)
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 12)
                .accessibilityAddTraits(.isHeader)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .top) {
            // The 1940 HOLC survey map, ghosted and drifting slowly.
            Color.clear
                .frame(height: 380)
                .overlay {
                    MediaImage(
                        sitePath: "/media/hyde-park-walk/holc-chicago-1940.jpg",
                        contentMode: .fill
                    )
                    .scaleEffect(heroDrift ? 1.14 : 1.05)
                    .offset(x: heroDrift ? -16 : 10, y: heroDrift ? -44 : -26)
                }
                .clipped()
                .opacity(0.1)
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
                .onAppear {
                    guard !reduceMotion else { return }
                    withAnimation(.easeInOut(duration: 48).repeatForever(autoreverses: true)) {
                        heroDrift = true
                    }
                }
        }
    }

    // MARK: - Tours

    private var tours: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Self-guided tours")
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.forest)

            NavigationLink(value: "hyde-park-walk") {
                TourCard()
            }
            .buttonStyle(PressableCardStyle())
            .accessibilityIdentifier("home-tour-card")
        }
        .padding(.horizontal, 24)
        .padding(.top, 56)
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
        .padding(.top, 64)
        .padding(.bottom, 100)
    }
}

/// Which stop the tour opens on.
struct TourTarget: Identifiable {
    let index: Int
    var id: Int { index }
}

/// The sheets behind the tour screen's info rows.
enum InfoSheet: String, Identifiable {
    case essay, plates
    var id: String { rawValue }
}

/// The walk's listing card. Photograph on top, then the title, one
/// line on what the tour is, and the facts.
private struct TourCard: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            MediaImage(
                sitePath: "/media/hyde-park-walk/hyde-park-aerial-1927.jpg",
                contentMode: .fill
            )
            .frame(height: 176)
            .frame(maxWidth: .infinity)
            .clipped()
            .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)

            VStack(alignment: .leading, spacing: 8) {
                Text(content.tour.title)
                    .font(RF.didone(27, weight: 600))
                    .foregroundStyle(RF.forest)

                Text("A racial history of the neighborhood.")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.85))
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 0) {
                    Text(meta)
                        .font(RF.display(14.5, weight: 400, italic: true))
                        .foregroundStyle(RF.ink.opacity(0.62))
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(RF.warmGray)
                }
                .padding(.top, 6)
            }
            .padding(.horizontal, 14)
            .padding(.top, 4)
            .padding(.bottom, 16)
        }
        .plate()
        .contentShape(Rectangle())
    }

    // Set like the site's italic accent lines, commas and all.
    private var meta: String {
        var line = "\(content.tour.stops.count) stops, "
            + String(format: "%.1f miles", content.tour.distanceMiles)
            + ", \(content.tour.listenMinutes) minutes of audio"
        if progress.hasProgress {
            line += ". At stop \(min(progress.lastIndex, content.tour.stops.count - 1) + 1)"
        }
        return line
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
