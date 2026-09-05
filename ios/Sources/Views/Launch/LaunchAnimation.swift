import SwiftUI

// ------------------------------------------------------------------
// The opening.
//
// The app has its content the instant it launches, because a snapshot
// ships in the bundle and the refresh runs behind. So this is not a
// spinner standing in for a wait. It is the three seconds the app
// takes to introduce itself, built in depth, back to front:
//
//   paper      the cream, its grain, the survey ruling, settling
//   sheet      the 1940 survey the mission sits on, laid down flat
//              from a tilt, coming into focus, with a light crossing
//              it (four seconds of film dissolving into the still)
//   air        a few motes drifting up between the sheet and the mark
//   mark       the RF mark drawing itself, turning to face you, the
//              ring pooling with ink, the letters filling from their
//              baseline, then lifting off the page with an edge and a
//              shadow, holding for a breath, and landing flat as ink
//
// It ends by handing the mark to the masthead and the sheet to the
// mission, in place, and the home screen arrives underneath one
// section after another. The masthead reports where it draws its
// logo and hides its own copy until the drawn one has landed, so the
// swap is on one frame and invisible.
//
// A tap anywhere skips to the handoff. The overlay swallows touches
// otherwise, so nothing underneath can be pressed by accident.
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
    static let lightDuration = 1.90
    static let roots = 0.58
    static let rootsDuration = 0.80
    static let ringFill = 0.86
    static let rStroke = 1.00
    static let rDuration = 0.50
    static let fStroke = 1.18
    static let fDuration = 0.46
    static let letterFill = 1.52
    static let settle = 1.80
    /// The hold. The finished mark stays, takes one slow breath, and
    /// only then leaves. This is the part people remember.
    static let handoff = 2.32
    static let handoffDuration = 0.66
    /// When the mark touches down on the masthead.
    static let landing = handoff + 0.42
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
    @State private var markTilt = 22.0
    @State private var elevation = 0.0
    @State private var settle = 1.0
    @State private var breath = 1.0
    // the sheet in space
    @State private var sheetTilt = 18.0
    @State private var sheetBlur: CGFloat = 2.2
    @State private var sheetScale = 1.42
    @State private var sheetOpacity = 0.0
    /// The film plays under the mark while it draws, then dissolves
    /// into the still before the handoff. Absent under Reduce Motion,
    /// and it drops out if the file is missing or will not decode.
    @State private var film = LaunchFilm.url != nil
    @State private var filmOpacity = 0.0
    /// The film view leaves the hierarchy once it has dissolved, so a
    /// player is not decoding at zero opacity under the flight.
    @State private var filmMounted = true
    // the paper and the air
    @State private var sceneIn = 0.0
    @State private var gridDrift: CGFloat = 10
    @State private var parallax: CGFloat = 1
    @State private var paperScale = 1.0
    @State private var lightX = -1.2
    // the handoff
    @State private var flying = false
    @State private var sceneOut = 1.0
    @State private var markOpacity = 1.0
    // a tap skips ahead
    @State private var skipping = false
    /// The launch clock. Offsets in LaunchTimeline are measured from
    /// here, and the motes drift on it.
    @State private var started = Date()
    #if DEBUG
    @State private var frameWatch = FrameWatch()
    #endif

    /// The ring is 376 of the 400 unit box.
    private static let ringShare = 0.94

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
                    if film && filmMounted && !reduceMotion {
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
                .offset(x: 6 * parallax)
                .padding(.top, 40)

                // One light crossing everything, the same light the film
                // carries, so the layers read as one room.
                if !reduceMotion {
                    lightSweep(width: width, height: height)
                        .opacity(sceneIn * sceneOut)
                    motes(width: width, height: height)
                        .opacity(sceneIn * sceneOut)
                }

                // The mark, with its shadow and its edge beneath it while
                // it is lifted. Laid out once at rest size and moved with
                // transforms only, so the flight is the GPU scaling one
                // texture rather than SwiftUI re-laying a dozen paths and
                // masks on every frame. That is the difference between
                // sixty frames a second and thirty.
                ZStack {
                    // A contact shadow as a gradient disc. No Gaussian,
                    // nothing to recompute per frame, and it reads the
                    // same as a blurred shadow at this size.
                    Circle()
                        .fill(RadialGradient(
                            colors: [RF.ink.opacity(0.26), RF.ink.opacity(0)],
                            center: .center,
                            startRadius: restSide * 0.30,
                            endRadius: restSide * 0.66
                        ))
                        .frame(width: restSide * 1.32, height: restSide * 1.32)
                        .offset(y: 14 * elevation)
                        .opacity(elevation)
                    // An edge, the way a coin has one. Four thin copies of
                    // the ring stepped down and to the right, only while
                    // the mark is an object above the page.
                    ForEach(1...4, id: \.self) { i in
                        Circle()
                            .fill(Color(rfHex: 0x12291F))
                            .frame(width: restSide * Self.ringShare, height: restSide * Self.ringShare)
                            .offset(
                                x: CGFloat(i) * 0.0045 * restSide * elevation,
                                y: CGFloat(i) * 0.0075 * restSide * elevation
                            )
                            .opacity(elevation)
                    }
                    RootedMark(
                        ring: ring, ringFill: ringFill, roots: roots,
                        rStroke: rStroke, fStroke: fStroke, letterFill: letterFill
                    )
                    .frame(width: restSide, height: restSide)
                }
                // Room for the shadow and the breath, so nothing is cut.
                .frame(width: restSide * 1.5, height: restSide * 1.5)
                .scaleEffect((flying ? landing.width / restSide : 1) * settle * breath)
                // One Metal pass for the whole group, re-rasterised at the
                // current scale, so the mark stays crisp all the way down
                // to the masthead instead of being a minified texture.
                .drawingGroup()
                .rotation3DEffect(
                    .degrees(markTilt),
                    axis: (x: 0.35, y: 1, z: 0),
                    perspective: 0.6
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
                    .offset(x: 3 * parallax, y: gridDrift)
                    .scaleEffect(paperScale)
                grain
                    .opacity(sceneIn)
                    .scaleEffect(paperScale)
            }
            .opacity(sceneOut)
            .ignoresSafeArea()
        }
        // Touches stop here. Nothing underneath can be pressed by
        // accident, and one tap skips ahead for anyone who has seen it.
        .contentShape(Rectangle())
        .onTapGesture {
            #if DEBUG
            print(String(format: "launch opening: tap to skip at +%.2fs", Date().timeIntervalSince(started)))
            #endif
            skipping = true
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Rooted Forward")
        .accessibilityHint("Double tap to skip the opening")
        .accessibilityAction { skipping = true }
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
            colors: [.clear, .white.opacity(0.13), .clear],
            startPoint: .leading, endPoint: .trailing
        )
        .frame(width: width * 0.62, height: height * 1.6)
        .rotationEffect(.degrees(20))
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
            let t = timeline.date.timeIntervalSince(started)
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
        #if DEBUG
        // -launchHoldStart parks the opening on its first frame for six
        // seconds so an automated tap can land inside it.
        if ProcessInfo.processInfo.arguments.contains("-launchHoldStart") {
            try? await Task.sleep(for: .seconds(6))
            started = Date()
        }
        frameWatch.start()
        defer { print(frameWatch.stop(label: "launch opening")) }
        #endif
        if reduceMotion {
            await runReduced()
            return
        }
        // 0.00  The paper arrives and begins the slowest move in the
        //       room, a barely there push in, and the layers settle
        //       into line. The sheet is laid down on a spring, with a
        //       hair of overshoot, and comes into focus. The mark turns
        //       to face you.
        withAnimation(.easeOut(duration: 0.7)) {
            sceneIn = 1
            gridDrift = 0
        }
        withAnimation(.easeOut(duration: LaunchTimeline.handoff)) { paperScale = 1.018 }
        withAnimation(.spring(response: 1.5, dampingFraction: 0.78)) { sheetTilt = 0 }
        withAnimation(.easeOut(duration: 1.3)) { parallax = 0 }
        withAnimation(.easeOut(duration: 1.1)) { sheetBlur = 0 }
        withAnimation(.easeOut(duration: 1.3).delay(0.1)) { markTilt = 0 }
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
        withAnimation(.easeInOut(duration: dur(LaunchTimeline.ringDuration))) { ring = 1 }
        // 0.25  The light crosses the room once.
        await pause(until: LaunchTimeline.light)
        withAnimation(.easeInOut(duration: dur(LaunchTimeline.lightDuration))) { lightX = 1.45 }
        // 0.58  The roots grow before the ring is even closed.
        await pause(until: LaunchTimeline.roots)
        withAnimation(.easeOut(duration: dur(LaunchTimeline.rootsDuration))) { roots = 1 }
        // 0.86  Ink pools out from the centre to meet the ring.
        await pause(until: LaunchTimeline.ringFill)
        withAnimation(.easeOut(duration: dur(0.5))) { ringFill = 1 }
        // 1.00  R, then F, traced.
        await pause(until: LaunchTimeline.rStroke)
        withAnimation(.easeInOut(duration: dur(LaunchTimeline.rDuration))) { rStroke = 1 }
        await pause(until: LaunchTimeline.fStroke)
        withAnimation(.easeInOut(duration: dur(LaunchTimeline.fDuration))) { fStroke = 1 }
        // 1.52  Ink rises through the letters, and the mark lifts off
        //       the page as it takes colour. The film dissolves into
        //       the still here too, so by the handoff the sheet is the
        //       same still the home screen draws.
        await pause(until: LaunchTimeline.letterFill)
        withAnimation(.easeOut(duration: dur(0.42))) { letterFill = 1 }
        withAnimation(.spring(response: 0.55, dampingFraction: 0.8)) { elevation = 1 }
        if film {
            withAnimation(.easeInOut(duration: dur(0.42))) {
                filmOpacity = 0
                sheetOpacity = 0.2
            }
        }
        // 1.80  The mark settles and the phone says so. Then the hold:
        //       one slow breath while everything else is still.
        await pause(until: LaunchTimeline.settle)
        Haptics.tap()
        withAnimation(.spring(response: 0.32, dampingFraction: 0.6)) { settle = 1.0 }
        withAnimation(.easeInOut(duration: 0.26)) { breath = 1.014 }
        withAnimation(.easeInOut(duration: 0.26).delay(0.26)) { breath = 1.0 }
        // 2.32  The handoff. The mark flies to the masthead, its edge
        //       and shadow collapse, and it lands flat as ink. The paper
        //       dissolves. The home screen arrives underneath, one
        //       section after another.
        await pause(until: LaunchTimeline.handoff)
        // After a tap, give the compressed stages a moment to finish so
        // the mark leaves complete rather than mid-stroke.
        if skipping { try? await Task.sleep(for: .seconds(0.22)) }
        filmMounted = false
        onHandoff()
        withAnimation(.spring(response: 0.7, dampingFraction: 0.88)) { flying = true }
        withAnimation(.easeOut(duration: 0.5)) { elevation = 0 }
        withAnimation(.easeInOut(duration: 0.46).delay(0.08)) { sceneOut = 0 }
        // From here the waits are plain sleeps, not skippable pauses. The
        // flight takes its full time whether or not a tap brought it on.
        try? await Task.sleep(for: .seconds(LaunchTimeline.landing - LaunchTimeline.handoff))
        Haptics.press()
        try? await Task.sleep(for: .seconds(LaunchTimeline.total - LaunchTimeline.landing))
        onDone()
    }

    @MainActor
    private func runReduced() async {
        // Nothing travels or tilts. The finished mark, a beat, a dissolve.
        ring = 1; ringFill = 1; roots = 1; rStroke = 1; fStroke = 1; letterFill = 1
        markTilt = 0; sheetTilt = 0; sheetBlur = 0; parallax = 0
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

    /// A stage's duration, or a quick one once a tap has asked to skip.
    private func dur(_ seconds: Double) -> Double {
        skipping ? min(seconds, 0.16) : seconds
    }

    /// Sleeps until the given offset on the launch clock, measured
    /// from when this view appeared, so drift in one step does not
    /// push every later step. Returns at once after a tap to skip, so
    /// the remaining stages run straight through to the handoff.
    private func pause(until offset: Double) async {
        if skipping { return }
        let due = started.addingTimeInterval(offset)
        var remaining = due.timeIntervalSinceNow
        while remaining > 0 && !skipping {
            try? await Task.sleep(for: .seconds(min(remaining, 0.05)))
            remaining = due.timeIntervalSinceNow
        }
    }
}

#if DEBUG
import QuartzCore

/// Counts display refreshes the main thread actually made during the
/// opening, so smoothness is a number in the console rather than an
/// impression. Debug builds only. A gap longer than one refresh is a
/// dropped frame.
@MainActor
final class FrameWatch {
    private final class Sink: NSObject {
        var stamps: [CFTimeInterval] = []
        @objc func tick(_ link: CADisplayLink) { stamps.append(link.timestamp) }
    }
    private let sink = Sink()
    private var link: CADisplayLink?

    func start() {
        let link = CADisplayLink(target: sink, selector: #selector(Sink.tick(_:)))
        link.add(to: .main, forMode: .common)
        self.link = link
    }

    func stop(label: String) -> String {
        link?.invalidate()
        let stamps = sink.stamps
        guard stamps.count > 2, let first = stamps.first, let last = stamps.last else {
            return "\(label): no frames observed"
        }
        let gaps = zip(stamps.dropFirst(), stamps).map { $0 - $1 }
        let nominal = gaps.sorted()[gaps.count / 2]
        let dropped = gaps.reduce(0) { $0 + max(0, Int(($1 / nominal).rounded()) - 1) }
        let worst = gaps.max() ?? 0
        // Every gap longer than a refresh and a half, with where it fell.
        let stalls = zip(stamps, gaps)
            .filter { $0.1 > nominal * 1.5 }
            .map { String(format: "+%.2fs %.0fms", $0.0 - first, $0.1 * 1000) }
            .joined(separator: ", ")
        return String(
            format: "%@: %d frames in %.2fs, %d dropped, worst gap %.0f ms, refresh %.1f ms\n  stalls: %@",
            label, stamps.count, last - first, dropped, worst * 1000, nominal * 1000, stalls
        )
    }
}
#endif
