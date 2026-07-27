import XCTest

// Does a stop-list row tap navigate when the row is far enough down
// the map sheet that it has to be scrolled to? WalkTourUITests covers
// a row near the top; this covers the last stop of the walk, which is
// where row taps used to get swallowed.
//
// The scrolling is left to XCUITest. The sheet's upper half is the map
// canvas and the map takes pan and zoom gestures, so a hand-rolled
// app.swipeUp() lands on the drawing and never reaches the list.

final class MapRowTapDiagnostic: XCTestCase {
    func testMapListRowTapAfterScroll() {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestReset"]
        app.launch()

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
        app.buttons["home-start"].tap()
        // The walk opens on the "Why this tour" page, which carries no
        // pill row; step through it before reaching for the map.
        let introNext = app.buttons["intro-next"]
        if introNext.waitForExistence(timeout: 6) {
            introNext.tap()
        }
        XCTAssertTrue(app.buttons["tour-map"].waitForExistence(timeout: 8))
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))

        // The last stop of the walk, well below the fold.
        let row = app.buttons["map-stop-16"]
        XCTAssertTrue(row.waitForExistence(timeout: 8), "row not found")
        row.tap()
        XCTAssertTrue(
            app.staticTexts["stop-title-16"].waitForExistence(timeout: 8),
            "List row tap after scroll did not navigate"
        )
    }
}
