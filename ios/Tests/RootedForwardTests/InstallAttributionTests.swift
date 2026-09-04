import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// The install is counted once and only once, and a throw from
// StoreKit (the ordinary case for an install with no advertisement
// behind it) must not leave the app retrying forever.
// ------------------------------------------------------------------

final class InstallAttributionTests: XCTestCase {
    private var suite: String!
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        suite = "install-tests-\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suite)
        super.tearDown()
    }

    func testCountsTheInstallOnce() async {
        var calls: [Int] = []
        let subject = InstallAttribution(defaults: defaults) { calls.append($0) }
        await subject.countInstall()
        await subject.countInstall()
        await subject.countInstall()
        XCTAssertEqual(calls, [0], "one call per install, and the value says only that it opened")
    }

    func testAThrowIsNotRetriedForever() async {
        struct NoAdvert: Error {}
        var attempts = 0
        let subject = InstallAttribution(defaults: defaults) { _ in
            attempts += 1
            throw NoAdvert()
        }
        await subject.countInstall()
        await subject.countInstall()
        XCTAssertEqual(attempts, 1, "most installs have no advert behind them, so a throw is expected")
    }

    func testPendingFlipsAfterCounting() async {
        let subject = InstallAttribution(defaults: defaults) { _ in }
        XCTAssertTrue(subject.pending)
        await subject.countInstall()
        XCTAssertFalse(subject.pending)
    }

    func testSendsNoIdentifierOfAnyKind() async {
        // The whole point. The only thing that leaves is the integer 0.
        var sent: [Int] = []
        let subject = InstallAttribution(defaults: defaults) { sent.append($0) }
        await subject.countInstall()
        XCTAssertEqual(sent, [0])
    }
}
