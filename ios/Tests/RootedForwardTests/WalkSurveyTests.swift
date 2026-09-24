import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// The walk survey's data side: the bundled payload carries a survey
// this build can draw, answers encode exactly the way
// /api/walk/survey reads them, and the ledger offers each card once.
// ------------------------------------------------------------------

final class WalkSurveyTests: XCTestCase {
    private func bundledSurvey() throws -> WalkSurvey {
        let url = try XCTUnwrap(
            Bundle.main.url(forResource: "tour", withExtension: "json", subdirectory: "Content")
        )
        let payload = try JSONDecoder().decode(WalkPayload.self, from: Data(contentsOf: url))
        return try XCTUnwrap(payload.survey, "the bundled payload should carry the survey")
    }

    func testBundledSurveyIsDrawable() throws {
        let survey = try bundledSurvey()
        XCTAssertFalse(survey.id.isEmpty)
        for phase in [SurveyPhase.pre, .post] {
            let part = survey.part(phase)
            XCTAssertTrue(part.isDrawable, "\(phase) has a question this build cannot draw")
            // Short by design: a card, not a questionnaire.
            XCTAssertLessThanOrEqual(part.questions.count, 6)
        }
        // The two scales repeat, word for word, so they can be compared.
        let preScales = survey.pre.questions.filter { $0.kind == "scale" }
        let postScales = survey.post.questions.filter { $0.kind == "scale" }
        XCTAssertEqual(preScales, postScales)
        XCTAssertFalse(preScales.isEmpty)
    }

    func testUnknownKindIsNotDrawable() {
        let odd = WalkSurveyQuestion(id: "x", kind: "text", prompt: "?", labels: nil, options: nil)
        XCTAssertFalse(odd.isDrawable)
        let part = WalkSurveyPart(title: "", note: nil, body: "", submit: "", questions: [odd])
        XCTAssertFalse(part.isDrawable)
    }

    func testAnswersEncodeAsTheSiteReadsThem() throws {
        let card = SurveySubmission(
            survey: "impact-2026-09", tour: "hyde-park", phase: .pre,
            respondent: "ABCDEFGHIJKLMNOPQRSTUVWX",
            answers: ["knowledge": .point(2), "role": .option("student")]
        )
        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(card)) as? [String: Any]
        let answers = try XCTUnwrap(json?["answers"] as? [String: Any])
        XCTAssertEqual(answers["knowledge"] as? Int, 2)
        XCTAssertEqual(answers["role"] as? String, "student")
        XCTAssertEqual(json?["phase"] as? String, "pre")
        XCTAssertEqual(json?["platform"] as? String, "ios")
        // An ISO timestamp the site's Date.parse accepts.
        let at = try XCTUnwrap(json?["answeredAt"] as? String)
        XCTAssertNotNil(ISO8601DateFormatter().date(from: at))
        // Round trip, as the outbox stores it on disk.
        let back = try JSONDecoder().decode(SurveySubmission.self, from: JSONEncoder().encode(card))
        XCTAssertEqual(back, card)
    }

    func testLedgerOffersOnceAndKeepsOneCodePerWalk() throws {
        let suite = "rf-survey-tests-\(UUID().uuidString)"
        let defaults = try XCTUnwrap(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        let ledger = SurveyLedger(defaults: defaults)

        XCTAssertFalse(ledger.wasOffered(.pre, survey: "s1", tour: "hyde-park"))
        ledger.markOffered(.pre, survey: "s1", tour: "hyde-park")
        XCTAssertTrue(ledger.wasOffered(.pre, survey: "s1", tour: "hyde-park"))
        // The card after is its own question, and a new survey asks again.
        XCTAssertFalse(ledger.wasOffered(.post, survey: "s1", tour: "hyde-park"))
        XCTAssertFalse(ledger.wasOffered(.pre, survey: "s2", tour: "hyde-park"))

        let code = ledger.respondent(survey: "s1", tour: "hyde-park")
        XCTAssertEqual(code, ledger.respondent(survey: "s1", tour: "hyde-park"))
        XCTAssertNotEqual(code, ledger.respondent(survey: "s1", tour: "west-harlem"))
        // The shape the site and the table both require.
        XCTAssertNotNil(code.range(of: "^[A-Za-z0-9]{16,40}$", options: .regularExpression))
    }
}
