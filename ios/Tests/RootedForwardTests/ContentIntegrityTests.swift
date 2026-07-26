import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// Content integrity: the bundled snapshot must always be complete
// enough to run the whole tour offline. These tests catch a bad
// snapshot or a missing media file at build time, not in review.
// ------------------------------------------------------------------

final class ContentIntegrityTests: XCTestCase {
    private static let payload: WalkPayload = {
        guard let url = Bundle.main.url(forResource: "tour", withExtension: "json", subdirectory: "Content"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode(WalkPayload.self, from: data) else {
            fatalError("Bundled tour.json failed to decode")
        }
        return decoded
    }()

    func testTourShape() {
        let tour = Self.payload.tour
        XCTAssertEqual(tour.stops.count, 16)
        XCTAssertEqual(tour.stops.filter { $0.isDetour }.count, 3)
        XCTAssertEqual(tour.title, "Walk Hyde Park")
        XCTAssertFalse(Self.payload.version.isEmpty)
        XCTAssertEqual(Self.payload.intro.paragraphs.count, 11)
        XCTAssertGreaterThanOrEqual(tour.route.count, 30)
        XCTAssertEqual(tour.detourRoutes?.count, 2)
        XCTAssertEqual(tour.practical.count, 4)
        // The seven red instrument plates
        let interrupts = tour.stops.flatMap { $0.interrupts ?? [] }
        XCTAssertEqual(interrupts.count, 7)
    }

    /// Stops render in array order and print their own number, so the
    /// two must agree or the map and the page disagree with each other.
    func testStopsAreNumberedInOrder() {
        for (index, stop) in Self.payload.tour.stops.enumerated() {
            XCTAssertEqual(stop.number, index + 1, "\(stop.id) is out of order")
        }
    }

    /// A photograph or plate anchored past the end of a stop's story
    /// silently disappears on the page, so catch it here instead.
    func testAnchorsPointAtRealParagraphs() {
        for stop in Self.payload.tour.stops {
            let paragraphs = stop.transcript.count
            var images = stop.images
            if let now = stop.nowImage { images.append(now) }
            for image in images {
                guard let after = image.after else { continue }
                XCTAssertTrue(
                    after >= 0 && after < paragraphs,
                    "\(stop.id) anchors an image after paragraph \(after) of \(paragraphs)"
                )
            }
            for plate in stop.interrupts ?? [] {
                guard let after = plate.after else { continue }
                XCTAssertTrue(
                    after >= 0 && after < paragraphs,
                    "\(stop.id) anchors \(plate.title) after paragraph \(after) of \(paragraphs)"
                )
            }
        }
    }

    func testEveryAudioFileIsBundled() {
        for stop in Self.payload.tour.stops {
            let name = (stop.audioSrc as NSString).lastPathComponent
            let base = (name as NSString).deletingPathExtension
            let url = Bundle.main.url(forResource: base, withExtension: "mp3", subdirectory: "Media/audio")
            XCTAssertNotNil(url, "Missing bundled audio for \(stop.id): \(name)")
            XCTAssertGreaterThan(stop.audioSeconds, 30, "Suspicious duration for \(stop.id)")
        }
    }

    func testEveryImageIsBundled() {
        for stop in Self.payload.tour.stops {
            var images = stop.images
            if let now = stop.nowImage { images.append(now) }
            for image in images {
                let name = (image.src as NSString).lastPathComponent
                let base = (name as NSString).deletingPathExtension
                XCTAssertNotNil(
                    Bundle.main.url(forResource: base, withExtension: "jpg", subdirectory: "Media/images"),
                    "Missing bundled image for \(stop.id): \(name)"
                )
                XCTAssertFalse(image.credit.isEmpty, "Image without a credit on \(stop.id)")
            }
            if let thumbSource = (stop.nowImage ?? stop.images.first)?.src {
                let name = (thumbSource as NSString).lastPathComponent
                let base = (name as NSString).deletingPathExtension
                XCTAssertNotNil(
                    Bundle.main.url(forResource: base, withExtension: "jpg", subdirectory: "Media/thumbs"),
                    "Missing thumbnail for \(stop.id)"
                )
            }
        }
    }

    func testProjectionMatchesSite() {
        let projection = WalkProjection(
            frame: Self.payload.geometry.frame,
            viewBox: Self.payload.geometry.viewBox
        )
        for stop in Self.payload.tour.stops {
            let p = projection.point(lat: stop.lat, lng: stop.lng)
            XCTAssertTrue(
                p.x >= 0 && p.x <= Self.payload.geometry.viewBox.w,
                "\(stop.id) projects off the map horizontally"
            )
            XCTAssertTrue(
                p.y >= 0 && p.y <= Self.payload.geometry.viewBox.h,
                "\(stop.id) projects off the map vertically"
            )
            XCTAssertTrue(projection.isNearFrame(lat: stop.lat, lng: stop.lng))
        }
        // Far away is far away
        XCTAssertFalse(projection.isNearFrame(lat: 40.7128, lng: -74.0060))
        XCTAssertGreaterThan(projection.metersPerUnit, 0)
    }

    func testFormatters() {
        XCTAssertEqual(WalkFormat.clock(seconds: 183), "3:03")
        XCTAssertEqual(WalkFormat.clock(seconds: 0), "0:00")
        XCTAssertEqual(WalkFormat.distance(meters: 200), "660 ft")
        XCTAssertEqual(WalkFormat.distance(meters: 1609.34), "1.0 mi")
    }

    func testHaversineSanity() {
        // Stop 1 to stop 2 is a short block, well under a kilometer
        let stops = Self.payload.tour.stops
        let d = haversineMeters(stops[0].lat, stops[0].lng, stops[1].lat, stops[1].lng)
        XCTAssertGreaterThan(d, 20)
        XCTAssertLessThan(d, 1000)
    }
}
