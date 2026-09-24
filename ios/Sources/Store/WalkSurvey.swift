import Foundation

// ------------------------------------------------------------------
// The walk survey's memory and its post.
//
// Two short cards, one when a walker leaves the opening page for stop
// one and one at the end of the walk (SurveyCard, TourView). Each is
// offered once per walk and survey, answered or skipped, and never
// again unless the site starts a new survey id.
//
// What leaves the phone is the card as answered, the walk, the app
// version, the time, and a random code made for this walk and this
// survey so the card before can be paired with the card after. The
// code is sent with nothing else and is not the Firebase installation
// id. Skip sends nothing at all. The privacy policy (section 2.3) and
// Resources/PrivacyInfo.xcprivacy say the same, so keep all three in
// step.
//
// Cards are written to disk before the first try and sent again on
// every foreground until the site takes them, because the end of a
// walk is often a sidewalk with no signal.
// ------------------------------------------------------------------

/// What the phone remembers about the survey, per survey id and walk.
struct SurveyLedger {
    private let defaults: UserDefaults
    init(defaults: UserDefaults = .standard) { self.defaults = defaults }

    private func key(_ what: String, _ survey: String, _ tour: String) -> String {
        "rf-survey-\(what)-\(survey)-\(tour)"
    }

    func wasOffered(_ phase: SurveyPhase, survey: String, tour: String) -> Bool {
        defaults.bool(forKey: key("offered-\(phase.rawValue)", survey, tour))
    }

    func markOffered(_ phase: SurveyPhase, survey: String, tour: String) {
        defaults.set(true, forKey: key("offered-\(phase.rawValue)", survey, tour))
    }

    /// The random code for this walk and this survey, made the first
    /// time a card is sent.
    func respondent(survey: String, tour: String) -> String {
        let k = key("respondent", survey, tour)
        if let existing = defaults.string(forKey: k), existing.count >= 16 {
            return existing
        }
        let made = Self.randomCode()
        defaults.set(made, forKey: k)
        return made
    }

    static func randomCode(length: Int = 24) -> String {
        let alphabet = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
        var rng = SystemRandomNumberGenerator()
        return String((0..<length).map { _ in alphabet.randomElement(using: &rng)! })
    }
}

/// One answer: a point on a scale, 1 to n, or a choice's value.
enum SurveyAnswer: Codable, Equatable {
    case point(Int)
    case option(String)

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let n = try? c.decode(Int.self) {
            self = .point(n)
        } else {
            self = .option(try c.decode(String.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .point(let n): try c.encode(n)
        case .option(let s): try c.encode(s)
        }
    }
}

/// One card, exactly as /api/walk/survey reads it.
struct SurveySubmission: Codable, Equatable {
    let survey: String
    let tour: String
    let phase: String
    let respondent: String
    let answers: [String: SurveyAnswer]
    let answeredAt: String
    let app: String
    let platform: String

    init(
        survey: String, tour: String, phase: SurveyPhase, respondent: String,
        answers: [String: SurveyAnswer], answeredAt: Date = Date()
    ) {
        self.survey = survey
        self.tour = tour
        self.phase = phase.rawValue
        self.respondent = respondent
        self.answers = answers
        self.answeredAt = ISO8601DateFormatter().string(from: answeredAt)
        let info = Bundle.main.infoDictionary
        let version = info?["CFBundleShortVersionString"] as? String ?? "0"
        let build = info?["CFBundleVersion"] as? String ?? "0"
        self.app = "\(version) (\(build))"
        self.platform = "ios"
    }

    /// One card per respondent and phase, the same rule the table has.
    var slot: String { "\(respondent)|\(phase)" }
}

/// Cards waiting for the site. An actor, because a card can be added
/// while an earlier flush is still waiting on the network.
actor SurveyOutbox {
    static let shared = SurveyOutbox()

    /// UI tests answer cards without sending them anywhere.
    private let dryRun = ProcessInfo.processInfo.arguments.contains("-surveyDryRun")

    /// At most this many cards wait on a phone. A phone that never gets
    /// signal again does not grow a file forever.
    private let cap = 40

    private var sending = false

    private let file: URL = {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Survey", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("outbox.json")
    }()

    private func read() -> [SurveySubmission] {
        guard let data = try? Data(contentsOf: file) else { return [] }
        return (try? JSONDecoder().decode([SurveySubmission].self, from: data)) ?? []
    }

    private func write(_ cards: [SurveySubmission]) {
        if cards.isEmpty {
            try? FileManager.default.removeItem(at: file)
            return
        }
        if let data = try? JSONEncoder().encode(cards) {
            try? data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        }
    }

    /// Keeps the card, then tries to send everything waiting.
    func add(_ card: SurveySubmission) async {
        guard !dryRun else { return }
        var cards = read().filter { $0.slot != card.slot }
        cards.append(card)
        write(Array(cards.suffix(cap)))
        await flush()
    }

    /// Clears anything waiting. Only the UI tests' clean slate uses it.
    func discardAll() {
        write([])
    }

    /// Sends what is waiting, oldest first, and stops at the first card
    /// that has to wait, since the next one would wait for the same
    /// reason.
    func flush() async {
        guard !dryRun, !sending else { return }
        sending = true
        defer { sending = false }

        var finished: Set<String> = []
        for card in read() {
            let outcome = await Self.post(card)
            if outcome == .later { break }
            finished.insert(card.slot)
        }
        guard !finished.isEmpty else { return }
        // Re-read rather than write back what was read before the
        // network, so a card added meanwhile is not lost.
        write(read().filter { !finished.contains($0.slot) })
    }

    private enum Outcome { case taken, refused, later }

    private struct Reply: Decodable {
        let migrationPending: Bool?
    }

    private static func post(_ card: SurveySubmission) async -> Outcome {
        guard let url = URL(string: ContentStore.base + "/api/walk/survey"),
              let body = try? JSONEncoder().encode(card) else { return .later }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        request.timeoutInterval = 15
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse else { return .later }
        switch http.statusCode {
        case 200..<300:
            // The site answers this way until the table exists. The
            // card waits here rather than being lost.
            let reply = try? JSONDecoder().decode(Reply.self, from: data)
            return reply?.migrationPending == true ? .later : .taken
        case 408, 429:
            return .later
        case 400..<500:
            // Refused on its content, which a resend cannot change.
            return .refused
        default:
            return .later
        }
    }
}
