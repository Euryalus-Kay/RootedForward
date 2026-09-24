import SwiftUI

// ------------------------------------------------------------------
// One card of the walk survey, drawn the way the detour notice is: a
// plate over the dimmed page rather than a system sheet, so it reads
// as a page of the walk and not as an interruption from the phone.
//
// Questions with nothing to type. A scale is the surveyor's rule
// from the rest of the app, a hairline with a tick at every point,
// taken with a tap or a drag. A choice is a row of square boxes that
// press into the paper when picked, the way every button here does.
// Skip is always one tap away, and Submit wakes only once every
// question has an answer, because the site refuses a partial card.
//
// The words and questions come from the site (src/lib/walk-survey.ts)
// by way of /api/walk. This view only knows how to draw the two kinds
// of question, and TourView never offers a card holding a kind it
// cannot draw.
// ------------------------------------------------------------------

struct SurveyCard: View {
    let survey: WalkSurvey
    let phase: SurveyPhase
    /// Nil for Skip, the answers for Submit.
    let finish: ([String: SurveyAnswer]?) -> Void

    @State private var points: [String: Int] = [:]
    @State private var choices: [String: String] = [:]
    @State private var sent = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var part: WalkSurveyPart { survey.part(phase) }

    private var answers: [String: SurveyAnswer] {
        var out: [String: SurveyAnswer] = [:]
        for q in part.questions {
            if q.kind == "scale", let p = points[q.id] { out[q.id] = .point(p) }
            if q.kind == "choice", let c = choices[q.id] { out[q.id] = .option(c) }
        }
        return out
    }

    private var complete: Bool { answers.count == part.questions.count }

    var body: some View {
        ZStack {
            RF.ink.opacity(0.45)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            // The whole card at its full measure when it fits, then two
            // tighter measures of the same card, so it stands whole with
            // Submit on screen on every current phone at the default text
            // size. The SE and the accessibility text sizes scroll it in
            // place.
            ViewThatFits(in: .vertical) {
                plate(.regular)
                    .padding(.horizontal, 22)
                    .padding(.vertical, SurveyMetrics.regular.outer)
                plate(.compact)
                    .padding(.horizontal, 22)
                    .padding(.vertical, SurveyMetrics.compact.outer)
                plate(.dense)
                    .padding(.horizontal, 18)
                    .padding(.vertical, SurveyMetrics.dense.outer)
                // Held off the screen's edges and clipped to its own box,
                // so the card scrolls inside the dimmed page instead of
                // sliding under the status bar. The side margin is inside
                // the scroll so the plate's offset shadow is not cut.
                ScrollView {
                    plate(.compact, scrolls: true)
                        .padding(.horizontal, 22)
                        .padding(.vertical, 6)
                }
                .scrollBounceBehavior(.basedOnSize)
                .clipped()
                .padding(.vertical, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityAddTraits(.isModal)
        .onAppear { Haptics.warm() }
    }

    /// `scrolls` is true for the card inside the scrolling fallback,
    /// where the rules answer to a tap only, so a drag that starts on
    /// one still scrolls the card.
    private func plate(_ m: SurveyMetrics, scrolls: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            header(m)

            Text(part.body)
                .font(RF.body(m.bodySize))
                .foregroundStyle(RF.ink.opacity(0.75))
                .lineSpacing(m.bodyLeading)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, m.bodyTop)

            ForEach(part.questions) { question in
                questionView(question, m, scrolls: scrolls)
                    .padding(.top, m.questionTop)
            }

            footer(m)
                .padding(.top, m.footerTop)
        }
        .padding(.horizontal, m.side)
        .padding(.vertical, m.pad)
        .frame(maxWidth: 380, alignment: .leading)
        .plate()
        .allowsHitTesting(!sent)
    }

    /// The title, with Skip hung over its right end rather than set
    /// beside it, so the button's 44 point target does not push the
    /// text below it down.
    private func header(_ m: SurveyMetrics) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(part.title)
                .font(RF.display(m.title, weight: 600))
                .foregroundStyle(RF.forest)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)
            if let note = part.note, !note.isEmpty {
                Text(note)
                    .font(RF.display(15, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGrayDark)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.trailing, 64)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .topTrailing) {
            Button {
                Haptics.tap()
                finish(nil)
            } label: {
                Text(survey.skip)
                    .font(RF.body(15, weight: 500, maxScale: 1.3))
                    .foregroundStyle(RF.ink.opacity(0.6))
                    .padding(.leading, 8)
                    .frame(minWidth: 44, minHeight: 44, alignment: .trailing)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            // Level with the title's first line.
            .offset(y: -9)
            .opacity(sent ? 0 : 1)
            .accessibilityLabel("Skip the survey")
            .accessibilityIdentifier("survey-skip")
        }
    }

    @ViewBuilder
    private func questionView(_ q: WalkSurveyQuestion, _ m: SurveyMetrics, scrolls: Bool) -> some View {
        VStack(alignment: .leading, spacing: m.promptGap) {
            Text(q.prompt)
                .font(RF.body(m.promptSize, weight: 600))
                .foregroundStyle(RF.ink)
                .lineSpacing(2)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityHidden(true)

            if q.kind == "scale", let labels = q.labels {
                SurveyScale(
                    prompt: q.prompt,
                    labels: labels,
                    height: m.scaleHeight,
                    labelSize: m.labelSize,
                    labelGap: m.labelGap,
                    draggable: !scrolls,
                    value: Binding(
                        get: { points[q.id] },
                        set: { points[q.id] = $0 }
                    )
                )
                .accessibilityIdentifier("survey-scale-\(q.id)")
            } else if let options = q.options {
                SurveyChoices(
                    prompt: q.prompt,
                    options: options,
                    gap: m.choiceGap,
                    selection: Binding(
                        get: { choices[q.id] },
                        set: { choices[q.id] = $0 }
                    )
                )
            }
        }
    }

    /// Submit, and in its place once pressed a line of thanks the same
    /// height, so nothing on the card moves while it closes.
    @ViewBuilder
    private func footer(_ m: SurveyMetrics) -> some View {
        if sent {
            Text(survey.thanks)
                .font(RF.display(19, weight: 400, italic: true))
                .foregroundStyle(RF.forest)
                .frame(maxWidth: .infinity, minHeight: 22 + m.submitPad * 2)
                .transition(.opacity)
                .accessibilityIdentifier("survey-thanks")
        } else {
            Button {
                submit()
            } label: {
                Text(part.submit)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(SurveySubmitStyle(ready: complete, vertical: m.submitPad))
            .disabled(!complete)
            .animation(RFMotion.gated(.rfAppear, reduceMotion), value: complete)
            .accessibilityHint(complete ? "" : "Answer every question first")
            .accessibilityIdentifier("survey-submit")
        }
    }

    private func submit() {
        guard complete, !sent else { return }
        Haptics.success()
        let given = answers
        withAnimation(RFMotion.gated(.rfAppear, reduceMotion)) {
            sent = true
        }
        // Long enough to read the thanks, short enough not to wait on.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
            finish(given)
        }
    }
}

/// The card's measures. Regular on most phones; compact where the full
/// card would not fit, which at the default text size is the SE.
struct SurveyMetrics {
    let side: CGFloat
    let pad: CGFloat
    let title: CGFloat
    let bodySize: CGFloat
    let bodyLeading: CGFloat
    let bodyTop: CGFloat
    let questionTop: CGFloat
    let promptSize: CGFloat
    let promptGap: CGFloat
    let scaleHeight: CGFloat
    let labelSize: CGFloat
    let labelGap: CGFloat
    let choiceGap: CGFloat
    let footerTop: CGFloat
    /// the Submit button's padding above and below its label
    let submitPad: CGFloat
    /// space kept above and below the card
    let outer: CGFloat

    /// A Pro Max or Plus.
    static let regular = SurveyMetrics(
        side: 20, pad: 20, title: 23, bodySize: 14.5, bodyLeading: 3, bodyTop: 10,
        questionTop: 18, promptSize: 15.5, promptGap: 10, scaleHeight: 34,
        labelSize: 13, labelGap: 4, choiceGap: 11, footerTop: 22, submitPad: 15, outer: 12
    )
    /// A Pro.
    static let compact = SurveyMetrics(
        side: 18, pad: 16, title: 21, bodySize: 13.5, bodyLeading: 2, bodyTop: 6,
        questionTop: 12, promptSize: 15, promptGap: 6, scaleHeight: 30,
        labelSize: 12.5, labelGap: 2, choiceGap: 10, footerTop: 16, submitPad: 13, outer: 6
    )
    /// The standard sizes, 844 to 852 points tall.
    static let dense = SurveyMetrics(
        side: 16, pad: 14, title: 20, bodySize: 13, bodyLeading: 1.5, bodyTop: 5,
        questionTop: 9, promptSize: 14.5, promptGap: 4, scaleHeight: 28,
        labelSize: 12, labelGap: 1, choiceGap: 8, footerTop: 13, submitPad: 12, outer: 4
    )
}

/// The primary button, and before every question has an answer a flat
/// slab of the darker cream with no shadow, so it reads as not yet
/// rather than as a faded version of itself.
private struct SurveySubmitStyle: ButtonStyle {
    let ready: Bool
    var vertical: CGFloat = 15

    func makeBody(configuration: Configuration) -> some View {
        let pressed = ready && configuration.isPressed
        return configuration.label
            .font(RF.body(17, weight: 600))
            .foregroundStyle(ready ? Color.white : RF.warmGrayDark)
            .padding(.horizontal, 28)
            .padding(.vertical, vertical)
            .background(ready ? RF.rust : RF.creamDark)
            .overlay(Rectangle().strokeBorder(ready ? Color.clear : RF.border, lineWidth: 1))
            .background(
                Rectangle()
                    .fill(RF.ink.opacity(ready ? 0.25 : 0))
                    .offset(x: pressed ? 1 : 5, y: pressed ? 1 : 5)
            )
            .offset(x: pressed ? 3 : 0, y: pressed ? 3 : 0)
            .animation(RFMotion.press, value: configuration.isPressed)
    }
}

// MARK: - Scale

/// The surveyor's rule as a control. A hairline with a tick at every
/// point, the two ends drawn taller the way SurveyRule draws them, a
/// hollow mark on each point until one is taken, then the rule inks
/// in rust up to a paper knob. Nothing is chosen until the walker
/// chooses, so no answer leans toward wherever a thumb started.
struct SurveyScale: View {
    let prompt: String
    let labels: [String]
    var height: CGFloat = 34
    var labelSize: CGFloat = 13
    var labelGap: CGFloat = 4
    /// Off inside a scrolling card, where a drag belongs to the scroll.
    var draggable: Bool = true
    @Binding var value: Int?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private let feedback = UISelectionFeedbackGenerator()

    private var count: Int { max(labels.count, 2) }
    /// Keeps the knob inside the card at either end.
    private let inset: CGFloat = 14

    var body: some View {
        VStack(spacing: labelGap) {
            GeometryReader { geo in
                let width = max(geo.size.width - inset * 2, 1)
                let step = width / CGFloat(count - 1)
                let mid = geo.size.height / 2

                ZStack(alignment: .topLeading) {
                    Path { p in
                        p.move(to: CGPoint(x: inset, y: mid))
                        p.addLine(to: CGPoint(x: inset + width, y: mid))
                    }
                    .stroke(RF.ink.opacity(0.35), lineWidth: 1)

                    if let v = value, v > 1 {
                        Path { p in
                            p.move(to: CGPoint(x: inset, y: mid))
                            p.addLine(to: CGPoint(x: inset + CGFloat(v - 1) * step, y: mid))
                        }
                        .stroke(RF.rust, lineWidth: 2)
                    }

                    ForEach(0..<count, id: \.self) { i in
                        let point = i + 1
                        let x = inset + CGFloat(i) * step
                        let inked = (value ?? 0) >= point
                        let end = i == 0 || i == count - 1
                        Rectangle()
                            .fill(inked ? RF.rust : RF.ink.opacity(0.35))
                            .frame(width: 1, height: end ? 16 : 9)
                            .position(x: x, y: mid)
                        if value != point {
                            Circle()
                                .fill(inked ? RF.rust : RF.paper)
                                .overlay(
                                    Circle().strokeBorder(
                                        inked ? RF.rust : RF.ink.opacity(0.4), lineWidth: 1
                                    )
                                )
                                .frame(width: 9, height: 9)
                                .position(x: x, y: mid)
                        }
                    }

                    if let v = value {
                        knob
                            .position(x: inset + CGFloat(v - 1) * step, y: mid)
                            .animation(RFMotion.gated(.rfPress, reduceMotion), value: v)
                    }
                }
                // Eight points past the rule on every side, so the
                // target is 44 points tall at the densest measure.
                .contentShape(Rectangle().inset(by: -8))
                // A tap answers where it lands. A sideways drag slides
                // the knob, except inside a scrolling card, where any drag
                // gesture on the rule would hold the scroll hostage.
                .onTapGesture { location in
                    pick(at: location.x, step: step)
                }
                .simultaneousGesture(
                    DragGesture(minimumDistance: 10)
                        .onChanged { drag in
                            let t = drag.translation
                            guard abs(t.width) > abs(t.height) else { return }
                            pick(at: drag.location.x, step: step)
                        },
                    including: draggable ? .all : .subviews
                )
            }
            .frame(height: height)

            ZStack {
                HStack(alignment: .firstTextBaseline) {
                    endLabel(labels.first ?? "", active: value == 1)
                    Spacer(minLength: 8)
                    endLabel(labels.last ?? "", active: value == count)
                }
                if let v = value, v > 1, v < count {
                    Text(labels[v - 1])
                        .font(RF.body(labelSize, weight: 600, maxScale: 1.4))
                        .foregroundStyle(RF.forest)
                        .lineLimit(1)
                        .transition(.opacity)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(prompt)
        .accessibilityValue(value.map { labels[$0 - 1] } ?? "Not answered")
        .accessibilityAdjustableAction { direction in
            switch direction {
            case .increment: value = min((value ?? 0) + 1, count)
            case .decrement: value = max((value ?? 2) - 1, 1)
            @unknown default: break
            }
        }
    }

    /// The point nearest a place on the rule.
    private func pick(at x: CGFloat, step: CGFloat) {
        let raw = (x - inset) / step
        let picked = min(max(Int(raw.rounded()) + 1, 1), count)
        guard picked != value else { return }
        value = picked
        feedback.selectionChanged()
    }

    /// A paper knob with a rust center and the hard offset shadow the
    /// round pills carry.
    private var knob: some View {
        ZStack {
            Circle()
                .fill(RF.ink.opacity(0.18))
                .offset(x: 2, y: 2)
            Circle()
                .fill(RF.paper)
                .overlay(Circle().strokeBorder(RF.ink.opacity(0.35), lineWidth: 1))
            Circle()
                .fill(RF.rust)
                .frame(width: 10, height: 10)
        }
        .frame(width: 26, height: 26)
    }

    private func endLabel(_ text: String, active: Bool) -> some View {
        Text(text)
            .font(RF.body(labelSize, weight: active ? 600 : 400, maxScale: 1.4))
            .foregroundStyle(active ? RF.forest : RF.warmGrayDark)
            .lineLimit(1)
    }
}

// MARK: - Choices

/// Square boxes, two to a row, or all in one row when there are three
/// or fewer. The picked box presses into the paper and fills forest,
/// the same travel the primary button makes under a finger.
struct SurveyChoices: View {
    let prompt: String
    let options: [WalkSurveyOption]
    var gap: CGFloat = 11
    @Binding var selection: String?

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var rows: [[WalkSurveyOption]] {
        let perRow = options.count <= 3 ? options.count : 2
        return stride(from: 0, to: options.count, by: perRow).map {
            Array(options[$0..<min($0 + perRow, options.count)])
        }
    }

    var body: some View {
        VStack(spacing: gap) {
            ForEach(rows.indices, id: \.self) { r in
                HStack(spacing: gap) {
                    ForEach(rows[r], id: \.value) { option in
                        box(option)
                    }
                }
            }
        }
        // Room for the shadow of the bottom row.
        .padding(.bottom, 3)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(prompt)
    }

    private func box(_ option: WalkSurveyOption) -> some View {
        let on = selection == option.value
        return Button {
            guard selection != option.value else { return }
            Haptics.tap()
            selection = option.value
        } label: {
            Text(option.label)
                .font(RF.body(15, weight: on ? 600 : 500, maxScale: 1.4))
                .foregroundStyle(on ? RF.cream : RF.ink.opacity(0.85))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
                .padding(.horizontal, 8)
                .frame(maxWidth: .infinity, minHeight: 44)
                .background(on ? RF.forest : Color.white)
                .overlay(
                    Rectangle().strokeBorder(on ? RF.forest : RF.ink.opacity(0.22), lineWidth: 1)
                )
                .background(
                    Rectangle()
                        .fill(RF.ink.opacity(on ? 0 : 0.14))
                        .offset(x: 3, y: 3)
                )
                .offset(x: on ? 3 : 0, y: on ? 3 : 0)
                .animation(RFMotion.gated(.rfPress, reduceMotion), value: on)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.label)
        .accessibilityAddTraits(on ? .isSelected : [])
        .accessibilityIdentifier("survey-option-\(option.value)")
    }
}
