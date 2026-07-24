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
    @State private var baseMap: UIImage?
    /// The region of the plate on screen. This is the zoom state:
    /// pinching narrows the crop rather than scaling the drawing, so
    /// markers and type stay finger-sized and crowded stops actually
    /// come apart as you zoom.
    @State private var crop: CGRect?
    @State private var cropAtGestureStart: CGRect?
    @State private var locating = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 0) {
            header
            // The map is held out of the scroll view so a drag on the
            // plate pans the map instead of fighting the page.
            mapPlate
                .padding(.horizontal, 16)
                .padding(.top, 10)
            nextLeg
                .padding(.horizontal, 16)
                .padding(.top, 10)
            stopListScroller
        }
        .background(RF.cream)
        .task {
            if crop == nil { crop = focusCrop(around: currentIndex) }
            if baseMap == nil {
                baseMap = await content.image(for: "/media/hyde-park-walk/map-base-1929.jpg")
            }
            await loadThumbs()
        }
        .onChange(of: currentIndex) { _, newIndex in
            withAnimation(RFMotion.gated(.rfZoom, reduceMotion)) {
                crop = focusCrop(around: newIndex)
            }
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
                Text("\(content.tour.distanceMiles, specifier: "%.1f") miles, \(content.tour.stops.filter { !$0.isDetour }.count) stops")
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
                baseMap: baseMap,
                detourRoutes: content.tour.detourRoutes,
                cropRect: crop ?? widestCrop,
                currentIndex: currentIndex,
                visited: progress.visited,
                thumbs: thumbs,
                userPoint: userPoint,
                onTapStop: {
                    Haptics.tap()
                    onSelectStop($0)
                }
            )
            .frame(width: mapWidthOnScreen, height: mapHeight)
            .contentShape(Rectangle())
            .gesture(panGesture)
            .gesture(magnifyGesture)
            .onTapGesture(count: 2) { toggleZoom() }
            .overlay(alignment: .bottomTrailing) { mapControls }

            legend
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
        }
        .plate()
    }

    // MARK: - Map gestures and controls

    private var panGesture: some Gesture {
        DragGesture(minimumDistance: 6)
            .onChanged { value in
                let start = cropAtGestureStart ?? crop ?? widestCrop
                if cropAtGestureStart == nil { cropAtGestureStart = start }
                // Screen points to plate units: the canvas is one
                // crop wide, so the ratio is the crop's own width.
                let perPoint = start.width / max(mapWidthOnScreen, 1)
                crop = fit(CGRect(
                    x: start.minX - value.translation.width * perPoint,
                    y: start.minY - value.translation.height * perPoint,
                    width: start.width,
                    height: start.height
                ))
            }
            .onEnded { _ in cropAtGestureStart = nil }
    }

    private var magnifyGesture: some Gesture {
        MagnifyGesture()
            .onChanged { value in
                let start = cropAtGestureStart ?? crop ?? widestCrop
                if cropAtGestureStart == nil { cropAtGestureStart = start }
                crop = zoom(by: value.magnification, anchor: value.startAnchor, from: start)
            }
            .onEnded { _ in cropAtGestureStart = nil }
    }

    /// The plate's on-screen width, used to turn a drag in points
    /// into a move in plate units.
    private var mapWidthOnScreen: CGFloat {
        UIScreen.main.bounds.width - 32
    }

    /// A definite height for the map. Without one the surrounding
    /// stack squeezes the canvas and its aspect fit shrinks the
    /// drawing to a fraction of the plate's width. A screen whose
    /// whole job is a map should be mostly map, so this takes the
    /// room the separate full-screen explorer used to need.
    private var mapHeight: CGFloat {
        max(280, UIScreen.main.bounds.height * 0.46)
    }

    private func toggleZoom() {
        Haptics.tap()
        let current = crop ?? widestCrop
        withAnimation(RFMotion.gated(.rfZoom, reduceMotion)) {
            crop = current.width <= widestCrop.width * 0.6
                ? widestCrop
                : focusCrop(around: currentIndex)
        }
    }

    /// Find me and Whole route, on the map they act on. Whole route
    /// appears only once the map has been moved off it.
    private var mapControls: some View {
        VStack(spacing: 8) {
            if let crop, abs(crop.width - widestCrop.width) > 1 || abs(crop.minX - widestCrop.minX) > 1 {
                roundControl(
                    glyph: "minus.magnifyingglass",
                    label: "Show the whole route",
                    identifier: "map-whole-route"
                ) {
                    withAnimation(RFMotion.gated(.rfZoom, reduceMotion)) { self.crop = widestCrop }
                }
                .transition(.opacity)
            }
            roundControl(glyph: "scope", label: "Find me on the map", identifier: "map-find-me") {
                findMeTapped()
            }
        }
        .animation(RFMotion.gated(.rfAppear, reduceMotion), value: crop?.width)
        .padding(8)
    }

    private func roundControl(
        glyph: String,
        label: String,
        identifier: String,
        action: @escaping () -> Void
    ) -> some View {
        Button {
            Haptics.tap()
            action()
        } label: {
            Image(systemName: glyph)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(RF.ink.opacity(0.75))
                .frame(width: 42, height: 42)
                .background(Circle().fill(RF.paper.opacity(0.95)))
                .overlay(Circle().strokeBorder(RF.ink.opacity(0.2), lineWidth: 1))
                .frame(width: 44, height: 44)
                .contentShape(Circle())
        }
        .accessibilityLabel(label)
        .accessibilityIdentifier(identifier)
    }

    /// Actually moves the map, which is the one thing the old button
    /// named and never did.
    private func findMeTapped() {
        if location.isDenied { return }
        location.requestAndStart()
        guard let loc = location.location else {
            locating = true
            return
        }
        locating = false
        let p = content.projection.point(lat: loc.coordinate.latitude, lng: loc.coordinate.longitude)
        guard plate.insetBy(dx: -200, dy: -200).contains(p) else { return }
        let span = widestCrop.width / 4
        withAnimation(RFMotion.gated(.rfZoom, reduceMotion)) {
            crop = fit(CGRect(
                x: p.x - span / 2, y: p.y - span / (2 * aspect),
                width: span, height: span / aspect
            ))
        }
    }

    /// Only the two things the plate does not explain on its own. A
    /// circle labeled "Stop" next to a field of numbered photograph
    /// medallions was teaching nobody anything.
    private var legend: some View {
        HStack(spacing: 16) {
            HStack(spacing: 7) {
                Line()
                    .stroke(RF.rust, style: StrokeStyle(lineWidth: 3.4, lineCap: .round))
                    .frame(width: 22, height: 3)
                Text("Walk this next")
            }
            HStack(spacing: 7) {
                Line()
                    .stroke(RF.mapRail.opacity(0.85), style: StrokeStyle(lineWidth: 1.8, lineCap: .round, dash: [5, 3.5]))
                    .frame(width: 22, height: 3)
                Text("Detour")
            }
            Spacer(minLength: 0)
            Text("Pinch to zoom")
                .font(RF.display(11.5, weight: 400, italic: true))
                .foregroundStyle(RF.warmGrayDark)
        }
        .font(RF.body(13))
        .foregroundStyle(RF.ink.opacity(0.75))
    }

    // MARK: - Next leg

    /// Where to go now, in the walk's own numbers, tappable to move
    /// the tour along. The payload has carried this for every leg all
    /// along and the map never showed it.
    @ViewBuilder
    private var nextLeg: some View {
        let stops = content.tour.stops
        if stops.indices.contains(currentIndex),
           let toNext = stops[currentIndex].toNext,
           stops.indices.contains(currentIndex + 1) {
            Button {
                Haptics.tap()
                onSelectStop(currentIndex + 1)
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "arrow.turn.up.right")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(RF.rust)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Next, \(stops[currentIndex + 1].title)")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.ink.opacity(0.85))
                            .lineLimit(1)
                        Text("\(WalkFormat.distance(meters: toNext.distanceMeters)), about \(toNext.minutes) min")
                            .font(RF.body(13))
                            .foregroundStyle(RF.warmGrayDark)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(RF.warmGrayDark)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .contentShape(Rectangle())
            }
            .buttonStyle(PressableRowStyle())
            .plate()
            .accessibilityIdentifier("map-next-leg")
        }
    }

    // MARK: - Stop list

    /// Opens scrolled to the stop the walker is on, so the map and
    /// the list agree about where they are.
    private var stopListScroller: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if location.isDenied {
                        Text("Location is off for this app. Turn it on in Settings to see your dot on the map. It never leaves your phone.")
                            .font(RF.body(13))
                            .foregroundStyle(RF.warmGrayDark)
                            .fixedSize(horizontal: false, vertical: true)
                    } else if locating {
                        Text("Waiting for a location fix. Your dot appears once you are near the route.")
                            .font(RF.body(13))
                            .foregroundStyle(RF.warmGrayDark)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    stopList
                    Text("Base map from the USGS survey of 1929.")
                        .font(RF.display(11.5, weight: 400, italic: true))
                        .foregroundStyle(RF.warmGrayDark)
                }
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 36)
            }
            .onAppear {
                guard content.tour.stops.indices.contains(currentIndex) else { return }
                proxy.scrollTo(content.tour.stops[currentIndex].id, anchor: .center)
            }
        }
    }

    private var userPoint: CGPoint? {
        guard let loc = location.location else { return nil }
        let lat = loc.coordinate.latitude
        let lng = loc.coordinate.longitude
        guard content.projection.isNearFrame(lat: lat, lng: lng, padMeters: 400) else { return nil }
        return content.projection.point(lat: lat, lng: lng)
    }

    // MARK: - Crop maths

    private var plate: CGRect {
        CGRect(x: 0, y: 0, width: content.geometry.viewBox.w, height: content.geometry.viewBox.h)
    }

    /// The main walk's region of the plate, so the sheet map shows
    /// the route large. The detours sit outside it; their dashed
    /// spur exits the bottom edge, and Explore shows the whole plate.
    private var mainCrop: CGRect {
        let pts = content.tour.mainline
            .map { content.projection.point(lat: $0.lat, lng: $0.lng) }
            + content.tour.route.map { content.projection.point(lat: $0[0], lng: $0[1]) }
        guard let first = pts.first else { return plate }
        var minX = first.x, maxX = first.x, minY = first.y, maxY = first.y
        for p in pts {
            minX = min(minX, p.x); maxX = max(maxX, p.x)
            minY = min(minY, p.y); maxY = max(maxY, p.y)
        }
        let pad: CGFloat = 62
        let x0 = max(0, minX - pad - 20)
        let y0 = max(0, minY - pad)
        let x1 = min(plate.width, maxX + pad)
        let y1 = min(plate.height, maxY + pad)
        return CGRect(x: x0, y: y0, width: x1 - x0, height: y1 - y0)
    }

    /// Every crop keeps the shape of the frame it is drawn into, so
    /// zooming never changes the plate's proportions, the layout
    /// under it never jumps, and the drawing never letterboxes.
    private var aspect: CGFloat { mapWidthOnScreen / mapHeight }

    /// The whole route, the widest anyone can pull back to here.
    private var widestCrop: CGRect { fit(mainCrop) }

    /// The tightest zoom, about six times into the route framing.
    private var tightestWidth: CGFloat { widestCrop.width / 6 }

    /// Forces a rect to the display aspect and keeps it on the plate.
    private func fit(_ rect: CGRect) -> CGRect {
        var w = max(rect.width, rect.height * aspect)
        var h = w / aspect
        w = min(w, plate.width)
        h = min(h, plate.height)
        w = min(w, h * aspect)
        h = w / aspect
        let cx = rect.midX, cy = rect.midY
        var x = cx - w / 2
        var y = cy - h / 2
        x = min(max(0, x), max(0, plate.width - w))
        y = min(max(0, y), max(0, plate.height - h))
        return CGRect(x: x, y: y, width: w, height: h)
    }

    /// Opens pointed at the stop the walker is on and the one they
    /// are heading to, rather than the same whole-route view every
    /// time. Falls back to the full route on the last stop.
    private func focusCrop(around index: Int) -> CGRect {
        let stops = content.tour.stops
        guard stops.indices.contains(index) else { return widestCrop }
        var pts = [content.projection.point(lat: stops[index].lat, lng: stops[index].lng)]
        if stops.indices.contains(index + 1) {
            pts.append(content.projection.point(lat: stops[index + 1].lat, lng: stops[index + 1].lng))
        } else if stops.indices.contains(index - 1) {
            pts.append(content.projection.point(lat: stops[index - 1].lat, lng: stops[index - 1].lng))
        }
        var minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y
        for p in pts {
            minX = min(minX, p.x); maxX = max(maxX, p.x)
            minY = min(minY, p.y); maxY = max(maxY, p.y)
        }
        // Keep enough ground around the pair to stay oriented.
        let pad: CGFloat = 95
        let box = CGRect(
            x: minX - pad, y: minY - pad,
            width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2
        )
        let sized = CGRect(
            x: box.midX - max(box.width, widestCrop.width / 2.6) / 2,
            y: box.midY - max(box.width, widestCrop.width / 2.6) / (2 * aspect),
            width: max(box.width, widestCrop.width / 2.6),
            height: max(box.width, widestCrop.width / 2.6) / aspect
        )
        return fit(sized)
    }

    /// Narrows or widens the crop about a point the fingers are on,
    /// so the map grows under the pinch instead of drifting away.
    private func zoom(by factor: CGFloat, anchor: UnitPoint, from start: CGRect) -> CGRect {
        let targetWidth = min(max(start.width / factor, tightestWidth), widestCrop.width)
        let worldX = start.minX + anchor.x * start.width
        let worldY = start.minY + anchor.y * start.height
        let rect = CGRect(
            x: worldX - anchor.x * targetWidth,
            y: worldY - anchor.y * (targetWidth / aspect),
            width: targetWidth,
            height: targetWidth / aspect
        )
        return fit(rect)
    }

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

                        if stop.isDetour {
                            Text("detour")
                                .font(RF.display(12, weight: 400, italic: true))
                                .foregroundStyle(RF.warmGrayDark)
                        }

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
                .buttonStyle(PressableRowStyle())
                .id(stop.id)
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
