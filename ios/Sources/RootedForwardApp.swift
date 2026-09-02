import SwiftUI

// ------------------------------------------------------------------
// Entry point. Registers the brand fonts, wires the stores, and
// refreshes tour content from rooted-forward.org whenever the app
// comes to the foreground, so site edits flow into the app.
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// The app is a portrait app. The one exception is the film, which is
// 16:9 and unreadable letterboxed into a portrait strip, so the player
// is allowed to turn and the rest of the app is not. The delegate is
// the only place iOS will ask, so the gate lives here.
// ------------------------------------------------------------------

final class OrientationGate: NSObject, UIApplicationDelegate {
    /// Portrait everywhere until the film screen opens.
    static var mask: UIInterfaceOrientationMask = .portrait

    func application(
        _ application: UIApplication,
        supportedInterfaceOrientationsFor window: UIWindow?
    ) -> UIInterfaceOrientationMask {
        Self.mask
    }

    /// Opens or closes the gate and asks the window to act on it.
    @MainActor
    static func set(_ mask: UIInterfaceOrientationMask) {
        self.mask = mask
        guard let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene }).first else { return }
        scene.requestGeometryUpdate(.iOS(interfaceOrientations: mask))
        scene.keyWindow?.rootViewController?
            .setNeedsUpdateOfSupportedInterfaceOrientations()
    }
}

@main
struct RootedForwardApp: App {
    @UIApplicationDelegateAdaptor(OrientationGate.self) private var orientation
    @StateObject private var content: ContentStore
    @StateObject private var progress = ProgressStore()
    @StateObject private var audio = AudioEngine()
    @StateObject private var location = LocationService()
    /// The proofreading pass. Always in the environment so the views
    /// compile the same either way; it holds nothing and loads nothing
    /// while Beta.editing is off.
    @StateObject private var edits = EditStore()

    @Environment(\.scenePhase) private var scenePhase

    init() {
        // UI tests launch with a clean slate.
        if ProcessInfo.processInfo.arguments.contains("-uiTestReset"),
           let domain = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: domain)
        }
        BrandFonts.registerAll()
        _content = StateObject(wrappedValue: ContentStore())
    }

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(content)
                .environmentObject(progress)
                .environmentObject(audio)
                .environmentObject(location)
                .environmentObject(edits)
                .tint(RF.rust)
                .onAppear {
                    // How many separate days the app has been opened,
                    // which is what the review prompt leans on.
                    ReviewPrompt().noteLaunch()
                    audio.onFinished = { [weak progress] stopID in
                        progress?.markVisited(stopID)
                        Haptics.success()
                    }
                }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task { await content.refresh() }
            }
        }
    }
}
