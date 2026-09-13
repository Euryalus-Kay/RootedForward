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

/// The plate on the home screen, in the museum's own blue so it reads
/// as theirs and ours at once: their mark and name, the whole map on a
/// white mat, Look Closer, one line that says it is a joint exhibit you
/// can go and stand in front of, and two ways in, the sheet that leads
/// to the map, and a visit there. Held to about two hundred points so the tours heading
/// still lands on the first screen under it.
struct FeaturePlate: View {
    let feature: WalkFeature
    /// opens the information sheet, which is the way to the map
    let open: () -> Void
    @Environment(\.openURL) private var openURL

    private var accent: Color { Color(hexString: feature.partner.accent) }
    private var visitURL: URL? {
        URL(string: feature.partner.visitUrl ?? feature.partner.url)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                Haptics.press()
                open()
            } label: {
                VStack(alignment: .leading, spacing: 12) {
                    // Both marks and both names on one line, so the
                    // collaboration is read before anything else is.
                    HStack(spacing: 7) {
                        Image("LogoMark")
                            .resizable()
                            .frame(width: 20, height: 20)
                            .overlay(Circle().strokeBorder(Color.white, lineWidth: 1.5))
                        Text("&")
                            .font(RF.display(14, weight: 400))
                            .foregroundStyle(.white.opacity(0.75))
                        MediaImage(sitePath: feature.partner.logo, contentMode: .fill)
                            .frame(width: 20, height: 20)
                            .clipShape(Circle())
                            .overlay(Circle().strokeBorder(Color.white, lineWidth: 1.5))
                        // Two lines on a narrow phone rather than an
                        // ellipsis through the museum's name.
                        Text("Rooted Forward & \(feature.partner.name)")
                            .font(RF.body(12.5, weight: 600))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .minimumScaleFactor(0.9)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.leading, 2)
                    }

                    HStack(alignment: .center, spacing: 14) {
                        MediaImage(sitePath: feature.image, contentMode: .fill)
                            .frame(width: 118, height: 74)
                            .clipped()
                            .padding(3)
                            .background(Color.white)
                            .accessibilityHidden(true)

                        VStack(alignment: .leading, spacing: 5) {
                            Text(feature.title)
                                .font(RF.display(26, weight: 600))
                                .foregroundStyle(.white)
                                .lineLimit(1)

                            Text(feature.line)
                                .font(RF.body(13, weight: 500))
                                .foregroundStyle(.white.opacity(0.9))
                                .lineSpacing(2)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(PressableCardStyle())
            .accessibilityLabel("\(feature.title). \(feature.line) Opens the map, sideways.")
            .accessibilityIdentifier("home-feature-\(feature.id)")

            HStack(spacing: 14) {
                Button {
                    Haptics.press()
                    open()
                } label: {
                    HStack(spacing: 6) {
                        Text("Explore the map")
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .font(RF.body(13, weight: 700))
                    .foregroundStyle(accent)
                    .padding(.horizontal, 16)
                    .frame(height: 40)
                    .background(Color.white)
                }
                .buttonStyle(PressableCardStyle())
                .accessibilityHidden(true)

                if let visitURL {
                    Button {
                        Haptics.tap()
                        openURL(visitURL)
                    } label: {
                        HStack(spacing: 5) {
                            Text("Plan a visit")
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .font(RF.body(13, weight: 700))
                        .foregroundStyle(.white)
                        .frame(height: 40)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(PressableCardStyle())
                    .accessibilityLabel("Plan a visit to the \(feature.partner.name). Opens their website.")
                    .accessibilityIdentifier("home-feature-visit")
                }
                Spacer(minLength: 0)
            }
            .padding(.top, 14)
        }
        .padding(16)
        .background(Rectangle().fill(accent))
        // A white hairline set just inside the edge, the plate frame in
        // the museum's colors, and the same dropped shadow the paper
        // plates carry so it sits in the page rather than on it.
        .overlay(Rectangle().strokeBorder(Color.white.opacity(0.45), lineWidth: 1).padding(4))
        .background(Rectangle().fill(RF.ink.opacity(0.14)).offset(x: 5, y: 5))
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

/// The information sheet the plate opens: the map, the collaboration
/// and the visit, in the site's words, with the turning phone at the
/// bottom and the one button that opens the map sideways. The map is
/// presented over this sheet, so closing the map lands back here.
struct LookCloserIntro: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    let feature: WalkFeature

    @State private var mapOpen = false

    private var accent: Color { Color(hexString: feature.partner.accent) }
    private var visitURL: URL? {
        URL(string: feature.partner.visitUrl ?? feature.partner.url)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(spacing: 12) {
                        Image("LogoMark")
                            .resizable()
                            .frame(width: 44, height: 44)
                        Text("&")
                            .font(RF.display(22, weight: 400))
                            .foregroundStyle(RF.warmGray)
                        MediaImage(sitePath: feature.partner.logo, contentMode: .fill)
                            .frame(width: 44, height: 44)
                            .clipShape(Circle())
                            .overlay(Circle().strokeBorder(RF.ink.opacity(0.15), lineWidth: 0.5))
                    }
                    .accessibilityHidden(true)

                    Text(feature.title)
                        .font(RF.display(36, weight: 600))
                        .foregroundStyle(RF.forest)
                        .padding(.top, 16)
                        .accessibilityAddTraits(.isHeader)

                    Text("A joint exhibit by Rooted Forward and the \(feature.partner.name)")
                        .font(RF.display(17, weight: 400))
                        .italic()
                        .foregroundStyle(RF.warmGrayDark)
                        .padding(.top, 6)
                        .fixedSize(horizontal: false, vertical: true)

                    Rectangle()
                        .fill(accent)
                        .frame(width: 44, height: 3)
                        .padding(.top, 16)
                        .accessibilityHidden(true)

                    MediaImage(sitePath: feature.image, contentMode: .fit)
                        .padding(4)
                        .background(Color.white)
                        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
                        .padding(.top, 20)
                        .accessibilityLabel(feature.imageAlt)

                    ForEach(Array((feature.about ?? [feature.line]).enumerated()), id: \.offset) { _, para in
                        Text(para)
                            .font(RF.body(15.5))
                            .foregroundStyle(RF.ink)
                            .lineSpacing(4)
                            .padding(.top, 14)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    visit
                        .padding(.top, 24)

                    if let credit = feature.credit {
                        Text(credit)
                            .font(RF.body(12))
                            .foregroundStyle(RF.warmGrayDark)
                            .lineSpacing(3)
                            .padding(.top, 16)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                .padding(.bottom, 24)
            }
            .background(RF.cream)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                doorway
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(RF.ink)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(RF.creamDark))
                    }
                    .accessibilityLabel("Close")
                    .accessibilityIdentifier("feature-intro-close")
                }
            }
            .toolbarBackground(RF.cream, for: .navigationBar)
        }
        .fullScreenCover(isPresented: $mapOpen) {
            LookCloserScreen(feature: feature)
        }
    }

    /// The in-person half, framed in the museum's blue.
    private var visit: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                MediaImage(sitePath: feature.partner.logo, contentMode: .fill)
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())
                    .overlay(Circle().strokeBorder(RF.ink.opacity(0.15), lineWidth: 0.5))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text("See it in person")
                        .font(RF.display(19, weight: 600))
                        .foregroundStyle(RF.forest)
                    Text("On the wall at the \(feature.partner.name)")
                        .font(RF.body(13.5, weight: 500))
                        .foregroundStyle(RF.ink.opacity(0.75))
                }
            }
            if let place = feature.partner.place {
                Text(place)
                    .font(RF.body(14.5))
                    .foregroundStyle(RF.ink)
                    .padding(.top, 6)
            }
            if let hours = feature.partner.hours {
                Text(hours)
                    .font(RF.body(14.5))
                    .foregroundStyle(RF.ink)
            }
            if let visitURL {
                Button {
                    Haptics.tap()
                    openURL(visitURL)
                } label: {
                    HStack(spacing: 6) {
                        Text("Plan a visit")
                        Image(systemName: "arrow.up.right")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .font(RF.body(13, weight: 700))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .frame(height: 40)
                    .background(accent)
                }
                .buttonStyle(PressableCardStyle())
                .padding(.top, 8)
                .accessibilityLabel("Plan a visit to the \(feature.partner.name). Opens their website.")
                .accessibilityIdentifier("feature-intro-visit")
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RF.paper)
        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
        .overlay(alignment: .top) {
            Rectangle().fill(accent).frame(height: 4).accessibilityHidden(true)
        }
    }

    /// The turning phone and the button, pinned under the sheet.
    private var doorway: some View {
        HStack(spacing: 14) {
            RotatingPhone()
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 3) {
                Text("Turn your phone")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.ink)
                Text("The map only opens sideways.")
                    .font(RF.body(12.5))
                    .foregroundStyle(RF.warmGrayDark)
            }
            .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 8)
            Button {
                Haptics.press()
                mapOpen = true
            } label: {
                Text("Open the map")
                    .font(RF.body(14, weight: 700))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .fixedSize()
                    .padding(.horizontal, 18)
                    .frame(height: 46)
                    .background(RF.rust)
            }
            .buttonStyle(PressableCardStyle())
            .accessibilityLabel("Open the map. The screen turns sideways.")
            .accessibilityIdentifier("feature-intro-open")
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 10)
        .background(RF.cream)
        .overlay(alignment: .top) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }
}

/// A phone outline that turns on its side and back, the cue people
/// know from the web. Holds still, already turned, under Reduce Motion.
struct RotatingPhone: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var turned = false

    var body: some View {
        ZStack(alignment: .bottom) {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .strokeBorder(RF.ink, lineWidth: 2.5)
                .frame(width: 30, height: 50)
            Capsule()
                .fill(RF.ink)
                .frame(width: 10, height: 2.5)
                .padding(.bottom, 4)
        }
        .frame(width: 50, height: 50)
        .rotationEffect(.degrees(turned || reduceMotion ? -90 : 0))
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 1.1).delay(0.5).repeatForever(autoreverses: true)) {
                turned = true
            }
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
