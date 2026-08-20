import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// The proofreading pass.
//
// These run whichever way the switch is set, because the one thing
// that must never break is the round trip: what the owner types has to
// come back out of the export with the key it belongs to and the exact
// text it replaces, or scripts/walk-apply-edits.mjs cannot place it.
//
// Every store here is built with persisting: false, so a test run
// never reads or overwrites a real pass sitting on the machine.
// ------------------------------------------------------------------

@MainActor
final class BetaEditingTests: XCTestCase {
    private static func load(_ name: String) -> WalkPayload {
        guard let decoded = loadIfBundled(name) else {
            fatalError("Bundled \(name).json failed to decode")
        }
        return decoded
    }

    /// Nil for a walk this build does not ship. Walk Harlem is finished
    /// but unreleased, so it comes out of the bundle between releases
    /// and its checks skip rather than fail.
    private static func loadIfBundled(_ name: String) -> WalkPayload? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "Content"),
              let data = try? Data(contentsOf: url) else {
            return nil
        }
        return try? JSONDecoder().decode(WalkPayload.self, from: data)
    }

    private static let payload = load("tour")
    private static let harlem = loadIfBundled("harlem")
    private static let all: [WalkPayload] = [payload] + (harlem.map { [$0] } ?? [])

    private var stop: WalkStop { Self.payload.tour.stops[0] }

    // MARK: - Keys

    func testKeysNameTheirPlaceInThePayload() {
        XCTAssertEqual(
            EditTarget.transcript("hyde-park", stop, 2).key,
            "hyde-park/stop/\(stop.id)/transcript/2"
        )
        XCTAssertEqual(
            EditTarget.plateBody("harlem", stop, 1, 0).key,
            "harlem/stop/\(stop.id)/plate/1/body/0"
        )
        XCTAssertEqual(
            EditTarget.photo("harlem", stop, 0, .credit).key,
            "harlem/stop/\(stop.id)/photo/0/credit"
        )
        XCTAssertEqual(EditTarget.introParagraph("harlem", 3).key, "harlem/intro/paragraph/3")
        XCTAssertEqual(EditTarget.tourDek("hyde-park").key, "hyde-park/tour/dek")
    }

    /// Two pieces of writing sharing a key would mean one silently
    /// carrying the other's rewrite, which is the worst failure this
    /// whole feature could have.
    func testEveryEditableStringInBothWalksHasItsOwnKey() {
        // The floor counts one walk, because Harlem is only sometimes bundled.
        var seen: Set<String> = []
        for payload in Self.all {
            let slug = payload.id
            var keys: [String] = [
                EditTarget.tourTitle(slug).key,
                EditTarget.tourDek(slug).key,
                EditTarget.startLabel(slug).key,
                EditTarget.introTitle(slug).key,
                EditTarget.introByline(slug).key,
            ]
            keys += payload.intro.paragraphs.indices.map { EditTarget.introParagraph(slug, $0).key }
            keys += payload.tour.practical.indices.flatMap {
                [EditTarget.practicalTitle(slug, $0).key, EditTarget.practicalText(slug, $0).key]
            }
            for stop in payload.tour.stops {
                keys.append(EditTarget.stopTitle(slug, stop).key)
                keys.append(EditTarget.stopDek(slug, stop).key)
                keys.append(EditTarget.directions(slug, stop).key)
                keys += stop.transcript.indices.map { EditTarget.transcript(slug, stop, $0).key }
                for (i, plate) in (stop.interrupts ?? []).enumerated() {
                    keys.append(EditTarget.plateTitle(slug, stop, i).key)
                    keys += plate.body.indices.map { EditTarget.plateBody(slug, stop, i, $0).key }
                }
                let images = stop.images + (stop.nowImage.map { [$0] } ?? [])
                for i in images.indices {
                    keys.append(EditTarget.photo(slug, stop, i, .caption).key)
                    keys.append(EditTarget.photo(slug, stop, i, .credit).key)
                    keys.append(EditTarget.photo(slug, stop, i, .alt).key)
                }
            }
            for key in keys {
                XCTAssertTrue(seen.insert(key).inserted, "two things answer to \(key)")
            }
        }
        XCTAssertGreaterThan(seen.count, 300)
    }

    // MARK: - What the app draws

    func testTheAppDrawsTheRewriteAndThenTheOriginalAgain() throws {
        try XCTSkipUnless(Beta.editing, "the switch is off, so nothing is editable")
        let store = EditStore(persisting: false)
        let target = EditTarget.transcript("hyde-park", stop, 0)
        let original = stop.transcript[0]

        XCTAssertEqual(store.text(target.key, original), original)
        store.save(target: target, original: original, replacement: "Rewritten.", note: nil)
        XCTAssertEqual(store.text(target.key, original), "Rewritten.")
        store.remove(target.key)
        XCTAssertEqual(store.text(target.key, original), original)
    }

    func testANoteLeavesTheWordsAlone() throws {
        try XCTSkipUnless(Beta.editing, "the switch is off, so nothing is editable")
        let store = EditStore(persisting: false)
        let target = EditTarget.stopDek("hyde-park", stop)
        store.save(target: target, original: stop.dek, replacement: stop.dek, note: "Too long.")

        XCTAssertEqual(store.text(target.key, stop.dek), stop.dek)
        XCTAssertEqual(store.changeCount, 0)
        XCTAssertEqual(store.noteCount, 1)
    }

    func testSavingNothingRemovesTheEntry() throws {
        try XCTSkipUnless(Beta.editing, "the switch is off, so nothing is editable")
        let store = EditStore(persisting: false)
        let target = EditTarget.stopTitle("hyde-park", stop)
        store.save(target: target, original: stop.title, replacement: "New name", note: nil)
        XCTAssertEqual(store.total, 1)
        // Retyped back to what it says, with no note left behind.
        store.save(target: target, original: stop.title, replacement: stop.title, note: "  ")
        XCTAssertEqual(store.total, 0)
    }

    // MARK: - The export

    func testTheExportCarriesTheKeyTheOldTextAndTheNew() throws {
        try XCTSkipUnless(Beta.editing, "the switch is off, so nothing is editable")
        let store = EditStore(persisting: false)
        let target = EditTarget.transcript("hyde-park", stop, 1)
        let original = stop.transcript[1]
        store.save(
            target: target, original: original,
            replacement: original + " One more sentence.", note: "Check the date."
        )

        let doc = store.document()
        XCTAssertTrue(doc.contains(target.key))
        XCTAssertTrue(doc.contains(original))
        XCTAssertTrue(doc.contains(original + " One more sentence."))
        XCTAssertTrue(doc.contains("Check the date."))
        // Spoken words changed, so the recording is listed as stale.
        XCTAssertTrue(doc.contains("Narration to regenerate"))
        XCTAssertTrue(doc.contains("Walk Hyde Park"))
    }

    func testTheMachineBlockParsesBackIntoTheSameEdits() throws {
        try XCTSkipUnless(Beta.editing, "the switch is off, so nothing is editable")
        let store = EditStore(persisting: false)
        let target = EditTarget.plateTitle("harlem", stop, 0)
        store.save(target: target, original: "Old plate", replacement: "New plate", note: nil)

        let json = store.json()
        let data = try XCTUnwrap(json.data(using: .utf8))
        let object = try XCTUnwrap(
            try JSONSerialization.jsonObject(with: data) as? [String: Any]
        )
        let list = try XCTUnwrap(object["edits"] as? [[String: Any]])
        XCTAssertEqual(list.count, 1)
        XCTAssertEqual(list[0]["key"] as? String, target.key)
        XCTAssertEqual(list[0]["original"] as? String, "Old plate")
        XCTAssertEqual(list[0]["replacement"] as? String, "New plate")
        // Slashes stay readable, since a key is a path.
        XCTAssertFalse(json.contains("\\/"))
    }

    func testAnEmptyPassSaysSo() {
        let store = EditStore(persisting: false)
        XCTAssertTrue(store.document().contains("Nothing was changed in this pass."))
    }

    func testSlugsReadAsNamesInHeadings() {
        XCTAssertEqual(EditStore.prettySlug("hyde-park"), "Hyde Park")
        XCTAssertEqual(EditStore.prettySlug("harlem"), "Harlem")
    }

    /// With the switch off the store holds nothing back from the page,
    /// whatever is in it, so a shipping build cannot draw an edit.
    func testTheSwitchOffDrawsTheShippedWords() throws {
        try XCTSkipIf(Beta.editing, "the switch is on in this build")
        let store = EditStore(persisting: false)
        let target = EditTarget.transcript("hyde-park", stop, 0)
        store.save(target: target, original: stop.transcript[0], replacement: "Rewritten.", note: nil)
        XCTAssertEqual(store.text(target.key, stop.transcript[0]), stop.transcript[0])
    }
}
