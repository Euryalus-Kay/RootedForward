import SwiftUI
import WebKit

// ------------------------------------------------------------------
// A film in the tour.
//
// Until someone presses play this is one bundled still, so a stop
// looks finished with no signal and nothing is fetched from YouTube.
// The tap opens the player full screen.
//
// Captions. These films carry no authored subtitles, only YouTube's
// automatic track, and it burns itself over the picture. cc_load_policy
// alone is not enough, because it only defers to the viewer's own
// account setting. So the player is built through the IFrame API and
// unloadModule("captions") is called once it is ready, which is the
// same thing the website does in YouTubeEmbed.tsx.
//
// Quality. No supported parameter forces a resolution. The player
// chooses from the size it is given and the connection it finds, so
// full screen on a phone is the whole of what we can do about it.
// ------------------------------------------------------------------

struct VideoPlate: View {
    @EnvironmentObject private var content: ContentStore
    let video: WalkVideo
    /// The line above the plate. Nil on the opening page, where the
    /// film is the page and needs no label.
    var label: String? = "Watch this stop"
    /// The line under it, saying what is further down the page. Nil on
    /// the opening page, where there is nothing further down.
    var note: String? = "Read the full stop below"

    @State private var open = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let label {
                Text(label)
                    .font(RF.display(22, weight: 600))
                    .foregroundStyle(RF.forest)
                    .accessibilityAddTraits(.isHeader)
            }
            Button {
                Haptics.press()
                open = true
            } label: {
                ZStack {
                    MediaImage(sitePath: video.poster, contentMode: .fill)
                        .frame(maxWidth: .infinity)
                        .aspectRatio(16.0 / 9.0, contentMode: .fit)
                        .clipped()
                    Rectangle().fill(RF.ink.opacity(0.22))
                    Image(systemName: "play.fill")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(.white)
                        .offset(x: 2)
                        .frame(width: 74, height: 74)
                        .background(Circle().fill(RF.rust))
                }
                .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
                .padding(10)
                .plate()
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Play the film, \(video.title)")
            .accessibilityIdentifier("stop-video")

            if let note {
                Text(note)
                    .font(RF.body(17, weight: 600))
                    .foregroundStyle(RF.rust)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .fullScreenCover(isPresented: $open) {
            VideoScreen(video: video)
        }
    }
}

/// The player itself, black, with one way out.
private struct VideoScreen: View {
    @Environment(\.dismiss) private var dismiss
    let video: WalkVideo

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color.black.ignoresSafeArea()
            YouTubePlayer(videoID: video.youtubeId)
                .ignoresSafeArea(edges: .bottom)
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(.black.opacity(0.55)))
                    .padding(.leading, 16)
                    .padding(.top, 10)
            }
            .accessibilityLabel("Close the film")
            .accessibilityIdentifier("video-close")
        }
    }
}

/// WKWebView holding the IFrame API player. Nothing else in the app
/// uses a web view, and this one exists only because YouTube has no
/// native player worth shipping.
private struct YouTubePlayer: UIViewRepresentable {
    let videoID: String

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        // lets YouTube's own fullscreen control actually expand
        config.preferences.isElementFullscreenEnabled = true
        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .black
        view.scrollView.isScrollEnabled = false
        view.scrollView.backgroundColor = .black
        view.loadHTMLString(Self.page(videoID), baseURL: URL(string: "https://www.youtube-nocookie.com"))
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {}

    private static func page(_ id: String) -> String {
        """
        <!doctype html><html><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <style>
          html,body { margin:0; padding:0; height:100%; background:#000; overflow:hidden; }
          #p { position:absolute; top:50%; left:0; width:100%; aspect-ratio:16/9;
               transform:translateY(-50%); }
          #p iframe { width:100%; height:100%; border:0; display:block; }
        </style></head><body>
        <div id="p"></div>
        <script src="https://www.youtube.com/iframe_api"></script>
        <script>
          function onYouTubeIframeAPIReady() {
            new YT.Player('p', {
              videoId: '\(id)',
              host: 'https://www.youtube-nocookie.com',
              playerVars: {
                playsinline: 1, autoplay: 1, rel: 0, modestbranding: 1,
                cc_load_policy: 0, iv_load_policy: 3, fs: 1
              },
              events: {
                onReady: function (e) {
                  // the only reliable way to keep the automatic
                  // caption track off the picture
                  e.target.unloadModule('captions');
                  e.target.unloadModule('cc');
                  e.target.playVideo();
                }
              }
            });
          }
        </script></body></html>
        """
    }
}
