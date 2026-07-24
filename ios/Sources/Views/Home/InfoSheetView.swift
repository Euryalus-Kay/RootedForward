import SwiftUI

// ------------------------------------------------------------------
// The sheets behind the tour screen's info rows: the founder's
// essay and the red plates index. Keeping them here keeps the tour
// screen quiet.
// ------------------------------------------------------------------

struct InfoSheetView: View {
    @EnvironmentObject private var content: ContentStore
    @Environment(\.dismiss) private var dismiss

    let sheet: InfoSheet
    let onJumpToStop: (Int) -> Void

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                Group {
                    switch sheet {
                    case .essay: essay
                    case .plates: plates
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 48)
            }
        }
        .background(RF.cream)
        // The plates index is a short list; a half sheet fits it.
        .presentationDetents(sheet == .plates ? [.fraction(0.55), .large] : [.large])
        .presentationDragIndicator(sheet == .plates ? .visible : .automatic)
    }

    private var title: String {
        switch sheet {
        case .essay: return "Why this walk"
        case .plates: return "The tools of segregation"
        }
    }

    private var header: some View {
        HStack {
            Text(title)
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)
            Spacer()
            Button {
                dismiss()
            } label: {
                Text("Done")
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.cream)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(RF.forest)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            .accessibilityIdentifier("info-done")
        }
        .padding(.horizontal, 20)
        .padding(.top, 22)
        .padding(.bottom, 12)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    // MARK: - Essay

    private var essay: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(content.intro.title)
                .font(RF.display(27, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 18) {
                ForEach(Array(content.intro.paragraphs.enumerated()), id: \.offset) { _, paragraph in
                    MarkedText(text: paragraph)
                }
            }
            .padding(.top, 20)

            Text(content.intro.byline)
                .font(RF.display(14.5, weight: 400, italic: true))
                .foregroundStyle(RF.warmGrayDark)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 20)
        }
    }

    // MARK: - The tools of segregation

    private var plates: some View {
        let items: [(stopIndex: Int, title: String)] = content.tour.stops.enumerated().flatMap { index, stop in
            (stop.interrupts ?? []).map { (stopIndex: index, title: $0.title) }
        }
        return VStack(alignment: .leading, spacing: 16) {
            Text("Along the walk, red plates name the tools that built segregation.")
                .font(RF.body(15))
                .foregroundStyle(RF.ink.opacity(0.7))
                .lineSpacing(5)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.offset) { n, item in
                    Button {
                        Haptics.tap()
                        onJumpToStop(item.stopIndex)
                    } label: {
                        HStack(spacing: 12) {
                            Text(item.title)
                                .font(RF.body(15.5, weight: 600))
                                .foregroundStyle(RF.ink.opacity(0.85))
                                .multilineTextAlignment(.leading)
                            Spacer()
                            Text("Stop \(item.stopIndex + 1)")
                                .font(RF.body(13))
                                .foregroundStyle(RF.warmGrayDark)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(RF.warmGrayDark)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 14)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if n < items.count - 1 {
                        Rectangle().fill(RF.plateRed.opacity(0.15)).frame(height: 1)
                    }
                }
            }
            .redPlate()
        }
    }

}
