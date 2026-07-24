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

    /// A force-killed prior session can relaunch restored onto the
    /// pushed walk screen; pop back to the front door first.
    private func popToHome() {
        if !app.buttons["home-tour-card"].waitForExistence(timeout: 4) {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists {
                back.tap()
            }
        }
    }

    func testCaptureEveryScreen() {
        // 1. The organization's home: mission, then the tours
        popToHome()
        XCTAssertTrue(app.buttons["home-tour-card"].waitForExistence(timeout: 10))
        sleep(2)
        snap("01-org-home")

        // 2. The walk's own screen
        app.buttons["home-tour-card"].tap()
        XCTAssertTrue(app.buttons["home-start"].waitForExistence(timeout: 8))
        sleep(2)
        snap("02-tour-detail")

        // 3. The Why-this-walk essay sheet
        scrollToTap(app.buttons["home-essay-more"])
        XCTAssertTrue(app.buttons["info-done"].waitForExistence(timeout: 5))
        sleep(1)
        snap("03-essay")
        app.buttons["info-done"].tap()
        sleep(1)

        // 4. The red plates index sheet
        scrollToTap(app.buttons["row-The tools of segregation"])
        if !app.buttons["info-done"].waitForExistence(timeout: 5) {
            // A tap swallowed by scroll inertia can land on the stops
            // strip and open the tour (or a photo); back out, retry.
            if app.buttons["photo-close"].exists {
                app.buttons["photo-close"].tap()
                sleep(1)
            }
            if app.buttons["tour-exit"].exists {
                app.buttons["tour-exit"].tap()
                sleep(1)
            }
            scrollToTap(app.buttons["row-The tools of segregation"])
        }
        XCTAssertTrue(app.buttons["info-done"].waitForExistence(timeout: 5))
        sleep(1)
        snap("04-tools-of-segregation")
        app.buttons["info-done"].tap()
        sleep(1)
        for _ in 0..<5 {
            app.swipeDown(velocity: .fast)
        }

        // 5. Straight into stop 1, no intro screen
        app.buttons["home-start"].tap()
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

        // 6. The photograph room
        let photo = app.buttons["stop-photo"].firstMatch
        var tries = 0
        while !photo.isHittable && tries < 4 {
            app.swipeUp(velocity: .fast)
            tries += 1
        }
        sleep(1)
        photo.tap()
        XCTAssertTrue(app.buttons["photo-close"].waitForExistence(timeout: 5))
        sleep(2)
        snap("07-photo-viewer")
        app.buttons["photo-close"].tap()
        sleep(1)

        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("08-stop1-images")
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        app.swipeUp(velocity: .fast)
        sleep(1)
        snap("09-stop1-handoff")

        // 7. Map sheet and the full-screen explorer
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        sleep(2)
        snap("10-map")

        // The map zooms in place now, so there is no second screen.
        // Pull back to the whole route and capture that instead.
        if app.buttons["map-whole-route"].exists {
            app.buttons["map-whole-route"].tap()
            sleep(1)
        }
        snap("11-map-whole-route")

        // Close the map, then walk forward with the transport bar
        // chevrons (row taps in a scrolled sheet are flaky under
        // XCUITest on some simulators; the product path is covered by
        // WalkTourUITests and MapRowTapDiagnostic).
        app.buttons["map-done"].tap()
        sleep(1)

        // 8. Stop 6 has the Restrictive covenants red plate
        advance(to: 6)
        for _ in 0..<6 {
            app.swipeUp(velocity: .fast)
        }
        sleep(1)
        snap("12-stop6-redplate")

        // 9. Map stop list
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        app.swipeUp(velocity: .slow)
        sleep(1)
        snap("13-map-stoplist")
        app.buttons["map-done"].tap()
        sleep(1)

        // 10. The Obama Center, end of the main walk
        advance(to: 13)
        for _ in 0..<8 {
            app.swipeUp(velocity: .fast)
        }
        sleep(1)
        snap("14-stop13-end")

        // 11. Back out to the org home, then settings
        app.buttons["tour-exit"].tap()
        XCTAssertTrue(app.buttons["home-start"].waitForExistence(timeout: 5))
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(app.buttons["home-settings"].waitForExistence(timeout: 5))
        app.buttons["home-settings"].tap()
        XCTAssertTrue(app.buttons["sign-in"].waitForExistence(timeout: 5))
        sleep(1)
        snap("15-settings")
    }

    /// The stop name pins into the top bar only after the on-page
    /// title scrolls away, and unpins when you scroll back up.
    func testPinnedStopTitle() {
        popToHome()
        XCTAssertTrue(app.buttons["home-tour-card"].waitForExistence(timeout: 10))
        app.buttons["home-tour-card"].tap()
        XCTAssertTrue(app.buttons["home-start"].waitForExistence(timeout: 8))
        app.buttons["home-start"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))
        sleep(1)
        // The row holds its height at all times so the page cannot
        // lurch, so this checks what it says rather than whether the
        // element is in the tree.
        let pinned = app.staticTexts["pinned-stop-title"]
        XCTAssertTrue(pinned.waitForExistence(timeout: 4))
        XCTAssertFalse(pinned.label.contains("Cornell"), "title pinned before it scrolled away")

        for _ in 0..<3 {
            app.swipeUp(velocity: .fast)
        }
        sleep(1)
        XCTAssertTrue(pinned.label.contains("Cornell"), "title did not pin after scrolling")
        snap("16-pinned-title")

        for _ in 0..<6 {
            app.swipeDown(velocity: .fast)
        }
        sleep(1)
        XCTAssertFalse(pinned.label.contains("Cornell"), "title stayed pinned back at the top")
    }
}
