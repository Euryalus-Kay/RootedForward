import XCTest
import SwiftUI
@testable import RootedForward

// ------------------------------------------------------------------
// The opening's clock and its geometry. Timing drift is the kind of
// thing that creeps in one tweak at a time, so the whole schedule is
// pinned here, and the mark's paths are checked against the SVG they
// were ported from.
// ------------------------------------------------------------------

final class LaunchTests: XCTestCase {

    // MARK: - The clock

    func testStagesRunInOrder() {
        let offsets = [
            LaunchTimeline.sceneIn, LaunchTimeline.ring, LaunchTimeline.roots,
            LaunchTimeline.ringFill, LaunchTimeline.rStroke, LaunchTimeline.fStroke,
            LaunchTimeline.letterFill, LaunchTimeline.settle, LaunchTimeline.handoff,
        ]
        XCTAssertEqual(offsets, offsets.sorted(), "every stage starts after the one before it")
    }

    func testTheWholeOpeningIsUnderThreeSeconds() {
        XCTAssertLessThan(LaunchTimeline.total, 3.0,
                          "an opening people sit through every launch has to stay short")
        XCTAssertGreaterThan(LaunchTimeline.total, 2.0,
                             "and long enough to have drawn something")
    }

    func testTheRingIsClosedBeforeItFills() {
        XCTAssertGreaterThanOrEqual(
            LaunchTimeline.ringFill, LaunchTimeline.ring + LaunchTimeline.ringDuration - 0.1,
            "filling a ring that is still being drawn reads as a glitch"
        )
    }

    func testLettersAreTracedBeforeTheyTakeColour() {
        XCTAssertGreaterThanOrEqual(LaunchTimeline.letterFill, LaunchTimeline.fStroke + LaunchTimeline.fDuration - 0.15)
    }

    func testTheReducedCutIsShorterThanTheFullOne() {
        XCTAssertLessThan(LaunchTimeline.reducedHold + LaunchTimeline.reducedDissolve, LaunchTimeline.total)
    }

    // MARK: - The film

    func testTheFilmShipsInTheBundle() {
        // Silent HEVC under Resources/Launch. If this fails the opening
        // still runs on the still, but that is a quieter launch than
        // the one that was signed off.
        XCTAssertNotNil(LaunchFilm.url, "launch-sheet.mp4 is missing from the app bundle")
    }

    // MARK: - The mark

    func testEveryPathStaysInsideTheLogoBox() {
        let box = CGRect(x: 0, y: 0, width: 400, height: 400)
        for (name, path) in [
            ("ring", RootedMark.ringPath(1)),
            ("bars", RootedMark.barPaths(1)),
            ("R", RootedMark.rPath(1)),
            ("F", RootedMark.fPath(1)),
        ] {
            XCTAssertFalse(path.isEmpty, "\(name) is empty")
            XCTAssertTrue(box.insetBy(dx: -1, dy: -1).contains(path.boundingRect), "\(name) leaves the 400 by 400 box: \(path.boundingRect)")
        }
    }

    func testTheRingMatchesTheSVGCircle() {
        // r=188 centred at 200,200, from public/logo.svg
        let b = RootedMark.ringPath(1).boundingRect
        XCTAssertEqual(b.minX, 12, accuracy: 0.5)
        XCTAssertEqual(b.maxX, 388, accuracy: 0.5)
        XCTAssertEqual(b.minY, 12, accuracy: 0.5)
        XCTAssertEqual(b.maxY, 388, accuracy: 0.5)
    }

    func testTheLettersSitWhereTheSVGPutsThem() {
        let r = RootedMark.rPath(1).boundingRect
        XCTAssertEqual(r.minX, 79, accuracy: 0.5)
        XCTAssertEqual(r.minY, 88, accuracy: 0.5)
        XCTAssertEqual(r.maxY, 308, accuracy: 0.5)
        let f = RootedMark.fPath(1).boundingRect
        XCTAssertEqual(f.minX, 232, accuracy: 0.5)
        XCTAssertEqual(f.maxX, 321, accuracy: 0.5)
    }

    func testScalingScalesEverything() {
        let one = RootedMark.rPath(1).boundingRect
        let two = RootedMark.rPath(2).boundingRect
        XCTAssertEqual(two.width, one.width * 2, accuracy: 0.01)
        XCTAssertEqual(two.minY, one.minY * 2, accuracy: 0.01)
    }

    func testSixRootsGrowFromTheBars() {
        XCTAssertEqual(RootedMark.rootStrokes.count, 6)
        for root in RootedMark.rootStrokes {
            XCTAssertGreaterThanOrEqual(root.from.y, 320, "roots start at the top bar")
            XCTAssertEqual(root.to.y, 400, "and run to the bottom of the box")
        }
    }
}
