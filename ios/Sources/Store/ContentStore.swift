import Foundation
import UIKit

// ------------------------------------------------------------------
// Content loading and live sync. The app always has a full tour on
// hand, from the snapshots bundled at build time under Content/. On
// launch and on returning to the foreground it asks the site for the
// current version of each walk (GET /api/walk, ?tour= for the rest)
// and swaps in newer content, so an edit deployed to
// rooted-forward.org reaches the app without an App Store release.
// Media files resolve bundled-first, then from a local download
// cache, then the network.
//
// Hyde Park keeps the names it had when it was the only walk, both the
// bundled Content/tour.json and the cached walk.json, so a build
// upgrading in place finds its content exactly where it left it.
// ------------------------------------------------------------------

/// The walk the app opens on, and the one /api/walk answers with when
/// asked without a parameter.
let DEFAULT_SLUG = "hyde-park"

/// The walks whose content and media ship inside the app, so they work
/// with no signal. Anything else on the site is fetched on demand.
///
/// Walk Harlem is finished and lives in this repo, but it is not
/// released yet, so it is not in the shipped bundle and the app does
/// not list it. This mirrors HARLEM_LIVE in src/lib/tours/registry.ts
/// on the site. To ship it, add "harlem" back here, set WALKS in
/// prep-media.sh to match, run ./prep-media.sh, and flip the site
/// switch in the same release.
let BUNDLED_SLUGS = [DEFAULT_SLUG]

@MainActor
final class ContentStore: ObservableObject {
    /// Every walk the app is holding, by slug. Both ship bundled; a
    /// third city added on the site arrives over the network.
    @Published private(set) var payloads: [String: WalkPayload]
    /// The walk the tour screens are currently showing.
    @Published private(set) var selected: String
    @Published private(set) var lastRefresh: Date?

    /// The walks on offer, whether or not they are loaded yet. Read off
    /// whichever payload carries the index; older ones carry none, so
    /// this falls back to what is actually in hand.
    var catalogue: [WalkTourSummary] {
        if let listed = payloads.values.compactMap({ $0.tours }).first(where: { !$0.isEmpty }) {
            return listed
        }
        return payloads.values.map { p in
            WalkTourSummary(
                slug: p.id, title: p.tour.title, dek: p.tour.dek,
                startLabel: p.tour.startLabel,
                stopCount: p.tour.mainline.count,
                detourCount: p.tour.stops.count - p.tour.mainline.count,
                distanceMiles: p.tour.distanceMiles,
                listenMinutes: p.tour.listenMinutes
            )
        }
        .sorted { $0.slug < $1.slug }
    }

    /// True for a walk listed on the site that we do not hold yet.
    func isLoaded(_ slug: String) -> Bool { payloads[slug] != nil }

    var payload: WalkPayload {
        payloads[selected] ?? payloads.values.first!
    }
    /// Which walk the screens are drawing, by the slug the site and the
    /// API use. Older payloads carry none, and could only be Hyde Park.
    var slug: String { payload.id }
    var tour: WalkTour { payload.tour }
    var intro: WalkIntro { payload.intro }
    var geometry: WalkGeometry { payload.geometry }
    var map: WalkMapConfig? { payload.map }
    var projection: WalkProjection {
        WalkProjection(frame: payload.geometry.frame, viewBox: payload.geometry.viewBox)
    }

    /// Point the tour screens at another walk, fetching it if this is
    /// the first time it has been asked for.
    func select(_ slug: String) {
        guard payloads[slug] != nil else {
            Task { await load(slug); selected = slug }
            return
        }
        selected = slug
    }

    /// Production, unless a launch argument points somewhere else.
    /// Passing `-contentBase http://localhost:3000` lets a build under
    /// test read a dev server, so content changes can be checked
    /// before they are deployed.
    static var base: String {
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-contentBase"), i + 1 < args.count {
            return args[i + 1]
        }
        return "https://rooted-forward.org"
    }

    /// The default walk answers on the bare path, which is the URL the
    /// build already with Apple asks for. Do not add a parameter there.
    static func endpoint(_ slug: String) -> URL {
        let path = slug == DEFAULT_SLUG ? "/api/walk" : "/api/walk?tour=\(slug)"
        return URL(string: base + path) ?? URL(string: "https://rooted-forward.org/api/walk")!
    }

    static var endpoint: URL { endpoint(DEFAULT_SLUG) }

    private static func cacheURL(_ slug: String) -> URL {
        // "walk.json" was the single-tour name and still holds Hyde Park,
        // so a build upgrading in place keeps its cached copy.
        cacheDirectory.appendingPathComponent(
            slug == DEFAULT_SLUG ? "walk.json" : "walk-\(slug).json"
        )
    }

    private static var cacheDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("WalkContent", isDirectory: true)
        try? FileManager.default.createDirectory(at: base, withIntermediateDirectories: true)
        return base
    }

    init() {
        payloads = Self.loadInitial()
        selected = DEFAULT_SLUG
    }

    /// A payload the UI can actually stand on; decode success alone
    /// is not enough, since a bad deploy of /api/walk would be
    /// cached and crash the app on every launch.
    private static func isUsable(_ payload: WalkPayload) -> Bool {
        !payload.tour.stops.isEmpty && payload.tour.route.count >= 2
    }

    /// Bundled snapshot file for a walk. Hyde Park keeps the original
    /// "tour" name so an in-place upgrade finds it where it always was.
    private static func bundledName(_ slug: String) -> String {
        slug == DEFAULT_SLUG ? "tour" : slug
    }

    private static func loadOne(_ slug: String) -> WalkPayload? {
        let decoder = JSONDecoder()
        if let data = try? Data(contentsOf: cacheURL(slug)),
           let cached = try? decoder.decode(WalkPayload.self, from: data),
           isUsable(cached) {
            return cached
        }
        guard let url = Bundle.main.url(
                forResource: bundledName(slug), withExtension: "json", subdirectory: "Content"),
              let data = try? Data(contentsOf: url),
              let bundled = try? decoder.decode(WalkPayload.self, from: data) else {
            return nil
        }
        return bundled
    }

    private static func loadInitial() -> [String: WalkPayload] {
        var out: [String: WalkPayload] = [:]
        for slug in BUNDLED_SLUGS {
            if let p = loadOne(slug) { out[slug] = p }
        }
        // The default walk is the one screen the app cannot open without.
        guard out[DEFAULT_SLUG] != nil else {
            fatalError("Bundled tour content is missing or invalid")
        }
        return out
    }

    /// Fetches one walk from the site and swaps it in when the version
    /// changed. Silent on any failure; bundled content always keeps the
    /// app working offline.
    func load(_ slug: String) async {
        var request = URLRequest(url: Self.endpoint(slug))
        request.timeoutInterval = 15
        request.cachePolicy = .reloadIgnoringLocalCacheData
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            return
        }
        // Decode off the main actor; a payload runs to hundreds of
        // kilobytes and this fires on every foregrounding.
        guard let fresh = await Task.detached(priority: .utility, operation: {
            try? JSONDecoder().decode(WalkPayload.self, from: data)
        }).value, Self.isUsable(fresh) else {
            return
        }
        lastRefresh = Date()
        guard fresh.version != payloads[slug]?.version else { return }
        try? data.write(to: Self.cacheURL(slug), options: .atomic)
        payloads[slug] = fresh
    }

    /// Refreshes every walk the app holds, plus any the site has added
    /// since this build shipped.
    func refresh() async {
        await load(DEFAULT_SLUG)
        var wanted = Set(BUNDLED_SLUGS)
        wanted.formUnion(payloads.keys)
        wanted.formUnion(catalogue.map(\.slug))
        for slug in wanted.sorted() where slug != DEFAULT_SLUG {
            await load(slug)
        }
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

    /// Decoded images held in memory, so reopening the map or paging
    /// back through stops does not re-decode the same JPEG off disk
    /// and flash a placeholder while it does. NSCache empties itself
    /// under memory pressure, which is what makes it safe to hold
    /// full-size plates here.
    private static let memory: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.countLimit = 60
        return cache
    }()

    /// A hit only if the image is already decoded. Lets a view show
    /// it in the same frame instead of going through a placeholder.
    nonisolated func cachedImage(for sitePath: String) -> UIImage? {
        Self.memory.object(forKey: sitePath as NSString)
    }

    /// Loads an image, memory-first, then bundled, then downloading
    /// and caching new files the site may have added after this build
    /// shipped. The decode and disk work run off the main actor.
    func image(for sitePath: String) async -> UIImage? {
        if let hit = cachedImage(for: sitePath) { return hit }
        let local = localMediaURL(for: sitePath)
        let remote = remoteMediaURL(for: sitePath)
        let name = (sitePath as NSString).lastPathComponent
        let sub = sitePath.contains("/thumbs/") ? "Media-thumbs" : "Media-images"
        let target = Self.cacheDirectory.appendingPathComponent("dl-\(sub)-\(name)")
        let image = await Self.loadImage(local: local, remote: remote, cacheTarget: target)
        if let image {
            Self.memory.setObject(image, forKey: sitePath as NSString)
        }
        return image
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
