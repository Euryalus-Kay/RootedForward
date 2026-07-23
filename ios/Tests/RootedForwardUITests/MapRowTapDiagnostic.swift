import XCTest

// Temporary diagnostic: does a stop-list row tap navigate after the
// map sheet has been scrolled?

final class MapRowTapDiagnostic: XCTestCase {
    func testMapListRowTapAfterScroll() {
        let app = XCUIApplication()
        app.launchArguments = ["-uiTestReset"]
        app.launch()

        app.buttons["home-start"].tap()
        let begin = app.buttons["intro-begin"]
        if begin.waitForExistence(timeout: 5) {
            begin.tap()
        }
        XCTAssertTrue(app.buttons["tour-map"].waitForExistence(timeout: 8))
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        sleep(2)

        app.swipeUp(velocity: .fast)
        sleep(2)

        let row = app.buttons["map-stop-8"]
        XCTAssertTrue(row.waitForExistence(timeout: 5), "row not found")
        XCTAssertTrue(row.isHittable, "row not hittable")
        row.tap()
        XCTAssertTrue(
            app.staticTexts["stop-title-8"].waitForExistence(timeout: 8),
            "List row tap after scroll did not navigate"
        )
    }
}
