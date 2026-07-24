import SwiftUI

// ------------------------------------------------------------------
// The walk's own screen, pushed from the tours list. The title, one
// sentence, the facts, the start button, the stops, and two rows
// that open sheets (the founder's essay and the red plates index).
// ------------------------------------------------------------------

struct TourDetailView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    let openTour: (Int) -> Void

    @State private var infoSheet: InfoSheet?
    @State private var confirmRestart = false
    @State private var heroDrift = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                hero
                stopsStrip
                infoRows
            }
            .padding(.bottom, 110)
        }
        .background(RF.cream)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(RF.cream, for: .navigationBar)
        .sheet(item: $infoSheet) { sheet in
            InfoSheetView(sheet: sheet) { index in
                infoSheet = nil
                openTour(index)
            }
        }
        .confirmationDialog(
            "Start the walk over?",
            isPresented: $confirmRestart,
            titleVisibility: .visible
        ) {
            Button("Start over", role: .destructive) {
                progress.reset()
                openTour(0)
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your visited stops reset. The audio files stay on your phone.")
        }
    }

    // MARK: - Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: -24) {
                Text("Walk")
                Text("Hyde Park")
            }
            .font(RF.didone(54, weight: 600))
            .foregroundStyle(RF.forest)
            .padding(.top, 20)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)

            Text(lastSentence(of: content.tour.dek))
                .font(RF.body(17))
                .foregroundStyle(RF.ink.opacity(0.7))
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 18)

            Text("\(content.tour.stops.count) stops, \(content.tour.distanceMiles, specifier: "%.1f") miles, \(content.tour.listenMinutes) minutes of audio")
                .font(RF.display(15, weight: 400, italic: true))
                .foregroundStyle(RF.ink.opacity(0.62))
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

    // The dek's closing sentence is its argument; the opening one
    // already lives on the home card.
    private func lastSentence(of text: String) -> String {
        let sentences = text.split(separator: ".", omittingEmptySubsequences: true)
        guard let last = sentences.last else { return text }
        return last.trimmingCharacters(in: .whitespaces) + "."
    }

    private var startControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                if progress.hasProgress {
                    openTour(min(progress.lastIndex, content.tour.stops.count - 1))
                } else {
                    openTour(0)
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
                            openTour(index)
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
            infoRow("The tools of segregation") {
                infoSheet = .plates
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
