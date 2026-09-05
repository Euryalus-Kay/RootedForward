import SwiftUI
import AVFoundation

// ------------------------------------------------------------------
// The four seconds of film behind the opening.
//
// It is the same 1940 survey sheet the mission sits on, with one warm
// light passing across the paper, rendered once and shipped as a
// small silent HEVC file in Resources/Launch. It plays under the mark
// while the mark draws, and the opening dissolves it into the still
// copy of the same picture before the handoff, so the home screen
// never sees it.
//
// Two rules. It is silent and carries no audio track, and it never
// activates the audio session, so opening the app cannot pause
// whatever the walker was listening to. And if the file is missing
// or will not decode, the opening simply uses the still, which is
// what it did before the film existed.
// ------------------------------------------------------------------

struct LaunchFilm: UIViewRepresentable {
    /// Called once if the film cannot be played, so the caller can
    /// show the still instead.
    var onUnavailable: () -> Void = {}

    /// The bundled film, or nil in a build that does not carry one.
    static var url: URL? {
        Bundle.main.url(forResource: "launch-sheet", withExtension: "mp4", subdirectory: "Launch")
            ?? Bundle.main.url(forResource: "launch-sheet", withExtension: "mp4")
    }

    func makeUIView(context: Context) -> PlayerView {
        let view = PlayerView()
        view.backgroundColor = .clear
        // Decoration only. Touches belong to the opening above it, which
        // uses a tap to skip ahead.
        view.isUserInteractionEnabled = false
        guard let url = Self.url else {
            onUnavailable()
            return view
        }
        let item = AVPlayerItem(url: url)
        let player = AVPlayer(playerItem: item)
        player.isMuted = true
        player.allowsExternalPlayback = false
        player.preventsDisplaySleepDuringVideoPlayback = false
        // A silent film must not take the audio session from Music or a
        // podcast. Mixing is the whole point; the narration engine
        // sets its own category when a walk actually starts.
        try? AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
        view.playerLayer.player = player
        view.playerLayer.videoGravity = .resizeAspectFill
        context.coordinator.watch(item, player: player, onUnavailable: onUnavailable)
        player.play()
        return view
    }

    func updateUIView(_ uiView: PlayerView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        private var observation: NSKeyValueObservation?
        private var gaveUp = false

        func watch(_ item: AVPlayerItem, player: AVPlayer, onUnavailable: @escaping () -> Void) {
            observation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
                if item.status == .failed {
                    DispatchQueue.main.async { self?.giveUp(player, onUnavailable) }
                }
            }
            // The film is decoration. If a device has not started
            // playing it within a moment, the opening carries on with
            // the still rather than wait on it.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) { [weak self] in
                guard let self, !self.gaveUp else { return }
                if player.timeControlStatus != .playing {
                    self.giveUp(player, onUnavailable)
                }
            }
        }

        private func giveUp(_ player: AVPlayer, _ onUnavailable: () -> Void) {
            guard !gaveUp else { return }
            gaveUp = true
            player.pause()
            onUnavailable()
        }
    }

    /// A UIView whose backing layer is the player layer, so it sizes
    /// itself with no manual frame bookkeeping.
    final class PlayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }
}
