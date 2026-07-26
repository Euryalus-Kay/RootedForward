import SwiftUI

// ------------------------------------------------------------------
// The page before stop one. This is the founder's essay, which used
// to sit behind a "Why this walk" row on the tour screen where most
// people never opened it. As a page you press Next on it is part of
// the walk, read once on the way in and out of the way afterwards.
//
// It deliberately mirrors StopPage. Same measure, same type sizes,
// same plate at the foot, so pressing Next reads as turning to the
// next page rather than leaving a different screen.
//
// No title pinning and no engagement tracking here. Neither applies:
// the bar carries a fixed label on this page, and the intro is not a
// stop, so there is nothing for it to mark visited.
// ------------------------------------------------------------------

struct IntroPage: View {
    @EnvironmentObject private var content: ContentStore

    let goNext: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(content.intro.title)
                    .font(RF.display(30, weight: 600))
                    .foregroundStyle(RF.forest)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityAddTraits(.isHeader)

                VStack(alignment: .leading, spacing: 18) {
                    ForEach(Array(content.intro.paragraphs.enumerated()), id: \.offset) { _, paragraph in
                        MarkedText(text: paragraph)
                    }
                }
                .padding(.top, 22)

                Text(content.intro.byline)
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 22)

                handOff
                    .padding(.top, 30)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            // Clears the scrim and the pill row the same way a stop
            // page does.
            .padding(.bottom, 150)
        }
        .background(RF.cream)
    }

    /// The same plate that closes every stop, so the walk starts the
    /// way it goes on.
    private var handOff: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("The first stop")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)

            Text(content.tour.startLabel)
                .font(RF.body(15.5))
                .foregroundStyle(RF.ink.opacity(0.8))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)

            Text("\(content.tour.mainline.count) stops, about \(String(format: "%.0f", content.tour.distanceMiles)) miles, \(content.tour.listenMinutes) minutes of narration")
                .font(RF.display(15, weight: 400, italic: true))
                .foregroundStyle(RF.warmGrayDark)
                .fixedSize(horizontal: false, vertical: true)

            Button("Next", action: goNext)
                .buttonStyle(HardShadowButtonStyle())
                .accessibilityLabel("Next, go to the first stop")
                .accessibilityIdentifier("intro-next")
                .padding(.top, 2)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
    }
}
