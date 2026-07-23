import SwiftUI
import CoreText

// ------------------------------------------------------------------
// The Rooted Forward look, ported from the site's Tailwind theme.
// Colors come from globals.css; type comes from the three bundled
// Google Fonts (all SIL OFL): Bodoni Moda for tour titles, Fraunces
// for display text, DM Sans for body. The fonts ship as variable
// TTFs, so weights resolve through the wght variation axis rather
// than guessed PostScript instance names.
// ------------------------------------------------------------------

enum RF {
    // Palette (globals.css @theme)
    static let cream = Color(rfHex: 0xF5F0E8)
    static let creamDark = Color(rfHex: 0xEDE6D8)
    static let paper = Color(rfHex: 0xFBF8F2)
    static let forest = Color(rfHex: 0x1B3A2D)
    static let forestLight = Color(rfHex: 0x2A5440)
    static let ink = Color(rfHex: 0x1A1A1A)
    static let inkLight = Color(rfHex: 0x3A3A3A)
    static let rust = Color(rfHex: 0xC45D3E)
    static let rustLight = Color(rfHex: 0xD4765C)
    static let rustDark = Color(rfHex: 0xA8462A)
    static let warmGray = Color(rfHex: 0x8A8578)
    static let warmGrayLight = Color(rfHex: 0xB5AFA4)
    static let border = Color(rfHex: 0xDDD6C8)
    // The red plates (walk-plate-red)
    static let plateRedGround = Color(rfHex: 0xF8EDE8)
    static let plateRed = Color(rfHex: 0x8C2A1A)
    // Map inks
    static let mapWater = Color(rfHex: 0x4A6B8A)
    static let mapBrass = Color(rfHex: 0xC9A227)
    static let mapRail = Color(rfHex: 0x6E6A5E)

    // Type
    static func didone(_ size: CGFloat, weight: CGFloat = 600) -> Font {
        BrandFonts.font(family: "Bodoni Moda", size: size, weight: weight, opticalSize: size)
    }
    static func display(_ size: CGFloat, weight: CGFloat = 600, italic: Bool = false) -> Font {
        BrandFonts.font(family: "Fraunces", size: size, weight: weight, italic: italic, opticalSize: size)
    }
    static func body(_ size: CGFloat, weight: CGFloat = 400, italic: Bool = false) -> Font {
        BrandFonts.font(family: "DM Sans", size: size, weight: weight, italic: italic)
    }
}

extension Color {
    init(rfHex hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

// MARK: - Font loading

enum BrandFonts {
    /// Registers every TTF bundled under Fonts/. Call once at launch.
    static func registerAll() {
        guard let urls = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: "Fonts"),
              !urls.isEmpty else { return }
        CTFontManagerRegisterFontsForURLs(urls as CFArray, .process, nil)
    }

    /// Resolves a variable font by family + weight axis. Falls back to
    /// the system serif/sans if the family is missing so the app never
    /// renders blank text.
    static func font(
        family: String,
        size: CGFloat,
        weight: CGFloat,
        italic: Bool = false,
        opticalSize: CGFloat? = nil
    ) -> Font {
        var variations: [Int: CGFloat] = [0x77676874: weight] // 'wght'
        if let opsz = opticalSize {
            variations[0x6F70737A] = opsz // 'opsz'
        }
        if family == "Fraunces" {
            variations[0x534F4654] = 0 // 'SOFT'
            variations[0x574F4E4B] = 0 // 'WONK', the site uses the upright cut
        }
        // Set traits explicitly both ways; the upright and italic files
        // share a family name, and an unconstrained descriptor can
        // resolve to the italic member.
        let attributes: [UIFontDescriptor.AttributeName: Any] = [
            .family: family,
            UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String): variations,
            .traits: [
                UIFontDescriptor.TraitKey.symbolic: italic
                    ? UIFontDescriptor.SymbolicTraits.traitItalic.rawValue
                    : 0
            ],
        ]
        let descriptor = UIFontDescriptor(fontAttributes: attributes)
        let uiFont = UIFont(descriptor: descriptor, size: size)
        if uiFont.familyName.caseInsensitiveCompare(family) == .orderedSame {
            return Font(uiFont)
        }
        // Fallback keeps the app legible if registration ever fails.
        let design: Font.Design = family == "DM Sans" ? .default : .serif
        var f = Font.system(size: size, weight: weight >= 600 ? .semibold : .regular, design: design)
        if italic { f = f.italic() }
        return f
    }
}

// MARK: - Signature pieces

/// The plat-map scale divider used across the site (SurveyRule.tsx).
struct SurveyRule: View {
    var color: Color = RF.rust
    var width: CGFloat = 96

    var body: some View {
        Canvas { context, size in
            let h = size.height
            let mid = h / 2
            var line = Path()
            line.move(to: CGPoint(x: 0.5, y: mid))
            line.addLine(to: CGPoint(x: size.width - 0.5, y: mid))
            context.stroke(line, with: .color(color), lineWidth: 1)
            let ticks: [(CGFloat, CGFloat)] = [
                (0.5, 1), (size.width * 0.25, 0.5), (size.width * 0.5, 0.5),
                (size.width * 0.75, 0.5), (size.width - 0.5, 1),
            ]
            for (x, scale) in ticks {
                var tick = Path()
                tick.move(to: CGPoint(x: x, y: mid - (h / 2 - 1) * scale))
                tick.addLine(to: CGPoint(x: x, y: mid + (h / 2 - 1) * scale))
                context.stroke(tick, with: .color(color), lineWidth: 1)
            }
        }
        .frame(width: width, height: 12)
        .accessibilityHidden(true)
    }
}

/// The engraved plate card (walk-plate): paper ground, hairline ink
/// border, inner double ring, hard offset shadow.
struct PlateStyle: ViewModifier {
    var ground: Color = RF.paper
    var line: Color = RF.ink
    var lineOpacity: Double = 0.22
    var innerOpacity: Double = 0.14
    var shadow: Color = RF.forest.opacity(0.08)

    func body(content: Content) -> some View {
        content
            .background(ground)
            .overlay(
                Rectangle()
                    .strokeBorder(line.opacity(innerOpacity), lineWidth: 1)
                    .padding(3)
            )
            .overlay(
                Rectangle().strokeBorder(line.opacity(lineOpacity), lineWidth: 1)
            )
            .background(
                Rectangle().fill(shadow).offset(x: 5, y: 5)
            )
    }
}

extension View {
    func plate() -> some View {
        modifier(PlateStyle())
    }
    /// The red instrument plate (walk-plate-red).
    func redPlate() -> some View {
        modifier(PlateStyle(
            ground: RF.plateRedGround,
            line: RF.plateRed,
            lineOpacity: 0.55,
            innerOpacity: 0.4,
            shadow: RF.plateRed.opacity(0.16)
        ))
    }
    /// Small uppercase tracked label (the site's eyebrow style).
    func eyebrow(_ color: Color = RF.rust) -> some View {
        self
            .font(RF.body(12, weight: 600))
            .tracking(3)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }
}

/// A card that gives slightly under the finger, nothing more.
struct PressableCardStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.94 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

/// Primary CTA: rust ground, white label, hard offset shadow, the
/// site's signature button.
struct HardShadowButtonStyle: ButtonStyle {
    var ground: Color = RF.rust
    var label: Color = .white

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(RF.body(17, weight: 600))
            .foregroundStyle(label)
            .padding(.horizontal, 28)
            .padding(.vertical, 15)
            .background(ground)
            .background(
                Rectangle()
                    .fill(RF.ink.opacity(0.25))
                    .offset(x: configuration.isPressed ? 1 : 5, y: configuration.isPressed ? 1 : 5)
            )
            .offset(
                x: configuration.isPressed ? 3 : 0,
                y: configuration.isPressed ? 3 : 0
            )
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}
