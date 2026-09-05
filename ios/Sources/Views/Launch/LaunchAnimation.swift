import SwiftUI

// ------------------------------------------------------------------
// The opening.
//
// The app has its content the instant it launches, because a snapshot
// ships in the bundle and the refresh runs behind. So this is not a
// spinner standing in for a wait. It is the two seconds the app takes
// to introduce itself, and it ends by handing the mark to the
// masthead and the survey sheet to the mission, in place, so the home
// screen is simply what is left when it finishes.
//
// Everything is drawn, nothing is played. The mark is vector, the
// sheet is the same 1940 survey the mission sits on, the grain and
// the grid are a few hundred rectangles. That is why it is exactly on
// palette, weighs nothing, and lands to the pixel.
//
// Under Reduce Motion nothing travels. The finished mark holds for a
// beat and the screen dissolves into the home page.
// ------------------------------------------------------------------

/// The clock the opening runs on. Offsets are seconds from launch.
/// Named here rather than scattered as literals so the whole thing
/// can be retimed in one place and tested as one thing.
enum LaunchTimeline {
    static let sceneIn = 0.00
    static let ring = 0.10
    static let ringDuration = 0.78
    static let roots = 0.58
    static let rootsDuration = 0.80
    static let ringFill = 0.84
    static let rStroke = 0.98
    static let rDuration = 0.52
    static let fStroke = 1.16
    static let fDuration = 0.46
    static let letterFill = 1.50
    static let settle = 1.72
    static let handoff = 1.92
    static let handoffDuration = 0.64
    /// When the overlay leaves and the home screen is on its own.
    static var total: Double { handoff + handoffDuration }

    /// The Reduce Motion cut: hold the finished mark, then dissolve.
    static let reducedHold = 0.55
    static let reducedDissolve = 0.32
}

struct LaunchAnimation: View {
    /// Where the masthead draws its logo, in window coordinates. The
    /// mark flies to exactly this rectangle, which is what makes the
    /// swap invisible.
    let target: CGRect
    let reduceMotion: Bool
    let onDone: () -> Void

    // the mark's stages
    @State private var ring = 0.0
    @State private var ringFill = 0.0
    @State private var roots = 0.0
    @State private var rStroke = 0.0
    @State private var fStroke = 0.0
    @State private var letterFill = 0.0
    // the scene
    @State private var sceneIn = 0.0
    @State private var sheetScale = 1.42
    @State private var sheetOpacity = 0.0
    @State private var gridDrift: CGFloat = 10
    @State private var settle = 1.0
    // the handoff
    @State private var flying = false
    @State private var sceneOut = 1.0
    @State private var markOpacity = 1.0

    var body: some View {
        GeometryReader { geo in
            let origin = geo.frame(in: .global).origin
            let width = geo.size.width
            let height = geo.size.height
            let restSide = min(width * 0.46, 184)
            let rest = CGRect(
                x: (width - restSide) / 2,
                y: height * 0.40 - restSide / 2,
                width: restSide, height: restSide
            )
            // The masthead's rectangle, brought into this view's space.
            let landing = target == .zero
                ? CGRect(x: 24, y: 6, width: 28, height: 28)
                : target.offsetBy(dx: -origin.x, dy: -origin.y)
            let frame = flying ? landing : rest

            ZStack(alignment: .topLeading) {
                // The survey sheet, placed exactly where the mission
                // keeps it, so the dissolve at the end is between two
                // copies of the same picture.
                sheet(width: width)
                    .padding(.top, 40)
                    .opacity(sheetOpacity * sceneOut)

                RootedMark(
                    ring: ring, ringFill: ringFill, roots: roots,
                    rStroke: rStroke, fStroke: fStroke, letterFill: letterFill
                )
                .frame(width: frame.width, height: frame.height)
                .scaleEffect(settle)
                .position(x: frame.midX, y: frame.midY)
                .opacity(markOpacity)
            }
            .frame(width: width, height: height, alignment: .topLeading)
        }
        .background {
            ZStack {
                RF.cream
                grid
                    .opacity(sceneIn * 0.55)
                    .offset(y: gridDrift)
                grain
                    .opacity(sceneIn)
            }
            .opacity(sceneOut)
            .ignoresSafeArea()
        }
        .allowsHitTesting(false)
        .task { await run() }
    }

    // MARK: - The scene

    /// The same picture, framed the same way, as HomeView.mission.
    private func sheet(width: CGFloat) -> some View {
        Color.clear
            .frame(width: width, height: 380)
            .overlay {
                MediaImage(
                    sitePath: "/media/hyde-park-walk/holc-chicago-1940.jpg",
                    contentMode: .fill
                )
                .scaleEffect(sheetScale)
                .offset(x: 4, y: -30)
            }
            .clipped()
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

    /// Hairlines every 32 points with a heavier rule every fifth, the
    /// way a survey sheet is ruled. Drawn as one path.
    private var grid: some View {
        Canvas { context, size in
            var fine = Path()
            var heavy = Path()
            var x: CGFloat = 0
            var column = 0
            while x <= size.width {
                var p = Path()
                p.move(to: CGPoint(x: x, y: 0))
                p.addLine(to: CGPoint(x: x, y: size.height))
                if column % 5 == 0 { heavy.addPath(p) } else { fine.addPath(p) }
                x += 32; column += 1
            }
            var y: CGFloat = 0
            var row = 0
            while y <= size.height {
                var p = Path()
                p.move(to: CGPoint(x: 0, y: y))
                p.addLine(to: CGPoint(x: size.width, y: y))
                if row % 5 == 0 { heavy.addPath(p) } else { fine.addPath(p) }
                y += 32; row += 1
            }
            context.stroke(fine, with: .color(RF.forest.opacity(0.07)), lineWidth: 0.5)
            context.stroke(heavy, with: .color(RF.forest.opacity(0.13)), lineWidth: 0.5)
        }
    }

    /// Paper. A fixed scatter of specks from a seeded generator, so it
    /// is the same paper every launch and costs one draw.
    private var grain: some View {
        Canvas { context, size in
            var state: UInt32 = 0x9E37_79B9
            func next() -> CGFloat {
                state = state &* 1_664_525 &+ 1_013_904_223
                return CGFloat(state >> 8) / CGFloat(1 << 24)
            }
            for i in 0..<1600 {
                let rect = CGRect(x: next() * size.width, y: next() * size.height, width: 1, height: 1)
                let tone = i % 3 == 0 ? RF.rust : RF.ink
                context.fill(Path(rect), with: .color(tone.opacity(0.05 + next() * 0.04)))
            }
        }
    }

    // MARK: - The clock

    @MainActor
    private func run() async {
        if reduceMotion {
            await runReduced()
            return
        }
        // 0.00  The paper, the ruling and the sheet arrive together.
        withAnimation(.easeOut(duration: 0.7)) {
            sceneIn = 1
            gridDrift = 0
        }
        withAnimation(.easeOut(duration: LaunchTimeline.handoff)) {
            sheetOpacity = 0.2
            sheetScale = 1.08
        }
        // 0.10  The ring draws itself.
        await pause(until: LaunchTimeline.ring)
        withAnimation(.easeInOut(duration: LaunchTimeline.ringDuration)) { ring = 1 }
        // 0.58  The roots grow before the ring is even closed.
        await pause(until: LaunchTimeline.roots)
        withAnimation(.easeOut(duration: LaunchTimeline.rootsDuration)) { roots = 1 }
        // 0.84  The ring fills.
        await pause(until: LaunchTimeline.ringFill)
        withAnimation(.easeOut(duration: 0.34)) { ringFill = 1 }
        // 0.98  R, then F, traced.
        await pause(until: LaunchTimeline.rStroke)
        withAnimation(.easeInOut(duration: LaunchTimeline.rDuration)) { rStroke = 1 }
        await pause(until: LaunchTimeline.fStroke)
        withAnimation(.easeInOut(duration: LaunchTimeline.fDuration)) { fStroke = 1 }
        // 1.50  Colour.
        await pause(until: LaunchTimeline.letterFill)
        withAnimation(.easeOut(duration: 0.32)) { letterFill = 1 }
        // 1.72  A breath. The mark settles and the phone says so.
        await pause(until: LaunchTimeline.settle)
        Haptics.tap()
        withAnimation(.spring(response: 0.32, dampingFraction: 0.6)) { settle = 1.0 }
        // 1.92  The handoff. The mark flies to the masthead, the paper
        //       dissolves, and what is underneath is the home screen.
        await pause(until: LaunchTimeline.handoff)
        withAnimation(.spring(response: 0.58, dampingFraction: 0.86)) { flying = true }
        withAnimation(.easeInOut(duration: 0.46).delay(0.08)) { sceneOut = 0 }
        await pause(until: LaunchTimeline.total)
        onDone()
    }

    @MainActor
    private func runReduced() async {
        // Nothing travels. The finished mark, a beat, a dissolve.
        ring = 1; ringFill = 1; roots = 1; rStroke = 1; fStroke = 1; letterFill = 1
        sceneIn = 1; gridDrift = 0; sheetOpacity = 0.2; sheetScale = 1.08
        try? await Task.sleep(for: .seconds(LaunchTimeline.reducedHold))
        withAnimation(.easeInOut(duration: LaunchTimeline.reducedDissolve)) {
            sceneOut = 0
            markOpacity = 0
        }
        try? await Task.sleep(for: .seconds(LaunchTimeline.reducedDissolve))
        onDone()
    }

    /// Sleeps until the given offset on the launch clock, measured
    /// from when this view appeared, so drift in one step does not
    /// push every later step.
    private static let started = Date()
    private func pause(until offset: Double) async {
        let due = Self.started.addingTimeInterval(offset)
        let remaining = due.timeIntervalSinceNow
        if remaining > 0 {
            try? await Task.sleep(for: .seconds(remaining))
        }
    }
}
