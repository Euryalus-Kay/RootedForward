import SwiftUI

// ------------------------------------------------------------------
// Settings, which is tour progress and the about links. There is no
// account and no sign-in anywhere in this app, so there is nothing
// here to manage and nothing for the privacy policy to qualify.
// ------------------------------------------------------------------

struct SettingsView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss

    @State private var confirmReset = false

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    tourPlate
                    aboutPlate
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 40)
            }
        }
        .background(RF.cream)
        .confirmationDialog(
            "Reset tour progress?",
            isPresented: $confirmReset,
            titleVisibility: .visible
        ) {
            Button("Reset progress", role: .destructive) {
                progress.reset()
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private var header: some View {
        HStack {
            Text("Settings")
                .font(RF.display(24, weight: 600))
                .foregroundStyle(RF.ink)
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
        }
        .padding(.horizontal, 18)
        .padding(.top, 22)
        .padding(.bottom, 12)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    // MARK: - Tour

    /// One row per tour rather than one vague global count, so the
    /// section names what it is talking about and a second tour is
    /// another row rather than a redesign.
    private var tourPlate: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Your tours")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)

            VStack(spacing: 0) {
                tourRow(
                    title: content.tour.title,
                    visited: progress.visitedCount(in: content.tour.mainline),
                    total: content.tour.mainline.count
                )
            }
            .plate()

            Text("Progress lives only on this phone. Nothing about where you walk leaves it.")
                .font(RF.body(13))
                .foregroundStyle(RF.warmGrayDark)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func tourRow(title: String, visited: Int, total: Int) -> some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.85))
                Spacer(minLength: 8)
                Text("\(visited) of \(total)")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(visited == total ? RF.forest : RF.warmGrayDark)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(RF.border)
                    Rectangle()
                        .fill(visited == total ? RF.forest : RF.rust)
                        .frame(width: geo.size.width * CGFloat(visited) / CGFloat(max(total, 1)))
                }
            }
            .frame(height: 3)
            .accessibilityHidden(true)

            HStack {
                Text(visited == 0
                    ? "Not started"
                    : visited == total ? "Walked end to end" : "Stops you have read")
                    .font(RF.body(13))
                    .foregroundStyle(RF.warmGrayDark)
                Spacer()
                Button {
                    confirmReset = true
                } label: {
                    Text("Reset")
                        .font(RF.body(14, weight: 600))
                        .foregroundStyle(visited == 0 ? RF.warmGrayLight : RF.forest)
                        .underline()
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
                .disabled(visited == 0)
                .accessibilityIdentifier("reset-progress")
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
        .padding(.bottom, 2)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(title), \(visited) of \(total) stops read")
    }

    // MARK: - About

    private var aboutPlate: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)
            Text("Rooted Forward is a student-run Chicago nonprofit. Walking tours, an online exhibit, a podcast, and housing policy work. Photograph credits appear with each image; sources are listed on every stop.")
                .font(RF.body(13.5))
                .foregroundStyle(RF.ink.opacity(0.65))
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: 12) {
                aboutLink("Rate the app on the App Store", url: "https://apps.apple.com/app/id6793979867?action=write-review")
                aboutLink("rooted-forward.org", url: "https://rooted-forward.org")
                aboutLink("Privacy policy", url: "https://rooted-forward.org/privacy")
                aboutLink("Contact us", url: "mailto:contact@rooted-forward.org")
            }
            .padding(.top, 4)

            Text("Version \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")")
                .font(RF.body(12))
                .foregroundStyle(RF.warmGrayDark)
                .padding(.top, 8)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
    }

    private func aboutLink(_ label: String, url: String) -> some View {
        Link(destination: URL(string: url)!) {
            HStack(spacing: 5) {
                Text(label)
                    .font(RF.body(14.5, weight: 500))
                    .underline()
                Image(systemName: "arrow.up.right")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(RF.forest)
            .frame(minHeight: 34, alignment: .leading)
            .contentShape(Rectangle())
        }
    }
}
