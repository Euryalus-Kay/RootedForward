import SwiftUI

// ------------------------------------------------------------------
// The sheets behind the home screen's info rows: the founder's
// essay, the five red plates, and the practical notes. Keeping them
// here keeps the home screen quiet.
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
                    case .practical: practical
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 48)
            }
        }
        .background(RF.cream)
    }

    private var title: String {
        switch sheet {
        case .essay: return "Why this walk"
        case .plates: return "The five red plates"
        case .practical: return "Before you walk"
        }
    }

    private var header: some View {
        HStack {
            Text(title)
                .font(RF.display(22, weight: 600))
                .foregroundStyle(RF.ink)
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
                .foregroundStyle(RF.warmGray)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 20)
        }
    }

    // MARK: - The five red plates

    private var plates: some View {
        let items: [(stopIndex: Int, title: String)] = content.tour.stops.enumerated().flatMap { index, stop in
            (stop.interrupts ?? []).map { (stopIndex: index, title: $0.title) }
        }
        return VStack(alignment: .leading, spacing: 16) {
            Text("Along the walk, five red plates name the tools that built segregation, one by one.")
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
                            Text("\(n + 1)")
                                .font(RF.didone(15, weight: 600))
                                .foregroundStyle(RF.plateRedGround)
                                .frame(width: 24, height: 24)
                                .background(Circle().fill(RF.plateRed))
                            Text(item.title)
                                .font(RF.body(15.5, weight: 600))
                                .foregroundStyle(RF.ink.opacity(0.85))
                                .multilineTextAlignment(.leading)
                            Spacer()
                            Text("Stop \(item.stopIndex + 1)")
                                .font(RF.body(13))
                                .foregroundStyle(RF.warmGray)
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(RF.warmGray)
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

    // MARK: - Practical

    private var practical: some View {
        VStack(alignment: .leading, spacing: 24) {
            ForEach(content.tour.practical) { card in
                VStack(alignment: .leading, spacing: 8) {
                    Text(card.title)
                        .font(RF.display(18, weight: 600))
                        .foregroundStyle(RF.forest)
                    Text(card.text)
                        .font(RF.body(15))
                        .foregroundStyle(RF.ink.opacity(0.75))
                        .lineSpacing(5)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}
