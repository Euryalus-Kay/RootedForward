import SwiftUI

// ------------------------------------------------------------------
// The engraved tour map, drawn natively from the same TIGER-derived
// geometry the site uses (already in viewBox units). City-agnostic:
// the labels and grounds arrive on the payload. Park and campus
// grounds, water with hatching, three weights of streets, the rail
// line with cross ties, street names set along their streets, the
// dotted rust route, named photograph-medallion stop markers that
// grow under your finger, a quarter-mile scale bar, corner trim
// marks, and a compass rose. Mirrors WalkMap.tsx on the site.
// ------------------------------------------------------------------

struct WalkMapCanvas: View {
    let geometry: WalkGeometry
    let projection: WalkProjection
    let stops: [WalkStop]
    let route: [[Double]]
    /// The survey plate for this walk, cropped to the geometry frame.
    var baseMap: UIImage? = nil
    /// This walk's labels, park outlines and legend, off the payload.
    /// Nil only for a payload predating the second city, which can
    /// only be Hyde Park, so the built-in values below stand in.
    var mapConfig: WalkMapConfig? = nil
    /// Dashed spurs out to the optional detour stops.
    var detourRoutes: [[[Double]]]? = nil
    /// Region of the plate to show, in projected viewBox units. Nil
    /// shows the whole plate. The map sheet crops to the main route
    /// so the walk reads larger; the explorer passes nil.
    var cropRect: CGRect? = nil
    let currentIndex: Int
    let visited: Set<String>
    let thumbs: [String: UIImage]
    let userPoint: CGPoint?
    /// The stop whose card is open, drawn raised the way the site's
    /// markers grow under a cursor.
    var selectedIndex: Int? = nil
    let onTapStop: (Int) -> Void

    private struct PlaceLabel {
        let text: String
        let lat: Double
        let lng: Double
        let size: CGFloat
        var rotate: Double = 0
    }

    // Committed site labels (WalkMap.tsx PLACE_LABELS)
    private static let fallbackPlaceLabels: [PlaceLabel] = [
        .init(text: "Lake Michigan", lat: 41.797, lng: -87.5755, size: 12),
        .init(text: "Hyde Park", lat: 41.7973, lng: -87.5975, size: 13),
        .init(text: "Midway Plaisance", lat: 41.78635, lng: -87.6005, size: 10),
        .init(text: "Jackson Park", lat: 41.7867, lng: -87.5805, size: 11),
        .init(text: "Woodlawn", lat: 41.7828, lng: -87.5955, size: 10),
        .init(text: "Washington Park", lat: 41.7943, lng: -87.6094, size: 9),
        .init(text: "University of Chicago", lat: 41.79, lng: -87.5997, size: 9),
        // Nichols Park stays unlabeled here; at phone scale its name
        // collides with the Hyde Park label and the green reads alone.
    ]

    // Street names in fine italic along their streets (WalkMap.tsx)
    private static let fallbackStreetLabels: [PlaceLabel] = [
        .init(text: "E Hyde Park Blvd", lat: 41.8026, lng: -87.5948, size: 8),
        .init(text: "E 53rd St", lat: 41.8001, lng: -87.591, size: 9),
        .init(text: "E 55th St", lat: 41.7957, lng: -87.5993, size: 9),
        .init(text: "E 57th St", lat: 41.7921, lng: -87.5911, size: 9),
        .init(text: "E 60th St", lat: 41.7846, lng: -87.599, size: 8),
        .init(text: "E 61st St", lat: 41.78415, lng: -87.6091, size: 8),
        .init(text: "E 63rd St", lat: 41.78055, lng: -87.5989, size: 8),
        .init(text: "Lake Park Ave", lat: 41.7967, lng: -87.58722, size: 9, rotate: -87),
        .init(text: "Woodlawn Ave", lat: 41.7938, lng: -87.5968, size: 9, rotate: -90),
        .init(text: "Ellis Ave", lat: 41.7958, lng: -87.6015, size: 8, rotate: -90),
        .init(text: "University Ave", lat: 41.7942, lng: -87.5986, size: 8, rotate: -90),
        .init(text: "Kimbark Ave", lat: 41.7987, lng: -87.5953, size: 8, rotate: -90),
        .init(text: "Harper Ave", lat: 41.7972, lng: -87.5889, size: 8, rotate: -90),
        .init(text: "Cottage Grove Ave", lat: 41.7935, lng: -87.6069, size: 8, rotate: -90),
        .init(text: "Stony Island Ave", lat: 41.7852, lng: -87.5873, size: 8, rotate: -90),
    ]

    // Soft green ground for the parks; the lake polygon paints over
    // the eastern overhang (WalkMap.tsx PARK_AREAS)
    private static let fallbackParkAreas: [[[Double]]] = [
        [[41.7936, -87.587], [41.7936, -87.566], [41.7737, -87.556], [41.7737, -87.587]],
        [[41.7872, -87.5868], [41.7872, -87.613], [41.7854, -87.613], [41.7854, -87.5868]],
        [[41.8045, -87.6063], [41.8045, -87.618], [41.7815, -87.618], [41.7815, -87.6063]],
        [[41.7994, -87.5948], [41.7994, -87.5935], [41.7953, -87.5935], [41.7953, -87.5948]],
        [[41.8032, -87.5827], [41.8032, -87.579], [41.7994, -87.579], [41.7994, -87.5827]],
    ]

    // The university's main quadrangles, tinted brass like printed
    // maps mark institutions (WalkMap.tsx CAMPUS_AREAS)
    private static let fallbackCampusAreas: [[[Double]]] = [
        [[41.7921, -87.6014], [41.7921, -87.5977], [41.7885, -87.5977], [41.7885, -87.6014]]
    ]

    // Where each stop's name sits relative to its marker; tuned for
    // phone scale, where the 53rd Street cluster runs tight
    /// Names and grounds for the walk in hand, falling back to the
    /// Hyde Park tables above when an older payload carries none.
    private var placeLabels: [PlaceLabel] {
        guard let m = mapConfig else { return Self.fallbackPlaceLabels }
        return m.placeLabels.map {
            PlaceLabel(text: $0.text, lat: $0.lat, lng: $0.lng, size: CGFloat($0.size))
        }
    }

    private var streetLabels: [PlaceLabel] {
        guard let m = mapConfig else { return Self.fallbackStreetLabels }
        return m.streetLabels.map {
            PlaceLabel(text: $0.text, lat: $0.lat, lng: $0.lng,
                       size: CGFloat($0.size), rotate: $0.rotate)
        }
    }

    private var parkAreas: [[[Double]]] { mapConfig?.parkAreas ?? Self.fallbackParkAreas }
    private var campusAreas: [[[Double]]] { mapConfig?.campusAreas ?? Self.fallbackCampusAreas }
    private var areaName: String { mapConfig?.areaName ?? "Hyde Park" }

    private static let fallbackStopLabelSide: [String: String] = [
        "cornells-stone": "above",
        "lake-park-tracks": "below",
        "robie-house": "right",
        "harper-court": "left",
        "obama-center": "right",
    ]

    // A second label row for the dense cluster, the way printed maps
    // stagger names that share a street
    private static let stopLabelExtraY: [String: CGFloat] = [
        "lake-park-tracks": 11
    ]

    /// The visible region in projected units.
    private var focus: CGRect {
        cropRect ?? CGRect(x: 0, y: 0, width: geometry.viewBox.w, height: geometry.viewBox.h)
    }

    /// Projected-unit point to on-screen point for the current crop.
    private func screen(_ p: CGPoint, _ scale: CGFloat) -> CGPoint {
        CGPoint(x: (p.x - focus.minX) * scale, y: (p.y - focus.minY) * scale)
    }

    /// How far in the crop is compared with the whole plate. Fine
    /// detail earns its ink only once someone has zoomed for it.
    private var zoomFactor: CGFloat {
        geometry.viewBox.w / max(focus.width, 1)
    }

    /// The whole-route view already sits around 1.55, so anything
    /// gated on detail has to clear that before it counts as zoomed.
    private var isZoomedIn: Bool { zoomFactor > 2.2 }

    /// Where every marker is drawn, after nudging apart any that
    /// would otherwise sit on top of each other. Stop 3 and stop 12
    /// land 15pt apart at the default framing while the medallions
    /// are 28pt across, so without this the later one swallows both
    /// the earlier one and every tap meant for it.
    private func placements(scale: CGFloat) -> [CGPoint] {
        let minGap: CGFloat = 34
        var placed: [CGPoint] = []
        var result: [CGPoint] = []
        for stop in stops {
            let truePoint = screen(projection.point(lat: stop.lat, lng: stop.lng), scale)
            var point = truePoint
            var ring: CGFloat = 1
            while placed.contains(where: { hypot($0.x - point.x, $0.y - point.y) < minGap }), ring <= 3 {
                // Walk outward in eight directions, the way a printed
                // map staggers names that share a corner.
                var best = point
                var bestClearance: CGFloat = -1
                for step in 0..<8 {
                    let angle = CGFloat(step) * .pi / 4
                    let candidate = CGPoint(
                        x: truePoint.x + cos(angle) * minGap * ring,
                        y: truePoint.y + sin(angle) * minGap * ring
                    )
                    let clearance = placed.map { hypot($0.x - candidate.x, $0.y - candidate.y) }.min() ?? .infinity
                    if clearance > bestClearance {
                        bestClearance = clearance
                        best = candidate
                    }
                }
                point = best
                if bestClearance >= minGap { break }
                ring += 1
            }
            placed.append(point)
            result.append(point)
        }
        return result
    }

    var body: some View {
        GeometryReader { geo in
            let scale = geo.size.width / focus.width
            let spots = placements(scale: scale)
            ZStack(alignment: .topLeading) {
                Canvas { context, size in
                    draw(in: &context, size: size, scale: scale, spots: spots)
                }
                .accessibilityLabel("Map of \(areaName) with the walking route drawn between the stops")
                .accessibilityAddTraits(.isImage)

                // Live markers over the drawing: each one is a real
                // view, so it can grow under a held finger. Markers
                // outside the cropped view stay off the plate.
                ForEach(Array(stops.enumerated()), id: \.element.id) { i, stop in
                    let p = spots[i]
                    if p.x > -40, p.x < geo.size.width + 40,
                       p.y > -40, p.y < geo.size.height + 40 {
                        StopMarker(
                            stop: stop,
                            active: i == currentIndex,
                            visited: visited.contains(stop.id),
                            raised: i == selectedIndex,
                            thumb: thumbs[stop.id]
                        ) {
                            onTapStop(i)
                        }
                        // Everything but the stop you are on steps
                        // back, so the current one wins instantly.
                        .opacity(i == currentIndex || i == selectedIndex ? 1 : 0.78)
                        .position(x: p.x, y: p.y)
                        .zIndex(i == selectedIndex ? 3 : i == currentIndex ? 2 : 1)
                    }
                }
            }
        }
        .aspectRatio(focus.width / focus.height, contentMode: .fit)
        .clipped()
    }

    // MARK: - Drawing

    private func draw(in context: inout GraphicsContext, size: CGSize, scale: CGFloat, spots: [CGPoint]) {
        var map = context
        map.scaleBy(x: scale, y: scale)
        map.translateBy(x: -focus.minX, y: -focus.minY)

        // Paper
        map.fill(
            Path(CGRect(x: 0, y: 0, width: geometry.viewBox.w, height: geometry.viewBox.h)),
            with: .color(RF.cream)
        )
        // The survey plate under the drawing: period building
        // fabric and shoreline engraving, flattened onto cream and
        // aligned to the same frame as the projection.
        if let baseMap {
            map.draw(
                Image(uiImage: baseMap),
                in: CGRect(x: 0, y: 0, width: geometry.viewBox.w, height: geometry.viewBox.h)
            )
        }

        drawGrounds(in: &map)
        drawWater(in: &map)
        drawRoads(in: &map)
        drawRails(in: &map)

        // Dashed spurs out to the optional detour stops, under the
        // main route line
        for spur in detourRoutes ?? [] {
            let spurPath = path(from: spur.map { projection.point(lat: $0[0], lng: $0[1]) })
            map.stroke(
                spurPath,
                with: .color(RF.cream),
                style: StrokeStyle(lineWidth: 6 / scale, lineCap: .round, lineJoin: .round)
            )
            // Green, not the route's rust and not the rails' gray, so
            // a detour reads as a choice rather than a wrong turn.
            map.stroke(
                spurPath,
                with: .color(RF.forest.opacity(0.9)),
                style: StrokeStyle(
                    lineWidth: 2.2 / scale,
                    lineCap: .round, lineJoin: .round,
                    dash: [7 / scale, 5 / scale]
                )
            )
        }

        // Route (point-space widths for crisp dots)
        let routePath = path(from: route.map { projection.point(lat: $0[0], lng: $0[1]) })
        map.stroke(
            routePath,
            with: .color(RF.cream),
            style: StrokeStyle(lineWidth: 7 / scale, lineCap: .round, lineJoin: .round)
        )
        map.stroke(
            routePath,
            with: .color(RF.rust),
            style: StrokeStyle(
                lineWidth: 3.4 / scale,
                lineCap: .round, lineJoin: .round,
                dash: [0.1 / scale, 8 / scale]
            )
        )

        // The leg you are about to walk, drawn solid over the dotted
        // line, so the map answers "which way now" and not only
        // "where are the stops".
        drawCurrentLeg(in: &map, scale: scale)

        drawLeaderLines(in: &context, scale: scale, spots: spots)
        if isZoomedIn {
            // Street names are the finest type on the plate. They earn
            // their space only once someone has zoomed in for them.
            drawStreetLabels(in: &context, scale: scale)
        }
        drawPlaceLabels(in: &context, scale: scale)
        drawStopLabels(in: &context, scale: scale, spots: spots)
        drawUserDot(in: &context, scale: scale)
        drawScaleBar(in: &context, scale: scale)
        drawCompass(in: &context, size: size)
        drawCornerTrim(in: &context, size: size)
    }

    /// The index of the route waypoint nearest a stop, so the route
    /// polyline can be sliced into the walk's actual legs.
    private func routeIndex(nearest stop: WalkStop) -> Int? {
        let target = projection.point(lat: stop.lat, lng: stop.lng)
        var best: (Int, CGFloat)?
        for (i, pair) in route.enumerated() {
            let p = projection.point(lat: pair[0], lng: pair[1])
            let d = hypot(p.x - target.x, p.y - target.y)
            if best == nil || d < best!.1 { best = (i, d) }
        }
        return best?.0
    }

    /// Solid rust over the dotted route for the leg from the current
    /// stop to the next one, with arrowheads showing which way.
    private func drawCurrentLeg(in map: inout GraphicsContext, scale: CGFloat) {
        guard stops.indices.contains(currentIndex) else { return }
        let next = currentIndex + 1
        guard stops.indices.contains(next), !stops[next].isDetour, !stops[currentIndex].isDetour else { return }
        guard let a = routeIndex(nearest: stops[currentIndex]),
              let b = routeIndex(nearest: stops[next]), a != b else { return }
        let lo = min(a, b), hi = max(a, b)
        let points = route[lo...hi].map { projection.point(lat: $0[0], lng: $0[1]) }
        let forward = b > a ? points : points.reversed().map { $0 }
        guard forward.count > 1 else { return }
        map.stroke(
            path(from: forward),
            with: .color(RF.rust),
            style: StrokeStyle(lineWidth: 4.5 / scale, lineCap: .round, lineJoin: .round)
        )
        // Two or three engraved arrowheads along the leg
        let arrowCount = forward.count > 6 ? 3 : 2
        for k in 1...arrowCount {
            let t = CGFloat(k) / CGFloat(arrowCount + 1)
            let idx = max(1, min(forward.count - 1, Int(t * CGFloat(forward.count - 1))))
            let from = forward[idx - 1], to = forward[idx]
            let angle = atan2(to.y - from.y, to.x - from.x)
            let tip = CGPoint(x: (from.x + to.x) / 2, y: (from.y + to.y) / 2)
            let wing = 7 / scale
            var head = Path()
            head.move(to: tip)
            head.addLine(to: CGPoint(
                x: tip.x - cos(angle - .pi / 6) * wing,
                y: tip.y - sin(angle - .pi / 6) * wing
            ))
            head.move(to: tip)
            head.addLine(to: CGPoint(
                x: tip.x - cos(angle + .pi / 6) * wing,
                y: tip.y - sin(angle + .pi / 6) * wing
            ))
            map.stroke(
                head,
                with: .color(RF.cream),
                style: StrokeStyle(lineWidth: 2.4 / scale, lineCap: .round)
            )
        }
    }

    /// A hairline from a nudged medallion back to the spot it really
    /// marks, the convention a printed map uses for a crowded corner.
    private func drawLeaderLines(in context: inout GraphicsContext, scale: CGFloat, spots: [CGPoint]) {
        for (i, stop) in stops.enumerated() {
            let truePoint = screen(projection.point(lat: stop.lat, lng: stop.lng), scale)
            let drawn = spots[i]
            let shift = hypot(drawn.x - truePoint.x, drawn.y - truePoint.y)
            guard shift > 2 else { continue }
            var leader = Path()
            leader.move(to: truePoint)
            leader.addLine(to: drawn)
            context.stroke(leader, with: .color(RF.ink.opacity(0.35)), lineWidth: 1)
            context.fill(
                Path(ellipseIn: CGRect(x: truePoint.x - 2, y: truePoint.y - 2, width: 4, height: 4)),
                with: .color(RF.ink.opacity(0.5))
            )
        }
    }

    private func path(from points: [CGPoint]) -> Path {
        var p = Path()
        guard let first = points.first else { return p }
        p.move(to: first)
        for point in points.dropFirst() {
            p.addLine(to: point)
        }
        return p
    }

    private func path(fromRing ring: [[Double]]) -> Path {
        var p = path(from: ring.map { CGPoint(x: $0[0], y: $0[1]) })
        p.closeSubpath()
        return p
    }

    private func projectedRing(_ ring: [[Double]]) -> Path {
        var p = path(from: ring.map { projection.point(lat: $0[0], lng: $0[1]) })
        p.closeSubpath()
        return p
    }

    /// Park and campus grounds under everything else.
    private func drawGrounds(in map: inout GraphicsContext) {
        for ring in parkAreas {
            map.fill(projectedRing(ring), with: .color(RF.forest.opacity(0.07)))
        }
        for ring in campusAreas {
            let p = projectedRing(ring)
            map.fill(p, with: .color(RF.mapBrass.opacity(0.07)))
            map.stroke(p, with: .color(RF.mapBrass.opacity(0.25)), lineWidth: 1)
        }
    }

    private func drawWater(in map: inout GraphicsContext) {
        for body in geometry.water {
            let ring = path(fromRing: body.ring)
            map.fill(ring, with: .color(RF.mapWater.opacity(0.14)))
            // Hatch lines clipped to the water body
            map.drawLayer { layer in
                layer.clip(to: ring)
                let bounds = ring.boundingRect
                var y = bounds.minY
                while y < bounds.maxY {
                    var line = Path()
                    line.move(to: CGPoint(x: bounds.minX, y: y))
                    line.addLine(to: CGPoint(x: bounds.maxX, y: y))
                    layer.stroke(line, with: .color(RF.mapWater.opacity(0.4)), lineWidth: 0.9)
                    y += 7
                }
            }
            map.stroke(ring, with: .color(RF.mapWater.opacity(0.8)), lineWidth: 1.6)
        }
    }

    private func drawRoads(in map: inout GraphicsContext) {
        // Alleys drop to a whisper now that the survey plate carries
        // the block fabric underneath
        for alley in geometry.roads.alleys {
            map.stroke(
                path(from: alley.map { CGPoint(x: $0[0], y: $0[1]) }),
                with: .color(RF.warmGrayLight.opacity(0.16)),
                lineWidth: 0.6
            )
        }
        for local in geometry.roads.locals {
            map.stroke(
                path(from: local.map { CGPoint(x: $0[0], y: $0[1]) }),
                with: .color(RF.warmGrayLight.opacity(0.6)),
                lineWidth: 1.3
            )
        }
        for arterial in geometry.roads.arterials {
            map.stroke(
                path(from: arterial.map { CGPoint(x: $0[0], y: $0[1]) }),
                with: .color(RF.warmGray.opacity(0.75)),
                lineWidth: 2.6
            )
        }
    }

    private func drawRails(in map: inout GraphicsContext) {
        for rail in geometry.rails {
            let railPath = path(from: rail.map { CGPoint(x: $0[0], y: $0[1]) })
            map.stroke(railPath, with: .color(RF.mapRail.opacity(0.8)), lineWidth: 1.5)
            map.stroke(
                railPath,
                with: .color(RF.mapRail.opacity(0.8)),
                style: StrokeStyle(lineWidth: 7, dash: [1.2, 12])
            )
        }
    }

    /// Draws text with a cream halo so route dots and street lines
    /// never cut through a word, the canvas version of the site's
    /// paint-order stroke.
    private func drawHaloed(
        _ context: inout GraphicsContext,
        text: Text,
        halo: Text,
        at point: CGPoint,
        anchor: UnitPoint = .center
    ) {
        let haloResolved = context.resolve(halo)
        for dx in [-1.2, 0, 1.2] {
            for dy in [-1.2, 0, 1.2] where dx != 0 || dy != 0 {
                context.draw(haloResolved, at: CGPoint(x: point.x + dx, y: point.y + dy), anchor: anchor)
            }
        }
        context.draw(context.resolve(text), at: point, anchor: anchor)
    }

    private func drawStreetLabels(in context: inout GraphicsContext, scale: CGFloat) {
        for label in streetLabels {
            let p = screen(projection.point(lat: label.lat, lng: label.lng), scale)
            var rotated = context
            rotated.translateBy(x: p.x, y: p.y)
            rotated.rotate(by: .degrees(label.rotate))
            drawHaloed(
                &rotated,
                text: Text(label.text)
                    .font(RF.display(label.size, weight: 400, italic: true))
                    .foregroundColor(RF.warmGrayDark),
                halo: Text(label.text)
                    .font(RF.display(label.size, weight: 400, italic: true))
                    .foregroundColor(RF.cream),
                at: .zero
            )
        }
    }

    private func drawPlaceLabels(in context: inout GraphicsContext, scale: CGFloat) {
        let canvasWidth = focus.width * scale
        let canvasHeight = focus.height * scale
        for label in placeLabels {
            let p = screen(projection.point(lat: label.lat, lng: label.lng), scale)
            // Labels for ground outside the cropped view stay off it.
            // Clamping without this test dragged "Lake Michigan" in
            // from off the east edge and printed it over dry blocks.
            if p.y < -10 || p.y > canvasHeight + 10 { continue }
            if p.x < -20 || p.x > canvasWidth + 20 { continue }
            let text = Text(label.text)
                .font(RF.display(label.size, weight: 400, italic: true))
                .foregroundColor(RF.warmGrayDark)
            let resolved = context.resolve(text)
            let measured = resolved.measure(in: CGSize(width: 400, height: 60))
            // Keep the label fully inside the map frame
            let x = min(max(p.x, measured.width / 2 + 4), canvasWidth - measured.width / 2 - 4)
            drawHaloed(
                &context,
                text: text,
                halo: Text(label.text)
                    .font(RF.display(label.size, weight: 400, italic: true))
                    .foregroundColor(RF.cream),
                at: CGPoint(x: x, y: p.y)
            )
        }
    }

    /// Every stop's name printed beside its marker, like a real map
    /// names its landmarks. Markers draw above as live views. A side
    /// label that would run off the plate flips to the other side.
    private func drawStopLabels(in context: inout GraphicsContext, scale: CGFloat, spots: [CGPoint]) {
        let canvasWidth = focus.width * scale
        let canvasHeight = focus.height * scale
        // Thirteen names in one view of the whole route is a thicket
        // nobody can read. Pulled back, only the stop you are on is
        // named and the numbered medallions carry the rest.
        let namesEarned = isZoomedIn
        for (i, stop) in stops.enumerated() {
            if !namesEarned && i != currentIndex { continue }
            let center = spots[i]
            // A name whose marker is off the plate has nowhere to sit
            // without being sliced by the frame, so it stays off.
            if center.x < 6 || center.x > canvasWidth - 6 || center.y < 6 || center.y > canvasHeight - 6 { continue }
            let r: CGFloat = i == currentIndex ? 17 : 14
            // Big enough to read at arm's length in daylight, which
            // 9.5pt on a moving sidewalk was not.
            let text = Text(stop.mapLabel)
                .font(RF.body(11, weight: 600))
                .foregroundColor(i == currentIndex ? RF.rustDark : RF.inkLight)
            let width = context.resolve(text).measure(in: CGSize(width: 300, height: 30)).width

            var side = (mapConfig?.stopLabelSide ?? Self.fallbackStopLabelSide)[stop.id] ?? "below"
            if side == "right", center.x + r + 7 + width > canvasWidth - 4 {
                side = "left"
            } else if side == "left", center.x - r - 7 - width < 4 {
                side = "right"
            }
            let anchor: UnitPoint = side == "left" ? .trailing : side == "right" ? .leading : .center
            var point = CGPoint(
                x: side == "left" ? center.x - r - 7 : side == "right" ? center.x + r + 7 : center.x,
                y: side == "below" ? center.y + r + 10 : side == "above" ? center.y - r - 10 : center.y
            )
            point.y += Self.stopLabelExtraY[stop.id] ?? 0
            // A side label that still runs past the frame is dropped
            // rather than printed half off the plate.
            if side == "left", point.x - width < 4 { continue }
            if side == "right", point.x + width > canvasWidth - 4 { continue }
            if side == "below" || side == "above" {
                // Centered labels clamp inside the frame too
                point.x = min(max(point.x, width / 2 + 4), canvasWidth - width / 2 - 4)
            }
            drawHaloed(
                &context,
                text: text,
                halo: Text(stop.mapLabel)
                    .font(RF.body(11, weight: 600))
                    .foregroundColor(RF.cream),
                at: point,
                anchor: anchor
            )
        }
    }

    private func drawUserDot(in context: inout GraphicsContext, scale: CGFloat) {
        guard let userPoint else { return }
        let center = screen(userPoint, scale)
        let halo = CGRect(x: center.x - 14, y: center.y - 14, width: 28, height: 28)
        context.fill(Path(ellipseIn: halo), with: .color(RF.mapWater.opacity(0.25)))
        let dot = CGRect(x: center.x - 6.5, y: center.y - 6.5, width: 13, height: 13)
        context.fill(Path(ellipseIn: dot), with: .color(RF.mapWater))
        context.stroke(Path(ellipseIn: dot), with: .color(.white), lineWidth: 2.5)
    }

    private func drawScaleBar(in context: inout GraphicsContext, scale: CGFloat) {
        let quarterMileUnits = 402.336 / projection.metersPerUnit
        let width = quarterMileUnits * scale
        let origin = CGPoint(x: 18, y: focus.height * scale - 20)

        var filled = Path()
        filled.addRect(CGRect(x: origin.x, y: origin.y - 2, width: width / 2, height: 4))
        context.fill(filled, with: .color(RF.ink.opacity(0.55)))
        var hollow = Path()
        hollow.addRect(CGRect(x: origin.x + width / 2, y: origin.y - 2, width: width / 2, height: 4))
        context.stroke(hollow, with: .color(RF.ink.opacity(0.55)), lineWidth: 1.2)
        for x in [origin.x, origin.x + width] {
            var tick = Path()
            tick.move(to: CGPoint(x: x, y: origin.y - 6))
            tick.addLine(to: CGPoint(x: x, y: origin.y + 6))
            context.stroke(tick, with: .color(RF.ink.opacity(0.55)), lineWidth: 1.6)
        }
        context.draw(
            context.resolve(
                Text("1/4 mile")
                    .font(RF.display(10, weight: 400, italic: true))
                    .foregroundColor(RF.ink.opacity(0.6))
            ),
            at: CGPoint(x: origin.x + width / 2, y: origin.y - 12),
            anchor: .center
        )
    }

    /// The eight-point rose from the site map, not just a needle.
    private func drawCompass(in context: inout GraphicsContext, size: CGSize) {
        let center = CGPoint(x: size.width - 30, y: 36)
        let ring = CGRect(x: center.x - 13, y: center.y - 13, width: 26, height: 26)
        context.stroke(Path(ellipseIn: ring), with: .color(RF.ink.opacity(0.35)), lineWidth: 1)

        var star = Path()
        let long: CGFloat = 11.5
        let short: CGFloat = 2.3
        for i in 0..<8 {
            let angle = CGFloat(i) * .pi / 4 - .pi / 2
            let radius = i % 2 == 0 ? long : short
            let point = CGPoint(
                x: center.x + cos(angle) * radius,
                y: center.y + sin(angle) * radius
            )
            if i == 0 {
                star.move(to: point)
            } else {
                star.addLine(to: point)
            }
        }
        star.closeSubpath()
        context.fill(star, with: .color(RF.cream))
        context.stroke(star, with: .color(RF.ink.opacity(0.55)), lineWidth: 1.2)

        // North quarter in rust
        var north = Path()
        north.move(to: CGPoint(x: center.x, y: center.y - long))
        north.addLine(to: CGPoint(x: center.x + short, y: center.y - short))
        north.addLine(to: CGPoint(x: center.x, y: center.y))
        north.closeSubpath()
        context.fill(north, with: .color(RF.rust.opacity(0.85)))
        context.fill(
            Path(ellipseIn: CGRect(x: center.x - 1.5, y: center.y - 1.5, width: 3, height: 3)),
            with: .color(RF.ink.opacity(0.6))
        )
        context.draw(
            context.resolve(
                Text("N")
                    .font(RF.display(9, weight: 400))
                    .foregroundColor(RF.ink.opacity(0.6))
            ),
            at: CGPoint(x: center.x, y: center.y - 19),
            anchor: .center
        )
    }

    /// Plate corner trim marks, the printed map's registration ticks.
    private func drawCornerTrim(in context: inout GraphicsContext, size: CGSize) {
        let inset: CGFloat = 8
        let arm: CGFloat = 9
        let corners: [(CGPoint, CGFloat, CGFloat)] = [
            (CGPoint(x: inset, y: inset), 1, 1),
            (CGPoint(x: size.width - inset, y: inset), -1, 1),
            (CGPoint(x: inset, y: size.height - inset), 1, -1),
            (CGPoint(x: size.width - inset, y: size.height - inset), -1, -1),
        ]
        for (corner, sx, sy) in corners {
            var trim = Path()
            trim.move(to: CGPoint(x: corner.x, y: corner.y + sy * arm))
            trim.addLine(to: corner)
            trim.addLine(to: CGPoint(x: corner.x + sx * arm, y: corner.y))
            context.stroke(trim, with: .color(RF.ink.opacity(0.3)), lineWidth: 1.4)
        }
    }
}

// MARK: - Live markers

/// A stop's photograph in its round engraved frame, grown gently
/// while a finger holds it. Tapping opens the stop.
private struct StopMarker: View {
    let stop: WalkStop
    let active: Bool
    let visited: Bool
    var raised = false
    let thumb: UIImage?
    let onTap: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let r: CGFloat = active ? 17 : 14
        Button(action: onTap) {
            ZStack(alignment: .bottomTrailing) {
                ZStack {
                    Circle().fill(RF.cream)
                    if let thumb {
                        Image(uiImage: thumb)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 2 * r - 3, height: 2 * r - 3)
                            .clipShape(Circle())
                    }
                    // Detour stops wear a dashed frame, matching
                    // their dashed spur on the plate
                    Circle().strokeBorder(
                        active ? RF.rust : RF.forest,
                        style: StrokeStyle(
                            lineWidth: active ? 3 : 2,
                            dash: stop.isDetour && !active ? [3.5, 2.5] : []
                        )
                    )
                    Circle()
                        .inset(by: 2.5)
                        .strokeBorder(active ? RF.cream : RF.mapBrass, lineWidth: 1)
                }
                .frame(width: 2 * r, height: 2 * r)

                // Number badge stamped over the frame's lower corner
                Text("\(stop.number)")
                    .font(RF.body(9.5, weight: 700))
                    .foregroundStyle(active || visited ? RF.cream : RF.forest)
                    .frame(width: 15, height: 15)
                    .background(
                        Circle().fill(active ? RF.rust : visited ? RF.forest : RF.cream)
                    )
                    .overlay(
                        Circle().strokeBorder(active ? RF.cream : RF.forest, lineWidth: 1.2)
                    )
                    .offset(x: 3, y: 3)
            }
            // A finger pad larger than the medallion itself
            .padding(10)
            .contentShape(Circle())
            // The open stop's medallion lifts off the plate, which is
            // what the website's hover state does with a cursor.
            .scaleEffect(raised && !reduceMotion ? 1.3 : 1)
            .shadow(color: RF.ink.opacity(raised ? 0.3 : 0), radius: 6, x: 0, y: 3)
            .animation(RFMotion.gated(.rfZoom, reduceMotion), value: raised)
        }
        .buttonStyle(MarkerPressStyle())
        .accessibilityLabel("\(stop.isDetour ? "Optional detour" : "Stop") \(stop.number), \(stop.title)")
        .accessibilityValue(active ? "Current stop" : visited ? "Visited" : "Not visited")
        .accessibilityAddTraits(active ? .isSelected : [])
    }
}

/// Springs the medallion up while the finger is down, like the
/// site's markers growing under the cursor.
private struct MarkerPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            // 1.35 with a loose spring overshot to about 1.5x, which
            // a fingertip covers entirely anyway.
            .scaleEffect(configuration.isPressed && !reduceMotion ? 1.22 : 1)
            .shadow(
                color: RF.ink.opacity(configuration.isPressed ? 0.28 : 0),
                radius: 5, x: 0, y: 3
            )
            .animation(RFMotion.press, value: configuration.isPressed)
    }
}
