import SwiftUI

// ------------------------------------------------------------------
// The sheets behind the tour screen's info rows, the red plates
// index and the practical details. Keeping them here keeps the tour
// screen quiet. The founder's essay used to be a third sheet; it is
// the page in front of stop one now, in IntroPage.
// ------------------------------------------------------------------

struct InfoSheetView: View {
    @EnvironmentObject private var content: ContentStore
    @Environment(\.dismiss) private var dismiss

    let sheet: InfoSheet
    /// Stop index, and the red plate to land on inside it.
    let onJumpToStop: (Int, String?) -> Void

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                Group {
                    switch sheet {
                    case .plates: plates
                    case .details: details
                    case .dayTrip: dayTrip
                    case .checks: checks
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 48)
            }
        }
        .background(RF.cream)
        .presentationDetents([.fraction(0.6), .large])
        .presentationDragIndicator(.visible)
    }

    private var title: String {
        switch sheet {
        case .plates: return "The tools of segregation"
        case .details: return "About this walk"
        case .dayTrip: return content.tour.dayTrip?.title ?? "Not on the route"
        case .checks: return content.tour.checks?.title ?? "How we checked this"
        }
    }

    // MARK: - The day trip

    /// A place the walk points at but cannot reach on foot. Harlem's
    /// is Addisleigh Park, an hour away in Queens, and it carries its
    /// own recording, so the sheet is a short read with a player.
    @ViewBuilder private var dayTrip: some View {
        if let trip = content.tour.dayTrip {
            VStack(alignment: .leading, spacing: 16) {
                Text(trip.dek)
                    .font(RF.display(17, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)

                AudioBar(
                    src: trip.audioSrc,
                    seconds: trip.audioSeconds,
                    label: trip.title
                )

                ForEach(Array(trip.body.enumerated()), id: \.offset) { _, para in
                    MarkedText(text: para, size: 16)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Corrections

    /// What the research threw out. Printed because the corrections
    /// are more interesting than the errors, and because a reader who
    /// meets one of these elsewhere will know what happened.
    @ViewBuilder private var checks: some View {
        if let checks = content.tour.checks {
            VStack(alignment: .leading, spacing: 18) {
                Text(checks.intro)
                    .font(RF.body(15.5))
                    .foregroundStyle(RF.ink.opacity(0.75))
                    .lineSpacing(5)
                    .fixedSize(horizontal: false, vertical: true)

                ForEach(Array(checks.items.enumerated()), id: \.offset) { _, item in
                    HStack(alignment: .top, spacing: 12) {
                        Rectangle()
                            .fill(RF.rust.opacity(0.35))
                            .frame(width: 2)
                        MarkedText(text: item, size: 15)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Details

    /// The numbers and the practical notes, kept behind a quiet mark
    /// on the walk screen so they are there when someone wants them
    /// and out of the way when they do not.
    private var details: some View {
        let tour = content.tour
        return VStack(alignment: .leading, spacing: 22) {
            VStack(spacing: 0) {
                detailRow("Stops", "\(tour.mainline.count), plus two optional detours")
                detailDivider
                detailRow("Distance", "About \(String(format: "%.0f", tour.distanceMiles)) miles")
                detailDivider
                detailRow("Walking", "About \(tour.walkMinutes) minutes")
                detailDivider
                detailRow("Narration", "\(tour.listenMinutes) minutes")
                detailDivider
                detailRow("Starts at", tour.startLabel)
            }
            .plate()

            ForEach(tour.practical) { item in
                VStack(alignment: .leading, spacing: 7) {
                    Text(item.title)
                        .font(RF.display(18, weight: 600))
                        .foregroundStyle(RF.forest)
                        .accessibilityAddTraits(.isHeader)
                    Text(item.text)
                        .font(RF.body(15.5))
                        .foregroundStyle(RF.ink.opacity(0.8))
                        .lineSpacing(5)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 14) {
            Text(label)
                .font(RF.body(14.5))
                .foregroundStyle(RF.warmGrayDark)
                .frame(width: 86, alignment: .leading)
            Text(value)
                .font(RF.body(15, weight: 500))
                .foregroundStyle(RF.ink.opacity(0.85))
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .accessibilityElement(children: .combine)
    }

    private var detailDivider: some View {
        Rectangle().fill(RF.border.opacity(0.8)).frame(height: 1)
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

    // MARK: - The tools of segregation

    private var plates: some View {
        let items: [(stopIndex: Int, title: String, plate: String)] = content.tour.stops.enumerated().flatMap { index, stop in
            (stop.interrupts ?? []).map { (stopIndex: index, title: $0.title, plate: $0.id) }
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
                        onJumpToStop(item.stopIndex, item.plate)
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
