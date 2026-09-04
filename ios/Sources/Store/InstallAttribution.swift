import Foundation
import StoreKit

// ------------------------------------------------------------------
// Telling iOS that this install can be counted.
//
// Google warns that an App campaign will not perform until conversion
// tracking is set up, and offers three ways to do it, all of which are
// somebody's SDK. None of them is needed here, and all of them would
// make the app's own promise of no tracking false.
//
// Apple already does the counting. When someone installs after seeing
// an advertisement, the device itself signs a postback and sends it
// straight to the ad network. The app is not in that path. It carries
// no identifier for the person or the phone, it is aggregated and
// delayed by a day or two, and it is why this needs no App Tracking
// Transparency prompt.
//
// The one thing Apple asks of an advertised app is this call. Apple's
// wording is that the app "needs to call one of the methods that
// update conversion values when the app first launches" in order to
// register attributions. So it is made once per install, with a value
// of zero, which says only that the app was opened. No schema of
// in-app events is defined, because that would be measuring the
// walker rather than the advertisement.
//
// If the install did not come from an advertisement, the call does
// nothing at all.
// ------------------------------------------------------------------

struct InstallAttribution {
    /// The postback window is opened once per install, never again.
    private static let key = "rf-install-counted"

    private let defaults: UserDefaults
    private let open: (Int) async throws -> Void

    init(
        defaults: UserDefaults = .standard,
        open: @escaping (Int) async throws -> Void = { value in
            try await SKAdNetwork.updatePostbackConversionValue(value)
        }
    ) {
        self.defaults = defaults
        self.open = open
    }

    /// True when this install has not been counted yet.
    var pending: Bool { !defaults.bool(forKey: Self.key) }

    /// Counts the install, at most once. Marks it counted before the
    /// call rather than after, because a failure here is not worth
    /// retrying on every launch for the life of the install, and
    /// StoreKit throws for the ordinary case of an install that never
    /// came from an advertisement.
    func countInstall() async {
        guard pending else { return }
        defaults.set(true, forKey: Self.key)
        do {
            try await open(0)
        } catch {
            // Nothing to do and nothing worth logging. Most installs
            // have no advertisement behind them.
        }
    }
}
