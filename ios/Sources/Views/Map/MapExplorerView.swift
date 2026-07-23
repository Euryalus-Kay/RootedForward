import SwiftUI

// ------------------------------------------------------------------
// The map room: the engraved map, full screen, with pinch zoom, pan,
// and double-tap, like leaning over a survey table. Marker taps
// still jump the tour to that stop.
// ------------------------------------------------------------------

struct MapExplorerView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var location: LocationService
    @Environment(\.dismiss) private var dismiss

    let currentIndex: Int
    let thumbs: [String: UIImage]
    let onSelectStop: (Int) -> Void

    var body: some View {
        VStack(spacing: 0) {
            header
            ZoomPanContainer(
                contentAspect: content.geometry.viewBox.w / content.geometry.viewBox.h,
                maxScale: 6,
                doubleTapScale: 2.6
            ) {
                WalkMapCanvas(
                    geometry: content.geometry,
                    projection: content.projection,
                    stops: content.tour.stops,
                    route: content.tour.route,
                    currentIndex: currentIndex,
                    visited: progress.visited,
                    thumbs: thumbs,
                    userPoint: userPoint,
                    onTapStop: { index in
                        Haptics.tap()
                        onSelectStop(index)
                    }
                )
                .background(RF.cream)
            }
            .background(RF.creamDark.opacity(0.5))
            .clipped()

            footer
        }
        .background(RF.cream.ignoresSafeArea())
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Hyde Park")
                    .font(RF.display(22, weight: 600))
                    .foregroundStyle(RF.ink)
                Text("\(content.tour.distanceMiles, specifier: "%.1f") miles · \(content.tour.stops.count) stops")
                    .font(RF.display(13, weight: 400, italic: true))
                    .foregroundStyle(RF.warmGray)
            }
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
            .accessibilityIdentifier("explorer-done")
        }
        .padding(.horizontal, 18)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    private var footer: some View {
        HStack(spacing: 8) {
            Image(systemName: "hand.pinch")
                .font(.system(size: 13))
            Text("Pinch to zoom, drag to pan, double-tap to reset. Tap a stop to jump there.")
                .font(RF.body(12.5))
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(RF.warmGray)
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .overlay(alignment: .top) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    private var userPoint: CGPoint? {
        guard let loc = location.location else { return nil }
        let lat = loc.coordinate.latitude
        let lng = loc.coordinate.longitude
        guard content.projection.isNearFrame(lat: lat, lng: lng, padMeters: 400) else { return nil }
        return content.projection.point(lat: lat, lng: lng)
    }
}
