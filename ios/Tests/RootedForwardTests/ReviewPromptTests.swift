import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// The rules for spending the review prompt. Each test uses its own
// suite name so nothing leaks between them or into the real defaults.
// ------------------------------------------------------------------

final class ReviewPromptTests: XCTestCase {
    private var suite: String!
    private var defaults: UserDefaults!
    private var prompt: ReviewPrompt!

    override func setUp() {
        super.setUp()
        suite = "review-tests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)
        prompt = ReviewPrompt(defaults: defaults)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suite)
        super.tearDown()
    }

    private func ask(
        visited: Int, mainline: Int = 13, playing: Bool = false,
        version: String = "2.0", now: Date = Date()
    ) -> Bool {
        prompt.shouldAsk(stopsVisited: visited, mainlineCount: mainline,
                         audioPlaying: playing, version: version, now: now)
    }

    // MARK: - The two moments

    func testFinishingTheWalkAsksEvenOnTheFirstDay() {
        prompt.noteLaunch()
        XCTAssertTrue(ask(visited: 13))
    }

    func testThreeStopsOnTheFirstDayDoesNotAsk() {
        prompt.noteLaunch()
        XCTAssertFalse(ask(visited: 3), "a first look is not an opinion")
    }

    func testThreeStopsAsksOnceTheyHaveComeBack() {
        let day1 = Date(timeIntervalSince1970: 1_800_000_000)
        prompt.noteLaunch(now: day1)
        prompt.noteLaunch(now: day1.addingTimeInterval(86400))
        XCTAssertEqual(prompt.daysSeen, 2)
        XCTAssertTrue(ask(visited: 3))
    }

    func testTwoStopsIsNotEnough() {
        let day1 = Date(timeIntervalSince1970: 1_800_000_000)
        prompt.noteLaunch(now: day1)
        prompt.noteLaunch(now: day1.addingTimeInterval(86400))
        XCTAssertFalse(ask(visited: 2))
    }

    // MARK: - What blocks it

    func testNeverWhileNarrationIsPlaying() {
        prompt.noteLaunch()
        XCTAssertFalse(ask(visited: 13, playing: true),
                       "a phone in a pocket cannot answer it")
    }

    func testNotTwiceForTheSameRelease() {
        prompt.noteLaunch()
        XCTAssertTrue(ask(visited: 13))
        prompt.recordAsked(version: "2.0")
        XCTAssertFalse(ask(visited: 13))
    }

    func testANewReleaseWaitsOutTheRestPeriod() {
        let t0 = Date(timeIntervalSince1970: 1_800_000_000)
        prompt.noteLaunch(now: t0)
        prompt.recordAsked(version: "2.0", now: t0)
        let soon = t0.addingTimeInterval(30 * 86400)
        XCTAssertFalse(ask(visited: 13, version: "2.1", now: soon))
        let later = t0.addingTimeInterval(120 * 86400)
        XCTAssertTrue(ask(visited: 13, version: "2.1", now: later))
    }

    func testItStopsAtApplesOwnCeiling() {
        var t = Date(timeIntervalSince1970: 1_800_000_000)
        prompt.noteLaunch(now: t)
        for i in 1...ReviewPrompt.lifetimeLimit {
            XCTAssertTrue(ask(visited: 13, version: "v\(i)", now: t), "ask \(i) should fire")
            prompt.recordAsked(version: "v\(i)", now: t)
            t = t.addingTimeInterval(200 * 86400)
        }
        XCTAssertEqual(prompt.askCount, ReviewPrompt.lifetimeLimit)
        XCTAssertFalse(ask(visited: 13, version: "v99", now: t),
                       "past three a year the system swallows it anyway")
    }

    // MARK: - Day counting

    func testTheSameDayCountsOnce() {
        let t = Date(timeIntervalSince1970: 1_800_000_000)
        prompt.noteLaunch(now: t)
        prompt.noteLaunch(now: t.addingTimeInterval(3600))
        prompt.noteLaunch(now: t.addingTimeInterval(7200))
        XCTAssertEqual(prompt.daysSeen, 1)
    }

    func testAWalkWithNoStopsNeverCountsAsFinished() {
        prompt.noteLaunch()
        XCTAssertFalse(ask(visited: 0, mainline: 0))
    }
}
