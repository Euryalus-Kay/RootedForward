import SwiftUI
import UIKit

// ------------------------------------------------------------------
// Small shared pieces: media-aware image loading, the framed
// photograph plate used across the tour (white mat, hairline frame,
// caption and credit in the site's voice), haptics, and the little
// live waveform that plays while narration runs.
// ------------------------------------------------------------------

enum Haptics {
    // Long-lived generators. Building one per call means the Taptic
    // engine is cold on the first tap after any idle stretch, which
    // is exactly the tap a user notices missing.
    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let medium = UIImpactFeedbackGenerator(style: .medium)
    private static let notice = UINotificationFeedbackGenerator()

    /// Called when a screen that taps a lot appears.
    static func warm() {
        light.prepare()
        medium.prepare()
        notice.prepare()
    }
    static func tap() {
        light.impactOccurred()
        light.prepare()
    }
    static func press() {
        medium.impactOccurred()
        medium.prepare()
    }
    static func success() {
        notice.notificationOccurred(.success)
    }
}

/// Five little bars breathing with the narration. Holds still for
/// Reduce Motion; the label next to it already says "Now playing".
struct PlayingWave: View {
    var color: Color = RF.rust
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Group {
            if reduceMotion {
                bars(at: 0)
            } else {
                TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { context in
                    bars(at: context.date.timeIntervalSinceReferenceDate)
                }
            }
        }
        .accessibilityHidden(true)
    }

    private func bars(at t: TimeInterval) -> some View {
        HStack(spacing: 2.5) {
            ForEach(0..<5, id: \.self) { i in
                Capsule()
                    .fill(color)
                    .frame(
                        width: 3,
                        height: 5 + 9 * abs(sin(t * 2.6 + Double(i) * 0.95))
                    )
            }
        }
        .frame(height: 16, alignment: .center)
    }
}

/// Loads a tour image through the ContentStore (bundled first, then
/// the site) with a quiet cream placeholder while it works.
struct MediaImage: View {
    @EnvironmentObject private var content: ContentStore
    let sitePath: String
    var contentMode: ContentMode = .fit

    @State private var loaded: UIImage?

    var body: some View {
        Group {
            if let loaded {
                Image(uiImage: loaded)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .transition(.opacity)
            } else {
                Rectangle()
                    .fill(RF.creamDark)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 22))
                            .foregroundStyle(RF.warmGrayLight)
                    )
                    .transition(.opacity)
            }
        }
        .task(id: sitePath) {
            // Already decoded and in memory: show it in the same frame
            // rather than flashing a placeholder for one tick.
            if let cached = content.cachedImage(for: sitePath) {
                loaded = cached
                return
            }
            let image = await content.image(for: sitePath)
            // A cancelled load (the path changed mid-download) must
            // not blank out the image the new task already set.
            guard !Task.isCancelled else { return }
            // A rectangle that blinks is the loudest thing on a page
            // built out of paper and hairlines.
            withAnimation(RFMotion.appear) { loaded = image }
        }
    }
}

/// A photograph in the site's plate frame: white mat around the
/// image, hairline border, small label under the photo, credit line
/// in italic underneath. Tapping opens the full-screen photo room.
struct FramedImage: View {
    @EnvironmentObject private var edits: EditStore
    let image: WalkImage
    var showCredit = true
    /// Set only in a proofreading build, and only where the photograph
    /// belongs to a stop, which is what a caption edit is keyed to.
    var photoEdit: PhotoEditContext? = nil

    @State private var viewerOpen = false
    @State private var editorOpen = false
    @State private var pressed = false

    /// The caption and credit as they should read, which is the owner's
    /// wording once they have retyped it.
    private var caption: String? {
        guard let photoEdit else { return image.label }
        let key = EditTarget.photo(photoEdit.slug, photoEdit.stop, photoEdit.index, .caption).key
        let text = edits.text(key, image.label ?? "")
        return text.isEmpty ? nil : text
    }

    private var credit: String {
        guard let photoEdit else { return image.credit }
        let key = EditTarget.photo(photoEdit.slug, photoEdit.stop, photoEdit.index, .credit).key
        return edits.text(key, image.credit)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                Haptics.tap()
                viewerOpen = true
            } label: {
                VStack(spacing: 10) {
                    MediaImage(sitePath: image.src)
                        .frame(maxWidth: .infinity)
                        .clipped()
                        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
                        .overlay(alignment: .bottomTrailing) {
                            Image(systemName: "arrow.up.left.and.arrow.down.right")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(RF.ink.opacity(0.55))
                                .padding(5)
                                .background(RF.paper.opacity(0.85))
                                .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.15), lineWidth: 1))
                                .padding(6)
                        }
                    if let caption {
                        Text(caption)
                            .font(RF.display(15, weight: 400, italic: true))
                            .foregroundStyle(RF.ink.opacity(0.65))
                    }
                }
                .padding(12)
                .plate()
                .scaleEffect(pressed ? 0.985 : 1)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(image.alt). Opens full screen.")
            .accessibilityIdentifier("stop-photo")
            .fullScreenCover(isPresented: $viewerOpen) {
                PhotoViewer(image: image)
            }
            // A pencil in the corner rather than a long press. A press
            // on a button still counts as a tap when the finger lifts,
            // so a hidden gesture here would open the photo room too.
            .overlay(alignment: .topLeading) {
                if Beta.editing, photoEdit != nil {
                    Button {
                        Haptics.tap()
                        editorOpen = true
                    } label: {
                        Image(systemName: "pencil.line")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(RF.plateRed)
                            .padding(6)
                            .background(RF.plateRedGround)
                            .overlay(Rectangle().strokeBorder(RF.plateRed.opacity(0.5), lineWidth: 1))
                            .padding(18)
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("Edit this photograph's caption and credit")
                }
            }
            .sheet(isPresented: $editorOpen) {
                if let photoEdit {
                    PhotoEditSheet(
                        slug: photoEdit.slug, stop: photoEdit.stop,
                        index: photoEdit.index, image: image
                    )
                }
            }

            if showCredit {
                Text(credit)
                    .font(RF.body(12))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// Transcript paragraph with the site's markup. `**bold**` carries the
/// history, `*italic*` sets publication titles. Both come out of the
/// markdown parser already; this only gives them the right faces.
struct MarkedText: View {
    let text: String
    var size: CGFloat = 17
    var color: Color = RF.ink.opacity(0.8)

    var body: some View {
        Text(attributed)
            .font(RF.body(size))
            .foregroundStyle(color)
            .lineSpacing(size * 0.22)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var attributed: AttributedString {
        if var parsed = try? AttributedString(
            markdown: text,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            for run in parsed.runs {
                guard let intent = run.inlinePresentationIntent else { continue }
                if intent.contains(.stronglyEmphasized) {
                    parsed[run.range].font = RF.body(size, weight: 700)
                } else if intent.contains(.emphasized) {
                    parsed[run.range].font = RF.display(size, weight: 400, italic: true)
                }
            }
            return parsed
        }
        return AttributedString(text)
    }
}
