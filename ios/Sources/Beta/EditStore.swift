import Foundation

// ------------------------------------------------------------------
// Where the proofreading pass is kept, and how it comes back out.
//
// Every change lives in one JSON file in Application Support, so a
// pass survives quitting the app, and the tour keeps drawing the new
// words until they are either exported and applied or thrown away.
// Nothing here touches the network.
//
// The export is one Markdown document. It is written to be read by a
// person and applied by Claude without guesswork: every entry carries
// its key, the exact text it replaces, and the exact text that should
// stand instead, and the same list repeats as JSON at the foot so
// scripts/walk-apply-edits.mjs can work from it directly.
// ------------------------------------------------------------------

@MainActor
final class EditStore: ObservableObject {
    @Published private(set) var edits: [String: WalkEdit] = [:]
    /// Draws a faint rule beside everything that can be edited. Off by
    /// default, because the point of the build is to read the tour as
    /// it really looks.
    @Published var showMarks: Bool {
        didSet { UserDefaults.standard.set(showMarks, forKey: Self.marksKey) }
    }

    private static let marksKey = "rf-beta-show-marks"

    /// Off for tests, which must not read or overwrite a real pass
    /// sitting on the machine running them.
    private let persisting: Bool

    init(persisting: Bool = true) {
        self.persisting = persisting
        showMarks = UserDefaults.standard.bool(forKey: Self.marksKey)
        guard Beta.editing, persisting else { return }
        load()
    }

    // MARK: - Reading

    func edit(for key: String) -> WalkEdit? { edits[key] }

    /// The text to draw, which is the owner's rewrite when there is one.
    func text(_ key: String, _ original: String) -> String {
        guard Beta.editing, let record = edits[key], record.changesText else {
            return original
        }
        return record.replacement ?? original
    }

    var changeCount: Int { edits.values.filter(\.changesText).count }
    var noteCount: Int { edits.values.filter { !$0.changesText && $0.hasNote }.count }
    var total: Int { edits.count }

    /// How many notes a stop already carries, so the next one gets its
    /// own key rather than overwriting the last.
    func noteCount(forStop stopID: String, slug: String) -> Int {
        edits.values.filter {
            $0.slug == slug && $0.stopID == stopID && $0.key.contains("/note/")
        }.count
    }

    func noteCount(forIntro slug: String) -> Int {
        edits.values.filter { $0.key.hasPrefix("\(slug)/intro/note/") }.count
    }

    /// Reading order: walk, then down the page.
    var sorted: [WalkEdit] {
        edits.values.sorted {
            if $0.slug != $1.slug { return $0.slug < $1.slug }
            let a = $0.stopNumber ?? 0
            let b = $1.stopNumber ?? 0
            if a != b { return a < b }
            if $0.rank != $1.rank { return $0.rank < $1.rank }
            return $0.key < $1.key
        }
    }

    // MARK: - Writing

    func save(
        target: EditTarget,
        original: String,
        replacement: String?,
        note: String?
    ) {
        let cleanNote = (note ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let changed = replacement != nil && replacement != original
        // An entry that changes nothing and says nothing is a removal,
        // whatever the button said.
        guard changed || !cleanNote.isEmpty else {
            remove(target.key)
            return
        }
        edits[target.key] = WalkEdit(
            key: target.key,
            slug: target.slug,
            place: target.place,
            field: target.field,
            original: original,
            replacement: changed ? replacement : nil,
            note: cleanNote.isEmpty ? nil : cleanNote,
            stopID: target.stopID,
            stopNumber: target.stopNumber,
            rank: target.rank,
            narrated: target.narrated,
            updatedAt: Date()
        )
        write()
    }

    func remove(_ key: String) {
        guard edits.removeValue(forKey: key) != nil else { return }
        write()
    }

    func removeAll() {
        edits.removeAll()
        write()
    }

    // MARK: - The file on disk

    private static var fileURL: URL {
        let dir = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("BetaEdits", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("edits.json")
    }

    private func load() {
        guard let data = try? Data(contentsOf: Self.fileURL) else { return }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        guard let list = try? decoder.decode([WalkEdit].self, from: data) else { return }
        edits = Dictionary(uniqueKeysWithValues: list.map { ($0.key, $0) })
    }

    private func write() {
        guard persisting else { return }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(sorted) else { return }
        try? data.write(to: Self.fileURL, options: .atomic)
    }

    // MARK: - The export

    /// "hyde-park" reads as "Hyde Park" in a heading. The slug itself
    /// still travels on every key, so nothing is lost by printing the
    /// readable form above them.
    static func prettySlug(_ slug: String) -> String {
        slug.split(separator: "-")
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: " ")
    }

    private static let stamp: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "d MMMM yyyy, HH:mm"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    private static let fileStamp: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd-HHmm"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    /// The whole pass as one Markdown document.
    func document(now: Date = Date()) -> String {
        let list = sorted
        var out: [String] = []

        out.append("# Rooted Forward tour edits")
        out.append("")
        out.append("Exported \(Self.stamp.string(from: now)). App \(Beta.appVersion).")
        out.append("\(changeCount) text \(changeCount == 1 ? "change" : "changes"), "
            + "\(noteCount) \(noteCount == 1 ? "note" : "notes").")
        out.append("")
        out.append("Hand this whole file back to Claude. Every entry below carries the "
            + "key it belongs to, the exact text it replaces, and the exact text that "
            + "should stand instead, so nothing has to be searched for by hand. The "
            + "JSON block at the foot is the same list in machine form.")
        out.append("")

        if list.isEmpty {
            out.append("Nothing was changed in this pass.")
            out.append("")
            return out.joined(separator: "\n")
        }

        // Anything whose words are spoken puts its recording out of
        // date, which is the one consequence that is easy to forget.
        let narration = list
            .filter { $0.changesText && $0.narrated }
            .reduce(into: [String]()) { acc, edit in
                let line = "Walk \(Self.prettySlug(edit.slug)), \(edit.place)"
                if !acc.contains(line) { acc.append(line) }
            }
        if !narration.isEmpty {
            out.append("## Narration to regenerate")
            out.append("")
            out.append("These stops have changed spoken text, so the recordings no "
                + "longer match what is written.")
            out.append("")
            for line in narration { out.append("- \(line)") }
            out.append("")
        }

        var currentSlug: String?
        var currentPlace: String?
        for edit in list {
            if edit.slug != currentSlug {
                currentSlug = edit.slug
                currentPlace = nil
                out.append("## Walk \(Self.prettySlug(edit.slug))")
                out.append("")
            }
            if edit.place != currentPlace {
                currentPlace = edit.place
                out.append("### \(edit.place)")
                out.append("")
            }

            let kind = edit.changesText
                ? (edit.hasNote ? "Change and note" : "Change")
                : "Note"
            out.append("**\(kind). \(edit.field)**")
            out.append("")
            out.append("key: `\(edit.key)`")
            out.append("")

            if edit.changesText {
                out.append("Was")
                out.append("~~~")
                out.append(edit.original)
                out.append("~~~")
                out.append("")
                out.append("Now")
                out.append("~~~")
                out.append(edit.replacement ?? "")
                out.append("~~~")
                out.append("")
            } else if !edit.original.isEmpty {
                out.append("About this text")
                out.append("~~~")
                out.append(edit.original)
                out.append("~~~")
                out.append("")
            }

            if edit.hasNote {
                out.append("Note")
                out.append("~~~")
                out.append(edit.note ?? "")
                out.append("~~~")
                out.append("")
            }
        }

        out.append("## The same list in machine form")
        out.append("")
        out.append("```json")
        out.append(json(now: now))
        out.append("```")
        out.append("")

        return out.joined(separator: "\n")
    }

    /// The machine copy the apply script reads.
    func json(now: Date = Date()) -> String {
        struct Envelope: Codable {
            let app: String
            let exported: Date
            let edits: [WalkEdit]
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        let envelope = Envelope(app: Beta.appVersion, exported: now, edits: sorted)
        guard let data = try? encoder.encode(envelope),
              let text = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return text
    }

    /// Writes the document somewhere the share sheet can pick it up.
    func exportFile(now: Date = Date()) -> URL? {
        let name = "rooted-forward-edits-\(Self.fileStamp.string(from: now)).md"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        guard let data = document(now: now).data(using: .utf8) else { return nil }
        try? data.write(to: url, options: .atomic)
        return url
    }
}
