import XCTest
@testable import RootedForward

// ------------------------------------------------------------------
// Content integrity: every bundled snapshot must be complete enough to
// run its whole walk offline. These tests catch a bad snapshot or a
// missing media file at build time, not in review. Everything except
// the per-walk shape check runs over both cities.
// ------------------------------------------------------------------

final class ContentIntegrityTests: XCTestCase {
    private static func load(_ name: String) -> WalkPayload {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "Content"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode(WalkPayload.self, from: data) else {
            fatalError("Bundled \(name).json failed to decode")
        }
        return decoded
    }

    /// Hyde Park keeps the file name it had when it was the only walk.
    private static let payload = load("tour")
    private static let harlem = load("harlem")
    private static let all: [WalkPayload] = [payload, harlem]

    func testHydeParkShape() {
        let tour = Self.payload.tour
        XCTAssertEqual(tour.stops.count, 16)
        XCTAssertEqual(tour.stops.filter { $0.isDetour }.count, 3)
        XCTAssertEqual(tour.title, "Walk Hyde Park")
        XCTAssertFalse(Self.payload.version.isEmpty)
        XCTAssertEqual(Self.payload.intro.paragraphs.count, 9)
        XCTAssertGreaterThanOrEqual(tour.route.count, 30)
        // One spur, because all three detours branch off stop eleven
        // and rejoin at stop fifteen.
        XCTAssertEqual(tour.detourRoutes?.count, 1)
        XCTAssertEqual(tour.practical.count, 4)
        // The seven red instrument plates
        let interrupts = tour.stops.flatMap { $0.interrupts ?? [] }
        XCTAssertEqual(interrupts.count, 7)
        // Hyde Park has neither of the sections Harlem added
        XCTAssertNil(tour.dayTrip)
        XCTAssertNil(tour.checks)
    }

    func testHarlemShape() {
        let tour = Self.harlem.tour
        XCTAssertEqual(tour.title, "Walk Harlem")
        XCTAssertEqual(tour.stops.count, 17)
        XCTAssertEqual(tour.stops.filter { $0.isDetour }.count, 1)
        XCTAssertEqual(Self.harlem.intro.paragraphs.count, 9)
        XCTAssertEqual(tour.practical.count, 4)
        // One spur, out to Morningside Park and back to the Apollo
        XCTAssertEqual(tour.detourRoutes?.count, 1)
        let interrupts = tour.stops.flatMap { $0.interrupts ?? [] }
        XCTAssertEqual(interrupts.count, 8)
        // The day trip is narrated, so it needs real audio behind it
        XCTAssertEqual(tour.dayTrip?.title, "Addisleigh Park, St. Albans, Queens")
        XCTAssertGreaterThan(tour.dayTrip?.audioSeconds ?? 0, 30)
        XCTAssertEqual(tour.checks?.items.count, 24)
    }

    /// Both walks pour into one flat Media folder, where ContentStore
    /// resolves a path by its file name alone, so a name used twice
    /// would have one walk quietly wearing the other's picture.
    func testMediaFileNamesDoNotCollideBetweenWalks() {
        var seen: [String: String] = [:]
        for payload in Self.all {
            for stop in payload.tour.stops {
                var paths = stop.images.map(\.src) + [stop.audioSrc]
                if let now = stop.nowImage { paths.append(now.src) }
                for path in paths {
                    let name = (path as NSString).lastPathComponent
                    if let owner = seen[name], owner != payload.id {
                        XCTFail("\(name) is used by both \(owner) and \(payload.id)")
                    }
                    seen[name] = payload.id
                }
            }
        }
    }

    /// Every walk must name its own map, or the canvas silently draws
    /// Hyde Park's labels over another city.
    func testEveryWalkCarriesItsOwnMap() {
        for payload in Self.all {
            let map = payload.map
            XCTAssertNotNil(map, "\(payload.id) has no map config")
            XCTAssertFalse(map?.areaName.isEmpty ?? true, "\(payload.id) has no area name")
            XCTAssertFalse(map?.baseMapSrc.isEmpty ?? true, "\(payload.id) has no base map")
            let name = ((map?.baseMapSrc ?? "") as NSString).lastPathComponent
            let base = (name as NSString).deletingPathExtension
            XCTAssertNotNil(
                Bundle.main.url(forResource: base, withExtension: "jpg", subdirectory: "Media/images"),
                "\(payload.id) base map is not bundled: \(name)"
            )
            XCTAssertGreaterThan(map?.placeLabels.count ?? 0, 3)
        }
    }

    /// Stops render in array order and print their own number, so the
    /// two must agree or the map and the page disagree with each other.
    func testStopsAreNumberedInOrder() {
        for payload in Self.all {
            for (index, stop) in payload.tour.stops.enumerated() {
                XCTAssertEqual(stop.number, index + 1, "\(stop.id) is out of order")
            }
        }
    }

    /// A photograph or plate anchored past the end of a stop's story
    /// silently disappears on the page, so catch it here instead.
    func testAnchorsPointAtRealParagraphs() {
        for payload in Self.all {
            for stop in payload.tour.stops {
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
    }

    func testEveryAudioFileIsBundled() {
        for payload in Self.all {
            var clips = payload.tour.stops.map { (id: $0.id, src: $0.audioSrc, seconds: $0.audioSeconds) }
            if let trip = payload.tour.dayTrip {
                clips.append((id: "day trip", src: trip.audioSrc, seconds: trip.audioSeconds))
            }
            for clip in clips {
                let name = (clip.src as NSString).lastPathComponent
                let base = (name as NSString).deletingPathExtension
                let url = Bundle.main.url(forResource: base, withExtension: "mp3", subdirectory: "Media/audio")
                XCTAssertNotNil(url, "Missing bundled audio for \(clip.id): \(name)")
                XCTAssertGreaterThan(clip.seconds, 30, "Suspicious duration for \(clip.id)")
            }
        }
    }

    func testEveryImageIsBundled() {
        for payload in Self.all {
            for stop in payload.tour.stops {
                var images = stop.images
                if let now = stop.nowImage { images.append(now) }
                XCTAssertFalse(images.isEmpty, "\(stop.id) has no picture at all")
                for image in images {
                    let name = (image.src as NSString).lastPathComponent
                    let base = (name as NSString).deletingPathExtension
                    XCTAssertNotNil(
                        Bundle.main.url(forResource: base, withExtension: "jpg", subdirectory: "Media/images"),
                        "Missing bundled image for \(stop.id): \(name)"
                    )
                    XCTAssertFalse(image.credit.isEmpty, "Image without a credit on \(stop.id)")
                    XCTAssertFalse(image.alt.isEmpty, "Image without alt text on \(stop.id)")
                }
                // the plate index and the map markers both read a thumb
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
    }

    /// Each walk projects against its own frame, so a stop landing off
    /// the plate means the geometry and the coordinates disagree.
    func testProjectionMatchesSite() {
        for payload in Self.all {
            let projection = WalkProjection(
                frame: payload.geometry.frame,
                viewBox: payload.geometry.viewBox
            )
            for stop in payload.tour.stops {
                let p = projection.point(lat: stop.lat, lng: stop.lng)
                XCTAssertTrue(
                    p.x >= 0 && p.x <= payload.geometry.viewBox.w,
                    "\(stop.id) projects off the \(payload.id) map horizontally"
                )
                XCTAssertTrue(
                    p.y >= 0 && p.y <= payload.geometry.viewBox.h,
                    "\(stop.id) projects off the \(payload.id) map vertically"
                )
                XCTAssertTrue(projection.isNearFrame(lat: stop.lat, lng: stop.lng))
            }
            // Lower Manhattan is far from Hyde Park and far enough
            // below Harlem's frame to stay outside it too.
            XCTAssertFalse(projection.isNearFrame(lat: 40.7128, lng: -74.0060))
            XCTAssertGreaterThan(projection.metersPerUnit, 0)
        }
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
