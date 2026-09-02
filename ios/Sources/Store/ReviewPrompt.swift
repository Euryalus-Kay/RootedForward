import Foundation

// ------------------------------------------------------------------
// When to ask for a review.
//
// The system prompt is a scarce resource. Apple shows it at most three
// times a year per person and silently swallows the rest, so the only
// thing worth optimising is the moment it is spent. Asking on launch,
// or on a screen appearing, spends it on someone who has not yet got
// anything out of the app, and they rate accordingly.
//
// So it is spent on one of two moments, both of them the end of
// something rather than the middle:
//
//   Finished the walk.   The strongest moment the app has. Asked as
//                        soon as they are back on the walk screen.
//   Three stops in.      Real use, but asked only once they have come
//                        back on a second day, which is the plainest
//                        evidence available that they liked it.
//
// And never while narration is playing, because a walker with the
// phone in a pocket cannot answer it and the prompt is then burned.
//
// What this deliberately does not do is put up a "do you like the
// app?" sheet first and route unhappy answers to a feedback form.
// That collects better-looking ratings by keeping people away from
// the App Store, and it is against the review guidelines.
// ------------------------------------------------------------------

struct ReviewPrompt {
    /// Apple's own annual ceiling. Asking past it is a no-op, so there
    /// is nothing to gain by trying.
    static let lifetimeLimit = 3
    static let restDays = 90.0
    /// Stops that count as having got something out of the tour.
    static let engagedStops = 3

    private let defaults: UserDefaults
    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    private enum Key {
        static let firstUse = "rf-review-first-use"
        static let daysSeen = "rf-review-days-seen"
        static let lastDay = "rf-review-last-day"
        static let askCount = "rf-review-ask-count"
        static let lastAsk = "rf-review-last-ask"
        static let askedVersion = "rf-review-asked-version"
    }

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// Called every time the app comes up, so the app knows how many
    /// separate days someone has chosen to open it.
    func noteLaunch(now: Date = Date()) {
        if defaults.object(forKey: Key.firstUse) == nil {
            defaults.set(now, forKey: Key.firstUse)
        }
        let today = Self.dayFormatter.string(from: now)
        guard defaults.string(forKey: Key.lastDay) != today else { return }
        defaults.set(today, forKey: Key.lastDay)
        defaults.set(daysSeen + 1, forKey: Key.daysSeen)
    }

    var daysSeen: Int { defaults.integer(forKey: Key.daysSeen) }
    var askCount: Int { defaults.integer(forKey: Key.askCount) }

    /// True when this is a moment worth spending the prompt on.
    func shouldAsk(
        stopsVisited: Int,
        mainlineCount: Int,
        audioPlaying: Bool,
        version: String,
        now: Date = Date()
    ) -> Bool {
        // A prompt nobody can answer is a prompt wasted.
        if audioPlaying { return false }
        if askCount >= Self.lifetimeLimit { return false }
        // Never on the first day. A first look is not an opinion.
        guard daysSeen >= 2 || finished(stopsVisited, mainlineCount) else { return false }
        // Not twice for the same release, and not twice in a season.
        if defaults.string(forKey: Key.askedVersion) == version { return false }
        if let last = defaults.object(forKey: Key.lastAsk) as? Date,
           now.timeIntervalSince(last) < Self.restDays * 86400 {
            return false
        }
        // The two moments worth asking at.
        if finished(stopsVisited, mainlineCount) { return true }
        return stopsVisited >= Self.engagedStops && daysSeen >= 2
    }

    func recordAsked(version: String, now: Date = Date()) {
        defaults.set(askCount + 1, forKey: Key.askCount)
        defaults.set(now, forKey: Key.lastAsk)
        defaults.set(version, forKey: Key.askedVersion)
    }

    private func finished(_ visited: Int, _ mainline: Int) -> Bool {
        mainline > 0 && visited >= mainline
    }
}
