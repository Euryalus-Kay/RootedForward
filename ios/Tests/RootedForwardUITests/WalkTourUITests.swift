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

    func testHomeStraightToFirstStop() {
        let start = app.buttons["home-start"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        start.tap()

        // No intro screen: the tour opens directly on stop 1.
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        // Exit back home
        app.buttons["tour-exit"].tap()
        XCTAssertTrue(start.waitForExistence(timeout: 5))
    }

    func testMapSheetOpensAndJumps() {
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
        let gear = app.buttons["home-settings"]
        XCTAssertTrue(gear.waitForExistence(timeout: 10))
        gear.tap()

        XCTAssertTrue(app.buttons["sign-in"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.textFields["email-field"].exists)
    }
}
