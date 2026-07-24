import Foundation
import CoreLocation

// ------------------------------------------------------------------
// When-in-use location, requested only when the walker taps "Find me
// on the map". The position is projected onto the tour map and used
// for near-a-stop hints; it never leaves the device, matching the
// privacy policy and the Info.plist usage string.
// ------------------------------------------------------------------

@MainActor
final class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published private(set) var status: CLAuthorizationStatus = .notDetermined
    @Published private(set) var location: CLLocation?
    @Published private(set) var isUpdating = false

    private let manager = CLLocationManager()

    // Set while a screen actually consumes position updates; the
    // authorization callback fires at launch for previously granted
    // users and must not start GPS on its own.
    private var wantsUpdates = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
        status = manager.authorizationStatus
    }

    var isDenied: Bool {
        status == .denied || status == .restricted
    }

    func requestAndStart() {
        wantsUpdates = true
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            start()
        default:
            break
        }
    }

    func start() {
        wantsUpdates = true
        guard !isUpdating else { return }
        isUpdating = true
        manager.startUpdatingLocation()
    }

    func stopUpdates() {
        wantsUpdates = false
        isUpdating = false
        manager.stopUpdatingLocation()
    }

    /// The nearest stop and its distance in meters.
    func nearestStop(in tour: WalkTour) -> (stop: WalkStop, meters: Double)? {
        guard let location else { return nil }
        let lat = location.coordinate.latitude
        let lng = location.coordinate.longitude
        return tour.stops
            .map { ($0, haversineMeters(lat, lng, $0.lat, $0.lng)) }
            .min { $0.1 < $1.1 }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let newStatus = manager.authorizationStatus
        Task { @MainActor in
            self.status = newStatus
            if newStatus == .authorizedWhenInUse || newStatus == .authorizedAlways,
               self.wantsUpdates {
                self.start()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let latest = locations.last else { return }
        Task { @MainActor in
            self.location = latest
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        // Position simply stays unknown; the map hides the dot.
    }
}
