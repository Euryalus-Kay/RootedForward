import SwiftUI
import CoreLocation

// ------------------------------------------------------------------
// The slide-up map sheet: the engraved map in a plate frame, the
// legend, Find me on the map, and the full stop list with narration
// lengths. Tapping a stop or a marker jumps the tour there.
// ------------------------------------------------------------------

struct MapSheetView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var location: LocationService
    @Environment(\.dismiss) private var dismiss

    let currentIndex: Int
    let onSelectStop: (Int) -> Void

    @State private var thumbs: [String: UIImage] = [:]
    @State private var showFarAway = false
    @State private var explorerOpen = false

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    mapPlate
                    findMe
                    stopList
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .background(RF.cream)
        .task {
            await loadThumbs()
        }
    }

    private var header: some View {
        HStack {
            Text("Map")
                .font(RF.display(24, weight: 600))
                .foregroundStyle(RF.ink)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            Button {
                dismiss()
            } label: {
                Text("Done")
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.cream)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(RF.forest)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            .accessibilityIdentifier("map-done")
        }
        .padding(.horizontal, 18)
        .padding(.top, 22)
        .padding(.bottom, 12)
        .background(RF.cream)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    private var mapPlate: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline) {
                Text("Hyde Park")
                    .font(RF.display(20, weight: 600))
                    .foregroundStyle(RF.ink)
                    .accessibilityAddTraits(.isHeader)
                Spacer()
                Text("\(content.tour.distanceMiles, specifier: "%.1f") miles, \(content.tour.stops.count) stops")
                    .font(RF.display(14, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            WalkMapCanvas(
                geometry: content.geometry,
                projection: content.projection,
                stops: content.tour.stops,
                route: content.tour.route,
                currentIndex: currentIndex,
                visited: progress.visited,
                thumbs: thumbs,
                userPoint: userPoint,
                onTapStop: {
                    Haptics.tap()
                    onSelectStop($0)
                }
            )
            .overlay(alignment: .topLeading) {
                Button {
                    Haptics.tap()
                    explorerOpen = true
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "arrow.up.left.and.arrow.down.right")
                            .font(.system(size: 11, weight: .semibold))
                        Text("Explore")
                            .font(RF.body(13, weight: 600))
                    }
                    .foregroundStyle(RF.ink.opacity(0.75))
                    .padding(.horizontal, 11)
                    .padding(.vertical, 7)
                    .background(RF.paper.opacity(0.92))
                    .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.2), lineWidth: 1))
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .padding(10)
                // Label leads with the visible word so Voice Control
                // users can say "Tap Explore"
                .accessibilityLabel("Explore the full-screen map")
                .accessibilityIdentifier("map-expand")
            }
            .fullScreenCover(isPresented: $explorerOpen) {
                MapExplorerView(
                    currentIndex: currentIndex,
                    thumbs: thumbs
                ) { index in
                    explorerOpen = false
                    onSelectStop(index)
                }
            }

            legend
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
        }
        .plate()
    }

    private var legend: some View {
        HStack(spacing: 22) {
            HStack(spacing: 7) {
                Line(dotted: true)
                    .stroke(RF.rust, style: StrokeStyle(lineWidth: 3, lineCap: .round, dash: [0.1, 6]))
                    .frame(width: 26, height: 3)
                Text("Route")
            }
            HStack(spacing: 7) {
                Circle()
                    .strokeBorder(RF.ink, lineWidth: 1.6)
                    .frame(width: 12, height: 12)
                Text("Stop")
            }
            HStack(spacing: 7) {
                Circle()
                    .fill(RF.mapWater)
                    .frame(width: 9, height: 9)
                Text("You")
            }
            Spacer()
        }
        .font(RF.body(13.5))
        .foregroundStyle(RF.ink.opacity(0.75))
    }

    private var userPoint: CGPoint? {
        guard let loc = location.location else { return nil }
        let lat = loc.coordinate.latitude
        let lng = loc.coordinate.longitude
        guard content.projection.isNearFrame(lat: lat, lng: lng, padMeters: 400) else { return nil }
        return content.projection.point(lat: lat, lng: lng)
    }

    // MARK: - Find me

    private var findMe: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                if location.isDenied {
                    showFarAway = false
                } else {
                    location.requestAndStart()
                }
                if let loc = location.location {
                    showFarAway = !content.projection.isNearFrame(
                        lat: loc.coordinate.latitude,
                        lng: loc.coordinate.longitude
                    )
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "scope")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(RF.rust)
                    Text("Find me on the map")
                        .font(RF.body(15.5, weight: 600))
                        .foregroundStyle(RF.ink.opacity(0.85))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.white)
                .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
            }
            .accessibilityIdentifier("map-find-me")

            if location.isDenied {
                Text("Location is off for this app. Turn it on in Settings to see your dot. It never leaves your phone.")
                    .font(RF.body(13))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
            } else if showFarAway {
                Text("You are not in Hyde Park yet. Your dot appears once you are near the route.")
                    .font(RF.body(13))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Stop list

    private var stopList: some View {
        VStack(spacing: 0) {
            ForEach(Array(content.tour.stops.enumerated()), id: \.element.id) { i, stop in
                Button {
                    Haptics.tap()
                    onSelectStop(i)
                } label: {
                    HStack(spacing: 13) {
                        Text("\(stop.number)")
                            .font(RF.didone(16, weight: 600))
                            .foregroundStyle(numberColor(index: i, stop: stop))
                            .frame(width: 30, height: 30)
                            .background(
                                Circle().fill(numberFill(index: i, stop: stop))
                            )
                            .overlay(
                                Circle().strokeBorder(numberRing(index: i, stop: stop), lineWidth: 1.4)
                            )

                        Text(stop.title)
                            .font(RF.body(15.5, weight: i == currentIndex ? 700 : 500))
                            .foregroundStyle(RF.ink.opacity(0.85))
                            .lineLimit(1)

                        Spacer()

                        HStack(spacing: 4) {
                            Image(systemName: "speaker.wave.2")
                                .font(.system(size: 10))
                                .accessibilityHidden(true)
                            Text(WalkFormat.clock(seconds: stop.audioSeconds))
                        }
                        .font(RF.body(13.5))
                        .foregroundStyle(RF.warmGrayDark)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(i == currentIndex ? RF.creamDark.opacity(0.6) : Color.clear)
                    // The transparent middle of the row must still be
                    // tappable; without this, taps between the title
                    // and the duration fall through.
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("map-stop-\(stop.number)")
                .accessibilityValue(
                    i == currentIndex ? "Current stop"
                        : progress.isVisited(stop.id) ? "Visited" : "Not visited"
                )
                .accessibilityAddTraits(i == currentIndex ? .isSelected : [])

                if i < content.tour.stops.count - 1 {
                    Rectangle().fill(RF.border.opacity(0.7)).frame(height: 1)
                }
            }
        }
        .background(RF.paper)
        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
    }

    private func numberColor(index: Int, stop: WalkStop) -> Color {
        if index == currentIndex { return RF.cream }
        if progress.isVisited(stop.id) { return RF.cream }
        return RF.forest
    }

    private func numberFill(index: Int, stop: WalkStop) -> Color {
        if index == currentIndex { return RF.rust }
        if progress.isVisited(stop.id) { return RF.forest }
        return RF.cream
    }

    private func numberRing(index: Int, stop: WalkStop) -> Color {
        if index == currentIndex { return RF.rust }
        return RF.forest.opacity(0.5)
    }

    // MARK: - Thumbs

    private func loadThumbs() async {
        // Concurrent loads with a single state write, so one slow
        // network thumb never staggers the whole marker set.
        let wanted = content.tour.stops
            .filter { thumbs[$0.id] == nil }
            .compactMap { stop -> (String, String)? in
                guard let source = (stop.nowImage ?? stop.images.first)?.src else { return nil }
                return (stop.id, ContentStore.thumbPath(for: source))
            }
        guard !wanted.isEmpty else { return }
        var loaded: [String: UIImage] = [:]
        await withTaskGroup(of: (String, UIImage?).self) { group in
            for (id, path) in wanted {
                group.addTask { @MainActor in
                    (id, await content.image(for: path))
                }
            }
            for await (id, image) in group {
                if let image {
                    loaded[id] = image
                }
            }
        }
        thumbs.merge(loaded) { _, new in new }
    }
}

/// A short straight line, used in the legend.
private struct Line: Shape {
    var dotted = false
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: 0, y: rect.midY))
        p.addLine(to: CGPoint(x: rect.width, y: rect.midY))
        return p
    }
}
