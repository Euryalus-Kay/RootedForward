import Foundation
import AVFoundation
import MediaPlayer
import UIKit

// ------------------------------------------------------------------
// One AVPlayer for the whole tour, matching the site's audio-bus
// rule that only one stop speaks at a time. Handles the playback
// audio session (background audio entitlement is set in Info.plist),
// lock screen metadata and remote commands, a speed cycle, and
// marking a stop visited when its narration finishes.
// ------------------------------------------------------------------

@MainActor
final class AudioEngine: ObservableObject {
    @Published private(set) var currentStopID: String?
    @Published private(set) var currentStopTitle: String = ""
    @Published private(set) var isPlaying = false
    @Published var currentTime: Double = 0
    @Published private(set) var duration: Double = 0
    @Published private(set) var rate: Float = 1.0

    /// Called when a stop's narration plays to the end.
    var onFinished: ((String) -> Void)?

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var failObserver: NSObjectProtocol?
    private var statusObservation: NSKeyValueObservation?
    private var sessionConfigured = false

    private let rates: [Float] = [1.0, 1.25, 1.5]

    // MARK: - Public controls

    func toggle(stop: WalkStop, url: URL, artwork: UIImage?) {
        if currentStopID == stop.id {
            isPlaying ? pause() : resume()
            return
        }
        load(stop: stop, url: url, artwork: artwork, autoplay: true)
    }

    func pause() {
        player?.pause()
        isPlaying = false
        updateNowPlayingPlayback()
    }

    func resume() {
        configureSessionIfNeeded()
        player?.playImmediately(atRate: rate)
        isPlaying = true
        updateNowPlayingPlayback()
    }

    func seek(to seconds: Double) {
        currentTime = seconds
        player?.seek(
            to: CMTime(seconds: seconds, preferredTimescale: 600),
            toleranceBefore: .zero, toleranceAfter: .zero
        )
        updateNowPlayingPlayback()
    }

    func skip(by seconds: Double) {
        seek(to: min(max(0, currentTime + seconds), max(0, duration - 0.5)))
    }

    func cycleRate() {
        let next = rates[((rates.firstIndex(of: rate) ?? 0) + 1) % rates.count]
        rate = next
        if isPlaying {
            player?.rate = next
        }
        updateNowPlayingPlayback()
    }

    func stop() {
        player?.pause()
        removeObservers()
        player = nil
        currentStopID = nil
        currentStopTitle = ""
        isPlaying = false
        currentTime = 0
        duration = 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    func isCurrent(_ stopID: String) -> Bool {
        currentStopID == stopID
    }

    /// Late-arriving lock-screen artwork; ignored if the walker has
    /// already moved to another stop.
    func updateArtwork(_ artwork: UIImage, for stopID: String) {
        guard currentStopID == stopID else { return }
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: artwork.size) { _ in artwork }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: - Loading

    private func load(stop: WalkStop, url: URL, artwork: UIImage?, autoplay: Bool) {
        removeObservers()
        configureSessionIfNeeded()

        let item = AVPlayerItem(url: url)
        let player = AVPlayer(playerItem: item)
        self.player = player
        currentStopID = stop.id
        currentStopTitle = stop.title
        currentTime = 0
        duration = stop.audioSeconds

        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.currentTime = time.seconds
                if let loaded = self.player?.currentItem?.duration.seconds,
                   loaded.isFinite, loaded > 0 {
                    self.duration = loaded
                }
            }
        }

        // Capture the stop this observer belongs to; by the time the
        // deferred task runs, the user may have loaded another stop.
        let loadedStopID = stop.id
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self, self.currentStopID == loadedStopID else { return }
                self.isPlaying = false
                self.currentTime = self.duration
                self.updateNowPlayingPlayback()
                self.onFinished?(loadedStopID)
            }
        }

        // A missing or unreachable audio file must not leave the UI
        // claiming playback; fall back to idle instead.
        failObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemFailedToPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self, self.currentStopID == loadedStopID else { return }
                self.stop()
            }
        }
        statusObservation = item.observe(\.status) { [weak self] observed, _ in
            guard observed.status == .failed else { return }
            Task { @MainActor [weak self] in
                guard let self, self.currentStopID == loadedStopID else { return }
                self.stop()
            }
        }

        setNowPlaying(stop: stop, artwork: artwork)
        installRemoteCommands()

        if autoplay {
            player.playImmediately(atRate: rate)
            isPlaying = true
            updateNowPlayingPlayback()
        }
    }

    private func removeObservers() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        if let observer = endObserver {
            NotificationCenter.default.removeObserver(observer)
            endObserver = nil
        }
        if let observer = failObserver {
            NotificationCenter.default.removeObserver(observer)
            failObserver = nil
        }
        statusObservation?.invalidate()
        statusObservation = nil
    }

    private func configureSessionIfNeeded() {
        guard !sessionConfigured else { return }
        sessionConfigured = true
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio)
        try? session.setActive(true)

        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] note in
            Task { @MainActor [weak self] in
                guard let self,
                      let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                      let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
                if type == .began, self.isPlaying {
                    self.pause()
                }
            }
        }

        // Pulled headphones pause the narration instead of blasting
        // it out of the speaker mid-sidewalk.
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: session,
            queue: .main
        ) { [weak self] note in
            Task { @MainActor [weak self] in
                guard let self,
                      let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
                      let reason = AVAudioSession.RouteChangeReason(rawValue: raw) else { return }
                if reason == .oldDeviceUnavailable, self.isPlaying {
                    self.pause()
                }
            }
        }
    }

    // MARK: - Lock screen

    private func setNowPlaying(stop: WalkStop, artwork: UIImage?) {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: "\(stop.number). \(stop.title)",
            MPMediaItemPropertyArtist: "Walk Hyde Park",
            MPMediaItemPropertyAlbumTitle: "Rooted Forward",
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: 0,
            MPNowPlayingInfoPropertyPlaybackRate: 0,
        ]
        if let artwork {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: artwork.size) { _ in artwork }
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func updateNowPlayingPlayback() {
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPMediaItemPropertyPlaybackDuration] = duration
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? rate : 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private var commandsInstalled = false

    private func installRemoteCommands() {
        guard !commandsInstalled else { return }
        commandsInstalled = true
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.resume() }
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.pause() }
            return .success
        }
        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.isPlaying ? self.pause() : self.resume()
            }
            return .success
        }
        center.skipForwardCommand.preferredIntervals = [15]
        center.skipForwardCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.skip(by: 15) }
            return .success
        }
        center.skipBackwardCommand.preferredIntervals = [15]
        center.skipBackwardCommand.addTarget { [weak self] _ in
            Task { @MainActor [weak self] in self?.skip(by: -15) }
            return .success
        }
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let position = (event as? MPChangePlaybackPositionCommandEvent)?.positionTime else {
                return .commandFailed
            }
            Task { @MainActor [weak self] in self?.seek(to: position) }
            return .success
        }
    }
}
