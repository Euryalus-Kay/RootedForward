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
//
// The opening also says when the mark leaves for the masthead, and
// from that moment the home screen's sections arrive one after
// another underneath the dissolving paper, so the page is not simply
// revealed but assembled.
// ------------------------------------------------------------------

/// True while the opening is on screen. The masthead reads it to
/// keep its logo out of the way.
private struct LaunchInProgressKey: EnvironmentKey {
    static let defaultValue = false
}

/// 0 while the opening owns the screen, 1 once the home screen has
/// been asked to arrive. Sections of Home ease in on it, each a beat
/// after the last. Outside the opening it is always 1.
private struct LaunchRevealKey: EnvironmentKey {
    static let defaultValue = 1.0
}

extension EnvironmentValues {
    var launchInProgress: Bool {
        get { self[LaunchInProgressKey.self] }
        set { self[LaunchInProgressKey.self] = newValue }
    }
    var launchReveal: Double {
        get { self[LaunchRevealKey.self] }
        set { self[LaunchRevealKey.self] = newValue }
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

/// A section of the home screen arriving after the opening hands off.
/// Rises fourteen points and fades in, each order a beat after the
/// one before. Under Reduce Motion it only fades. Once the opening is
/// over this is a no-op, because reveal is 1 and nothing animates.
struct LaunchReveal: ViewModifier {
    @Environment(\.launchReveal) private var reveal
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let order: Double

    func body(content: Content) -> some View {
        content
            .opacity(reveal)
            .offset(y: reduceMotion ? 0 : (1 - reveal) * 14)
            .animation(
                reduceMotion ? nil : .easeOut(duration: 0.5).delay(0.07 * order),
                value: reveal
            )
    }
}

struct LaunchGate: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var launching = Self.shouldPlay
    @State private var reveal = Self.shouldPlay ? 0.0 : 1.0
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
                .environment(\.launchReveal, reveal)
                .onPreferenceChange(MastheadLogoFrameKey.self) { logoFrame = $0 }

            if launching {
                LaunchAnimation(
                    target: logoFrame,
                    reduceMotion: reduceMotion,
                    onHandoff: {
                        // Sections carry their own timing, so this is a
                        // plain assignment and they take it from here.
                        reveal = 1
                    },
                    onDone: { launching = false }
                )
                // Removed on one frame, with no transition, because the
                // mark underneath is already in place.
                .transition(.identity)
            }
        }
    }
}
