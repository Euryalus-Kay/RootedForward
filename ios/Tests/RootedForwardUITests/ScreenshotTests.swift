import XCTest

// ------------------------------------------------------------------
// Walks every screen and attaches a named screenshot, used for the
// design QC pass and to produce App Store screenshot sources. Run
// with -resultBundlePath and export the attachments.
// ------------------------------------------------------------------

final class ScreenshotTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = true
        app = XCUIApplication()
        app.launchArguments = ["-uiTestReset"]
        app.launch()
    }

    /// Scrolls until the element can actually be tapped, lets the
    /// scroll settle, taps, and retries once if the tap got swallowed
    /// by scroll inertia (the element disappears on success because
    /// the sheet dismisses).
    private func scrollToTap(_ element: XCUIElement) {
        XCTAssertTrue(element.waitForExistence(timeout: 5))
        // A row half-cut at the screen's bottom edge still reports
        // hittable, but the tap lands in the home-indicator zone and
        // the system swallows it. Demand real margin.
        let safeBottom = app.frame.maxY - 140
        var tries = 0
        while (!element.isHittable || element.frame.maxY > safeBottom) && tries < 8 {
            app.swipeUp(velocity: .fast)
            tries += 1
        }
        sleep(1)
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        sleep(1)
        if element.exists && element.isHittable {
            let debug = XCTAttachment(string: "frame=\(element.frame) appFrame=\(app.frame)\n\n" + app.debugDescription)
            debug.name = "debug-hierarchy"
            debug.lifetime = .keepAlways
            add(debug)
            element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        }
    }

    /// Taps the transport bar's next chevron until the numbered stop
    /// title is on screen.
    private func advance(to stopNumber: Int) {
        let next = app.buttons["transport-next"]
        for _ in 0..<(stopNumber * 2) {
            if app.staticTexts["stop-title-\(stopNumber)"].exists { break }
            XCTAssertTrue(next.waitForExistence(timeout: 5))
            next.tap()
            usleep(600_000)
        }
        XCTAssertTrue(app.staticTexts["stop-title-\(stopNumber)"].waitForExistence(timeout: 8))
    }

    private func snap(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testCaptureEveryScreen() {
        // 1. Home
        XCTAssertTrue(app.buttons["home-start"].waitForExistence(timeout: 10))
        sleep(2)
        snap("01-home-top")
        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("02-home-plates")
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("03-home-footer")
        app.swipeDown(velocity: .fast)
        app.swipeDown(velocity: .fast)
        app.swipeDown(velocity: .fast)

        // 2. Intro
        app.buttons["home-start"].tap()
        XCTAssertTrue(app.buttons["intro-begin"].waitForExistence(timeout: 5))
        sleep(1)
        snap("04-intro")

        // 3. Stop 1
        app.buttons["intro-begin"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))
        sleep(2)
        snap("05-stop1-top")

        // Audio playing state
        app.buttons["play-stop-1"].firstMatch.tap()
        sleep(2)
        snap("06-stop1-playing")
        // Pause again; continuous scrubber updates keep XCUITest from
        // reaching quiescence and make later synthesized taps flaky.
        app.buttons["play-stop-1"].firstMatch.tap()
        sleep(1)

        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("07-stop1-images")
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("08-stop1-handoff")

        // 4. Map sheet
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        sleep(2)
        snap("09-map")

        // Close the map, then walk forward with the transport bar
        // chevrons (row taps in a scrolled sheet are flaky under
        // XCUITest on some simulators; the product path is covered by
        // WalkTourUITests and MapRowTapDiagnostic).
        app.buttons["map-done"].tap()
        sleep(1)

        // 5. Stop 6 has the Restrictive covenants red plate
        advance(to: 6)
        for _ in 0..<6 {
            app.swipeUp(velocity: .fast)
        }
        sleep(1)
        snap("10-stop6-redplate")

        // 6. Map stop list
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        app.swipeUp(velocity: .slow)
        sleep(1)
        snap("11-map-stoplist")
        app.buttons["map-done"].tap()
        sleep(1)

        // 7. Last stop, end of walk
        advance(to: 11)
        for _ in 0..<8 {
            app.swipeUp(velocity: .fast)
        }
        sleep(1)
        snap("12-stop11-end")

        // 7. Settings
        app.buttons["tour-exit"].tap()
        XCTAssertTrue(app.buttons["home-settings"].waitForExistence(timeout: 5))
        app.buttons["home-settings"].tap()
        XCTAssertTrue(app.buttons["sign-in"].waitForExistence(timeout: 5))
        sleep(1)
        snap("13-settings")
    }
}
