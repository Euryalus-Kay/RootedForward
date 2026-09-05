import SwiftUI

// ------------------------------------------------------------------
// The RF mark as vector paths.
//
// The launch draws the mark rather than fading in a bitmap, so it
// needs the geometry, not the picture. Every path below is ported
// line for line from public/logo.svg in the same 400 by 400 space,
// which is why the numbers look like an SVG. Change the logo there
// and change it here, or the app will draw one mark and then hand
// off to a different one.
//
// Each stage of the drawing is a number from 0 to 1 so the launch can
// drive them on its own clock. At all ones this is the finished mark
// and matches LogoMark.png to the pixel, which is what makes the
// swap to the masthead invisible.
// ------------------------------------------------------------------

struct RootedMark: View {
    /// The ring drawing itself clockwise from twelve.
    var ring: Double = 1
    /// The ring filling with forest once drawn.
    var ringFill: Double = 1
    /// The roots growing down and the bars spreading out from the trunk.
    var roots: Double = 1
    /// The R's outline being traced.
    var rStroke: Double = 1
    /// The F's outline being traced.
    var fStroke: Double = 1
    /// Both letters taking their colour.
    var letterFill: Double = 1

    /// The logo's own cream, which is warmer than the app's paper.
    static let letterCream = Color(rfHex: 0xE8DCC8)
    /// The root green, between the ring and the letters.
    static let rootGreen = Color(rfHex: 0x3D6B58)

    var body: some View {
        GeometryReader { geo in
            let side = min(geo.size.width, geo.size.height)
            let s = side / 400
            let dx = (geo.size.width - side) / 2
            let dy = (geo.size.height - side) / 2

            ZStack {
                // The ring. A stroke while it draws, a fill once it has.
                Self.ringPath(s)
                    .fill(RF.forest.opacity(ringFill))
                Self.ringPath(s)
                    .trim(from: 0, to: ring)
                    .stroke(RF.forest, style: StrokeStyle(lineWidth: 5 * s, lineCap: .round))
                    .opacity(1 - ringFill * 0.999)

                // The roots, held inside the ring the way the SVG clips them.
                ZStack {
                    // The three bars spread outward from the trunk.
                    Self.barPaths(s)
                        .fill(Self.rootGreen)
                        .mask(
                            Rectangle()
                                .frame(width: max(0, roots) * 400 * s)
                                .frame(maxWidth: .infinity)
                        )
                    // The six roots grow down.
                    ForEach(Array(Self.rootStrokes.enumerated()), id: \.offset) { _, root in
                        Self.path(s) { p in
                            p.move(to: root.from)
                            p.addCurve(to: root.to, control1: root.c1, control2: root.c2)
                        }
                        .trim(from: 0, to: roots)
                        .stroke(Self.rootGreen, style: StrokeStyle(lineWidth: root.width * s, lineCap: .round))
                    }
                }
                .clipShape(Self.ringPath(s))

                // R, traced then filled.
                Self.rPath(s)
                    .fill(Self.letterCream.opacity(letterFill), style: FillStyle(eoFill: true))
                Self.rPath(s)
                    .trim(from: 0, to: rStroke)
                    .stroke(Self.letterCream, style: StrokeStyle(lineWidth: 2.5 * s, lineCap: .round, lineJoin: .round))
                    .opacity(1 - letterFill)

                // F, traced then filled.
                Self.fPath(s)
                    .fill(RF.rust.opacity(letterFill))
                Self.fPath(s)
                    .trim(from: 0, to: fStroke)
                    .stroke(RF.rust, style: StrokeStyle(lineWidth: 2.5 * s, lineCap: .round, lineJoin: .round))
                    .opacity(1 - letterFill)
            }
            .offset(x: dx, y: dy)
        }
        .accessibilityHidden(true)
    }

    // MARK: - Geometry, in the SVG's 400 by 400 space

    /// Builds a path in logo units and scales it to the view.
    static func path(_ s: CGFloat, _ build: (inout Path) -> Void) -> Path {
        var p = Path()
        build(&p)
        return p.applying(CGAffineTransform(scaleX: s, y: s))
    }

    /// Starts at twelve o'clock and runs clockwise, so a trim reads as
    /// a hand sweeping round rather than a gap closing from the side.
    static func ringPath(_ s: CGFloat) -> Path {
        path(s) { p in
            p.addArc(
                center: CGPoint(x: 200, y: 200), radius: 188,
                startAngle: .degrees(-90), endAngle: .degrees(270), clockwise: false
            )
            p.closeSubpath()
        }
    }

    static func barPaths(_ s: CGFloat) -> Path {
        path(s) { p in
            p.move(to: CGPoint(x: 12, y: 332))
            p.addCurve(to: CGPoint(x: 200, y: 320), control1: CGPoint(x: 80, y: 326), control2: CGPoint(x: 140, y: 322))
            p.addCurve(to: CGPoint(x: 388, y: 332), control1: CGPoint(x: 260, y: 322), control2: CGPoint(x: 320, y: 326))
            p.addLine(to: CGPoint(x: 388, y: 338))
            p.addCurve(to: CGPoint(x: 200, y: 326), control1: CGPoint(x: 320, y: 332), control2: CGPoint(x: 260, y: 328))
            p.addCurve(to: CGPoint(x: 12, y: 338), control1: CGPoint(x: 140, y: 328), control2: CGPoint(x: 80, y: 332))
            p.closeSubpath()

            p.move(to: CGPoint(x: 40, y: 356))
            p.addCurve(to: CGPoint(x: 200, y: 346), control1: CGPoint(x: 100, y: 350), control2: CGPoint(x: 150, y: 347))
            p.addCurve(to: CGPoint(x: 360, y: 356), control1: CGPoint(x: 250, y: 347), control2: CGPoint(x: 300, y: 350))
            p.addLine(to: CGPoint(x: 360, y: 360))
            p.addCurve(to: CGPoint(x: 200, y: 350), control1: CGPoint(x: 300, y: 354), control2: CGPoint(x: 250, y: 351))
            p.addCurve(to: CGPoint(x: 40, y: 360), control1: CGPoint(x: 150, y: 351), control2: CGPoint(x: 100, y: 354))
            p.closeSubpath()

            p.move(to: CGPoint(x: 70, y: 378))
            p.addCurve(to: CGPoint(x: 200, y: 369), control1: CGPoint(x: 120, y: 373), control2: CGPoint(x: 160, y: 370))
            p.addCurve(to: CGPoint(x: 330, y: 378), control1: CGPoint(x: 240, y: 370), control2: CGPoint(x: 280, y: 373))
            p.addLine(to: CGPoint(x: 330, y: 381))
            p.addCurve(to: CGPoint(x: 200, y: 372), control1: CGPoint(x: 280, y: 376), control2: CGPoint(x: 240, y: 373))
            p.addCurve(to: CGPoint(x: 70, y: 381), control1: CGPoint(x: 160, y: 373), control2: CGPoint(x: 120, y: 376))
            p.closeSubpath()
        }
    }

    struct Root {
        let from: CGPoint, c1: CGPoint, c2: CGPoint, to: CGPoint
        let width: CGFloat
    }

    /// Outer roots first, trunk last, so a single trim grows them
    /// together rather than one at a time.
    static let rootStrokes: [Root] = [
        Root(from: CGPoint(x: 70, y: 330), c1: CGPoint(x: 55, y: 355), c2: CGPoint(x: 38, y: 378), to: CGPoint(x: 18, y: 400), width: 7),
        Root(from: CGPoint(x: 135, y: 324), c1: CGPoint(x: 118, y: 352), c2: CGPoint(x: 98, y: 378), to: CGPoint(x: 78, y: 400), width: 6),
        Root(from: CGPoint(x: 200, y: 320), c1: CGPoint(x: 198, y: 350), c2: CGPoint(x: 192, y: 375), to: CGPoint(x: 185, y: 400), width: 5),
        Root(from: CGPoint(x: 200, y: 320), c1: CGPoint(x: 202, y: 350), c2: CGPoint(x: 208, y: 375), to: CGPoint(x: 215, y: 400), width: 5),
        Root(from: CGPoint(x: 265, y: 324), c1: CGPoint(x: 282, y: 352), c2: CGPoint(x: 302, y: 378), to: CGPoint(x: 322, y: 400), width: 6),
        Root(from: CGPoint(x: 330, y: 330), c1: CGPoint(x: 345, y: 355), c2: CGPoint(x: 362, y: 378), to: CGPoint(x: 382, y: 400), width: 7),
    ]

    /// Two subpaths, the letter and its counter, filled even-odd.
    static func rPath(_ s: CGFloat) -> Path {
        path(s) { p in
            p.move(to: CGPoint(x: 79, y: 88))
            p.addLine(to: CGPoint(x: 79, y: 308))
            p.addLine(to: CGPoint(x: 101, y: 308))
            p.addLine(to: CGPoint(x: 101, y: 200))
            p.addLine(to: CGPoint(x: 148, y: 200))
            p.addLine(to: CGPoint(x: 200, y: 308))
            p.addLine(to: CGPoint(x: 226, y: 308))
            p.addLine(to: CGPoint(x: 172, y: 197))
            p.addCurve(to: CGPoint(x: 218, y: 144), control1: CGPoint(x: 202, y: 190), control2: CGPoint(x: 218, y: 168))
            p.addCurve(to: CGPoint(x: 164, y: 88), control1: CGPoint(x: 218, y: 114), control2: CGPoint(x: 198, y: 88))
            p.closeSubpath()

            p.move(to: CGPoint(x: 101, y: 110))
            p.addLine(to: CGPoint(x: 161, y: 110))
            p.addCurve(to: CGPoint(x: 196, y: 144), control1: CGPoint(x: 186, y: 110), control2: CGPoint(x: 196, y: 124))
            p.addCurve(to: CGPoint(x: 161, y: 178), control1: CGPoint(x: 196, y: 164), control2: CGPoint(x: 186, y: 178))
            p.addLine(to: CGPoint(x: 101, y: 178))
            p.closeSubpath()
        }
    }

    static func fPath(_ s: CGFloat) -> Path {
        path(s) { p in
            p.move(to: CGPoint(x: 232, y: 88))
            p.addLine(to: CGPoint(x: 232, y: 308))
            p.addLine(to: CGPoint(x: 254, y: 308))
            p.addLine(to: CGPoint(x: 254, y: 200))
            p.addLine(to: CGPoint(x: 321, y: 200))
            p.addLine(to: CGPoint(x: 321, y: 182))
            p.addLine(to: CGPoint(x: 254, y: 182))
            p.addLine(to: CGPoint(x: 254, y: 110))
            p.addLine(to: CGPoint(x: 321, y: 110))
            p.addLine(to: CGPoint(x: 321, y: 88))
            p.closeSubpath()
        }
    }
}
