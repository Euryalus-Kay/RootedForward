import Foundation
#if canImport(FirebaseCore)
import FirebaseCore
import FirebaseAnalytics
#endif

// ------------------------------------------------------------------
// Google Ads install measurement.
//
// The App campaign asks how it should connect to the app and offers
// three choices. Google Play is Android only, third-party analytics
// means paying a vendor, so this is Google Analytics, which is the
// Firebase SDK.
//
// It is configured to measure the advertisement and nothing else.
//
//   FirebaseAnalyticsWithoutAdIdSupport, not the default product, so
//   AdSupport and the advertising identifier are not in the binary at
//   all. That is what keeps the app clear of the App Tracking
//   Transparency prompt.
//
//   Ad personalisation signals off, ad-id collection off, both set in
//   Info.plist so they apply before the first event is recorded.
//
//   No custom events, ever. Firebase records its own first_open and
//   session_start, which is what Google Ads counts an install from.
//   Nothing about which stops are opened, how far a walk gets, or how
//   long anyone listens is measured or sent. If a future change wants
//   an event, that is a decision about the walker, not a detail.
//
// Firebase needs GoogleService-Info.plist, which comes from the
// Firebase console and is the owner's to create. Without it the app
// runs exactly as before, so a missing file degrades to the old
// behaviour rather than crashing on launch.
// ------------------------------------------------------------------

enum Measurement {
    /// True once Firebase has a configuration file to read.
    static var isConfigured: Bool {
        Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil
    }

    static func start() {
        #if canImport(FirebaseCore)
        guard isConfigured else {
            // No console project yet. Say so once in a debug build so
            // it is obvious why Google Ads reports nothing.
            #if DEBUG
            print("[measurement] no GoogleService-Info.plist, analytics is off")
            #endif
            return
        }
        FirebaseApp.configure()
        #endif
    }
}
