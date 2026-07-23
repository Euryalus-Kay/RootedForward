import SwiftUI

// ------------------------------------------------------------------
// The intro essay, shown when the tour starts fresh. Same content
// the site shows at #start: the founder's essay, the stats line, and
// Begin / Resume.
// ------------------------------------------------------------------

struct IntroView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore

    let begin: () -> Void
    let resume: (() -> Void)?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Before you start")
                    .eyebrow()
                    .padding(.top, 28)

                Text(content.intro.title)
                    .font(RF.display(33, weight: 600))
                    .foregroundStyle(RF.forest)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 12)
                    .accessibilityAddTraits(.isHeader)

                Text("\(content.tour.stops.count) stops, \(content.tour.distanceMiles, specifier: "%.1f") miles, about three hours with the stops")
                    .font(RF.display(17, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 14)

                VStack(alignment: .leading, spacing: 18) {
                    ForEach(Array(content.intro.paragraphs.enumerated()), id: \.offset) { _, paragraph in
                        MarkedText(text: paragraph)
                    }
                }
                .padding(.top, 24)

                Text(content.intro.byline)
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 20)

                Rectangle()
                    .fill(RF.border)
                    .frame(height: 1)
                    .padding(.top, 28)

                VStack(alignment: .leading, spacing: 12) {
                    Button("Begin at stop 1", action: begin)
                        .buttonStyle(HardShadowButtonStyle())
                        .accessibilityIdentifier("intro-begin")

                    if let resume {
                        Button {
                            resume()
                        } label: {
                            Text("Resume at stop \(min(progress.lastIndex, content.tour.stops.count - 1) + 1)")
                                .font(RF.body(15, weight: 600))
                                .foregroundStyle(RF.forest)
                                .underline()
                        }
                    }

                    Text(content.tour.startLabel + ".")
                        .font(RF.body(14))
                        .foregroundStyle(RF.warmGray)
                }
                .padding(.top, 24)
                .padding(.bottom, 60)
            }
            .padding(.horizontal, 20)
        }
        .background(RF.cream)
    }
}
