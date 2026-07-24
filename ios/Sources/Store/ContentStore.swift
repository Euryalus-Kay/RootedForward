import Foundation
import UIKit

// ------------------------------------------------------------------
// Content loading and live sync. The app always has a full tour on
// hand: the snapshot bundled at build time (Content/tour.json). On
// launch and on returning to the foreground it asks the site for the
// current version (GET /api/walk) and swaps in newer content, so an
// edit deployed to rooted-forward.org reaches the app without an App
// Store release. Media files resolve bundled-first, then from a
// local download cache, then the network.
// ------------------------------------------------------------------

@MainActor
final class ContentStore: ObservableObject {
    @Published private(set) var payload: WalkPayload
    @Published private(set) var lastRefresh: Date?

    var tour: WalkTour { payload.tour }
    var intro: WalkIntro { payload.intro }
    var geometry: WalkGeometry { payload.geometry }
    var projection: WalkProjection {
        WalkProjection(frame: payload.geometry.frame, viewBox: payload.geometry.viewBox)
    }

    static let endpoint = URL(string: "https://rooted-forward.org/api/walk")!

    private static var cacheURL: URL {
        cacheDirectory.appendingPathComponent("walk.json")
    }

    private static var cacheDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("WalkContent", isDirectory: true)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base
    }

    init() {
        payload = Self.loadInitial()
    }

    /// A payload the UI can actually stand on; decode success alone
    /// is not enough, since a bad deploy of /api/walk would be
    /// cached and crash the app on every launch.
    private static func isUsable(_ payload: WalkPayload) -> Bool {
        !payload.tour.stops.isEmpty && payload.tour.route.count >= 2
    }

    private static func loadInitial() -> WalkPayload {
        let decoder = JSONDecoder()
        if let data = try? Data(contentsOf: cacheURL),
           let cached = try? decoder.decode(WalkPayload.self, from: data),
           isUsable(cached) {
            return cached
        }
        guard let url = Bundle.main.url(forResource: "tour", withExtension: "json", subdirectory: "Content"),
              let data = try? Data(contentsOf: url),
              let bundled = try? decoder.decode(WalkPayload.self, from: data) else {
            fatalError("Bundled tour content is missing or invalid")
        }
        return bundled
    }

    /// Fetches the current tour from the site and swaps it in when the
    /// version changed. Silent on any failure; bundled content always
    /// keeps the app working offline.
    func refresh() async {
        var request = URLRequest(url: Self.endpoint)
        request.timeoutInterval = 15
        request.cachePolicy = .reloadIgnoringLocalCacheData
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            return
        }
        // Decode off the main actor; the payload runs to hundreds of
        // kilobytes and this fires on every foregrounding.
        guard let fresh = await Task.detached(priority: .utility, operation: {
            try? JSONDecoder().decode(WalkPayload.self, from: data)
        }).value, Self.isUsable(fresh) else {
            return
        }
        lastRefresh = Date()
        guard fresh.version != payload.version else { return }
        try? data.write(to: Self.cacheURL, options: .atomic)
        payload = fresh
    }

    // MARK: - Media resolution

    /// The thumbnail variant of an image path, mirroring the site's
    /// convention: /media/hyde-park-walk/x.jpg -> .../thumbs/x.jpg
    static func thumbPath(for sitePath: String) -> String {
        guard let slash = sitePath.lastIndex(of: "/") else { return sitePath }
        return String(sitePath[..<slash]) + "/thumbs" + String(sitePath[slash...])
    }

    /// Resolves a site media path ("/media/hyde-park-walk/...") to a
    /// local file URL when the file is bundled or already downloaded.
    func localMediaURL(for sitePath: String) -> URL? {
        let name = (sitePath as NSString).lastPathComponent
        let subdirectory: String
        if sitePath.contains("/audio/") {
            subdirectory = "Media/audio"
        } else if sitePath.contains("/thumbs/") {
            subdirectory = "Media/thumbs"
        } else {
            subdirectory = "Media/images"
        }
        let ext = (name as NSString).pathExtension
        let base = (name as NSString).deletingPathExtension
        if let bundled = Bundle.main.url(forResource: base, withExtension: ext, subdirectory: subdirectory) {
            return bundled
        }
        let downloaded = Self.cacheDirectory.appendingPathComponent("dl-" + subdirectory.replacingOccurrences(of: "/", with: "-") + "-" + name)
        if FileManager.default.fileExists(atPath: downloaded.path) {
            return downloaded
        }
        return nil
    }

    func remoteMediaURL(for sitePath: String) -> URL {
        URL(string: payload.mediaBase + sitePath) ?? Self.endpoint
    }

    /// Local if available, else remote. Audio and images both go
    /// through here.
    func mediaURL(for sitePath: String) -> URL {
        localMediaURL(for: sitePath) ?? remoteMediaURL(for: sitePath)
    }

    /// Loads an image, bundled-first, downloading and caching new
    /// files the site may have added after this build shipped. The
    /// decode and disk work run off the main actor.
    func image(for sitePath: String) async -> UIImage? {
        let local = localMediaURL(for: sitePath)
        let remote = remoteMediaURL(for: sitePath)
        let name = (sitePath as NSString).lastPathComponent
        let sub = sitePath.contains("/thumbs/") ? "Media-thumbs" : "Media-images"
        let target = Self.cacheDirectory.appendingPathComponent("dl-\(sub)-\(name)")
        return await Self.loadImage(local: local, remote: remote, cacheTarget: target)
    }

    private nonisolated static func loadImage(
        local: URL?,
        remote: URL,
        cacheTarget: URL
    ) async -> UIImage? {
        if let local, let image = UIImage(contentsOfFile: local.path) {
            return image
        }
        guard let (data, response) = try? await URLSession.shared.data(from: remote),
              let http = response as? HTTPURLResponse, http.statusCode == 200,
              let image = UIImage(data: data) else {
            return nil
        }
        try? data.write(to: cacheTarget, options: .atomic)
        return image
    }
}
