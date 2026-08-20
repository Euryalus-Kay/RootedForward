import Foundation

// ------------------------------------------------------------------
// The proofreading build.
//
// With the switch below on, every piece of writing in the app becomes
// tappable. Tap it, retype it, add a note, and the change is held on
// the phone and shown in place so the tour can be read as it would
// stand. Nothing is uploaded and nothing on the site moves. When the
// pass is done, Settings exports one document holding every change,
// every note, and the exact text each one replaces, which is what
// goes back to Claude to be applied to the real content.
//
// With the switch off none of it exists. No gestures, no marks, no
// stored file, no extra rows, and the screens are byte for byte the
// app that ships.
// ------------------------------------------------------------------

enum Beta {
    /* -------------------------------------------------------------- */
    /*  THE SWITCH.                                                    */
    /*                                                                 */
    /*  true   a proofreading build for the owner's phone. Text is     */
    /*         tappable, edits are held locally, Settings exports the  */
    /*         document. Never submit a build with this on. The home   */
    /*         screen wears a visible band while it is, so a build     */
    /*         cannot be archived by accident without it showing.      */
    /*                                                                 */
    /*  false  the shipping app. Nothing below runs.                   */
    /* -------------------------------------------------------------- */
    static let editing = false

    /// Printed on the export so a document can be traced to a build.
    static var appVersion: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "0"
        return "\(short) (\(build))"
    }
}

// MARK: - What is being edited

/// One editable piece of writing. Built at the point it is drawn, so
/// the store never has to know the shape of a tour.
struct EditTarget: Equatable {
    /// The machine anchor, e.g. `harlem/stop/hotel-theresa/transcript/2`.
    /// Stable across content refreshes because it is built from slugs
    /// and positions rather than from the words themselves.
    let key: String
    /// Which walk, so the export groups by tour.
    let slug: String
    /// Where the words are, in the owner's terms.
    let place: String
    /// Which words, in the owner's terms.
    let field: String
    var stopID: String?
    var stopNumber: Int?
    /// Order within a stop, so the export reads down the page rather
    /// than in whatever order things were tapped.
    var rank: Double
    /// True when changing this text puts the recorded narration out of
    /// date, which the export lists separately.
    var narrated: Bool

    init(
        key: String,
        slug: String,
        place: String,
        field: String,
        stopID: String? = nil,
        stopNumber: Int? = nil,
        rank: Double = 0,
        narrated: Bool = false
    ) {
        self.key = key
        self.slug = slug
        self.place = place
        self.field = field
        self.stopID = stopID
        self.stopNumber = stopNumber
        self.rank = rank
        self.narrated = narrated
    }
}

extension EditTarget {
    private static func place(_ stop: WalkStop) -> String {
        "Stop \(stop.number), \(stop.title)"
    }

    // MARK: Stops

    static func stopTitle(_ slug: String, _ stop: WalkStop) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/title", slug: slug,
            place: place(stop), field: "Stop title",
            stopID: stop.id, stopNumber: stop.number, rank: 1
        )
    }

    static func stopDek(_ slug: String, _ stop: WalkStop) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/dek", slug: slug,
            place: place(stop), field: "The line under the title",
            stopID: stop.id, stopNumber: stop.number, rank: 2
        )
    }

    static func transcript(_ slug: String, _ stop: WalkStop, _ index: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/transcript/\(index)", slug: slug,
            place: place(stop), field: "Transcript, paragraph \(index + 1)",
            stopID: stop.id, stopNumber: stop.number,
            rank: 10 + Double(index) / 1000, narrated: true
        )
    }

    static func plateTitle(_ slug: String, _ stop: WalkStop, _ plate: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/plate/\(plate)/title", slug: slug,
            place: place(stop), field: "Red plate \(plate + 1), title",
            stopID: stop.id, stopNumber: stop.number,
            rank: 30 + Double(plate)
        )
    }

    static func plateBody(
        _ slug: String, _ stop: WalkStop, _ plate: Int, _ paragraph: Int
    ) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/plate/\(plate)/body/\(paragraph)", slug: slug,
            place: place(stop),
            field: "Red plate \(plate + 1), paragraph \(paragraph + 1)",
            stopID: stop.id, stopNumber: stop.number,
            rank: 30 + Double(plate) + Double(paragraph + 1) / 1000
        )
    }

    /// Which part of a photograph's paperwork is being changed.
    enum PhotoField: String {
        case caption
        case credit
        case alt

        var label: String {
            switch self {
            case .caption: return "Photograph caption"
            case .credit: return "Photograph credit"
            case .alt: return "Photograph description for VoiceOver"
            }
        }

        var rank: Double {
            switch self {
            case .caption: return 0.1
            case .credit: return 0.2
            case .alt: return 0.3
            }
        }
    }

    static func photo(
        _ slug: String, _ stop: WalkStop, _ index: Int, _ field: PhotoField
    ) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/photo/\(index)/\(field.rawValue)", slug: slug,
            place: place(stop), field: "\(field.label), photograph \(index + 1)",
            stopID: stop.id, stopNumber: stop.number,
            rank: 60 + Double(index) + field.rank
        )
    }

    static func directions(_ slug: String, _ stop: WalkStop) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/next/text", slug: slug,
            place: place(stop), field: "Walking directions to the next stop",
            stopID: stop.id, stopNumber: stop.number, rank: 80
        )
    }

    /// A comment tied to the stop rather than to any one sentence.
    static func note(_ slug: String, _ stop: WalkStop, _ n: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/stop/\(stop.id)/note/\(n)", slug: slug,
            place: place(stop), field: "Note on this stop",
            stopID: stop.id, stopNumber: stop.number, rank: 90 + Double(n)
        )
    }

    // MARK: Everything that is not a stop

    static func introTitle(_ slug: String) -> EditTarget {
        EditTarget(
            key: "\(slug)/intro/title", slug: slug,
            place: "Why this walk", field: "Title", stopNumber: 0, rank: 20
        )
    }

    static func introParagraph(_ slug: String, _ index: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/intro/paragraph/\(index)", slug: slug,
            place: "Why this walk", field: "Paragraph \(index + 1)",
            stopNumber: 0, rank: 21 + Double(index) / 1000
        )
    }

    static func introByline(_ slug: String) -> EditTarget {
        EditTarget(
            key: "\(slug)/intro/byline", slug: slug,
            place: "Why this walk", field: "Byline", stopNumber: 0, rank: 22
        )
    }

    static func introNote(_ slug: String, _ n: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/intro/note/\(n)", slug: slug,
            place: "Why this walk", field: "Note on this page",
            stopNumber: 0, rank: 23 + Double(n) / 1000
        )
    }

    static func tourTitle(_ slug: String) -> EditTarget {
        EditTarget(
            key: "\(slug)/tour/title", slug: slug,
            place: "The walk screen", field: "Walk title", stopNumber: 0, rank: 1
        )
    }

    static func tourDek(_ slug: String) -> EditTarget {
        EditTarget(
            key: "\(slug)/tour/dek", slug: slug,
            place: "The walk screen", field: "The sentence under the title",
            stopNumber: 0, rank: 2
        )
    }

    static func startLabel(_ slug: String) -> EditTarget {
        EditTarget(
            key: "\(slug)/tour/startLabel", slug: slug,
            place: "The walk screen", field: "Where the walk starts",
            stopNumber: 0, rank: 3
        )
    }

    static func practicalTitle(_ slug: String, _ index: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/practical/\(index)/title", slug: slug,
            place: "About this walk", field: "Card \(index + 1), title",
            stopNumber: 0, rank: 10 + Double(index) / 10
        )
    }

    static func practicalText(_ slug: String, _ index: Int) -> EditTarget {
        EditTarget(
            key: "\(slug)/practical/\(index)/text", slug: slug,
            place: "About this walk", field: "Card \(index + 1), body",
            stopNumber: 0, rank: 10 + Double(index) / 10 + 0.01
        )
    }
}

// MARK: - One recorded change

struct WalkEdit: Codable, Identifiable, Equatable {
    let key: String
    let slug: String
    let place: String
    let field: String
    /// The text the build shipped with, kept verbatim so the change can
    /// be applied to the source by exact match rather than by hunting.
    let original: String
    /// The owner's rewrite. Nil when the entry is only a note.
    var replacement: String?
    /// The owner's comment, which can stand alone or ride a rewrite.
    var note: String?
    var stopID: String?
    var stopNumber: Int?
    var rank: Double
    var narrated: Bool
    var updatedAt: Date

    var id: String { key }

    var changesText: Bool {
        guard let replacement else { return false }
        return replacement != original
    }

    var hasNote: Bool {
        !(note ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var isEmpty: Bool { !changesText && !hasNote }

    /// What the app should draw for this piece of text.
    var display: String { changesText ? (replacement ?? original) : original }
}
