import SwiftUI

// ------------------------------------------------------------------
// Entry point. Registers the brand fonts, wires the stores, and
// refreshes tour content from rooted-forward.org whenever the app
// comes to the foreground, so site edits flow into the app.
// ------------------------------------------------------------------

@main
struct RootedForwardApp: App {
    @StateObject private var content: ContentStore
    @StateObject private var progress = ProgressStore()
    @StateObject private var audio = AudioEngine()
    @StateObject private var location = LocationService()
    @StateObject private var account = AccountStore()

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
                .environmentObject(account)
                .tint(RF.rust)
                .onAppear {
                    audio.onFinished = { [weak progress] stopID in
                        progress?.markVisited(stopID)
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
