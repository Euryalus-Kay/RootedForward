import Foundation

// ------------------------------------------------------------------
// Tour progress, kept on the device only. Mirrors the site's
// localStorage semantics (rf-walk-hyde-park-v1): a set of visited
// stop ids plus the index of the last stop the walker was on. A stop
// counts as visited when its narration finishes playing.
// ------------------------------------------------------------------

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var visited: Set<String>
    @Published private(set) var lastIndex: Int

    private static let visitedKey = "rf-walk-visited-v1"
    private static let lastIndexKey = "rf-walk-last-index-v1"

    init() {
        visited = Set(UserDefaults.standard.stringArray(forKey: Self.visitedKey) ?? [])
        lastIndex = UserDefaults.standard.integer(forKey: Self.lastIndexKey)
    }

    var hasProgress: Bool { lastIndex > 0 || !visited.isEmpty }

    func isVisited(_ stopID: String) -> Bool {
        visited.contains(stopID)
    }

    func markVisited(_ stopID: String) {
        guard !visited.contains(stopID) else { return }
        visited.insert(stopID)
        UserDefaults.standard.set(Array(visited), forKey: Self.visitedKey)
    }

    func setLastIndex(_ index: Int) {
        lastIndex = max(0, index)
        UserDefaults.standard.set(lastIndex, forKey: Self.lastIndexKey)
    }

    func reset() {
        visited = []
        lastIndex = 0
        UserDefaults.standard.removeObject(forKey: Self.visitedKey)
        UserDefaults.standard.removeObject(forKey: Self.lastIndexKey)
    }
}
