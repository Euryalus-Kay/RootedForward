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
    @EnvironmentObject private var edits: EditStore

    let goNext: () -> Void

    /// The essay stays closed until someone asks for it.
    @State private var reading = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Editable(.introTitle(content.slug), original: content.intro.title) { title in
                    Text(title)
                        .font(RF.display(30, weight: 600))
                        .foregroundStyle(RF.forest)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                        .accessibilityAddTraits(.isHeader)
                }

                // Where a walk has a film for its opening, the film is
                // the opening. The written version is still here, one
                // tap down, because a poster you cannot play is a dead
                // end on a phone with no signal.
                if let video = content.intro.video {
                    VideoPlate(video: video, label: nil, note: nil)
                        .padding(.top, 22)

                    DisclosureGroup(isExpanded: $reading) {
                        written
                            .padding(.top, 14)
                    } label: {
                        Text("Read it instead")
                            .font(RF.body(14, weight: 600))
                            .foregroundStyle(RF.warmGrayDark)
                    }
                    .tint(RF.warmGrayDark)
                    .padding(.top, 22)
                } else {
                    written
                        .padding(.top, 22)
                }

                handOff
                    .padding(.top, 30)

                NoteButton(
                    makeTarget: { n in .introNote(content.slug, n) },
                    existing: edits.noteCount(forIntro: content.slug)
                )
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            // Clears the scrim and the pill row the same way a stop
            // page does.
            .padding(.bottom, 150)
        }
        .background(RF.cream)
    }

    /// The essay, which is the opening on a walk with no film and the
    /// fallback on one that has it.
    private var written: some View {
        VStack(alignment: .leading, spacing: 18) {
            ForEach(Array(content.intro.paragraphs.enumerated()), id: \.offset) { index, paragraph in
                Editable(
                    .introParagraph(content.slug, index), original: paragraph
                ) { text in
                    MarkedText(text: text)
                }
            }
            Editable(.introByline(content.slug), original: content.intro.byline) { byline in
                Text(byline)
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)
            }
        }
    }

    /// The same plate that closes every stop, so the walk starts the
    /// way it goes on.
    private var handOff: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("The first stop")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)

            Editable(.startLabel(content.slug), original: content.tour.startLabel) { label in
                Text(label)
                    .font(RF.body(15.5))
                    .foregroundStyle(RF.ink.opacity(0.8))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)
            }

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
