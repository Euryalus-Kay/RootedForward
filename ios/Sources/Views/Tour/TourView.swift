import SwiftUI

// ------------------------------------------------------------------
// The tour itself, the native version of the site's focus mode.
// Intro essay first (when starting fresh), then one stop per page
// with swipe or prev/next navigation, the floating Map pill, and the
// paper transport bar with the audio controls.
// ------------------------------------------------------------------

struct TourView: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var progress: ProgressStore
    @EnvironmentObject private var location: LocationService
    @Environment(\.dismiss) private var dismiss

    @State private var index: Int
    @State private var showMap = false

    init(startAt: Int) {
        _index = State(initialValue: startAt)
    }

    private var stops: [WalkStop] { content.tour.stops }

    var body: some View {
        ZStack(alignment: .bottom) {
            VStack(spacing: 0) {
                topBar
                TabView(selection: $index) {
                    ForEach(Array(stops.enumerated()), id: \.element.id) { i, stop in
                        StopPage(
                            stop: stop,
                            isLast: i == stops.count - 1,
                            goNext: i < stops.count - 1 ? { withAnimation { index = i + 1 } } : nil,
                            goPrevious: i > 0 ? { withAnimation { index = i - 1 } } : nil
                        )
                        .tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .ignoresSafeArea(edges: .bottom)
            }
            .background(RF.cream)

            VStack(alignment: .trailing, spacing: 12) {
                nearbyHint
                mapPill
                TransportBar(
                    stop: stops[index],
                    canGoPrevious: index > 0,
                    canGoNext: index < stops.count - 1,
                    goPrevious: { withAnimation { index = max(0, index - 1) } },
                    goNext: { withAnimation { index = min(stops.count - 1, index + 1) } }
                )
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 6)
        }
        .background(RF.cream.ignoresSafeArea())
        .onChange(of: index) { _, newIndex in
            Haptics.tap()
            progress.setLastIndex(newIndex)
        }
        .onAppear {
            progress.setLastIndex(index)
            location.requestAndStartIfAuthorized()
        }
        .sheet(isPresented: $showMap) {
            MapSheetView(currentIndex: index) { tapped in
                index = tapped
                showMap = false
            }
        }
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                // No chevron: this is a modal dismissal, not a pop,
                // so promising a back gesture would be a lie.
                Text("Exit")
                    .font(RF.body(16, weight: 500))
                    .foregroundStyle(RF.ink.opacity(0.7))
            }
            .accessibilityIdentifier("tour-exit")

            Spacer()

            VStack(spacing: 5) {
                Text("Stop \(index + 1) of \(stops.count)")
                    .font(RF.body(14, weight: 600))
                    .foregroundStyle(RF.ink.opacity(0.8))
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(RF.border)
                        Capsule()
                            .fill(RF.rust)
                            .frame(width: geo.size.width * CGFloat(index + 1) / CGFloat(stops.count))
                    }
                }
                .frame(width: 132, height: 3)
            }

            Spacer()

            ShareLink(item: URL(string: "https://rooted-forward.org/tours")!) {
                HStack(spacing: 5) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 13, weight: .medium))
                    Text("Share")
                        .font(RF.body(15, weight: 500))
                }
                .foregroundStyle(RF.ink.opacity(0.8))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(.white)
                .overlay(Rectangle().strokeBorder(RF.border, lineWidth: 1))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(RF.cream)
        .overlay(alignment: .bottom) {
            Rectangle().fill(RF.border).frame(height: 1)
        }
    }

    // MARK: - Map pill

    private var mapPill: some View {
        Button {
            showMap = true
        } label: {
            HStack(spacing: 7) {
                Image(systemName: "map")
                    .font(.system(size: 14, weight: .semibold))
                Text("Map")
                    .font(RF.body(16, weight: 600))
            }
            .foregroundStyle(RF.cream)
            .padding(.horizontal, 18)
            .padding(.vertical, 11)
            .background(Capsule().fill(RF.forest))
            .background(
                Capsule().fill(RF.ink.opacity(0.25)).offset(x: 3, y: 3)
            )
        }
        .accessibilityIdentifier("tour-map")
    }

    // MARK: - Nearby hint

    @ViewBuilder
    private var nearbyHint: some View {
        if let near = location.nearestStop(in: content.tour),
           near.meters < 60,
           near.stop.id != stops[index].id {
            Button {
                if let i = stops.firstIndex(where: { $0.id == near.stop.id }) {
                    withAnimation { index = i }
                }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "location.fill")
                        .font(.system(size: 11, weight: .semibold))
                    Text("You are near stop \(near.stop.number). Jump there")
                        .font(RF.body(13, weight: 600))
                }
                .foregroundStyle(RF.forest)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(Capsule().fill(.white))
                .overlay(Capsule().strokeBorder(RF.forest.opacity(0.35), lineWidth: 1))
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
    }

}

/// The paper transport bar. Isolated so the audio engine's frequent
/// progress updates re-render only this view, not the whole tour.
struct TransportBar: View {
    @EnvironmentObject private var audio: AudioEngine
    let stop: WalkStop
    let canGoPrevious: Bool
    let canGoNext: Bool
    let goPrevious: () -> Void
    let goNext: () -> Void

    var body: some View {
        // Hidden until narration first starts, like a mini player;
        // the stop pages carry their own play control before that.
        ZStack {
            if audio.currentStopID != nil {
                bar.transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeOut(duration: 0.3), value: audio.currentStopID != nil)
    }

    private var bar: some View {
        let isCurrent = audio.isCurrent(stop.id)
        let fraction = isCurrent && audio.duration > 0
            ? min(1, audio.currentTime / audio.duration) : 0

        return VStack(spacing: 0) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle().fill(RF.border.opacity(0.6))
                    Rectangle()
                        .fill(RF.rust)
                        .frame(width: geo.size.width * fraction)
                }
            }
            .frame(height: 2)

            HStack(spacing: 8) {
                Text("\(stop.number). \(stop.title)")
                    .font(RF.body(15, weight: 600))
                    .foregroundStyle(RF.ink)
                    .lineLimit(1)
                Spacer(minLength: 4)

                Button(action: goPrevious) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(canGoPrevious ? RF.ink.opacity(0.7) : RF.border)
                        .frame(width: 38, height: 44)
                }
                .disabled(!canGoPrevious)
                .accessibilityLabel("Previous stop")
                .accessibilityIdentifier("transport-prev")

                PlayButton(stop: stop, size: 46)

                Button(action: goNext) {
                    Image(systemName: "chevron.right")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(canGoNext ? RF.ink.opacity(0.7) : RF.border)
                        .frame(width: 38, height: 44)
                }
                .disabled(!canGoNext)
                .accessibilityLabel("Next stop")
                .accessibilityIdentifier("transport-next")
            }
            .padding(.leading, 14)
            .padding(.trailing, 6)
            .padding(.vertical, 5)
        }
        .background(RF.paper)
        .overlay(Rectangle().strokeBorder(RF.ink.opacity(0.22), lineWidth: 1))
        .background(Rectangle().fill(RF.forest.opacity(0.14)).offset(x: 4, y: 4))
    }
}

/// The rust play/pause circle bound to one stop's narration.
struct PlayButton: View {
    @EnvironmentObject private var content: ContentStore
    @EnvironmentObject private var audio: AudioEngine
    let stop: WalkStop
    var size: CGFloat = 46

    var body: some View {
        let playingThis = audio.isCurrent(stop.id) && audio.isPlaying
        Button {
            Haptics.press()
            Task {
                let thumbPath = ContentStore.thumbPath(
                    for: (stop.nowImage ?? stop.images.first)?.src ?? ""
                )
                let artwork = await content.image(for: thumbPath)
                audio.toggle(stop: stop, url: content.mediaURL(for: stop.audioSrc), artwork: artwork)
            }
        } label: {
            Image(systemName: playingThis ? "pause.fill" : "play.fill")
                .font(.system(size: size * 0.36, weight: .bold))
                .foregroundStyle(.white)
                .offset(x: playingThis ? 0 : size * 0.03)
                .frame(width: size, height: size)
                .background(Circle().fill(RF.rust))
        }
        .accessibilityLabel(playingThis ? "Pause stop \(stop.number)" : "Play stop \(stop.number), \(stop.title)")
        .accessibilityIdentifier("play-stop-\(stop.number)")
    }
}

extension LocationService {
    /// Starts updates only when permission already exists; the tour
    /// never prompts on its own, only the map's Find me button does.
    func requestAndStartIfAuthorized() {
        if status == .authorizedWhenInUse || status == .authorizedAlways {
            start()
        }
    }
}
