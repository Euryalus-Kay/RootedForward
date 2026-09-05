import SwiftUI

// ------------------------------------------------------------------
// The root of the app. Home is always underneath, from the first
// frame, so the content refresh starts the moment the process does.
// The opening sits on top of it until it has handed the mark to the
// masthead, then it is removed and Home is what remains.
//
// The masthead tells this view where it draws its logo, in window
// coordinates, and hides its own copy until the opening is over. The
// opening flies the drawn mark to that exact rectangle. Two identical
// marks in the same place, one replacing the other on one frame, is
// the whole trick.
// ------------------------------------------------------------------

/// True while the opening is on screen. The masthead reads it to
/// keep its logo out of the way.
private struct LaunchInProgressKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var launchInProgress: Bool {
        get { self[LaunchInProgressKey.self] }
        set { self[LaunchInProgressKey.self] = newValue }
    }
}

/// The masthead's logo rectangle, in window coordinates.
struct MastheadLogoFrameKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        let next = nextValue()
        if next != .zero { value = next }
    }
}

struct LaunchGate: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var launching = Self.shouldPlay
    @State private var logoFrame: CGRect = .zero

    /// UI tests want the home screen at once, and a second scene in
    /// the same process would be a re-run nobody asked for.
    private static var shouldPlay: Bool {
        !ProcessInfo.processInfo.arguments.contains("-uiTestReset")
    }

    var body: some View {
        ZStack {
            HomeView()
                .environment(\.launchInProgress, launching)
                .onPreferenceChange(MastheadLogoFrameKey.self) { logoFrame = $0 }

            if launching {
                LaunchAnimation(target: logoFrame, reduceMotion: reduceMotion) {
                    launching = false
                }
                // Removed on one frame, with no transition, because the
                // mark underneath is already in place.
                .transition(.identity)
            }
        }
    }
}
