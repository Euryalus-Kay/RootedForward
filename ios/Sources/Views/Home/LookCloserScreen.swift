import SwiftUI
import WebKit

// ------------------------------------------------------------------
// The feature on the front door and the screen it opens. Today that
// is Look Closer, the 1931 map of Chicago on the Chicago Maritime
// Museum's wall, which the site rebuilt for a phone at /look-closer.
// The app does not carry the map itself; it opens that page in a web
// view turned sideways, so the wall, the site and the phone stay one
// thing and a change of wording on the site reaches all three.
//
// The screen is the second place in the app allowed to turn, after
// the film, and for the same reason: the map is wider than it is
// tall and every joke on it is small. The gate lands the phone in
// landscape on the way in and shuts again on the way out.
// ------------------------------------------------------------------

/// The plate on the home screen. A strip of the whole map, the two
/// marks, the partner's own blue on the note, and one line. Short on
/// purpose, so the tours heading stays on the first screen under it.
struct FeaturePlate: View {
    let feature: WalkFeature

    private var accent: Color { Color(hexString: feature.partner.accent) }

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            MediaImage(sitePath: feature.image, contentMode: .fill)
                .frame(width: 96, height: 68)
                .clipped()
                .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 5) {
                // The partner's mark and name in the partner's own ink.
                // This is Rooted Forward's app, so its own mark would
                // only say what the masthead already says.
                HStack(spacing: 6) {
                    MediaImage(sitePath: feature.partner.logo, contentMode: .fill)
                        .frame(width: 18, height: 18)
                        .clipShape(Circle())
                        .overlay(Circle().strokeBorder(RF.ink.opacity(0.15), lineWidth: 0.5))
                    Text(feature.partner.name)
                        .font(RF.body(12, weight: 600))
                        .foregroundStyle(accent)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .accessibilityHidden(true)

                Text(feature.title)
                    .font(RF.display(22, weight: 600))
                    .foregroundStyle(RF.forest)
                    .lineLimit(1)

                Text("\(feature.note). \(feature.line)")
                    .font(RF.body(13, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.75))
                    .lineSpacing(2)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)

            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(RF.warmGrayDark)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .plate()
        // The partner's ink, once, along the top edge inside the frame.
        .overlay(alignment: .top) {
            Rectangle()
                .fill(accent)
                .frame(height: 3)
                .padding(.horizontal, 1)
                .padding(.top, 1)
                .accessibilityHidden(true)
        }
        .contentShape(Rectangle())
    }
}

/// The map, sideways, with one way out.
struct LookCloserScreen: View {
    @Environment(\.dismiss) private var dismiss
    let feature: WalkFeature

    @State private var loaded = false
    @State private var failed = false

    /// The page with the app flag on it, which hides the page's own
    /// links back to the site; this screen is the way back.
    private var pageURL: URL {
        var parts = URLComponents(string: feature.url)
        var items = parts?.queryItems ?? []
        items.append(URLQueryItem(name: "app", value: "1"))
        parts?.queryItems = items
        return parts?.url ?? URL(string: feature.url)!
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Color(rfHex: 0xF3EEE3).ignoresSafeArea()

            FeatureWeb(url: pageURL, loaded: $loaded, failed: $failed)
                .ignoresSafeArea()
                .opacity(loaded && !failed ? 1 : 0)
                .animation(.easeOut(duration: 0.3), value: loaded)

            if !loaded && !failed {
                waiting
            }
            if failed {
                offline
            }

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(RF.ink)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color(rfHex: 0xF3EEE3).opacity(0.92)))
                    .overlay(Circle().strokeBorder(RF.ink, lineWidth: 1.5))
                    .padding(.leading, 12)
                    .padding(.top, 10)
            }
            .accessibilityLabel("Close the map")
            .accessibilityIdentifier("feature-close")
            // Above the page's own controls, which sit at the top left
            // too; the page shifts its mark right when the app flag is on.
        }
        .onAppear { OrientationGate.set(.landscape) }
        .onDisappear { OrientationGate.set(.portrait) }
        .statusBarHidden()
    }

    /// The paper and the two marks while the page arrives.
    private var waiting: some View {
        VStack(spacing: 14) {
            HStack(spacing: 12) {
                Image("LogoMark")
                    .resizable()
                    .frame(width: 40, height: 40)
                MediaImage(sitePath: feature.partner.logo, contentMode: .fill)
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
            }
            Text(feature.title)
                .font(RF.display(28, weight: 600))
                .foregroundStyle(RF.forest)
            ProgressView()
                .tint(RF.rust)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityLabel("Opening \(feature.title)")
    }

    private var offline: some View {
        VStack(spacing: 10) {
            Text(feature.title)
                .font(RF.display(28, weight: 600))
                .foregroundStyle(RF.forest)
            Text("The map lives on rooted-forward.org and needs a connection to open. The walks still work without one.")
                .font(RF.body(15))
                .foregroundStyle(RF.ink.opacity(0.75))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 360)
            Button {
                // The web view sees both flags drop and loads again.
                failed = false
                loaded = false
            } label: {
                Text("Try again")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 22)
                    .frame(height: 44)
                    .background(RF.rust)
            }
            .padding(.top, 6)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// The web view. One page, no history, no bounce, and any link that
/// leaves rooted-forward.org, the museum's site above all, opens in
/// Safari rather than inside this sideways room.
private struct FeatureWeb: UIViewRepresentable {
    let url: URL
    @Binding var loaded: Bool
    @Binding var failed: Bool

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.953, green: 0.933, blue: 0.890, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        view.scrollView.bounces = false
        view.scrollView.isScrollEnabled = false
        view.scrollView.contentInsetAdjustmentBehavior = .never
        view.allowsBackForwardNavigationGestures = false
        view.allowsLinkPreview = false
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        view.load(request)
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        // A failed load asks for another try by flipping `failed` off
        // while the view still holds the error. Only then; loading
        // again during the first navigation would cancel it.
        if !failed, !loaded, context.coordinator.lastFailed {
            context.coordinator.lastFailed = false
            view.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let parent: FeatureWeb
        var lastFailed = false
        init(_ parent: FeatureWeb) { self.parent = parent }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.loaded = true
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            fail(error)
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            fail(error)
        }
        /// A cancelled navigation is not a failure; it is what a link
        /// handed to Safari looks like from here.
        private func fail(_ error: Error) {
            if (error as NSError).code == NSURLErrorCancelled { return }
            lastFailed = true
            parent.failed = true
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor action: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = action.request.url else { return decisionHandler(.allow) }
            let host = url.host ?? ""
            let ours = host.hasSuffix("rooted-forward.org")
            if action.navigationType == .linkActivated, !ours {
                UIApplication.shared.open(url)
                return decisionHandler(.cancel)
            }
            decisionHandler(.allow)
        }

        /// target="_blank" links, which the page uses for the museum.
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for action: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = action.request.url {
                UIApplication.shared.open(url)
            }
            return nil
        }
    }
}

extension Color {
    /// "#0076B4" or "0076B4" to a color; anything else is the site's ink.
    init(hexString: String) {
        var s = hexString.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else {
            self = RF.ink
            return
        }
        self = Color(rfHex: v)
    }
}
