import SwiftUI

// ------------------------------------------------------------------
// Settings: the optional rooted-forward.org account (sign in, sign
// out, permanent deletion per App Store guideline 5.1.1), tour
// progress reset, and the about links. Everything works without an
// account; the copy says so plainly.
// ------------------------------------------------------------------

struct SettingsView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var account: AccountStore
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var confirmDelete = false
    @State private var confirmReset = false
    @State private var deleteDone = false

    /// Sign-in is hidden at the owner's request (July 2026). It did
    /// nothing a walker could feel, since the whole tour works
    /// without an account. The form, the Google flow and AccountStore
    /// stay wired, so bringing it back is flipping this to true.
    /// Nothing else in the app reads the account.
    private static let showsAccount = false

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if Self.showsAccount {
                        accountPlate
                    }
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
            "Delete your account permanently?",
            isPresented: $confirmDelete,
            titleVisibility: .visible
        ) {
            Button("Delete account", role: .destructive) {
                Task {
                    if await account.deleteAccount() {
                        deleteDone = true
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This removes your profile and sign-in from rooted-forward.org. It cannot be undone.")
        }
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
        .alert("Account deleted", isPresented: $deleteDone) {
            Button("OK") {}
        } message: {
            Text("Your account and profile are gone. Thanks for walking with us.")
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

    // MARK: - Account

    private var accountPlate: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your account")
                .font(RF.display(17, weight: 600))
                .foregroundStyle(RF.forest)
                .accessibilityAddTraits(.isHeader)

            if let profile = account.profile {
                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.fullName ?? "Signed in")
                        .font(RF.display(19, weight: 600))
                        .foregroundStyle(RF.forest)
                    Text(profile.email)
                        .font(RF.body(14.5))
                        .foregroundStyle(RF.warmGrayDark)
                }
                Text("Your account connects comments and policy signatures on rooted-forward.org. Tour progress stays on this phone either way.")
                    .font(RF.body(13.5))
                    .foregroundStyle(RF.ink.opacity(0.65))
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 18) {
                    Button {
                        account.signOut()
                    } label: {
                        Text("Sign out")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.forest)
                            .underline()
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    Button {
                        confirmDelete = true
                    } label: {
                        Text("Delete account")
                            .font(RF.body(15, weight: 600))
                            .foregroundStyle(RF.plateRed)
                            .underline()
                            .frame(minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .accessibilityIdentifier("delete-account")
                }
                .padding(.top, 4)

                // Deletion failures land here, while still signed in.
                if let message = account.errorMessage {
                    Text(message)
                        .font(RF.body(13.5))
                        .foregroundStyle(RF.plateRed)
                        .fixedSize(horizontal: false, vertical: true)
                }
            } else {
                Text("Optional. The whole tour works without one. Signing in connects the account you use for comments and policy signatures on rooted-forward.org.")
                    .font(RF.body(13.5))
                    .foregroundStyle(RF.ink.opacity(0.65))
                    .lineSpacing(4)
                    .fixedSize(horizontal: false, vertical: true)

                // Same Supabase project the website signs into, so
                // one Google account is one account either way.
                Button {
                    Task { await account.signInWithGoogle() }
                } label: {
                    HStack(spacing: 9) {
                        GoogleMark()
                        Text("Continue with Google")
                            .font(RF.body(15.5, weight: 600))
                            .foregroundStyle(RF.ink.opacity(0.85))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(.white)
                    .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.22), lineWidth: 1))
                    .background(Rectangle().fill(RF.ink.opacity(0.16)).offset(x: 3, y: 3))
                    .contentShape(Rectangle())
                }
                .buttonStyle(PressablePlateStyle())
                .disabled(account.isBusy)
                .accessibilityIdentifier("sign-in-google")

                HStack(spacing: 10) {
                    Rectangle().fill(RF.border).frame(height: 1)
                    Text("or")
                        .font(RF.body(13))
                        .foregroundStyle(RF.warmGrayDark)
                    Rectangle().fill(RF.border).frame(height: 1)
                }

                VStack(spacing: 10) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(12)
                        .background(.white)
                        .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
                        .accessibilityIdentifier("email-field")
                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding(12)
                        .background(.white)
                        .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
                        .accessibilityIdentifier("password-field")
                }
                .font(RF.body(15.5))

                if let message = account.errorMessage {
                    Text(message)
                        .font(RF.body(13.5))
                        .foregroundStyle(RF.plateRed)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: 16) {
                    Button {
                        Task {
                            await account.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
                            if account.isSignedIn {
                                password = ""
                            }
                        }
                    } label: {
                        HStack(spacing: 8) {
                            if account.isBusy {
                                ProgressView().tint(.white)
                            }
                            Text("Sign in")
                        }
                    }
                    .buttonStyle(HardShadowButtonStyle())
                    .disabled(account.isBusy || email.isEmpty || password.isEmpty)
                    .accessibilityIdentifier("sign-in")

                    Link(destination: URL(string: "https://rooted-forward.org/auth/signup")!) {
                        HStack(spacing: 4) {
                            Text("Create one")
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .font(RF.body(14, weight: 600))
                        .foregroundStyle(RF.forest)
                        .underline()
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .plate()
        // Sign-in and deletion failures speak, not just render.
        .onChange(of: account.errorMessage) { _, message in
            if let message {
                UIAccessibility.post(notification: .announcement, argument: message)
            }
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

/// Google's four-color G, drawn rather than bundled so the app keeps
/// shipping without an image asset for it.
private struct GoogleMark: View {
    var body: some View {
        Canvas { context, size in
            let r = min(size.width, size.height) / 2
            let c = CGPoint(x: size.width / 2, y: size.height / 2)
            let inner = r * 0.42
            let arcs: [(start: Double, end: Double, color: Color)] = [
                (-25, 90, Color(rfHex: 0x4285F4)),   // blue, right
                (90, 180, Color(rfHex: 0x34A853)),   // green, bottom
                (180, 260, Color(rfHex: 0xFBBC05)),  // yellow, left
                (260, 335, Color(rfHex: 0xEA4335)),  // red, top
            ]
            for arc in arcs {
                var path = Path()
                path.addArc(
                    center: c, radius: (r + inner) / 2,
                    startAngle: .degrees(arc.start), endAngle: .degrees(arc.end),
                    clockwise: false
                )
                context.stroke(
                    path,
                    with: .color(arc.color),
                    style: StrokeStyle(lineWidth: r - inner)
                )
            }
            // The bar of the G, reaching in from the right
            context.fill(
                Path(CGRect(x: c.x, y: c.y - (r - inner) / 2, width: r, height: r - inner)),
                with: .color(Color(rfHex: 0x4285F4))
            )
        }
        .frame(width: 17, height: 17)
        .accessibilityHidden(true)
    }
}
