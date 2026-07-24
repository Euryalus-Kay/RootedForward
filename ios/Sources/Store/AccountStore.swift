import Foundation
import Security
import UIKit
import AuthenticationServices

// ------------------------------------------------------------------
// Optional sign-in with a rooted-forward.org account. Talks to the
// site's Supabase auth REST endpoints with the same public URL and
// anon key the website ships in its own JavaScript (safe to embed;
// row security lives server-side), so an account made on the site
// and one made here are the same account in the same database.
// Email and password, or Google through the same Supabase OAuth the
// site uses. Account deletion calls the site's /api/user/delete.
// Tokens live in the keychain.
// ------------------------------------------------------------------

struct AccountProfile: Codable, Equatable {
    let id: String
    let email: String
    let fullName: String?
}

@MainActor
final class AccountStore: NSObject, ObservableObject {
    @Published private(set) var profile: AccountProfile?
    @Published private(set) var isBusy = false
    @Published var errorMessage: String?

    /// Held for the life of the browser sheet; releasing it cancels
    /// the sign-in mid-flight.
    private var oauthSession: ASWebAuthenticationSession?
    /// Registered in Info.plist and allow-listed in Supabase.
    private static let callbackScheme = "rootedforward"
    private static let callbackURL = "rootedforward://auth-callback"

    private static let supabaseURL = URL(string: "https://ytiwmjnoeovhwyikyjnm.supabase.co")!
    private static let anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aXdtam5vZW92aHd5aWt5am5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMTcxNTAsImV4cCI6MjA5MTc5MzE1MH0.YK2hFRZ7cHPU4yodFtlY5sfuzXmFH0Tbig_Ybgsy-Sc"
    private static let deleteEndpoint = URL(string: "https://rooted-forward.org/api/user/delete")!

    private struct TokenResponse: Codable {
        let accessToken: String
        let refreshToken: String
        enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
        }
    }

    private struct AuthUser: Codable {
        struct Metadata: Codable {
            let fullName: String?
            enum CodingKeys: String, CodingKey {
                case fullName = "full_name"
            }
        }
        let id: String
        let email: String?
        let userMetadata: Metadata?
        enum CodingKeys: String, CodingKey {
            case id, email
            case userMetadata = "user_metadata"
        }
    }

    var isSignedIn: Bool { profile != nil }

    override init() {
        super.init()
        // Keychain items survive an uninstall; a fresh install should
        // not resurrect the previous owner's session.
        if !UserDefaults.standard.bool(forKey: "rf-has-launched") {
            UserDefaults.standard.set(true, forKey: "rf-has-launched")
            Keychain.delete(key: "rf-access-token")
            Keychain.delete(key: "rf-refresh-token")
            Keychain.delete(key: "rf-profile")
        }
        if let stored = Keychain.read(key: "rf-profile"),
           let decoded = try? JSONDecoder().decode(AccountProfile.self, from: stored) {
            profile = decoded
        }
    }

    // MARK: - Sign in / out

    func signIn(email: String, password: String) async {
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }

        var request = URLRequest(url: Self.supabaseURL.appendingPathComponent("auth/v1/token"))
        request.url = request.url?.appending(queryItems: [URLQueryItem(name: "grant_type", value: "password")])
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "email": email,
            "password": password,
        ])

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse else {
            errorMessage = "Could not reach the sign-in service. Check your connection."
            return
        }
        guard http.statusCode == 200,
              let tokens = try? JSONDecoder().decode(TokenResponse.self, from: data) else {
            errorMessage = "That email and password did not match an account."
            return
        }

        Keychain.write(key: "rf-access-token", data: Data(tokens.accessToken.utf8))
        Keychain.write(key: "rf-refresh-token", data: Data(tokens.refreshToken.utf8))
        await loadProfile(accessToken: tokens.accessToken)
        // A half-open session (tokens stored, profile load failed)
        // would look signed out while holding live credentials.
        if profile == nil {
            Keychain.delete(key: "rf-access-token")
            Keychain.delete(key: "rf-refresh-token")
        }
    }

    // MARK: - Google

    /// The same Supabase OAuth flow the website runs, in a system
    /// browser sheet. Supabase hands the session back on the app's
    /// own URL scheme, so the account is the same account and the
    /// row is the same row.
    func signInWithGoogle() async {
        errorMessage = nil
        var components = URLComponents(
            url: Self.supabaseURL.appendingPathComponent("auth/v1/authorize"),
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: Self.callbackURL),
        ]
        guard let url = components?.url else {
            errorMessage = "Could not start Google sign-in."
            return
        }

        isBusy = true
        defer { isBusy = false }

        let callback: URL? = await withCheckedContinuation { continuation in
            var resumed = false
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: Self.callbackScheme
            ) { returned, _ in
                guard !resumed else { return }
                resumed = true
                continuation.resume(returning: returned)
            }
            session.presentationContextProvider = self
            // A shared cookie jar would silently reuse whichever
            // Google account Safari is already signed into.
            session.prefersEphemeralWebBrowserSession = true
            oauthSession = session
            if !session.start() {
                guard !resumed else { return }
                resumed = true
                continuation.resume(returning: nil)
            }
        }
        oauthSession = nil

        guard let callback else {
            // A cancel is a decision, not a failure worth a message.
            return
        }
        guard let tokens = Self.tokens(fromCallback: callback) else {
            errorMessage = "Google sign-in did not complete. Please try again."
            return
        }

        Keychain.write(key: "rf-access-token", data: Data(tokens.access.utf8))
        Keychain.write(key: "rf-refresh-token", data: Data(tokens.refresh.utf8))
        await loadProfile(accessToken: tokens.access)
        if profile == nil {
            Keychain.delete(key: "rf-access-token")
            Keychain.delete(key: "rf-refresh-token")
        }
    }

    /// Supabase returns the session in the URL fragment, the same way
    /// it does for the website's callback route.
    private static func tokens(fromCallback url: URL) -> (access: String, refresh: String)? {
        guard let fragment = URLComponents(url: url, resolvingAgainstBaseURL: false)?.fragment else {
            return nil
        }
        var pairs: [String: String] = [:]
        for part in fragment.split(separator: "&") {
            let halves = part.split(separator: "=", maxSplits: 1)
            guard halves.count == 2 else { continue }
            pairs[String(halves[0])] = String(halves[1]).removingPercentEncoding
        }
        guard let access = pairs["access_token"], let refresh = pairs["refresh_token"] else {
            return nil
        }
        return (access, refresh)
    }

    /// Exchanges the stored refresh token for a fresh session.
    /// Supabase rotates refresh tokens, so both come back new.
    private func refreshTokens() async -> String? {
        guard let stored = Keychain.read(key: "rf-refresh-token"),
              let refreshToken = String(data: stored, encoding: .utf8) else {
            return nil
        }
        var request = URLRequest(url: Self.supabaseURL.appendingPathComponent("auth/v1/token"))
        request.url = request.url?.appending(queryItems: [URLQueryItem(name: "grant_type", value: "refresh_token")])
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "refresh_token": refreshToken
        ])
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let tokens = try? JSONDecoder().decode(TokenResponse.self, from: data) else {
            return nil
        }
        Keychain.write(key: "rf-access-token", data: Data(tokens.accessToken.utf8))
        Keychain.write(key: "rf-refresh-token", data: Data(tokens.refreshToken.utf8))
        return tokens.accessToken
    }

    private func loadProfile(accessToken: String) async {
        var request = URLRequest(url: Self.supabaseURL.appendingPathComponent("auth/v1/user"))
        request.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              let user = try? JSONDecoder().decode(AuthUser.self, from: data) else {
            errorMessage = "Signed in, but loading your profile failed."
            return
        }
        let loaded = AccountProfile(
            id: user.id,
            email: user.email ?? "",
            fullName: user.userMetadata?.fullName
        )
        profile = loaded
        if let encoded = try? JSONEncoder().encode(loaded) {
            Keychain.write(key: "rf-profile", data: encoded)
        }
    }

    func signOut() {
        // Revoke the server-side session too; best effort, the local
        // sign-out must not wait on the network.
        if let tokenData = Keychain.read(key: "rf-access-token"),
           let token = String(data: tokenData, encoding: .utf8) {
            var request = URLRequest(url: Self.supabaseURL.appendingPathComponent("auth/v1/logout"))
            request.httpMethod = "POST"
            request.setValue(Self.anonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            Task.detached {
                _ = try? await URLSession.shared.data(for: request)
            }
        }
        profile = nil
        errorMessage = nil
        Keychain.delete(key: "rf-access-token")
        Keychain.delete(key: "rf-refresh-token")
        Keychain.delete(key: "rf-profile")
    }

    // MARK: - Deletion (App Store guideline 5.1.1)

    /// Permanently deletes the account through the site. Returns true
    /// on success. Access tokens expire after about an hour, so a
    /// 401 gets one retry with a refreshed token.
    func deleteAccount() async -> Bool {
        guard let tokenData = Keychain.read(key: "rf-access-token"),
              let token = String(data: tokenData, encoding: .utf8) else {
            errorMessage = "Your session expired. Sign in again, then delete."
            signOut()
            return false
        }
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }

        var status = await requestDelete(token: token)
        if status == 401 {
            if let fresh = await refreshTokens() {
                status = await requestDelete(token: fresh)
            } else {
                errorMessage = "Your session expired. Sign in again, then delete."
                signOut()
                return false
            }
        }
        guard status == 200 else {
            errorMessage = "Deleting the account failed. Try again, or email contact@rooted-forward.org."
            return false
        }
        signOut()
        return true
    }

    /// Returns the HTTP status, or 0 when the request never landed.
    private func requestDelete(token: String) async -> Int {
        var request = URLRequest(url: Self.deleteEndpoint)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        guard let (_, response) = try? await URLSession.shared.data(for: request) else {
            return 0
        }
        return (response as? HTTPURLResponse)?.statusCode ?? 0
    }
}

// MARK: - Where the sign-in sheet hangs from

extension AccountStore: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            let scene = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .first { $0.activationState == .foregroundActive }
            return scene?.keyWindow ?? ASPresentationAnchor()
        }
    }
}

// MARK: - Minimal keychain wrapper

enum Keychain {
    private static func query(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "org.rootedforward.walk",
            kSecAttrAccount as String: key,
        ]
    }

    static func write(key: String, data: Data) {
        var add = query(for: key)
        SecItemDelete(add as CFDictionary)
        add[kSecValueData as String] = data
        SecItemAdd(add as CFDictionary, nil)
    }

    static func read(key: String) -> Data? {
        var get = query(for: key)
        get[kSecReturnData as String] = true
        get[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: AnyObject?
        guard SecItemCopyMatching(get as CFDictionary, &result) == errSecSuccess else {
            return nil
        }
        return result as? Data
    }

    static func delete(key: String) {
        SecItemDelete(query(for: key) as CFDictionary)
    }
}
