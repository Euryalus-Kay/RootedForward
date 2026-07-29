import SwiftUI

// ------------------------------------------------------------------
// Tapping the words.
//
// Editable wraps any piece of writing. With the switch off it draws
// exactly what it was given and adds nothing at all. With it on it
// draws the owner's version when there is one, marks it with a rule
// in the margin, and opens the typing sheet on a tap.
//
// The wrapped view is built from the resolved string rather than from
// the shipped one, so a page cannot show old words while holding a
// new edit, and the tap and the text can never fall out of step.
// ------------------------------------------------------------------

struct Editable<Content: View>: View {
    @EnvironmentObject private var edits: EditStore

    private let makeTarget: () -> EditTarget
    private let original: String
    private let content: (String) -> Content

    @State private var open = false

    init(
        _ target: @autoclosure @escaping () -> EditTarget,
        original: String,
        @ViewBuilder content: @escaping (String) -> Content
    ) {
        self.makeTarget = target
        self.original = original
        self.content = content
    }

    var body: some View {
        if Beta.editing {
            let target = makeTarget()
            let record = edits.edit(for: target.key)
            content(record?.display ?? original)
                .overlay(alignment: .leading) { margin(record) }
                .contentShape(Rectangle())
                .onTapGesture {
                    Haptics.tap()
                    open = true
                }
                .sheet(isPresented: $open) {
                    EditSheet(target: target, original: original)
                }
        } else {
            content(original)
        }
    }

    /// A change bar in the margin, the way a proof is marked. Rust for
    /// rewritten text, forest for a note, and the faint rule only when
    /// the owner has asked to see what is editable.
    @ViewBuilder
    private func margin(_ record: WalkEdit?) -> some View {
        if let record, record.changesText {
            Rectangle().fill(RF.rust).frame(width: 2).offset(x: -9)
        } else if let record, record.hasNote {
            Rectangle().fill(RF.forest.opacity(0.7)).frame(width: 2).offset(x: -9)
        } else if edits.showMarks {
            Rectangle().fill(RF.warmGrayLight.opacity(0.55)).frame(width: 1).offset(x: -9)
        }
    }
}

// MARK: - The typing sheet

struct EditSheet: View {
    @EnvironmentObject private var edits: EditStore
    @Environment(\.dismiss) private var dismiss

    let target: EditTarget
    let original: String

    @State private var draft = ""
    @State private var note = ""
    @State private var loaded = false
    @State private var showOriginal = false
    @FocusState private var typing: Bool

    var body: some View {
        VStack(spacing: 0) {
            bar
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    heading
                    editor
                    noteField
                    if draft != original {
                        Button {
                            draft = original
                        } label: {
                            Text("Put the shipped wording back")
                                .font(RF.body(14, weight: 600))
                                .foregroundStyle(RF.forest)
                                .underline()
                                .frame(minHeight: 44)
                        }
                    }
                    if edits.edit(for: target.key) != nil {
                        Button {
                            edits.remove(target.key)
                            dismiss()
                        } label: {
                            Text("Drop this edit")
                                .font(RF.body(14, weight: 600))
                                .foregroundStyle(RF.plateRed)
                                .underline()
                                .frame(minHeight: 44)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 40)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .background(RF.cream)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear {
            guard !loaded else { return }
            loaded = true
            let record = edits.edit(for: target.key)
            draft = record?.replacement ?? original
            note = record?.note ?? ""
            // The point of the build is typing, so the caret is already
            // in the paragraph when the sheet arrives.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { typing = true }
        }
    }

    private var bar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Text("Cancel")
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.7))
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            Spacer()
            Button {
                edits.save(
                    target: target, original: original,
                    replacement: draft, note: note
                )
                Haptics.success()
                dismiss()
            } label: {
                Text("Save")
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.cream)
                    .padding(.horizontal, 22)
                    .padding(.vertical, 10)
                    .background(RF.forest)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            .accessibilityIdentifier("edit-save")
        }
        .padding(.horizontal, 18)
        .padding(.top, 16)
        .padding(.bottom, 10)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(target.place)
                .font(RF.display(21, weight: 600))
                .foregroundStyle(RF.forest)
                .fixedSize(horizontal: false, vertical: true)
            Text(target.field)
                .font(RF.body(14))
                .foregroundStyle(RF.warmGrayDark)
            Text(target.key)
                .font(.system(size: 10.5, design: .monospaced))
                .foregroundStyle(RF.warmGrayLight)
                .padding(.top, 2)
        }
    }

    private var editor: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextEditor(text: $draft)
                .focused($typing)
                .font(RF.body(16))
                .foregroundStyle(RF.ink)
                .lineSpacing(4)
                .scrollContentBackground(.hidden)
                .background(RF.paper)
                .frame(minHeight: 220)
                .padding(10)
                .plate()
                .accessibilityIdentifier("edit-text")

            Text("Type here the way you would anywhere else. Two stars around a phrase make it bold, one star makes it italic, the same as the site.")
                .font(RF.body(12.5))
                .foregroundStyle(RF.warmGrayDark)
                .fixedSize(horizontal: false, vertical: true)

            if draft != original {
                DisclosureGroup(isExpanded: $showOriginal) {
                    Text(original)
                        .font(RF.body(14))
                        .foregroundStyle(RF.ink.opacity(0.7))
                        .lineSpacing(4)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.top, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } label: {
                    Text("What it says now")
                        .font(RF.body(13.5, weight: 600))
                        .foregroundStyle(RF.warmGrayDark)
                }
                .tint(RF.warmGrayDark)
            }
        }
    }

    private var noteField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("A note, if you want one")
                .font(RF.display(16, weight: 600))
                .foregroundStyle(RF.forest)
            TextEditor(text: $note)
                .font(RF.body(15))
                .foregroundStyle(RF.ink)
                .scrollContentBackground(.hidden)
                .background(RF.paper)
                .frame(minHeight: 90)
                .padding(10)
                .plate()
                .overlay(alignment: .topLeading) {
                    if note.isEmpty {
                        Text("Say what you want done here. It rides along with the change.")
                            .font(RF.body(14))
                            .foregroundStyle(RF.warmGrayLight)
                            .padding(.horizontal, 16)
                            .padding(.top, 18)
                            .allowsHitTesting(false)
                    }
                }
                .accessibilityIdentifier("edit-note")
        }
    }
}

// MARK: - A note that belongs to no one sentence

/// The button under a page for a comment about the whole thing, the
/// kind that asks for a photograph or says a stop runs long.
struct NoteButton: View {
    @EnvironmentObject private var edits: EditStore
    let makeTarget: (Int) -> EditTarget
    let existing: Int

    @State private var open = false

    var body: some View {
        if Beta.editing {
            Button {
                Haptics.tap()
                open = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 13, weight: .medium))
                    Text(existing == 0
                        ? "Add a note about this page"
                        : "Add another note (\(existing) so far)")
                        .font(RF.body(14, weight: 600))
                }
                .foregroundStyle(RF.forest)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .overlay(
                    Rectangle().strokeBorder(
                        RF.forest.opacity(0.45),
                        style: StrokeStyle(lineWidth: 1, dash: [4, 3])
                    )
                )
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .padding(.top, 26)
            .sheet(isPresented: $open) {
                EditSheet(target: makeTarget(existing + 1), original: "")
            }
        }
    }
}

// MARK: - The paperwork on a photograph

/// Which photograph, on which stop, so its caption and credit have a
/// key. Set only in a proofreading build.
struct PhotoEditContext: Equatable {
    let slug: String
    let stop: WalkStop
    let index: Int
}

/// Caption, credit, and the description VoiceOver reads, all three at
/// once, because a photograph is usually wrong in more than one of
/// them at a time.
struct PhotoEditSheet: View {
    @EnvironmentObject private var edits: EditStore
    @Environment(\.dismiss) private var dismiss

    let slug: String
    let stop: WalkStop
    let index: Int
    let image: WalkImage

    @State private var caption = ""
    @State private var credit = ""
    @State private var alt = ""
    @State private var note = ""
    @State private var loaded = false

    private var captionTarget: EditTarget { .photo(slug, stop, index, .caption) }
    private var creditTarget: EditTarget { .photo(slug, stop, index, .credit) }
    private var altTarget: EditTarget { .photo(slug, stop, index, .alt) }

    var body: some View {
        VStack(spacing: 0) {
            bar
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Photograph \(index + 1)")
                            .font(RF.display(21, weight: 600))
                            .foregroundStyle(RF.forest)
                        Text(stop.title)
                            .font(RF.body(14))
                            .foregroundStyle(RF.warmGrayDark)
                        Text(image.src)
                            .font(.system(size: 10.5, design: .monospaced))
                            .foregroundStyle(RF.warmGrayLight)
                            .padding(.top, 2)
                    }

                    MediaImage(sitePath: image.src)
                        .frame(maxWidth: .infinity)
                        .frame(maxHeight: 190)
                        .clipped()
                        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.18), lineWidth: 1))

                    field("The caption under the photograph", text: $caption, height: 70)
                    field("The credit line", text: $credit, height: 90)
                    field("What VoiceOver reads", text: $alt, height: 90)
                    field("A note, if you want one", text: $note, height: 80)

                    Text("A photograph that is simply wrong is best said here in the note. Ask for a different picture and say what it should show.")
                        .font(RF.body(12.5))
                        .foregroundStyle(RF.warmGrayDark)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 20)
                .padding(.top, 18)
                .padding(.bottom, 40)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .background(RF.cream)
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
        .onAppear {
            guard !loaded else { return }
            loaded = true
            caption = edits.edit(for: captionTarget.key)?.replacement ?? (image.label ?? "")
            credit = edits.edit(for: creditTarget.key)?.replacement ?? image.credit
            alt = edits.edit(for: altTarget.key)?.replacement ?? image.alt
            note = edits.edit(for: captionTarget.key)?.note ?? ""
        }
    }

    private func field(_ label: String, text: Binding<String>, height: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label)
                .font(RF.display(16, weight: 600))
                .foregroundStyle(RF.forest)
            TextEditor(text: text)
                .font(RF.body(15))
                .foregroundStyle(RF.ink)
                .scrollContentBackground(.hidden)
                .background(RF.paper)
                .frame(minHeight: height)
                .padding(10)
                .plate()
        }
    }

    private var bar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Text("Cancel")
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.7))
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
            Spacer()
            Button {
                // The note rides on the caption entry, so one photograph
                // is one thing to read in the export rather than four.
                edits.save(
                    target: captionTarget, original: image.label ?? "",
                    replacement: caption, note: note
                )
                edits.save(
                    target: creditTarget, original: image.credit,
                    replacement: credit, note: nil
                )
                edits.save(
                    target: altTarget, original: image.alt,
                    replacement: alt, note: nil
                )
                Haptics.success()
                dismiss()
            } label: {
                Text("Save")
                    .font(RF.body(16, weight: 600))
                    .foregroundStyle(RF.cream)
                    .padding(.horizontal, 22)
                    .padding(.vertical, 10)
                    .background(RF.forest)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 16)
        .padding(.bottom, 10)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }
}
