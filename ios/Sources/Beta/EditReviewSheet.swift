import SwiftUI
import UIKit

// ------------------------------------------------------------------
// The pass, read back.
//
// Everything changed so far in one list, with the way out at the top.
// Export writes the Markdown document to a file and hands it to the
// share sheet, so it can go to Claude by AirDrop, Mail, Messages, or
// straight into Files. Copy puts the same text on the clipboard for
// when pasting is quicker than sending.
// ------------------------------------------------------------------

struct EditReviewSheet: View {
    @EnvironmentObject private var edits: EditStore
    @Environment(\.dismiss) private var dismiss

    @State private var exportURL: URL?
    @State private var copied = false
    @State private var confirmClear = false

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    summary
                    if edits.total > 0 {
                        list
                        clearButton
                    } else {
                        empty
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 44)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .background(RF.cream)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear { refreshExport() }
        .onChange(of: edits.total) { _, _ in refreshExport() }
        .confirmationDialog(
            "Throw away every edit?",
            isPresented: $confirmClear,
            titleVisibility: .visible
        ) {
            Button("Throw them away", role: .destructive) {
                edits.removeAll()
            }
            Button("Keep them", role: .cancel) {}
        } message: {
            Text("The tour goes back to the shipped wording. Export first if you have not.")
        }
    }

    private func refreshExport() {
        exportURL = edits.total > 0 ? edits.exportFile() : nil
    }

    private var header: some View {
        HStack {
            Text("Your edits")
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

    private var summary: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(countLine)
                .font(RF.body(15.5, weight: 600))
                .foregroundStyle(RF.ink.opacity(0.85))

            if let exportURL {
                HStack(spacing: 12) {
                    ShareLink(item: exportURL) {
                        Text("Export the document")
                            .font(RF.body(16, weight: 600))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 22)
                            .padding(.vertical, 13)
                            .background(RF.rust)
                            .background(Rectangle().fill(RF.ink.opacity(0.25)).offset(x: 5, y: 5))
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    Button {
                        UIPasteboard.general.string = edits.document()
                        Haptics.success()
                        copied = true
                    } label: {
                        Text(copied ? "Copied" : "Copy")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.forest)
                            .underline()
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                }
            }

            Toggle(isOn: $edits.showMarks) {
                Text("Show a faint rule beside everything editable")
                    .font(RF.body(14))
                    .foregroundStyle(RF.ink.opacity(0.75))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .tint(RF.forest)

            Text("Tap any writing in the app to change it. The small pencil on a photograph opens its caption and credit. Nothing here leaves the phone until you export it.")
                .font(RF.body(13))
                .foregroundStyle(RF.warmGrayDark)
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
    }

    private var countLine: String {
        let changes = edits.changeCount
        let notes = edits.noteCount
        if changes == 0 && notes == 0 { return "Nothing changed yet." }
        let a = "\(changes) text \(changes == 1 ? "change" : "changes")"
        let b = "\(notes) \(notes == 1 ? "note" : "notes")"
        return "\(a), \(b)."
    }

    private var empty: some View {
        Text("Open a walk and tap a paragraph. What you type shows up in the tour straight away, and lands here.")
            .font(RF.body(15))
            .foregroundStyle(RF.warmGrayDark)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var list: some View {
        let grouped = Dictionary(grouping: edits.sorted) { "\($0.slug)\u{1F}\($0.place)" }
        let order = edits.sorted.reduce(into: [String]()) { acc, edit in
            let key = "\(edit.slug)\u{1F}\(edit.place)"
            if !acc.contains(key) { acc.append(key) }
        }
        return VStack(alignment: .leading, spacing: 18) {
            ForEach(order, id: \.self) { group in
                let parts = group.split(separator: "\u{1F}", maxSplits: 1)
                VStack(alignment: .leading, spacing: 10) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Walk \(EditStore.prettySlug(String(parts.first ?? "")))")
                            .font(RF.body(12, weight: 600))
                            .foregroundStyle(RF.warmGrayDark)
                        Text(String(parts.last ?? ""))
                            .font(RF.display(18, weight: 600))
                            .foregroundStyle(RF.forest)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    VStack(spacing: 0) {
                        let rows = grouped[group] ?? []
                        ForEach(Array(rows.enumerated()), id: \.element.id) { i, edit in
                            row(edit)
                            if i < rows.count - 1 {
                                Rectangle().fill(RF.border.opacity(0.8)).frame(height: 1)
                            }
                        }
                    }
                    .plate()
                }
            }
        }
    }

    private func row(_ edit: WalkEdit) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(edit.field)
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 6)
                Button {
                    edits.remove(edit.key)
                } label: {
                    Text("Undo")
                        .font(RF.body(13, weight: 600))
                        .foregroundStyle(RF.plateRed)
                        .underline()
                        .frame(minHeight: 34)
                        .contentShape(Rectangle())
                }
            }
            if edit.changesText {
                Text(edit.replacement ?? "")
                    .font(RF.body(13.5))
                    .foregroundStyle(RF.ink.opacity(0.7))
                    .lineLimit(4)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if edit.hasNote {
                HStack(alignment: .top, spacing: 6) {
                    Image(systemName: "text.bubble")
                        .font(.system(size: 11))
                        .foregroundStyle(RF.forest.opacity(0.8))
                        .padding(.top, 2)
                    Text(edit.note ?? "")
                        .font(RF.body(13.5, italic: true))
                        .foregroundStyle(RF.forest.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var clearButton: some View {
        Button {
            confirmClear = true
        } label: {
            Text("Throw away every edit")
                .font(RF.body(14, weight: 600))
                .foregroundStyle(RF.plateRed)
                .underline()
                .frame(minHeight: 44)
                .contentShape(Rectangle())
        }
    }
}

// MARK: - The way in

/// The count, wherever there is room for it. Opens the review sheet.
struct EditsChip: View {
    @EnvironmentObject private var edits: EditStore
    var compact = false
    @State private var open = false

    var body: some View {
        if Beta.editing {
            Button {
                Haptics.tap()
                open = true
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "pencil.line")
                        .font(.system(size: 12, weight: .semibold))
                    Text(compact ? "\(edits.total)" : "Edits \(edits.total)")
                        .font(RF.body(compact ? 14 : 15, weight: 600))
                }
                .foregroundStyle(RF.plateRed)
                .padding(.horizontal, compact ? 10 : 14)
                .padding(.vertical, 7)
                .background(RF.plateRedGround)
                .overlay(Rectangle().strokeBorder(RF.plateRed.opacity(0.5), lineWidth: 1))
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .accessibilityLabel("Your edits, \(edits.total) so far")
            .accessibilityIdentifier("beta-edits")
            .sheet(isPresented: $open) {
                EditReviewSheet()
            }
        }
    }
}

/// The band across the top of home. It exists to be impossible to
/// miss, so a proofreading build cannot be mistaken for the app or
/// archived without someone seeing it.
struct BetaBand: View {
    @EnvironmentObject private var edits: EditStore

    var body: some View {
        if Beta.editing {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Proofreading build")
                        .font(RF.body(13, weight: 700))
                        .foregroundStyle(RF.plateRed)
                    Text("Tap any writing to change it. The pencil on a photograph opens its caption.")
                        .font(RF.body(12))
                        .foregroundStyle(RF.plateRed.opacity(0.8))
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 6)
                EditsChip(compact: true)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RF.plateRedGround)
            .overlay(alignment: .bottom) {
                Rectangle().fill(RF.plateRed.opacity(0.35)).frame(height: 1)
            }
        }
    }
}
