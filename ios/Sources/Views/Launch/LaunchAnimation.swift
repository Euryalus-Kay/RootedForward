import SwiftUI

// ------------------------------------------------------------------
// The opening.
//
// The app has its content the instant it launches, because a snapshot
// ships in the bundle and the refresh runs behind. So this is not a
// spinner standing in for a wait. It is the two and a half seconds the
// app takes to introduce itself, built in depth, back to front:
//
//   paper      the cream, its grain, the survey ruling, drifting
//   sheet      the 1940 survey the mission sits on, laid down flat
//              from a tilt, coming into focus, with a light crossing
//              it (four seconds of film dissolving into the still)
//   air        a few motes drifting up between the sheet and the mark
//   mark       the RF mark drawing itself, turning to face you, lifting
//              off the page as it takes colour, then landing
//
// It ends by handing the mark to the masthead and the sheet to the
// mission, in place, and the home screen arrives underneath one
// section after another. The masthead reports where it draws its
// logo and hides its own copy until the drawn one has landed, so the
// swap is on one frame and invisible.
//
// The mark is drawn, not played. It is vector, ported path for path
// from the logo, which is why it is exactly on palette and lands on
// the masthead to the pixel. Under Reduce Motion nothing travels or
// tilts. The finished mark holds for a beat and the screen dissolves.
// ------------------------------------------------------------------

/// The clock the opening runs on. Offsets are seconds from launch.
/// Named here rather than scattered as literals so the whole thing
/// can be retimed in one place and tested as one thing.
enum LaunchTimeline {
    static let sceneIn = 0.00
    static let ring = 0.10
    static let ringDuration = 0.78
    static let light = 0.25
    static let lightDuration = 1.70
    static let roots = 0.58
    static let rootsDuration = 0.80
    static let ringFill = 0.84
    static let rStroke = 0.98
    static let rDuration = 0.52
    static let fStroke = 1.16
    static let fDuration = 0.46
    static let letterFill = 1.50
    static let settle = 1.74
    static let handoff = 1.96
    static let handoffDuration = 0.66
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
    /// Fires the moment the mark leaves for the masthead, so the home
    /// screen can start arriving underneath.
    let onHandoff: () -> Void
    let onDone: () -> Void

    // the mark's stages
    @State private var ring = 0.0
    @State private var ringFill = 0.0
    @State private var roots = 0.0
    @State private var rStroke = 0.0
    @State private var fStroke = 0.0
    @State private var letterFill = 0.0
    // the mark in space
    @State private var markTilt = 18.0
    @State private var elevation = 0.0
    @State private var settle = 1.0
    // the sheet in space
    @State private var sheetTilt = 16.0
    @State private var sheetBlur: CGFloat = 2.2
    @State private var sheetScale = 1.42
    @State private var sheetOpacity = 0.0
    /// The film plays under the mark while it draws, then dissolves
    /// into the still before the handoff. Absent under Reduce Motion,
    /// and it drops out if the file is missing or will not decode.
    @State private var film = LaunchFilm.url != nil
    @State private var filmOpacity = 0.0
    // the paper and the air
    @State private var sceneIn = 0.0
    @State private var gridDrift: CGFloat = 10
    @State private var paperScale = 1.0
    @State private var lightX = -1.2
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
                // copies of the same picture. It is laid down from a
                // tilt and comes into focus as the mark draws.
                ZStack {
                    // The focus pull is on the still only. Blurring a
                    // view that holds an AVPlayerLayer forces every video
                    // frame through an offscreen Gaussian pass, which
                    // stalled the display for ten seconds on an iPhone
                    // SE. The 3D tilt is a plain layer transform and is
                    // fine to share.
                    sheet(width: width)
                        .blur(radius: sheetBlur)
                        .opacity(sheetOpacity * sceneOut)
                    if film && !reduceMotion {
                        filmSheet(width: width)
                            .opacity(filmOpacity * sceneOut)
                    }
                }
                .rotation3DEffect(
                    .degrees(sheetTilt),
                    axis: (x: 1, y: 0, z: 0),
                    anchor: .top,
                    perspective: 0.55
                )
                .padding(.top, 40)

                // One light crossing everything, the same light the film
                // carries, so the layers read as one room.
                if !reduceMotion {
                    lightSweep(width: width, height: height)
                        .opacity(sceneIn * sceneOut)
                    motes(width: width, height: height)
                        .opacity(sceneIn * sceneOut)
                }

                RootedMark(
                    ring: ring, ringFill: ringFill, roots: roots,
                    rStroke: rStroke, fStroke: fStroke, letterFill: letterFill
                )
                .frame(width: frame.width, height: frame.height)
                .scaleEffect(settle)
                .rotation3DEffect(
                    .degrees(markTilt),
                    axis: (x: 0.35, y: 1, z: 0),
                    perspective: 0.6
                )
                // Flat while it is a line drawing, an object above the
                // page once it has colour, ink on the page again when
                // it lands on the masthead.
                .shadow(
                    color: RF.ink.opacity(0.22 * elevation),
                    radius: 22 * elevation, x: 0, y: 12 * elevation
                )
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
                    .scaleEffect(paperScale)
                grain
                    .opacity(sceneIn)
                    .scaleEffect(paperScale)
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
            .mask(sheetMask)
            .accessibilityHidden(true)
    }

    /// The film, framed the same way as the still so the dissolve
    /// between them is between two copies of one picture.
    private func filmSheet(width: CGFloat) -> some View {
        Color.clear
            .frame(width: width, height: 380)
            .overlay {
                LaunchFilm(onUnavailable: {
                    // Fall back to the still, and if the film was the
                    // thing on screen, bring the still up in its place.
                    film = false
                    withAnimation(.easeOut(duration: 0.4)) { sheetOpacity = 0.2 }
                })
                .scaleEffect(1.08)
                .offset(x: 4, y: -30)
            }
            .clipped()
            .mask(sheetMask)
            .accessibilityHidden(true)
    }

    private var sheetMask: some View {
        LinearGradient(
            stops: [
                .init(color: .clear, location: 0),
                .init(color: .black, location: 0.18),
                .init(color: .black, location: 0.62),
                .init(color: .clear, location: 1),
            ],
            startPoint: .top, endPoint: .bottom
        )
    }

    /// A soft band of light travelling left to right once, tilted the
    /// way afternoon light falls across a desk.
    private func lightSweep(width: CGFloat, height: CGFloat) -> some View {
        LinearGradient(
            colors: [.clear, .white.opacity(0.11), .clear],
            startPoint: .leading, endPoint: .trailing
        )
        .frame(width: width * 0.6, height: height * 1.6)
        .rotationEffect(.degrees(18))
        .position(x: width * lightX, y: height * 0.45)
        .blendMode(.plusLighter)
        .allowsHitTesting(false)
    }

    /// A little dust in the air between the sheet and the mark. Time
    /// based rather than state based, so it costs no animation
    /// bookkeeping, and the nearer motes move faster, which is what
    /// gives the room its depth.
    private func motes(width: CGFloat, height: CGFloat) -> some View {
        TimelineView(.animation) { timeline in
            let t = timeline.date.timeIntervalSince(Self.started)
            Canvas { context, size in
                var state: UInt32 = 0x1234_5679
                func next() -> CGFloat {
                    state = state &* 1_664_525 &+ 1_013_904_223
                    return CGFloat(state >> 8) / CGFloat(1 << 24)
                }
                for i in 0..<14 {
                    let depth = 0.35 + next() * 0.65          // 0.35 far, 1.0 near
                    let x0 = next() * size.width
                    let y0 = next() * size.height
                    let phase = next() * .pi * 2
                    let rise = CGFloat(t) * 14 * depth
                    let sway = sin(CGFloat(t) * 0.9 + phase) * 6 * depth
                    let y = (y0 - rise).truncatingRemainder(dividingBy: size.height + 20)
                    let x = x0 + sway
                    let r = 0.9 + depth * 1.8
                    let tone = i % 4 == 0 ? RF.rust : RF.ink
                    let rect = CGRect(x: x - r, y: (y < -20 ? y + size.height + 20 : y) - r, width: r * 2, height: r * 2)
                    context.fill(Path(ellipseIn: rect), with: .color(tone.opacity(0.04 + depth * 0.09)))
                }
            }
        }
        .frame(width: width, height: height)
        .allowsHitTesting(false)
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
        // 0.00  The paper arrives and begins the slowest move in the
        //       room, a barely there push in. The sheet is laid down
        //       from its tilt and comes into focus. The mark turns to
        //       face you.
        withAnimation(.easeOut(duration: 0.7)) {
            sceneIn = 1
            gridDrift = 0
        }
        withAnimation(.easeOut(duration: LaunchTimeline.handoff)) {
            paperScale = 1.018
            sheetTilt = 0
        }
        withAnimation(.easeOut(duration: 1.1)) { sheetBlur = 0 }
        withAnimation(.easeOut(duration: 1.25).delay(0.1)) { markTilt = 0 }
        if film {
            // The film has its own drift. The still waits, already at
            // the film's framing, for the dissolve. A touch stronger
            // than the home screen's 0.2 while the mark draws, so the
            // light crossing the sheet reads.
            sheetScale = 1.08
            withAnimation(.easeOut(duration: 0.7)) { filmOpacity = 0.3 }
        } else {
            withAnimation(.easeOut(duration: LaunchTimeline.handoff)) {
                sheetOpacity = 0.2
                sheetScale = 1.08
            }
        }
        // 0.10  The ring draws itself.
        await pause(until: LaunchTimeline.ring)
        withAnimation(.easeInOut(duration: LaunchTimeline.ringDuration)) { ring = 1 }
        // 0.25  The light crosses the room once.
        await pause(until: LaunchTimeline.light)
        withAnimation(.easeInOut(duration: LaunchTimeline.lightDuration)) { lightX = 1.45 }
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
        // 1.50  Colour, and the mark lifts off the page as it takes it.
        //       The film dissolves into the still here too, so by the
        //       handoff the sheet is the same still the home screen
        //       draws and nothing is left playing.
        await pause(until: LaunchTimeline.letterFill)
        withAnimation(.easeOut(duration: 0.32)) { letterFill = 1 }
        withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) { elevation = 1 }
        if film {
            withAnimation(.easeInOut(duration: 0.42)) {
                filmOpacity = 0
                sheetOpacity = 0.2
            }
        }
        // 1.74  A breath. The mark settles and the phone says so.
        await pause(until: LaunchTimeline.settle)
        Haptics.tap()
        withAnimation(.spring(response: 0.32, dampingFraction: 0.6)) { settle = 1.0 }
        // 1.96  The handoff. The mark flies to the masthead and lands,
        //       flat, as ink on the page. The paper dissolves. The home
        //       screen arrives underneath, one section after another.
        await pause(until: LaunchTimeline.handoff)
        onHandoff()
        withAnimation(.spring(response: 0.6, dampingFraction: 0.86)) { flying = true }
        withAnimation(.easeOut(duration: 0.5)) { elevation = 0 }
        withAnimation(.easeInOut(duration: 0.46).delay(0.08)) { sceneOut = 0 }
        await pause(until: LaunchTimeline.total)
        onDone()
    }

    @MainActor
    private func runReduced() async {
        // Nothing travels or tilts. The finished mark, a beat, a dissolve.
        ring = 1; ringFill = 1; roots = 1; rStroke = 1; fStroke = 1; letterFill = 1
        markTilt = 0; sheetTilt = 0; sheetBlur = 0
        sceneIn = 1; gridDrift = 0; sheetOpacity = 0.2; sheetScale = 1.08
        try? await Task.sleep(for: .seconds(LaunchTimeline.reducedHold))
        onHandoff()
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
