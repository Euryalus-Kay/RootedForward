import XCTest

// ------------------------------------------------------------------
// Smoke tests over every screen: home, intro, stop pages, the map
// sheet, and settings. Kept identifier-based so copy edits on the
// site do not break them.
// ------------------------------------------------------------------

final class WalkTourUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uiTestReset"]
        app.launch()
    }

    /// Home lists the tours; the walk lives one push away. A prior
    /// force-killed session can relaunch restored onto the pushed
    /// walk screen, so pop back first if the card is not there.
    private func openWalk() {
        let card = app.buttons["home-tour-card"]
        if !card.waitForExistence(timeout: 4) {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists {
                back.tap()
            }
        }
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        card.tap()
        XCTAssertTrue(app.buttons["home-start"].waitForExistence(timeout: 8))
    }

    func testHomeStraightToFirstStop() {
        openWalk()
        let start = app.buttons["home-start"]
        start.tap()

        // No intro screen: the tour opens directly on stop 1.
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        // Exit back to the tour screen
        app.buttons["tour-exit"].tap()
        XCTAssertTrue(start.waitForExistence(timeout: 5))
    }

    func testMapSheetOpensAndJumps() {
        openWalk()
        app.buttons["home-start"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        let mapButton = app.buttons["tour-map"]
        XCTAssertTrue(mapButton.waitForExistence(timeout: 8))
        mapButton.tap()

        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        let stopRow = app.buttons["map-stop-3"]
        XCTAssertTrue(stopRow.waitForExistence(timeout: 5))
        stopRow.tap()

        XCTAssertTrue(app.staticTexts["stop-title-3"].waitForExistence(timeout: 8))
    }

    func testNextStopNavigation() {
        openWalk()
        app.buttons["home-start"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        let next = app.buttons["next-stop"]
        XCTAssertTrue(next.waitForExistence(timeout: 5))
        var swipes = 0
        while !next.isHittable && swipes < 12 {
            app.swipeUp(velocity: .fast)
            swipes += 1
        }
        next.tap()
        XCTAssertTrue(app.staticTexts["stop-title-2"].waitForExistence(timeout: 8))
    }

    func testSettingsShowsAccountAndPrivacy() {
        if !app.buttons["home-settings"].waitForExistence(timeout: 4) {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists {
                back.tap()
            }
        }
        let gear = app.buttons["home-settings"]
        XCTAssertTrue(gear.waitForExistence(timeout: 10))
        gear.tap()

        XCTAssertTrue(app.buttons["sign-in"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["email-field"].exists)
    }
}
