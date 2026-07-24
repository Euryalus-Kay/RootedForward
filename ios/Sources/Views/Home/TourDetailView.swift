import SwiftUI
import StoreKit

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
    @State private var mapOpen = false
    @State private var confirmRestart = false
    @Environment(\.requestReview) private var requestReview
    @AppStorage("rf-review-asked") private var reviewAsked = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                hero
                infoRows
                stopsStrip
            }
            .padding(.bottom, 28)
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
        .sheet(isPresented: $mapOpen) {
            MapSheetView(
                currentIndex: min(progress.lastIndex, max(content.tour.stops.count - 1, 0))
            ) { index in
                mapOpen = false
                openTour(index)
            }
        }
        .onAppear {
            // One polite ask, and only once the walk is essentially
            // done. Asking at three stops landed the app's single
            // lifetime prompt on someone standing on a sidewalk a
            // fifth of the way through a three-hour walk.
            let done = progress.visitedCount(in: mainline)
            if !reviewAsked, done >= max(mainline.count - 1, 3) {
                reviewAsked = true
                requestReview()
            }
        }
        .confirmationDialog(
            "Start the walk over?",
            isPresented: $confirmRestart,
            titleVisibility: .visible
        ) {
            // Clearing progress must not also throw the walker into
            // stop 1; the button above flips back to "Start the tour"
            // and they can take it deliberately.
            Button("Start over", role: .destructive) {
                progress.reset()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Your visited stops reset. The audio files stay on your phone.")
        }
    }

    // MARK: - Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 0) {
            VStack(alignment: .leading, spacing: -12) {
                Text("Walk")
                Text("Hyde Park")
            }
            .font(RF.display(48, weight: 600))
            .foregroundStyle(RF.forest)
            .padding(.top, 20)
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)

            Text("Hyde Park mirrors the practices of race-based discrimination that ran through Chicago and the country over the last two centuries.")
                .font(RF.body(17))
                .foregroundStyle(RF.ink.opacity(0.7))
                .lineSpacing(6)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 18)

            startControls
                .padding(.top, 26)
        }
        .padding(.horizontal, 24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(alignment: .top) {
            // The route's own 1929 survey plate, held still. Home
            // used to wear the identical drifting HOLC scan, so the
            // push landed on a screen that looked like the one it
            // came from.
            Color.clear
                .frame(height: 420)
                .overlay {
                    MediaImage(
                        sitePath: "/media/hyde-park-walk/map-base-1929.jpg",
                        contentMode: .fill
                    )
                    .scaleEffect(1.06)
                }
                .clipped()
                .opacity(0.13)
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

    /// The walk without its two optional detours. Counting against
    /// all fifteen means finishing the walk still reads "13 of 15".
    private var mainline: [WalkStop] { content.tour.mainline }

    /// Quiet enough to ignore, there when someone wants the distance
    /// and the timings before committing to a five-mile walk.
    private var detailsButton: some View {
        Button {
            Haptics.tap()
            infoSheet = .details
        } label: {
            Image(systemName: "questionmark")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(RF.warmGrayDark)
                .frame(width: 30, height: 30)
                .overlay(Circle().strokeBorder(RF.warmGrayLight, lineWidth: 1))
                .frame(width: 44, height: 44)
                .contentShape(Circle())
        }
        .accessibilityLabel("Details about this walk")
        .accessibilityIdentifier("home-details")
    }

    private var startControls: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Button {
                    Haptics.press()
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

                detailsButton
            }

            if progress.hasProgress {
                Text("\(progress.visitedCount(in: mainline)) of \(mainline.count) visited")
                    .font(RF.body(13))
                    .foregroundStyle(RF.warmGrayDark)
                    .padding(.top, 4)
                Button {
                    confirmRestart = true
                } label: {
                    Text("Start over")
                        .font(RF.body(13, weight: 500))
                        .foregroundStyle(RF.warmGrayDark)
                        .underline()
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
            }
        }
    }

    // MARK: - Stops strip

    /// The stops as one vertical list, the way the map sheet already
    /// lists them. The old horizontal strip ran six screen widths
    /// sideways inside a vertical scroller, so the two gestures fought
    /// and stop 12 took five swipes to reach.
    private var stopsStrip: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("The stops")
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)
                .padding(.horizontal, 24)

            VStack(spacing: 0) {
                ForEach(Array(content.tour.stops.enumerated()), id: \.element.id) { index, stop in
                    Button {
                        Haptics.tap()
                        openTour(index)
                    } label: {
                        StopRow(
                            stop: stop,
                            visited: progress.isVisited(stop.id),
                            isResume: progress.hasProgress && index == min(progress.lastIndex, content.tour.stops.count - 1)
                        )
                    }
                    .buttonStyle(PressableRowStyle())
                    .accessibilityLabel("\(stop.isDetour ? "Optional detour" : "Stop") \(stop.number), \(stop.title)")
                    .accessibilityValue(progress.isVisited(stop.id) ? "Visited" : "Not visited")

                    if index < content.tour.stops.count - 1 {
                        divider
                    }
                }
            }
            .plate()
            .padding(.horizontal, 24)
        }
        // Tight enough that the heading and the first row or two are
        // already on screen, so the scroll is obvious.
        .padding(.top, 24)
    }

    // MARK: - Info rows

    /// The three rows in one plate, directly under Start, sized so
    /// the top of the stops strip still peeks into the first screen.
    private var infoRows: some View {
        VStack(spacing: 0) {
            infoRow("Why this walk", glyph: "text.alignleft", identifier: "home-essay-more") {
                infoSheet = .essay
            }
            divider
            infoRow("The map and the route", glyph: "map", identifier: "home-map-row") {
                mapOpen = true
            }
            divider
            infoRow("The tools of segregation", glyph: "square.stack") {
                infoSheet = .plates
            }
        }
        .plate()
        .padding(.horizontal, 24)
        .padding(.top, 22)
    }

    private var divider: some View {
        Rectangle().fill(RF.border.opacity(0.8)).frame(height: 1)
    }

    private func infoRow(
        _ title: String,
        glyph: String,
        identifier: String? = nil,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            HStack(spacing: 12) {
                // A glyph so the row reads as a control, and so the
                // map row announces that it opens something else.
                Image(systemName: glyph)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(RF.rust)
                    .frame(width: 18)
                Text(title)
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.85))
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(RF.warmGrayDark)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            // Without an explicit content shape, the transparent gap
            // in the middle of the row is not tappable at all.
            .contentShape(Rectangle())
        }
        .buttonStyle(PressableRowStyle())
        .accessibilityIdentifier(identifier ?? "row-\(title)")
    }
}

/// One stop as a full-width row: thumbnail, number, title, how long
/// its narration runs, and a checkmark once it has been read.
private struct StopRow: View {
    let stop: WalkStop
    let visited: Bool
    /// The stop the Resume button would open, marked so "where am I"
    /// is answered without reading a word.
    let isResume: Bool

    var body: some View {
        HStack(spacing: 12) {
            Rectangle()
                .fill(isResume ? RF.rust : Color.clear)
                .frame(width: 3)

            MediaImage(
                sitePath: ContentStore.thumbPath(for: (stop.nowImage ?? stop.images.first)?.src ?? ""),
                contentMode: .fill
            )
            .frame(width: 52, height: 52)
            .clipped()
            .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))

            Text("\(stop.number)")
                .font(RF.didone(19, weight: 600))
                .foregroundStyle(visited ? RF.forest : RF.rust)
                .frame(minWidth: 20, alignment: .trailing)

            VStack(alignment: .leading, spacing: 2) {
                Text(stop.title)
                    .font(RF.body(15, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.85))
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(WalkFormat.clock(seconds: stop.audioSeconds))
                        .font(RF.body(13))
                        .foregroundStyle(RF.warmGrayDark)
                    if stop.isDetour {
                        Text("optional detour")
                            .font(RF.display(12, weight: 400, italic: true))
                            .foregroundStyle(RF.warmGrayDark)
                    }
                }
            }

            Spacer(minLength: 4)

            if visited {
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(RF.forest)
            }
        }
        .padding(.trailing, 14)
        .padding(.vertical, 8)
        .frame(minHeight: 64)
        .contentShape(Rectangle())
    }
}
