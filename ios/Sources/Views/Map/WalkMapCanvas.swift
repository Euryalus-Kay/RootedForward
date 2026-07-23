import SwiftUI

// ------------------------------------------------------------------
// The engraved tour map, drawn natively from the same TIGER-derived
// geometry the site uses (already in viewBox units). Water with
// hatching, three weights of streets, the rail line with cross
// ties, the dotted rust route, photograph-medallion stop markers,
// place labels, a quarter-mile scale bar, and a compass rose.
// ------------------------------------------------------------------

struct WalkMapCanvas: View {
    let geometry: WalkGeometry
    let projection: WalkProjection
    let stops: [WalkStop]
    let route: [[Double]]
    let currentIndex: Int
    let visited: Set<String>
    let thumbs: [String: UIImage]
    let userPoint: CGPoint?
    let onTapStop: (Int) -> Void

    private struct PlaceLabel {
        let text: String
        let lat: Double
        let lng: Double
        let size: CGFloat
    }

    // Committed site labels (WalkMap.tsx PLACE_LABELS)
    private static let placeLabels: [PlaceLabel] = [
        .init(text: "Lake Michigan", lat: 41.797, lng: -87.5755, size: 12),
        .init(text: "Hyde Park", lat: 41.7973, lng: -87.5975, size: 13),
        .init(text: "Midway Plaisance", lat: 41.78635, lng: -87.6005, size: 10),
        .init(text: "Jackson Park", lat: 41.7867, lng: -87.5805, size: 11),
        .init(text: "Woodlawn", lat: 41.7828, lng: -87.5955, size: 10),
        .init(text: "Washington Park", lat: 41.7943, lng: -87.6094, size: 9),
        .init(text: "University of Chicago", lat: 41.79, lng: -87.5997, size: 9),
    ]

    var body: some View {
        GeometryReader { geo in
            let scale = geo.size.width / geometry.viewBox.w
            ZStack(alignment: .topLeading) {
                Canvas { context, size in
                    draw(in: &context, size: size, scale: scale)
                }

                // Invisible tap targets over each marker
                ForEach(Array(stops.enumerated()), id: \.element.id) { i, stop in
                    let p = projection.point(lat: stop.lat, lng: stop.lng)
                    Button {
                        onTapStop(i)
                    } label: {
                        Color.clear.frame(width: 44, height: 44)
                    }
                    .position(x: p.x * scale, y: p.y * scale)
                    .accessibilityLabel("Stop \(stop.number), \(stop.title)")
                }
            }
        }
        .aspectRatio(geometry.viewBox.w / geometry.viewBox.h, contentMode: .fit)
    }

    // MARK: - Drawing

    private func draw(in context: inout GraphicsContext, size: CGSize, scale: CGFloat) {
        var map = context
        map.scaleBy(x: scale, y: scale)

        // Paper
        map.fill(
            Path(CGRect(x: 0, y: 0, width: geometry.viewBox.w, height: geometry.viewBox.h)),
            with: .color(RF.cream)
        )

        drawWater(in: &map)
        drawRoads(in: &map)
        drawRails(in: &map)

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

        drawPlaceLabels(in: &context, scale: scale)
        drawMarkers(in: &context, scale: scale)
        drawUserDot(in: &context, scale: scale)
        drawScaleBar(in: &context, scale: scale)
        drawCompass(in: &context, size: size)
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
        for alley in geometry.roads.alleys {
            map.stroke(
                path(from: alley.map { CGPoint(x: $0[0], y: $0[1]) }),
                with: .color(RF.warmGrayLight.opacity(0.28)),
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

    private func drawPlaceLabels(in context: inout GraphicsContext, scale: CGFloat) {
        let canvasWidth = geometry.viewBox.w * scale
        for label in Self.placeLabels {
            let p = projection.point(lat: label.lat, lng: label.lng)
            let text = Text(label.text)
                .font(RF.display(label.size, weight: 400, italic: true))
                .foregroundColor(RF.warmGray)
            let resolved = context.resolve(text)
            let measured = resolved.measure(in: CGSize(width: 400, height: 60))
            // Keep the label fully inside the map frame
            let x = min(max(p.x * scale, measured.width / 2 + 4), canvasWidth - measured.width / 2 - 4)
            context.draw(resolved, at: CGPoint(x: x, y: p.y * scale), anchor: .center)
        }
    }

    private func drawMarkers(in context: inout GraphicsContext, scale: CGFloat) {
        for (i, stop) in stops.enumerated() {
            let p = projection.point(lat: stop.lat, lng: stop.lng)
            let center = CGPoint(x: p.x * scale, y: p.y * scale)
            let active = i == currentIndex
            let isVisited = visited.contains(stop.id)
            let r: CGFloat = active ? 17 : 14
            let rect = CGRect(x: center.x - r, y: center.y - r, width: 2 * r, height: 2 * r)

            // Photograph medallion
            context.fill(Path(ellipseIn: rect), with: .color(RF.cream))
            if let thumb = thumbs[stop.id] {
                context.drawLayer { layer in
                    layer.clip(to: Path(ellipseIn: rect.insetBy(dx: 1.5, dy: 1.5)))
                    let imageSize = thumb.size
                    let side = max(rect.width, rect.height)
                    let aspect = imageSize.width / max(imageSize.height, 1)
                    let drawSize = aspect > 1
                        ? CGSize(width: side * aspect, height: side)
                        : CGSize(width: side, height: side / aspect)
                    let drawRect = CGRect(
                        x: center.x - drawSize.width / 2,
                        y: center.y - drawSize.height / 2,
                        width: drawSize.width,
                        height: drawSize.height
                    )
                    layer.draw(Image(uiImage: thumb), in: drawRect)
                }
            }
            // Rings: outer forest or rust, inner brass
            context.stroke(
                Path(ellipseIn: rect),
                with: .color(active ? RF.rust : RF.forest),
                lineWidth: active ? 3 : 2
            )
            context.stroke(
                Path(ellipseIn: rect.insetBy(dx: 2.5, dy: 2.5)),
                with: .color(active ? RF.cream : RF.mapBrass),
                lineWidth: 1
            )

            // Number badge, bottom-right of the medallion
            let badgeCenter = CGPoint(x: center.x + r * 0.78, y: center.y + r * 0.78)
            let badgeR: CGFloat = 7.5
            let badgeRect = CGRect(
                x: badgeCenter.x - badgeR, y: badgeCenter.y - badgeR,
                width: 2 * badgeR, height: 2 * badgeR
            )
            let badgeFill: Color = active ? RF.rust : isVisited ? RF.forest : RF.cream
            let badgeText: Color = active || isVisited ? RF.cream : RF.forest
            context.fill(Path(ellipseIn: badgeRect), with: .color(badgeFill))
            context.stroke(
                Path(ellipseIn: badgeRect),
                with: .color(active ? RF.cream : RF.forest),
                lineWidth: 1.2
            )
            context.draw(
                context.resolve(
                    Text("\(stop.number)")
                        .font(RF.body(9.5, weight: 700))
                        .foregroundColor(badgeText)
                ),
                at: badgeCenter,
                anchor: .center
            )
        }
    }

    private func drawUserDot(in context: inout GraphicsContext, scale: CGFloat) {
        guard let userPoint else { return }
        let center = CGPoint(x: userPoint.x * scale, y: userPoint.y * scale)
        let halo = CGRect(x: center.x - 14, y: center.y - 14, width: 28, height: 28)
        context.fill(Path(ellipseIn: halo), with: .color(RF.mapWater.opacity(0.25)))
        let dot = CGRect(x: center.x - 6.5, y: center.y - 6.5, width: 13, height: 13)
        context.fill(Path(ellipseIn: dot), with: .color(RF.mapWater))
        context.stroke(Path(ellipseIn: dot), with: .color(.white), lineWidth: 2.5)
    }

    private func drawScaleBar(in context: inout GraphicsContext, scale: CGFloat) {
        let quarterMileUnits = 402.336 / projection.metersPerUnit
        let width = quarterMileUnits * scale
        let origin = CGPoint(x: 18, y: geometry.viewBox.h * scale - 20)

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

    private func drawCompass(in context: inout GraphicsContext, size: CGSize) {
        let center = CGPoint(x: size.width - 26, y: 30)
        let ring = CGRect(x: center.x - 11, y: center.y - 11, width: 22, height: 22)
        context.stroke(Path(ellipseIn: ring), with: .color(RF.ink.opacity(0.35)), lineWidth: 1)
        var needle = Path()
        needle.move(to: CGPoint(x: center.x, y: center.y - 10))
        needle.addLine(to: CGPoint(x: center.x + 2.2, y: center.y - 2))
        needle.addLine(to: CGPoint(x: center.x, y: center.y))
        needle.closeSubpath()
        context.fill(needle, with: .color(RF.rust.opacity(0.85)))
        context.draw(
            context.resolve(
                Text("N")
                    .font(RF.display(9, weight: 400))
                    .foregroundColor(RF.ink.opacity(0.6))
            ),
            at: CGPoint(x: center.x, y: center.y - 17),
            anchor: .center
        )
    }
}
