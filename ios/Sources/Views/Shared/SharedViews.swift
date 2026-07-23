import SwiftUI

// ------------------------------------------------------------------
// Small shared pieces: media-aware image loading and the framed
// photograph plate used across the tour (white mat, hairline frame,
// caption and credit in the site's voice).
// ------------------------------------------------------------------

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
            } else {
                Rectangle()
                    .fill(RF.creamDark)
                    .overlay(
                        Image(systemName: "photo")
                            .font(.system(size: 22))
                            .foregroundStyle(RF.warmGrayLight)
                    )
            }
        }
        .task(id: sitePath) {
            loaded = await content.image(for: sitePath)
        }
    }
}

/// A photograph in the site's plate frame: white mat around the
/// image, hairline border, small label under the photo, credit line
/// in italic underneath.
struct FramedImage: View {
    let image: WalkImage
    var showCredit = true

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            VStack(spacing: 10) {
                MediaImage(sitePath: image.src)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))
                if let label = image.label {
                    Text(label)
                        .font(RF.display(15, weight: 400, italic: true))
                        .foregroundStyle(RF.ink.opacity(0.65))
                }
            }
            .padding(12)
            .plate()
            .accessibilityLabel(image.alt)

            if showCredit {
                Text(image.credit)
                    .font(RF.body(12))
                    .foregroundStyle(RF.warmGray)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// Transcript paragraph with the site's **bold** markup.
struct MarkedText: View {
    let text: String
    var size: CGFloat = 17
    var color: Color = RF.ink.opacity(0.8)

    var body: some View {
        Text(attributed)
            .font(RF.body(size))
            .foregroundStyle(color)
            .lineSpacing(size * 0.42)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var attributed: AttributedString {
        if var parsed = try? AttributedString(
            markdown: text,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            for run in parsed.runs where run.inlinePresentationIntent?.contains(.stronglyEmphasized) == true {
                parsed[run.range].font = RF.body(size, weight: 700)
            }
            return parsed
        }
        return AttributedString(text)
    }
}
