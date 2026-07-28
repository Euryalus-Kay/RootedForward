import Foundation
import CoreGraphics

// ------------------------------------------------------------------
// Codable mirror of the site's walk tour types (walk-types.ts) as
// served by GET https://rooted-forward.org/api/walk. The bundled
// snapshot in Content/tour.json uses the exact same shape, so one
// decoder handles both.
// ------------------------------------------------------------------

struct WalkPayload: Codable, Equatable {
    let version: String
    let mediaBase: String
    let intro: WalkIntro
    let tour: WalkTour
    let geometry: WalkGeometry
    /// Which walk this is. Absent in the single-tour payloads shipped
    /// before Harlem, where it can only have been Hyde Park.
    let slug: String?
    /// Every walk the site currently has, so the app can list one it is
    /// not holding. Absent in older payloads.
    let tours: [WalkTourSummary]?
    /// How this walk's map is dressed. Absent in older payloads, where
    /// the canvas falls back to its built-in Hyde Park labels.
    let map: WalkMapConfig?

    var id: String { slug ?? "hyde-park" }
}

struct WalkTourSummary: Codable, Equatable, Identifiable {
    let slug: String
    let title: String
    let dek: String
    let startLabel: String
    let stopCount: Int
    let detourCount: Int
    let distanceMiles: Double
    let listenMinutes: Int
    var id: String { slug }
}

struct WalkIntro: Codable, Equatable {
    let title: String
    let paragraphs: [String]
    let byline: String
}

struct WalkTour: Codable, Equatable {
    let title: String
    let dek: String
    let walkMinutes: Int
    let listenMinutes: Int
    let distanceMiles: Double
    let startLabel: String
    let stops: [WalkStop]
    let route: [[Double]]
    /// Dashed spurs to the optional detour stops; absent in older payloads.
    let detourRoutes: [[[Double]]]?
    let practical: [WalkPractical]
    /// The one-screen version of the detour warning; absent in older
    /// payloads, where the alert falls back to its own wording.
    let detourNotice: String?
    /// A place worth going that is not walkable from the route, with
    /// its own audio. Harlem has one; Hyde Park does not.
    let dayTrip: WalkDayTrip?
    /// The claims the research threw out, printed after the sources.
    let checks: WalkChecks?

    /// The walk proper, without the two optional detours. Counting
    /// against this is what lets someone who finishes the walk
    /// actually reach the end of the number.
    var mainline: [WalkStop] { stops.filter { !$0.isDetour } }
}

struct WalkDayTrip: Codable, Equatable {
    let title: String
    let dek: String
    let body: [String]
    let audioSrc: String
    let audioSeconds: Double
    let sources: [WalkSource]?
}

struct WalkChecks: Codable, Equatable {
    let title: String
    let intro: String
    let items: [String]
}

/// The printed plate a walk's map is drawn over and everything set on
/// it. Travels on the payload so a second city needs no App Store
/// release. Mirrors WalkMapConfig in src/lib/tours/walk-utils.ts.
struct WalkMapConfig: Codable, Equatable {
    let baseMapSrc: String
    let areaName: String
    let placeLabels: [WalkMapLabel]
    let streetLabels: [WalkMapStreetLabel]
    let parkAreas: [[[Double]]]
    let campusAreas: [[[Double]]]
    let stopLabelSide: [String: String]
    let detourLegend: String?
}

struct WalkMapLabel: Codable, Equatable {
    let text: String
    let lat: Double
    let lng: Double
    let size: Double
}

struct WalkMapStreetLabel: Codable, Equatable {
    let text: String
    let lat: Double
    let lng: Double
    let rotate: Double
    let size: Double
}

struct WalkPractical: Codable, Equatable, Identifiable {
    let title: String
    let text: String
    var id: String { title }
}

struct WalkStop: Codable, Equatable, Identifiable {
    let id: String
    let number: Int
    let title: String
    let dek: String
    let lat: Double
    let lng: Double
    let audioSrc: String
    let audioSeconds: Double
    let transcript: [String]
    let lookFor: String?
    let images: [WalkImage]
    let nowImage: WalkImage?
    let interrupts: [WalkInterrupt]?
    let toNext: WalkDirections?
    let mapLabel: String
    let sources: [WalkSource]?
    /// True for detour stops off the main route; absent in older payloads.
    let optional: Bool?

    var isDetour: Bool { optional == true }
}

struct WalkImage: Codable, Equatable, Hashable {
    let src: String
    let alt: String
    let credit: String
    let label: String?
    /// Index of the transcript paragraph this photograph follows, so a
    /// picture can sit beside the sentence that explains it. Absent in
    /// older payloads, where every photograph mats above the story.
    let after: Int?
}

struct WalkInterrupt: Codable, Equatable, Identifiable {
    let title: String
    let body: [String]
    /// Index of the transcript paragraph this plate follows. Absent
    /// means it renders after the whole story, the older behavior.
    let after: Int?
    var id: String { title }
}

struct WalkDirections: Codable, Equatable {
    let text: String
    let distanceMeters: Double
    let minutes: Int
}

struct WalkSource: Codable, Equatable, Identifiable {
    let label: String
    let url: String
    var id: String { url }
}

// MARK: - Map geometry (walk-geometry.json, coordinates already in viewBox units)

struct WalkGeometry: Codable, Equatable {
    let source: String
    let frame: WalkFrame
    let viewBox: WalkViewBox
    let water: [WalkWaterBody]
    let roads: WalkRoads
    let rails: [[[Double]]]
}

struct WalkFrame: Codable, Equatable {
    let latMin: Double
    let latMax: Double
    let lngMin: Double
    let lngMax: Double
}

struct WalkViewBox: Codable, Equatable {
    let w: Double
    let h: Double
}

struct WalkWaterBody: Codable, Equatable {
    let name: String
    let ring: [[Double]]
}

struct WalkRoads: Codable, Equatable {
    let arterials: [[[Double]]]
    let locals: [[[Double]]]
    let alleys: [[[Double]]]
}

// MARK: - Formatting helpers (ported from walk-utils.ts)

enum WalkFormat {
    /// "250 ft" under about a fifth of a mile, otherwise "0.4 mi".
    static func distance(meters: Double) -> String {
        let feet = meters * 3.28084
        if feet < 1000 {
            return "\(max(10, Int((feet / 10).rounded()) * 10)) ft"
        }
        let miles = meters / 1609.34
        return String(format: "%.1f mi", miles)
    }

    /// "3:03" from seconds.
    static func clock(seconds: Double) -> String {
        let s = max(0, Int(seconds.rounded()))
        return "\(s / 60):" + String(format: "%02d", s % 60)
    }
}

// MARK: - Projection (ported from walk-utils.ts)

struct WalkProjection {
    let frame: WalkFrame
    let viewBox: WalkViewBox

    func point(lat: Double, lng: Double) -> CGPoint {
        CGPoint(
            x: (lng - frame.lngMin) / (frame.lngMax - frame.lngMin) * viewBox.w,
            y: (frame.latMax - lat) / (frame.latMax - frame.latMin) * viewBox.h
        )
    }

    /// Meters per viewBox unit; both axes match because the viewBox
    /// height already carries the cos(latMid) correction.
    var metersPerUnit: Double {
        (frame.lngMax - frame.lngMin) * 111320
            * cos((frame.latMin + frame.latMax) / 2 * .pi / 180) / viewBox.w
    }

    /// True when a point sits within `padMeters` of the tour frame.
    func isNearFrame(lat: Double, lng: Double, padMeters: Double = 2500) -> Bool {
        let padLat = padMeters / 111320
        let padLng = padMeters / (111320 * cos((frame.latMin + frame.latMax) / 2 * .pi / 180))
        return lat >= frame.latMin - padLat && lat <= frame.latMax + padLat
            && lng >= frame.lngMin - padLng && lng <= frame.lngMax + padLng
    }
}

func haversineMeters(_ aLat: Double, _ aLng: Double, _ bLat: Double, _ bLng: Double) -> Double {
    let r = 6371000.0
    let dLat = (bLat - aLat) * .pi / 180
    let dLng = (bLng - aLng) * .pi / 180
    let s = sin(dLat / 2) * sin(dLat / 2)
        + cos(aLat * .pi / 180) * cos(bLat * .pi / 180) * sin(dLng / 2) * sin(dLng / 2)
    return 2 * r * asin(sqrt(s))
}
