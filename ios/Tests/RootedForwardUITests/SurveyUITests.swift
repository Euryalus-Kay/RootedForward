import XCTest

// ------------------------------------------------------------------
// The walk survey's first card, end to end on a clean install: it
// comes up as the walk opens, over the intro, Submit waits for every
// answer, answered or skipped it leaves the walker on the intro (never
// past it), and it is never offered twice. Run with -surveyDryRun, so
// nothing is ever posted.
// ------------------------------------------------------------------

extension XCUIApplication {
    /// Other tests are not about the survey. Leave its card if it is up.
    func skipSurveyIfShown() {
        let skip = buttons["survey-skip"]
        if skip.waitForExistence(timeout: 3) {
            skip.tap()
        }
    }
}

final class SurveyUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uiTestReset", "-surveyDryRun"]
        app.launch()
    }

    private func openIntro() {
        let card = app.buttons["home-tour-card"]
        if !card.waitForExistence(timeout: 4) {
            let back = app.navigationBars.buttons.firstMatch
            if back.exists { back.tap() }
        }
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        card.tap()
        let start = app.buttons["home-start"]
        XCTAssertTrue(start.waitForExistence(timeout: 8))
        start.tap()
    }

    /// The intro is on screen and its Next can be pressed, which is only
    /// true once no card is covering it.
    private func assertOnIntro(_ message: String) {
        let next = app.buttons["intro-next"]
        XCTAssertTrue(next.waitForExistence(timeout: 8), message)
        XCTAssertFalse(app.buttons["survey-skip"].exists, message)
        XCTAssertTrue(next.isHittable, message)
    }

    private func scale(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: "survey-scale-\(id)").firstMatch
    }

    func testAnsweredCardLandsOnTheIntroAndIsNotAskedAgain() {
        openIntro()

        let submit = app.buttons["survey-submit"]
        XCTAssertTrue(submit.waitForExistence(timeout: 5))
        XCTAssertFalse(submit.isEnabled, "Submit must wait for every answer")

        // Taps on the rule, on its second and fourth points.
        let knowledge = scale("knowledge")
        XCTAssertTrue(knowledge.exists)
        knowledge.coordinate(withNormalizedOffset: CGVector(dx: 0.27, dy: 0.3)).tap()
        XCTAssertEqual(knowledge.value as? String, "A little")

        let lasting = scale("lasting_effect")
        lasting.coordinate(withNormalizedOffset: CGVector(dx: 0.73, dy: 0.3)).tap()
        XCTAssertEqual(lasting.value as? String, "Quite a bit")

        let opportunity = scale("opportunity")
        opportunity.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3)).tap()
        XCTAssertEqual(opportunity.value as? String, "Somewhat")

        let involvement = scale("involvement")
        involvement.coordinate(withNormalizedOffset: CGVector(dx: 0.96, dy: 0.3)).tap()
        XCTAssertEqual(involvement.value as? String, "Very likely")
        XCTAssertFalse(submit.isEnabled)

        app.buttons["survey-option-student"].tap()
        XCTAssertTrue(submit.isEnabled)
        submit.tap()

        // The card leaves the walker on the intro, not past it.
        sleep(2)
        assertOnIntro("submitting the card should land on the intro")
        XCTAssertFalse(app.staticTexts["stop-title-1"].exists)
        app.buttons["intro-next"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        // Back out and begin again: no card this time.
        app.buttons["tour-exit"].tap()
        let start = app.buttons["home-start"]
        XCTAssertTrue(start.waitForExistence(timeout: 5))
        start.tap()
        XCTAssertFalse(app.buttons["survey-skip"].waitForExistence(timeout: 3))
        assertOnIntro("the walk should open on the intro with no card")
    }

    func testSkipLandsOnTheIntro() {
        openIntro()
        let skip = app.buttons["survey-skip"]
        XCTAssertTrue(skip.waitForExistence(timeout: 5))
        skip.tap()
        sleep(1)
        assertOnIntro("Skip should land on the intro")
        app.buttons["intro-next"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))
    }

    private func snap(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    /// Both cards, captured for review. On a phone of ordinary height
    /// the whole card stands without scrolling, so Submit is on screen
    /// the moment the card appears. The SE is shorter and scrolls.
    func testBothCardsFitAndAreCaptured() {
        app.terminate()
        app.launchArguments = ["-uiTestReset", "-surveyDryRun", "-surveyAnyTime"]
        app.launch()
        let tall = app.windows.firstMatch.frame.height >= 800

        openIntro()
        let submit = app.buttons["survey-submit"]
        XCTAssertTrue(submit.waitForExistence(timeout: 5))
        sleep(1)
        if tall { XCTAssertTrue(submit.isHittable, "the card before should fit without scrolling") }
        snap("survey-pre")
        app.buttons["survey-skip"].tap()
        sleep(1)
        assertOnIntro("Skip should land on the intro")
        snap("intro-after-card")
        app.buttons["intro-next"].tap()
        XCTAssertTrue(app.staticTexts["stop-title-1"].waitForExistence(timeout: 8))

        // The last stop, then down to its closing plate.
        app.buttons["tour-map"].tap()
        XCTAssertTrue(app.buttons["map-done"].waitForExistence(timeout: 5))
        let row = app.buttons["map-stop-16"]
        XCTAssertTrue(row.waitForExistence(timeout: 8))
        row.tap()
        XCTAssertTrue(app.staticTexts["stop-title-16"].waitForExistence(timeout: 8))
        let skip = app.buttons["survey-skip"]
        var swipes = 0
        while !skip.exists && swipes < 14 {
            app.swipeUp(velocity: .fast)
            swipes += 1
            _ = skip.waitForExistence(timeout: 1.5)
        }
        XCTAssertTrue(skip.waitForExistence(timeout: 4), "the card after never came up")
        sleep(1)
        if tall { XCTAssertTrue(submit.isHittable, "the card after should fit without scrolling") }
        snap("survey-post")
        skip.tap()
        XCTAssertFalse(skip.waitForExistence(timeout: 2))
    }

    func testDraggingTheRuleSettlesOnAPoint() {
        openIntro()
        let knowledge = scale("knowledge")
        XCTAssertTrue(knowledge.waitForExistence(timeout: 5))
        let from = knowledge.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0.3))
        let to = knowledge.coordinate(withNormalizedOffset: CGVector(dx: 0.96, dy: 0.3))
        from.press(forDuration: 0.05, thenDragTo: to)
        XCTAssertEqual(knowledge.value as? String, "A lot")
    }
}
